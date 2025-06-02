import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useSession } from 'next-auth/react';
import NFTForm from './NFTForm';

interface NFTData {
  name: string;
  description: string;
  image: File | null;
  traits: { trait_type: string; value: string }[];
  isFractional: boolean;
  totalShares?: number;
  pricePerShare?: number;
  price?: number;
  metadataUri?: string;
}

interface CollectionFormProps {
  onClose: () => void;
}

const CollectionForm: React.FC<CollectionFormProps> = ({ onClose }) => {
  const { data: session } = useSession();
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [showNFTForm, setShowNFTForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddNFT = (nftData: NFTData) => {
    setNfts([...nfts, nftData]);
    setShowNFTForm(false);
  };

  const handleDeployCollection = async () => {
    if (!session?.user?.address) {
      alert('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload collection metadata to Pinata
      const collectionMetadata = {
        name: collectionName,
        description: collectionDescription,
        image: '', // Will be set after uploading the first NFT's image
      };

      // 2. Deploy collection contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get factory contract
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
      const factoryAbi = [
        "function createCollection(string memory _name, string memory _description) external returns (address)"
      ];
      const factory = new ethers.Contract(factoryAddress, factoryAbi, signer);

      // Deploy new collection
      const tx = await factory.createCollection(collectionName, collectionDescription);
      const receipt = await tx.wait();
      const event = receipt.events.find((e: any) => e.event === "CollectionDeployed");
      const collectionAddress = event.args.collectionAddress;

      // 3. Mint NFTs in the collection
      const collectionAbi = [
        "function createFractionalNFT(uint256 totalShares, uint256 pricePerShare, string memory metadataURI) external returns (uint256)"
      ];
      const collection = new ethers.Contract(collectionAddress, collectionAbi, signer);

      for (const nft of nfts) {
        if (nft.isFractional) {
          await collection.createFractionalNFT(
            nft.totalShares!,
            ethers.parseEther(nft.pricePerShare!.toString()),
            nft.metadataUri
          );
        } else {
          // Handle non-fractional NFT minting
          // You'll need to implement this based on your requirements
        }
      }

      alert('Collection deployed successfully!');
      onClose();
    } catch (error) {
      console.error('Error deploying collection:', error);
      alert('Error deploying collection. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Create NFT Collection</h2>
        
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
          <h3 className="text-lg font-semibold mb-2">NFTs in Collection</h3>
          {nfts.length > 0 ? (
            <ul className="space-y-2">
              {nfts.map((nft, index) => (
                <li key={index} className="border p-2 rounded">
                  <div className="font-medium">{nft.name}</div>
                  <div className="text-sm text-gray-600">
                    {nft.isFractional ? (
                      <>Fractional: {nft.totalShares} shares at {nft.pricePerShare} ETH each</>
                    ) : (
                      <>Price: {nft.price} ETH</>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No NFTs added yet</p>
          )}
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowNFTForm(true)}
          >
            Add NFT
          </button>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDeployCollection}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={isLoading || !collectionName || nfts.length === 0}
          >
            {isLoading ? 'Deploying...' : 'Deploy Collection'}
          </button>
        </div>

        {showNFTForm && (
          <NFTForm
            onSave={handleAddNFT}
            onCancel={() => setShowNFTForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CollectionForm; 