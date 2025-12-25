'use client';

import React, {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Upload} from 'lucide-react';
import type {CollectionFormData} from '@/types/forms';
import {formatFileSize, validateImageFile} from '@/services/CollectionCreatorService';

interface CollectionFormProps {
    onSubmit: (data: CollectionFormData) => void;
    collectionImage: File | null;
    collectionImagePreview: string;
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    defaultValues?: CollectionFormData | null;
}

export default function CollectionForm({
                                           onSubmit,
                                           collectionImage,
                                           collectionImagePreview,
                                           onImageUpload,
                                           defaultValues
                                       }: CollectionFormProps) {
    const {
        register,
        handleSubmit,
        formState: {errors},
        reset
    } = useForm<CollectionFormData>({
        defaultValues: defaultValues || undefined
    });

    useEffect(() => {
        if (defaultValues) {
            reset(defaultValues);
        }
    }, [defaultValues, reset]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validation = validateImageFile(file);
            if (!validation.isValid) {
                alert(validation.error);
                return;
            }
        }
        onImageUpload(event);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Collection Image */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Collection Image *
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="collection-image"
                            />
                            <label
                                htmlFor="collection-image"
                                className="block w-full aspect-square border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-gray-800/30"
                            >
                                {collectionImagePreview ? (
                                    <div className="relative w-full h-full group">
                                        <img
                                            src={collectionImagePreview}
                                            alt="Collection preview"
                                            className="w-full h-full object-contain rounded-xl"
                                        />
                                        <div
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                            <div className="text-center text-white">
                                                <Upload className="w-8 h-8 mx-auto mb-2"/>
                                                <span className="text-sm font-medium">Click to change</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                                        <Upload className="w-16 h-16 mb-4"/>
                                        <span className="text-lg font-medium mb-2">Upload Collection Image</span>
                                        <span className="text-sm text-center">PNG, JPG, GIF up to 10MB</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        {collectionImage && (
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <p className="text-xs text-gray-400 break-all">
                                    <span className="font-medium text-gray-300">File:</span> {collectionImage.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    <span
                                        className="font-medium text-gray-300">Size:</span> {formatFileSize(collectionImage.size)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Collection Details */}
                    <div className="space-y-6">
                        {/* Collection Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Collection Name *
                            </label>
                            <input
                                {...register('name', {
                                    required: 'Collection name is required',
                                    minLength: {value: 2, message: 'Name must be at least 2 characters'},
                                    maxLength: {value: 50, message: 'Name must be less than 50 characters'}
                                })}
                                type="text"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter collection name"
                            />
                            {errors.name && (
                                <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Collection Symbol */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Collection Symbol *
                            </label>
                            <input
                                {...register('symbol', {
                                    required: 'Collection symbol is required',
                                    minLength: {value: 2, message: 'Symbol must be at least 2 characters'},
                                    maxLength: {value: 10, message: 'Symbol must be less than 10 characters'},
                                    pattern: {
                                        value: /^[A-Z0-9]+$/,
                                        message: 'Symbol must be uppercase letters and numbers only'
                                    }
                                })}
                                type="text"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase transition-colors"
                                placeholder="e.g., MYNFT"
                                onChange={(e) => {
                                    e.target.value = e.target.value.toUpperCase();
                                }}
                            />
                            {errors.symbol && (
                                <p className="text-red-400 text-sm mt-1">{errors.symbol.message}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                                Used as the token symbol on the blockchain
                            </p>
                        </div>

                        {/* Collection Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                {...register('description', {
                                    required: 'Collection description is required',
                                    minLength: {value: 10, message: 'Description must be at least 10 characters'},
                                    maxLength: {value: 500, message: 'Description must be less than 500 characters'}
                                })}
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                                placeholder="Describe your NFT collection..."
                            />
                            {errors.description && (
                                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                                Tell people what makes your collection special
                            </p>
                        </div>

                        {/* External Link (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                External Link (Optional)
                            </label>
                            <input
                                {...register('externalLink', {
                                    pattern: {
                                        value: /^https?:\/\/.+/,
                                        message: 'Please enter a valid URL starting with http:// or https://'
                                    }
                                })}
                                type="url"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="https://yourwebsite.com"
                            />
                            {errors.externalLink && (
                                <p className="text-red-400 text-sm mt-1">{errors.externalLink.message}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                                Link to your website, social media, or project page
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-700">
                    <button
                        type="submit"
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue to NFTs
                    </button>
                </div>
            </form>
        </div>
    );
} 