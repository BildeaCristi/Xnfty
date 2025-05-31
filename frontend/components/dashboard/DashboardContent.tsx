"use client";

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Plus, Share2, Users, TrendingUp, Eye, Wallet, Coins, LogOut, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import DashboardBackground from './DashboardBackground';
import GlassPanel from './GlassPanel';
import UserSharesSummary from './UserSharesSummary';
import CreateCollectionModal from '@/components/create-collection/CreateCollectionModal';
import type { Collection, CollectionStats, UserNFTShare, CollectionWithShares } from '@/types';
import { 
  getAllCollections, 
  getUserOwnedCollections,
  getUserNFTShares,
  getCollectionStats,
  formatAddress as formatAddr,
  getExtendedNFTInfo,
  getCollectionsWithUserShares,
  getAllFractionalizedNFTs,
  isAllSharesWithOwner,
  addTokenToMetaMask
} from '@/utils/blockchain';

interface DashboardContentProps {
    session: Session;
}

export default function DashboardContent({ session }: DashboardContentProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [sharedCollections, setSharedCollections] = useState<CollectionWithShares[]>([]);
  const [userNFTShares, setUserNFTShares] = useState<UserNFTShare[]>([]);
  const [allFractionalizedNFTs, setAllFractionalizedNFTs] = useState<UserNFTShare[]>([]);
  const [collectionStats, setCollectionStats] = useState<{ [key: string]: CollectionStats }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shares' | 'marketplace'>('all');

  const walletAddress = session.walletAddress;
  
  // Debug logging
  console.log('🔍 DashboardContent session debug:', {
    session,
    walletAddress,
    user: session.user,
    userWalletAddress: session.user?.walletAddress
  });

  useEffect(() => {
    loadCollections();
  }, [walletAddress]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading collections for wallet:', walletAddress);
      
      // Load all collections and fractionalized NFTs in parallel
      const [collections, fractionalizedNFTs] = await Promise.all([
        getAllCollections(),
        getAllFractionalizedNFTs()
      ]);
      
      console.log('📚 Loaded', collections.length, 'total collections');
      console.log('🪙 Loaded', fractionalizedNFTs.length, 'total fractionalized NFTs');
      
      setAllCollections(collections);
      setAllFractionalizedNFTs(fractionalizedNFTs);

      // Load user-specific data if wallet is connected
      if (walletAddress) {
        console.log('👤 Loading user-specific data for:', walletAddress);
        
        // Use enhanced utility functions
        const [ownedCollections, nftShares, collectionsWithShares] = await Promise.all([
          getUserOwnedCollections(walletAddress),
          getUserNFTShares(walletAddress),
          getCollectionsWithUserShares(walletAddress)
        ]);

        console.log('🏠 User owned collections:', ownedCollections.length);
        console.log('📈 User NFT shares:', nftShares.length, nftShares);
        console.log('🤝 Collections with user shares:', collectionsWithShares.length);

        setUserCollections(ownedCollections);
        setUserNFTShares(nftShares);

        // Process shared collections with enhanced info
        console.log('⚙️ Processing shared collections...');
        await processSharedCollections(nftShares, collectionsWithShares);
      } else {
        console.log('❌ No wallet address available');
      }

      // Load stats for all collections
      console.log('📊 Loading collection stats...');
      const stats: { [key: string]: CollectionStats } = {};
      for (const collection of collections) {
        try {
          const collectionStat = await getCollectionStats(collection.collectionAddress);
          stats[collection.collectionAddress] = collectionStat;
        } catch (error) {
          console.error(`Error loading stats for collection ${collection.collectionId}:`, error);
        }
      }
      setCollectionStats(stats);
      console.log('✅ Collection loading complete');
    } catch (error) {
      console.error('❌ Error loading collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processSharedCollections = async (nftShares: UserNFTShare[], collectionsWithShares: Collection[]) => {
    console.log('🔄 processSharedCollections called with:', {
      nftSharesLength: nftShares.length,
      collectionsWithSharesLength: collectionsWithShares.length,
      walletAddress
    });

    if (!walletAddress) {
      console.log('❌ No wallet address, clearing shared collections');
      setSharedCollections([]);
      return;
    }

    if (nftShares.length === 0) {
      console.log('❌ No NFT shares found, clearing shared collections');
      setSharedCollections([]);
      return;
    }

    // Group NFT shares by collection
    console.log('📝 Grouping NFT shares by collection...');
    const sharesByCollection = nftShares.reduce((acc, share) => {
      const collectionId = share.collectionId;
      if (!acc[collectionId]) {
        acc[collectionId] = [];
      }
      acc[collectionId].push(share);
      return acc;
    }, {} as { [collectionId: number]: UserNFTShare[] });

    console.log('📊 Shares grouped by collection:', sharesByCollection);

    // Create collections with shares data and enhanced info
    const collectionsWithSharesData: CollectionWithShares[] = [];

    for (const collection of collectionsWithShares) {
      const shares = sharesByCollection[collection.collectionId] || [];
      console.log(`🔍 Processing collection ${collection.collectionId} with ${shares.length} shares`);
      
      if (shares.length > 0) {
        const totalUserShares = shares.reduce((sum, share) => sum + share.userShares, 0);
        console.log(`📊 Total user shares in collection ${collection.collectionId}: ${totalUserShares}`);
        
        // Get additional info about NFT ownership status and creator status
        const enhancedShares = await Promise.all(
          shares.map(async (share, index) => {
            console.log(`⚙️ Enhancing share ${index} for NFT #${share.tokenId}`);
            try {
              if (share.fractionalContract) {
                const [extendedInfo, allSharesWithOwner] = await Promise.all([
                  getExtendedNFTInfo(share.fractionalContract),
                  isAllSharesWithOwner(share.fractionalContract)
                ]);
                
                const enhanced = {
                  ...share,
                  creator: extendedInfo.creator,
                  currentOwner: extendedInfo.currentOwner,
                  isOwnershipTransferred: extendedInfo.creator !== extendedInfo.currentOwner,
                  allSharesWithCreator: allSharesWithOwner,
                  canBuyAll: allSharesWithOwner && extendedInfo.currentOwner.toLowerCase() !== walletAddress.toLowerCase()
                };
                
                console.log(`✅ Enhanced share for NFT #${share.tokenId}:`, {
                  userShares: enhanced.userShares,
                  totalShares: enhanced.totalShares,
                  isOwner: enhanced.isOwner,
                  isOwnershipTransferred: enhanced.isOwnershipTransferred,
                  creator: enhanced.creator,
                  currentOwner: enhanced.currentOwner
                });
                
                return enhanced;
              }
              return share;
            } catch (error) {
              console.warn(`❌ Failed to get extended info for NFT ${share.tokenId}:`, error);
              return share;
            }
          })
        );
        
        const collectionWithShares = {
          ...collection,
          userNFTShares: enhancedShares,
          totalUserShares
        };
        
        console.log(`✅ Added collection ${collection.collectionId} to shared collections`);
        collectionsWithSharesData.push(collectionWithShares);
      } else {
        console.log(`⚠️ No shares found for collection ${collection.collectionId}`);
      }
    }

    console.log('🎯 Final shared collections data:', collectionsWithSharesData);
    setSharedCollections(collectionsWithSharesData);
  };

  const handleCreateSuccess = (collectionId: number) => {
    loadCollections();
    router.push(`/collections/${collectionId}`);
  };

  const handleCollectionClick = (collectionId: number) => {
    router.push(`/collections/${collectionId}`);
  };

  const handleAddToMetaMask = async (fractionalContract: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await addTokenToMetaMask(fractionalContract);
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
    }
  };

  const formatAddress = (address: string) => {
    return formatAddr(address);
  };

  const getCollectionsToShow = () => {
    switch (activeTab) {
      case 'owned':
        return userCollections;
      case 'shares':
        return sharedCollections;
      case 'marketplace':
        // Show collections that have fractionalized NFTs that user doesn't own
        return allCollections.filter(collection => {
          const hasfractionalized = allFractionalizedNFTs.some(nft => nft.collectionId === collection.collectionId);
          const userOwnsCollection = walletAddress && collection.owner.toLowerCase() === walletAddress.toLowerCase();
          const userHasShares = userNFTShares.some(share => share.collectionId === collection.collectionId);
          return hasfractionalized && !userOwnsCollection && !userHasShares;
        });
      default:
        return allCollections;
    }
  };

  const collectionsToShow = getCollectionsToShow();

  // Calculate totals using the new data structures
  const totalUserNFTs = userCollections.reduce((acc, col) => {
    const stats = collectionStats[col.collectionAddress];
    return acc + (stats?.totalNFTs || 0);
  }, 0);

  const totalFractionalizedNFTs = userCollections.reduce((acc, col) => {
    const stats = collectionStats[col.collectionAddress];
    return acc + (stats?.fractionalizedNFTs || 0);
  }, 0);

  const totalSharedNFTs = userNFTShares.length;
  const totalMarketplaceNFTs = allFractionalizedNFTs.length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DashboardBackground />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <GlassPanel className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome to Xnfty
                </h1>
                <p className="text-blue-100">
                  Create and manage fractional ownership NFT collections
                </p>
                {walletAddress && (
                  <div className="flex items-center mt-2 text-blue-200">
                    <Wallet className="w-4 h-4 mr-2" />
                    <span className="text-sm">{formatAddress(walletAddress)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
                <button
                  onClick={loadCollections}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  title="Refresh all data"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Collection</span>
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <GlassPanel className="p-6">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-200">Total Collections</p>
                <p className="text-2xl font-bold text-white">{allCollections.length}</p>
              </div>
            </div>
          </GlassPanel>
          
          <GlassPanel className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-200">Your Collections</p>
                <p className="text-2xl font-bold text-white">{userCollections.length}</p>
              </div>
            </div>
          </GlassPanel>
          
          <GlassPanel className="p-6">
            <div className="flex items-center">
              <Share2 className="w-8 h-8 text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-200">Your NFTs</p>
                <p className="text-2xl font-bold text-white">{totalUserNFTs}</p>
              </div>
            </div>
          </GlassPanel>
          
          <GlassPanel className="p-6">
            <div className="flex items-center">
              <Coins className="w-8 h-8 text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-200">Your Shares</p>
                <p className="text-2xl font-bold text-white">{totalSharedNFTs}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-pink-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-pink-200">Marketplace NFTs</p>
                <p className="text-2xl font-bold text-white">{totalMarketplaceNFTs}</p>
              </div>
            </div>
          </GlassPanel>
        </div>
        
        {/* User Shares Summary - Only show if user has shares */}
        {walletAddress && userNFTShares.length > 0 && (
          <div className="mb-8">
            <UserSharesSummary userNFTShares={userNFTShares} />
          </div>
        )}
        
        {/* Collections Section */}
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Collections</h2>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'all'
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                All Collections
              </button>
              <button
                onClick={() => setActiveTab('owned')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'owned'
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Your Collections ({userCollections.length})
              </button>
              <button
                onClick={() => setActiveTab('shares')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'shares'
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Your Shares ({sharedCollections.length})
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'marketplace'
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Marketplace
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-blue-200 mt-4">Loading collections...</p>
            </div>
          ) : collectionsToShow.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-blue-200 mb-4">
                {activeTab === 'all' && 'No collections found.'}
                {activeTab === 'owned' && 'You haven\'t created any collections yet.'}
                {activeTab === 'shares' && 'You don\'t own shares in any collections yet.'}
                {activeTab === 'marketplace' && 'No NFTs available for purchase at the moment.'}
              </p>
              {(activeTab === 'owned' || activeTab === 'shares') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Create Your First Collection
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collectionsToShow.map((collection) => {
                const stats = collectionStats[collection.collectionAddress];
                const isSharedCollection = 'userNFTShares' in collection;
                const sharedCol = collection as CollectionWithShares;
                
                return (
                  <div
                    key={collection.collectionId}
                    onClick={() => handleCollectionClick(collection.collectionId)}
                    className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden cursor-pointer"
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
                      
                      {/* Enhanced Share Information for shared collections */}
                      {isSharedCollection && sharedCol.userNFTShares && (
                        <div className="mb-3 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-purple-300 font-medium">Your Shares</span>
                            <span className="text-purple-100 font-semibold">
                              {sharedCol.userNFTShares.length} NFT{sharedCol.userNFTShares.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {/* Show individual NFT share details */}
                          <div className="space-y-1 mb-2">
                            {sharedCol.userNFTShares.map((share: any, idx: number) => (
                              <div key={idx} className="text-xs text-purple-200 flex items-center justify-between">
                                <span>NFT #{share.tokenId}</span>
                                <span className={`font-medium ${
                                  share.isOwner || share.sharePercentage === 100 
                                    ? 'text-green-300' 
                                    : 'text-purple-200'
                                }`}>
                                  {share.userShares}/{share.totalShares} shares ({share.sharePercentage}%)
                                  {(share.isOwner || share.sharePercentage === 100) && (
                                    <span className="ml-1 text-yellow-300">👑</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {sharedCol.totalUserShares && (
                            <div className="text-xs text-purple-200 mb-2 border-t border-purple-500/30 pt-2">
                              <strong>Total: {sharedCol.totalUserShares} shares across {sharedCol.userNFTShares.length} NFTs</strong>
                            </div>
                          )}
                          
                          {/* Show ownership transfer status */}
                          {sharedCol.userNFTShares.some((share: any) => share.isOwner || share.sharePercentage === 100) && (
                            <div className="text-xs text-green-300 flex items-center mb-2">
                              <span className="mr-1">👑</span>
                              You own some NFTs completely!
                            </div>
                          )}
                          
                          {/* Show ownership and MetaMask options */}
                          {sharedCol.userNFTShares.some((share: any) => share.isOwnershipTransferred) && (
                            <div className="text-xs text-yellow-300 flex items-center mb-2">
                              <span className="mr-1">⚡</span>
                              Some NFTs have transferred ownership
                            </div>
                          )}
                          
                          {/* MetaMask token addition */}
                          <div className="flex flex-wrap gap-1">
                            {sharedCol.userNFTShares.slice(0, 3).map((share: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={(e) => handleAddToMetaMask(share.fractionalContract, e)}
                                className={`text-xs px-2 py-1 rounded flex items-center ${
                                  share.isOwner || share.sharePercentage === 100
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                                title={`Add NFT #${share.tokenId} to MetaMask (${share.sharePercentage}% owned)`}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                NFT #{share.tokenId}
                                {(share.isOwner || share.sharePercentage === 100) && (
                                  <span className="ml-1">👑</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-white/20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-300">
                            {isSharedCollection ? 'Collection Owner' : 'Owner'}
                          </span>
                          <span className="text-white">{formatAddress(collection.owner)}</span>
                        </div>
                        {walletAddress && collection.owner.toLowerCase() === walletAddress.toLowerCase() && (
                          <span className="inline-block mt-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Your Collection
                          </span>
                        )}
                        {isSharedCollection && (
                          <span className="inline-block mt-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                            Shared Ownership
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCollectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
} 