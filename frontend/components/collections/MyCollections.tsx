"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ethers } from 'ethers';
import GlassPanel from '@/components/dashboard/GlassPanel';
import FractionalNFTArtifact from '@/utils/artifacts/contracts/FractionalNFT.sol/FractionalNFT.json';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import GridBox from '@/components/ui/GridBox';
import EmptyState from '@/components/ui/EmptyState';
import IPFSGatewayURLConverter from '@/utils/ipfs-gateway';

interface NFTData {
  name: string;
  description?: string;
  metadataUri?: string;
  mintTxHash?: string;
  tokenId?: number;
  imagePreviewUrl?: string;
  owner?: string;
  totalShares?: number;
  availableShares?: number;
  pricePerShare?: string;
}

interface CollectionData {
  name: string;
  description?: string;
  address: string;
  nfts: NFTData[];
  createdAt: string;
  status?: string;
  txHash?: string;
  pendingTxHash?: string;
}

export default function MyCollections() {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollectionsFromLocalStorage = () => {
    try {
      // Get all keys from localStorage
      const keys = Object.keys(localStorage);
      
      // Filter keys that start with "collection_"
      const collectionKeys = keys.filter(key => key.startsWith('collection_'));
      
      // Parse and collect all collections
      const loadedCollections: CollectionData[] = [];
      
      collectionKeys.forEach(key => {
        try {
          const collectionData = JSON.parse(localStorage.getItem(key) || '');
          if (collectionData && collectionData.address) {
            loadedCollections.push(collectionData);
          }
        } catch (e) {
          console.error(`Error parsing collection data for key ${key}:`, e);
        }
      });
      
      return loadedCollections;
    } catch (e) {
      console.error("Error loading collections from localStorage:", e);
      return [];
    }
  };

  const loadCollectionNFTs = async (collection: CollectionData) => {
    if (!session?.walletAddress || !window.ethereum) {
      return collection;
    }

    try {
      // If the collection address is unknown (starts with "unknown_"), we can't fetch on-chain data
      if (collection.address.startsWith('unknown_')) {
        return collection;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const collectionContract = new ethers.Contract(
        collection.address,
        FractionalNFTArtifact.abi,
        provider
      );

      // Check if the user owns any tokens in this collection
      // Use batch balance checking or iterate through known token IDs
      const updatedNFTs = await Promise.all(collection.nfts.map(async (nft) => {
        try {
          // Skip NFTs without token IDs
          if (nft.tokenId === undefined) return nft;

          const balanceOf = await collectionContract.balanceOf(session.walletAddress, nft.tokenId);
          
          // If the user has a balance of this token, they own it
          if (balanceOf > 0) {
            // Fetch metadata if needed
            if (!nft.metadataUri && nft.tokenId !== undefined) {
              try {
                const uri = await collectionContract.uri(nft.tokenId);
                nft.metadataUri = uri;
                
                // Try to fetch the actual metadata from IPFS
                if (uri) {
                  const httpUrl = IPFSGatewayURLConverter(uri);
                  const response = await fetch(httpUrl);
                  if (response.ok) {
                    const metadata = await response.json();
                    nft.name = metadata.name || nft.name;
                    nft.description = metadata.description;
                    
                    // Set image preview URL if available
                    if (metadata.image) {
                      nft.imagePreviewUrl = IPFSGatewayURLConverter(metadata.image);
                    }
                  }
                }
              } catch (err) {
                console.error(`Error fetching metadata for token ${nft.tokenId}:`, err);
              }
            }
            
            // Try to fetch fractional data
            try {
              const fractionalData = await collectionContract.getFractionalTokenData(nft.tokenId);
              nft.totalShares = fractionalData.totalShares ? Number(fractionalData.totalShares) : undefined;
              nft.availableShares = fractionalData.availableShares ? Number(fractionalData.availableShares) : undefined;
              nft.pricePerShare = fractionalData.pricePerShare ? ethers.formatEther(fractionalData.pricePerShare) : undefined;
            } catch (err) {
              console.error(`Error fetching fractional data for token ${nft.tokenId}:`, err);
            }
            
            return {
              ...nft,
              owner: session.walletAddress
            };
          }
          return nft;
        } catch (e) {
          console.error(`Error checking ownership for NFT ${nft.name}:`, e);
          return nft;
        }
      }));

      return {
        ...collection,
        nfts: updatedNFTs
      };
    } catch (e) {
      console.error(`Error loading NFTs for collection ${collection.address}:`, e);
      return collection;
    }
  };

  // Function to fetch collections owned by the user from blockchain
  const scanForUserNFTs = async () => {
    if (!session?.walletAddress || !window.ethereum) {
      console.log("No wallet connected or ethereum provider");
      return [];
    }

    try {
      // Here we would scan for all NFTs owned by the user across all collections
      // For now, we'll leave this as a placeholder for future implementation
      return [];
    } catch (e) {
      console.error("Error scanning for user NFTs:", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        
        // Load collections from localStorage
        const storageCollections = loadCollectionsFromLocalStorage();
        
        // Check if we have a connected wallet
        if (session?.walletAddress) {
          // Enrich collection data with on-chain information
          const enrichedCollections = await Promise.all(
            storageCollections.map(loadCollectionNFTs)
          );
          
          // Sort collections by creation date (newest first)
          const sortedCollections = enrichedCollections.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setCollections(sortedCollections);
        } else {
          // If no wallet is connected, just show the basic data from localStorage
          setCollections(storageCollections);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching collections:", err);
        setError("Failed to load collections. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [session?.walletAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <EmptyState
        title="No Collections Found"
        description="You haven't created any NFT collections yet or the data couldn't be loaded."
        action={
          <Link href="/deploy">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
              Create Your First Collection
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {collections.map((collection) => (
        <div key={collection.address} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{collection.name}</h2>
              {collection.description && (
                <p className="text-gray-400">{collection.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {collection.address.startsWith('unknown_')
                  ? 'Collection address unknown, track by transaction hash:'
                  : 'Collection address:'}{' '}
                <a
                  href={`https://sepolia.etherscan.io/${collection.address.startsWith('unknown_') 
                    ? 'tx/' + collection.address.replace('unknown_', '') 
                    : 'address/' + collection.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline break-all"
                >
                  {collection.address.startsWith('unknown_') 
                    ? collection.address.replace('unknown_', '') 
                    : collection.address}
                </a>
              </p>
              {collection.status === 'pending' && (
                <p className="text-amber-400 mt-1">
                  This collection is currently being deployed. Check the transaction status{' '}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${collection.pendingTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    here
                  </a>.
                </p>
              )}
            </div>
            <Link href={`/collections/${collection.address}`}>
              <Button variant="outline" className="text-cyan-400 border-cyan-400 hover:bg-cyan-950">
                View Details
              </Button>
            </Link>
          </div>

          {collection.nfts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collection.nfts.map((nft, index) => (
                <GridBox key={`${nft.tokenId || index}`}>
                  <div className="p-3 h-full flex flex-col">
                    <div className="relative w-full h-40 rounded-md overflow-hidden mb-3">
                      {nft.imagePreviewUrl ? (
                        <Image
                          src={nft.imagePreviewUrl}
                          alt={nft.name}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      {nft.owner === session?.walletAddress && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-md text-xs">
                          You Own This
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-lg text-white mb-1">{nft.name}</h3>
                    {nft.description && (
                      <p className="text-gray-400 text-sm mb-2 flex-grow">
                        {nft.description.length > 100
                          ? `${nft.description.substring(0, 100)}...`
                          : nft.description}
                      </p>
                    )}
                    {nft.tokenId !== undefined && (
                      <p className="text-gray-500 text-xs">Token ID: {nft.tokenId}</p>
                    )}
                    {nft.totalShares && nft.pricePerShare && (
                      <div className="mt-auto pt-2 border-t border-gray-700 text-xs">
                        <p className="text-cyan-400">
                          {nft.availableShares}/{nft.totalShares} shares available
                        </p>
                        <p className="text-gray-400">
                          Price per share: {nft.pricePerShare} ETH
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      <Link href={`/collections/${collection.address}/nft/${nft.tokenId || index}`}>
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                          View NFT
                        </Button>
                      </Link>
                    </div>
                  </div>
                </GridBox>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-900 rounded-lg">
              <p className="text-gray-400">No NFTs found in this collection</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 