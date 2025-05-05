"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CollectionDetailsModal } from '@/components/deploy';
import DashboardBackground from '@/components/dashboard/DashboardBackground';
import GlassPanel from '@/components/dashboard/GlassPanel';
import { ArrowLeft } from 'lucide-react';

export default function CreateCollectionContent() {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/dashboard');
  };
  
  return (
    <>
      <DashboardBackground />
      
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <button 
              onClick={handleBack}
              className="flex items-center text-cyan-300 hover:text-cyan-100 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            
            <GlassPanel className="p-8 text-center max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                Create NFT Collection
              </h1>
              <p className="text-cyan-100/80 text-lg mb-6 max-w-2xl mx-auto">
                Create and deploy your own NFT collection with fractional ownership options
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-600 mx-auto rounded-full"></div>
            </GlassPanel>
          </header>

          <div className="mt-8">
            <GlassPanel className="p-0 relative">
              <CollectionDetailsModal onClose={handleBack} />
            </GlassPanel>
          </div>
        </div>
      </div>
    </>
  );
} 