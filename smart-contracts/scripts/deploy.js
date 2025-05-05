const { ethers } = require("hardhat");
async function main() {
    const Factory = await ethers.getContractFactory("FractionalNFT");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    console.log("FractionalNFT contract deployed to:", contract.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});