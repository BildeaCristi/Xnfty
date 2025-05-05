"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSession } from 'next-auth/react';
import { X, Plus, ArrowRight, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/dashboard/GlassPanel';
import NFTFormModal from './NFTFormModal';
import NFTCard from './NFTCard';
import CollectionFactoryArtifact from '@/utils/artifacts/contracts/CollectionFactory.sol/CollectionFactory.json';
import FractionalNFTArtifact from '@/utils/artifacts/contracts/FractionalNFT.sol/FractionalNFT.json';

interface NFTData {
  id?: number;
  name: string;
  description: string;
  image: File | null;
  imagePreviewUrl?: string;
  traits: { trait_type: string; value: string }[];
  isFractional: boolean;
  totalShares?: number;
  pricePerShare?: number;
  price?: number;
  metadataUri?: string;
}

interface CollectionDetailsModalProps {
  onClose: () => void;
}

const CollectionDetailsModal: React.FC<CollectionDetailsModalProps> = ({ onClose }) => {
  const { data: session } = useSession();
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [showNFTForm, setShowNFTForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState<{
    currentNft: number;
    total: number;
    status: 'pending' | 'deploying' | 'complete' | 'error';
    error?: string;
  }>({ currentNft: 0, total: 0, status: 'pending' });

  const handleAddNFT = (nftData: NFTData) => {
    // Create a local object URL for the image preview
    let imagePreviewUrl = '';
    if (nftData.image) {
      imagePreviewUrl = URL.createObjectURL(nftData.image);
    }

    setNfts([...nfts, { ...nftData, imagePreviewUrl, id: nfts.length }]);
    setShowNFTForm(false);
  };

  const handleRemoveNFT = (id: number) => {
    setNfts(nfts.filter(nft => nft.id !== id));
  };

  const handleDeployCollection = async () => {
    if (!session?.user?.walletAddress) {
      alert('Please connect your wallet');
      return;
    }

    if (!collectionName || nfts.length === 0) {
      alert('Please provide a collection name and add at least one NFT');
      return;
    }

    setIsLoading(true);
    setDeploymentProgress({
      currentNft: 0,
      total: nfts.length,
      status: 'deploying'
    });

    try {
      // Check for ethereum provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("No Ethereum wallet detected. Please install MetaMask or another Ethereum wallet.");
      }
      
      // Create provider with window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get factory contract using the full ABI
      const factoryAddress = process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS!;
      const factoryAbi = CollectionFactoryArtifact.abi;
      
      const factory = new ethers.Contract(factoryAddress, factoryAbi, signer);

      // Deploy new collection
      const tx = await factory.createCollection(collectionName, collectionDescription);
      const receipt = await tx.wait();
      
      // Extract collection address from event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((event: any) => event && event.name === "CollectionDeployed");
      
      if (!event) {
        throw new Error("Failed to get collection address from event");
      }
      
      const collectionAddress = event.args.collectionAddress;

      // Mint NFTs in the collection using the full ABI
      const collectionAbi = FractionalNFTArtifact.abi;
      const collection = new ethers.Contract(collectionAddress, collectionAbi, signer);

      // Deploy each NFT, one by one
      for (let i = 0; i < nfts.length; i++) {
        const nft = nfts[i];
        setDeploymentProgress({
          currentNft: i + 1,
          total: nfts.length,
          status: 'deploying'
        });

        // First, upload the image and metadata if not already done
        if (!nft.metadataUri) {
          // Upload image to Pinata
          const formData = new FormData();
          formData.append('file', nft.image!);

          const pinataResponse = await fetch('/api/pinata/upload', {
            method: 'POST',
            body: formData,
          });

          if (!pinataResponse.ok) {
            throw new Error(`Failed to upload image for NFT ${nft.name}`);
          }

          const { IpfsHash: imageHash } = await pinataResponse.json();
          const imageUri = `ipfs://${imageHash}`;

          // Create and upload metadata
          const metadata = {
            name: nft.name,
            description: nft.description,
            image: imageUri,
            attributes: nft.traits.filter(trait => trait.trait_type && trait.value),
          };

          const metadataResponse = await fetch('/api/pinata/uploadJson', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
          });

          if (!metadataResponse.ok) {
            throw new Error(`Failed to upload metadata for NFT ${nft.name}`);
          }

          const { IpfsHash: metadataHash } = await metadataResponse.json();
          nft.metadataUri = `ipfs://${metadataHash}`;
        }

        // Deploy the NFT
        if (nft.isFractional) {
          await collection.createFractionalNFT(
            nft.totalShares!,
            ethers.parseEther(nft.pricePerShare!.toString()),
            nft.metadataUri
          );
        } else {
          // For non-fractional NFTs, we still use the fractional NFT contract but with 10 shares
          const pricePerShare = nft.price! / 10; // Divide the total price by 10 shares
          await collection.createFractionalNFT(
            10, // Default to 10 shares for non-fractional (as per requirements)
            ethers.parseEther(pricePerShare.toString()), // Price per fraction
            nft.metadataUri
          );
        }
      }

      setDeploymentProgress({
        currentNft: nfts.length,
        total: nfts.length,
        status: 'complete'
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error deploying collection:', error);
      setDeploymentProgress({
        ...deploymentProgress,
        status: 'error',
        error: error.message || 'Error deploying collection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      nfts.forEach(nft => {
        if (nft.imagePreviewUrl) {
          URL.revokeObjectURL(nft.imagePreviewUrl);
        }
      });
    };
  }, []);

  // Add useEffect hook to disable body scrolling when modal is open
  useEffect(() => {
    // Disable scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-gradient-to-br from-gray-900/90 to-purple-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-lg shadow-cyan-500/20 flex flex-col">
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
              Create NFT Collection
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-cyan-300 hover:text-cyan-100 transition-colors focus:outline-none"
              disabled={isLoading}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-1 sm:mb-2">Collection Name</label>
                <input
                  type="text"
                  className="w-full p-2 sm:p-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/60"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  disabled={isLoading}
                  placeholder="My Amazing Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-1 sm:mb-2">Collection Description</label>
                <textarea
                  className="w-full p-2 sm:p-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/60"
                  rows={3}
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  disabled={isLoading}
                  placeholder="Describe your NFT collection"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-medium text-cyan-200">NFTs in Collection</h3>
                <button
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-400/80 hover:to-purple-500/80 
                  text-white font-medium transition-all duration-300 backdrop-blur-sm border border-cyan-400/30 
                  shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_15px_rgba(0,255,255,0.5)]
                  flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                  onClick={() => setShowNFTForm(true)}
                  disabled={isLoading}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Add NFT
                </button>
              </div>
              
              {nfts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {nfts.map((nft) => (
                    <NFTCard 
                      key={nft.id}
                      nft={nft}
                      onRemove={() => handleRemoveNFT(nft.id!)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              ) : (
                <GlassPanel className="flex flex-col items-center justify-center p-6 sm:p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-3">
                    <Plus className="w-8 h-8 text-cyan-300" />
                  </div>
                  <p className="text-cyan-200 text-base sm:text-lg mb-2">No NFTs added yet</p>
                  <p className="text-cyan-200/60 text-sm mb-4 sm:mb-6">Add your first NFT to get started</p>
                  <button
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-400/80 hover:to-purple-500/80 
                    text-white font-medium transition-all duration-300 backdrop-blur-sm border border-cyan-400/30 text-sm sm:text-base"
                    onClick={() => setShowNFTForm(true)}
                  >
                    Add NFT
                  </button>
                </GlassPanel>
              )}
            </div>

            {deploymentProgress.status !== 'pending' && (
              <GlassPanel className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-cyan-200 mb-1 sm:mb-2">Deployment Progress</h3>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-black/30 text-cyan-200">
                        {deploymentProgress.status === 'deploying' && 'Deploying...'}
                        {deploymentProgress.status === 'complete' && 'Deployment complete!'}
                        {deploymentProgress.status === 'error' && 'Deployment failed!'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-cyan-200">
                        {Math.round((deploymentProgress.currentNft / deploymentProgress.total) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-3 text-xs flex rounded bg-black/30">
                    <div 
                      style={{ width: `${(deploymentProgress.currentNft / deploymentProgress.total) * 100}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        deploymentProgress.status === 'error' 
                          ? 'bg-red-500' 
                          : deploymentProgress.status === 'complete'
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-cyan-200/70">
                    <span>{deploymentProgress.currentNft} of {deploymentProgress.total} NFTs</span>
                    {deploymentProgress.status === 'complete' && (
                      <span className="text-green-400">Collection deployed successfully!</span>
                    )}
                  </div>
                </div>
                {deploymentProgress.error && (
                  <div className="p-2 sm:p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200 text-xs sm:text-sm">
                    {deploymentProgress.error}
                  </div>
                )}
              </GlassPanel>
            )}

            <div className="flex justify-end gap-3 sm:gap-4 pt-3 sm:pt-4">
              <button
                onClick={onClose}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black/30 border border-gray-500/30 text-gray-300 rounded-lg hover:bg-black/50 disabled:opacity-50 transition-colors text-sm sm:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeployCollection}
                className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-400/80 hover:to-purple-500/80 
                text-white font-medium transition-all duration-300 backdrop-blur-sm border border-cyan-400/30 
                shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_15px_rgba(0,255,255,0.5)]
                flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 text-sm sm:text-base"
                disabled={isLoading || !collectionName || nfts.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    Deploy Collection
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {showNFTForm && (
          <NFTFormModal
            onSave={handleAddNFT}
            onCancel={() => setShowNFTForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CollectionDetailsModal; 