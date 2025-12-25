'use client';

import React from 'react';
import {Plus, Trash2, Upload, X} from 'lucide-react';
import type {NFTData} from '@/types/forms';
import {
    createImageData,
    createImagePreview,
    formatFileSize,
    validateImageFile
} from '@/services/CollectionCreatorService';

interface NFTFormItemProps {
    nft: NFTData;
    index: number;
    onUpdate: (id: string, field: keyof NFTData, value: any) => void;
    onRemove: (id: string) => void;
    onImageUpload: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function NFTFormItem({
                                        nft,
                                        index,
                                        onUpdate,
                                        onRemove,
                                        onImageUpload
                                    }: NFTFormItemProps) {
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validation = validateImageFile(file);
            if (!validation.isValid) {
                alert(validation.error);
                return;
            }

            const imageData = createImageData(file);
            onUpdate(nft.id, 'image', file);
            onUpdate(nft.id, 'imageData', imageData);

            try {
                const preview = await createImagePreview(file);
                onUpdate(nft.id, 'imagePreview', preview);
            } catch (error) {
                console.warn('Failed to create image preview:', error);
            }
        }
        onImageUpload(nft.id, event);
    };

    const addAttribute = () => {
        const newAttributes = [...nft.attributes, {trait_type: '', value: ''}];
        onUpdate(nft.id, 'attributes', newAttributes);
    };

    const removeAttribute = (index: number) => {
        const newAttributes = nft.attributes.filter((_, i) => i !== index);
        onUpdate(nft.id, 'attributes', newAttributes);
    };

    const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
        const newAttributes = [...nft.attributes];
        newAttributes[index] = {...newAttributes[index], [field]: value};
        onUpdate(nft.id, 'attributes', newAttributes);
    };

    return (
        <div
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">NFT {index + 1}</h3>
                <button
                    onClick={() => onRemove(nft.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-900/20 rounded-lg"
                    aria-label="Remove NFT"
                >
                    <Trash2 className="w-5 h-5"/>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Image Upload */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        NFT Image *
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id={`nft-image-${nft.id}`}
                        />
                        <label
                            htmlFor={`nft-image-${nft.id}`}
                            className="block w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-gray-800/30"
                        >
                            {nft.imagePreview ? (
                                <div className="relative w-full h-full group">
                                    <img
                                        src={nft.imagePreview}
                                        alt="NFT preview"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                    <div
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                        <div className="text-center text-white">
                                            <Upload className="w-6 h-6 mx-auto mb-1"/>
                                            <span className="text-sm font-medium">Change Image</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                                    <Upload className="w-12 h-12 mb-3"/>
                                    <span className="text-sm font-medium mb-1">Upload NFT Image</span>
                                    <span className="text-xs text-center">PNG, JPG, GIF up to 10MB</span>
                                </div>
                            )}
                        </label>
                    </div>
                    {nft.imageData && (
                        <div className="bg-gray-800/50 rounded-lg p-2">
                            <p className="text-xs text-gray-400 break-all">
                                <span className="font-medium text-gray-300">File:</span> {nft.imageData.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                <span
                                    className="font-medium text-gray-300">Size:</span> {formatFileSize(nft.imageData.size)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column - NFT Details */}
                <div className="space-y-4">
                    {/* NFT Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={nft.name}
                            onChange={(e) => onUpdate(nft.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            placeholder="Enter NFT name"
                        />
                    </div>

                    {/* NFT Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={nft.description}
                            onChange={(e) => onUpdate(nft.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                            placeholder="Describe your NFT"
                        />
                    </div>

                    {/* Fractionalization Toggle */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={nft.shouldFractionalize}
                                onChange={(e) => onUpdate(nft.id, 'shouldFractionalize', e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-white font-medium">Enable Fractional Ownership</span>
                        </label>
                        <p className="text-gray-400 text-sm mt-2 ml-7">
                            Allow others to buy shares of this NFT
                        </p>
                    </div>
                </div>
            </div>

            {/* Fractionalization Settings */}
            {nft.shouldFractionalize && (
                <div className="mt-6 bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                    <h4 className="text-white font-medium mb-4 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Fractional Ownership Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Total Shares *
                            </label>
                            <input
                                type="number"
                                value={nft.totalShares}
                                onChange={(e) => onUpdate(nft.id, 'totalShares', parseInt(e.target.value) || 1000)}
                                min="1"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Price per Share (ETH) *
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                value={nft.sharePrice}
                                onChange={(e) => onUpdate(nft.id, 'sharePrice', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Fractional Token Name *
                            </label>
                            <input
                                type="text"
                                value={nft.fractionalName}
                                onChange={(e) => onUpdate(nft.id, 'fractionalName', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                placeholder={`${nft.name || 'NFT'} Shares`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Fractional Token Symbol *
                            </label>
                            <input
                                type="text"
                                value={nft.fractionalSymbol}
                                onChange={(e) => onUpdate(nft.id, 'fractionalSymbol', e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                placeholder={`${nft.name?.substring(0, 3).toUpperCase() || 'NFT'}S`}
                                maxLength={5}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Attributes */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Attributes</h4>
                    <button
                        onClick={addAttribute}
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors bg-blue-900/20 hover:bg-blue-900/30 px-3 py-1 rounded-lg"
                    >
                        <Plus className="w-4 h-4"/>
                        <span className="text-sm">Add Attribute</span>
                    </button>
                </div>

                {nft.attributes.length === 0 ? (
                    <div className="text-center py-6 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-600">
                        <p className="text-gray-400 text-sm">No attributes added yet</p>
                        <p className="text-gray-500 text-xs mt-1">Attributes help describe unique properties of your
                            NFT</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {nft.attributes.map((attr, attrIndex) => (
                            <div key={attrIndex} className="flex items-center space-x-3 bg-gray-800/30 p-3 rounded-lg">
                                <input
                                    type="text"
                                    value={attr.trait_type}
                                    onChange={(e) => updateAttribute(attrIndex, 'trait_type', e.target.value)}
                                    placeholder="Trait type (e.g., Color)"
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                                <input
                                    type="text"
                                    value={attr.value}
                                    onChange={(e) => updateAttribute(attrIndex, 'value', e.target.value)}
                                    placeholder="Value (e.g., Blue)"
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                                <button
                                    onClick={() => removeAttribute(attrIndex)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-900/20 rounded-lg"
                                    aria-label="Remove attribute"
                                >
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 