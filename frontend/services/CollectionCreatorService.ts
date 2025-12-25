import type {
    CollectionFormData,
    CollectionValidationResult,
    DeploymentStep,
    ImageData,
    NFTData,
    NFTValidationResult
} from '@/types/forms';

/**
 * Creates a new NFT data object with default values
 */
export function createNewNFT(): NFTData {
    return {
        id: `nft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: '',
        description: '',
        image: null,
        attributes: [],
        shouldFractionalize: false,
        totalShares: 1000,
        sharePrice: '0.01',
        fractionalName: '',
        fractionalSymbol: '',
        status: 'pending'
    };
}

/**
 * Creates image data from a File object
 */
export function createImageData(file: File): ImageData {
    return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    };
}

/**
 * Validates NFT data
 */
export function validateNFT(nft: NFTData): NFTValidationResult {
    const errors: string[] = [];

    if (!nft.name.trim()) {
        errors.push('NFT name is required');
    }

    if (!nft.description.trim()) {
        errors.push('NFT description is required');
    }

    const hasValidImage = !!(nft.image || nft.imageData?.file);
    if (!hasValidImage) {
        errors.push('NFT image is required');
    }

    if (nft.shouldFractionalize) {
        if (!nft.fractionalName.trim()) {
            errors.push('Fractional name is required when fractionalizing');
        }
        if (!nft.fractionalSymbol.trim()) {
            errors.push('Fractional symbol is required when fractionalizing');
        }
        if (nft.totalShares <= 0) {
            errors.push('Total shares must be greater than 0');
        }
        if (parseFloat(nft.sharePrice) <= 0) {
            errors.push('Share price must be greater than 0');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates collection data
 */
export function validateCollection(data: CollectionFormData, image: File | null): CollectionValidationResult {
    const errors: string[] = [];

    if (!data.name.trim()) {
        errors.push('Collection name is required');
    }

    if (!data.symbol.trim()) {
        errors.push('Collection symbol is required');
    }

    if (!data.description.trim()) {
        errors.push('Collection description is required');
    }

    if (!image) {
        errors.push('Collection image is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates all NFTs in a collection
 */
export function validateAllNFTs(nfts: NFTData[]): NFTValidationResult {
    const allErrors: string[] = [];

    if (nfts.length === 0) {
        allErrors.push('At least one NFT is required');
        return {isValid: false, errors: allErrors};
    }

    nfts.forEach((nft, index) => {
        const validation = validateNFT(nft);
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                allErrors.push(`NFT ${index + 1}: ${error}`);
            });
        }
    });

    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
}

/**
 * Initializes deployment steps for a collection and NFTs
 */
export function initializeDeploymentSteps(nfts: NFTData[]): DeploymentStep[] {
    const steps: DeploymentStep[] = [
        {
            id: 'collection',
            name: 'Create Collection',
            status: 'pending',
            description: 'Deploying collection contract to blockchain'
        }
    ];

    nfts.forEach((nft, index) => {
        steps.push({
            id: `mint-${nft.id}`,
            name: `Mint NFT: ${nft.name || `NFT ${index + 1}`}`,
            status: 'pending',
            description: 'Minting NFT to collection'
        });

        if (nft.shouldFractionalize) {
            steps.push({
                id: `fractionalize-${nft.id}`,
                name: `Fractionalize: ${nft.name || `NFT ${index + 1}`}`,
                status: 'pending',
                description: 'Creating fractional ownership contract'
            });
        }
    });

    return steps;
}

/**
 * Creates a preview URL for an image file
 */
export function createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
                resolve(result);
            } else {
                reject(new Error('Failed to create image preview'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates image file type and size
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'File size too large. Please upload an image smaller than 10MB.'
        };
    }

    return {isValid: true};
} 