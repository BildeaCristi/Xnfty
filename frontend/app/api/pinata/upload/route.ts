import {NextResponse} from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                {error: 'No file provided'},
                {status: 400}
            );
        }

        // Convert File to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Create form data for Pinata
        const pinataFormData = new FormData();
        pinataFormData.append('file', buffer, {
            filename: file.name,
            contentType: file.type,
        });

        // Upload to Pinata
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            pinataFormData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error uploading to Pinata:', error);
        return NextResponse.json(
            {error: 'Failed to upload to Pinata'},
            {status: 500}
        );
    }
} 