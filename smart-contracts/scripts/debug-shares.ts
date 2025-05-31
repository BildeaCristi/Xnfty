import { ethers } from "hardhat";
import fs from "fs";

async function main() {
    console.log("🔍 Debugging Share Issues...\n");

    // Read deployment info
    const deploymentData = JSON.parse(fs.readFileSync("./deployment.json", 'utf8'));
    const factoryAddress = deploymentData.NFTFactory;
    const factoryViewAddress = deploymentData.NFTFactoryView;

    console.log("📋 Contract Addresses:");
    console.log("NFTFactory:", factoryAddress);
    console.log("NFTFactoryView:", factoryViewAddress);

    // Get signers (different accounts)
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const account1 = signers[1] || deployer; // Fallback to deployer if no second account
    const account2 = signers[2] || deployer; // Fallback to deployer if no third account
    
    console.log("\n👥 Test Accounts:");
    console.log("Deployer:", deployer.address);
    console.log("Account 1:", account1.address);
    console.log("Account 2:", account2.address);
    
    if (signers.length < 3) {
        console.log("⚠️  Warning: Using fewer than 3 accounts. Some tests may use the same account.");
    }

    // Get contract instances
    const factory = await ethers.getContractAt("NFTFactory", factoryAddress);
    const factoryView = await ethers.getContractAt("NFTFactoryView", factoryViewAddress);

    try {
        // Test 1: Get all collections
        console.log("\n📚 Test 1: Getting all collections...");
        const collections = await factory.getAllCollections();
        console.log(`Found ${collections.length} collections`);

        if (collections.length === 0) {
            console.log("❌ No collections found. Creating a test collection...");
            
            // Create a test collection
            const tx = await factory.connect(account1).createCollection(
                "Debug Collection",
                "DEBUG",
                "ipfs://QmTestMetadata"
            );
            await tx.wait();
            console.log("✅ Test collection created");
            
            // Get collections again
            const newCollections = await factory.getAllCollections();
            console.log(`Now found ${newCollections.length} collections`);
        }

        // Test 2: Check user shares using both contracts
        console.log("\n🔍 Test 2: Checking user shares...");
        
        console.log("Using NFTFactoryView:");
        try {
            const viewShares = await factoryView.getUserNFTShares(account1.address);
            console.log(`Account 1 shares (View): ${viewShares.length}`);
        } catch (error) {
            console.log("❌ View method failed:", error);
        }

        // Test 3: Get all fractionalized NFTs
        console.log("\n🎯 Test 3: Getting all fractionalized NFTs...");
        try {
            const fractionalizedNFTs = await factoryView.getAllFractionalizedNFTs();
            console.log(`Found ${fractionalizedNFTs.length} fractionalized NFTs`);
            
            if (fractionalizedNFTs.length > 0) {
                console.log("First fractionalized NFT details:");
                const firstNFT = fractionalizedNFTs[0];
                console.log("- Collection ID:", firstNFT.collectionId.toString());
                console.log("- Token ID:", firstNFT.tokenId.toString());
                console.log("- Fractional Contract:", firstNFT.fractionalContract);
                console.log("- Total Shares:", firstNFT.totalShares.toString());
                
                // Test 4: Check individual fractional contract
                console.log("\n💰 Test 4: Testing fractional contract directly...");
                const fractionalContract = await ethers.getContractAt("FractionalNFT", firstNFT.fractionalContract);
                
                try {
                    const nftInfo = await fractionalContract.getNFTInfo();
                    console.log("NFT Info from contract:");
                    console.log("- Total Shares:", nftInfo[4].toString());
                    console.log("- Current Owner:", nftInfo[5]);
                    console.log("- Share Price:", ethers.formatEther(nftInfo[3]), "ETH");
                    
                    // Check shares for both accounts
                    const account1Shares = await fractionalContract.userShares(account1.address);
                    const account2Shares = await fractionalContract.userShares(account2.address);
                    console.log("- Account 1 shares:", account1Shares.toString());
                    console.log("- Account 2 shares:", account2Shares.toString());
                    
                    // Check if all shares are with owner
                    const allSharesWithOwner = await fractionalContract.isAllSharesWithOwner();
                    console.log("- All shares with owner:", allSharesWithOwner);
                    
                    // Get available shares from owner
                    const availableShares = await fractionalContract.getAvailableSharesFromOwner();
                    console.log("- Available shares from owner:", availableShares.toString());
                    
                    // Test buying shares
                    console.log("\n💸 Test 5: Testing share purchase...");
                    if (availableShares > 0) {
                        const sharePrice = nftInfo[3];
                        const sharesToBuy = 1;
                        const totalCost = sharePrice * BigInt(sharesToBuy);
                        
                        console.log(`Trying to buy ${sharesToBuy} share(s) for ${ethers.formatEther(totalCost)} ETH...`);
                        
                        try {
                            const buyTx = await fractionalContract.connect(account2).buyShares(sharesToBuy, {
                                value: totalCost,
                                gasLimit: 500000
                            });
                            await buyTx.wait();
                            console.log("✅ Share purchase successful!");
                            
                            // Check shares after purchase
                            const account2SharesAfter = await fractionalContract.userShares(account2.address);
                            console.log("Account 2 shares after purchase:", account2SharesAfter.toString());
                            
                            // Check if user shares appear in factory view
                            const viewSharesAfter = await factoryView.getUserNFTShares(account2.address);
                            console.log("Account 2 shares via FactoryView:", viewSharesAfter.length);
                            
                        } catch (error) {
                            console.log("❌ Share purchase failed:", error);
                        }
                    } else {
                        console.log("❌ No shares available for purchase");
                    }
                    
                } catch (error) {
                    console.log("❌ Error testing fractional contract:", error);
                }
                
            } else {
                console.log("❌ No fractionalized NFTs found to test");
            }
            
        } catch (error) {
            console.log("❌ Error getting fractionalized NFTs:", error);
        }

    } catch (error) {
        console.error("❌ Debug script failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 