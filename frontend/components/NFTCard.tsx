"use client";

import React from 'react';
import { X } from 'lucide-react';

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

interface NFTCardProps {
  nft: NFTData;
  onRemove: () => void;
  disabled?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onRemove, disabled = false }) => {
  return (
    <div className="relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow">
      {/* Preview Image */}
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
        {nft.imagePreviewUrl ? (
          <img 
            src={nft.imagePreviewUrl} 
            alt={nft.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span>No Image</span>
          </div>
        )}
        
        {/* Remove button */}
        <button
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-2 right-2 p-1 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 disabled:opacity-50"
          title="Remove NFT"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* NFT Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">{nft.name}</h3>
        {nft.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
            {nft.description}
          </p>
        )}
        
        <div className="mt-2 text-xs">
          {nft.isFractional ? (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Fractional</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {nft.totalShares} shares @ {nft.pricePerShare} ETH
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Price</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {nft.price} ETH
              </span>
            </div>
          )}
          
          {/* Total calculated value */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-600 dark:text-gray-400">Total Value</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {nft.isFractional 
                ? (nft.totalShares || 0) * (nft.pricePerShare || 0)
                : nft.price || 0
              } ETH
            </span>
          </div>
        </div>
        
        {/* Trait badges (show max 3) */}
        {nft.traits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {nft.traits.slice(0, 3).map((trait, index) => (
              <div 
                key={index} 
                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded"
                title={`${trait.trait_type}: ${trait.value}`}
              >
                <span className="truncate">{trait.trait_type}: {trait.value}</span>
              </div>
            ))}
            {nft.traits.length > 3 && (
              <div className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded">
                +{nft.traits.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard; 