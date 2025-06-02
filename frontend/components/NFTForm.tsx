import React, { useState, ChangeEvent } from 'react';

interface Trait {
  trait_type: string;
  value: string;
}

interface NFTFormProps {
  onSave: (data: {
    name: string;
    description: string;
    image: File | null;
    traits: Trait[];
    isFractional: boolean;
    totalShares?: number;
    pricePerShare?: number;
    price?: number;
    metadataUri?: string;
  }) => void;
  onCancel: () => void;
}

const NFTForm: React.FC<NFTFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [isFractional, setIsFractional] = useState(false);
  const [totalShares, setTotalShares] = useState<number>(0);
  const [pricePerShare, setPricePerShare] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleAddTrait = () => {
    setTraits([...traits, { trait_type: '', value: '' }]);
  };

  const handleTraitChange = (index: number, field: keyof Trait, value: string) => {
    const newTraits = [...traits];
    newTraits[index] = { ...newTraits[index], [field]: value };
    setTraits(newTraits);
  };

  const handleRemoveTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !image) {
      alert('Please provide a name and image for the NFT');
      return;
    }

    setIsLoading(true);
    try {
      // Upload image to Pinata
      const formData = new FormData();
      formData.append('file', image);

      const pinataResponse = await fetch('/api/pinata/upload', {
        method: 'POST',
        body: formData,
      });

      if (!pinataResponse.ok) {
        throw new Error('Failed to upload image to Pinata');
      }

      const { IpfsHash: imageHash } = await pinataResponse.json();
      const imageUri = `ipfs://${imageHash}`;

      // Create metadata JSON
      const metadata = {
        name,
        description,
        image: imageUri,
        attributes: traits.filter(trait => trait.trait_type && trait.value),
      };

      // Upload metadata to Pinata
      const metadataResponse = await fetch('/api/pinata/uploadJson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!metadataResponse.ok) {
        throw new Error('Failed to upload metadata to Pinata');
      }

      const { IpfsHash: metadataHash } = await metadataResponse.json();
      const metadataUri = `ipfs://${metadataHash}`;

      onSave({
        name,
        description,
        image,
        traits,
        isFractional,
        totalShares: isFractional ? totalShares : undefined,
        pricePerShare: isFractional ? pricePerShare : undefined,
        price: isFractional ? undefined : price,
        metadataUri,
      });
    } catch (error) {
      console.error('Error creating NFT:', error);
      alert('Error creating NFT. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Add NFT to Collection</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">NFT Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded dark:bg-gray-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded dark:bg-gray-700"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full p-2 border rounded dark:bg-gray-700"
              onChange={handleImageChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Traits</label>
            {traits.map((trait, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Trait Type"
                  className="flex-1 p-2 border rounded dark:bg-gray-700"
                  value={trait.trait_type}
                  onChange={(e) => handleTraitChange(index, 'trait_type', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value"
                  className="flex-1 p-2 border rounded dark:bg-gray-700"
                  value={trait.value}
                  onChange={(e) => handleTraitChange(index, 'value', e.target.value)}
                />
                <button
                  type="button"
                  className="px-2 text-red-500"
                  onClick={() => handleRemoveTrait(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleAddTrait}
            >
              Add Trait
            </button>
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isFractional}
                onChange={(e) => setIsFractional(e.target.checked)}
                className="rounded"
              />
              <span>Enable Fractional Ownership</span>
            </label>
          </div>

          {isFractional ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Total Shares</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2 border rounded dark:bg-gray-700"
                  value={totalShares}
                  onChange={(e) => setTotalShares(Number(e.target.value))}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Price per Share (ETH)</label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  className="w-full p-2 border rounded dark:bg-gray-700"
                  value={pricePerShare}
                  onChange={(e) => setPricePerShare(Number(e.target.value))}
                  required
                />
              </div>
            </>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Price (ETH)</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                className="w-full p-2 border rounded dark:bg-gray-700"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create NFT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NFTForm; 