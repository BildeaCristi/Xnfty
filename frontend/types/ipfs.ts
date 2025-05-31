// IPFS and metadata-related interfaces and types

export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    external_url?: string;
    animation_url?: string;
    price?: string; // Additional field from nft.ts
}

export interface CollectionMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
    external_link?: string;
    seller_fee_basis_points?: number;
    fee_recipient?: string;
}

export interface Attribute {
    trait_type: string;
    value: string;
} 