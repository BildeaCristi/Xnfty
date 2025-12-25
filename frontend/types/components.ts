// Component prop interfaces and types
import {ReactNode} from 'react';
import {Collection, UserNFTShare} from './blockchain';

// Modal and UI component props
export interface GlassModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    className?: string;
}

export interface GlassPanelProps {
    children: ReactNode;
    className?: string;
    noBorder?: boolean;
}

export interface NftModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Dashboard component props
export interface UserSharesSummaryProps {
    userNFTShares: UserNFTShare[];
}

// Collection component props
export interface CollectionDetailContentProps {
    collectionId: number;
}

export interface CollectionPageProps {
    params: { id: string };
}

// NFT component props
export interface NFTDetailModalProps {
    nft: any; // Type to be refined based on actual usage
    isOpen: boolean;
    onClose: () => void;
    collection?: Collection;
}

// Create collection modal props
export interface CreateCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (collectionId: number) => void;
} 