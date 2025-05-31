'use client';

import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import GlassModal from '@/components/auth/modal/glass-modal';
import {AlertCircle, CheckCircle, Loader2, Plus, Trash2, Upload, X} from 'lucide-react';
import {createCollectionMetadata, createNFTMetadata, uploadFileToIPFS, uploadJSONToIPFS} from '@/utils/ipfs';
import {createCollection, fractionalizeNFT, getNFTFactoryContract, getSigner, mintNFT} from '@/utils/blockchain';
import { useNotifications } from '@/components/notifications/NotificationContext';
import type { 
    CreateCollectionModalProps, 
    CollectionFormData, 
    NFTData, 
    DeploymentStep 
} from '@/types';

export default function CreateCollectionModal({isOpen, onClose, onSuccess}: CreateCollectionModalProps) {
    const { showSuccess, showError, showWarning, showInfo, confirm } = useNotifications();
    const [step, setStep] = useState(1); // 1: Collection, 2: NFTs, 3: Deploy
    const [isDeploying, setIsDeploying] = useState(false);
    const [collectionImage, setCollectionImage] = useState<File | null>(null);
    const [collectionImagePreview, setCollectionImagePreview] = useState<string>('');
    const [nfts, setNfts] = useState<NFTData[]>([]);
    const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([]);
    const [collectionData, setCollectionData] = useState<CollectionFormData | null>(null);
    const [deployedCollectionId, setDeployedCollectionId] = useState<number | null>(null);
    const [deployedCollectionAddress, setDeployedCollectionAddress] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors},
        reset
    } = useForm<CollectionFormData>();

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCollectionImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setCollectionImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addNFT = () => {
        const newNFT: NFTData = {
            id: Date.now().toString(),
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
        setNfts([...nfts, newNFT]);
    };

    const removeNFT = (id: string) => {
        setNfts(nfts.filter(nft => nft.id !== id));
    };

    const updateNFT = (id: string, field: keyof NFTData, value: any) => {
        console.log(`UpdateNFT - Updating NFT ${id}:`, {
            field,
            valueType: typeof value,
            isFile: value instanceof File,
            fileName: value instanceof File ? value.name : undefined,
            valuePreview: typeof value === 'string' ? value.substring(0, 50) + '...' : value
        });

        setNfts(prevNfts => {
            const updatedNfts = prevNfts.map(nft => {
                if (nft.id === id) {
                    const updatedNft = {...nft, [field]: value};
                    console.log(`UpdateNFT - NFT ${id} updated:`, {
                        field,
                        oldValue: nft[field],
                        newValue: value,
                        hasImage: !!updatedNft.image,
                        hasImagePreview: !!updatedNft.imagePreview
                    });
                    return updatedNft;
                }
                return nft;
            });

            console.log(`UpdateNFT - State update complete for ${id}, field: ${field}`);
            return updatedNfts;
        });
    };

    /*  const debugNFTState = () => {
        console.log('=== NFT DEBUG STATE ===');
        nfts.forEach((nft, index) => {
          console.log(`NFT ${index + 1} (${nft.id}):`, {
            name: nft.name,
            description: nft.description,
            hasImage: !!nft.image,
            imageType: nft.image?.type,
            imageSize: nft.image?.size,
            hasImagePreview: !!nft.imagePreview,
            imagePreviewLength: nft.imagePreview?.length,
            shouldFractionalize: nft.shouldFractionalize,
            totalShares: nft.totalShares,
            sharePrice: nft.sharePrice,
            fractionalName: nft.fractionalName,
            fractionalSymbol: nft.fractionalSymbol,
            status: nft.status,
            attributes: nft.attributes
          });
        });
        console.log('=== END NFT DEBUG ===');
      };

      const testPinataConnection = async () => {
        console.log('=== TESTING PINATA CONNECTION ===');

        // Check environment variables
        const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
        const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
        const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

        console.log('Environment check:', {
          hasApiKey: !!apiKey,
          hasSecretKey: !!secretKey,
          hasGateway: !!gateway,
          apiKeyLength: apiKey?.length,
          secretKeyLength: secretKey?.length,
          gateway: gateway
        });

        if (!apiKey || !secretKey) {
          const configureCredentials = await confirm({
            title: 'Pinata credentials not configured!',
            message: `Please create a .env.local file in your frontend directory with:

NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

Get your credentials from: https://app.pinata.cloud/keys`,
            confirmText: 'I understand',
            cancelText: 'Cancel',
            type: 'warning'
          });
          return;
        }

        try {
          // Test with a small JSON upload
          const testData = {
            name: "Test Connection",
            description: "Testing Pinata connection",
            timestamp: new Date().toISOString()
          };

          console.log('Testing Pinata with test data:', testData);
          const result = await uploadJSONToIPFS(testData, 'pinata_test');
          console.log('Pinata test successful:', result);
          showSuccess('Pinata connection successful!', `Test file uploaded to: ${result}`);
        } catch (error) {
          console.error('Pinata test failed:', error);

          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            if (error.message.includes('401')) {
              errorMessage = `Authentication failed (401 Unauthorized).

Please check your Pinata credentials:
1. Go to https://app.pinata.cloud/keys
2. Create a new API key with admin permissions
3. Update your .env.local file with the correct keys

Current API key length: ${apiKey?.length}
Current secret key length: ${secretKey?.length}`;
            } else {
              errorMessage = error.message;
            }
          }

          showError('Pinata connection failed', errorMessage);
        }

        console.log('=== END PINATA TEST ===');
      };*/

    const handleNFTImageUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        console.log('NFT Image Upload - File selected:', file);
        if (file) {
            console.log('NFT Image Upload - File details:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });

            // Store file data in a more stable format
            const imageData = {
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            };

            console.log('NFT Image Upload - About to update NFT with imageData for id:', id);

            // Update both the legacy image field and new imageData field
            setNfts(prevNfts => prevNfts.map(nft => {
                if (nft.id === id) {
                    return {
                        ...nft,
                        image: file,
                        imageData: imageData
                    };
                }
                return nft;
            }));

            console.log('NFT Image Upload - File data set to NFT with id:', id);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = e.target?.result as string;
                console.log('NFT Image Upload - Preview created for NFT:', id, 'Preview length:', preview?.length);
                updateNFT(id, 'imagePreview', preview);

                // Verify both file and preview are set
                setTimeout(() => {
                    const updatedNft = nfts.find(n => n.id === id);
                    console.log('NFT Image Upload - Final verification after preview update:', {
                        nftId: id,
                        hasNft: !!updatedNft,
                        hasImage: !!updatedNft?.image,
                        hasImageData: !!updatedNft?.imageData,
                        hasImagePreview: !!updatedNft?.imagePreview,
                        imageDetails: updatedNft?.imageData ? {
                            name: updatedNft.imageData.name,
                            size: updatedNft.imageData.size,
                            type: updatedNft.imageData.type
                        } : null,
                        previewLength: updatedNft?.imagePreview?.length
                    });
                }, 100);
            };
            reader.readAsDataURL(file);
        } else {
            console.log('NFT Image Upload - No file selected');
        }
    };

    const addAttribute = (nftId: string) => {
        const nft = nfts.find(n => n.id === nftId);
        if (nft) {
            const newAttributes = [...nft.attributes, {trait_type: '', value: ''}];
            updateNFT(nftId, 'attributes', newAttributes);
        }
    };

    const removeAttribute = (nftId: string, index: number) => {
        const nft = nfts.find(n => n.id === nftId);
        if (nft) {
            const newAttributes = nft.attributes.filter((_, i) => i !== index);
            updateNFT(nftId, 'attributes', newAttributes);
        }
    };

    const updateAttribute = (nftId: string, index: number, field: 'trait_type' | 'value', value: string) => {
        const nft = nfts.find(n => n.id === nftId);
        if (nft) {
            const newAttributes = [...nft.attributes];
            newAttributes[index] = {...newAttributes[index], [field]: value};
            updateNFT(nftId, 'attributes', newAttributes);
        }
    };

    const updateDeploymentStep = (stepId: string, status: DeploymentStep['status'], description?: string) => {
        setDeploymentSteps(prev => prev.map(step =>
            step.id === stepId
                ? {...step, status, description: description || step.description}
                : step
        ));
    };

    const initializeDeploymentSteps = () => {
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

        setDeploymentSteps(steps);
    };

    const deployEverything = async () => {
        if (!collectionData || !collectionImage) {
            console.error('Deploy Everything - Missing required data:', {
                hasCollectionData: !!collectionData,
                hasCollectionImage: !!collectionImage
            });
            return;
        }

        console.log('Deploy Everything - Starting deployment with:', {
            collectionData,
            collectionImageName: collectionImage.name,
            collectionImageSize: collectionImage.size,
            nftsCount: nfts.length
        });

        setIsDeploying(true);
        initializeDeploymentSteps();

        try {
            // Step 1: Create collection metadata and deploy collection
            updateDeploymentStep('collection', 'processing', 'Uploading collection image...');
            console.log('Deploy Everything - Uploading collection image to IPFS...');
            const collectionImageUrl = await uploadFileToIPFS(collectionImage!, 'collection');
            console.log('Deploy Everything - Collection image uploaded:', collectionImageUrl);

            updateDeploymentStep('collection', 'processing', 'Creating collection metadata...');
            console.log('Deploy Everything - Creating collection metadata...');
            const collectionMetadata = createCollectionMetadata(
                collectionData.name,
                collectionData.symbol,
                collectionData.description,
                collectionImageUrl
            );
            console.log('Deploy Everything - Collection metadata created:', collectionMetadata);

            updateDeploymentStep('collection', 'processing', 'Uploading collection metadata...');
            console.log('Deploy Everything - Uploading collection metadata to IPFS...');
            const collectionMetadataUrl = await uploadJSONToIPFS(
                collectionMetadata,
                `${collectionData.name.replace(/[^a-zA-Z0-9]/g, '_')}_collection_metadata`,
                'collection'
            );
            console.log('Deploy Everything - Collection metadata uploaded:', collectionMetadataUrl);

            updateDeploymentStep('collection', 'processing', 'Deploying collection contract...');
            console.log('Deploy Everything - Creating collection on blockchain...');
            const collectionResult = await createCollection(
                collectionData.name,
                collectionData.symbol,
                collectionMetadataUrl
            );
            console.log('Deploy Everything - Collection created:', collectionResult);

            setDeployedCollectionId(collectionResult.collectionId);
            // Get collection address from the factory
            console.log('Deploy Everything - Getting collection address from factory...');
            const factory = getNFTFactoryContract(await getSigner());
            const collectionInfo = await factory.getCollection(collectionResult.collectionId);
            console.log('Deploy Everything - Collection info from factory:', collectionInfo);
            setDeployedCollectionAddress(collectionInfo.collectionAddress);

            updateDeploymentStep('collection', 'completed', 'Collection created successfully');

            // Step 2: Mint and Fractionalize NFTs
            console.log('Deploy Everything - Step 2: Processing NFTs');
            for (const nft of nfts) {
                try {
                    console.log(`Deploy Everything - Processing NFT ${nft.id}:`, {
                        name: nft.name,
                        hasImage: !!nft.image,
                        hasImageData: !!nft.imageData,
                        imageSize: nft.image?.size || nft.imageData?.size,
                        shouldFractionalize: nft.shouldFractionalize
                    });

                    // Mint NFT
                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Uploading NFT image...');
                    updateNFT(nft.id, 'status', 'minting');

                    // Get the file to upload - prefer imageData.file if available, fallback to legacy image field
                    const fileToUpload = nft.imageData?.file || nft.image;

                    if (!fileToUpload) {
                        throw new Error('NFT image is required');
                    }

                    console.log(`Deploy Everything - Uploading NFT ${nft.id} image to IPFS...`, {
                        fileName: fileToUpload.name,
                        fileSize: fileToUpload.size,
                        fileType: fileToUpload.type
                    });
                    const nftImageUrl = await uploadFileToIPFS(fileToUpload, 'nft');
                    console.log(`Deploy Everything - NFT ${nft.id} image uploaded:`, nftImageUrl);

                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Creating NFT metadata...');
                    const nftMetadata = createNFTMetadata(
                        nft.name,
                        nft.description,
                        nftImageUrl,
                        nft.attributes
                    );
                    console.log(`Deploy Everything - NFT ${nft.id} metadata created:`, nftMetadata);

                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Uploading NFT metadata...');
                    console.log(`Deploy Everything - Uploading NFT ${nft.id} metadata to IPFS...`);
                    const nftMetadataUrl = await uploadJSONToIPFS(
                        nftMetadata,
                        `${nft.name.replace(/[^a-zA-Z0-9]/g, '_')}_metadata`,
                        'nft'
                    );
                    console.log(`Deploy Everything - NFT ${nft.id} metadata uploaded:`, nftMetadataUrl);

                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Minting NFT...');
                    console.log(`Deploy Everything - Minting NFT ${nft.id} to collection...`);
                    const mintResult = await mintNFT(collectionInfo.collectionAddress, nftMetadataUrl);
                    console.log(`Deploy Everything - NFT ${nft.id} minted:`, mintResult);

                    updateNFT(nft.id, 'tokenId', mintResult.tokenId);
                    updateNFT(nft.id, 'status', 'minted');
                    updateDeploymentStep(`mint-${nft.id}`, 'completed', `NFT minted with ID: ${mintResult.tokenId}`);

                    // Fractionalize if requested
                    if (nft.shouldFractionalize) {
                        console.log(`Deploy Everything - Fractionalizing NFT ${nft.id}...`);
                        updateDeploymentStep(`fractionalize-${nft.id}`, 'processing', 'Creating fractional ownership...');
                        updateNFT(nft.id, 'status', 'fractionalizing');

                        const fractionalResult = await fractionalizeNFT(
                            collectionInfo.collectionAddress,
                            mintResult.tokenId,
                            nft.totalShares,
                            nft.sharePrice,
                            nft.fractionalName || `${nft.name} Shares`,
                            nft.fractionalSymbol || `${nft.name.substring(0, 3).toUpperCase()}S`
                        );
                        console.log(`Deploy Everything - NFT ${nft.id} fractionalized:`, fractionalResult);

                        updateNFT(nft.id, 'fractionalContract', fractionalResult.fractionalContract);
                        updateNFT(nft.id, 'status', 'completed');
                        updateDeploymentStep(`fractionalize-${nft.id}`, 'completed', 'Fractional ownership created');
                    } else {
                        updateNFT(nft.id, 'status', 'completed');
                    }

                } catch (error) {
                    console.error(`Deploy Everything - Error processing NFT ${nft.id}:`, error);
                    updateNFT(nft.id, 'status', 'error');
                    updateNFT(nft.id, 'error', error instanceof Error ? error.message : 'Unknown error');
                    updateDeploymentStep(`mint-${nft.id}`, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    if (nft.shouldFractionalize) {
                        updateDeploymentStep(`fractionalize-${nft.id}`, 'error', 'Skipped due to minting error');
                    }
                }
            }

            // Success
            console.log('Deploy Everything - All deployment completed successfully');
            onSuccess(collectionResult.collectionId);

        } catch (error) {
            console.error('Deploy Everything - Deployment error:', error);
            updateDeploymentStep('collection', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsDeploying(false);
        }
    };

    const onSubmit = async (data: CollectionFormData) => {
        if (step === 1) {
            if (!collectionImage) {
                showWarning('Collection image required', 'Please upload a collection image');
                return;
            }
            setCollectionData(data);
            setStep(2);
        } else if (step === 2) {
            if (nfts.length === 0) {
                showWarning('NFTs required', 'Please add at least one NFT');
                return;
            }

            // Add a small delay to ensure state is fully updated
            setTimeout(async () => {
                console.log('NFTs validation - Current NFTs:', nfts);
                // Validate NFTs
                for (const nft of nfts) {
                    console.log('Validating NFT:', {
                        id: nft.id,
                        name: nft.name,
                        description: nft.description,
                        hasImage: !!nft.image,
                        hasImageData: !!nft.imageData,
                        hasImagePreview: !!nft.imagePreview,
                        shouldFractionalize: nft.shouldFractionalize,
                        fractionalName: nft.fractionalName,
                        fractionalSymbol: nft.fractionalSymbol
                    });

                    // Check for image using either the legacy image field or the new imageData field
                    const hasValidImage = !!(nft.image || nft.imageData?.file);

                    if (!nft.name || !nft.description || !hasValidImage) {
                        console.error('NFT validation failed:', {
                            name: !nft.name ? 'missing' : 'ok',
                            description: !nft.description ? 'missing' : 'ok',
                            image: !hasValidImage ? 'missing' : 'ok',
                            imageDetails: {
                                hasLegacyImage: !!nft.image,
                                hasImageData: !!nft.imageData,
                                hasImageFile: !!nft.imageData?.file
                            }
                        });
                        showError('Incomplete NFT data', 'Please fill in all required NFT fields (name, description, and image)');
                        return;
                    }
                    if (nft.shouldFractionalize && (!nft.fractionalName || !nft.fractionalSymbol)) {
                        console.error('Fractional NFT validation failed:', {
                            fractionalName: !nft.fractionalName ? 'missing' : 'ok',
                            fractionalSymbol: !nft.fractionalSymbol ? 'missing' : 'ok'
                        });
                        showError('Incomplete fractionalization data', 'Please fill in fractional ownership details for all NFTs that will be fractionalized');
                        return;
                    }
                }

                console.log('All NFTs validated successfully, proceeding to deployment...');
                
                // Ask for confirmation before deployment
                const shouldDeploy = await confirm({
                    title: 'Deploy Collection?',
                    message: `You're about to deploy a collection with ${nfts.length} NFT${nfts.length > 1 ? 's' : ''}. This will cost gas fees and cannot be undone. Are you sure you want to proceed?`,
                    confirmText: 'Deploy',
                    cancelText: 'Cancel',
                    type: 'info'
                });

                if (shouldDeploy) {
                    setStep(3);
                    deployEverything();
                }
            }, 100); // Small delay to ensure state is updated
        }
    };

    const handleClose = () => {
        setStep(1);
        setCollectionImage(null);
        setCollectionImagePreview('');
        setNfts([]);
        setDeploymentSteps([]);
        setCollectionData(null);
        setDeployedCollectionId(null);
        setDeployedCollectionAddress(null);
        setIsDeploying(false);
        reset();
        onClose();
    };

    const goBack = () => {
        if (step > 1 && !isDeploying) {
            setStep(step - 1);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {step === 1 && 'Create Collection'}
                            {step === 2 && 'Add NFTs'}
                            {step === 3 && 'Deploy Everything'}
                        </h2>
                        <p className="text-gray-400 mt-1">
                            {step === 1 && 'Set up your NFT collection details'}
                            {step === 2 && 'Add NFTs to your collection with optional fractionalization'}
                            {step === 3 && 'Deploying your collection and NFTs to the blockchain'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        disabled={isDeploying}
                    >
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="px-6 py-4 bg-gray-800/50">
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                1
                            </div>
                            <span className="font-medium">Collection</span>
                        </div>
                        <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`}/>
                        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                2
                            </div>
                            <span className="font-medium">NFTs</span>
                        </div>
                        <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-700'}`}/>
                        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                3
                            </div>
                            <span className="font-medium">Deploy</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Step 1: Collection Details */}
                        {step === 1 && (
                            <>
                                {/* Collection Image */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Collection Image *
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        {collectionImagePreview ? (
                                            <img
                                                src={collectionImagePreview}
                                                alt="Collection preview"
                                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-600"
                                            />
                                        ) : (
                                            <div
                                                className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800">
                                                <Upload className="w-8 h-8 text-gray-500"/>
                                            </div>
                                        )}
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="collection-image"
                                            />
                                            <label
                                                htmlFor="collection-image"
                                                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Upload Image
                                            </label>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Recommended: 400x400px, max 10MB
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Collection Name *
                                        </label>
                                        <input
                                            {...register('name', {required: 'Collection name is required'})}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                            placeholder="My Awesome Collection"
                                        />
                                        {errors.name && (
                                            <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Symbol *
                                        </label>
                                        <input
                                            {...register('symbol', {required: 'Symbol is required'})}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                            placeholder="MAC"
                                        />
                                        {errors.symbol && (
                                            <p className="text-red-400 text-sm mt-1">{errors.symbol.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        {...register('description', {required: 'Description is required'})}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                        placeholder="Describe your collection..."
                                    />
                                    {errors.description && (
                                        <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        External Link (Optional)
                                    </label>
                                    <input
                                        {...register('externalLink')}
                                        type="url"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                        placeholder="https://your-website.com"
                                    />
                                </div>
                            </>
                        )}

                        {/* Step 2: NFTs */}
                        {step === 2 && (
                            <>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">NFTs in Collection</h3>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={addNFT}
                                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus className="w-4 h-4"/>
                                            <span>Add NFT</span>
                                        </button>
                                    </div>
                                </div>

                                {nfts.length === 0 ? (
                                    <div
                                        className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
                                        <p className="text-gray-400 mb-4">No NFTs added yet</p>
                                        <button
                                            type="button"
                                            onClick={addNFT}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Add Your First NFT
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {nfts.map((nft, index) => (
                                            <div key={nft.id}
                                                 className="border border-gray-700 rounded-lg p-6 bg-gray-800/50">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-medium text-white">NFT #{index + 1}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNFT(nft.id)}
                                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Left Column: Basic Info */}
                                                    <div className="space-y-4">
                                                        {/* NFT Image */}
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-300 mb-2">
                                                                NFT Image *
                                                            </label>
                                                            <div className="flex items-center space-x-4">
                                                                {nft.imagePreview ? (
                                                                    <img
                                                                        src={nft.imagePreview}
                                                                        alt="NFT preview"
                                                                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-600"
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800">
                                                                        <Upload className="w-6 h-6 text-gray-500"/>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleNFTImageUpload(nft.id, e)}
                                                                        className="hidden"
                                                                        id={`nft-image-${nft.id}`}
                                                                    />
                                                                    <label
                                                                        htmlFor={`nft-image-${nft.id}`}
                                                                        className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                                                    >
                                                                        Upload
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Name and Description */}
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-300 mb-2">
                                                                NFT Name *
                                                            </label>
                                                            <input
                                                                value={nft.name}
                                                                onChange={(e) => updateNFT(nft.id, 'name', e.target.value)}
                                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                                                placeholder="My Awesome NFT"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-gray-300 mb-2">
                                                                Description *
                                                            </label>
                                                            <textarea
                                                                value={nft.description}
                                                                onChange={(e) => updateNFT(nft.id, 'description', e.target.value)}
                                                                rows={3}
                                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                                                                placeholder="Describe this NFT..."
                                                            />
                                                        </div>

                                                        {/* Attributes */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <label
                                                                    className="block text-sm font-medium text-gray-300">
                                                                    Attributes
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addAttribute(nft.id)}
                                                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                                                >
                                                                    + Add Attribute
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {nft.attributes.map((attr, attrIndex) => (
                                                                    <div key={attrIndex}
                                                                         className="flex items-center space-x-2">
                                                                        <input
                                                                            value={attr.trait_type}
                                                                            onChange={(e) => updateAttribute(nft.id, attrIndex, 'trait_type', e.target.value)}
                                                                            placeholder="Trait"
                                                                            className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 text-sm"
                                                                        />
                                                                        <input
                                                                            value={attr.value}
                                                                            onChange={(e) => updateAttribute(nft.id, attrIndex, 'value', e.target.value)}
                                                                            placeholder="Value"
                                                                            className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 text-sm"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeAttribute(nft.id, attrIndex)}
                                                                            className="p-1 text-red-400 hover:text-red-300"
                                                                        >
                                                                            <Trash2 className="w-3 h-3"/>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Fractionalization */}
                                                    <div className="space-y-4">
                                                        <div
                                                            className="border border-gray-600 rounded-lg p-4 bg-gray-900/50">
                                                            <div className="flex items-center space-x-2 mb-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={nft.shouldFractionalize}
                                                                    onChange={(e) => updateNFT(nft.id, 'shouldFractionalize', e.target.checked)}
                                                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                                                                />
                                                                <label className="text-sm font-medium text-gray-300">
                                                                    Enable Fractional Ownership
                                                                </label>
                                                            </div>

                                                            {nft.shouldFractionalize && (
                                                                <div className="space-y-3">
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label
                                                                                className="block text-xs font-medium text-gray-400 mb-1">
                                                                                Total Shares
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                value={nft.totalShares}
                                                                                onChange={(e) => updateNFT(nft.id, 'totalShares', parseInt(e.target.value) || 0)}
                                                                                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                                                                                min="1"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label
                                                                                className="block text-xs font-medium text-gray-400 mb-1">
                                                                                Price per Share (ETH)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.001"
                                                                                value={nft.sharePrice}
                                                                                onChange={(e) => updateNFT(nft.id, 'sharePrice', e.target.value)}
                                                                                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                                                                                min="0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            className="block text-xs font-medium text-gray-400 mb-1">
                                                                            Fractional Token Name
                                                                        </label>
                                                                        <input
                                                                            value={nft.fractionalName}
                                                                            onChange={(e) => updateNFT(nft.id, 'fractionalName', e.target.value)}
                                                                            placeholder={`${nft.name} Shares`}
                                                                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            className="block text-xs font-medium text-gray-400 mb-1">
                                                                            Fractional Token Symbol
                                                                        </label>
                                                                        <input
                                                                            value={nft.fractionalSymbol}
                                                                            onChange={(e) => updateNFT(nft.id, 'fractionalSymbol', e.target.value)}
                                                                            placeholder={`${nft.name.substring(0, 3).toUpperCase()}S`}
                                                                            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Step 3: Deployment */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-white mb-2">Deploying Your Collection</h3>
                                    <p className="text-gray-400">
                                        Please wait while we deploy your collection and NFTs to the blockchain.
                                    </p>
                                </div>

                                {/* Deployment Steps */}
                                <div className="space-y-4">
                                    {deploymentSteps.map((step) => (
                                        <div key={step.id}
                                             className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                            <div className="flex-shrink-0">
                                                {step.status === 'pending' && (
                                                    <div
                                                        className="w-6 h-6 border-2 border-gray-600 rounded-full"></div>
                                                )}
                                                {step.status === 'processing' && (
                                                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin"/>
                                                )}
                                                {step.status === 'completed' && (
                                                    <CheckCircle className="w-6 h-6 text-green-400"/>
                                                )}
                                                {step.status === 'error' && (
                                                    <AlertCircle className="w-6 h-6 text-red-400"/>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-white">{step.name}</h4>
                                                <p className={`text-sm ${
                                                    step.status === 'error' ? 'text-red-400' : 'text-gray-400'
                                                }`}>
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Success Message */}
                                {!isDeploying && deployedCollectionId && (
                                    <div className="text-center py-8 border-t border-gray-700">
                                        <div
                                            className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-white"/>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Deployment Complete!</h3>
                                        <p className="text-gray-400 mb-4">
                                            Your collection and NFTs have been successfully deployed to the blockchain.
                                        </p>
                                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-left">
                                            <p className="text-sm text-gray-300">
                                                <strong>Collection ID:</strong> {deployedCollectionId}
                                            </p>
                                            {deployedCollectionAddress && (
                                                <p className="text-sm text-gray-300 mt-1">
                                                    <strong>Contract Address:</strong> {deployedCollectionAddress}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            View Collection
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        {step < 3 && (
                            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                                <div>
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                            disabled={isDeploying}
                                        >
                                            ← Back
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isDeploying}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {step === 1 && 'Next: Add NFTs'}
                                    {step === 2 && 'Deploy Everything'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
} 