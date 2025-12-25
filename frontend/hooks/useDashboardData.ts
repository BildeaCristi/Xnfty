'use client';

import {useEffect, useState} from 'react';
import {useSession} from 'next-auth/react';
import {type DashboardTab} from '@/utils/constants/dashboard';
import type {Collection, CollectionStats, CollectionWithShares, UserNFTShare} from '@/types';
import {
    getAllCollections,
    getAllFractionalizedNFTs,
    getCollectionStats,
    getCollectionsWithUserShares,
    getExtendedNFTInfo,
    getUserNFTShares,
    getUserOwnedCollections,
    isAllSharesWithOwner
} from '@/services/BlockchainService';

export function useDashboardData() {
    const {data: session, status} = useSession();
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [userCollections, setUserCollections] = useState<Collection[]>([]);
    const [sharedCollections, setSharedCollections] = useState<CollectionWithShares[]>([]);
    const [userNFTShares, setUserNFTShares] = useState<UserNFTShare[]>([]);
    const [allFractionalizedNFTs, setAllFractionalizedNFTs] = useState<UserNFTShare[]>([]);
    const [collectionStats, setCollectionStats] = useState<{ [key: string]: CollectionStats }>({});
    const [isLoading, setIsLoading] = useState(true);

    const walletAddress = session?.walletAddress;

    const loadCollections = async () => {
        try {
            setIsLoading(true);

            const [collections, fractionalizedNFTs] = await Promise.all([
                getAllCollections(),
                getAllFractionalizedNFTs()
            ]);

            setAllCollections(collections);
            setAllFractionalizedNFTs(fractionalizedNFTs);

            if (walletAddress) {
                const [ownedCollections, nftShares, collectionsWithShares] = await Promise.all([
                    getUserOwnedCollections(walletAddress),
                    getUserNFTShares(walletAddress),
                    getCollectionsWithUserShares(walletAddress)
                ]);

                setUserCollections(ownedCollections);
                setUserNFTShares(nftShares);

                await processSharedCollections(nftShares, collectionsWithShares);
            }

            const stats: { [key: string]: CollectionStats } = {};
            for (const collection of collections) {
                try {
                    const collectionStat = await getCollectionStats(collection.collectionAddress);
                    stats[collection.collectionAddress] = collectionStat;
                } catch (error) {
                }
            }
            setCollectionStats(stats);
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    const processSharedCollections = async (nftShares: UserNFTShare[], collectionsWithShares: Collection[]) => {
        if (!walletAddress || nftShares.length === 0) {
            setSharedCollections([]);
            return;
        }

        const sharesByCollection = nftShares.reduce((acc, share) => {
            const collectionId = share.collectionId;
            if (!acc[collectionId]) {
                acc[collectionId] = [];
            }
            acc[collectionId].push(share);
            return acc;
        }, {} as { [collectionId: number]: UserNFTShare[] });

        const collectionsWithSharesData: CollectionWithShares[] = [];

        for (const collection of collectionsWithShares) {
            const shares = sharesByCollection[collection.collectionId] || [];

            if (shares.length > 0) {
                const totalUserShares = shares.reduce((sum, share) => sum + share.userShares, 0);

                const enhancedShares = await Promise.all(
                    shares.map(async (share) => {
                        try {
                            if (share.fractionalContract) {
                                const [extendedInfo, allSharesWithOwner] = await Promise.all([
                                    getExtendedNFTInfo(share.fractionalContract),
                                    isAllSharesWithOwner(share.fractionalContract)
                                ]);

                                return {
                                    ...share,
                                    creator: extendedInfo.creator,
                                    currentOwner: extendedInfo.currentOwner,
                                    isOwnershipTransferred: extendedInfo.creator !== extendedInfo.currentOwner,
                                    allSharesWithCreator: allSharesWithOwner,
                                    canBuyAll: allSharesWithOwner && extendedInfo.currentOwner.toLowerCase() !== walletAddress.toLowerCase()
                                };
                            }
                            return share;
                        } catch (error) {
                            return share;
                        }
                    })
                );

                const collectionWithShares = {
                    ...collection,
                    userNFTShares: enhancedShares,
                    totalUserShares
                };

                collectionsWithSharesData.push(collectionWithShares);
            }
        }

        setSharedCollections(collectionsWithSharesData);
    };

    const getCollectionsToShow = (activeTab: DashboardTab) => {
        switch (activeTab) {
            case 'owned':
                return userCollections;
            case 'shares':
                return sharedCollections;
            default:
                return allCollections;
        }
    };

    useEffect(() => {
        if (status === 'loading') return;
        if (session) {
            loadCollections();
        }
    }, [session, status, walletAddress]);

    return {
        // Data
        allCollections,
        userCollections,
        sharedCollections,
        userNFTShares,
        allFractionalizedNFTs,
        collectionStats,

        // State
        isLoading,
        walletAddress,

        // Computed values
        getCollectionsToShow,

        // Actions
        loadCollections,

        // Session
        session,
        status
    };
} 