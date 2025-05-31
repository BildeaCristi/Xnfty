'use client';

import { useState, useEffect } from 'react';
import { Plus, Share2, Users, TrendingUp, Eye, Upload, Loader2, X, Coins, ShoppingCart, Trash2 } from 'lucide-react';
import { 
  getCollection, 
  getCollectionNFTs, 
  getCollectionStats,
  mintNFT,
  fractionalizeNFT,
  buyNFTShares,
  getNFTShareHolders,
  getFractionalNFTInfo,
  formatAddress,
  getAvailableSharesForBuyer,
  getExtendedNFTInfo
} from '@/utils/blockchain';
import type { Collection, NFT, CollectionStats, ShareHolder, FractionalNFTInfo } from '@/types';
import { uploadFileToIPFS, uploadNFTMetadata, createNFTMetadata } from '@/utils/ipfs';
import { useNotifications } from '@/components/notifications/NotificationContext';

interface CollectionManagerProps {
  collectionId: number;
  userAddress?: string;
  onClose: () => void;
}

interface NFTFormData {
  name: string;
  description: string;
  image: File | null;
  attributes: Array<{ trait_type: string; value: string }>;
}

interface FractionalizeFormData {
  totalShares: number;
  sharePrice: string;
  fractionalName: string;
  fractionalSymbol: string;
}

export default function CollectionManager({ collectionId, userAddress, onClose }: CollectionManagerProps) {
  const { showSuccess, showError, showWarning, showInfo, confirm } = useNotifications();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'nfts' | 'fractionalized'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddNFT, setShowAddNFT] = useState(false);
  const [showFractionalize, setShowFractionalize] = useState(false);
  const [showBuyShares, setShowBuyShares] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedFractionalInfo, setSelectedFractionalInfo] = useState<(FractionalNFTInfo & { creator?: string }) | null>(null);
  const [shareHolders, setShareHolders] = useState<ShareHolder[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [availableShares, setAvailableShares] = useState<number>(0);
  const [maxAffordableShares, setMaxAffordableShares] = useState<number>(0);

  // NFT Form State
  const [nftForm, setNftForm] = useState<NFTFormData>({
    name: '',
    description: '',
    image: null,
    attributes: []
  });
  const [nftImagePreview, setNftImagePreview] = useState<string>('');
  const [isMinting, setIsMinting] = useState(false);

  // Fractionalize Form State
  const [fractionalizeForm, setFractionalizeForm] = useState<FractionalizeFormData>({
    totalShares: 10,
    sharePrice: '0.0001',
    fractionalName: '',
    fractionalSymbol: ''
  });
  const [isFractionalizing, setIsFractionalizing] = useState(false);

  // Share Purchase State
  const [shareAmount, setShareAmount] = useState<number>(1);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    loadCollectionData();
  }, [collectionId]);

  useEffect(() => {
    if (collection && userAddress) {
      setIsOwner(collection.owner.toLowerCase() === userAddress.toLowerCase());
    }
  }, [collection, userAddress]);

  const loadCollectionData = async () => {
    try {
      setIsLoading(true);
      
      // First get collection data
      const collectionData = await getCollection(collectionId);
      setCollection(collectionData);
      
      // Then get NFTs and stats using the collection address
      const [nftsData, statsData] = await Promise.all([
        getCollectionNFTs(collectionData.collectionAddress),
        getCollectionStats(collectionData.collectionAddress)
      ]);

      setNFTs(nftsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading collection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNFTImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNftForm({ ...nftForm, image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setNftImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setNftForm({
      ...nftForm,
      attributes: [...nftForm.attributes, { trait_type: '', value: '' }]
    });
  };

  const removeAttribute = (index: number) => {
    setNftForm({
      ...nftForm,
      attributes: nftForm.attributes.filter((_, i) => i !== index)
    });
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...nftForm.attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setNftForm({ ...nftForm, attributes: newAttributes });
  };

  const handleMintNFT = async () => {
    if (!nftForm.name || !nftForm.description || !nftForm.image) {
      showWarning('Incomplete form', 'Please fill in all required fields');
      return;
    }

    // Ask for confirmation
    const shouldMint = await confirm({
      title: 'Mint NFT?',
      message: `You are about to mint "${nftForm.name}" to the collection. This will cost gas fees.`,
      confirmText: 'Mint NFT',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!shouldMint) return;

    setIsMinting(true);
    try {
      const { metadataUrl } = await uploadNFTMetadata(
        nftForm.name,
        nftForm.description,
        nftForm.image,
        nftForm.attributes
      );

      const result = await mintNFT(collection?.collectionAddress || '', metadataUrl);
      showSuccess('NFT minted successfully', `Token ID: ${result.tokenId}`);
      
      setNftForm({ name: '', description: '', image: null, attributes: [] });
      setShowAddNFT(false);
      await loadCollectionData();
    } catch (error) {
      console.error('Error minting NFT:', error);
      showError('Minting failed', 'Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const handleFractionalizeNFT = async () => {
    if (!selectedNFT || !fractionalizeForm.fractionalName || !fractionalizeForm.fractionalSymbol) {
      showWarning('Incomplete form', 'Please fill in all required fields');
      return;
    }

    // Ask for confirmation
    const shouldFractionalize = await confirm({
      title: 'Fractionalize NFT?',
      message: `You are about to fractionalize NFT #${selectedNFT.tokenId} into ${fractionalizeForm.totalShares} shares at ${fractionalizeForm.sharePrice} ETH each. This cannot be undone.`,
      confirmText: 'Fractionalize',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!shouldFractionalize) return;

    setIsFractionalizing(true);
    try {
      await fractionalizeNFT(
        collection?.collectionAddress || '',
        selectedNFT.tokenId,
        fractionalizeForm.totalShares,
        fractionalizeForm.sharePrice,
        fractionalizeForm.fractionalName,
        fractionalizeForm.fractionalSymbol
      );

      showSuccess('NFT fractionalized successfully', 'Fractional ownership contract created');
      setShowFractionalize(false);
      await loadCollectionData();
    } catch (error) {
      console.error('Error fractionalizing NFT:', error);
      showError('Fractionalization failed', 'Failed to fractionalize NFT. Please try again.');
    } finally {
      setIsFractionalizing(false);
    }
  };

  const handleBuyShares = async () => {
    if (!selectedFractionalInfo || shareAmount <= 0) {
      showWarning('Invalid amount', 'Please enter a valid share amount');
      return;
    }

    if (shareAmount > availableShares) {
      showWarning('Not enough shares', `Only ${availableShares} shares are available for purchase.`);
      return;
    }

    if (shareAmount > maxAffordableShares) {
      showWarning('Insufficient balance', `You can only afford ${maxAffordableShares} shares with your current balance.`);
      return;
    }

    const totalCost = parseFloat(selectedFractionalInfo.sharePrice) * shareAmount;
    const confirmed = await confirm({
      title: 'Buy Shares?',
      message: `You are about to buy ${shareAmount} share${shareAmount > 1 ? 's' : ''} for ${totalCost.toFixed(4)} ETH.`,
      confirmText: 'Buy Shares',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!confirmed) return;

    setIsBuying(true);
    try {
      const txHash = await buyNFTShares(selectedNFT?.fractionalContract || '', shareAmount, selectedFractionalInfo.sharePrice);
      await loadShareHolders();
      await loadAvailableShares(); // Refresh available shares
      setShowBuyShares(false);
      setShareAmount(1);
      showSuccess('Shares purchased successfully', `${shareAmount} share${shareAmount > 1 ? 's' : ''} purchased! Transaction: ${txHash.substring(0, 10)}...`);
    } catch (error) {
      console.error('Error buying shares:', error);
      let errorMessage = 'Failed to buy shares. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled by user.';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to complete the transaction.';
        } else if (error.message.includes('No shares available')) {
          errorMessage = 'No shares are currently available for purchase.';
        } else if (error.message.includes('transfer amount exceeds balance')) {
          errorMessage = 'Share transfer failed. The seller may not have enough shares.';
        }
      }
      
      showError('Purchase failed', errorMessage);
    } finally {
      setIsBuying(false);
    }
  };

  const loadAvailableShares = async () => {
    if (!selectedNFT?.fractionalContract || !userAddress) return;

    try {
      // Get available shares for this specific buyer
      const available = await getAvailableSharesForBuyer(selectedNFT.fractionalContract, userAddress);
      setAvailableShares(available);

      // Get user's ETH balance to calculate max affordable shares
      const { getSigner } = await import('@/utils/blockchain');
      const signer = await getSigner();
      if (signer.provider && selectedFractionalInfo) {
        const balance = await signer.provider.getBalance(userAddress);
        const balanceInEth = Number(balance) / 1e18;
        const sharePriceEth = parseFloat(selectedFractionalInfo.sharePrice);
        const maxAffordable = Math.floor(balanceInEth / sharePriceEth);
        setMaxAffordableShares(Math.min(available, maxAffordable));
      }
    } catch (error) {
      console.error('Error loading available shares:', error);
    }
  };

  const loadShareHolders = async () => {
    if (selectedNFT?.fractionalContract) {
      try {
        const holders = await getNFTShareHolders(selectedNFT.fractionalContract);
        setShareHolders(holders);
      } catch (error) {
        console.error('Error loading share holders:', error);
      }
    }
  };

  const openFractionalizeModal = (nft: NFT) => {
    setSelectedNFT(nft);
    setFractionalizeForm({
      ...fractionalizeForm,
      fractionalName: `${nft.name} Shares`,
      fractionalSymbol: `${nft.name?.substring(0, 3).toUpperCase()}SHR`
    });
    setShowFractionalize(true);
  };

  const openBuySharesModal = async (nft: NFT) => {
    setSelectedNFT(nft);
    try {
      // Load both basic fractional info and extended info
      const [fractionalInfo, extendedInfo] = await Promise.all([
        getFractionalNFTInfo(nft.fractionalContract),
        getExtendedNFTInfo(nft.fractionalContract)
      ]);
      
      // Create extended fractional info object
      const extendedFractionalInfo: FractionalNFTInfo & { creator?: string } = {
        ...fractionalInfo,
        creator: extendedInfo.creator
      };
      
      setSelectedFractionalInfo(extendedFractionalInfo);
      
      await loadShareHolders();
      await loadAvailableShares();
      setShowBuyShares(true);
    } catch (error) {
      console.error('Error loading fractional info:', error);
      showError('Loading error', 'Failed to load NFT share information');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          <p className="text-center mt-4 text-white">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
          <p className="text-center text-white">Collection not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  const fractionalizedNFTs = nfts.filter(nft => nft.isfractionalized);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <img
              src={collection.imageURI}
              alt={collection.name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-600"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{collection.name}</h2>
              <p className="text-gray-400">{collection.symbol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {['overview', 'nfts', 'fractionalized'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800">
                    <div className="flex items-center">
                      <Eye className="w-8 h-8 text-blue-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-300">Total NFTs</p>
                        <p className="text-2xl font-bold text-white">{stats.totalNFTs}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-900/20 p-4 rounded-lg border border-green-800">
                    <div className="flex items-center">
                      <Coins className="w-8 h-8 text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-300">Fractionalized</p>
                        <p className="text-2xl font-bold text-white">{stats.fractionalizedNFTs}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-800">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-purple-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-300">Owner</p>
                        <p className="text-sm font-bold text-white">{formatAddress(stats.currentOwner)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300">{collection.description}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                {isOwner && (
                  <button
                    onClick={() => setShowAddNFT(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add NFT</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'nfts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">All NFTs ({nfts.length})</h3>
                {isOwner && (
                  <button
                    onClick={() => setShowAddNFT(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add NFT</span>
                  </button>
                )}
              </div>

              {nfts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50">
                  <p className="text-gray-400">No NFTs in this collection yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nfts.map((nft) => (
                    <div key={nft.tokenId} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50">
                      <img
                        src={nft.imageURI}
                        alt={nft.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="font-semibold text-white">{nft.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">{nft.description}</p>
                        <p className="text-xs text-gray-500 mt-2">Token ID: {nft.tokenId}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs rounded ${
                            nft.isfractionalized 
                              ? 'bg-green-900/20 text-green-300 border border-green-800' 
                              : 'bg-gray-700 text-gray-300'
                          }`}>
                            {nft.isfractionalized ? 'Fractionalized' : 'Whole NFT'}
                          </span>
                          
                          {isOwner && !nft.isfractionalized && (
                            <button
                              onClick={() => openFractionalizeModal(nft)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Fractionalize
                            </button>
                          )}
                          
                          {nft.isfractionalized && (
                            <button
                              onClick={() => openBuySharesModal(nft)}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              View Shares
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fractionalized' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Fractionalized NFTs ({fractionalizedNFTs.length})</h3>
              </div>

              {fractionalizedNFTs.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50">
                  <p className="text-gray-400">No fractionalized NFTs yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fractionalizedNFTs.map((nft) => (
                    <div key={nft.tokenId} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50">
                      <div className="flex">
                        <img
                          src={nft.imageURI}
                          alt={nft.name}
                          className="w-32 h-32 object-cover"
                        />
                        <div className="p-4 flex-1">
                          <h4 className="font-semibold text-white">{nft.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{nft.description}</p>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Token ID:</span>
                              <span className="text-white">{nft.tokenId}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Status:</span>
                              <span className="text-green-300">Fractionalized</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => openBuySharesModal(nft)}
                            className="mt-3 w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            View/Buy Shares
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add NFT Modal */}
        {showAddNFT && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-bold text-white">Add NFT to Collection</h3>
                <button
                  onClick={() => setShowAddNFT(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* NFT Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      NFT Image *
                    </label>
                    <div className="flex items-center space-x-4">
                      {nftImagePreview ? (
                        <img
                          src={nftImagePreview}
                          alt="NFT preview"
                          className="w-24 h-24 object-cover rounded-lg border-2 border-gray-600"
                        />
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800">
                          <Upload className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNFTImageUpload}
                          className="hidden"
                          id="nft-image"
                        />
                        <label
                          htmlFor="nft-image"
                          className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Upload Image
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* NFT Details */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        value={nftForm.name}
                        onChange={(e) => setNftForm({ ...nftForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="NFT Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={nftForm.description}
                        onChange={(e) => setNftForm({ ...nftForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="NFT Description"
                      />
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Attributes (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={addAttribute}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        + Add Attribute
                      </button>
                    </div>
                    
                    {nftForm.attributes.map((attr, index) => (
                      <div key={index} className="flex items-center space-x-3 mb-2">
                        <input
                          value={attr.trait_type}
                          onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          placeholder="Trait Type"
                        />
                        <input
                          value={attr.value}
                          onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          placeholder="Value"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setShowAddNFT(false)}
                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                    disabled={isMinting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMintNFT}
                    disabled={isMinting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isMinting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isMinting ? 'Minting...' : 'Mint NFT'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fractionalize NFT Modal */}
        {showFractionalize && selectedNFT && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h3 className="text-xl font-bold text-white">Fractionalize NFT</h3>
                <button
                  onClick={() => setShowFractionalize(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                    <img
                      src={selectedNFT.imageURI}
                      alt={selectedNFT.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-white">{selectedNFT.name}</p>
                      <p className="text-sm text-gray-400">Token ID: {selectedNFT.tokenId}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total Shares
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={fractionalizeForm.totalShares}
                      onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, totalShares: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Share Price (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={fractionalizeForm.sharePrice}
                      onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, sharePrice: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fractional Token Name
                    </label>
                    <input
                      value={fractionalizeForm.fractionalName}
                      onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, fractionalName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="e.g., My NFT Shares"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fractional Token Symbol
                    </label>
                    <input
                      value={fractionalizeForm.fractionalSymbol}
                      onChange={(e) => setFractionalizeForm({ ...fractionalizeForm, fractionalSymbol: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="e.g., MNFTSHR"
                    />
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Value:</span>
                      <span className="text-white">{(fractionalizeForm.totalShares * parseFloat(fractionalizeForm.sharePrice || '0')).toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowFractionalize(false)}
                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                    disabled={isFractionalizing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFractionalizeNFT}
                    disabled={isFractionalizing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isFractionalizing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isFractionalizing ? 'Fractionalizing...' : 'Fractionalize'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buy Shares Modal */}
        {showBuyShares && selectedNFT && selectedFractionalInfo && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Buy NFT Shares</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-gray-400">NFT:</span>
                  <span className="text-white ml-2">{selectedNFT.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Price per Share:</span>
                  <span className="text-white ml-2">{selectedFractionalInfo.sharePrice} ETH</span>
                </div>
                <div>
                  <span className="text-gray-400">Available for Purchase:</span>
                  <span className="text-green-400 ml-2 font-semibold">{availableShares} shares</span>
                </div>
                {maxAffordableShares < availableShares && (
                  <div>
                    <span className="text-gray-400">You can afford:</span>
                    <span className="text-yellow-400 ml-2 font-semibold">{maxAffordableShares} shares</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Shares
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.min(availableShares, maxAffordableShares) || 1000}
                  value={shareAmount}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Allow empty input while typing
                    if (inputValue === '') {
                      setShareAmount(1);
                      return;
                    }
                    
                    const numValue = parseInt(inputValue);
                    if (!isNaN(numValue) && numValue > 0) {
                      setShareAmount(numValue);
                    }
                  }}
                  onBlur={() => {
                    // Apply constraints when user finishes typing
                    const maxAllowed = Math.min(availableShares, maxAffordableShares);
                    if (shareAmount < 1) {
                      setShareAmount(1);
                    } else if (maxAllowed > 0 && shareAmount > maxAllowed) {
                      setShareAmount(maxAllowed);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
                <div className="text-sm text-gray-400 mt-1">
                  Total cost: {(shareAmount * parseFloat(selectedFractionalInfo.sharePrice)).toFixed(4)} ETH
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBuyShares(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuyShares}
                  disabled={isBuying || shareAmount <= 0 || shareAmount > availableShares || shareAmount > maxAffordableShares}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Buying...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Buy Shares</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 