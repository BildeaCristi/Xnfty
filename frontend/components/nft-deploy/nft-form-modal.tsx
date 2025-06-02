import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {NFTData} from "@/components/nft-deploy/deploy-collection-modal";

interface NFTFormModalProps {
    initialData?: NFTData | null;
    onSave: (data: NFTData) => void;
    onCancel: () => void;
}

const NFTFormModal: React.FC<NFTFormModalProps> = ({ initialData = null, onSave, onCancel }) => {
    const [name, setName] = useState<string>(initialData ? initialData.name : "");
    const [description, setDescription] = useState<string>(initialData ? initialData.description : "");
    const [fractions, setFractions] = useState<string>(initialData ? String(initialData.fractions) : "");
    const [price, setPrice] = useState<string>(initialData ? String(initialData.price) : "");
    const [attributes, setAttributes] = useState<{ traitType: string; value: string }[]>(initialData ? [...initialData.attributes] : []);
    const [imageFile, setImageFile] = useState<File | null>(initialData ? initialData.imageFile : null);
    const [imagePreview, setImagePreview] = useState<string | null>(initialData ? initialData.imagePreview : null);
    const [metadataUri, setMetadataUri] = useState<string>(initialData ? initialData.metadataUri : "");

    const handleImageChange = (file: File | undefined) => {
        if (!file) return;
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        // Optionally: trigger your API call here to upload the image to Pinata
        // and then setMetadataUri to the returned URI.
        // For example:
        // uploadToPinata(file).then(uri => setMetadataUri(uri));
    };

    const addAttributeRow = () => {
        setAttributes(prev => [...prev, { traitType: "", value: "" }]);
    };

    const removeAttributeRow = (index: number) => {
        setAttributes(prev => prev.filter((_, i) => i !== index));
    };

    const handleAttributeChange = (index: number, field: 'traitType' | 'value', value: string) => {
        setAttributes(prev => prev.map((attr, i) => i === index ? { ...attr, [field]: value } : attr));
    };

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name || !imageFile || !metadataUri) {
            alert("Please provide at least a name, an image, and ensure image is uploaded.");
            return;
        }
        const nftData: NFTData = {
            name,
            description,
            fractions: fractions ? Number(fractions) : 0,
            price: price ? Number(price) : 0,
            attributes: attributes.filter(attr => attr.traitType || attr.value),
            imageFile,
            imagePreview: imagePreview || "",
            metadataUri
        };
        onSave(nftData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">{initialData ? "Edit NFT" : "Add New NFT"}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            className="border rounded p-2 w-full"
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            placeholder="NFT Name"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="border rounded p-2 w-full"
                            value={description}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="NFT Description (optional)"
                            rows={3}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleImageChange(e.target.files ? e.target.files[0] : undefined)
                            }
                        />
                        {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="mt-2 rounded-md border w-32 h-32 object-cover" />
                        )}
                    </div>
                    <div className="mb-3 flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Number of Fractions</label>
                            <input
                                type="number"
                                className="border rounded p-2 w-full"
                                value={fractions}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFractions(e.target.value)}
                                placeholder="e.g. 100"
                                min="1"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Price per Fraction (ETH)</label>
                            <input
                                type="number"
                                className="border rounded p-2 w-full"
                                value={price}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                                placeholder="e.g. 0.05"
                                min="0"
                                step="any"
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Attributes (optional)</label>
                        {attributes.map((attr, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    className="border rounded p-2 flex-1"
                                    placeholder="Trait Type"
                                    value={attr.traitType}
                                    onChange={(e) => handleAttributeChange(index, 'traitType', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="border rounded p-2 flex-1"
                                    placeholder="Value"
                                    value={attr.value}
                                    onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="px-2 text-red-500 font-semibold"
                                    onClick={() => removeAttributeRow(index)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addAttributeRow}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            + Add Attribute
                        </button>
                    </div>
                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded mr-3 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            {initialData ? "Save Changes" : "Add NFT"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NFTFormModal;
