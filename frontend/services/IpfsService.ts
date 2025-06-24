import axios from 'axios';
import type { NFTMetadata, CollectionMetadata } from '@/types';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

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
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata credentials not configured. Please check your environment variables.');
  }

  if (!file) {
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

    const ipfsUrl = `${PINATA_GATEWAY}${response.data.IpfsHash}`;
    return ipfsUrl;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      
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

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata credentials not configured. Please check your environment variables.');
  }

  if (!jsonData) {
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

    const ipfsUrl = `${PINATA_GATEWAY}${response.data.IpfsHash}`;
    return ipfsUrl;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      
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
 * Converts an IPFS URI to an HTTP gateway URL
 *
 * @param uri - IPFS URI or other URI to convert
 * @returns HTTP URL that can be used to fetch the resource
 */
export const convertIpfsUriToHttpUri = (uri: string): string => {
  if (!uri) return '';

  // If already an HTTP URL, return as is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Replace ipfs:// with the gateway URL
  if (uri.startsWith('ipfs://')) {
    const ipfsHash = uri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  // Handle ipfs.io/ipfs/ URLs
  if (uri.startsWith('ipfs.io/ipfs/')) {
    const ipfsHash = uri.replace('ipfs.io/ipfs/', '');
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  // If it's just a CID (hash), add the gateway prefix
  if (/^[a-zA-Z0-9]{46}/.test(uri) || /^Qm[a-zA-Z0-9]{44}/.test(uri)) {
    return `https://gateway.pinata.cloud/ipfs/${uri}`;
  }

  // Return original if we don't know how to handle it
  return uri;
};

export const uploadJsonToPinata = async (json: any): Promise<string> => {
  const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', json, {
    headers: {
      'Content-Type': 'application/json',
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY!,
    },
  });

  return response.data.IpfsHash;
};
