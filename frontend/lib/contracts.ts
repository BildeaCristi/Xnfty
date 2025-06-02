import { ethers } from 'ethers';
import FractionalNFT from '../../smart-contracts/artifacts/contracts/FractionalNFT.sol/FractionalNFT.json';
import CollectionFactory from '../../smart-contracts/artifacts/contracts/CollectionFactory.sol/CollectionFactory.json';

// Contract addresses (replace these with your deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  FRACTIONAL_NFT: process.env.NEXT_PUBLIC_FRACTIONAL_NFT_ADDRESS || '',
  COLLECTION_FACTORY: process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS || '',
};

// Contract ABIs
export const CONTRACT_ABIS = {
  FRACTIONAL_NFT: FractionalNFT.abi,
  COLLECTION_FACTORY: CollectionFactory.abi,
};

// Contract instances
export const getContractInstance = (
  contractName: keyof typeof CONTRACT_ADDRESSES,
  signerOrProvider: ethers.Signer | ethers.Provider
) => {
  const address = CONTRACT_ADDRESSES[contractName];
  const abi = CONTRACT_ABIS[contractName];
  return new ethers.Contract(address, abi, signerOrProvider);
};

// Contract types
export type FractionalNFTContract = ethers.Contract & {
  createCollection: (name: string, description: string, baseURI: string) => Promise<ethers.ContractTransactionResponse>;
  createNFT: (collectionId: number, price: bigint, totalFractions: number) => Promise<ethers.ContractTransactionResponse>;
  buyFractions: (tokenId: number, amount: number) => Promise<ethers.ContractTransactionResponse>;
  updatePrice: (tokenId: number, newPrice: bigint) => Promise<ethers.ContractTransactionResponse>;
  getNFTDetails: (tokenId: number) => Promise<[number, bigint, number, number, string]>;
  getCollectionDetails: (collectionId: number) => Promise<[string, string, string]>;
};

export type CollectionFactoryContract = ethers.Contract & {
  createCollection: (name: string, description: string) => Promise<ethers.ContractTransactionResponse>;
}; 