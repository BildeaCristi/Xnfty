"use client";

import React, { useState } from 'react';
import CollectionDetailsModal from './CollectionDetailsModal';

interface CollectionModalWrapperProps {
  buttonText?: string;
}

const CollectionModalWrapper: React.FC<CollectionModalWrapperProps> = ({ 
  buttonText = "Create Collection" 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-4 rounded"
      >
        {buttonText}
      </button>

      {isOpen && (
        <CollectionDetailsModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default CollectionModalWrapper; 