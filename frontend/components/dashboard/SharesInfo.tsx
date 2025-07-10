'use client';

import {DASHBOARD_LABELS, SHARE_STATUS} from '@/utils/constants/dashboard';
import type {CollectionWithShares} from '@/types';

interface SharesInfoProps {
    collection: CollectionWithShares;
    walletAddress: string;
}

export default function SharesInfo({
                                       collection,
                                       walletAddress,
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
        </div>
    );
} 