import hre from "hardhat";
import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Debugging NFT Ownership Transfer Issue...\n");

    // Get contract addresses from deployment
    const deploymentData = require('../deployment.json');
    const factoryAddress = deploymentData.NFTFactory;
    const factoryViewAddress = deploymentData.NFTFactoryView;

    console.log("📋 Contract Addresses:");
    console.log("NFTFactory:", factoryAddress);
    console.log("NFTFactoryView:", factoryViewAddress);

    // Get test accounts
    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Script Account (Hardhat):");
    console.log("Address:", deployer.address);
    
    // Get contracts
    const factory = await ethers.getContractAt("NFTFactory", factoryAddress);
    const factoryView = await ethers.getContractAt("NFTFactoryView", factoryViewAddress);

    // Get all collections
    const collections = await factory.getAllCollections();
    const firstCollection = collections[0];
    const collectionContract = await ethers.getContractAt("NFTCollection", firstCollection.collectionAddress);
    const nfts = await collectionContract.getAllNFTs();

    console.log("\n🎯 Found", nfts.length, "NFTs in collection");

    // Analyze NFT #1 specifically (the one with 100% ownership)
    if (nfts.length > 1) {
        const nft1 = nfts[1]; // NFT #1
        console.log("\n🔍 Analyzing NFT #1:");
        console.log("- Token ID:", nft1.tokenId.toString());
        console.log("- Is Fractionalized:", nft1.isfractionalized);
        console.log("- Fractional Contract:", nft1.fractionalContract);

        if (nft1.isfractionalized && nft1.fractionalContract !== ethers.ZeroAddress) {
            const fractionalContract = await ethers.getContractAt("FractionalNFT", nft1.fractionalContract);
            
            console.log("\n💰 NFT #1 Fractional Analysis:");
            
            // Get basic info
            const nftInfo = await fractionalContract.getNFTInfo();
            console.log("✅ NFT Info:");
            console.log("- Total Shares:", nftInfo[4].toString());
            console.log("- Current Contract Owner:", nftInfo[5]);

            // Check user shares for this specific NFT
            const userShares = await fractionalContract.userShares(deployer.address);
            console.log("\n👤 Hardhat Account Shares in NFT #1:");
            console.log("- User Shares:", userShares.toString());
            console.log("- Owns all shares:", userShares.toString() === nftInfo[4].toString());

            // Check actual NFT ownership in the ERC721 contract
            console.log("\n🏠 ERC721 Ownership Check for NFT #1:");
            try {
                const actualNFTOwner = await collectionContract.ownerOf(nft1.tokenId);
                console.log("- Actual NFT Owner:", actualNFTOwner);
                console.log("- NFT owned by Hardhat account:", actualNFTOwner.toLowerCase() === deployer.address.toLowerCase());
                console.log("- NFT owned by fractional contract:", actualNFTOwner.toLowerCase() === nft1.fractionalContract.toLowerCase());
                
                // Check if ownership was transferred correctly
                const totalShares = Number(nftInfo[4]);
                const userSharesNum = Number(userShares);
                
                if (userSharesNum === totalShares) {
                    console.log("\n⚡ OWNERSHIP TRANSFER ANALYSIS:");
                    console.log("✅ User owns ALL shares (", userSharesNum, "/", totalShares, ")");
                    
                    if (actualNFTOwner.toLowerCase() === deployer.address.toLowerCase()) {
                        console.log("✅ NFT was successfully transferred to user!");
                    } else {
                        console.log("❌ NFT was NOT transferred despite owning all shares!");
                        console.log("   This indicates a bug in the ownership transfer logic.");
                        
                        // Try to debug why the transfer didn't happen
                        console.log("\n🔧 Debugging transfer failure:");
                        console.log("- Expected new owner:", deployer.address);
                        console.log("- Actual NFT owner:", actualNFTOwner);
                        console.log("- Fractional contract owner:", nftInfo[5]);
                        
                        // Check if the contract has approval to transfer the NFT
                        try {
                            const approved = await collectionContract.getApproved(nft1.tokenId);
                            console.log("- NFT approved spender:", approved);
                            console.log("- Fractional contract has approval:", approved.toLowerCase() === nft1.fractionalContract.toLowerCase());
                        } catch (error) {
                            console.log("- Error checking approval:", error);
                        }
                    }
                }
            } catch (error) {
                console.log("❌ Error checking NFT ownership:", error);
            }

            // Get all shareholders for NFT #1
            console.log("\n👥 Shareholders for NFT #1:");
            const shareHolders = await fractionalContract.getShareHolders();
            const [holders, shares, percentages] = shareHolders;
            
            for (let i = 0; i < holders.length; i++) {
                const isHardhatAccount = holders[i].toLowerCase() === deployer.address.toLowerCase();
                console.log(`- ${holders[i]} ${isHardhatAccount ? '(HARDHAT ACCOUNT)' : ''}: ${shares[i]} shares (${percentages[i]}%)`);
            }
        }
    }

    // Now check what the FactoryView returns for the Hardhat account
    console.log("\n📊 FactoryView Analysis for Hardhat Account:");
    try {
        const userNFTShares = await factoryView.getUserNFTShares(deployer.address);
        console.log("Found", userNFTShares.length, "NFTs with shares");
        
        for (let i = 0; i < userNFTShares.length; i++) {
            const share = userNFTShares[i];
            console.log(`\nNFT #${share.tokenId}:`);
            console.log("- User Shares:", share.userShares.toString());
            console.log("- Total Shares:", share.totalShares.toString());
            console.log("- Is Owner:", share.isOwner);
            console.log("- Should show in dashboard:", share.userShares > 0);
        }
    } catch (error) {
        console.log("❌ Error with FactoryView:", error);
    }

    // CRITICAL: Check if there's a wallet address mismatch
    console.log("\n🔑 WALLET ADDRESS MISMATCH CHECK:");
    console.log("This is crucial because your frontend might be using a different wallet address!");
    
    // The address from your .env.local that you mentioned
    const envWalletAddress = "0xE79FbBECeD2b5A4Ec18DaB29a43b288bDE165507"; // From your screenshot
    
    console.log("- Hardhat script address:", deployer.address);
    console.log("- Address from frontend (.env.local):", envWalletAddress);
    console.log("- Addresses match:", deployer.address.toLowerCase() === envWalletAddress.toLowerCase());
    
    if (deployer.address.toLowerCase() !== envWalletAddress.toLowerCase()) {
        console.log("\n❌ WALLET MISMATCH DETECTED!");
        console.log("The Hardhat script is using a different address than your frontend!");
        console.log("This explains why shares don't appear in the dashboard.");
        
        // Check shares for the frontend wallet address
        console.log("\n🔍 Checking shares for frontend wallet address:");
        try {
            const frontendUserShares = await factoryView.getUserNFTShares(envWalletAddress);
            console.log("Frontend wallet has", frontendUserShares.length, "NFTs with shares");
            
            for (let i = 0; i < frontendUserShares.length; i++) {
                const share = frontendUserShares[i];
                console.log(`NFT #${share.tokenId}: ${share.userShares}/${share.totalShares} shares (${share.sharePercentage}%)`);
            }
        } catch (error) {
            console.log("Error checking frontend wallet:", error);
        }
    }

    console.log("\n🎯 CONCLUSION:");
    if (deployer.address.toLowerCase() !== envWalletAddress.toLowerCase()) {
        console.log("❌ The issue is a WALLET ADDRESS MISMATCH!");
        console.log("- Your Hardhat script uses:", deployer.address);
        console.log("- Your frontend uses:", envWalletAddress);
        console.log("- You need to use the same wallet address for both!");
    } else {
        console.log("✅ Wallet addresses match - investigating other issues...");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 