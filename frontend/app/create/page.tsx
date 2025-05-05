import React from 'react';
import CollectionForm from '@/components/CollectionForm';

export default function CreateCollectionPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Create NFT Collection
          </h1>
          <p className="mt-3 text-xl text-gray-500 dark:text-gray-300 sm:mt-4">
            Create and deploy your own NFT collection with fractional ownership options
          </p>
        </div>

        <div className="mt-12">
          <CollectionForm onClose={() => window.history.back()} />
        </div>
      </div>
    </div>
  );
} 