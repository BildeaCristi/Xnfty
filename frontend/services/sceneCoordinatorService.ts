import { NFT } from '@/types/blockchain';
import { PERFORMANCE_SETTINGS } from '@/utils/constants/museumConstants';

export type SceneState = {
  isLoading: boolean;
  allImagesLoaded: boolean;
  loadingProgress: number;
  errorState: string | null;
};

export type PerformanceMetrics = {
  fps: number;
  factor: number;
  dpr: number;
};

export type SceneCallbacks = {
  onLoadingChange: (isLoading: boolean) => void;
  onProgressUpdate: (progress: number) => void;
  onError: (error: string) => void;
  onPerformanceChange: (metrics: PerformanceMetrics) => void;
};

export class SceneCoordinatorService {
  private static state: SceneState = {
    isLoading: false,
    allImagesLoaded: true,
    loadingProgress: 100,
    errorState: null,
  };

  private static callbacks: SceneCallbacks | null = null;
  private static performanceMetrics: PerformanceMetrics = {
    fps: 60,
    factor: 1,
    dpr: PERFORMANCE_SETTINGS.DEFAULT_DPR,
  };

  static initialize(callbacks: SceneCallbacks): void {
    this.callbacks = callbacks;
  }

  static getState(): SceneState {
    return { ...this.state };
  }

  static getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  static initializeScene(nfts: NFT[]): void {
    this.clearError();
    
    if (nfts.length === 0) {
      this.setAllImagesLoaded(true);
      this.setLoadingProgress(100);
      return;
    }

    this.setAllImagesLoaded(false);
    this.setLoadingProgress(0);
    this.setLoading(true);
  }

  static updateImageLoadingProgress(loadedCount: number, totalCount: number): void {
    const progress = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 100;
    this.setLoadingProgress(progress);

    if (loadedCount >= totalCount) {
      this.handleAllImagesLoaded();
    }
  }

  static handleAllImagesLoaded(): void {
    this.setAllImagesLoaded(true);
    this.setLoading(false);
    this.setLoadingProgress(100);
  }

  static handlePerformanceChange(fps: number, factor: number): void {
    this.performanceMetrics.fps = fps;
    this.performanceMetrics.factor = factor;

    // Auto-adjust DPR based on performance
    if (factor < 0.5) {
      this.adjustDPR(PERFORMANCE_SETTINGS.MIN_DPR);
    } else if (factor > 0.8) {
      this.adjustDPR(Math.min(PERFORMANCE_SETTINGS.MAX_DPR, window.devicePixelRatio));
    }

    this.callbacks?.onPerformanceChange(this.performanceMetrics);
  }

  static adjustDPR(newDPR: number): void {
    this.performanceMetrics.dpr = newDPR;
  }

  static handleError(error: string): void {
    this.state.errorState = error;
    this.callbacks?.onError(error);
  }

  static clearError(): void {
    this.state.errorState = null;
  }

  static isReady(): boolean {
    return this.state.allImagesLoaded && !this.state.isLoading && !this.state.errorState;
  }

  static shouldShowLoadingScreen(): boolean {
    return !this.state.allImagesLoaded;
  }

  static getOptimalQuality(performanceFactor: number): 'low' | 'medium' | 'high' {
    if (performanceFactor < 0.3) return 'low';
    if (performanceFactor < 0.7) return 'medium';
    return 'high';
  }

  static createLoadingTimeoutFallback(timeoutMs: number): NodeJS.Timeout {
    return setTimeout(() => {
      if (!this.state.allImagesLoaded) {
        this.handleAllImagesLoaded();
      }
    }, timeoutMs);
  }

  private static setLoading(isLoading: boolean): void {
    if (this.state.isLoading !== isLoading) {
      this.state.isLoading = isLoading;
      this.callbacks?.onLoadingChange(isLoading);
    }
  }

  private static setAllImagesLoaded(loaded: boolean): void {
    this.state.allImagesLoaded = loaded;
  }

  private static setLoadingProgress(progress: number): void {
    if (this.state.loadingProgress !== progress) {
      this.state.loadingProgress = progress;
      this.callbacks?.onProgressUpdate(progress);
    }
  }

  static cleanup(): void {
    this.state = {
      isLoading: false,
      allImagesLoaded: true,
      loadingProgress: 100,
      errorState: null,
    };

    this.performanceMetrics = {
      fps: 60,
      factor: 1,
      dpr: PERFORMANCE_SETTINGS.DEFAULT_DPR,
    };

    this.callbacks = null;
  }
} 