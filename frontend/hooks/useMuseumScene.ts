import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from './useTheme';
import { useAssetPreloader } from './useAssetLoader';
import { MuseumService } from '@/services/museumService';
import { SCENE_CONFIG } from '@/config/sceneConfig';

export interface NFTData {
  id: string;
  name: string;
  image: string;
  tokenId: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface UseMuseumSceneOptions {
  nfts: any[];
  quality?: 'LOW' | 'MEDIUM' | 'HIGH';
  enablePhysics?: boolean;
  controlMode?: 'ORBIT' | 'FIRST_PERSON';
}

export interface UseMuseumSceneReturn {
  // NFT Data
  nftData: NFTData[];
  isNFTDataReady: boolean;
  
  // Theme & Assets
  currentTheme: any;
  themeAssets: any;
  assetsLoaded: boolean;
  
  // Scene State
  sceneReady: boolean;
  isLoading: boolean;
  loadingProgress: number;
  
  // Controls
  controlMode: 'ORBIT' | 'FIRST_PERSON';
  setControlMode: (mode: 'ORBIT' | 'FIRST_PERSON') => void;
  
  // Modal State
  selectedNFT: NFTData | null;
  openNFTModal: (nft: NFTData) => void;
  closeNFTModal: () => void;
  modalCooldown: boolean;
  
  // Scene Configuration
  sceneConfig: typeof SCENE_CONFIG;
  cameraSettings: any;
  lightingConfig: any;
}

export function useMuseumScene(options: UseMuseumSceneOptions): UseMuseumSceneReturn {
  const { nfts, quality = 'MEDIUM', enablePhysics = false, controlMode: initialControlMode = 'ORBIT' } = options;
  
  // Theme management
  const { currentTheme, themeConfig, themeAssets } = useTheme();
  
  // Asset preloading
  const assetPreloader = useAssetPreloader(themeAssets.models || [], quality);
  
  // Local state
  const [controlMode, setControlMode] = useState<'ORBIT' | 'FIRST_PERSON'>(initialControlMode);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [modalCooldown, setModalCooldown] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  // Process NFT data with positions and rotations
  const nftData = useMemo((): NFTData[] => {
    if (!nfts || nfts.length === 0) return [];
    
    const positions = MuseumService.calculateNFTPositions(nfts.length);
    
    return nfts.map((nft, index) => ({
      id: nft.id || `nft-${index}`,
      name: nft.name || `NFT ${index + 1}`,
      image: nft.image || '',
      tokenId: nft.tokenId || '',
      position: positions[index] || [0, 2, 0],
      rotation: MuseumService.calculateNFTRotation(index, nfts.length),
    }));
  }, [nfts]);

  const isNFTDataReady = nftData.length > 0;

  // Calculate overall loading progress
  const loadingProgress = useMemo(() => {
    if (assetPreloader.isLoaded && isNFTDataReady) return 100;
    if (assetPreloader.isLoading) return assetPreloader.progress * 0.7;
    if (isNFTDataReady) return 30;
    return 0;
  }, [assetPreloader, isNFTDataReady]);

  const isLoading = !assetPreloader.isLoaded || !isNFTDataReady;

  // Scene readiness
  useEffect(() => {
    const ready = assetPreloader.isLoaded && isNFTDataReady && !assetPreloader.isLoading;
    setSceneReady(ready);
  }, [assetPreloader.isLoaded, assetPreloader.isLoading, isNFTDataReady]);

  // Modal management
  const openNFTModal = useCallback((nft: NFTData) => {
    if (modalCooldown) return;
    setSelectedNFT(nft);
  }, [modalCooldown]);

  const closeNFTModal = useCallback(() => {
    setSelectedNFT(null);
    setModalCooldown(true);
    setTimeout(() => {
      setModalCooldown(false);
    }, SCENE_CONFIG.INTERACTION.MODAL_COOLDOWN_MS);
  }, []);

  // Camera settings based on control mode
  const cameraSettings = useMemo(() => {
    const settings = SCENE_CONFIG.CAMERA_SETTINGS;
    return controlMode === 'ORBIT' ? settings.ORBIT : settings.FIRST_PERSON;
  }, [controlMode]);

  return {
    // NFT Data
    nftData,
    isNFTDataReady,
    
    // Theme & Assets
    currentTheme: themeConfig,
    themeAssets,
    assetsLoaded: assetPreloader.isLoaded,
    
    // Scene State
    sceneReady,
    isLoading,
    loadingProgress,
    
    // Controls
    controlMode,
    setControlMode,
    
    // Modal State
    selectedNFT,
    openNFTModal,
    closeNFTModal,
    modalCooldown,
    
    // Scene Configuration
    sceneConfig: SCENE_CONFIG,
    cameraSettings,
    lightingConfig: themeConfig.lighting,
  };
}
