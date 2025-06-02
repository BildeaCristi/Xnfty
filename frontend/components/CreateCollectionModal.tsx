import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { useContractWrite, useTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { FractionalNFT } from '../types/contracts';
import { useSession } from 'next-auth/react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
}

interface CollectionFormData {
  name: string;
  description: string;
  baseURI: string;
}

export default function CreateCollectionModal({ isOpen, onClose, contractAddress }: CreateCollectionModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CollectionFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();

  const { writeContract: createCollection, data: createCollectionData } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: FractionalNFT.abi,
    functionName: 'createCollection',
  });

  const { isLoading: isCreating } = useTransaction({
    hash: createCollectionData?.hash,
  });

  const onSubmit = async (data: CollectionFormData) => {
    if (!session?.walletAddress) {
      console.error('No wallet address found. Please connect your wallet first.');
      return;
    }

    try {
      setIsUploading(true);
      createCollection({
        args: [data.name, data.description, data.baseURI],
      });
    } catch (error) {
      console.error('Error creating collection:', error);
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
              Please connect your wallet to create a collection.
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
            Create New Collection
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Collection Name
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
                Base URI (IPFS)
              </label>
              <input
                type="text"
                {...register('baseURI', { required: 'Base URI is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="ipfs://"
              />
              {errors.baseURI && (
                <p className="mt-1 text-sm text-red-600">{errors.baseURI.message}</p>
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
                {isUploading || isCreating ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 