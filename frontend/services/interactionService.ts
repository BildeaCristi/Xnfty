import { NFT } from '@/types/blockchain';
import { MODAL_SETTINGS } from '@/utils/constants/museumConstants';

export type InteractionState = {
  selectedNFT: NFT | null;
  hoveredNFT: number | null;
  modalJustClosed: boolean;
  isInteractionMode: boolean;
};

export type InteractionCallbacks = {
  onNFTSelect: (nft: NFT | null) => void;
  onNFTHover: (tokenId: number | null) => void;
  onModalStateChange: (isOpen: boolean) => void;
};

export class InteractionService {
  private static state: InteractionState = {
    selectedNFT: null,
    hoveredNFT: null,
    modalJustClosed: false,
    isInteractionMode: false,
  };

  private static callbacks: InteractionCallbacks | null = null;
  private static cooldownTimer: NodeJS.Timeout | null = null;

  static initialize(callbacks: InteractionCallbacks): void {
    this.callbacks = callbacks;
  }

  static getState(): InteractionState {
    return { ...this.state };
  }

  static setInteractionMode(enabled: boolean): void {
    this.state.isInteractionMode = enabled;
    if (!enabled) {
      this.clearHover();
    }
  }

  static handleNFTClick(nft: NFT, controlMode: 'orbit' | 'firstPerson'): boolean {
    // Block clicks in first person mode or if modal is active/recently closed
    if (controlMode === 'firstPerson' || this.state.modalJustClosed || this.state.selectedNFT) {
      return false;
    }

    this.selectNFT(nft);
    return true;
  }

  static handleNFTHover(tokenId: number | null, controlMode: 'orbit' | 'firstPerson'): void {
    // Only allow hover in orbit mode and when interaction is enabled
    if (controlMode === 'orbit' && this.state.isInteractionMode && !this.state.modalJustClosed) {
      this.setHoveredNFT(tokenId);
    }
  }

  static selectNFT(nft: NFT | null): void {
    this.state.selectedNFT = nft;
    this.clearHover();
    this.callbacks?.onNFTSelect(nft);
    this.callbacks?.onModalStateChange(!!nft);
  }

  static setHoveredNFT(tokenId: number | null): void {
    this.state.hoveredNFT = tokenId;
    this.callbacks?.onNFTHover(tokenId);
  }

  static clearHover(): void {
    this.state.hoveredNFT = null;
    this.callbacks?.onNFTHover(null);
  }

  static closeModal(): void {
    this.state.selectedNFT = null;
    this.clearHover();
    this.state.modalJustClosed = true;
    
    this.callbacks?.onNFTSelect(null);
    this.callbacks?.onModalStateChange(false);

    // Clear cooldown timer if exists
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }

    // Set cooldown to prevent immediate re-opening
    this.cooldownTimer = setTimeout(() => {
      this.state.modalJustClosed = false;
      this.cooldownTimer = null;
    }, MODAL_SETTINGS.CLOSE_COOLDOWN);
  }

  static findNFTByTokenId(tokenId: number, nfts: NFT[]): NFT | null {
    return nfts.find(nft => nft.tokenId === tokenId) || null;
  }

  static isModalOpen(): boolean {
    return !!this.state.selectedNFT;
  }

  static isHovering(tokenId: number): boolean {
    return this.state.hoveredNFT === tokenId;
  }

  static canInteract(): boolean {
    return this.state.isInteractionMode && !this.state.modalJustClosed;
  }

  static cleanup(): void {
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    
    this.state = {
      selectedNFT: null,
      hoveredNFT: null,
      modalJustClosed: false,
      isInteractionMode: false,
    };
    
    this.callbacks = null;
  }
} 