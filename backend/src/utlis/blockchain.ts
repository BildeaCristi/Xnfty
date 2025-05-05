/*
import { ethers } from 'ethers';
import NFT_ABI from '../../../contracts/artifacts/XnftyNFT.json'; // Ajustați calea după necesitate

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.NFT_CONTRACT_ADDRESS || '';

const nftContract = new ethers.Contract(contractAddress, NFT_ABI.abi, provider);

export const ethersClient = {
    async getNFTDetails(id: string) {
        const tokenURI = await nftContract.tokenURI(id);
        return { id, tokenURI };
    },
    async mintNFT(recipient: string) {
        const signer = provider.getSigner();
        const nftWithSigner = nftContract.connect(signer);
        const tx = await nftWithSigner.mint(recipient);
        return tx;
    }
};*/
