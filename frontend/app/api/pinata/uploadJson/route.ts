import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the JSON data
    const jsonData = await req.json();
    
    if (!jsonData) {
      return NextResponse.json({ error: 'No JSON data provided' }, { status: 400 });
    }

    // Upload JSON to Pinata
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      jsonData,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': process.env.NEXT_PUBLICPINATA_API_KEY,
          'pinata_secret_api_key': process.env.NEXT_PUBLICPINATA_API_SECRET,
        },
      }
    );

    return NextResponse.json(pinataResponse.data);
  } catch (error) {
    console.error('Pinata JSON upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload JSON to Pinata' },
      { status: 500 }
    );
  }
} 