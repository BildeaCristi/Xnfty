"use client";

import {useEffect, useState} from 'react';
import {NFT} from '@/types/blockchain';
import {ImagePreloadService} from '@/services/ImagePreloadService';

interface NFTImagePreloaderProps {
    nfts: NFT[];
    onAllLoaded: () => void;
    onProgress?: (progress: number) => void;
}

export default function NFTImagePreloader({
                                              nfts,
                                              onAllLoaded,
                                              onProgress
                                          }: NFTImagePreloaderProps) {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (nfts.length === 0) {
            onAllLoaded();
            return;
        }
        setIsLoading(true);

        const preloadImages = async () => {
            try {
                await ImagePreloadService.preloadNFTImages(
                    nfts,
                    {
                        timeout: 2000,
                        quality: 'medium'
                    },
                    (progress) => {
                        onProgress?.(progress.progress);
                    }
                );

                onAllLoaded();
                setIsLoading(false);

            } catch (error) {
                onAllLoaded();
                setIsLoading(false);
            }
        };

        preloadImages();

        const fallbackTimeout = setTimeout(() => {
            if (isLoading) {
                onAllLoaded();
                setIsLoading(false);
            }
        }, 3000);

        return () => {
            clearTimeout(fallbackTimeout);
        };
    }, [nfts, onAllLoaded, onProgress, isLoading]);

    return null;
}
