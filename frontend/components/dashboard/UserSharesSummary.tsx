'use client';

import {UserNFTShare} from '@/types';
import {Coins, Crown, TrendingUp} from 'lucide-react';

interface UserSharesSummaryProps {
    userNFTShares: UserNFTShare[];
}

export default function UserSharesSummary({userNFTShares}: UserSharesSummaryProps) {
    if (!userNFTShares || userNFTShares.length === 0) {
        return null;
    }

    const fullyOwnedNFTs = userNFTShares.filter(share =>
        share.isOwner || share.sharePercentage === 100
    );

    const partiallyOwnedNFTs = userNFTShares.filter(share =>
        !share.isOwner && share.sharePercentage < 100
    );

    const totalShares = userNFTShares.reduce((sum, share) => sum + share.userShares, 0);

    return (
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Coins className="w-5 h-5 mr-2 text-purple-400"/>
                Your NFT Shares Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-300 text-sm font-medium">Fully Owned</p>
                            <p className="text-white text-xl font-bold">{fullyOwnedNFTs.length}</p>
                        </div>
                        <Crown className="w-6 h-6 text-yellow-400"/>
                    </div>
                </div>

                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-300 text-sm font-medium">Partial Shares</p>
                            <p className="text-white text-xl font-bold">{partiallyOwnedNFTs.length}</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-purple-400"/>
                    </div>
                </div>

                <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-300 text-sm font-medium">Total Shares</p>
                            <p className="text-white text-xl font-bold">{totalShares}</p>
                        </div>
                        <Coins className="w-6 h-6 text-blue-400"/>
                    </div>
                </div>
            </div>

            {fullyOwnedNFTs.length > 0 && (
                <div className="mb-3">
                    <h4 className="text-green-300 font-medium text-sm mb-2 flex items-center">
                        <Crown className="w-4 h-4 mr-1"/>
                        NFTs You Own Completely:
                    </h4>
                    <div className="space-y-1">
                        {fullyOwnedNFTs.map((nft, idx) => (
                            <div key={idx}
                                 className="text-xs text-green-200 flex items-center justify-between bg-green-900/20 rounded p-2">
                                <span>NFT #{nft.tokenId} in Collection #{nft.collectionId}</span>
                                <span className="font-medium">100% ({nft.userShares}/{nft.totalShares} shares)</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {partiallyOwnedNFTs.length > 0 && (
                <div>
                    <h4 className="text-purple-300 font-medium text-sm mb-2">Partial Ownership:</h4>
                    <div className="space-y-1">
                        {partiallyOwnedNFTs.map((nft, idx) => (
                            <div key={idx}
                                 className="text-xs text-purple-200 flex items-center justify-between bg-purple-900/20 rounded p-2">
                                <span>NFT #{nft.tokenId} in Collection #{nft.collectionId}</span>
                                <span
                                    className="font-medium">{nft.sharePercentage}% ({nft.userShares}/{nft.totalShares} shares)</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 