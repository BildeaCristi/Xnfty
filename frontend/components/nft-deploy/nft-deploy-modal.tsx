import {useState} from 'react';
import type {Eip1193Provider} from 'ethers';
import {BrowserProvider, Contract, parseEther} from 'ethers';
import fractionalNFTArtifact from '../../utils/fractionalNftContractMetada.json';
import {NUMBER_OF_SHARES, PRICE_PER_SHARE} from "@/utils/constants/common-constants";
import {Session} from "next-auth";

function NftDeployModal({onClose, session}: { onClose: () => void; session: Session }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [fractions, setFractions] = useState(NUMBER_OF_SHARES);
    const [priceETH, setPriceETH] = useState<string>(PRICE_PER_SHARE.toString());
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!imageFile) {
            alert("Please select an image");
            return;
        }

        if (!session?.walletAddress) {
            alert("No wallet connected. Please log in and connect your wallet.");
            return;
        }

        // Check if MetaMask (or another EIP-1193 provider) is injected
        if (!window.ethereum) {
            alert("Please install MetaMask");
            return;
        }

        try {
            setIsLoading(true);

            // 1. Upload image & metadata to IPFS via our API route.
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("attributesJSON", JSON.stringify(attributes));
            formData.append("image", imageFile);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const {metadataUri} = await res.json();

            // 2. Interact with the smart contract using ethers.js.
            const ethProvider = window.ethereum as Eip1193Provider; // Cast to Eip1193Provider
            const provider = new BrowserProvider(ethProvider);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            // Retrieve contract address and ABI from environment variables.
            const contractAddress = process.env.NEXT_PUBLIC_FRACTIONAL_CONTRACT_ADDRESS!;
            const contractABI = fractionalNFTArtifact.abi;
            const contract = new Contract(contractAddress, contractABI, signer);

            // Convert price from ETH to Wei.
            const priceWei = parseEther(priceETH);

            // Call the contract's createFractionalNFT function.
            const tx = await contract.createFractionalNFT(fractions, priceWei, metadataUri);
            await tx.wait();

            // Assuming nextTokenId() returns the next available token ID, subtract 1 to get the created token's ID.
            const nextTokenId = await contract.nextTokenId();
            const createdTokenId = nextTokenId - 1;

            alert(`Fractional NFT Created! Token ID: ${createdTokenId}`);
            onClose();
        } catch (error) {
            console.error("Error creating NFT:", error);
            alert("Error creating NFT. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                <h2 className="text-xl font-bold mb-4">Create Fractional NFT</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded dark:bg-gray-700"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full p-2 border rounded dark:bg-gray-700"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full p-2 border rounded dark:bg-gray-700"
                            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Number of Fractions</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded dark:bg-gray-700"
                            value={fractions}
                            min={1}
                            onChange={(e) => setFractions(parseInt(e.target.value, 10))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Price per Share (ETH)</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded dark:bg-gray-700"
                            value={priceETH}
                            onChange={(e) => setPriceETH(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <button
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : "Mint Fractional NFT"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NftDeployModal;