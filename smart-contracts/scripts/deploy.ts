import {ethers} from "hardhat";
import fs from "fs";

async function main() {
    console.log("Deploying all contracts...");

    // Get the ContractFactory and Signers
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Deploy NFTFactory contract
    console.log("\nStep 1: Deploying NFTFactory...");
    const NFTFactory = await ethers.getContractFactory("NFTFactory");
    const nftFactory = await NFTFactory.deploy();
    await nftFactory.waitForDeployment();
    const factoryAddress = await nftFactory.getAddress();
    console.log("NFTFactory deployed to:", factoryAddress);

    // Deploy NFTFactoryView contract
    console.log("\nStep 2: Deploying NFTFactoryView...");
    const NFTFactoryView = await ethers.getContractFactory("NFTFactoryView");
    const nftFactoryView = await NFTFactoryView.deploy(factoryAddress);
    await nftFactoryView.waitForDeployment();
    const factoryViewAddress = await nftFactoryView.getAddress();
    console.log("NFTFactoryView deployed to:", factoryViewAddress);

    // Deploy a sample NFTCollection contract
    console.log("\nStep 3: Deploying sample NFTCollection...");
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const nftCollection = await NFTCollection.deploy(
        "Sample Collection", // name
        "SAMPLE", // symbol
        "https://example.com/metadata.json", // metadataURI
        deployer.address, // owner
        deployer.address // factory (using deployer for sample)
    );
    await nftCollection.waitForDeployment();
    const collectionAddress = await nftCollection.getAddress();
    console.log("Sample NFTCollection deployed to:", collectionAddress);

    // Deploy a sample FractionalNFT contract
    console.log("\nStep 4: Deploying sample FractionalNFT...");
    const FractionalNFT = await ethers.getContractFactory("FractionalNFT");
    const fractionalNFT = await FractionalNFT.deploy(
        "Sample Fractional NFT", // name
        "SFNFT", // symbol
        1, // totalShares
        ethers.parseEther("0.01"), // sharePrice (0.01 ETH)
        collectionAddress, // nftCollection
        1, // nftTokenId
        "https://example.com/nft-metadata.json", // nftMetadataURI
        deployer.address // initialOwner
    );
    await fractionalNFT.waitForDeployment();
    const fractionalAddress = await fractionalNFT.getAddress();
    console.log("Sample FractionalNFT deployed to:", fractionalAddress);

    // Save deployment information
    const deploymentInfo = {
        NFTFactory: factoryAddress,
        NFTFactoryView: factoryViewAddress,
        network: "sepolia",
        sampleCollectionAddress: collectionAddress,
        sampleFractionalAddress: fractionalAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: await deployer.provider.getBlockNumber(),
        note: "Sample contracts deployed for ABI generation. Use factory to create production collections."
    };

    fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));

    // Deployment summary
    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("All contracts deployed successfully!");
    console.log("\nContract Addresses:");
    console.log("NFTFactory:", factoryAddress);
    console.log("NFTFactoryView:", factoryViewAddress);
    console.log("Sample Collection:", collectionAddress);
    console.log("Sample Fractional NFT:", fractionalAddress);
    console.log("Network: Sepolia");
    console.log("Deployer:", deployer.address);

    console.log("\nGenerated ABIs:");
    console.log("- artifacts/contracts/NFTFactory.sol/NFTFactory.json");
    console.log("- artifacts/contracts/NFTFactoryView.sol/NFTFactoryView.json");
    console.log("- artifacts/contracts/NFTCollection.sol/NFTCollection.json");
    console.log("- artifacts/contracts/FractionalNFT.sol/FractionalNFT.json");

    console.log("\nNext Steps:");
    console.log("1. Update your frontend .env file:");
    console.log(`   NEXT_PUBLIC_NFT_FACTORY_ADDRESS=${factoryAddress}`);
    console.log(`   NEXT_PUBLIC_NFT_FACTORY_VIEW_ADDRESS=${factoryViewAddress}`);
    console.log("2. Copy ABIs to frontend:");
    console.log("   - Copy artifacts/contracts/*/**.json to frontend/utils/artifacts/contracts/");
    console.log("3. Verify contracts on Etherscan (optional):");
    console.log(`   npx hardhat verify --network sepolia ${factoryAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${factoryViewAddress} "${factoryAddress}"`);
    console.log(`   npx hardhat verify --network sepolia ${collectionAddress} "Sample Collection" "SAMPLE" "https://example.com/metadata.json" "${deployer.address}" "${deployer.address}"`);
    console.log(`   npx hardhat verify --network sepolia ${fractionalAddress} "${collectionAddress}" 1 "https://example.com/nft-metadata.json" "${ethers.parseEther("0.01")}" 100 "Sample Fractional NFT" "SFNFT" "${deployer.address}"`);

    console.log("\nNote: Sample contracts are for ABI generation only. Use the factory contract to create production collections.");
    console.log("Deployment info saved to deployment.json");
}

// Error handling
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});