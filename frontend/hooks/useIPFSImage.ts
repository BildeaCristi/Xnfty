import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ImagePreloadService } from '@/services/imagePreloadService';

interface UseIPFSImageOptions {
  quality?: 'low' | 'medium' | 'high';
  timeout?: number;
}

interface UseIPFSImageResult {
  texture: THREE.Texture | null;
  loading: boolean;
  error: string | null;
  progress: number;
  originalUrl: string | null;
  resolvedUrl: string | null;
}

export function useIPFSImage(
  imageUri: string | undefined,
  options: UseIPFSImageOptions = {}
): UseIPFSImageResult {
  const { 
    quality = 'high', 
    timeout = 3000 
  } = options;
  
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Create texture material with proper settings
  const createTexture = (image: HTMLImageElement): THREE.Texture => {
    const newTexture = new THREE.Texture(image);
    newTexture.needsUpdate = true;
    newTexture.colorSpace = THREE.SRGBColorSpace;
    
    // Set quality-based texture parameters
    switch (quality) {
      case 'high':
        newTexture.minFilter = THREE.LinearMipmapLinearFilter;
        newTexture.magFilter = THREE.LinearFilter;
        newTexture.anisotropy = 16;
        newTexture.generateMipmaps = true;
        break;
      case 'medium':
        newTexture.minFilter = THREE.LinearMipmapNearestFilter;
        newTexture.magFilter = THREE.LinearFilter;
        newTexture.anisotropy = 4;
        newTexture.generateMipmaps = true;
        break;
      case 'low':
        newTexture.minFilter = THREE.NearestFilter;
        newTexture.magFilter = THREE.NearestFilter;
        newTexture.anisotropy = 1;
        newTexture.generateMipmaps = false;
        break;
    }
    
    return newTexture;
  };

  // Load image from URL and create texture
  const loadImageFromUrl = async (url: string, signal: AbortSignal): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Request aborted'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (signal.aborted) {
          reject(new Error('Request aborted'));
          return;
        }
        try {
          const newTexture = createTexture(img);
          resolve(newTexture);
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image from ${url}`));
      };
      
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading image from ${url}`));
      }, timeout);
      
      const cleanup = () => {
        clearTimeout(timeoutId);
      };
      
      img.addEventListener('load', cleanup, { once: true });
      img.addEventListener('error', cleanup, { once: true });
      
      img.src = url;
      
      signal.addEventListener('abort', () => {
        cleanup();
        img.src = '';
        reject(new Error('Request aborted'));
      });
    });
  };

  // Load fallback placeholder image
  const loadFallbackImage = async (): Promise<THREE.Texture> => {
    const placeholderImg = new Image();
    placeholderImg.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      placeholderImg.onload = () => {
        const fallbackTexture = createTexture(placeholderImg);
        resolve(fallbackTexture);
      };
      
      placeholderImg.onerror = () => {
        reject(new Error('Failed to load fallback image'));
      };
      
      placeholderImg.src = '/placeholder-nft.png';
    });
  };

  // Main effect to handle image loading
  useEffect(() => {
    if (!imageUri) {
      setTexture(null);
      setLoading(false);
      setError(null);
      setProgress(0);
      setOriginalUrl(null);
      setResolvedUrl(null);
      return;
    }

    // Cleanup previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Cleanup previous texture
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }

    // Reset state
    setLoading(true);
    setError(null);
    setProgress(0);
    setOriginalUrl(imageUri);
    setResolvedUrl(null);

    const loadImage = async () => {
      try {
        const signal = abortControllerRef.current!.signal;
        
        // Start preloading with the fast service
        setProgress(25);
        const preloadSuccess = await ImagePreloadService.preloadImage(imageUri, { timeout });
        
        if (signal.aborted) return;
        
        if (!preloadSuccess) {
          throw new Error('Failed to preload image');
        }
        
        setProgress(50);
        
        // Get the best gateway URL from the service
        const bestUrl = ImagePreloadService.getBestGatewayUrl(imageUri);
        setProgress(75);
        
        // Create texture from the preloaded image
        const newTexture = await loadImageFromUrl(bestUrl, signal);
        
        if (signal.aborted) return;
        
        textureRef.current = newTexture;
        setTexture(newTexture);
        setResolvedUrl(bestUrl);
        setProgress(100);
        setLoading(false);
        
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        
        // Try to load fallback image
        try {
          const fallbackTexture = await loadFallbackImage();
          textureRef.current = fallbackTexture;
          setTexture(fallbackTexture);
          setResolvedUrl('/placeholder-nft.png');
        } catch (fallbackErr) {
          // Fallback failed, texture remains null
        }
        
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [imageUri, quality, timeout]);

  return {
    texture,
    loading,
    error,
    progress,
    originalUrl,
    resolvedUrl,
  };
} 