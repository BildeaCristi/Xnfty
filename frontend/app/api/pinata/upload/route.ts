import { NextResponse } from 'next/server';
import { uploadToPinata } from '@/utils/pinata';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const ipfsHash = await uploadToPinata(file);
    return NextResponse.json({ IpfsHash: ipfsHash });
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Pinata' },
      { status: 500 }
    );
  }
} 