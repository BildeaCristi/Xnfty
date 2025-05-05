export interface Attribute {
    trait_type: string;
    value: string;
}

export interface NFTItem {
    image: File | null;
    attributes: Attribute[];
    price: string;
}

export interface NftModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface NFTItemFormProps {
    nft: NFTItem;
    index: number;
    nfts: NFTItem[];
    setNfts: React.Dispatch<React.SetStateAction<NFTItem[]>>;
}

export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Attribute[];
    price: string;
}