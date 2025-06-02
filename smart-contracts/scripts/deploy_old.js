require('dotenv').config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Get the base URI from environment
    const baseURI = process.env.PINATA_BASE_URI;
    if (!baseURI) throw new Error("Missing PINATA_BASE_URI in .env.local");

    // Set the collection description
    const collectionDescription = "This collection features futuristic digital art and exclusive NFTs for the Xnfty Future Collection.";

    const XnftyNFT = await ethers.getContractFactory("XnftyNFT");
    const xnftyNFT = await XnftyNFT.deploy(baseURI, collectionDescription);
    await xnftyNFT.waitForDeployment();

    console.log("XnftyNFT deployed at:", xnftyNFT.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
