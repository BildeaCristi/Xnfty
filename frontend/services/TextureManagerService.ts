import * as THREE from 'three';

class TextureManagerService {
  private static instance: TextureManagerService;
  private textureCache: Map<string, THREE.Texture>;
  private referenceCount: Map<string, number>;
  private loader: THREE.TextureLoader;
  private maxCacheSize: number = 50;

  private constructor() {
    this.textureCache = new Map();
    this.referenceCount = new Map();
    this.loader = new THREE.TextureLoader();
  }

  static getInstance(): TextureManagerService {
    if (!TextureManagerService.instance) {
      TextureManagerService.instance = new TextureManagerService();
    }
    return TextureManagerService.instance;
  }

  async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      this.incrementReference(url);
      return this.textureCache.get(url)!;
    }

    if (this.textureCache.size >= this.maxCacheSize) {
      this.removeLeastUsedTexture();
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // Configure texture for better performance
          texture.generateMipmaps = false;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBAFormat;
          texture.needsUpdate = true;
          
          // Cache the texture
          this.textureCache.set(url, texture);
          this.referenceCount.set(url, 1);
          
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  private incrementReference(url: string) {
    const count = this.referenceCount.get(url) || 0;
    this.referenceCount.set(url, count + 1);
  }

  releaseTexture(url: string) {
    const count = this.referenceCount.get(url) || 0;
    if (count > 1) {
      this.referenceCount.set(url, count - 1);
    } else {
      // Remove from cache and dispose
      const texture = this.textureCache.get(url);
      if (texture) {
        texture.dispose();
        this.textureCache.delete(url);
        this.referenceCount.delete(url);
      }
    }
  }

  private removeLeastUsedTexture() {
    let minCount = Infinity;
    let urlToRemove = '';

    this.referenceCount.forEach((count, url) => {
      if (count < minCount) {
        minCount = count;
        urlToRemove = url;
      }
    });

    if (urlToRemove) {
      const texture = this.textureCache.get(urlToRemove);
      if (texture) {
        texture.dispose();
        this.textureCache.delete(urlToRemove);
        this.referenceCount.delete(urlToRemove);
      }
    }
  }
}

export default TextureManagerService;