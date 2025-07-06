'use client';

import React, {useEffect, useState} from 'react';
import {useNotifications} from '@/providers/NotificationContext';
import {
    createCollection,
    fractionalizeNFT,
    getNFTFactoryContract,
    getSigner,
    mintNFT
} from '@/services/BlockchainService';
import {createCollectionMetadata, createNFTMetadata, uploadFileToIPFS, uploadJSONToIPFS} from '@/services/IpfsService';
import {
    createImagePreview,
    createNewNFT,
    initializeDeploymentSteps,
    validateAllNFTs,
    validateCollection
} from '@/services/CollectionCreatorService';
import type {CollectionFormData, CreateCollectionModalProps, DeploymentStep, NFTData} from '@/types';

// Import smaller components
import ModalHeader from './ModalHeader';
import CollectionForm from './CollectionForm';
import NFTListManager from './NFTListManager';
import DeploymentProgress from './DeploymentProgress';
import StepNavigation from './StepNavigation';

export default function CreateCollectionModal({
                                                  isOpen,
                                                  onClose,
                                                  onSuccess
                                              }: CreateCollectionModalProps) {
    const {showSuccess, showError, showWarning, confirm} = useNotifications();

    // State management
    const [step, setStep] = useState(1);
    const [isDeploying, setIsDeploying] = useState(false);
    const [collectionImage, setCollectionImage] = useState<File | null>(null);
    const [collectionImagePreview, setCollectionImagePreview] = useState<string>('');
    const [nfts, setNfts] = useState<NFTData[]>([]);
    const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([]);
    const [collectionData, setCollectionData] = useState<CollectionFormData | null>(null);
    const [deployedCollectionId, setDeployedCollectionId] = useState<number | null>(null);
    const [deployedCollectionAddress, setDeployedCollectionAddress] = useState<string | null>(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Image upload handler
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCollectionImage(file);
            createImagePreview(file).then(setCollectionImagePreview).catch(console.error);
        }
    };

    // NFT management
    const addNFT = () => {
        const newNFT = createNewNFT();
        setNfts([...nfts, newNFT]);
    };

    const removeNFT = (id: string) => {
        setNfts(nfts.filter(nft => nft.id !== id));
    };

    const updateNFT = (id: string, field: keyof NFTData, value: any) => {
        setNfts(prevNfts => prevNfts.map(nft =>
            nft.id === id ? {...nft, [field]: value} : nft
        ));
    };

    const handleNFTImageUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            updateNFT(id, 'image', file);
            createImagePreview(file).then((preview: string) => updateNFT(id, 'imagePreview', preview)).catch(console.error);
        }
    };

    // Deployment step management
    const updateDeploymentStep = (stepId: string, status: DeploymentStep['status'], description?: string) => {
        setDeploymentSteps(prev => prev.map(step =>
            step.id === stepId
                ? {...step, status, description: description || step.description}
                : step
        ));
    };

    // Main deployment function
    const deployEverything = async () => {
        if (!collectionData || !collectionImage) {
            showError('Missing Data', 'Collection data and image are required');
            return;
        }

        setIsDeploying(true);
        const steps = initializeDeploymentSteps(nfts);
        setDeploymentSteps(steps);

        try {
            // Step 1: Create collection metadata and deploy collection
            updateDeploymentStep('collection', 'processing', 'Uploading collection image...');
            const collectionImageUrl = await uploadFileToIPFS(collectionImage, 'collection');

            updateDeploymentStep('collection', 'processing', 'Creating collection metadata...');
            const collectionMetadata = createCollectionMetadata(
                collectionData.name,
                collectionData.symbol,
                collectionData.description,
                collectionImageUrl
            );

            updateDeploymentStep('collection', 'processing', 'Uploading collection metadata...');
            const collectionMetadataUrl = await uploadJSONToIPFS(
                collectionMetadata,
                `${collectionData.name.replace(/[^a-zA-Z0-9]/g, '_')}_collection_metadata`,
                'collection'
            );

            updateDeploymentStep('collection', 'processing', 'Deploying collection contract...');
            const collectionResult = await createCollection(
                collectionData.name,
                collectionData.symbol,
                collectionMetadataUrl
            );

            setDeployedCollectionId(collectionResult.collectionId);

            // Get collection address from the factory
            const factory = getNFTFactoryContract(await getSigner());
            const collectionInfo = await factory.getCollection(collectionResult.collectionId);
            setDeployedCollectionAddress(collectionInfo.collectionAddress);

            updateDeploymentStep('collection', 'completed', 'Collection created successfully');

            // Step 2: Mint and Fractionalize NFTs
            for (const nft of nfts) {
                try {
                    // Mint NFT
                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Uploading NFT image...');
                    updateNFT(nft.id, 'status', 'minting');

                    // Get the file to upload
                    const fileToUpload = nft.imageData?.file || nft.image;

                    if (!fileToUpload) {
                        throw new Error('NFT image is required');
                    }

                    const nftImageUrl = await uploadFileToIPFS(fileToUpload, 'nft');

                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Creating NFT metadata...');
                    const nftMetadata = createNFTMetadata(
                        nft.name,
                        nft.description,
                        nftImageUrl,
                        nft.attributes
                    );

                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Uploading NFT metadata...');
                    const nftMetadataUrl = await uploadJSONToIPFS(
                        nftMetadata,
                        `${nft.name.replace(/[^a-zA-Z0-9]/g, '_')}_metadata`,
                        'nft'
                    );

                    updateDeploymentStep(`mint-${nft.id}`, 'processing', 'Minting NFT...');
                    const mintResult = await mintNFT(collectionInfo.collectionAddress, nftMetadataUrl);

                    updateNFT(nft.id, 'tokenId', mintResult.tokenId);
                    updateNFT(nft.id, 'status', 'minted');
                    updateDeploymentStep(`mint-${nft.id}`, 'completed', `NFT minted with ID: ${mintResult.tokenId}`);

                    // Fractionalize if requested
                    if (nft.shouldFractionalize) {
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

                        updateNFT(nft.id, 'fractionalContract', fractionalResult.fractionalContract);
                        updateNFT(nft.id, 'status', 'completed');
                        updateDeploymentStep(`fractionalize-${nft.id}`, 'completed', 'Fractional ownership created');
                    } else {
                        updateNFT(nft.id, 'status', 'completed');
                    }

                } catch (error) {
                    updateNFT(nft.id, 'status', 'error');
                    updateNFT(nft.id, 'error', error instanceof Error ? error.message : 'Unknown error');
                    updateDeploymentStep(`mint-${nft.id}`, 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    if (nft.shouldFractionalize) {
                        updateDeploymentStep(`fractionalize-${nft.id}`, 'error', 'Skipped due to minting error');
                    }
                }
            }

            // Success
            showSuccess('Collection Deployed', 'Your collection has been successfully deployed to the blockchain!');
            onSuccess(collectionResult.collectionId);

        } catch (error) {
            showError('Deployment Failed', error instanceof Error ? error.message : 'Unknown error');
            updateDeploymentStep('collection', 'error', error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsDeploying(false);
        }
    };

    // Form submission handlers
    const handleCollectionSubmit = async (data: CollectionFormData) => {
        if (!collectionImage) {
            showWarning('Collection image required', 'Please upload a collection image');
            return;
        }

        const validation = validateCollection(data, collectionImage);
        if (!validation.isValid) {
            showError('Validation Error', validation.errors[0] || 'Invalid collection data');
            return;
        }

        // Save the form data
        setCollectionData(data);
        setStep(2);
    };

    const handleNFTSubmit = async () => {
        if (nfts.length === 0) {
            showWarning('NFTs required', 'Please add at least one NFT');
            return;
        }

        const validation = validateAllNFTs(nfts);
        if (!validation.isValid) {
            showError('Validation Error', validation.errors[0] || 'Invalid NFT data');
            return;
        }

        const shouldDeploy = await confirm({
            title: 'Deploy Collection?',
            message: `Deploy collection with ${nfts.length} NFT${nfts.length > 1 ? 's' : ''}? This will cost gas fees and cannot be undone.`,
            confirmText: 'Deploy',
            cancelText: 'Cancel',
            type: 'info'
        });

        if (shouldDeploy) {
            setStep(3);
            deployEverything();
        }
    };

    // Navigation handlers
    const goBack = () => {
        if (step > 1 && !isDeploying) {
            setStep(step - 1);
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
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col border border-gray-700">
                <ModalHeader
                    title="Create NFT Collection"
                    subtitle="Deploy your NFT collection with fractional ownership capabilities"
                    onClose={handleClose}
                    isDeploying={isDeploying}
                />

                {/* Step Navigation - Moved to top */}
                <div className="border-b border-gray-700 px-6 py-4">
                    <StepNavigation
                        currentStep={step}
                        totalSteps={3}
                        canGoBack={step > 1}
                        canGoNext={false}
                        onBack={goBack}
                        onNext={() => {
                        }}
                        isDeploying={isDeploying}
                    />
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <CollectionForm
                            onSubmit={handleCollectionSubmit}
                            collectionImage={collectionImage}
                            collectionImagePreview={collectionImagePreview}
                            onImageUpload={handleImageUpload}
                            defaultValues={collectionData} // Pass saved data
                        />
                    )}

                    {step === 2 && (
                        <NFTListManager
                            nfts={nfts}
                            onAddNFT={addNFT}
                            onRemoveNFT={removeNFT}
                            onUpdateNFT={updateNFT}
                            onImageUpload={handleNFTImageUpload}
                            onSubmit={handleNFTSubmit}
                        />
                    )}

                    {step === 3 && (
                        <DeploymentProgress
                            steps={deploymentSteps}
                            isDeploying={isDeploying}
                        />
                    )}
                </div>
            </div>
        </div>
    );
} 