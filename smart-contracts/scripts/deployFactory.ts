import { ethers } from "hardhat";

async function main() {
  console.log("Deploying FractionalNFT factory...");

  // Deploy FractionalNFT Factory
  const CollectionFactory = await ethers.getContractFactory("CollectionFactory");
  const factory = await CollectionFactory.deploy();
  await factory.deployed();

  console.log(`CollectionFactory deployed to: ${factory.address}`);
  console.log("Transaction hash:", factory.deployTransaction.hash);
  
  // Create a sample collection for testing
  console.log("\nCreating sample collection...");
  const tx = await factory.createCollection("Sample Collection", "A collection of fractional NFTs for testing");
  const receipt = await tx.wait();
  
  // Extract the collection address from events
  let collectionAddress;
  for (const event of receipt.events || []) {
    if (event.event === "CollectionDeployed") {
      collectionAddress = event.args?.collectionAddress;
      break;
    }
  }
  
  if (collectionAddress) {
    console.log(`Sample collection created at: ${collectionAddress}`);
    
    // Create a sample NFT in the collection
    const FractionalNFT = await ethers.getContractFactory("FractionalNFT");
    const collection = FractionalNFT.attach(collectionAddress);
    
    const metadataURI = "ipfs://QmSampleCid/metadata.json";
    const nftTx = await collection.createFractionalNFT(
      10, // Total shares
      ethers.utils.parseEther("0.01"), // Price per share: 0.01 ETH
      metadataURI
    );
    
    const nftReceipt = await nftTx.wait();
    
    // Find the token ID from events
    let tokenId;
    for (const event of nftReceipt.events || []) {
      if (event.event === "FractionalNFTCreated") {
        tokenId = event.args?.tokenId;
        break;
      }
    }
    
    if (tokenId) {
      console.log(`Sample NFT created with Token ID: ${tokenId}`);
      console.log(`NFT has 10 shares at 0.01 ETH per share`);
    } else {
      console.log("NFT created but couldn't extract token ID");
    }
  } else {
    console.log("Collection created but couldn't extract address");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 