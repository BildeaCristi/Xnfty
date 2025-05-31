import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

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

/**
 * Generate timestamp for file naming
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
}

/**
 * Generate unique filename with timestamp
 */
function generateUniqueFileName(originalName: string, prefix?: string): string {
  const timestamp = generateTimestamp();
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");
  const cleanName = nameWithoutExtension.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return prefix 
    ? `${prefix}_${cleanName}_${timestamp}.${extension}`
    : `${cleanName}_${timestamp}.${extension}`;
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File, prefix?: string): Promise<string> {
  console.log('IPFS File Upload - Starting file upload:', {
    name: file.name,
    size: file.size,
    type: file.type,
    prefix: prefix
  });

  console.log('IPFS File Upload - Environment check:', {
    hasApiKey: !!PINATA_API_KEY,
    hasSecretKey: !!PINATA_SECRET_KEY,
    hasGateway: !!PINATA_GATEWAY
  });

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error('IPFS File Upload - Missing Pinata credentials');
    throw new Error('Pinata credentials not configured. Please check your environment variables.');
  }

  if (!file) {
    console.error('IPFS File Upload - No file provided');
    throw new Error('No file provided for upload');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const uniqueFileName = generateUniqueFileName(file.name, prefix);
    const timestamp = generateTimestamp();
    
    const metadata = JSON.stringify({
      name: uniqueFileName,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        timestamp: timestamp,
        fileType: file.type,
        fileSize: file.size.toString(),
        originalName: file.name,
        prefix: prefix || 'file'
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    console.log('IPFS File Upload - Making request to Pinata with filename:', uniqueFileName);
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
      }
    );

    if (!response.data || !response.data.IpfsHash) {
      throw new Error('Invalid response from Pinata API');
    }

    console.log('IPFS File Upload - Success:', response.data);
    const ipfsUrl = `${PINATA_GATEWAY}${response.data.IpfsHash}`;
    console.log('IPFS File Upload - Generated URL:', ipfsUrl);
    return ipfsUrl;
  } catch (error) {
    console.error('IPFS File Upload - Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('IPFS File Upload - Response data:', error.response?.data);
      console.error('IPFS File Upload - Response status:', error.response?.status);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Pinata API credentials. Please check your API keys.');
      } else if (error.response?.status === 400) {
        throw new Error('Bad request to Pinata API. Please check file format and size.');
      }
    }
    throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadJSONToIPFS(jsonData: any, baseName: string, prefix?: string): Promise<string> {
  const timestamp = generateTimestamp();
  const uniqueName = prefix 
    ? `${prefix}_${baseName}_${timestamp}`
    : `${baseName}_${timestamp}`;

  console.log('IPFS JSON Upload - Starting JSON upload:', {
    name: uniqueName,
    dataSize: JSON.stringify(jsonData).length,
    data: jsonData,
    prefix: prefix
  });

  console.log('IPFS JSON Upload - Environment check:', {
    hasApiKey: !!PINATA_API_KEY,
    hasSecretKey: !!PINATA_SECRET_KEY,
    hasGateway: !!PINATA_GATEWAY
  });

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error('IPFS JSON Upload - Missing Pinata credentials');
    throw new Error('Pinata credentials not configured. Please check your environment variables.');
  }

  if (!jsonData) {
    console.error('IPFS JSON Upload - No data provided');
    throw new Error('No JSON data provided for upload');
  }

  try {
    const requestData = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: uniqueName,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          timestamp: timestamp,
          type: 'metadata',
          originalName: baseName,
          prefix: prefix || 'metadata'
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    console.log('IPFS JSON Upload - Request data structure:', {
      hasPinataContent: !!requestData.pinataContent,
      hasPinataMetadata: !!requestData.pinataMetadata,
      hasPinataOptions: !!requestData.pinataOptions,
      metadataName: requestData.pinataMetadata.name
    });

    console.log('IPFS JSON Upload - Making request to Pinata with name:', uniqueName);
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
      }
    );

    if (!response.data || !response.data.IpfsHash) {
      throw new Error('Invalid response from Pinata API');
    }

    console.log('IPFS JSON Upload - Success:', response.data);
    const ipfsUrl = `${PINATA_GATEWAY}${response.data.IpfsHash}`;
    console.log('IPFS JSON Upload - Generated URL:', ipfsUrl);
    return ipfsUrl;
  } catch (error) {
    console.error('IPFS JSON Upload - Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('IPFS JSON Upload - Response data:', error.response?.data);
      console.error('IPFS JSON Upload - Response status:', error.response?.status);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Pinata API credentials. Please check your API keys.');
      } else if (error.response?.status === 400) {
        throw new Error('Bad request to Pinata API. Please check JSON data format.');
      }
    }
    throw new Error(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create NFT metadata object
 */
export function createNFTMetadata(
  name: string,
  description: string,
  imageUrl: string,
  attributes?: Array<{ trait_type: string; value: string | number }>
): NFTMetadata {
  console.log('Creating NFT metadata:', { name, description, imageUrl, attributes });
  
  if (!name || !description || !imageUrl) {
    throw new Error('Name, description, and image URL are required for NFT metadata');
  }
  
  return {
    name: name.trim(),
    description: description.trim(),
    image: imageUrl.trim(),
    attributes: attributes || [],
    external_url: process.env.NEXT_PUBLIC_APP_URL || '',
  };
}

/**
 * Create collection metadata object
 */
export function createCollectionMetadata(
  name: string,
  symbol: string,
  description: string,
  imageUrl: string
): CollectionMetadata {
  console.log('Creating collection metadata:', { name, symbol, description, imageUrl });
  
  if (!name || !symbol || !description || !imageUrl) {
    throw new Error('Name, symbol, description, and image URL are required for collection metadata');
  }
  
  return {
    name: name.trim(),
    symbol: symbol.trim().toUpperCase(),
    description: description.trim(),
    image: imageUrl.trim(),
    external_link: process.env.NEXT_PUBLIC_APP_URL || '',
    seller_fee_basis_points: 250, // 2.5% default royalty
    fee_recipient: process.env.NEXT_PUBLIC_FEE_RECIPIENT || '',
  };
}

/**
 * Upload NFT metadata (image + metadata JSON) to IPFS
 */
export async function uploadNFTMetadata(
  name: string,
  description: string,
  imageFile: File,
  attributes?: Array<{ trait_type: string; value: string | number }>
): Promise<{ imageUrl: string; metadataUrl: string }> {
  console.log('Starting NFT metadata upload process...');
  
  if (!name || !description || !imageFile) {
    throw new Error('Name, description, and image file are required for NFT metadata upload');
  }
  
  try {
    // First, upload the image with NFT prefix
    console.log('Uploading NFT image...');
    const imageUrl = await uploadFileToIPFS(imageFile, 'nft');
    console.log('NFT image uploaded:', imageUrl);

    // Create metadata object
    const metadata = createNFTMetadata(name, description, imageUrl, attributes);
    
    // Upload metadata JSON with NFT metadata prefix
    console.log('Uploading NFT metadata JSON...');
    const metadataUrl = await uploadJSONToIPFS(metadata, `${name.replace(/[^a-zA-Z0-9]/g, '_')}_metadata`, 'nft');
    console.log('NFT metadata uploaded:', metadataUrl);

    return {
      imageUrl,
      metadataUrl
    };
  } catch (error) {
    console.error('Error uploading NFT metadata:', error);
    throw new Error(`Failed to upload NFT metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload collection metadata (image + metadata JSON) to IPFS
 */
export async function uploadCollectionMetadata(
  name: string,
  symbol: string,
  description: string,
  imageFile: File
): Promise<{ imageUrl: string; metadataUrl: string }> {
  console.log('Starting collection metadata upload process...');
  
  if (!name || !symbol || !description || !imageFile) {
    throw new Error('Name, symbol, description, and image file are required for collection metadata upload');
  }
  
  try {
    // First, upload the image with collection prefix
    console.log('Uploading collection image...');
    const imageUrl = await uploadFileToIPFS(imageFile, 'collection');
    console.log('Collection image uploaded:', imageUrl);

    // Create metadata object
    const metadata = createCollectionMetadata(name, symbol, description, imageUrl);
    
    // Upload metadata JSON with collection metadata prefix
    console.log('Uploading collection metadata JSON...');
    const metadataUrl = await uploadJSONToIPFS(
      metadata, 
      `${name.replace(/[^a-zA-Z0-9]/g, '_')}_collection_metadata`,
      'collection'
    );
    console.log('Collection metadata uploaded:', metadataUrl);

    return {
      imageUrl,
      metadataUrl
    };
  } catch (error) {
    console.error('Error uploading collection metadata:', error);
    throw new Error(`Failed to upload collection metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to convert IPFS hash to full URL
 */
export function ipfsHashToUrl(hash: string): string {
  if (!hash) {
    throw new Error('IPFS hash is required');
  }
  
  if (hash.startsWith('http')) {
    return hash; // Already a full URL
  }
  
  // Remove 'ipfs://' prefix if present
  const cleanHash = hash.replace('ipfs://', '');
  return `${PINATA_GATEWAY}${cleanHash}`;
}

/**
 * Helper function to extract IPFS hash from URL
 */
export function extractIpfsHash(url: string): string {
  if (!url) {
    throw new Error('URL is required');
  }
  
  if (url.includes('ipfs/')) {
    return url.split('ipfs/')[1];
  }
  return url;
}

/**
 * Validate if a string is a valid IPFS URL or hash
 */
export function isValidIpfsUrl(url: string): boolean {
  if (!url) return false;
  
  const ipfsHashPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})$/;
  const ipfsUrlPattern = /^https?:\/\/.+\/ipfs\/(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})$/;
  
  return ipfsHashPattern.test(url) || ipfsUrlPattern.test(url) || url.startsWith('ipfs://');
} 