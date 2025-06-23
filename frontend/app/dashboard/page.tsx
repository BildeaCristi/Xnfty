'use client';

import {useState} from 'react';
import {DashboardBackground, DashboardCollections, LoadingState} from '@/components/dashboard';
import CreateCollectionModal from '@/components/create-collection/CreateCollectionModal';
import Navbar from '@/components/shared/Navbar';
import {useDashboardData} from '@/hooks/useDashboardData';
import {useDashboardActions} from '@/hooks/useDashboardActions';
import {DASHBOARD_MESSAGES} from '@/utils/constants/dashboard';

export default function DashboardPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Custom hooks for data and actions
    const {
        allCollections,
        userCollections,
        sharedCollections,
        collectionStats,
        isLoading,
        walletAddress,
        getCollectionsToShow,
        loadCollections,
        session,
        status
    } = useDashboardData();

    const {
        handleCreateSuccess,
        handleCollectionClick,
        handleAddToMetaMask,
        formatAddress
    } = useDashboardActions();

    // Handle create collection success
    const onCreateSuccess = (collectionId: number) => {
        loadCollections(); // Refresh data
        handleCreateSuccess(collectionId); // Navigate to collection
        setShowCreateModal(false); // Close modal
    };

    // Loading state for authentication
    if (status === 'loading') {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <LoadingState message={DASHBOARD_MESSAGES.LOADING} className="text-center"/>
            </div>
        );
    }

    // Main dashboard layout
    return (
        <div className="min-h-screen relative overflow-hidden">
            <DashboardBackground/>

            {/* Navbar */}
            <Navbar
                session={session!}
                collections={allCollections}
                onCreateCollection={() => setShowCreateModal(true)}
            />

            {/* Main Content */}
            <div className="relative z-10 pt-20 p-6">
                <DashboardCollections
                    allCollections={allCollections}
                    userCollections={userCollections}
                    sharedCollections={sharedCollections}
                    collectionStats={collectionStats}
                    isLoading={isLoading}
                    walletAddress={walletAddress}
                    onCollectionClick={handleCollectionClick}
                    onAddToMetaMask={handleAddToMetaMask}
                    onCreateCollection={() => setShowCreateModal(true)}
                    formatAddress={formatAddress}
                    getCollectionsToShow={getCollectionsToShow}
                />
            </div>

            {/* Create Collection Modal */}
            {showCreateModal && (
                <CreateCollectionModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={onCreateSuccess}
                />
            )}
        </div>
    );
}