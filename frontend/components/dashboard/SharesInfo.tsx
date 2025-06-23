'use client';

import { ExternalLink } from 'lucide-react';
import { DASHBOARD_LABELS, SHARE_STATUS } from '@/utils/constants/dashboard';
import type { CollectionWithShares } from '@/types';

interface SharesInfoProps {
  collection: CollectionWithShares;
  walletAddress: string;
  onAddToMetaMask: (fractionalContract: string, event: React.MouseEvent) => void;
}

export default function SharesInfo({ 
  collection, 
  walletAddress, 
  onAddToMetaMask 
}: SharesInfoProps) {
  if (!collection.userNFTShares || collection.userNFTShares.length === 0) {
    return null;
  }

  const hasCompleteOwnership = collection.userNFTShares.some(
    (share: any) => share.isOwner || share.sharePercentage === 100
  );

  const hasOwnershipTransfer = collection.userNFTShares.some(
    (share: any) => share.isOwnershipTransferred
  );

  return (
    <div className="mb-3 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-purple-300 font-medium">{DASHBOARD_LABELS.YOUR_SHARES}</span>
        <span className="text-purple-100 font-semibold">
          {collection.userNFTShares.length} NFT{collection.userNFTShares.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Individual NFT shares */}
      <div className="space-y-1 mb-2">
        {collection.userNFTShares.map((share: any, idx: number) => (
          <div 
            key={idx}
            className="text-xs text-purple-200 flex items-center justify-between"
          >
            <span>NFT #{share.tokenId}</span>
            <span className={`font-medium ${
              share.isOwner || share.sharePercentage === 100
                ? 'text-green-300'
                : 'text-purple-200'
            }`}>
              {share.userShares}/{share.totalShares} shares ({share.sharePercentage}%)
              {(share.isOwner || share.sharePercentage === 100) && (
                <span className="ml-1 text-yellow-300">Owner</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Total shares summary */}
      {collection.totalUserShares && (
        <div className="text-xs text-purple-200 mb-2 border-t border-purple-500/30 pt-2">
          <strong>
            Total: {collection.totalUserShares} shares across {collection.userNFTShares.length} NFTs
          </strong>
        </div>
      )}

      {/* Ownership status indicators */}
      {hasCompleteOwnership && (
        <div className="text-xs text-green-300 flex items-center mb-2">
          <span className="mr-1">•</span>
          {SHARE_STATUS.COMPLETE_OWNERSHIP}
        </div>
      )}

      {hasOwnershipTransfer && (
        <div className="text-xs text-yellow-300 flex items-center mb-2">
          <span className="mr-1">•</span>
          {SHARE_STATUS.OWNERSHIP_TRANSFERRED}
        </div>
      )}

      {/* MetaMask token addition buttons */}
      <div className="flex flex-wrap gap-1">
        {collection.userNFTShares.slice(0, 3).map((share: any, idx: number) => (
          <button
            key={idx}
            onClick={(e) => onAddToMetaMask(share.fractionalContract, e)}
            className={`text-xs px-2 py-1 rounded flex items-center transition-colors ${
              share.isOwner || share.sharePercentage === 100
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            title={`Add NFT #${share.tokenId} to MetaMask (${share.sharePercentage}% owned)`}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            NFT #{share.tokenId}
            {(share.isOwner || share.sharePercentage === 100) && (
              <span className="ml-1">Full</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 