"use client";

import {use, useEffect, useState} from 'react';
import {useSession} from 'next-auth/react';
import {
    ArrowLeft,
    Calendar,
    Check,
    Coins,
    Copy,
    ExternalLink,
    Eye,
    Image,
    Share2,
    User as UserIcon
} from 'lucide-react';
import {useRouter} from 'next/navigation';
import DashboardBackground from '@/components/dashboard/DashboardBackground';
import GlassPanel from '@/components/dashboard/GlassPanel';
import Museum3DScene from '@/components/museum/Museum3DScene';
import {ROUTES} from '@/config/routes';
import {formatAddress, getCollection, getCollectionNFTs, getCollectionStats,} from '@/services/BlockchainService';
import type {Collection, CollectionStats, NFT} from '@/types/blockchain';
import NFTDetailModal from "@/components/collections/NFTDetailModal";

interface CollectionPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function CollectionPage({params}: CollectionPageProps) {
    const {data: session} = useSession();
    const router = useRouter();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [stats, setStats] = useState<CollectionStats | null>(null);
    const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
    const [is3DView, setIs3DView] = useState(false);

    const resolvedParams = use(params);
    const collectionId = parseInt(resolvedParams.id);
    const walletAddress = session?.walletAddress;

    useEffect(() => {
        if (!isNaN(collectionId)) {
            loadCollectionData();
        } else {
            setError('Invalid collection ID');
            setIsLoading(false);
        }
    }, [collectionId]);

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAddress(type);
            setTimeout(() => setCopiedAddress(null), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    const loadCollectionData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const collectionData = await getCollection(collectionId);
            setCollection(collectionData);

            const nftData = await getCollectionNFTs(collectionData.collectionAddress);
            setNfts(nftData);

            const statsData = await getCollectionStats(collectionData.collectionAddress);
            setStats(statsData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load collection data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNFTClick = (nft: NFT) => {
        setSelectedNFT(nft);
    };

    const handleBackClick = () => {
        router.push(ROUTES.DASHBOARD);
    };

    const isOwner = walletAddress && collection && collection.owner.toLowerCase() === walletAddress.toLowerCase();

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <DashboardBackground/>
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                        <p className="text-blue-200 mt-4">Loading collection...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <DashboardBackground/>
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <GlassPanel className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Collection Not Found</h2>
                        <p className="text-blue-200 mb-6">{error || 'The requested collection could not be found.'}</p>
                        <button
                            onClick={handleBackClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </GlassPanel>
                </div>
            </div>
        );
    }

    if (is3DView && collection && nfts) {
        return (
            <div className="min-h-screen relative">
                <button
                    onClick={() => setIs3DView(false)}
                    className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-gray-700/80 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5"/>
                    <span>Exit 3D View</span>
                </button>
                <Museum3DScene
                    collection={collection}
                    nfts={nfts}
                    userAddress={walletAddress}
                    session={session}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <DashboardBackground/>

            <div className="relative z-10 p-6">
                {/* Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handleBackClick}
                        className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5"/>
                        <span>Back to Dashboard</span>
                    </button>

                    {/* 3D View Toggle Button */}
                    {nfts.length > 0 && (
                        <button
                            onClick={() => setIs3DView(true)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Eye className="w-5 h-5"/>
                            <span>View in 3D Museum</span>
                        </button>
                    )}
                </div>

                {/* Collection Header */}
                <GlassPanel className="p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Collection Image */}
                        <div className="lg:col-span-1">
                            <img
                                src={collection.imageURI}
                                alt={collection.name}
                                className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg"
                            />
                        </div>

                        {/* Collection Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-4">
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">{collection.name}</h1>
                                    <p className="text-blue-200 text-base sm:text-lg">{collection.symbol}</p>
                                </div>
                                {isOwner && (
                                    <span
                                        className="bg-blue-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ml-2 flex-shrink-0">
                    Your Collection
                  </span>
                                )}
                            </div>

                            <p className="text-blue-100 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{collection.description}</p>

                            {/* Contract Address */}
                            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-300 mb-2">Contract Address</p>
                                        <div className="bg-gray-900/50 rounded p-2 mb-3">
                                            <p className="text-white font-mono text-xs sm:text-sm break-all">{collection.collectionAddress}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => copyToClipboard(collection.collectionAddress, 'collection')}
                                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex-1"
                                        >
                                            {copiedAddress === 'collection' ? (
                                                <>
                                                    <Check className="w-4 h-4 flex-shrink-0"/>
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 flex-shrink-0"/>
                                                    <span>Copy Address</span>
                                                </>
                                            )}
                                        </button>
                                        <a
                                            href={`https://sepolia.etherscan.io/address/${collection.collectionAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex-1"
                                        >
                                            <ExternalLink className="w-4 h-4 flex-shrink-0"/>
                                            <span>View on Etherscan</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Collection Details */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div className="bg-white/10 rounded-lg p-3">
                                    <div className="flex items-center text-blue-400 mb-1">
                                        <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0"/>
                                        <span className="text-xs sm:text-sm">Total NFTs</span>
                                    </div>
                                    <p className="text-lg sm:text-xl font-semibold text-white">{stats?.totalNFTs || 0}</p>
                                </div>

                                <div className="bg-white/10 rounded-lg p-3">
                                    <div className="flex items-center text-purple-400 mb-1">
                                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0"/>
                                        <span className="text-xs sm:text-sm">Fractionalized</span>
                                    </div>
                                    <p className="text-lg sm:text-xl font-semibold text-white">{stats?.fractionalizedNFTs || 0}</p>
                                </div>

                                <div className="bg-white/10 rounded-lg p-3">
                                    <div className="flex items-center text-green-400 mb-1">
                                        <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0"/>
                                        <span className="text-xs sm:text-sm">Owner</span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-white font-mono">{formatAddress(collection.owner)}</p>
                                </div>

                                <div className="bg-white/10 rounded-lg p-3">
                                    <div className="flex items-center text-orange-400 mb-1">
                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0"/>
                                        <span className="text-xs sm:text-sm">Created</span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-white">
                                        {new Date(collection.creationTime * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassPanel>

                {/* NFTs Section */}
                <GlassPanel className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">NFTs in Collection</h2>
                        <div className="text-blue-200 text-sm sm:text-base">
                            {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {nfts.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <Image className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4"/>
                            <p className="text-blue-200 text-base sm:text-lg">No NFTs in this collection yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {nfts.map((nft) => (
                                <div
                                    key={nft.tokenId}
                                    onClick={() => handleNFTClick(nft)}
                                    className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 cursor-pointer hover:scale-105"
                                >
                                    <img
                                        src={nft.imageURI}
                                        alt={nft.name}
                                        className="w-full h-40 sm:h-48 object-cover"
                                    />
                                    <div className="p-3 sm:p-4">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 truncate">{nft.name}</h3>
                                        <p className="text-blue-200 text-xs sm:text-sm mb-3 line-clamp-2">{nft.description}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="text-xs">
                                                <p className="text-blue-300">Token ID</p>
                                                <p className="text-white font-semibold">#{nft.tokenId}</p>
                                            </div>

                                            {nft.isfractionalized && (
                                                <div
                                                    className="flex items-center space-x-1 bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                                                    <Coins className="w-3 h-3 flex-shrink-0"/>
                                                    <span className="hidden sm:inline">Fractionalized</span>
                                                    <span className="sm:hidden">Frac.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassPanel>
            </div>

            {/* NFT Detail Modal */}
            {selectedNFT && (
                <NFTDetailModal
                    nft={selectedNFT}
                    collection={collection}
                    userAddress={walletAddress}
                    session={session}
                    onClose={() => setSelectedNFT(null)}
                />
            )}
        </div>
    );
} 