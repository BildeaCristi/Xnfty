import hre from "hardhat";
import { ethers } from "hardhat";

async function main() {
    console.log("🔍 Debugging User Shares and NFT Ownership...\n");

    // Get contract addresses from deployment
    const deploymentData = require('../deployment.json');
    const factoryAddress = deploymentData.NFTFactory;
    const factoryViewAddress = deploymentData.NFTFactoryView;

    console.log("📋 Contract Addresses:");
    console.log("NFTFactory:", factoryAddress);
    console.log("NFTFactoryView:", factoryViewAddress);

    // Get test accounts
    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Test Account:");
    console.log("Deployer/User:", deployer.address);
    
    // Get the user's actual balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("ETH Balance:", ethers.formatEther(balance), "ETH");

    // Get contracts
    const factory = await ethers.getContractAt("NFTFactory", factoryAddress);
    const factoryView = await ethers.getContractAt("NFTFactoryView", factoryViewAddress);

    console.log("\n📚 Test 1: Getting all collections...");
    const collections = await factory.getAllCollections();
    console.log("Found", collections.length, "collections");

    if (collections.length === 0) {
        console.log("❌ No collections found! Create some collections first.");
        return;
    }

    // Get the first collection details
    const firstCollection = collections[0];
    console.log("\n🔍 First Collection Details:");
    console.log("- Collection ID:", firstCollection.collectionId.toString());
    console.log("- Collection Address:", firstCollection.collectionAddress);
    console.log("- Owner:", firstCollection.owner);
    console.log("- User is owner:", firstCollection.owner.toLowerCase() === deployer.address.toLowerCase());

    // Get NFTs in the first collection
    const collectionContract = await ethers.getContractAt("NFTCollection", firstCollection.collectionAddress);
    const nfts = await collectionContract.getAllNFTs();
    console.log("\n📖 NFTs in Collection:");
    console.log("Total NFTs:", nfts.length);

    let fractionalNFT = null;
    for (let i = 0; i < nfts.length; i++) {
        const nft = nfts[i];
        console.log(`\nNFT #${nft.tokenId}:`);
        console.log("- Is Fractionalized:", nft.isfractionalized);
        console.log("- Fractional Contract:", nft.fractionalContract);
        
        if (nft.isfractionalized && nft.fractionalContract !== ethers.ZeroAddress) {
            fractionalNFT = nft;
            break;
        }
    }

    if (!fractionalNFT) {
        console.log("❌ No fractionalized NFTs found!");
        return;
    }

    console.log("\n🎯 Analyzing Fractionalized NFT:", fractionalNFT.tokenId.toString());
    
    // Get fractional contract details
    const fractionalContract = await ethers.getContractAt("FractionalNFT", fractionalNFT.fractionalContract);
    
    console.log("\n💰 Fractional Contract Analysis:");
    
    try {
        // Get basic NFT info
        const nftInfo = await fractionalContract.getNFTInfo();
        console.log("✅ NFT Info:");
        console.log("- Collection:", nftInfo[0]);
        console.log("- Token ID:", nftInfo[1].toString());
        console.log("- Share Price:", ethers.formatEther(nftInfo[3]), "ETH");
        console.log("- Total Shares:", nftInfo[4].toString());
        console.log("- Current Owner:", nftInfo[5]);
        console.log("- Created At:", new Date(Number(nftInfo[6]) * 1000).toISOString());

        // Check user's shares
        const userShares = await fractionalContract.userShares(deployer.address);
        console.log("\n👤 User Share Details:");
        console.log("- User Address:", deployer.address);
        console.log("- User Shares:", userShares.toString());
        
        if (userShares > 0) {
            const sharePercentage = await fractionalContract.getUserSharePercentage(deployer.address);
            console.log("- Share Percentage:", sharePercentage.toString() + "%");
        }

        // Get all shareholders
        const shareHolders = await fractionalContract.getShareHolders();
        const [holders, shares, percentages] = shareHolders;
        
        console.log("\n👥 All Shareholders:");
        for (let i = 0; i < holders.length; i++) {
            const isUser = holders[i].toLowerCase() === deployer.address.toLowerCase();
            console.log(`- ${holders[i]} ${isUser ? '(YOU)' : ''}: ${shares[i]} shares (${percentages[i]}%)`);
        }

        // Check NFT ownership in the original collection
        console.log("\n🏠 NFT Ownership Check:");
        try {
            const nftOwner = await collectionContract.ownerOf(fractionalNFT.tokenId);
            console.log("- Current NFT Owner:", nftOwner);
            console.log("- NFT owned by user:", nftOwner.toLowerCase() === deployer.address.toLowerCase());
            console.log("- NFT owned by fractional contract:", nftOwner.toLowerCase() === fractionalNFT.fractionalContract.toLowerCase());
        } catch (error) {
            console.log("❌ Error checking NFT ownership:", error);
        }

        // Check if user should have full ownership
        const totalShares = Number(nftInfo[4]);
        const userSharesNum = Number(userShares);
        
        console.log("\n🔄 Ownership Transfer Analysis:");
        console.log("- Total Shares:", totalShares);
        console.log("- User Shares:", userSharesNum);
        console.log("- Should own NFT:", userSharesNum === totalShares);
        
        if (userSharesNum === totalShares) {
            console.log("⚡ User owns all shares - NFT should be transferred!");
            
            // Check if NFT was actually transferred
            try {
                const nftOwner = await collectionContract.ownerOf(fractionalNFT.tokenId);
                if (nftOwner.toLowerCase() === deployer.address.toLowerCase()) {
                    console.log("✅ NFT was successfully transferred to user!");
                } else {
                    console.log("❌ NFT was NOT transferred to user!");
                    console.log("Current owner:", nftOwner);
                }
            } catch (error) {
                console.log("❌ Error checking final NFT ownership:", error);
            }
        }

        // Test with FactoryView to see what it returns
        console.log("\n🔍 Testing FactoryView getUserNFTShares:");
        try {
            const userNFTShares = await factoryView.getUserNFTShares(deployer.address);
            console.log("FactoryView found", userNFTShares.length, "NFTs with user shares");
            
            for (let i = 0; i < userNFTShares.length; i++) {
                const share = userNFTShares[i];
                console.log(`NFT #${share.tokenId}:`);
                console.log("- Collection ID:", share.collectionId.toString());
                console.log("- User Shares:", share.userShares.toString());
                console.log("- Total Shares:", share.totalShares.toString());
                console.log("- Share Percentage:", share.sharePercentage.toString());
                console.log("- Is Owner:", share.isOwner);
            }
        } catch (error) {
            console.log("❌ Error with FactoryView getUserNFTShares:", error);
        }

        // Get user's involved collections
        console.log("\n📊 Testing getCollectionsWithUserShares:");
        try {
            const collectionsWithShares = await factoryView.getCollectionsWithUserShares(deployer.address);
            console.log("Found", collectionsWithShares.length, "collections with user shares");
        } catch (error) {
            console.log("❌ Error with getCollectionsWithUserShares:", error);
        }

    } catch (error) {
        console.log("❌ Error analyzing fractional contract:", error);
    }

    console.log("\n🎯 Summary:");
    console.log("- Check the logs above to see:");
    console.log("  1. If your shares are correctly recorded in the fractional contract");
    console.log("  2. If the NFT ownership was transferred when you bought all shares"); 
    console.log("  3. If the FactoryView contract is returning the correct data");
    console.log("  4. Compare the wallet addresses to ensure they match exactly");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 