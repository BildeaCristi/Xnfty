'use client';

import {useState} from 'react';
import GlassPanel from './GlassPanel';
import CollectionTabs from './CollectionTabs';
import CollectionGrid from './CollectionGrid';
import {DASHBOARD_LABELS, type DashboardTab} from '@/utils/constants/dashboard';
import type {Collection, CollectionStats, CollectionWithShares} from '@/types';

interface DashboardCollectionsProps {
    allCollections: Collection[];
    userCollections: Collection[];
    sharedCollections: CollectionWithShares[];
    collectionStats: { [key: string]: CollectionStats };
    isLoading: boolean;
    walletAddress?: string;
    isGuest?: boolean;
    onCollectionClick: (collectionId: number) => void;
    onCreateCollection: () => void;
    formatAddress: (address: string) => string;
    getCollectionsToShow: (activeTab: DashboardTab) => (Collection | CollectionWithShares)[];
}

export default function DashboardCollections({
                                                 userCollections,
                                                 sharedCollections,
                                                 collectionStats,
                                                 isLoading,
                                                 walletAddress,
                                                 isGuest = false,
                                                 onCollectionClick,
                                                 onCreateCollection,
                                                 formatAddress,
                                                 getCollectionsToShow
                                             }: DashboardCollectionsProps) {
    const [activeTab, setActiveTab] = useState<DashboardTab>('all');

    const collectionsToShow = getCollectionsToShow(activeTab);

    return (
        <GlassPanel className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{DASHBOARD_LABELS.COLLECTIONS}</h2>

                {!isGuest && (
                    <CollectionTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        sharesCount={sharedCollections.length}
                        ownedCount={userCollections.length}
                        isGuest={isGuest}
                    />
                )}
            </div>

            <CollectionGrid
                collections={collectionsToShow}
                collectionStats={collectionStats}
                activeTab={activeTab}
                isLoading={isLoading}
                walletAddress={walletAddress}
                onCollectionClick={onCollectionClick}
                onCreateCollection={onCreateCollection}
                formatAddress={formatAddress}
            />
        </GlassPanel>
    );
} 