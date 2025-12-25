'use client';

import DashboardCollectionCard from './DashboardCollectionCard';
import DashboardEmptyState from './DashboardEmptyState';
import LoadingState from './LoadingState';
import {DASHBOARD_MESSAGES, type DashboardTab} from '@/utils/constants/dashboard';
import type {Collection, CollectionStats, CollectionWithShares} from '@/types';

interface CollectionGridProps {
    collections: (Collection | CollectionWithShares)[];
    collectionStats: { [key: string]: CollectionStats };
    activeTab: DashboardTab;
    isLoading: boolean;
    walletAddress?: string;
    onCollectionClick: (collectionId: number) => void;
    onCreateCollection: () => void;
    formatAddress: (address: string) => string;
}

export default function CollectionGrid({
                                           collections,
                                           collectionStats,
                                           activeTab,
                                           isLoading,
                                           walletAddress,
                                           onCollectionClick,
                                           onCreateCollection,
                                           formatAddress
                                       }: CollectionGridProps) {
    if (isLoading) {
        return <LoadingState message={DASHBOARD_MESSAGES.LOADING_COLLECTIONS}/>;
    }

    if (collections.length === 0) {
        return (
            <DashboardEmptyState
                activeTab={activeTab}
                onCreateCollection={onCreateCollection}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
                <DashboardCollectionCard
                    key={collection.collectionId}
                    collection={collection}
                    stats={collectionStats[collection.collectionAddress]}
                    walletAddress={walletAddress}
                    onCollectionClick={onCollectionClick}
                    formatAddress={formatAddress}
                />
            ))}
        </div>
    );
} 