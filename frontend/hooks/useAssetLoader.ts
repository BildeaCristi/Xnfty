import {useCallback, useEffect, useState} from 'react';
import {Group, Texture} from 'three';
import {AssetLoaderService} from '@/services/AssetLoaderService';
import {ASSET_QUALITY_SETTINGS} from '@/config/assetConfig';

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

export function useAssetPreloader(assetPaths: string[], quality: keyof typeof ASSET_QUALITY_SETTINGS = 'MEDIUM') {
    const [state, setState] = useState<AssetLoadState>({
        isLoading: false,
        isLoaded: false,
        error: null,
        progress: 0,
    });

    const preloadAssets = useCallback(async () => {
        if (assetPaths.length === 0) return;

        setState(prev => ({...prev, isLoading: true, error: null, progress: 0}));

        try {
            AssetLoaderService.preloadAssets(assetPaths, quality);
            setState(prev => ({...prev, isLoading: false, isLoaded: true, progress: 100}));
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
