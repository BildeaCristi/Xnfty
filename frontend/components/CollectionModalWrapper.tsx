"use client";

import React from 'react';
import { CreateCollectionButton } from '@/components/deploy';

interface CollectionModalWrapperProps {
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'icon' | 'card';
}

const CollectionModalWrapper: React.FC<CollectionModalWrapperProps> = ({ 
  buttonText = "Create Collection",
  className = "",
  variant = "default"
}) => {
  return (
    <CreateCollectionButton 
      buttonText={buttonText}
      className={className}
      variant={variant}
    />
  );
};

export default CollectionModalWrapper; 