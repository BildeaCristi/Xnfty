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
    <div className="relative backdrop-blur-md bg-gradient-to-br from-black/40 to-black/20 border border-cyan-500/20 
        rounded-lg overflow-hidden shadow-md shadow-cyan-500/10 transition-all duration-300 hover:shadow-cyan-500/30 group">
      {/* Preview Image */}
      <div className="aspect-square overflow-hidden relative">
        {nft.imagePreviewUrl ? (
          <img 
            src={nft.imagePreviewUrl} 
            alt={nft.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-black/30 text-cyan-300">
            <span>No Image</span>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70"></div>
        
        {/* Remove button */}
        <button
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-1.5 right-1.5 p-1 bg-red-500/20 backdrop-blur-md text-white rounded-full
            hover:bg-red-500/40 disabled:opacity-50 transition-colors z-10 border border-red-500/30"
          title="Remove NFT"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* NFT Info - Positioned as overlay on image */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white z-10">
        <h3 className="font-medium text-white truncate text-sm">{nft.name}</h3>
        
        <div className="mt-1.5 text-xs">
          {nft.isFractional ? (
            <div className="flex justify-between items-center">
              <span className="text-purple-200/90">Shares</span>
              <span className="font-medium text-cyan-300">
                {nft.totalShares} @ {nft.pricePerShare} ETH
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-purple-200/90">Price</span>
              <span className="font-medium text-cyan-300">
                {nft.price} ETH
              </span>
            </div>
          )}
          
          {/* Total calculated value */}
          <div className="flex justify-between items-center mt-0.5">
            <span className="text-purple-200/90">Value</span>
            <span className="font-medium text-green-400">
              {nft.isFractional 
                ? (nft.totalShares || 0) * (nft.pricePerShare || 0)
                : nft.price || 0
              } ETH
            </span>
          </div>
        </div>
        
        {/* Trait badges (show max 2) */}
        {nft.traits.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {nft.traits.slice(0, 2).map((trait, index) => (
              <div 
                key={index} 
                className="text-[10px] backdrop-blur-md bg-cyan-900/30 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-500/20"
                title={`${trait.trait_type}: ${trait.value}`}
              >
                <span className="truncate">{trait.trait_type}: {trait.value}</span>
              </div>
            ))}
            {nft.traits.length > 2 && (
              <div className="text-[10px] backdrop-blur-md bg-purple-900/30 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/20">
                +{nft.traits.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard; 