import { ethers } from 'ethers';
import * as factoryMetadata from '@/utils/artifacts/contracts/NFTFactory.sol/NFTFactory.json';
import * as factoryViewMetadata from '@/utils/artifacts/contracts/NFTFactoryView.sol/NFTFactoryView.json';
import * as collectionMetadata from '@/utils/artifacts/contracts/NFTCollection.sol/NFTCollection.json';
import * as fractionalMetadata from '@/utils/artifacts/contracts/FractionalNFT.sol/FractionalNFT.json';
import type {
    Collection,
    NFT,
    FractionalNFTInfo,
    ShareHolder,
    CollectionStats,
    UserNFTShare,
    CollectionNFTInfo
} from '@/types';

// --- Contract ABIs ---
const NFT_FACTORY_ABI = factoryMetadata.abi;
const NFT_FACTORY_VIEW_ABI = factoryViewMetadata.abi;
const NFT_COLLECTION_ABI = collectionMetadata.abi;
const FRACTIONAL_NFT_ABI = fractionalMetadata.abi;

// --- Caching ---
let cachedProvider: ethers.BrowserProvider | null = null;
let cachedSigner: ethers.Signer | null = null;
let signerPromise: Promise<ethers.Signer> | null = null;

// --- Provider & Signer Functions ---

/**
 *  Returns a JsonRpcProvider instance.
 *  @returns {ethers.JsonRpcProvider}
 */
export function getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
        throw new Error('RPC URL not configured');
    }
    return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 *  Returns a BrowserProvider instance, utilizing a cached instance if available.
 *  @returns {ethers.BrowserProvider}
 *  @throws {Error} If no wallet provider is available.
 */
export function getBrowserProvider(): ethers.BrowserProvider {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet provider available');
    }

    if (!cachedProvider) {
        cachedProvider = new ethers.BrowserProvider(window.ethereum);
    }

    return cachedProvider;
}

/**
 *  Retrieves a Signer instance, utilizing a cached instance if valid. Handles wallet connection and account changes.
 *  @returns {Promise<ethers.Signer>}
 */
export async function getSigner(): Promise<ethers.Signer> {
    if (cachedSigner) {
        try {
            await cachedSigner.getAddress();
            return cachedSigner;
        } catch (error) {
            console.warn('Cached signer invalid, clearing cache:', error);
            cachedSigner = null;
            signerPromise = null;
        }
    }

    if (signerPromise) {
        return signerPromise;
    }

    signerPromise = (async () => {
        try {
            console.log('Getting new signer from wallet...');
            const provider = getBrowserProvider();

            const accounts = await provider.send('eth_accounts', []);
            if (accounts.length === 0) {
                throw new Error('No wallet accounts found. Please connect your wallet.');
            }

            const signer = await provider.getSigner();
            cachedSigner = signer;

            // --- Event Listener Setup ---
            const handleAccountsChanged = (accounts: string[]) => {
                console.log('Wallet account changed, clearing signer cache');
                clearSignerCache();
            };

            if (window.ethereum && typeof (window.ethereum as any).removeAllListeners === 'function') {
                (window.ethereum as any).removeAllListeners('accountsChanged', handleAccountsChanged);
                (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
            }

            console.log('Signer obtained and cached successfully');
            return signer;
        } catch (error) {
            signerPromise = null;
            console.error('Error getting signer:', error);
            throw error;
        }
    })();

    return signerPromise;
}

/**
 *  Clears the cached signer and provider instances.
 */
export function clearSignerCache(): void {
    cachedSigner = null;
    signerPromise = null;
    cachedProvider = null;
}

/**
 *  Retrieves a Signer and validates it against a provided session wallet address.
 *  @param {string} sessionWalletAddress - The wallet address from the session.
 *  @returns {Promise<ethers.Signer>}
 *  @throws {Error} If the session wallet address does not match the signer address.
 */
export async function getSignerWithSessionCheck(sessionWalletAddress?: string): Promise<ethers.Signer> {
    const signer = await getSigner();

    if (sessionWalletAddress) {
        const signerAddress = await signer.getAddress();
        if (signerAddress.toLowerCase() !== sessionWalletAddress.toLowerCase()) {
            clearSignerCache();
            throw new Error(`Wallet mismatch: Session shows ${sessionWalletAddress} but wallet is ${signerAddress}. Please reconnect your wallet.`);
        }
    }

    return signer;
}

// --- Contract Retrieval Functions ---

/**
 *  Retrieves an instance of the NFTFactory contract.
 *  @param {ethers.Signer | ethers.Provider} signerOrProvider - Signer or Provider for the contract.
 *  @returns {ethers.Contract}
 *  @throws {Error} If the NFT Factory address is not configured.
 */
export function getNFTFactoryContract(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
    const factoryAddress = process.env.NEXT_PUBLIC_NFT_FACTORY_ADDRESS;
    if (!factoryAddress) {
        throw new Error('NFT Factory address not configured');
    }
    return new ethers.Contract(factoryAddress, NFT_FACTORY_ABI, signerOrProvider);
}

/**
 *  Retrieves an instance of the NFTFactoryView contract.
 *  @param {ethers.Signer | ethers.Provider} signerOrProvider - Signer or Provider for the contract.
 *  @returns {ethers.Contract}
 *  @throws {Error} If the NFT Factory View address is not configured.
 */
export function getNFTFactoryViewContract(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
    const factoryViewAddress = process.env.NEXT_PUBLIC_NFT_FACTORY_VIEW_ADDRESS;
    if (!factoryViewAddress) {
        throw new Error('NFT Factory View address not configured');
    }
    return new ethers.Contract(factoryViewAddress, NFT_FACTORY_VIEW_ABI, signerOrProvider);
}

/**
 *  Retrieves an instance of the NFTCollection contract.
 *  @param {string} address - Address of the NFT Collection contract.
 *  @param {ethers.Signer | ethers.Provider} signerOrProvider - Signer or Provider for the contract.
 *  @returns {ethers.Contract}
 */
export function getNFTCollectionContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
    return new ethers.Contract(address, NFT_COLLECTION_ABI, signerOrProvider);
}

/**
 *  Retrieves an instance of the FractionalNFT contract.
 *  @param {string} address - Address of the FractionalNFT contract.
 *  @param {ethers.Signer | ethers.Provider} signerOrProvider - Signer or Provider for the contract.
 *  @returns {ethers.Contract}
 */
export function getFractionalNFTContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
    return new ethers.Contract(address, FRACTIONAL_NFT_ABI, signerOrProvider);
}

// --- Metadata Functions ---

/**
 *  Fetches metadata from an IPFS URI.
 *  @param {string} metadataURI - IPFS URI or HTTP URL of the metadata.
 *  @returns {Promise<any>} - Parsed metadata object.
 */
export async function fetchMetadata(metadataURI: string): Promise<any> {
    try {
        if (metadataURI.startsWith('ipfs://')) {
            const ipfsHash = metadataURI.replace('ipfs://', '');
            const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } else if (metadataURI.startsWith('http')) {
            const response = await fetch(metadataURI);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } else {
            throw new Error('Invalid metadata URI format');
        }
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
    }
}

// --- Collection Functions ---

/**
 *  Creates a new NFT collection using the factory contract.
 *  @param {string} name - Name of the collection.
 *  @param {string} symbol - Symbol of the collection.
 *  @param {string} metadataURI - IPFS URI of the collection metadata.
 *  @returns {Promise<{ collectionId: number; txHash: string }>} - Collection ID and transaction hash.
 */
export async function createCollection(
    name: string,
    symbol: string,
    metadataURI: string
): Promise<{ collectionId: number; txHash: string }> {
    try {
        const signer = await getSigner();
        const factory = getNFTFactoryContract(signer);

        console.log('Creating collection with factory:', await factory.getAddress());

        const tx = await factory.createCollection(name, symbol, metadataURI);
        console.log('Transaction sent:', tx.hash);

        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        // Parse the CollectionCreated event
        const event = receipt.logs.find((log: any) => {
            try {
                const parsed = factory.interface.parseLog(log);
                return parsed?.name === 'CollectionCreated';
            } catch {
                return false;
            }
        });

        if (event) {
            const parsed = factory.interface.parseLog(event);
            return {
                collectionId: Number(parsed?.args[0]),
                txHash: tx.hash,
            };
        }

        throw new Error('Collection creation event not found');
    } catch (error) {
        console.error('Error creating collection:', error);
        throw error;
    }
}

/**
 *  Retrieves all collections from the factory.
 *  @returns {Promise<Collection[]>} - Array of collection objects.
 */
export async function getAllCollections(): Promise<Collection[]> {
    try {
        const provider = getProvider();
        const factory = getNFTFactoryContract(provider);

        const collections = await factory.getAllCollections();

        const collectionsWithMetadata = await Promise.all(
            collections.map(async (collection: any) => {
                const metadata = await fetchMetadata(collection.metadataURI);
                return {
                    collectionId: Number(collection.collectionId),
                    metadataURI: collection.metadataURI,
                    collectionAddress: collection.collectionAddress,
                    owner: collection.owner,
                    creationTime: Number(collection.creationTime),
                    name: metadata?.name || 'Unknown Collection',
                    symbol: metadata?.symbol || 'UNK',
                    description: metadata?.description || '',
                    imageURI: metadata?.image || '',
                };
            })
        );

        return collectionsWithMetadata;
    } catch (error) {
        console.error('Error fetching all collections:', error);
        throw error;
    }
}

/**
 *  Retrieves collections created by a specific user.
 *  @param {string} userAddress - Address of the user.
 *  @returns {Promise<number[]>} - Array of collection IDs.
 */
export async function getUserCollections(userAddress: string): Promise<number[]> {
    try {
        const provider = getProvider();
        const factory = getNFTFactoryContract(provider);

        const collectionIds = await factory.getUserCollections(userAddress);
        return collectionIds.map((id: any) => Number(id));
    } catch (error) {
        console.error('Error fetching user collections:', error);
        throw error;
    }
}

/**
 *  Retrieves a specific collection by ID.
 *  @param {number} collectionId - ID of the collection.
 *  @returns {Promise<Collection>} - Collection object.
 */
export async function getCollection(collectionId: number): Promise<Collection> {
    try {
        const provider = getProvider();
        const factory = getNFTFactoryContract(provider);

        const collection = await factory.getCollection(collectionId);
        const metadata = await fetchMetadata(collection.metadataURI);

        return {
            collectionId: Number(collection.collectionId),
            metadataURI: collection.metadataURI,
            collectionAddress: collection.collectionAddress,
            owner: collection.owner,
            creationTime: Number(collection.creationTime),
            name: metadata?.name || 'Unknown Collection',
            symbol: metadata?.symbol || 'UNK',
            description: metadata?.description || '',
            imageURI: metadata?.image || '',
        };
    } catch (error) {
        console.error('Error fetching collection:', error);
        throw error;
    }
}

/**
 *  Retrieves all collections owned by a specific user.
 *  @param {string} userAddress - Address of the user.
 *  @returns {Promise<Collection[]>} - Array of collection objects.
 */
export async function getUserOwnedCollections(userAddress: string): Promise<Collection[]> {
    try {
        const provider = getProvider();
        const factory = getNFTFactoryContract(provider);

        const collections = await factory.getUserOwnedCollections(userAddress);

        const collectionsWithMetadata = await Promise.all(
            collections.map(async (collection: any) => {
                const metadata = await fetchMetadata(collection.metadataURI);
                return {
                    collectionId: Number(collection.collectionId),
                    metadataURI: collection.metadataURI,
                    collectionAddress: collection.collectionAddress,
                    owner: collection.owner,
                    creationTime: Number(collection.creationTime),
                    name: metadata?.name || 'Unknown Collection',
                    symbol: metadata?.symbol || 'UNK',
                    description: metadata?.description || '',
                    imageURI: metadata?.image || '',
                };
            })
        );

        return collectionsWithMetadata;
    } catch (error) {
        console.error('Error fetching user owned collections:', error);
        throw error;
    }
}

/**
 *  Retrieves all NFTs where a user has shares.
 *  @param {string} userAddress - Address of the user.
 *  @returns {Promise<UserNFTShare[]>} - Array of NFTs where the user has shares.
 */
export async function getUserNFTShares(userAddress: string): Promise<UserNFTShare[]> {
    try {
        console.log('🔍 getUserNFTShares called for:', userAddress);
        const provider = getProvider();
        const factoryView = getNFTFactoryViewContract(provider);

        const userNFTs = await factoryView.getUserNFTShares(userAddress);
        console.log('📊 Raw getUserNFTShares result:', userNFTs);
        console.log('📊 Found', userNFTs.length, 'NFTs with shares');

        const nftsWithMetadata = await Promise.all(
            userNFTs.map(async (nft: any, index: number) => {
                console.log(`📝 Processing NFT ${index}:`, {
                    tokenId: nft.tokenId.toString(),
                    userShares: nft.userShares.toString(),
                    totalShares: nft.totalShares.toString(),
                    isOwner: nft.isOwner,
                    fractionalContract: nft.fractionalContract
                });

                const metadata = await fetchMetadata(nft.metadataURI);
                const result = {
                    collectionId: Number(nft.collectionId),
                    collectionAddress: nft.collectionAddress,
                    tokenId: Number(nft.tokenId),
                    fractionalContract: nft.fractionalContract,
                    userShares: Number(nft.userShares),
                    totalShares: Number(nft.totalShares),
                    sharePercentage: Number(nft.sharePercentage),
                    metadataURI: nft.metadataURI,
                    isOwner: nft.isOwner,
                    name: metadata?.name || 'Unknown NFT',
                    description: metadata?.description || '',
                    imageURI: metadata?.image || '',
                };
                
                console.log(`✅ Processed NFT ${index}:`, result);
                return result;
            })
        );

        console.log('🎯 Final getUserNFTShares result:', nftsWithMetadata);
        return nftsWithMetadata;
    } catch (error) {
        console.error('❌ Error fetching user NFT shares:', error);
        throw error;
    }
}

/**
 *  Retrieves all collections where user has involvement (owns or has shares).
 *  @param {string} userAddress - Address of the user.
 *  @returns {Promise<Collection[]>} - Array of collection objects.
 */
export async function getUserInvolvedCollections(userAddress: string): Promise<Collection[]> {
    try {
        // Get user owned collections
        const ownedCollections = await getUserOwnedCollections(userAddress);
        
        // Get user NFT shares to find additional collections
        const userNFTShares = await getUserNFTShares(userAddress);
        
        // Create a set of collection IDs to avoid duplicates
        const collectionIds = new Set<number>();
        const collectionsMap = new Map<number, Collection>();
        
        // Add owned collections
        ownedCollections.forEach(collection => {
            collectionIds.add(collection.collectionId);
            collectionsMap.set(collection.collectionId, collection);
        });
        
        // Add collections where user has shares
        for (const nftShare of userNFTShares) {
            if (!collectionIds.has(nftShare.collectionId)) {
                try {
                    const collection = await getCollection(nftShare.collectionId);
                    collectionIds.add(nftShare.collectionId);
                    collectionsMap.set(nftShare.collectionId, collection);
                } catch (error) {
                    console.warn(`Failed to fetch collection ${nftShare.collectionId}:`, error);
                }
            }
        }
        
        return Array.from(collectionsMap.values());
    } catch (error) {
        console.error('Error fetching user involved collections:', error);
        throw error;
    }
}

// --- NFT Functions ---

/**
 *  Mints a new NFT in a specific collection.
 *  @param {string} collectionAddress - Address of the NFT collection.
 *  @param {string} metadataURI - IPFS URI of the NFT metadata.
 *  @returns {Promise<{ tokenId: number; txHash: string }>} - Token ID and transaction hash.
 */
export async function mintNFT(collectionAddress: string, metadataURI: string): Promise<{ tokenId: number; txHash: string }> {
    try {
        const signer = await getSigner();
        const collection = getNFTCollectionContract(collectionAddress, signer);

        const tx = await collection.mintNFT(metadataURI);
        const receipt = await tx.wait();

        // Parse the NFTMinted event
        const event = receipt.logs.find((log: any) => {
            try {
                const parsed = collection.interface.parseLog(log);
                return parsed?.name === 'NFTMinted';
            } catch {
                return false;
            }
        });

        if (event) {
            const parsed = collection.interface.parseLog(event);
            return {
                tokenId: Number(parsed?.args[0]),
                txHash: tx.hash,
            };
        }

        throw new Error('NFT minting event not found');
    } catch (error) {
        console.error('Error minting NFT:', error);
        throw error;
    }
}

/**
 *  Fractionalizes an NFT by creating a FractionalNFT contract.
 *  @param {string} collectionAddress - Address of the NFT collection.
 *  @param {number} tokenId - Token ID of the NFT to fractionalize.
 *  @param {number} totalShares - Total number of shares to create.
 *  @param {string} sharePrice - Price per share in Ether.
 *  @param {string} fractionalName - Name for the fractional token.
 *  @param {string} fractionalSymbol - Symbol for the fractional token.
 *  @returns {Promise<{ fractionalContract: string; txHash: string }>} - Fractional contract address and transaction hash.
 */
export async function fractionalizeNFT(
    collectionAddress: string,
    tokenId: number,
    totalShares: number,
    sharePrice: string,
    fractionalName: string,
    fractionalSymbol: string
): Promise<{ fractionalContract: string; txHash: string }> {
    try {
        const signer = await getSigner();
        const collection = getNFTCollectionContract(collectionAddress, signer);

        const sharePriceWei = ethers.parseEther(sharePrice);

        const tx = await collection.fractionalizeNFT(
            tokenId,
            totalShares,
            sharePriceWei,
            fractionalName,
            fractionalSymbol
        );

        const receipt = await tx.wait();

        // Parse the NFTfractionalized event
        const event = receipt.logs.find((log: any) => {
            try {
                const parsed = collection.interface.parseLog(log);
                return parsed?.name === 'NFTfractionalized';
            } catch {
                return false;
            }
        });

        if (event) {
            const parsed = collection.interface.parseLog(event);
            return {
                fractionalContract: parsed?.args[1],
                txHash: tx.hash,
            };
        }

        throw new Error('NFT fractionalization event not found');
    } catch (error) {
        console.error('Error fractionalizing NFT:', error);
        throw error;
    }
}

/**
 *  Retrieves all NFTs in a given collection.
 *  @param {string} collectionAddress - Address of the NFT collection.
 *  @returns {Promise<NFT[]>} - Array of NFT objects.
 */
export async function getCollectionNFTs(collectionAddress: string): Promise<NFT[]> {
    try {
        const provider = getProvider();
        const collection = getNFTCollectionContract(collectionAddress, provider);

        const nfts = await collection.getAllNFTs();

        const nftsWithMetadata = await Promise.all(
            nfts.map(async (nft: any) => {
                const metadata = await fetchMetadata(nft.metadataURI);
                return {
                    tokenId: Number(nft.tokenId),
                    metadataURI: nft.metadataURI,
                    creationTime: Number(nft.creationTime),
                    fractionalContract: nft.fractionalContract,
                    isfractionalized: nft.isfractionalized,
                    name: metadata?.name || 'Unknown NFT',
                    description: metadata?.description || '',
                    imageURI: metadata?.image || '',
                    attributes: metadata?.attributes || [],
                };
            })
        );

        return nftsWithMetadata;
    } catch (error) {
        console.error('Error fetching collection NFTs:', error);
        throw error;
    }
}

/**
 *  Retrieves statistics for a given NFT collection.
 *  @param {string} collectionAddress - Address of the NFT collection.
 *  @returns {Promise<CollectionStats>} - Collection statistics.
 */
export async function getCollectionStats(collectionAddress: string): Promise<CollectionStats> {
    try {
        const provider = getProvider();
        const collection = getNFTCollectionContract(collectionAddress, provider);

        const stats = await collection.getCollectionStats();

        return {
            totalNFTs: Number(stats[0]),
            fractionalizedNFTs: Number(stats[1]),
            currentOwner: stats[2],
        };
    } catch (error) {
        console.error('Error fetching collection stats:', error);
        throw error;
    }
}

// --- Fractional NFT Contract Functions ---

/**
 *  Debug function to check what functions are available in a fractional NFT contract.
 *  @param {string} fractionalContractAddress - Address of the fractional NFT contract.
 *  @returns {Promise<string[]>} - Array of available function names.
 */
export async function debugFractionalNFTContract(fractionalContractAddress: string): Promise<void> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        console.log('=== Debugging Fractional NFT Contract ===');
        console.log('Contract Address:', fractionalContractAddress);
        
        // Try to get basic info first
        try {
            const nftInfo = await fractionalNFT.getNFTInfo();
            console.log('📊 NFT Info:', {
                collection: nftInfo[0],
                tokenId: Number(nftInfo[1]),
                sharePrice: ethers.formatEther(nftInfo[3]) + ' ETH',
                totalShares: Number(nftInfo[4]),
                currentOwner: nftInfo[5]
            });
        } catch (error) {
            console.log('❌ Failed to get basic NFT info:', error);
        }
        
        // Try to call various functions to see what's available
        const tests = [
            { name: 'getNFTInfo()', test: () => fractionalNFT.getNFTInfo() },
            { name: 'getCreator()', test: () => fractionalNFT.getCreator() },
            { name: 'creator()', test: () => fractionalNFT.creator() },
            { name: 'hasShares()', test: () => fractionalNFT.hasShares('0x0000000000000000000000000000000000000000') },
            { name: 'getAvailableShares()', test: () => fractionalNFT.getAvailableShares() },
            { name: 'getTotalShares()', test: () => fractionalNFT.getTotalShares() },
            { name: 'userShares()', test: () => fractionalNFT.userShares('0x0000000000000000000000000000000000000000') },
            { name: 'getShareHolders()', test: () => fractionalNFT.getShareHolders() },
            { name: 'sharePrice()', test: () => fractionalNFT.sharePrice() },
            { name: 'buyShares()', test: () => 'Function exists (not calling)' },
        ];

        console.log('🔍 Function Availability Check:');
        for (const { name, test } of tests) {
            try {
                const result = await test();
                if (name === 'buyShares()') {
                    console.log(`✅ ${name} - AVAILABLE`);
                } else {
                    console.log(`✅ ${name} - AVAILABLE, Result:`, result);
                }
            } catch (error) {
                console.log(`❌ ${name} - NOT AVAILABLE:`, error instanceof Error ? error.message : error);
            }
        }
        
        // Try to get share holders info
        try {
            const shareHolders = await fractionalNFT.getShareHolders();
            const [holders, shares, percentages] = shareHolders;
            console.log('👥 Share Holders:');
            holders.forEach((holder: string, index: number) => {
                console.log(`  - ${holder}: ${shares[index]} shares (${percentages[index]}%)`);
            });
        } catch (error) {
            console.log('❌ Failed to get share holders:', error);
        }
        
        console.log('=== End Debug ===');
    } catch (error) {
        console.error('Error debugging fractional NFT contract:', error);
    }
}

/**
 *  Allows a user to buy shares of a fractionalized NFT.
 *  @param {string} fractionalContractAddress - Address of the FractionalNFT contract.
 *  @param {number} shareAmount - Number of shares to buy.
 *  @param {string} sharePrice - Price per share in Ether.
 *  @returns {Promise<string>} - Transaction hash.
 */
export async function buyNFTShares(fractionalContractAddress: string, shareAmount: number, sharePrice: string): Promise<string> {
    try {
        console.log('🛒 Starting share purchase:', {
            contract: fractionalContractAddress,
            shareAmount,
            sharePrice
        });

        const signer = await getSigner();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, signer);

        const totalCost = ethers.parseEther((parseFloat(sharePrice) * shareAmount).toString());

        console.log(`💰 Buying ${shareAmount} shares at ${sharePrice} ETH each, total cost: ${ethers.formatEther(totalCost)} ETH`);
        
        // Get user address for better error messages
        const userAddress = await signer.getAddress();
        console.log(`👤 Buyer address: ${userAddress}`);

        // Check if user has enough balance
        const balance = await signer.provider?.getBalance(userAddress);
        if (balance && balance < totalCost) {
            throw new Error(`Insufficient balance. You have ${ethers.formatEther(balance)} ETH but need ${ethers.formatEther(totalCost)} ETH.`);
        }

        // Get NFT info to check if buying all shares
        const nftInfo = await fractionalNFT.getNFTInfo();
        const totalShares = Number(nftInfo[4]);
        const isBuyingAllShares = shareAmount === totalShares;
        
        console.log('📊 Purchase analysis:', {
            totalShares,
            shareAmount,
            isBuyingAllShares,
            currentOwner: nftInfo[5]
        });

        // Try to get available shares to provide better error messages
        try {
            const availableShares = await getAvailableSharesForBuyer(fractionalContractAddress, userAddress);
            console.log(`📈 Available shares for purchase: ${availableShares}`);
            
            if (shareAmount > availableShares) {
                throw new Error(`Only ${availableShares} shares are available for purchase, but you're trying to buy ${shareAmount}.`);
            }
        } catch (error) {
            console.warn('Could not check available shares:', error);
        }

        console.log('🚀 Sending buyShares transaction...');
        const tx = await fractionalNFT.buyShares(shareAmount, { value: totalCost });
        console.log('📤 Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', receipt);

        // If buying all shares, check if NFT ownership was transferred
        if (isBuyingAllShares) {
            console.log('👑 Bought all shares! Checking NFT ownership transfer...');
            try {
                // Wait a bit for state to update
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const extendedInfo = await getExtendedNFTInfo(fractionalContractAddress);
                const userOwnsFractionalContract = extendedInfo.currentOwner.toLowerCase() === userAddress.toLowerCase();
                
                console.log('🔍 Ownership check:', {
                    fractionalContractOwner: extendedInfo.currentOwner,
                    userAddress,
                    userOwnsFractionalContract
                });

                if (userOwnsFractionalContract) {
                    console.log('✅ Successfully gained control of fractional contract!');
                    
                    // Check if actual NFT was transferred
                    try {
                        const collectionContract = getNFTCollectionContract(extendedInfo.collection, signer);
                        const nftOwner = await collectionContract.ownerOf(extendedInfo.tokenId);
                        const userOwnsNFT = nftOwner.toLowerCase() === userAddress.toLowerCase();
                        
                        console.log('🏠 NFT ownership check:', {
                            nftOwner,
                            userOwnsNFT
                        });

                        if (userOwnsNFT) {
                            console.log('🎉 SUCCESS: You now own the NFT completely!');
                        } else {
                            console.log('⚠️ WARNING: You own all shares but NFT transfer may have failed. Check the contract approval.');
                        }
                    } catch (nftOwnerError) {
                        console.warn('Could not check NFT ownership:', nftOwnerError);
                    }
                } else {
                    console.log('⚠️ WARNING: Fractional contract ownership may not have transferred correctly');
                }
            } catch (ownershipError) {
                console.warn('Could not verify ownership transfer:', ownershipError);
            }
        }

        return tx.hash;
    } catch (error) {
        console.error('❌ Error buying NFT shares:', error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('user rejected')) {
                throw new Error('Transaction was rejected by user.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for transaction.');
            } else if (error.message.includes('No shares available')) {
                throw new Error('No shares are currently available for purchase.');
            } else if (error.message.includes('transfer amount exceeds balance')) {
                throw new Error('The share seller does not have enough shares. This may be a contract issue.');
            } else if (error.message.includes('Share price not set')) {
                throw new Error('Share price has not been set for this NFT.');
            } else if (error.message.includes('Incorrect ETH amount')) {
                throw new Error('The ETH amount sent does not match the required payment.');
            }
        }
        
        throw error;
    }
}

/**
 *  Retrieves the share holders of a fractionalized NFT.
 *  @param {string} fractionalContractAddress - Address of the FractionalNFT contract.
 *  @returns {Promise<ShareHolder[]>} - Array of share holder objects.
 */
export async function getNFTShareHolders(fractionalContractAddress: string): Promise<ShareHolder[]> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        const result = await fractionalNFT.getShareHolders();
        const [holders, shares, percentages] = result;

        return holders.map((holder: string, index: number) => ({
            holder,
            shares: Number(shares[index]),
            percentage: Number(percentages[index]),
        }));
    } catch (error) {
        console.error('Error fetching NFT share holders:', error);
        throw error;
    }
}

/**
 *  Retrieves information about a fractionalized NFT.
 *  @param {string} fractionalContractAddress - Address of the FractionalNFT contract.
 *  @returns {Promise<FractionalNFTInfo>} - Information about the fractional NFT.
 */
export async function getFractionalNFTInfo(fractionalContractAddress: string): Promise<FractionalNFTInfo> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        const info = await fractionalNFT.getNFTInfo();

        return {
            collection: info[0],
            tokenId: Number(info[1]),
            metadataURI: info[2],
            sharePrice: ethers.formatEther(info[3]),
            totalShares: Number(info[4]),
            currentOwner: info[5],
            createdAt: Number(info[6]),
        };
    } catch (error) {
        console.error('Error fetching fractional NFT info:', error);
        throw error;
    }
}

/**
 *  Retrieves the share percentage of a user for a given fractionalized NFT.
 *  @param {string} fractionalContractAddress - Address of the FractionalNFT contract.
 *  @param {string} userAddress - Address of the user.
 *  @returns {Promise<number>} - User's share percentage.
 */
export async function getUserNFTSharePercentage(fractionalContractAddress: string, userAddress: string): Promise<number> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        const percentage = await fractionalNFT.getUserSharePercentage(userAddress);
        return Number(percentage);
    } catch (error) {
        console.error('Error fetching user NFT share percentage:', error);
        throw error;
    }
}

/**
 *  Get the original creator of a fractional NFT.
 *  @param {string} fractionalContractAddress - Address of the fractional NFT contract.
 *  @returns {Promise<string>} - Address of the original creator.
 */
export async function getNFTCreator(fractionalContractAddress: string): Promise<string> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        // Try the new getCreator() function first, fallback to creator public variable
        try {
            const creator = await fractionalNFT.getCreator();
            return creator;
        } catch (error) {
            // Fallback to public variable if function doesn't exist
            const creator = await fractionalNFT.creator();
            return creator;
        }
    } catch (error) {
        console.error('Error fetching NFT creator:', error);
        throw error;
    }
}

/**
 *  Check if a user has any shares in a specific fractional NFT.
 *  @param {string} fractionalContractAddress - Address of the fractional NFT contract.
 *  @param {string} userAddress - Address of the user.
 *  @returns {Promise<boolean>} - True if user has shares, false otherwise.
 */
export async function userHasShares(fractionalContractAddress: string, userAddress: string): Promise<boolean> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        // Try the new hasShares() function first, fallback to checking userShares directly
        try {
            const hasShares = await fractionalNFT.hasShares(userAddress);
            return hasShares;
        } catch (error) {
            // Fallback to checking userShares public mapping
            const shares = await fractionalNFT.userShares(userAddress);
            return Number(shares) > 0;
        }
    } catch (error) {
        console.error('Error checking if user has shares:', error);
        return false;
    }
}

/**
 *  Get detailed NFT information including creator and current owner.
 *  @param {string} fractionalContractAddress - Address of the fractional NFT contract.
 *  @returns {Promise<FractionalNFTInfo & { creator: string }>} - Extended NFT information.
 */
export async function getExtendedNFTInfo(fractionalContractAddress: string): Promise<FractionalNFTInfo & { creator: string }> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        // Get basic NFT info
        const nftInfo = await fractionalNFT.getNFTInfo();
        
        // Try to get creator using multiple approaches
        let creator: string;
        try {
            // Try the new getCreator() function first
            creator = await fractionalNFT.getCreator();
        } catch (error) {
            try {
                // Fallback to public creator variable
                creator = await fractionalNFT.creator();
            } catch (error2) {
                // Ultimate fallback - use current owner as creator
                console.warn('Could not get creator, using current owner as fallback');
                creator = nftInfo[5]; // currentOwner from getNFTInfo
            }
        }

        return {
            collection: nftInfo[0],
            tokenId: Number(nftInfo[1]),
            metadataURI: nftInfo[2],
            sharePrice: ethers.formatEther(nftInfo[3]),
            totalShares: Number(nftInfo[4]),
            currentOwner: nftInfo[5],
            createdAt: Number(nftInfo[6]),
            creator: creator
        };
    } catch (error) {
        console.error('Error fetching extended NFT info:', error);
        throw error;
    }
}

/**
 *  Get available shares for purchase (excluding the buyer's own shares).
 *  @param {string} fractionalContractAddress - Address of the fractional NFT contract.
 *  @param {string} buyerAddress - Address of the potential buyer.
 *  @returns {Promise<number>} - Number of shares available for purchase.
 */
export async function getAvailableSharesForBuyer(fractionalContractAddress: string, buyerAddress: string): Promise<number> {
    try {
        const provider = getProvider();
        const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);

        // Get total shares, current distribution, and creator info
        const [nftInfo, shareHolders] = await Promise.all([
            fractionalNFT.getNFTInfo(),
            fractionalNFT.getShareHolders()
        ]);

        const totalShares = Number(nftInfo[4]);
        const currentOwner = nftInfo[5];
        const [holders, shares] = shareHolders;
        
        // Get creator address
        let creator;
        try {
            creator = await fractionalNFT.getCreator();
        } catch {
            try {
                creator = await fractionalNFT.creator();
            } catch {
                creator = currentOwner; // fallback
            }
        }
        
        let buyerCurrentShares = 0;
        let totalAvailableForPurchase = 0;
        
        for (let i = 0; i < holders.length; i++) {
            const holder = holders[i];
            const holderShares = Number(shares[i]);
            
            if (holder.toLowerCase() === buyerAddress.toLowerCase()) {
                buyerCurrentShares = holderShares;
            } else {
                // Shares held by others (including creator/owner) are available for purchase
                totalAvailableForPurchase += holderShares;
            }
        }

        console.log('Share calculation:', {
            totalShares,
            currentOwner,
            creator,
            buyerAddress,
            buyerCurrentShares,
            totalAvailableForPurchase,
            holders: holders.map((h: string, i: number) => ({ address: h, shares: Number(shares[i]) }))
        });

        return Math.max(0, totalAvailableForPurchase);
    } catch (error) {
        console.error('Error fetching available shares for buyer:', error);
        
        // Fallback: try the simple method
        try {
            const provider = getProvider();
            const fractionalNFT = getFractionalNFTContract(fractionalContractAddress, provider);
            
            // Get total shares and buyer's shares
            const [nftInfo, buyerShares] = await Promise.all([
                fractionalNFT.getNFTInfo(),
                fractionalNFT.userShares(buyerAddress)
            ]);
            
            const totalShares = Number(nftInfo[4]);
            const buyerSharesNum = Number(buyerShares);
            
            // Simple fallback: total shares minus buyer's shares
            return Math.max(0, totalShares - buyerSharesNum);
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            return 0;
        }
    }
}

// --- Utility Functions ---

/**
 *  Formats an Ethereum address for display.
 *  @param {string} address - The Ethereum address.
 *  @returns {string} - Formatted address.
 */
export function formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
}

/**
 *  Formats an Ether value for display.
 *  @param {string | bigint} value - The Ether value.
 *  @returns {string} - Formatted Ether value.
 */
export function formatEther(value: string | bigint): string {
    return parseFloat(ethers.formatEther(value)).toFixed(4);
}

/**
 *  Parses an Ether value from a string to a bigint.
 *  @param {string} value - The Ether value as a string.
 *  @returns {bigint} - The parsed Ether value as a bigint.
 */
export function parseEther(value: string): bigint {
    return ethers.parseEther(value);
}

/**
 * Get available shares from the current owner (for buying all shares)
 */
export async function getAvailableSharesFromOwner(fractionalContractAddress: string): Promise<number> {
    try {
        const provider = getProvider();
        const contract = getFractionalNFTContract(fractionalContractAddress, provider);
        
        const availableShares = await contract.getAvailableSharesFromOwner();
        return Number(availableShares);
    } catch (error) {
        console.error('Error getting available shares from owner:', error);
        throw error;
    }
}

/**
 * Check if all shares are owned by the creator/owner
 */
export async function isAllSharesWithOwner(fractionalContractAddress: string): Promise<boolean> {
    try {
        const provider = getProvider();
        const contract = getFractionalNFTContract(fractionalContractAddress, provider);
        
        return await contract.isAllSharesWithOwner();
    } catch (error) {
        console.error('Error checking if all shares are with owner:', error);
        throw error;
    }
}

/**
 * Get all NFTs from a specific collection with fractional info
 */
export async function getCollectionNFTsWithFractionalInfo(collectionAddress: string): Promise<CollectionNFTInfo[]> {
    try {
        const provider = getProvider();
        const factoryView = getNFTFactoryViewContract(provider);
        
        const nfts = await factoryView.getCollectionNFTs(collectionAddress);
        
        const processedNFTs: CollectionNFTInfo[] = [];
        
        for (const nft of nfts) {
            let processedNFT: CollectionNFTInfo = {
                tokenId: Number(nft.tokenId),
                fractionalContract: nft.fractionalContract,
                metadataURI: nft.metadataURI,
                totalShares: Number(nft.totalShares),
                currentOwner: nft.currentOwner,
                sharePrice: Number(ethers.formatEther(nft.sharePrice)),
                isfractionalized: nft.isfractionalized,
                creationTime: Number(nft.creationTime)
            };

            // Fetch metadata if available
            if (nft.metadataURI) {
                try {
                    const metadata = await fetchMetadata(nft.metadataURI);
                    processedNFT.name = metadata.name;
                    processedNFT.description = metadata.description;
                    processedNFT.imageURI = metadata.image;
                } catch (error) {
                    console.warn(`Failed to fetch metadata for NFT ${nft.tokenId}:`, error);
                }
            }

            processedNFTs.push(processedNFT);
        }
        
        return processedNFTs;
    } catch (error) {
        console.error('Error getting collection NFTs with fractional info:', error);
        throw error;
    }
}

/**
 * Get all fractionalized NFTs across all collections
 */
export async function getAllFractionalizedNFTs(): Promise<UserNFTShare[]> {
    try {
        const provider = getProvider();
        const factoryView = getNFTFactoryViewContract(provider);
        
        const fractionalizedNFTs = await factoryView.getAllFractionalizedNFTs();
        
        const processedNFTs: UserNFTShare[] = [];
        
        for (const nft of fractionalizedNFTs) {
            let processedNFT: UserNFTShare = {
                collectionId: Number(nft.collectionId),
                collectionAddress: nft.collectionAddress,
                tokenId: Number(nft.tokenId),
                fractionalContract: nft.fractionalContract,
                userShares: Number(nft.userShares),
                totalShares: Number(nft.totalShares),
                sharePercentage: Number(nft.sharePercentage),
                metadataURI: nft.metadataURI,
                isOwner: nft.isOwner
            };

            // Fetch metadata if available
            if (nft.metadataURI) {
                try {
                    const metadata = await fetchMetadata(nft.metadataURI);
                    processedNFT.name = metadata.name;
                    processedNFT.description = metadata.description;
                    processedNFT.imageURI = metadata.image;
                } catch (error) {
                    console.warn(`Failed to fetch metadata for NFT ${nft.tokenId}:`, error);
                }
            }

            processedNFTs.push(processedNFT);
        }
        
        return processedNFTs;
    } catch (error) {
        console.error('Error getting all fractionalized NFTs:', error);
        throw error;
    }
}

/**
 * Get collections where user has any shares in NFTs
 */
export async function getCollectionsWithUserShares(userAddress: string): Promise<Collection[]> {
    try {
        const provider = getProvider();
        const factoryView = getNFTFactoryViewContract(provider);
        
        const collections = await factoryView.getCollectionsWithUserShares(userAddress);
        
        const processedCollections: Collection[] = [];
        
        for (const collection of collections) {
            let processedCollection: Collection = {
                collectionId: Number(collection.collectionId),
                metadataURI: collection.metadataURI,
                collectionAddress: collection.collectionAddress,
                owner: collection.owner,
                creationTime: Number(collection.creationTime)
            };

            // Fetch metadata if available
            if (collection.metadataURI) {
                try {
                    const metadata = await fetchMetadata(collection.metadataURI);
                    processedCollection.name = metadata.name;
                    processedCollection.symbol = metadata.symbol;
                    processedCollection.description = metadata.description;
                    processedCollection.imageURI = metadata.image;
                } catch (error) {
                    console.warn(`Failed to fetch metadata for collection ${collection.collectionId}:`, error);
                }
            }

            processedCollections.push(processedCollection);
        }
        
        return processedCollections;
    } catch (error) {
        console.error('Error getting collections with user shares:', error);
        throw error;
    }
}

/**
 * Enhanced buy shares function that supports buying all shares and automatic ownership transfer
 */
export async function buyNFTSharesEnhanced(
    fractionalContractAddress: string, 
    shareAmount: number, 
    sharePrice: string,
    sessionWalletAddress?: string
): Promise<string> {
    try {
        const signer = await getSignerWithSessionCheck(sessionWalletAddress);
        const contract = getFractionalNFTContract(fractionalContractAddress, signer);
        
        const sharePriceWei = ethers.parseEther(sharePrice);
        const totalCost = sharePriceWei * BigInt(shareAmount);
        
        console.log(`Buying ${shareAmount} shares for ${ethers.formatEther(totalCost)} ETH total`);
        
        // Check if buying all shares
        const totalShares = await contract.getTotalShares();
        const isBuyingAllShares = shareAmount === Number(totalShares);
        
        if (isBuyingAllShares) {
            console.log('Buying all shares - will transfer NFT ownership automatically');
        }
        
        const tx = await contract.buyShares(shareAmount, {
            value: totalCost,
            gasLimit: 500000 // Increased gas limit for ownership transfer
        });
        
        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('Transaction confirmed');
        
        return tx.hash;
    } catch (error) {
        console.error('Error buying NFT shares:', error);
        throw error;
    }
}

/**
 * Check if the fractional NFT token should appear in MetaMask
 */
export async function addTokenToMetaMask(fractionalContractAddress: string): Promise<boolean> {
    try {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not available');
        }

        const provider = getProvider();
        const contract = getFractionalNFTContract(fractionalContractAddress, provider);
        
        // Get token details
        const [symbol, decimals] = await Promise.all([
            contract.symbol(),
            contract.decimals()
        ]);

        // Request to add token to MetaMask
        const success = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: fractionalContractAddress,
                    symbol: symbol,
                    decimals: decimals,
                },
            },
        }) as boolean;

        return success;
    } catch (error) {
        console.error('Error adding token to MetaMask:', error);
        throw error;
    }
}