import React, { useState } from 'react';
import { useContractRead, useContractWrite, useTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { FractionalNFT } from '@/types/contracts';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface NFTCardProps {
  tokenId: number;
  collectionId: number;
}

export default function NFTCard({ tokenId, collectionId }: NFTCardProps) {
  const [amount, setAmount] = useState(1);
  const { data: session } = useSession();

  const { data: nftDetails } = useContractRead({
    ...FractionalNFT,
    functionName: 'getNFTDetails',
    args: [BigInt(tokenId)],
  });

  const { data: collectionDetails } = useContractRead({
    ...FractionalNFT,
    functionName: 'getCollectionDetails',
    args: [BigInt(collectionId)],
  });

  const { writeContract: buyFractions, data: buyData } = useContractWrite({
    ...FractionalNFT,
    functionName: 'buyFractions',
  });

  const { isLoading: isBuying } = useTransaction({
    hash: buyData?.hash,
  });

  const handleBuy = () => {
    if (!session?.walletAddress) {
      console.error('No wallet address found. Please connect your wallet first.');
      return;
    }

    if (!nftDetails) return;
    const price = nftDetails[1] * BigInt(amount);
    buyFractions({
      args: [BigInt(tokenId), BigInt(amount)],
      value: price,
    });
  };

  if (!nftDetails || !collectionDetails) return null;

  const [collectionId_, price, totalFractions, availableFractions, creator] = nftDetails;
  const [name, description, baseURI] = collectionDetails;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <Image
          src={`${baseURI}${tokenId}.json`}
          alt={`NFT #${tokenId}`}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">NFT #{tokenId}</h3>
        <p className="text-gray-600 mb-4">{name}</p>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Price per fraction:</span>
            <span className="font-medium">{parseEther(price.toString())} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Available fractions:</span>
            <span className="font-medium">{availableFractions.toString()}</span>
          </div>
        </div>

        {availableFractions > 0 && (
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max={availableFractions.toString()}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={handleBuy}
                disabled={isBuying || !session?.walletAddress}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isBuying ? 'Buying...' : session?.walletAddress ? 'Buy Fractions' : 'Connect Wallet'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Total: {parseEther((price * BigInt(amount)).toString())} ETH
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 