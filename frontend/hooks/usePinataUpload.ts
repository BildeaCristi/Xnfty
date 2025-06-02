import { useState } from 'react';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export function usePinataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToPinata = async (file: File | Blob): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pinata/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Pinata');
      }

      const data: PinataResponse = await response.json();
      return data.IpfsHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToPinata,
    isUploading,
    error,
  };
} 