import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Enhanced IPFS gateway configuration with better fallbacks
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.filebase.io/ipfs/',
  'https://4everland.io/ipfs/',
  'https://w3s.link/ipfs/',
];

interface UseIPFSImageOptions {
  quality?: 'low' | 'medium' | 'high';
  maxRetries?: number;
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
    maxRetries = 2,
    timeout = 15000 
  } = options;
  
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Extract CID from various IPFS URL formats
  const extractCID = (url: string): string | null => {
    if (!url) return null;
    
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', '');
    }
    
    // Handle Pinata cloud URLs: https://blue-random-raven-153.mypinata.cloud/ipfs/QmXxx
    const pinataCloudMatch = url.match(/https:\/\/[^\/]+\.mypinata\.cloud\/ipfs\/(.+)$/);
    if (pinataCloudMatch && pinataCloudMatch[1]) {
      return pinataCloudMatch[1];
    }
    
    // Handle standard gateway URLs: https://gateway.domain.com/ipfs/QmXxx
    const gatewayMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)(?:\?|$|\/)/);
    if (gatewayMatch && gatewayMatch[1]) {
      return gatewayMatch[1];
    }
    
    // Handle direct CID (if just a hash is provided)
    const cidMatch = url.match(/^(Qm[a-zA-Z0-9]{44}|baf[a-zA-Z0-9]+)$/);
    if (cidMatch) {
      return cidMatch[0];
    }
    
    return null;
  };

  // Generate gateway URLs from CID
  const generateGatewayUrls = (cid: string): string[] => {
    return IPFS_GATEWAYS.map(gateway => `${gateway}${cid}`);
  };

  // Load image with comprehensive error handling and progress tracking
  const loadImageFromUrl = async (
    url: string,
    signal: AbortSignal
  ): Promise<{ texture: THREE.Texture; resolvedUrl: string }> => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Request aborted'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Handle load success
      img.onload = () => {
        if (signal.aborted) {
          reject(new Error('Request aborted'));
          return;
        }

        try {
          // Create and configure texture
          const newTexture = new THREE.Texture(img);
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
          
          resolve({ texture: newTexture, resolvedUrl: url });
        } catch (err) {
          reject(new Error(`Failed to create texture: ${err}`));
        }
      };
      
      // Handle load error
      img.onerror = () => {
        reject(new Error(`Failed to load image from ${url}`));
      };
      
      // Handle timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading image from ${url}`));
      }, timeout);
      
      // Cleanup timeout on success or error
      const cleanup = () => {
        clearTimeout(timeoutId);
      };
      
      img.addEventListener('load', cleanup, { once: true });
      img.addEventListener('error', cleanup, { once: true });
      
      // Start loading
      img.src = url;
      
      // Handle abort
      signal.addEventListener('abort', () => {
        cleanup();
        img.src = '';
        reject(new Error('Request aborted'));
      });
    });
  };

  // Try loading from multiple gateways with fallbacks
  const loadWithFallbacks = async (cid: string, signal: AbortSignal): Promise<{ texture: THREE.Texture; resolvedUrl: string }> => {
    const gatewayUrls = generateGatewayUrls(cid);
    let lastError: Error | null = null;
    
    console.log(`🔄 Attempting to load IPFS image with CID: ${cid}`);
    console.log(`📋 Trying ${gatewayUrls.length} gateways...`);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      for (let i = 0; i < gatewayUrls.length; i++) {
        if (signal.aborted) {
          throw new Error('Request aborted');
        }
        
        const url = gatewayUrls[i];
        const gatewayName = IPFS_GATEWAYS[i].replace('https://', '').replace('/ipfs/', '');
        
        try {
          console.log(`🌐 Trying gateway ${i + 1}/${gatewayUrls.length} (attempt ${attempt + 1}/${maxRetries + 1}): ${gatewayName}`);
          setProgress(Math.round(((i + attempt * gatewayUrls.length) / (gatewayUrls.length * (maxRetries + 1))) * 100));
          
          const result = await loadImageFromUrl(url, signal);
          console.log(`✅ Successfully loaded from: ${gatewayName}`);
          return result;
        } catch (err) {
          lastError = err as Error;
          console.log(`❌ Failed ${gatewayName}: ${lastError.message}`);
          
          // Add small delay between attempts to avoid overwhelming gateways
          if (i < gatewayUrls.length - 1 || attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }
    
    throw lastError || new Error('All gateways failed');
  };

  // Load fallback placeholder image
  const loadFallbackImage = async (): Promise<THREE.Texture> => {
    const placeholderImg = new Image();
    placeholderImg.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      placeholderImg.onload = () => {
        const fallbackTexture = new THREE.Texture(placeholderImg);
        fallbackTexture.needsUpdate = true;
        fallbackTexture.colorSpace = THREE.SRGBColorSpace;
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
        
        // Extract CID from the provided URL
        const cid = extractCID(imageUri);
        if (!cid) {
          throw new Error(`Invalid IPFS URL format: ${imageUri}`);
        }
        
        console.log(`🎯 Extracted CID: ${cid} from URL: ${imageUri}`);
        
        // Try loading from multiple gateways
        const { texture: newTexture, resolvedUrl: finalUrl } = await loadWithFallbacks(cid, signal);
        
        if (signal.aborted) return;
        
        textureRef.current = newTexture;
        setTexture(newTexture);
        setResolvedUrl(finalUrl);
        setProgress(100);
        setLoading(false);
        
        console.log(`🎉 Successfully loaded NFT image from: ${finalUrl}`);
        
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Don't log "Request aborted" as it's expected behavior during cleanup
        if (!errorMessage.includes('Request aborted')) {
          console.error(`❌ Failed to load NFT image: ${errorMessage}`);
        }
        
        setError(errorMessage);
        
        // Try to load fallback image
        try {
          const fallbackTexture = await loadFallbackImage();
          textureRef.current = fallbackTexture;
          setTexture(fallbackTexture);
          setResolvedUrl('/placeholder-nft.png');
          console.log('📸 Loaded fallback placeholder image');
        } catch (fallbackErr) {
          console.error('❌ Failed to load fallback image:', fallbackErr);
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
  }, [imageUri, quality, maxRetries, timeout]);

  return {
    texture,
    loading,
    error,
    progress,
    originalUrl,
    resolvedUrl,
  };
} 