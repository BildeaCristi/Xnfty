// Form-related interfaces and types
import { Attribute } from './ipfs';

export interface NFTItem {
    image: File | null;
    attributes: Attribute[];
    price: string;
}

export interface NFTItemFormProps {
    nft: NFTItem;
    index: number;
    nfts: NFTItem[];
    setNfts: React.Dispatch<React.SetStateAction<NFTItem[]>>;
}

// Collection form data
export interface CollectionFormData {
    name: string;
    symbol: string;
    description: string;
    externalLink?: string;
}

// NFT form data for collection creation
export interface NFTData {
    id: string;
    name: string;
    description: string;
    image: File | null;
    imagePreview?: string;
    imageData?: {
        file: File;
        name: string;
        size: number;
        type: string;
        lastModified: number;
    };
    attributes: Array<{ trait_type: string; value: string }>;
    // Fractionalization settings
    shouldFractionalize: boolean;
    totalShares: number;
    sharePrice: string;
    fractionalName: string;
    fractionalSymbol: string;
    // Deployment status
    status: 'pending' | 'minting' | 'minted' | 'fractionalizing' | 'completed' | 'error';
    tokenId?: number;
    fractionalContract?: string;
    error?: string;
}

// Collection manager form data
export interface NFTFormData {
    name: string;
    description: string;
    image: File | null;
    attributes: Array<{ trait_type: string; value: string }>;
}

export interface FractionalizeFormData {
    totalShares: number;
    sharePrice: string;
    fractionalName: string;
    fractionalSymbol: string;
}

// Collection manager props
export interface CollectionManagerProps {
    collectionId: number;
    collectionAddress: string;
    onClose: () => void;
}

// Deployment step interface
export interface DeploymentStep {
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    description: string;
}

// Re-export Attribute for convenience
export type { Attribute } from './ipfs'; 