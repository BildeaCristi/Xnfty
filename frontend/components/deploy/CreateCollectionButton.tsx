"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CollectionDetailsModal from './CollectionDetailsModal';

interface CreateCollectionButtonProps {
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'icon' | 'card';
}

const CreateCollectionButton: React.FC<CreateCollectionButtonProps> = ({ 
  buttonText = "Create Collection",
  className = "",
  variant = "default"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  if (variant === 'icon') {
    return (
      <>
        <button 
          onClick={handleOpen}
          className={`p-2 rounded-full bg-gradient-to-r from-cyan-500/80 to-purple-600/80 
          hover:from-cyan-400/80 hover:to-purple-500/80 text-white transition-all duration-300 
          backdrop-blur-sm border border-cyan-400/30 shadow-[0_0_10px_rgba(0,255,255,0.3)] 
          hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] ${className}`}
          aria-label="Create Collection"
        >
          <Plus className="w-5 h-5" />
        </button>

        {isOpen && <CollectionDetailsModal onClose={handleClose} />}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <div 
          onClick={handleOpen}
          className={`cursor-pointer aspect-square bg-gradient-to-br from-gray-900/90 to-black/80 
          backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 flex flex-col items-center 
          justify-center text-center hover:border-cyan-500/40 transition-all duration-300 
          shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/20 ${className}`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 
            flex items-center justify-center mb-3 hover:from-cyan-500/40 hover:to-purple-500/40 
            transition-all duration-300">
            <Plus className="w-6 h-6 text-cyan-300" />
          </div>
          <h3 className="text-base font-medium text-white mb-1">Create New Collection</h3>
          <p className="text-cyan-200/60 text-xs">Add your NFTs to a collection</p>
        </div>

        {isOpen && <CollectionDetailsModal onClose={handleClose} />}
      </>
    );
  }

  // Default button style
  return (
    <>
      <button 
        onClick={handleOpen}
        className={`px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/80 to-purple-600/80 
        hover:from-cyan-400/80 hover:to-purple-500/80 text-white font-medium transition-all duration-300 
        backdrop-blur-sm border border-cyan-400/30 shadow-[0_0_10px_rgba(0,255,255,0.3)] 
        hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] ${className}`}
      >
        {buttonText}
      </button>

      {isOpen && <CollectionDetailsModal onClose={handleClose} />}
    </>
  );
};

export default CreateCollectionButton; 