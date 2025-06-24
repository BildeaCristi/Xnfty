import { useState, useEffect, useCallback } from 'react';
import { Group, Texture } from 'three';
import { AssetLoaderService } from '@/services/assetLoaderService';
import { ASSET_QUALITY_SETTINGS } from '@/config/assetConfig';

export interface UseAssetLoaderOptions {
  quality?: keyof typeof ASSET_QUALITY_SETTINGS;
  preload?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export interface AssetLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  progress: number;
}

export interface UseModelReturn extends AssetLoadState {
  model: Group | null;
  reload: () => void;
}

export interface UseTextureReturn extends AssetLoadState {
  texture: Texture | null;
  reload: () => void;
}

export function useModel(path: string, options: UseAssetLoaderOptions = {}): UseModelReturn {
  const [model, setModel] = useState<Group | null>(null);
  const [state, setState] = useState<AssetLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0,
  });

  const loadModel = useCallback(async () => {
    if (!path) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));

    try {
      const loadedModel = await AssetLoaderService.loadModel(path, options);
      
      if (loadedModel) {
        setModel(loadedModel);
        setState(prev => ({ ...prev, isLoading: false, isLoaded: true, progress: 100 }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: `Failed to load model: ${path}`,
          progress: 0 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Error loading model: ${error}`,
        progress: 0 
      }));
    }
  }, [path, options]);

  useEffect(() => {
    if (options.preload) {
      loadModel();
    }
  }, [loadModel, options.preload]);

  const reload = useCallback(() => {
    loadModel();
  }, [loadModel]);

  return {
    model,
    reload,
    ...state,
  };
}

export function useTexture(path: string, options: UseAssetLoaderOptions = {}): UseTextureReturn {
  const [texture, setTexture] = useState<Texture | null>(null);
  const [state, setState] = useState<AssetLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0,
  });

  const loadTexture = useCallback(async () => {
    if (!path) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));

    try {
      const loadedTexture = await AssetLoaderService.loadTexture(path, options);
      
      if (loadedTexture) {
        setTexture(loadedTexture);
        setState(prev => ({ ...prev, isLoading: false, isLoaded: true, progress: 100 }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: `Failed to load texture: ${path}`,
          progress: 0 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Error loading texture: ${error}`,
        progress: 0 
      }));
    }
  }, [path, options]);

  useEffect(() => {
    if (options.preload) {
      loadTexture();
    }
  }, [loadTexture, options.preload]);

  const reload = useCallback(() => {
    loadTexture();
  }, [loadTexture]);

  return {
    texture,
    reload,
    ...state,
  };
}

export function useAssetPreloader(assetPaths: string[], quality: keyof typeof ASSET_QUALITY_SETTINGS = 'MEDIUM') {
  const [state, setState] = useState<AssetLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0,
  });

  const preloadAssets = useCallback(async () => {
    if (assetPaths.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));

    try {
      AssetLoaderService.preloadAssets(assetPaths, quality);
      setState(prev => ({ ...prev, isLoading: false, isLoaded: true, progress: 100 }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Error preloading assets: ${error}`,
        progress: 0 
      }));
    }
  }, [assetPaths, quality]);

  useEffect(() => {
    preloadAssets();
  }, [preloadAssets]);

  return state;
}
