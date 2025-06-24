import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureLoader, Group, Texture } from 'three';
import { ASSET_PATHS, ASSET_LOADING_CONFIG, ASSET_QUALITY_SETTINGS, MODEL_PRESETS } from '@/config/assetConfig';

interface LoadedAsset {
  model?: Group;
  texture?: Texture;
  error?: string;
  loadTime?: number;
}

interface AssetLoadOptions {
  quality?: keyof typeof ASSET_QUALITY_SETTINGS;
  timeout?: number;
  retryAttempts?: number;
}

export class AssetLoaderService {
  private static gltfLoader = new GLTFLoader();
  private static textureLoader = new TextureLoader();
  private static loadedAssets = new Map<string, LoadedAsset>();
  private static loadingPromises = new Map<string, Promise<LoadedAsset>>();

  static async loadModel(
    path: string, 
    options: AssetLoadOptions = {}
  ): Promise<Group | null> {
    const cacheKey = `model_${path}_${options.quality || 'medium'}`;
    
    // Return cached asset if available
    if (this.loadedAssets.has(cacheKey)) {
      const cached = this.loadedAssets.get(cacheKey);
      return cached?.model || null;
    }

    // Return ongoing promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      const result = await this.loadingPromises.get(cacheKey);
      return result?.model || null;
    }

    // Start new loading process
    const loadPromise = this.loadModelInternal(path, options);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedAssets.set(cacheKey, result);
      this.loadingPromises.delete(cacheKey);
      return result.model || null;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      return null;
    }
  }

  private static async loadModelInternal(
    path: string, 
    options: AssetLoadOptions
  ): Promise<LoadedAsset> {
    const startTime = Date.now();
    const timeout = options.timeout || ASSET_LOADING_CONFIG.TIMEOUT_MS;
    const retryAttempts = options.retryAttempts || ASSET_LOADING_CONFIG.RETRY_ATTEMPTS;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const gltf = await new Promise<any>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Timeout loading model: ${path}`));
          }, timeout);

          this.gltfLoader.load(
            path,
            (gltf) => {
              clearTimeout(timer);
              resolve(gltf);
            },
            undefined,
            (error) => {
              clearTimeout(timer);
              reject(error);
            }
          );
        });

        const model = gltf.scene.clone();
        this.optimizeModel(model, options.quality || 'medium');

        return {
          model,
          loadTime: Date.now() - startTime,
        };
      } catch (error) {
        if (attempt === retryAttempts) {
          return {
            error: `Failed to load model ${path}: ${error}`,
            loadTime: Date.now() - startTime,
          };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, ASSET_LOADING_CONFIG.RETRY_DELAY_MS));
      }
    }

    return { error: `Failed to load model after ${retryAttempts} attempts` };
  }

  static async loadTexture(
    path: string, 
    options: AssetLoadOptions = {}
  ): Promise<Texture | null> {
    const cacheKey = `texture_${path}_${options.quality || 'medium'}`;
    
    if (this.loadedAssets.has(cacheKey)) {
      const cached = this.loadedAssets.get(cacheKey);
      return cached?.texture || null;
    }

    if (this.loadingPromises.has(cacheKey)) {
      const result = await this.loadingPromises.get(cacheKey);
      return result?.texture || null;
    }

    const loadPromise = this.loadTextureInternal(path, options);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedAssets.set(cacheKey, result);
      this.loadingPromises.delete(cacheKey);
      return result.texture || null;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      return null;
    }
  }

  private static async loadTextureInternal(
    path: string, 
    options: AssetLoadOptions
  ): Promise<LoadedAsset> {
    const startTime = Date.now();
    const timeout = options.timeout || ASSET_LOADING_CONFIG.TIMEOUT_MS;

    try {
      const texture = await new Promise<Texture>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout loading texture: ${path}`));
        }, timeout);

        this.textureLoader.load(
          path,
          (texture) => {
            clearTimeout(timer);
            resolve(texture);
          },
          undefined,
          (error) => {
            clearTimeout(timer);
            reject(error);
          }
        );
      });

      this.optimizeTexture(texture, options.quality || 'medium');

      return {
        texture,
        loadTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        error: `Failed to load texture ${path}: ${error}`,
        loadTime: Date.now() - startTime,
      };
    }
  }

  private static optimizeModel(model: Group, quality: keyof typeof ASSET_QUALITY_SETTINGS): void {
    const settings = ASSET_QUALITY_SETTINGS[quality];
    
    model.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = quality !== 'LOW';
        child.receiveShadow = quality !== 'LOW';
        
        // Optimize geometry based on quality
        if (quality === 'LOW' && child.geometry) {
          child.geometry.computeVertexNormals();
        }
      }
    });
  }

  private static optimizeTexture(texture: Texture, quality: keyof typeof ASSET_QUALITY_SETTINGS): void {
    const settings = ASSET_QUALITY_SETTINGS[quality];
    
    texture.generateMipmaps = quality !== 'LOW';
    texture.anisotropy = quality === 'HIGH' ? 16 : quality === 'MEDIUM' ? 8 : 4;
  }

  static preloadAssets(assetPaths: string[], quality: keyof typeof ASSET_QUALITY_SETTINGS = 'MEDIUM'): void {
    const loadPromises = assetPaths.map(path => {
      if (path.endsWith('.glb') || path.endsWith('.gltf')) {
        return this.loadModel(path, { quality });
      } else {
        return this.loadTexture(path, { quality });
      }
    });

    Promise.allSettled(loadPromises).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`Preloaded ${successful}/${assetPaths.length} assets`);
    });
  }

  static clearCache(): void {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
  }

  static getLoadingStats(): { cached: number; loading: number } {
    return {
      cached: this.loadedAssets.size,
      loading: this.loadingPromises.size,
    };
  }
}
