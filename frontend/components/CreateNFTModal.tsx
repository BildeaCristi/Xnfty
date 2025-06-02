import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { useContractWrite, useTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { FractionalNFT } from '../types/contracts';
import { usePinataUpload } from '../hooks/usePinataUpload';
import { useSession } from 'next-auth/react';

interface CreateNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
  collectionId: number;
  collectionBaseURI: string;
}

interface NFTFormData {
  name: string;
  description: string;
  price: string;
  totalFractions: number;
  image: FileList;
  attributes: string;
}

export default function CreateNFTModal({
  isOpen,
  onClose,
  contractAddress,
  collectionId,
  collectionBaseURI,
}: CreateNFTModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<NFTFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();
  const { uploadToPinata } = usePinataUpload();

  const { writeContract: createNFT, data: createNFTData } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: FractionalNFT.abi,
    functionName: 'createNFT',
  });

  const { isLoading: isCreating } = useTransaction({
    hash: createNFTData?.hash,
  });

  const onSubmit = async (data: NFTFormData) => {
    if (!session?.walletAddress) {
      console.error('No wallet address found. Please connect your wallet first.');
      return;
    }

    try {
      setIsUploading(true);

      // Upload image to Pinata
      const imageFile = data.image[0];
      const imageHash = await uploadToPinata(imageFile);

      // Create metadata
      const metadata = {
        name: data.name,
        description: data.description,
        image: `ipfs://${imageHash}`,
        attributes: JSON.parse(data.attributes),
      };

      // Upload metadata to Pinata
      const metadataHash = await uploadToPinata(
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );

      // Create NFT on blockchain
      createNFT({
        args: [
          BigInt(collectionId),
          parseEther(data.price),
          BigInt(data.totalFractions),
        ],
      });
    } catch (error) {
      console.error('Error creating NFT:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!session?.walletAddress) {
    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Connect Wallet Required
            </Dialog.Title>
            <p className="text-gray-600 mb-4">
              Please connect your wallet to create an NFT.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Create New NFT
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                NFT Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price (ETH)
              </label>
              <input
                type="number"
                step="0.000000000000000001"
                {...register('price', { required: 'Price is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Fractions (max 10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                {...register('totalFractions', {
                  required: 'Total fractions is required',
                  min: { value: 1, message: 'Minimum 1 fraction' },
                  max: { value: 10, message: 'Maximum 10 fractions' },
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.totalFractions && (
                <p className="mt-1 text-sm text-red-600">{errors.totalFractions.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                NFT Image
              </label>
              <input
                type="file"
                accept="image/*"
                {...register('image', { required: 'Image is required' })}
                className="mt-1 block w-full"
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Attributes (JSON)
              </label>
              <textarea
                {...register('attributes', { required: 'Attributes are required' })}
                rows={3}
                placeholder='[{"trait_type": "Background", "value": "Blue"}, ...]'
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.attributes && (
                <p className="mt-1 text-sm text-red-600">{errors.attributes.message}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || isCreating}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUploading || isCreating ? 'Creating...' : 'Create NFT'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 