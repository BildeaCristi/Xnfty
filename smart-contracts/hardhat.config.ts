import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-contract-sizer";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = "0x844a61365c3952e80efb1bba32ff9f4438e946cc20237dbc7e42289cfda75379";
//https://sepolia.infura.io/v3/${INFURA_API_KEY}
const INFURA_API_KEY = "0f1e70a964db4344a8422bcf5e0c1ef5";
console.log(PRIVATE_KEY);
console.log(INFURA_API_KEY);
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  contractSizer: {
    runOnCompile: true,
    disambiguatePaths: false,
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/n1RB18vIMN3sGkRxZLban-yGkxC2f6Dz',
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test"
  },
  sourcify: {
    enabled: true
  }
};

export default config;
