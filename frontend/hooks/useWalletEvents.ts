"use client";

import { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useNotifications } from '@/components/notifications/NotificationContext';
import { signOut } from 'next-auth/react';

export const useWalletEvents = () => {
  const { setWalletData, disconnect } = useWalletStore();
  const { showInfo, showWarning } = useNotifications();

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        showWarning("Wallet Disconnected", "Your wallet has been disconnected");
        disconnect();
        await signOut({ redirect: false });
      } else if (accounts[0]) {
        // User switched accounts
        showInfo("Account Changed", `Switched to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
        setWalletData({
          isConnected: true,
          walletAddress: accounts[0],
        });
        // Force re-authentication with new account
        await signOut({ redirect: false });
        window.location.reload();
      }
    };

    const handleChainChanged = (chainId: string) => {
      const chainIdNumber = parseInt(chainId, 16);
      showInfo("Network Changed", `Switched to chain ID: ${chainIdNumber}`);
      setWalletData({
        isConnected: true,
        walletAddress: null,
        chainId: chainIdNumber,
      });
      // Reload to ensure proper network state
      window.location.reload();
    };

    const handleDisconnect = async () => {
      showWarning("Wallet Disconnected", "Your wallet connection was lost");
      disconnect();
      await signOut({ redirect: false });
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [setWalletData, disconnect, showInfo, showWarning]);
}; 