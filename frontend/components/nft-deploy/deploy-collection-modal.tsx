import React, { useState } from 'react';
import { ethers, BrowserProvider, Contract, parseEther } from 'ethers';
import type { Session } from "next-auth";
import NFTFormModal from './NFTFormModal';

// Replace with your deployed CollectionFactory contract address and ABI.
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS!;
const FACTORY_ABI = [
    "function createCollection(string memory _name, string memory _description) external returns (address)"
];

export interface NFTData {
    name: string;
    description: string;
    fractions: number;
    price: number; // Price per fraction in ETH
    attributes: { traitType: string; value: string }[];
    imageFile: File;
    // Assume metadataUri is filled after uploading to Pinata
    metadataUri: string;
    imagePreview: string;
}

interface CollectionDeployModalProps {
    onClose: () => void;
    session: Session;
}

const CollectionDeployModal: React.FC<CollectionDeployModalProps> = ({ onClose, session }) => {
    const [collectionName, setCollectionName] = useState("");
    const [collectionDescription, setCollectionDescription] = useState("");
    const [nfts, setNfts] = useState<NFTData[]>([]);
    const [showNftForm, setShowNftForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Handler to add an NFT to the collection.
    const addNFT = (nftData: NFTData) => {
        setNfts(prev => [...prev, nftData]);
        setShowNftForm(false);
    };

    // Final deploy: create a new collection contract via the factory, then mint each NFT.
    const deployCollection = async () => {
        if (!session?.walletAddress) {
            alert("Please connect a wallet.");
            return;
        }
        if (!window.ethereum) {
            alert("Please install MetaMask.");
            return;
        }
        setIsLoading(true);
        try {
            const ethProvider = window.ethereum as any;
            const provider = new BrowserProvider(ethProvider);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            // Call factory to deploy a new collection contract.
            const factoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
            const tx = await factoryContract.createCollection(collectionName, collectionDescription);
            const receipt = await tx.wait();
            // Extract the new collection contract address from the emitted event.
            const event = receipt.events.find((e: any) => e.event === "CollectionDeployed");
            const newCollectionAddress = event.args.collectionAddress;
            alert(`Collection deployed at: ${newCollectionAddress}`);

            // For each NFT in the collection, call createFractionalNFT on the new collection contract.
            const collectionContract = new Contract(newCollectionAddress, require('../../utils/fractionalNftContractMetada.json').abi, signer);
            for (const nft of nfts) {
                // nft.metadataUri should have been obtained via your API (Pinata upload).
                const txMint = await collectionContract.createFractionalNFT(
                    nft.fractions,
                    parseEther(nft.price.toString()),
                    nft.metadataUri
                );
                await txMint.wait();
            }
            alert("All NFTs minted in the collection!");
            onClose();
        } catch (error) {
            console.error("Deployment error:", error);
            alert("Error deploying collection. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-xl relative">
                <h2 className="text-2xl font-bold mb-4">Create New NFT Collection</h2>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                    aria-label="Close modal"
                >
                    ×
                </button>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Collection Name</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded dark:bg-gray-700"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Collection Description</label>
                    <textarea
                        className="w-full p-2 border rounded dark:bg-gray-700"
                        rows={3}
                        value={collectionDescription}
                        onChange={(e) => setCollectionDescription(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">NFTs in Collection</h3>
                    {nfts.length > 0 ? (
                        <ul>
                            {nfts.map((nft, index) => (
                                <li key={index} className="border p-2 rounded mb-2 flex items-center">
                                    {nft.imagePreview && (
                                        <img src={nft.imagePreview} alt={nft.name} className="w-12 h-12 object-cover rounded mr-3" />
                                    )}
                                    <div>
                                        <div className="font-medium">{nft.name}</div>
                                        <div className="text-sm text-gray-600">Fractions: {nft.fractions}, Price: {nft.price} ETH</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">No NFTs added yet.</p>
                    )}
                    <button
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => setShowNftForm(true)}
                    >
                        Add NFT
                    </button>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={deployCollection}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-green-400"
                        disabled={isLoading || !collectionName || nfts.length === 0}
                    >
                        {isLoading ? "Deploying..." : "Deploy Collection"}
                    </button>
                </div>

                {showNftForm && (
                    <NFTFormModal
                        onSave={(data) => {
                            setNfts(prev => [...prev, data]);
                            setShowNftForm(false);
                        }}
                        onCancel={() => setShowNftForm(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default CollectionDeployModal;
