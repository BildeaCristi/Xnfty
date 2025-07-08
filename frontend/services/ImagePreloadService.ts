import { convertIpfsUriToHttpUri } from './IpfsService';
import { NFT } from '@/types/blockchain';

export interface ImageLoadProgress {
  loaded: number;
  total: number;
  progress: number;
  loadedUrls: string[];
  failedUrls: string[];
}

export interface ImagePreloadOptions {
  timeout?: number;
  maxRetries?: number;
  quality?: 'low' | 'medium' | 'high';
}

const FAST_IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.filebase.io/ipfs/',
  'https://4everland.io/ipfs/',
  'https://w3s.link/ipfs/',
  'https://gateway.lighthouse.storage/ipfs/',
  'https://ipfs.moralis.io:2053/ipfs/',
  'https://gateway.ipfs.io/ipfs/'
];

export class ImagePreloadService {
  private static loadPromises = new Map<string, Promise<boolean>>();
  private static loadedImages = new Set<string>();
  private static failedImages = new Set<string>();
  private static imageCache = new Map<string, string>();

  private static extractIPFSHash(url: string): string | null {
    if (!url) return null;
    
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', '');
    }
    
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    if (match) {
      return match[1];
    }
    
    if (/^[a-zA-Z0-9]{46,}$/.test(url)) {
      return url;
    }
    
    return null;
  }

  private static generateGatewayUrls(hash: string): string[] {
    return FAST_IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
  }

  private static async raceImageLoad(urls: string[], timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      let loadedCount = 0;
      const totalUrls = urls.length;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Timeout loading from all gateways'));
        }
      }, timeout);

      urls.forEach((url, index) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(url);
          }
        };
        
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalUrls && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            reject(new Error('All gateways failed'));
          }
        };
        
        setTimeout(() => {
          img.src = url;
        }, index * 50);
      });
    });
  }

  static async preloadImage(
    url: string, 
    options: ImagePreloadOptions = {}
  ): Promise<boolean> {
    const { timeout = 5000 } = options;
    
    if (this.loadedImages.has(url)) {
      return true;
    }

    if (this.failedImages.has(url)) {
      return false;
    }

    if (this.loadPromises.has(url)) {
      return this.loadPromises.get(url)!;
    }

    const loadPromise = this.fastLoadImage(url, timeout);
    this.loadPromises.set(url, loadPromise);

    try {
      const result = await loadPromise;
      if (result) {
        this.loadedImages.add(url);
      } else {
        this.failedImages.add(url);
      }
      return result;
    } finally {
      this.loadPromises.delete(url);
    }
  }

  private static async fastLoadImage(url: string, timeout: number): Promise<boolean> {
    try {
      const hash = this.extractIPFSHash(url);
      if (!hash) {
        return await this.loadSingleImage(url, timeout);
      }

      if (this.imageCache.has(hash)) {
        const cachedUrl = this.imageCache.get(hash)!;
        return await this.loadSingleImage(cachedUrl, timeout);
      }

      const gatewayUrls = this.generateGatewayUrls(hash);
      const fastestUrl = await this.raceImageLoad(gatewayUrls, timeout);
      
      this.imageCache.set(hash, fastestUrl);
      return true;
    } catch (error) {
      return false;
    }
  }

  private static loadSingleImage(url: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(false);
      };

      img.src = url;
    });
  }

  static async preloadNFTImages(
    nfts: NFT[],
    options: ImagePreloadOptions = {},
    onProgress?: (progress: ImageLoadProgress) => void
  ): Promise<ImageLoadProgress> {
    const imageUrls = nfts
      .map(nft => nft.imageURI)
      .filter((uri): uri is string => Boolean(uri))
      .map(uri => convertIpfsUriToHttpUri(uri));

    const uniqueUrls = Array.from(new Set(imageUrls));
    
    const progress: ImageLoadProgress = {
      loaded: 0,
      total: uniqueUrls.length,
      progress: 0,
      loadedUrls: [],
      failedUrls: []
    };

    if (uniqueUrls.length === 0) {
      progress.progress = 100;
      onProgress?.(progress);
      return progress;
    }

    // Start all loads immediately in parallel for maximum speed
    const promises = uniqueUrls.map(async (url, index) => {
      // Stagger the start slightly to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, index * 10));
      
      const success = await this.preloadImage(url, { ...options, timeout: 3000 });
      
      if (success) {
        progress.loadedUrls.push(url);
      } else {
        progress.failedUrls.push(url);
      }
      
      progress.loaded = progress.loadedUrls.length + progress.failedUrls.length;
      progress.progress = Math.round((progress.loaded / progress.total) * 100);
      
      onProgress?.(progress);
      
      return success;
    });

    await Promise.allSettled(promises);
    return progress;
  }
  
  static getBestGatewayUrl(ipfsUrl: string): string {
    const hash = this.extractIPFSHash(ipfsUrl);
    if (hash && this.imageCache.has(hash)) {
      return this.imageCache.get(hash)!;
    }
    return convertIpfsUriToHttpUri(ipfsUrl);
  }
} 