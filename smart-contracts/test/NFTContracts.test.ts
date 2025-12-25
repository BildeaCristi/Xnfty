import {expect} from "chai";
import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {FractionalNFT, NFTCollection, NFTFactory} from "../typechain-types";

describe("NFT Contracts Integration Tests", function () {
    let nftFactory: NFTFactory;
    let owner: SignerWithAddress;
    let buyer1: SignerWithAddress;
    let buyer2: SignerWithAddress;
    let buyer3: SignerWithAddress;

    // Test data
    const collectionName = "Test Collection";
    const collectionSymbol = "TEST";
    const collectionMetadataURI = "https://ipfs.io/ipfs/QmTestCollection";
    const nftMetadataURIs = [
        "https://ipfs.io/ipfs/QmTestNFT1",
        "https://ipfs.io/ipfs/QmTestNFT2",
        "https://ipfs.io/ipfs/QmTestNFT3",
        "https://ipfs.io/ipfs/QmTestNFT4"
    ];

    // Gas tracking
    let gasUsed: { [key: string]: number } = {};

    beforeEach(async function () {
        [owner, buyer1, buyer2, buyer3] = await ethers.getSigners();
        gasUsed = {};
    });

    describe("1. Factory Deployment", function () {
        it("Should deploy NFTFactory successfully", async function () {
            console.log("\n=== DEPLOYING NFT FACTORY ===");

            const NFTFactory = await ethers.getContractFactory("NFTFactory");
            const deployTx = await NFTFactory.deploy();
            nftFactory = await deployTx.waitForDeployment();

            const receipt = await deployTx.deploymentTransaction()?.wait();
            gasUsed["Factory Deployment"] = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;

            console.log(`Factory deployed to: ${await nftFactory.getAddress()}`);
            console.log(`Gas used: ${gasUsed["Factory Deployment"].toLocaleString()}`);

            expect(await nftFactory.getAddress()).to.be.properAddress;
            expect(await nftFactory.getCollectionCount()).to.equal(0);
        });
    });

    describe("2. Collection Creation", function () {
        it("Should create collection using factory", async function () {
            console.log("\n=== CREATING COLLECTION ===");

            const tx = await nftFactory.createCollection(
                collectionName,
                collectionSymbol,
                collectionMetadataURI
            );
            const receipt = await tx.wait();
            gasUsed["Collection Creation"] = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;

            console.log(`Gas used: ${gasUsed["Collection Creation"].toLocaleString()}`);

            expect(await nftFactory.getCollectionCount()).to.equal(1);

            const collectionInfo = await nftFactory.getCollection(0);
            expect(collectionInfo.owner).to.equal(owner.address);
            expect(collectionInfo.metadataURI).to.equal(collectionMetadataURI);

            console.log(`Collection created at: ${collectionInfo.collectionAddress}`);
        });
    });

    describe("3. NFT Minting", function () {
        let nftCollection: NFTCollection;

        beforeEach(async function () {
            await nftFactory.createCollection(collectionName, collectionSymbol, collectionMetadataURI);
            const collectionInfo = await nftFactory.getCollection(0);
            nftCollection = await ethers.getContractAt("NFTCollection", collectionInfo.collectionAddress);
        });

        it("Should mint 4 NFTs successfully", async function () {
            console.log("\n=== MINTING 4 NFTs ===");
            let totalMintingGas = 0;

            for (let i = 0; i < 4; i++) {
                const tx = await nftCollection.mintNFT(nftMetadataURIs[i]);
                const receipt = await tx.wait();
                const gasForThisMint = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;
                totalMintingGas += gasForThisMint;

                console.log(`NFT ${i + 1} minted - Gas: ${gasForThisMint.toLocaleString()}`);

                expect(await nftCollection.ownerOf(i)).to.equal(owner.address);
                expect(await nftCollection.tokenURI(i)).to.equal(nftMetadataURIs[i]);
            }

            gasUsed["Total Minting (4 NFTs)"] = totalMintingGas;
            console.log(`Total minting gas: ${totalMintingGas.toLocaleString()}`);

            expect(await nftCollection.getNFTCount()).to.equal(4);

            const allNFTs = await nftCollection.getAllNFTs();
            expect(allNFTs.length).to.equal(4);

            for (let i = 0; i < 4; i++) {
                expect(allNFTs[i].tokenId).to.equal(i);
                expect(allNFTs[i].metadataURI).to.equal(nftMetadataURIs[i]);
                expect(allNFTs[i].isfractionalized).to.be.false;
            }
        });
    });

    describe("4. NFT Fractionalization", function () {
        let nftCollection: NFTCollection;
        let fractionalNFT: FractionalNFT;

        const totalShares = 100;
        const sharePrice = ethers.parseEther("0.01"); // 0.01 ETH per share

        beforeEach(async function () {
            await nftFactory.createCollection(collectionName, collectionSymbol, collectionMetadataURI);
            const collectionInfo = await nftFactory.getCollection(0);
            nftCollection = await ethers.getContractAt("NFTCollection", collectionInfo.collectionAddress);

            // Mint NFTs
            for (let i = 0; i < 4; i++) {
                await nftCollection.mintNFT(nftMetadataURIs[i]);
            }
        });

        it("Should fractionalize NFT #1 successfully", async function () {
            console.log("\n=== FRACTIONALIZING NFT #1 ===");

            const tokenId = 1;
            const fractionalName = "Fractional NFT #1";
            const fractionalSymbol = "FNFT1";

            const tx = await nftCollection.fractionalizeNFT(
                tokenId,
                totalShares,
                sharePrice,
                fractionalName,
                fractionalSymbol
            );
            const receipt = await tx.wait();
            gasUsed["NFT Fractionalization"] = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;

            console.log(`Gas used: ${gasUsed["NFT Fractionalization"].toLocaleString()}`);

            const nftInfo = await nftCollection.getNFT(tokenId);
            expect(nftInfo.isfractionalized).to.be.true;
            expect(nftInfo.fractionalContract).to.not.equal(ethers.ZeroAddress);

            fractionalNFT = await ethers.getContractAt("FractionalNFT", nftInfo.fractionalContract);

            console.log(`Fractional contract deployed at: ${nftInfo.fractionalContract}`);

            // Verify fractional contract setup
            expect(await fractionalNFT.name()).to.equal(fractionalName);
            expect(await fractionalNFT.symbol()).to.equal(fractionalSymbol);
            expect(await fractionalNFT.getTotalShares()).to.equal(totalShares);
            expect(await fractionalNFT.sharePrice()).to.equal(sharePrice);
            expect(await fractionalNFT.owner()).to.equal(owner.address);

            // Owner should have all shares initially
            expect(await fractionalNFT.userShares(owner.address)).to.equal(totalShares);
            expect(await fractionalNFT.balanceOf(owner.address)).to.equal(BigInt(totalShares) * BigInt(10 ** 18));
        });
    });

    describe("5. Share Purchase", function () {
        let nftCollection: NFTCollection;
        let fractionalNFT: FractionalNFT;

        const totalShares = 100;
        const sharePrice = ethers.parseEther("0.01");
        const tokenIdToFractionalize = 2; // Use different NFT

        beforeEach(async function () {
            await nftFactory.createCollection(collectionName, collectionSymbol, collectionMetadataURI);
            const collectionInfo = await nftFactory.getCollection(0);
            nftCollection = await ethers.getContractAt("NFTCollection", collectionInfo.collectionAddress);

            // Mint and fractionalize NFT
            for (let i = 0; i < 4; i++) {
                await nftCollection.mintNFT(nftMetadataURIs[i]);
            }

            await nftCollection.fractionalizeNFT(
                tokenIdToFractionalize,
                totalShares,
                sharePrice,
                "Fractional NFT #2",
                "FNFT2"
            );

            const nftInfo = await nftCollection.getNFT(tokenIdToFractionalize);
            fractionalNFT = await ethers.getContractAt("FractionalNFT", nftInfo.fractionalContract);
        });

        it("Should allow buying partial shares", async function () {
            console.log("\n=== BUYING PARTIAL SHARES ===");

            const sharesToBuy1 = 30;
            const sharesToBuy2 = 20;
            const cost1 = sharePrice * BigInt(sharesToBuy1);
            const cost2 = sharePrice * BigInt(sharesToBuy2);

            console.log(`Buyer1 purchasing ${sharesToBuy1} shares for ${ethers.formatEther(cost1)} ETH`);
            const tx1 = await fractionalNFT.connect(buyer1).buyShares(sharesToBuy1, {value: cost1});
            const receipt1 = await tx1.wait();
            gasUsed["Buy 30 Shares"] = receipt1?.gasUsed ? Number(receipt1.gasUsed) : 0;

            console.log(`Gas used: ${gasUsed["Buy 30 Shares"].toLocaleString()}`);

            expect(await fractionalNFT.userShares(buyer1.address)).to.equal(sharesToBuy1);
            expect(await fractionalNFT.userShares(owner.address)).to.equal(totalShares - sharesToBuy1);

            console.log(`Buyer2 purchasing ${sharesToBuy2} shares for ${ethers.formatEther(cost2)} ETH`);
            const tx2 = await fractionalNFT.connect(buyer2).buyShares(sharesToBuy2, {value: cost2});
            const receipt2 = await tx2.wait();
            gasUsed["Buy 20 Shares"] = receipt2?.gasUsed ? Number(receipt2.gasUsed) : 0;

            console.log(`Gas used: ${gasUsed["Buy 20 Shares"].toLocaleString()}`);

            expect(await fractionalNFT.userShares(buyer2.address)).to.equal(sharesToBuy2);
            expect(await fractionalNFT.userShares(owner.address)).to.equal(totalShares - sharesToBuy1 - sharesToBuy2);

            // Check share distribution
            const [holders, shares, percentages] = await fractionalNFT.getShareHolders();
            expect(holders.length).to.equal(3);
            console.log("\nShare distribution:");
            for (let i = 0; i < holders.length; i++) {
                console.log(`${holders[i]}: ${shares[i]} shares (${percentages[i]}%)`);
            }

            // NFT should still be owned by original owner (since no one has 100%)
            expect(await nftCollection.ownerOf(tokenIdToFractionalize)).to.equal(owner.address);
        });
    });

    describe("6. Complete NFT Transfer via Share Purchase", function () {
        let nftCollection: NFTCollection;
        let fractionalNFT: FractionalNFT;

        const totalShares = 100;
        const sharePrice = ethers.parseEther("0.01");
        const tokenIdToFractionalize = 3; // Use different NFT

        beforeEach(async function () {
            await nftFactory.createCollection(collectionName, collectionSymbol, collectionMetadataURI);
            const collectionInfo = await nftFactory.getCollection(0);
            nftCollection = await ethers.getContractAt("NFTCollection", collectionInfo.collectionAddress);

            // Mint and fractionalize NFT
            for (let i = 0; i < 4; i++) {
                await nftCollection.mintNFT(nftMetadataURIs[i]);
            }

            await nftCollection.fractionalizeNFT(
                tokenIdToFractionalize,
                totalShares,
                sharePrice,
                "Fractional NFT #3",
                "FNFT3"
            );

            const nftInfo = await nftCollection.getNFT(tokenIdToFractionalize);
            fractionalNFT = await ethers.getContractAt("FractionalNFT", nftInfo.fractionalContract);
        });

        it("Should transfer NFT ownership when buying all shares", async function () {
            console.log("\n=== BUYING ALL SHARES FOR NFT TRANSFER ===");

            const allSharesCost = sharePrice * BigInt(totalShares);
            console.log(`Buyer3 purchasing all ${totalShares} shares for ${ethers.formatEther(allSharesCost)} ETH`);

            // Record initial NFT owner
            const initialNFTOwner = await nftCollection.ownerOf(tokenIdToFractionalize);
            expect(initialNFTOwner).to.equal(owner.address);

            // Buy all shares
            const tx = await fractionalNFT.connect(buyer3).buyShares(totalShares, {value: allSharesCost});
            const receipt = await tx.wait();
            gasUsed["Buy All Shares (NFT Transfer)"] = receipt?.gasUsed ? Number(receipt.gasUsed) : 0;

            console.log(`Gas used: ${gasUsed["Buy All Shares (NFT Transfer)"].toLocaleString()}`);

            // Verify share ownership
            expect(await fractionalNFT.userShares(buyer3.address)).to.equal(totalShares);
            expect(await fractionalNFT.userShares(owner.address)).to.equal(0);

            // Verify NFT ownership transfer
            expect(await nftCollection.ownerOf(tokenIdToFractionalize)).to.equal(buyer3.address);

            // Verify fractional contract ownership transfer
            expect(await fractionalNFT.owner()).to.equal(buyer3.address);

            console.log(`NFT #${tokenIdToFractionalize} successfully transferred to: ${buyer3.address}`);

            // Verify only one shareholder remains
            const [holders, shares, percentages] = await fractionalNFT.getShareHolders();
            expect(holders.length).to.equal(1);
            expect(holders[0]).to.equal(buyer3.address);
            expect(shares[0]).to.equal(totalShares);
            expect(percentages[0]).to.equal(100);

            console.log("All shares now owned by NFT owner - transfer complete");
        });
    });

    describe("Gas Consumption Summary", function () {
        it("Should display complete gas consumption report", async function () {
            console.log("\n=== COMPLETE GAS CONSUMPTION REPORT ===");

            // Run all operations to get complete gas data
            await nftFactory.createCollection(collectionName, collectionSymbol, collectionMetadataURI);
            const collectionInfo = await nftFactory.getCollection(0);
            const nftCollection = await ethers.getContractAt("NFTCollection", collectionInfo.collectionAddress);

            // Mint NFTs
            let totalMintingGas = 0;
            for (let i = 0; i < 4; i++) {
                const tx = await nftCollection.mintNFT(nftMetadataURIs[i]);
                const receipt = await tx.wait();
                totalMintingGas += receipt?.gasUsed ? Number(receipt.gasUsed) : 0;
            }

            // Fractionalize
            const fractTx = await nftCollection.fractionalizeNFT(0, 100, ethers.parseEther("0.01"), "Test", "TEST");
            const fractReceipt = await fractTx.wait();
            const fractGas = fractReceipt?.gasUsed ? Number(fractReceipt.gasUsed) : 0;

            // Buy shares
            const nftInfo = await nftCollection.getNFT(0);
            const fractionalNFT = await ethers.getContractAt("FractionalNFT", nftInfo.fractionalContract);

            const buyTx = await fractionalNFT.connect(buyer1).buyShares(50, {value: ethers.parseEther("0.5")});
            const buyReceipt = await buyTx.wait();
            const buyGas = buyReceipt?.gasUsed ? Number(buyReceipt.gasUsed) : 0;

            // Display final report
            console.log("\nOperation                     | Gas Used      | ETH Cost (at 20 gwei)");
            console.log("-".repeat(70));
            console.log(`Factory Deployment           | ${gasUsed["Factory Deployment"]?.toLocaleString().padStart(13)} | ${((gasUsed["Factory Deployment"] || 0) * 20e-9).toFixed(6)} ETH`);
            console.log(`Collection Creation          | ${gasUsed["Collection Creation"]?.toLocaleString().padStart(13)} | ${((gasUsed["Collection Creation"] || 0) * 20e-9).toFixed(6)} ETH`);
            console.log(`Total Minting (4 NFTs)       | ${totalMintingGas.toLocaleString().padStart(13)} | ${(totalMintingGas * 20e-9).toFixed(6)} ETH`);
            console.log(`NFT Fractionalization        | ${fractGas.toLocaleString().padStart(13)} | ${(fractGas * 20e-9).toFixed(6)} ETH`);
            console.log(`Share Purchase               | ${buyGas.toLocaleString().padStart(13)} | ${(buyGas * 20e-9).toFixed(6)} ETH`);

            const totalGas = (gasUsed["Factory Deployment"] || 0) +
                (gasUsed["Collection Creation"] || 0) +
                totalMintingGas +
                fractGas +
                buyGas;

            console.log("-".repeat(70));
            console.log(`TOTAL GAS CONSUMED           | ${totalGas.toLocaleString().padStart(13)} | ${(totalGas * 20e-9).toFixed(6)} ETH`);
            console.log("=".repeat(70));

            // All operations should have passed
            expect(totalGas).to.be.greaterThan(0);
        });
    });
}); 