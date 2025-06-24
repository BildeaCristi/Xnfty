import { useState, useEffect, useCallback } from 'react';
import { NFT } from '@/types/blockchain';
import { SceneCoordinatorService, SceneCallbacks, PerformanceMetrics } from '@/services/sceneCoordinatorService';
import { MODAL_SETTINGS } from '@/utils/constants/museumConstants';

export function useSceneCoordinator(nfts: NFT[]) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(100);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    factor: 1,
    dpr: 1.5,
  });

  // Initialize service
  useEffect(() => {
    const callbacks: SceneCallbacks = {
      onLoadingChange: setIsLoading,
      onProgressUpdate: setLoadingProgress,
      onError: setErrorState,
      onPerformanceChange: setPerformanceMetrics,
    };

    SceneCoordinatorService.initialize(callbacks);

    return () => {
      SceneCoordinatorService.cleanup();
    };
  }, []);

  // Initialize scene when NFTs change
  useEffect(() => {
    SceneCoordinatorService.initializeScene(nfts);
  }, [nfts]);

  // Setup loading timeout fallback
  useEffect(() => {
    if (nfts.length > 0) {
      const timeout = SceneCoordinatorService.createLoadingTimeoutFallback(
        MODAL_SETTINGS.IMAGE_LOAD_TIMEOUT
      );

      return () => clearTimeout(timeout);
    }
  }, [nfts]);

  const updateImageProgress = useCallback((loadedCount: number, totalCount: number) => {
    SceneCoordinatorService.updateImageLoadingProgress(loadedCount, totalCount);
  }, []);

  const handleAllImagesLoaded = useCallback(() => {
    SceneCoordinatorService.handleAllImagesLoaded();
  }, []);

  const handlePerformanceChange = useCallback((fps: number, factor: number) => {
    SceneCoordinatorService.handlePerformanceChange(fps, factor);
  }, []);

  const handleError = useCallback((error: string) => {
    SceneCoordinatorService.handleError(error);
  }, []);

  const clearError = useCallback(() => {
    SceneCoordinatorService.clearError();
  }, []);

  const adjustDPR = useCallback((dpr: number) => {
    SceneCoordinatorService.adjustDPR(dpr);
  }, []);

  const getOptimalQuality = useCallback((factor: number) => {
    return SceneCoordinatorService.getOptimalQuality(factor);
  }, []);

  return {
    // Scene state
    isLoading,
    loadingProgress,
    errorState,
    performanceMetrics,
    
    // Computed state
    isReady: SceneCoordinatorService.isReady(),
    shouldShowLoadingScreen: SceneCoordinatorService.shouldShowLoadingScreen(),
    
    // Actions
    updateImageProgress,
    handleAllImagesLoaded,
    handlePerformanceChange,
    handleError,
    clearError,
    adjustDPR,
    
    // Helpers
    getOptimalQuality,
    
    // Service state
    sceneState: SceneCoordinatorService.getState(),
  };
} 