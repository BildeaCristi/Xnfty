// Blockchain-related interfaces and types

export interface Collection {
    collectionId: number;
    metadataURI: string;
    collectionAddress: string;
    owner: string;
    creationTime: number;
    name?: string;
    symbol?: string;
    description?: string;
    imageURI?: string;
}

export interface NFT {
    tokenId: number;
    metadataURI: string;
    creationTime: number;
    fractionalContract: string;
    isfractionalized: boolean;
    name?: string;
    description?: string;
    imageURI?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
}

export interface FractionalNFTInfo {
    collection: string;
    tokenId: number;
    metadataURI: string;
    sharePrice: string;
    totalShares: number;
    currentOwner: string;
    createdAt: number;
}

export interface ShareHolder {
    holder: string;
    shares: number;
    percentage: number;
}

export interface CollectionStats {
    totalNFTs: number;
    fractionalizedNFTs: number;
    currentOwner: string;
}

export interface UserNFTShare {
    collectionId: number;
    collectionAddress: string;
    tokenId: number;
    fractionalContract: string;
    userShares: number;
    totalShares: number;
    sharePercentage: number;
    metadataURI: string;
    isOwner: boolean;
    name?: string;
    description?: string;
    imageURI?: string;
}

export interface CollectionNFTInfo {
    tokenId: number;
    fractionalContract: string;
    metadataURI: string;
    totalShares: number;
    currentOwner: string;
    sharePrice: number;
    isfractionalized: boolean;
    creationTime: number;
    name?: string;
    description?: string;
    imageURI?: string;
}

// Extended collection interface for shared collections
export interface CollectionWithShares extends Collection {
    userNFTShares?: UserNFTShare[];
    totalUserShares?: number;
} 