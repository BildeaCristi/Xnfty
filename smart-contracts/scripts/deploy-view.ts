import { ethers } from "hardhat";
import fs from "fs";

async function main() {
    console.log("Deploying NFTFactoryView contract...");

    // Read existing deployment info
    let deploymentData: any = {};
    const deploymentPath = "./deployment.json";
    
    if (fs.existsSync(deploymentPath)) {
        deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    }

    if (!deploymentData.NFTFactory) {
        throw new Error("NFTFactory must be deployed first! Run: npx hardhat run scripts/deploy.ts");
    }

    // Get the NFTFactory address
    const nftFactoryAddress = deploymentData.NFTFactory;
    console.log("Using NFTFactory at:", nftFactoryAddress);

    // Deploy NFTFactoryView
    const NFTFactoryView = await ethers.getContractFactory("NFTFactoryView");
    const nftFactoryView = await NFTFactoryView.deploy(nftFactoryAddress);
    
    await nftFactoryView.waitForDeployment();
    const nftFactoryViewAddress = await nftFactoryView.getAddress();

    console.log("NFTFactoryView deployed to:", nftFactoryViewAddress);

    // Update deployment data
    deploymentData.NFTFactoryView = nftFactoryViewAddress;

    // Save updated deployment data
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("Updated deployment.json with NFTFactoryView address");

    console.log("\n🎉 Deployment complete!");
    console.log("NFTFactory:", deploymentData.NFTFactory);
    console.log("NFTFactoryView:", deploymentData.NFTFactoryView);
    
    console.log("\n📝 Next steps:");
    console.log("1. Add NEXT_PUBLIC_NFT_FACTORY_VIEW_ADDRESS to your .env file:");
    console.log(`   NEXT_PUBLIC_NFT_FACTORY_VIEW_ADDRESS=${nftFactoryViewAddress}`);
    console.log("2. Restart your frontend development server");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 