"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSession } from 'next-auth/react';
import NFTFormModal from './NFTFormModal';
import NFTCard from './NFTCard';
import { X } from 'lucide-react';
import factoryJson from '../utils/artifacts/contracts/CollectionFactory.sol/CollectionFactory.json';
import fractionalNftJson from '../utils/artifacts/contracts/FractionalNFT.sol/FractionalNFT.json';

// Remove the global declaration as it conflicts with existing types

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
      
      // Get factory contract
      const factoryAddress = process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS!;
      const factoryAbi = factoryJson.abi;
      
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

      // 3. Mint NFTs in the collection
      const collectionAbi = fractionalNftJson.abi;
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

      alert(`Collection "${collectionName}" deployed successfully with ${nfts.length} NFTs!`);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create NFT Collection</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Collection Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded dark:bg-gray-700"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Collection Description</label>
          <textarea
            className="w-full p-2 border rounded dark:bg-gray-700"
            rows={3}
            value={collectionDescription}
            onChange={(e) => setCollectionDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">NFTs in Collection</h3>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowNFTForm(true)}
              disabled={isLoading}
            >
              Add NFT
            </button>
          </div>
          
          {nfts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <p className="text-gray-600 dark:text-gray-400 text-center py-8 border rounded border-dashed">
              No NFTs added yet. Click "Add NFT" to create your first NFT.
            </p>
          )}
        </div>

        {deploymentProgress.status !== 'pending' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Deployment Progress</h3>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  deploymentProgress.status === 'error' 
                    ? 'bg-red-600' 
                    : deploymentProgress.status === 'complete'
                      ? 'bg-green-600'
                      : 'bg-blue-600'
                }`}
                style={{ width: `${(deploymentProgress.currentNft / deploymentProgress.total) * 100}%` }}
              />
            </div>
            <div className="text-sm mt-1 flex justify-between">
              <span>
                {deploymentProgress.status === 'deploying' && 'Deploying...'}
                {deploymentProgress.status === 'complete' && 'Deployment complete!'}
                {deploymentProgress.status === 'error' && 'Deployment failed!'}
              </span>
              <span>{deploymentProgress.currentNft} of {deploymentProgress.total} NFTs</span>
            </div>
            {deploymentProgress.error && (
              <p className="text-red-500 text-sm mt-1">{deploymentProgress.error}</p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDeployCollection}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading || !collectionName || nfts.length === 0}
          >
            {isLoading ? 'Deploying...' : 'Deploy Collection'}
          </button>
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