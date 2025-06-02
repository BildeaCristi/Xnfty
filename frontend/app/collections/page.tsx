import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { FractionalNFT } from '@/types/contracts';
import CreateCollectionModal from '@/components/CreateCollectionModal';
import CreateNFTModal from '@/components/CreateNFTModal';
import CollectionCard from '@/components/CollectionCard';
import NFTCard from '@/components/NFTCard';

export default function CollectionsPage() {
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [isCreateNFTModalOpen, setIsCreateNFTModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collections, setCollections] = useState<number[]>([]);
  const [nfts, setNfts] = useState<{ tokenId: number; collectionId: number }[]>([]);
  const { address } = useAccount();

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      // This is a placeholder. In a real app, you'd need to track collection IDs
      // either through events or by maintaining a list in the contract
      const collectionIds = [0, 1, 2]; // Example collection IDs
      setCollections(collectionIds);
    };

    fetchCollections();
  }, []);

  // Fetch NFTs for selected collection
  useEffect(() => {
    if (selectedCollectionId === null) return;

    const fetchNFTs = async () => {
      // This is a placeholder. In a real app, you'd need to track NFT IDs
      // either through events or by maintaining a list in the contract
      const nftIds = [0, 1, 2]; // Example NFT IDs
      setNfts(nftIds.map(tokenId => ({ tokenId, collectionId: selectedCollectionId })));
    };

    fetchNFTs();
  }, [selectedCollectionId]);

  const handleCollectionSelect = (collectionId: number) => {
    setSelectedCollectionId(collectionId);
    setIsCreateNFTModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">NFT Collections</h1>
        <button
          onClick={() => setIsCreateCollectionModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Create Collection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {collections.map((collectionId) => (
          <CollectionCard
            key={collectionId}
            collectionId={collectionId}
            onSelect={handleCollectionSelect}
          />
        ))}
      </div>

      {selectedCollectionId !== null && (
        <>
          <h2 className="text-2xl font-bold mb-6">NFTs in Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map(({ tokenId, collectionId }) => (
              <NFTCard
                key={tokenId}
                tokenId={tokenId}
                collectionId={collectionId}
              />
            ))}
          </div>
        </>
      )}

      <CreateCollectionModal
        isOpen={isCreateCollectionModalOpen}
        onClose={() => setIsCreateCollectionModalOpen(false)}
        contractAddress={FractionalNFT.address}
      />

      {selectedCollectionId !== null && (
        <CreateNFTModal
          isOpen={isCreateNFTModalOpen}
          onClose={() => {
            setIsCreateNFTModalOpen(false);
            setSelectedCollectionId(null);
          }}
          contractAddress={FractionalNFT.address}
          collectionId={selectedCollectionId}
          collectionBaseURI=""
        />
      )}
    </div>
  );
} 