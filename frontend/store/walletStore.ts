import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  balance: string | null;
  chainId: number | null;
  setWalletData: (data: {
    isConnected: boolean;
    walletAddress: string | null;
    balance?: string | null;
    chainId?: number | null;
  }) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isConnected: false,
      walletAddress: null,
      balance: null,
      chainId: null,
      setWalletData: (data) => set((state) => ({ ...state, ...data })),
      disconnect: () => set({
        isConnected: false,
        walletAddress: null,
        balance: null,
        chainId: null,
      }),
    }),
    {
      name: 'wallet-storage',
    }
  )
); 