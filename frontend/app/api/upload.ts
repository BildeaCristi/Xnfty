import type { NextApiRequest, NextApiResponse } from 'next';
import {IncomingForm, File, Fields, Files} from 'formidable';
import fs from 'fs';
import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';

const pinata = new pinataSDK(process.env.NEXT_PUBLIC_PINATA_API_KEY!, process.env.NEXT_PUBLIC_PINATA_API_SECRET!);

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const form = new IncomingForm();

    form.parse(req, (err: any, fields: Fields, files: Files) => {
        (async () => {
            if (err) {
                console.error('Form parse error:', err);
                return res.status(500).json({ error: 'Error parsing the form' });
            }

            const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
            const description = Array.isArray(fields.description)
                ? fields.description[0]
                : fields.description;
            const attributesJSON = Array.isArray(fields.attributesJSON)
                ? fields.attributesJSON[0]
                : fields.attributesJSON;

            // Ensure the file field "image" exists
            const imageFileField = files.image;
            if (!imageFileField) {
                return res.status(400).json({ error: 'Image file not provided' });
            }

            // If multiple files were uploaded, use the first one
            const imageFile = Array.isArray(imageFileField) ? imageFileField[0] : imageFileField;

            // Read the file buffer from its temporary filepath
            const imageBuffer = fs.readFileSync(imageFile.filepath);

            // 1. Upload image file to IPFS via Pinata
            const readableStream = Readable.from(imageBuffer);
            const options = {
                pinataMetadata: { name: `NFT Image - ${name}` },
            };
            const result = await pinata.pinFileToIPFS(readableStream, options);
            const imageHash = result.IpfsHash;
            const imageIpfsUrl = `ipfs://${imageHash}`;

            // 2. Create NFT metadata JSON
            const attributes = attributesJSON ? JSON.parse(attributesJSON) : [];
            const metadata = {
                name: name,
                description: description,
                image: imageIpfsUrl,
                attributes: attributes,
            };

            // 3. Upload metadata JSON to IPFS
            const metaResult = await pinata.pinJSONToIPFS(metadata, {
                pinataMetadata: { name: `Metadata - ${name}` },
            });
            const metadataHash = metaResult.IpfsHash;
            const metadataIpfsUrl = `ipfs://${metadataHash}`;

            // 4. Return the IPFS URL for metadata (to be used in smart contract minting)
            res.status(200).json({ metadataUri: metadataIpfsUrl });
        })().catch((error) => {
            console.error('Pinata upload error:', error);
            res.status(500).json({ error: 'Failed to upload to IPFS' });
        });
    });
}