import { ethers } from "hardhat";

async function main() {
    const FractionalNFT = await ethers.getContractFactory("FractionalNFT");
    const fractionalNFTImpl = await FractionalNFT.deploy();
    await fractionalNFTImpl.waitForDeployment();
    console.log("FractionalNFT Implementation deployed to:", fractionalNFTImpl.address);

    // Deploy the CollectionFactory contract using the implementation address.
    const CollectionFactory = await ethers.getContractFactory("CollectionFactory");
    const factory = await CollectionFactory.deploy(fractionalNFTImpl.address);
    await factory.waitForDeployment();
    console.log("CollectionFactory deployed to:", factory.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
