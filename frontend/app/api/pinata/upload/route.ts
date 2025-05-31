import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import FormData from 'form-data';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a new FormData instance for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
    });
    pinataFormData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataFormData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${pinataFormData.getBoundary()}`,
          'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_API_SECRET,
        },
      }
    );

    return NextResponse.json(pinataResponse.data);
  } catch (error) {
    console.error('Pinata upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Pinata' },
      { status: 500 }
    );
  }
} 