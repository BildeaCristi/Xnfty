"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGLTF, useTexture, useFBX } from '@react-three/drei';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '@/store/sceneStore';
import * as THREE from 'three';

// Asset types
export type AssetType = 'model' | 'texture' | 'audio' | 'hdri';
export type ModelFormat = 'gltf' | 'glb' | 'fbx' | 'obj';

// Asset manifest for preloading
export interface AssetManifest {
  id: string;
  url: string;
  type: AssetType;
  format?: ModelFormat;
  preload?: boolean;
  compress?: boolean;
  optimize?: boolean;
  fallbackUrl?: string;
}

// Loading progress
export interface LoadingProgress {
  loaded: number;
  total: number;
  percent: number;
  assetId: string;
  error?: Error;
}

// Cache manager
class AssetCache {
  private static instance: AssetCache;
  private cache = new Map<string, any>();
  private sizeLimit = 500 * 1024 * 1024; // 500MB default
  private currentSize = 0;

  static getInstance() {
    if (!this.instance) {
      this.instance = new AssetCache();
    }
    return this.instance;
  }

  set(key: string, value: any, size: number) {
    // Implement LRU cache eviction if needed
    if (this.currentSize + size > this.sizeLimit) {
      this.evictOldest();
    }
    
    this.cache.set(key, { value, size, timestamp: Date.now() });
    this.currentSize += size;
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (item) {
      // Update timestamp for LRU
      item.timestamp = Date.now();
      return item.value;
    }
    return null;
  }

  has(key: string) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.currentSize = 0;
  }

  private evictOldest() {
    let oldest = Infinity;
    let oldestKey = '';
    
    this.cache.forEach((item, key) => {
      if (item.timestamp < oldest) {
        oldest = item.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      const item = this.cache.get(oldestKey);
      if (item) {
        this.currentSize -= item.size;
        this.cache.delete(oldestKey);
      }
    }
  }
}

// Custom hook for asset loading
export function useAssetLoader(manifest: AssetManifest[]) {
  const { gl } = useThree();
  const { setAssetLoading, clearAssetLoading } = useSceneStore();
  const [loadedAssets, setLoadedAssets] = useState<Map<string, any>>(new Map());
  const [progress, setProgress] = useState<Map<string, LoadingProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const cache = useRef(AssetCache.getInstance());
  const loadingRef = useRef<Set<string>>(new Set());

  // Initialize loaders
  useEffect(() => {
    // Setup DRACO loader for compressed geometry
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.preload();

    // Setup KTX2 loader for compressed textures
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('/basis/');
    ktx2Loader.detectSupport(gl);

    // Setup Meshopt decoder
    if (typeof MeshoptDecoder.ready !== 'undefined') {
      MeshoptDecoder.ready.then(() => {
        console.log('Meshopt decoder ready');
      });
    }

    return () => {
      dracoLoader.dispose();
      ktx2Loader.dispose();
    };
  }, [gl]);

  // Load single asset
  const loadAsset = useCallback(async (asset: AssetManifest) => {
    // Check cache first
    if (cache.current.has(asset.id)) {
      const cached = cache.current.get(asset.id);
      setLoadedAssets(prev => new Map(prev).set(asset.id, cached));
      return cached;
    }

    // Mark as loading
    setAssetLoading(asset.id, 'loading');
    loadingRef.current.add(asset.id);

    try {
      let loaded: any;
      
      switch (asset.type) {
        case 'model':
          loaded = await loadModel(asset);
          break;
        case 'texture':
          loaded = await loadTexture(asset);
          break;
        case 'hdri':
          loaded = await loadHDRI(asset);
          break;
        case 'audio':
          loaded = await loadAudio(asset);
          break;
        default:
          throw new Error(`Unknown asset type: ${asset.type}`);
      }

      // Optimize if requested
      if (asset.optimize && asset.type === 'model') {
        loaded = optimizeModel(loaded);
      }

      // Cache the asset
      const size = estimateAssetSize(loaded);
      cache.current.set(asset.id, loaded, size);

      // Update state
      setLoadedAssets(prev => new Map(prev).set(asset.id, loaded));
      setAssetLoading(asset.id, 'loaded');
      
      // Update progress
      setProgress(prev => {
        const newProgress = new Map(prev);
        newProgress.set(asset.id, {
          loaded: 100,
          total: 100,
          percent: 100,
          assetId: asset.id,
        });
        return newProgress;
      });

      return loaded;
    } catch (error) {
      console.error(`Failed to load asset ${asset.id}:`, error);
      
      // Try fallback URL if available
      if (asset.fallbackUrl) {
        try {
          const fallbackAsset = { ...asset, url: asset.fallbackUrl };
          return await loadAsset(fallbackAsset);
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${asset.id}:`, fallbackError);
        }
      }

      setAssetLoading(asset.id, 'error');
      setProgress(prev => {
        const newProgress = new Map(prev);
        newProgress.set(asset.id, {
          loaded: 0,
          total: 100,
          percent: 0,
          assetId: asset.id,
          error: error as Error,
        });
        return newProgress;
      });
      
      throw error;
    } finally {
      loadingRef.current.delete(asset.id);
    }
  }, [setAssetLoading]);

  // Load all assets
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      
      // Separate preload and lazy load assets
      const preloadAssets = manifest.filter(a => a.preload !== false);
      const lazyAssets = manifest.filter(a => a.preload === false);

      // Load preload assets in parallel
      const preloadPromises = preloadAssets.map(asset => loadAsset(asset));
      
      try {
        await Promise.all(preloadPromises);
      } catch (error) {
        console.error('Error loading preload assets:', error);
      }

      setIsLoading(false);

      // Load lazy assets in background
      lazyAssets.forEach(asset => {
        requestIdleCallback(() => loadAsset(asset), { timeout: 5000 });
      });
    };

    loadAll();

    return () => {
      // Cleanup loading states
      loadingRef.current.forEach(id => clearAssetLoading(id));
    };
  }, [manifest, loadAsset, clearAssetLoading]);

  return {
    assets: loadedAssets,
    progress,
    isLoading,
    getAsset: (id: string) => loadedAssets.get(id),
    reloadAsset: (id: string) => {
      const asset = manifest.find(a => a.id === id);
      if (asset) {
        cache.current.clear();
        return loadAsset(asset);
      }
    },
    clearCache: () => cache.current.clear(),
  };
}

// Model loader helper
async function loadModel(asset: AssetManifest): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    switch (asset.format) {
      case 'gltf':
      case 'glb':
        new GLTFLoader().load(
          asset.url,
          (gltf) => resolve(gltf.scene),
          undefined,
          reject
        );
        break;
      case 'fbx':
        new FBXLoader().load(
          asset.url,
          (fbx) => resolve(fbx),
          undefined,
          reject
        );
        break;
      default:
        reject(new Error(`Unsupported model format: ${asset.format}`));
    }
  });
}

// Texture loader helper
async function loadTexture(asset: AssetManifest): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      asset.url,
      (texture) => {
        // Apply compression settings
        if (asset.compress) {
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.generateMipmaps = true;
        }
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

// HDRI loader helper
async function loadHDRI(asset: AssetManifest): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      asset.url,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

// Audio loader helper
async function loadAudio(asset: AssetManifest): Promise<AudioBuffer> {
  const response = await fetch(asset.url);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
}

// Model optimization helper
function optimizeModel(model: THREE.Group): THREE.Group {
  // Merge geometries where possible
  const geometries: THREE.BufferGeometry[] = [];
  const meshes: THREE.Mesh[] = [];

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
      if (child.geometry) {
        geometries.push(child.geometry);
      }
    }
  });

  // Apply LOD where beneficial
  meshes.forEach(mesh => {
    if (mesh.geometry.attributes.position.count > 10000) {
      const lod = new THREE.LOD();
      
      // High detail
      lod.addLevel(mesh, 0);
      
      // Medium detail (simplified)
      const mediumGeometry = simplifyGeometry(mesh.geometry, 0.5);
      const mediumMesh = new THREE.Mesh(mediumGeometry, mesh.material);
      lod.addLevel(mediumMesh, 20);
      
      // Low detail
      const lowGeometry = simplifyGeometry(mesh.geometry, 0.2);
      const lowMesh = new THREE.Mesh(lowGeometry, mesh.material);
      lod.addLevel(lowMesh, 50);
      
      // Replace mesh with LOD
      mesh.parent?.add(lod);
      mesh.parent?.remove(mesh);
    }
  });

  return model;
}

// Geometry simplification helper (basic implementation)
function simplifyGeometry(geometry: THREE.BufferGeometry, ratio: number): THREE.BufferGeometry {
  // This is a placeholder - in production, use SimplifyModifier or similar
  return geometry.clone();
}

// Asset size estimation
function estimateAssetSize(asset: any): number {
  if (asset instanceof THREE.Texture) {
    return asset.image.width * asset.image.height * 4; // RGBA
  }
  if (asset instanceof THREE.Group || asset instanceof THREE.Mesh) {
    let size = 0;
    asset.traverse((child: any) => {
      if (child.geometry) {
        const attrs = child.geometry.attributes;
        Object.values(attrs).forEach((attr: any) => {
          size += attr.array.byteLength;
        });
      }
    });
    return size;
  }
  if (asset instanceof AudioBuffer) {
    return asset.length * asset.numberOfChannels * 4; // 32-bit float
  }
  return 1024 * 1024; // Default 1MB
} 