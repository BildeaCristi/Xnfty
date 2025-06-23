import { NextResponse } from 'next/server';
import { uploadJsonToPinata } from '@/services/IpfsService';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    if (!json) {
      return NextResponse.json(
        { error: 'No JSON data provided' },
        { status: 400 }
      );
    }

    const ipfsHash = await uploadJsonToPinata(json);
    return NextResponse.json({ IpfsHash: ipfsHash });
  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error);
    return NextResponse.json(
      { error: 'Failed to upload JSON to Pinata' },
      { status: 500 }
    );
  }
} 