'use client';

import React, {useState, useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import DashboardBackground from '@/components/dashboard/DashboardBackground';
import GlassPanel from '@/components/dashboard/GlassPanel';
import LoadingState from '@/components/dashboard/LoadingState';
import CreateCollectionModal from '@/components/create-collection/CreateCollectionModal';
import {ROUTES} from '@/config/routes';
import {DASHBOARD_MESSAGES} from '@/utils/constants/dashboard';
import {getAllCollections, getCollectionStats} from '@/services/BlockchainService';
import {canCreateCollections, getUserStatus} from '@/utils/auth';
import GuestWarning from '@/components/shared/GuestWarning';
import type {Collection, CollectionStats} from '@/types';

export default function CollectionsPage() {
    const {data: session} = useSession();
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const userStatus = getUserStatus(session);
    const canCreate = canCreateCollections(session);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionStats, setCollectionStats] = useState<{ [key: string]: CollectionStats }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const allCollections = await getAllCollections();
                setCollections(allCollections);

                const stats: { [key: string]: CollectionStats } = {};
                for (const collection of allCollections) {
                    try {
                        const collectionStat = await getCollectionStats(collection.collectionAddress);
                        stats[collection.collectionAddress] = collectionStat;
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to load collection stats');
                    }
                }
                setCollectionStats(stats);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load collections');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCollections();
    }, []);

    const handleCollectionClick = (collectionId: number) => {
        router.push(`${ROUTES.COLLECTIONS}/${collectionId}`);
    };

    const handleCreateSuccess = (collectionId: number) => {
        router.push(`${ROUTES.COLLECTIONS}/${collectionId}`);
        setIsCreateModalOpen(false);
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <DashboardBackground/>
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <LoadingState message={DASHBOARD_MESSAGES.LOADING_COLLECTIONS}/>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <DashboardBackground/>
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <GlassPanel className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Error Loading Collections</h2>
                        <p className="text-blue-200 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Retry
                        </button>
                    </GlassPanel>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <DashboardBackground/>

            <div className="relative z-10 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">NFT Collections</h1>
                        <p className="text-blue-200 mt-2">
                            Discover and explore all collections in the ecosystem
                        </p>
                    </div>
                    {canCreate ? (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                        >
                            Create Collection
                        </button>
                    ) : (
                        <button
                            disabled
                            className="bg-gray-600 text-gray-400 px-6 py-3 rounded-lg cursor-not-allowed font-medium"
                            title="Connect wallet to create collections"
                        >
                            Create Collection
                        </button>
                    )}
                </div>

                {/* Guest User Warning */}
                {userStatus.isGuest && (
                    <GuestWarning 
                        message="You're browsing as a guest. You can explore all collections and enter the 3D museum, but you'll need to connect a wallet to buy NFT shares or create your own collections."
                        className="mb-8"
                    />
                )}

                {/* Collections Grid */}
                <GlassPanel className="p-6">
                    {collections.length === 0 ? (
                                                                <div className="text-center py-12">
                                            <h3 className="text-xl font-semibold text-white mb-4">No Collections Found</h3>
                                            <p className="text-blue-200 mb-6">
                                                {canCreate 
                                                    ? "Be the first to create a collection in this ecosystem!" 
                                                    : "No collections have been created yet. Connect your wallet to create the first one!"
                                                }
                                            </p>
                                            {canCreate ? (
                                                <button
                                                    onClick={() => setIsCreateModalOpen(true)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                                >
                                                    Create First Collection
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="bg-gray-600 text-gray-400 px-6 py-2 rounded-lg cursor-not-allowed"
                                                >
                                                    Connect Wallet to Create
                                                </button>
                                            )}
                                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">All Collections</h2>
                                <div className="text-blue-200">
                                    {collections.length} collection{collections.length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {collections.map((collection) => {
                                    const stats = collectionStats[collection.collectionAddress];
                                    const isUserOwned = session?.walletAddress &&
                                        collection.owner.toLowerCase() === session.walletAddress.toLowerCase();

                                    return (
                                        <div
                                            key={collection.collectionId}
                                            onClick={() => handleCollectionClick(collection.collectionId)}
                                            className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden cursor-pointer hover:bg-white/15 transition-colors"
                                        >
                                            <img
                                                src={collection.imageURI || '/placeholder-collection.png'}
                                                alt={collection.name}
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="p-4">
                                                <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                                                <p className="text-blue-200 text-sm mb-3 line-clamp-2">{collection.description}</p>

                                                <div className="flex items-center justify-between text-sm mb-3">
                                                    <div>
                                                        <p className="text-blue-300">Total NFTs</p>
                                                        <p className="text-white font-semibold">{stats?.totalNFTs || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-blue-300">Fractionalized</p>
                                                        <p className="text-white font-semibold">{stats?.fractionalizedNFTs || 0}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-white/20">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-blue-300">Owner</span>
                                                        <span
                                                            className="text-white">{formatAddress(collection.owner)}</span>
                                                    </div>
                                                    {isUserOwned && (
                                                        <span
                                                            className="inline-block mt-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              Your Collection
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </GlassPanel>
            </div>

            {/* Create Collection Modal - Only for full users */}
            {isCreateModalOpen && canCreate && (
                <CreateCollectionModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
} 