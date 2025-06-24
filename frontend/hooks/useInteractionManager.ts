import { useState, useEffect, useCallback } from 'react';
import { NFT } from '@/types/blockchain';
import { InteractionService, InteractionCallbacks } from '@/services/interactionService';

export function useInteractionManager(nfts: NFT[]) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [hoveredNFT, setHoveredNFT] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize service with callbacks
  useEffect(() => {
    const callbacks: InteractionCallbacks = {
      onNFTSelect: setSelectedNFT,
      onNFTHover: setHoveredNFT,
      onModalStateChange: setIsModalOpen,
    };

    InteractionService.initialize(callbacks);

    return () => {
      InteractionService.cleanup();
    };
  }, []);

  const handleNFTClick = useCallback((nft: NFT, controlMode: 'orbit' | 'firstPerson') => {
    return InteractionService.handleNFTClick(nft, controlMode);
  }, []);

  const handleNFTHover = useCallback((tokenId: number | null, controlMode: 'orbit' | 'firstPerson') => {
    InteractionService.handleNFTHover(tokenId, controlMode);
  }, []);

  const handleClickFromTokenId = useCallback((tokenId: number, controlMode: 'orbit' | 'firstPerson') => {
    const nft = InteractionService.findNFTByTokenId(tokenId, nfts);
    if (nft) {
      return InteractionService.handleNFTClick(nft, controlMode);
    }
    return false;
  }, [nfts]);

  const closeModal = useCallback(() => {
    InteractionService.closeModal();
  }, []);

  const setInteractionMode = useCallback((enabled: boolean) => {
    InteractionService.setInteractionMode(enabled);
  }, []);

  const isHovering = useCallback((tokenId: number) => {
    return InteractionService.isHovering(tokenId);
  }, []);

  const canInteract = useCallback(() => {
    return InteractionService.canInteract();
  }, []);

  return {
    // State
    selectedNFT,
    hoveredNFT,
    isModalOpen,
    
    // Actions
    handleNFTClick,
    handleNFTHover,
    handleClickFromTokenId,
    closeModal,
    setInteractionMode,
    
    // Helpers
    isHovering,
    canInteract,
    
    // Service state
    interactionState: InteractionService.getState(),
  };
} 