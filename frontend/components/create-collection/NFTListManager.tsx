'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { NFTData } from '@/types/forms';
import { createNewNFT } from '@/services/CollectionCreatorService';
import NFTFormItem from './NFTFormItem';

interface NFTListManagerProps {
    nfts: NFTData[];
    onAddNFT: () => void;
    onRemoveNFT: (id: string) => void;
    onUpdateNFT: (id: string, field: keyof NFTData, value: any) => void;
    onImageUpload: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
}

export default function NFTListManager({
    nfts,
    onAddNFT,
    onRemoveNFT,
    onUpdateNFT,
    onImageUpload,
    onSubmit
}: NFTListManagerProps) {
    return (
        <div className="space-y-6">
            {/* Header - Removed Add NFT button */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Add NFTs to Collection</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Create the NFTs that will be part of your collection
                    </p>
                </div>
            </div>

            {/* NFT List */}
            {nfts.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-600">
                    <div className="max-w-sm mx-auto">
                        <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-white mb-2">No NFTs Added Yet</h4>
                        <p className="text-gray-400 text-sm mb-6">
                            Start by adding your first NFT to the collection
                        </p>
                        <button
                            onClick={onAddNFT}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            Add Your First NFT
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* NFT Items */}
                    {nfts.map((nft, index) => (
                        <NFTFormItem
                            key={nft.id}
                            nft={nft}
                            index={index}
                            onUpdate={onUpdateNFT}
                            onRemove={onRemoveNFT}
                            onImageUpload={onImageUpload}
                        />
                    ))}

                    {/* Add NFT Button - Moved here after the list */}
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={onAddNFT}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Add Another NFT</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Summary */}
            {nfts.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-blue-400 font-medium">Collection Summary</h4>
                            <p className="text-gray-400 text-sm">
                                {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} • {' '}
                                {nfts.filter(nft => nft.shouldFractionalize).length} fractionalized
                            </p>
                        </div>
                        <button
                            onClick={onSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                        >
                            Deploy Collection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 