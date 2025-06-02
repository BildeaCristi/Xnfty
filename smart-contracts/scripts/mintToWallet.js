require('dotenv').config();
const { ethers } = require("hardhat");

async function mintToWallet() {
    const [admin] = await ethers.getSigners();
    console.log("Minting from wallet:", admin.address);

    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error("NFT_CONTRACT_ADDRESS is not set in .env.local");

    const XnftyNFT = await ethers.getContractFactory("XnftyNFT");
    const xnftyNFT = XnftyNFT.attach(contractAddress);

    // Mint 5 NFTs directly to the admin wallet
    for (let i = 0; i < 5; i++) {
        console.log(`Minting token ${i}...`);
        const tx = await xnftyNFT.mint(admin.address);
        await tx.wait();
        console.log(`Token ${i} minted! TX hash: ${tx.hash}`);
    }
}

mintToWallet()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Minting failed:", error);
        process.exit(1);
    });
