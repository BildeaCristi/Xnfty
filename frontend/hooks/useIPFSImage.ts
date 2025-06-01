import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// IPFS gateway fallbacks
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
];

interface UseIPFSImageOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  maxRetries?: number;
  retryDelay?: number;
}

export function useIPFSImage(
  imageUri: string | undefined,
  options: UseIPFSImageOptions = {}
) {
  const { quality = 'high', maxRetries = 3, retryDelay = 1000 } = options;
  
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Convert IPFS URI to HTTP gateway URL
  const convertIPFSUrl = (uri: string, gatewayIndex: number = 0): string => {
    if (!uri) return '/placeholder-nft.png';
    
    // Handle IPFS protocol
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '');
      return IPFS_GATEWAYS[gatewayIndex] + cid;
    }
    
    // Handle Pinata URLs with CORS issues
    if (uri.includes('mypinata.cloud')) {
      const match = uri.match(/\/ipfs\/(.+)$/);
      if (match && match[1]) {
        return IPFS_GATEWAYS[gatewayIndex] + match[1];
      }
    }
    
    // Return as-is for other URLs
    return uri;
  };

  // Load image with retry logic
  const loadImageWithRetry = async (
    url: string,
    gatewayIndex: number = 0,
    retryCount: number = 0
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        img.src = '';
        reject(new Error('Image load timeout'));
      }, 30000); // 30 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = async () => {
        clearTimeout(timeout);
        
        // Try next gateway
        if (gatewayIndex < IPFS_GATEWAYS.length - 1) {
          console.log(`Gateway ${gatewayIndex} failed, trying next...`);
          try {
            const nextUrl = convertIPFSUrl(imageUri!, gatewayIndex + 1);
            const result = await loadImageWithRetry(nextUrl, gatewayIndex + 1, retryCount);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        }
        // Retry same gateway
        else if (retryCount < maxRetries) {
          console.log(`Retrying gateway ${gatewayIndex} (attempt ${retryCount + 1})...`);
          setTimeout(async () => {
            try {
              const result = await loadImageWithRetry(url, 0, retryCount + 1);
              resolve(result);
            } catch (err) {
              reject(err);
            }
          }, retryDelay * (retryCount + 1));
        } else {
          reject(new Error('All gateways failed'));
        }
      };
      
      // Track progress
      img.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      
      img.src = url;
    });
  };

  useEffect(() => {
    if (!imageUri) {
      setLoading(false);
      return;
    }

    // Cleanup previous load
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Dispose previous texture
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    const loadImage = async () => {
      try {
        const url = convertIPFSUrl(imageUri);
        console.log(`🔄 Loading NFT image: ${url}`);
        
        const img = await loadImageWithRetry(url);
        
        // Create texture
        const newTexture = new THREE.Texture(img);
        newTexture.needsUpdate = true;
        
        // Set quality-based texture parameters
        switch (quality) {
          case 'ultra':
            newTexture.minFilter = THREE.LinearMipmapLinearFilter;
            newTexture.magFilter = THREE.LinearFilter;
            newTexture.anisotropy = 16;
            break;
          case 'high':
            newTexture.minFilter = THREE.LinearMipmapLinearFilter;
            newTexture.magFilter = THREE.LinearFilter;
            newTexture.anisotropy = 8;
            break;
          case 'medium':
            newTexture.minFilter = THREE.LinearMipmapNearestFilter;
            newTexture.magFilter = THREE.LinearFilter;
            newTexture.anisotropy = 4;
            break;
          case 'low':
            newTexture.minFilter = THREE.NearestFilter;
            newTexture.magFilter = THREE.NearestFilter;
            newTexture.anisotropy = 1;
            break;
        }
        
        newTexture.generateMipmaps = quality !== 'low';
        newTexture.colorSpace = THREE.SRGBColorSpace;
        
        textureRef.current = newTexture;
        setTexture(newTexture);
        setLoading(false);
        console.log(`✅ Successfully loaded NFT image`);
        
      } catch (err) {
        console.error(`❌ Failed to load NFT image:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
        setLoading(false);
        
        // Load fallback
        try {
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve, reject) => {
            fallbackImg.onload = () => resolve();
            fallbackImg.onerror = () => reject();
            fallbackImg.src = '/placeholder-nft.png';
          });
          
          const fallbackTexture = new THREE.Texture(fallbackImg);
          fallbackTexture.needsUpdate = true;
          fallbackTexture.colorSpace = THREE.SRGBColorSpace;
          
          textureRef.current = fallbackTexture;
          setTexture(fallbackTexture);
          console.log('✅ Loaded fallback image');
        } catch {
          console.error('❌ Failed to load fallback image');
        }
      }
    };

    loadImage();

    // Cleanup
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [imageUri, quality, maxRetries, retryDelay]);

  return { texture, loading, error, progress };
} 