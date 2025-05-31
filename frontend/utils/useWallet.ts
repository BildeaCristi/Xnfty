import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';
import { getSigner, getSignerWithSessionCheck, clearSignerCache } from './blockchain';
import { ethers } from 'ethers';

export function useWallet() {
    const { data: session } = useSession();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = useCallback(async (): Promise<ethers.Signer | null> => {
        setIsConnecting(true);
        setError(null);
        
        try {
            // Use session validation if we have a wallet address in session
            const signer = session?.walletAddress 
                ? await getSignerWithSessionCheck(session.walletAddress)
                : await getSigner();
                
            console.log('Wallet connected successfully');
            return signer;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(errorMessage);
            console.error('Wallet connection error:', err);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [session?.walletAddress]);

    const disconnectWallet = useCallback(() => {
        clearSignerCache();
        setError(null);
        console.log('Wallet cache cleared');
    }, []);

    const getWalletSigner = useCallback(async (): Promise<ethers.Signer> => {
        if (session?.walletAddress) {
            return await getSignerWithSessionCheck(session.walletAddress);
        }
        return await getSigner();
    }, [session?.walletAddress]);

    return {
        isConnecting,
        error,
        walletAddress: session?.walletAddress,
        isConnected: !!session?.walletAddress,
        connectWallet,
        disconnectWallet,
        getWalletSigner,
        clearError: () => setError(null)
    };
} 