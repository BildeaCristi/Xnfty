import React from 'react';
import { useContractRead } from 'wagmi';
import { FractionalNFT } from '@/types/contracts';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface CollectionCardProps {
  collectionId: number;
  onSelect: (collectionId: number) => void;
}

export default function CollectionCard({ collectionId, onSelect }: CollectionCardProps) {
  const { data: session } = useSession();
  const { data: collectionDetails } = useContractRead({
    ...FractionalNFT,
    functionName: 'getCollectionDetails',
    args: [BigInt(collectionId)],
  });

  if (!collectionDetails) return null;

  const [name, description, baseURI] = collectionDetails;

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => session?.walletAddress ? onSelect(collectionId) : null}
    >
      <div className="relative h-48">
        <Image
          src={`${baseURI}0.json`}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 line-clamp-2">{description}</p>
        {!session?.walletAddress && (
          <p className="mt-2 text-sm text-red-600">
            Connect wallet to view NFTs
          </p>
        )}
      </div>
    </div>
  );
} 