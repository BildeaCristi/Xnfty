# Xnfty Smart Contracts

This directory contains the smart contracts for the Xnfty fractional ownership NFT platform.

## 📋 Overview

The Xnfty platform consists of three main smart contracts:

1. **NFTFactory** - Factory contract for creating new NFT collections
2. **NFTCollection** - ERC721 contract with fractional ownership capabilities
3. **ShareToken** - ERC20 token representing shares in an NFT collection

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or another Web3 wallet
- Sepolia testnet ETH for deployment

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Environment Setup

Create a `.env` file in the smart-contracts directory:

```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key_here
```

**⚠️ Security Note:** Never commit your private key to version control. Use a test wallet for development.

### Deployment

Deploy to Sepolia testnet:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

The deployment script will:
- Deploy the NFTFactory contract
- Save deployment info to `deployment.json`
- Display the contract address and next steps

### Verification (Optional)

Verify your contract on Etherscan:

```bash
npx hardhat verify --network sepolia <FACTORY_ADDRESS>
```

## 🔧 Configuration

### Frontend Integration

After deployment, update your frontend `.env` file:

```env
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=<DEPLOYED_FACTORY_ADDRESS>
```

### Network Configuration

The contracts are configured for Sepolia testnet. To deploy to other networks, update `hardhat.config.ts`.

## 📖 Contract Architecture

### NFTFactory

The main factory contract that:
- Creates new NFT collections
- Tracks all collections
- Manages collection metadata

Key functions:
- `createCollection()` - Deploy a new collection with fractional ownership
- `getAllCollections()` - Get all collections
- `getUserCollections()` - Get collections owned by a user

### NFTCollection

ERC721 contract with fractional ownership:
- Mints NFTs within the collection
- Manages share-based ownership
- Handles ownership transfers when majority shares are acquired

Key functions:
- `mintNFT()` - Mint new NFTs (owner only)
- `buyShares()` - Purchase shares in the collection
- `getCollectionStats()` - Get collection statistics

### ShareToken

ERC20 token representing collection shares:
- Tracks fractional ownership
- Enables share trading
- Calculates ownership percentages

## 🧪 Testing

Run the test suite:

```bash
npx hardhat test
```

## 📁 Project Structure

```
smart-contracts/
├── contracts/
│   └── ShareableNFTFactory.sol    # Main contract file
├── scripts/
│   └── deploy.ts                  # Deployment script
├── test/                          # Test files
├── hardhat.config.ts             # Hardhat configuration
├── deployment.json               # Deployment info (generated)
└── README.md                     # This file
```

## 🔍 Key Features

### Fractional Ownership
- Collections can be divided into shares
- Share prices set by collection creator
- Automatic ownership transfer when >50% shares acquired

### IPFS Integration
- Collection and NFT metadata stored on IPFS
- Images uploaded via Pinata
- Decentralized metadata storage

### Share Trading
- Buy/sell shares in collections
- Real-time ownership tracking
- Transparent share distribution

## 🛠️ Development

### Local Development

Start a local Hardhat node:

```bash
npx hardhat node
```

Deploy to local network:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Gas Optimization

The contracts are optimized for gas efficiency:
- Minimal storage operations
- Efficient data structures
- Optimized loops and calculations

## 📊 Deployment Info

After deployment, check `deployment.json` for:
- Contract addresses
- Deployment transaction details
- Network information
- Deployer address

## 🔐 Security Considerations

- All contracts use OpenZeppelin libraries
- ReentrancyGuard protection on critical functions
- Access control with Ownable pattern
- Input validation on all public functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🔗 Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [Sepolia Testnet Faucet](https://sepoliafaucet.com/)
