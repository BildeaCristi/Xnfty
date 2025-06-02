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
import { connectWallet, verifyWalletConnection, setupWalletListeners } from '@/utils/wallet';

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
  mintTxHash?: string;
  tokenId?: number;
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
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [walletMessage, setWalletMessage] = useState('');
  const [deploymentProgress, setDeploymentProgress] = useState<{
    currentNft: number;
    total: number;
    status: 'pending' | 'deploying' | 'complete' | 'error';
    error?: string;
    txHashInfo?: string;
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

  // Function to handle wallet connection with UI feedback
  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    setWalletMessage('Connecting...');
    
    try {
      await connectWallet(session?.walletAddress);
      setWalletMessage('Wallet connected!');
      // Clear message after a short delay
      setTimeout(() => setWalletMessage(''), 2000);
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      setWalletMessage(error.message || "Failed to connect wallet");
    } finally {
      setConnectingWallet(false);
    }
  };

  // Check wallet connection on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (session?.walletAddress) {
        try {
          const isConnected = await verifyWalletConnection(session.walletAddress);
          if (!isConnected) {
            setWalletMessage('Please connect your wallet to continue.');
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    checkWalletConnection();
    
    // Setup listeners for wallet account changes
    const cleanup = setupWalletListeners((accounts) => {
      if (accounts.length === 0) {
        setWalletMessage('Wallet disconnected. Please connect again.');
      } else if (session?.walletAddress && session.walletAddress.toLowerCase() !== accounts[0].toLowerCase()) {
        setWalletMessage('Connected wallet does not match login wallet.');
      } else {
        setWalletMessage('Wallet connected!');
        // Clear message after a delay
        setTimeout(() => setWalletMessage(''), 2000);
      }
    });
    
    return cleanup;
  }, [session]);

  const handleDeployCollection = async () => {
    try {
      // Check if user is logged in with wallet
      if (!session?.walletAddress) {
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

      // First ensure wallet is connected
      await handleConnectWallet();

      // Check for ethereum provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("No Ethereum wallet detected. Please install MetaMask or another Ethereum wallet.");
      }
      
      // Create provider with window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get factory contract using the full ABI
      const rawFactoryAddress = process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS || "0xf6b3ed52c3f2193e13b597dbc1b9c8ec10ab9d08";
      const factoryAddress = ethers.getAddress(rawFactoryAddress.toLowerCase());
      console.log("Using factory address with proper checksum:", factoryAddress);
      
      const factoryAbi = CollectionFactoryArtifact.abi;
      
      setWalletMessage('Deploying collection...');
      const factory = new ethers.Contract(factoryAddress, factoryAbi, signer);

      // Generate a temporary collection ID for tracking in localStorage even before we get the address
      const tempCollectionId = `pending_${Date.now()}`;
      
      // Deploy new collection
      const tx = await factory.createCollection(collectionName, collectionDescription);
      console.log("Transaction hash:", tx.hash);
      
      // Store this hash for error recovery
      const pendingCollectionData = {
        name: collectionName,
        description: collectionDescription,
        pendingTxHash: tx.hash,
        nfts: [],
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // Save pending collection to localStorage
      localStorage.setItem(`collection_${tempCollectionId}`, JSON.stringify(pendingCollectionData));
      
      setWalletMessage(`Transaction submitted! Waiting for confirmation...`);
      const receipt = await tx.wait();
      setWalletMessage('Collection created successfully!');
      
      // Extract collection address from event - using improved event handling
      let collectionAddress;
      
      // If we still couldn't get the address, try to extract it directly from logs in a more direct way
      if (!collectionAddress) {
        // Get the transaction hash for manual verification
        const txHash = receipt.hash || tx.hash;
        console.log("Transaction hash for manual verification:", txHash);
        
        try {
          // Try to find the "CollectionDeployed" event by searching in the logs
          for (const log of receipt.logs) {
            try {
              const parsedLog = factory.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
              
              if (parsedLog && parsedLog.name === "CollectionDeployed") {
                collectionAddress = parsedLog.args.collectionAddress;
                console.log("Found collection address:", collectionAddress);
                break;
              }
            } catch (e) {
              // Skip logs that can't be parsed
              continue;
            }
          }
          
          if (!collectionAddress) {
            // For improved UX, we'll use the transaction hash as a fallback ID
            collectionAddress = `unknown_${txHash}`;
            console.log("Could not extract collection address, using transaction hash as identifier");
          }
        } catch (extractionError) {
          console.error("Error extracting collection address from logs:", extractionError);
          collectionAddress = `unknown_${txHash}`;
        }
      }
      
      // Update the collection in localStorage with the address
      const updatedCollection = {
        ...pendingCollectionData,
        address: collectionAddress,
        status: 'deployed',
        txHash: tx.hash
      };
      
      // Store in localStorage with collection address as key for future retrieval
      localStorage.setItem(`collection_${collectionAddress}`, JSON.stringify(updatedCollection));
      
      // Remove the temporary ID entry
      localStorage.removeItem(`collection_${tempCollectionId}`);
      
      // Proceed with minting NFTs only if we have a valid collection address
      if (collectionAddress && !collectionAddress.startsWith('unknown_')) {
        // Create contract instance
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

          // Deploy the NFT - explicitly specify the recipient as the connected user's wallet address
          let mintTx;
          try {
            if (nft.isFractional) {
              mintTx = await collection.createFractionalNFT(
                nft.totalShares!,
                ethers.parseEther(nft.pricePerShare!.toString()),
                nft.metadataUri,
                session.walletAddress // Mint directly to the user's wallet
              );
            } else {
              // For non-fractional NFTs, we still use the fractional NFT contract but with 10 shares
              const pricePerShare = nft.price! / 10; // Divide the total price by 10 shares
              mintTx = await collection.createFractionalNFT(
                10, // Default to 10 shares for non-fractional (as per requirements)
                ethers.parseEther(pricePerShare.toString()), // Price per fraction
                nft.metadataUri,
                session.walletAddress // Mint directly to the user's wallet
              );
            }
          } catch (mintError) {
            console.error("Error in minting NFT:", mintError);
            
            // If the contract doesn't support the 4-parameter function, try the 3-parameter version
            if (nft.isFractional) {
              mintTx = await collection.createFractionalNFT(
                nft.totalShares!,
                ethers.parseEther(nft.pricePerShare!.toString()),
                nft.metadataUri
              );
            } else {
              const pricePerShare = nft.price! / 10;
              mintTx = await collection.createFractionalNFT(
                10,
                ethers.parseEther(pricePerShare.toString()),
                nft.metadataUri
              );
            }
          }
        
          // Log the mint transaction hash for reference
          console.log(`Minted NFT #${i+1} (${nft.name}) in transaction:`, mintTx.hash);
        
          // Add the mint hash to the NFT data for later reference
          nft.mintTxHash = mintTx.hash;
          
          // Wait for the transaction to be confirmed
          const mintReceipt = await mintTx.wait();
          console.log(`NFT #${i+1} mint confirmed in block ${mintReceipt.blockNumber}`);
          
          // Try to extract the token ID from the mint receipt
          try {
            // Look for any events that might have token ID information
            for (const log of mintReceipt.logs) {
              try {
                const parsedLog = collection.interface.parseLog({
                  topics: log.topics,
                  data: log.data
                });
                
                if (parsedLog && parsedLog.name === "FractionalNFTCreated") {
                  nft.tokenId = parsedLog.args.tokenId;
                  console.log(`Found token ID for NFT #${i+1}: ${nft.tokenId}`);
                  break;
                }
              } catch (e) {
                // Skip logs that can't be parsed
                continue;
              }
            }
            
            if (!nft.tokenId) {
              console.log(`Could not extract token ID for NFT #${i+1}, using index as fallback`);
              nft.tokenId = i; // Use index as a fallback
            }
          } catch (tokenIdError) {
            console.error("Error extracting token ID:", tokenIdError);
            nft.tokenId = i; // Use index as a fallback
          }
          
          // Update the collection in localStorage with the new NFT
          const currentCollection = JSON.parse(localStorage.getItem(`collection_${collectionAddress}`) || '{}');
          currentCollection.nfts = currentCollection.nfts || [];
          currentCollection.nfts.push({
            name: nft.name,
            description: nft.description,
            metadataUri: nft.metadataUri,
            mintTxHash: nft.mintTxHash,
            tokenId: nft.tokenId,
            imagePreviewUrl: nft.imagePreviewUrl
          });
          
          localStorage.setItem(`collection_${collectionAddress}`, JSON.stringify(currentCollection));
        }
      } else {
        // For collections where we couldn't get the address, store the NFTs separately
        // so they can be linked to the collection later
        const pendingNFTs = nfts.map((nft, index) => ({
          name: nft.name,
          description: nft.description,
          metadataUri: nft.metadataUri,
          imagePreviewUrl: nft.imagePreviewUrl,
          tokenId: index // Placeholder until we can determine the actual token ID
        }));
        
        updatedCollection.nfts = pendingNFTs;
        localStorage.setItem(`collection_${collectionAddress}`, JSON.stringify(updatedCollection));
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
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Error deploying collection';
      let txHashInfo = '';
      
      if (error.message.includes('user rejected transaction')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (error.message.includes('Failed to get collection address')) {
        // Extract transaction hash from the error message if available
        const txHashMatch = error.message.match(/Check transaction ([0-9a-fA-Fx]+) on/);
        const txHash = txHashMatch ? txHashMatch[1] : null;
        
        if (txHash) {
          errorMessage = 'Collection deployed but address could not be retrieved. Check Etherscan for details.';
          txHashInfo = txHash;
        } else {
          errorMessage = 'Failed to get collection address. Check your wallet history.';
        }
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction. Please add ETH to your wallet.';
      } else if (error.message.includes('network changed')) {
        errorMessage = 'Network changed during transaction. Please stay on Sepolia network.';
      } else if (error.message.includes('not a function')) {
        errorMessage = 'Contract interaction failed. Please try again.';
      } else {
        // For other errors, use a simplified message
        errorMessage = 'Transaction failed. Please try again or check your wallet.';
      }
      
      setDeploymentProgress({
        ...deploymentProgress,
        status: 'error',
        error: errorMessage,
        txHashInfo: txHashInfo
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
            {/* Display wallet connection status message */}
            {walletMessage && (
              <div className={`p-3 rounded-lg border ${
                walletMessage.includes('not match') || walletMessage.includes('disconnect') || walletMessage.includes('Failed')
                  ? 'bg-red-900/30 border-red-500/50 text-red-200'
                  : walletMessage.includes('connected')
                    ? 'bg-green-900/30 border-green-500/50 text-green-200'
                    : 'bg-blue-900/30 border-blue-500/50 text-blue-200'
              }`}>
                <p className="flex items-center gap-2">
                  {connectingWallet && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {walletMessage}
                </p>
                
                {(walletMessage.includes('connect') || walletMessage.includes('disconnected')) && (
                  <button
                    onClick={handleConnectWallet}
                    disabled={connectingWallet || isLoading}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/80 to-purple-600/80
                    text-white font-medium text-sm transition-all duration-300 backdrop-blur-sm border border-cyan-400/30
                    flex items-center gap-2 hover:from-cyan-400/80 hover:to-purple-500/80"
                  >
                    {connectingWallet ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </button>
                )}
              </div>
            )}

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
              <GlassPanel className="p-4 space-y-3">
                <h3 className="text-base font-medium text-cyan-200">Deployment Progress</h3>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-black/30 text-cyan-200">
                        {deploymentProgress.status === 'deploying' && 'Deploying...'}
                        {deploymentProgress.status === 'complete' && 'Complete!'}
                        {deploymentProgress.status === 'error' && 'Failed'}
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
                  <div className="text-xs text-cyan-200/70">
                    {deploymentProgress.currentNft} of {deploymentProgress.total} NFTs processed
                  </div>
                </div>
                
                {/* Show transaction hash info only if it's a complete transaction with missing address */}
                {deploymentProgress.txHashInfo && deploymentProgress.status === 'complete' && (
                  <div className="p-2 bg-green-900/30 border border-green-500/30 rounded-lg text-green-200 text-xs">
                    <p>Transaction was successful but collection address not found automatically.</p>
                    <div className="mt-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${deploymentProgress.txHashInfo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        View on Etherscan
                      </a>
                    </div>
                  </div>
                )}
                
                {deploymentProgress.error && (
                  <div className="p-2 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200 text-xs">
                    {deploymentProgress.error}
                    {deploymentProgress.txHashInfo && (
                      <div className="mt-2">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${deploymentProgress.txHashInfo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          View on Etherscan
                        </a>
                      </div>
                    )}
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleDeployCollection}
                        className="px-3 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs rounded-md border border-red-500/30 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
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