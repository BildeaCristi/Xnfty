'use client';

import SharesInfo from './SharesInfo';
import {DASHBOARD_LABELS} from '@/utils/constants/dashboard';
import type {Collection, CollectionStats, CollectionWithShares} from '@/types';

interface DashboardCollectionCardProps {
    collection: Collection | CollectionWithShares;
    stats?: CollectionStats;
    walletAddress?: string;
    onCollectionClick: (collectionId: number) => void;
    formatAddress: (address: string) => string;
}

export default function DashboardCollectionCard({
                                                    collection,
                                                    stats,
                                                    walletAddress,
                                                    onCollectionClick,
                                                    formatAddress
                                                }: DashboardCollectionCardProps) {
    const isSharedCollection = 'userNFTShares' in collection;
    const sharedCol = collection as CollectionWithShares;
    const isUserOwned = walletAddress && collection.owner.toLowerCase() === walletAddress.toLowerCase();

    return (
        <div
            key={collection.collectionId}
            onClick={() => onCollectionClick(collection.collectionId)}
            className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden cursor-pointer hover:bg-white/15 transition-colors"
        >
            {/* Collection Image */}
            <img
                src={collection.imageURI || '/placeholder-collection.png'}
                alt={collection.name}
                className="w-full h-48 object-cover"
            />

            <div className="p-4">
                {/* Collection Info */}
                <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                <p className="text-blue-200 text-sm mb-3 line-clamp-2">{collection.description}</p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm mb-3">
                    <div>
                        <p className="text-blue-300">{DASHBOARD_LABELS.TOTAL_NFTS}</p>
                        <p className="text-white font-semibold">{stats?.totalNFTs || 0}</p>
                    </div>
                    <div>
                        <p className="text-blue-300">{DASHBOARD_LABELS.FRACTIONALIZED}</p>
                        <p className="text-white font-semibold">{stats?.fractionalizedNFTs || 0}</p>
                    </div>
                </div>

                {/* Shares Information */}
                {isSharedCollection && walletAddress && (
                    <SharesInfo
                        collection={sharedCol}
                        walletAddress={walletAddress}
                    />
                )}

                {/* Owner Information */}
                <div className="pt-3 border-t border-white/20">
                    <div className="flex items-center justify-between text-xs">
            <span className="text-blue-300">
              {isSharedCollection ? DASHBOARD_LABELS.COLLECTION_OWNER : DASHBOARD_LABELS.OWNER}
            </span>
                        <span className="text-white">{formatAddress(collection.owner)}</span>
                    </div>

                    {/* Owner Badge */}
                    {isUserOwned && (
                        <span className="inline-block mt-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              {DASHBOARD_LABELS.YOUR_COLLECTION}
            </span>
                    )}

                    {/* Shared Ownership Badge */}
                    {isSharedCollection && (
                        <span className="inline-block mt-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
              {DASHBOARD_LABELS.SHARED_OWNERSHIP}
            </span>
                    )}
                </div>
            </div>
        </div>
    );
} 