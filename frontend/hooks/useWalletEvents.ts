"use client";

import {useEffect} from 'react';
import {useWalletStore} from '@/store/WalletStore';
import {useNotifications} from '@/providers/NotificationContext';
import {signOut} from 'next-auth/react';

export const useWalletEvents = () => {
    const {setWalletData, disconnect} = useWalletStore();
    const notifications = useNotifications();

    useEffect(() => {
        // Ensure we're in the browser environment and have required dependencies
        if (typeof window === 'undefined' || !window.ethereum || !notifications) return;

        const {showInfo, showWarning} = notifications;

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                showWarning("Wallet Disconnected", "Your wallet has been disconnected");
                disconnect();
                await signOut({redirect: false});
            } else if (accounts[0]) {
                showInfo("Account Changed", `Switched to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
                setWalletData({
                    isConnected: true,
                    walletAddress: accounts[0],
                });
                await signOut({redirect: false});
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
            window.location.reload();
        };

        const handleDisconnect = async () => {
            showWarning("Wallet Disconnected", "Your wallet connection was lost");
            disconnect();
            await signOut({redirect: false});
        };

        try {
            // @ts-ignore
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            // @ts-ignore
            window.ethereum.on('chainChanged', handleChainChanged);
            // @ts-ignore
            window.ethereum.on('disconnect', handleDisconnect);
        } catch (error) {
            console.warn('Failed to attach wallet event listeners:', error);
        }

        return () => {
            try {
                // @ts-ignore
                if (window.ethereum?.removeListener) {
                    // @ts-ignore
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    // @ts-ignore
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                    // @ts-ignore
                    window.ethereum.removeListener('disconnect', handleDisconnect);
                }
            } catch (error) {
                console.warn('Failed to remove wallet event listeners:', error);
            }
        };
    }, [setWalletData, disconnect, notifications]);
}; 