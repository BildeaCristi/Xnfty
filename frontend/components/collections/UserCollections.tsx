"use client";

import React, {useEffect, useState} from 'react';
import {useSession} from 'next-auth/react';
import {ethers} from 'ethers';
import Image from 'next/image';
import Link from 'next/link';
import GridBox from '@/components/shared/GridBox';
import EmptyState from '@/components/shared/EmptyState';
import {convertIpfsUriToHttpUri} from '@/services/IpfsService';
import {Button} from '@headlessui/react';
import {getFractionalNFTContract} from "@/services/BlockchainService";

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

export default function UserCollections() {
    const {data: session} = useSession();
    const [collections, setCollections] = useState<CollectionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCollectionsFromLocalStorage = () => {
        try {
            const keys = Object.keys(localStorage);

            const collectionKeys = keys.filter(key => key.startsWith('collection_'));

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
            if (collection.address.startsWith('unknown_')) {
                return collection;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const collectionContract = getFractionalNFTContract(collection.address, provider);

            const updatedNFTs = await Promise.all(collection.nfts.map(async (nft) => {
                try {
                    // Skip NFTs without token IDs
                    if (nft.tokenId === undefined) return nft;

                    const balanceOf = await collectionContract.balanceOf(session.walletAddress, nft.tokenId);

                    // If the user has a balance of this token, they own it
                    if (balanceOf > 0) {
                        if (!nft.metadataUri && nft.tokenId !== undefined) {
                            try {
                                const uri = await collectionContract.uri(nft.tokenId);
                                nft.metadataUri = uri;

                                if (uri) {
                                    const httpUrl = convertIpfsUriToHttpUri(uri);
                                    const response = await fetch(httpUrl);
                                    if (response.ok) {
                                        const metadata = await response.json();
                                        nft.name = metadata.name || nft.name;
                                        nft.description = metadata.description;

                                        // Set image preview URL if available
                                        if (metadata.image) {
                                            nft.imagePreviewUrl = convertIpfsUriToHttpUri(metadata.image);
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error(`Error fetching metadata for token ${nft.tokenId}:`, err);
                            }
                        }

                        try {
                            const fractionalData = await collectionContract.getFractionalTokenData(nft.tokenId);
                            nft.totalShares = fractionalData.totalShares ? Number(fractionalData.totalShares) : undefined;
                            nft.availableShares = fractionalData.availableShares ? Number(fractionalData.availableShares) : undefined;
                            nft.pricePerShare = fractionalData.pricePerShare ? ethers.formatEther(fractionalData.pricePerShare) : undefined;
                                            } catch (err) {
                        // Handle error silently
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

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                setLoading(true);

                const storageCollections = loadCollectionsFromLocalStorage();

                if (session?.walletAddress) {
                    const enrichedCollections = await Promise.all(
                        storageCollections.map(loadCollectionNFTs)
                    );

                    const sortedCollections = enrichedCollections.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );

                    setCollections(sortedCollections);
                } else {
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
                        <Button
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
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
                            <Button className="text-cyan-400 border-cyan-400 hover:bg-cyan-950">
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
                                                <div
                                                    className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                    <span className="text-gray-400">No Image</span>
                                                </div>
                                            )}
                                            {nft.owner === session?.walletAddress && (
                                                <div
                                                    className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-md text-xs">
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
                                            <Link
                                                href={`/collections/${collection.address}/nft/${nft.tokenId || index}`}>
                                                <Button
                                                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
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