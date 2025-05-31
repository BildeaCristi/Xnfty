# 🚀 Xnfty - Fractional Ownership NFT Platform

Xnfty is a cutting-edge 3D NFT ecommerce platform that enables fractional ownership of NFT collections. Built with Next.js, blockchain technology, and IPFS integration.

## 🌟 Features

- **Fractional Ownership**: Create NFT collections with share-based ownership
- **3D Visualization**: Immersive 3D NFT viewing experience
- **IPFS Integration**: Decentralized storage via Pinata
- **Wallet Integration**: Support for MetaMask and Web3Auth
- **Share Trading**: Buy and sell collection shares
- **Real-time Updates**: Live ownership tracking and statistics
- **Dark Theme UI**: Modern, sleek interface matching the dashboard design

## 🏗️ Architecture

```
Xnfty/
├── frontend/           # Next.js frontend application
├── smart-contracts/    # Solidity smart contracts
└── README.md          # This file
```

### Smart Contract Architecture

1. **NFTFactory** - Factory contract for creating new NFT collections
2. **NFTCollection** - ERC721 contract with fractional ownership capabilities
3. **ShareToken** - ERC20 token representing shares in an NFT collection

### Data Structure

- **Collections**: Store name, image URL, description, and collection address
- **NFTs**: Store only metadata URI (IPFS) containing all NFT data (image, name, description, attributes)
- **Factory**: Holds array of collection addresses for easy iteration
- **Shares**: Track ownership percentages and automatic ownership transfer at >50% shares

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask wallet
- Sepolia testnet ETH

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Xnfty
```

### 2. Smart Contract Deployment

```bash
cd smart-contracts

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your PRIVATE_KEY and INFURA_API_KEY

# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

**Important**: Copy the deployed factory address from the output.

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add all required environment variables (see below)

# Start development server
npm run dev
```

## 🔧 Environment Configuration

### Smart Contracts (.env)

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
INFURA_API_KEY=your_infura_api_key
```

### Frontend (.env)

```env
# Authentication
AUTH_SECRET=your_random_secret_key
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
NEXT_PUBLIC_WEB3AUTH_VERIFIER=Xnfty
NEXT_PRIVATE_KEY=your_private_key_for_server_side
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_secret
NEXT_AUTH_URL=http://localhost:3000

# Blockchain
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=deployed_factory_address_from_step_2

# IPFS (Pinata)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
PINATA_GATEWAY=https://your-gateway.mypinata.cloud/ipfs/
```

## 📋 Setup Guide

### 1. Get Sepolia ETH

- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Request test ETH for deployment

### 2. Create Pinata Account

- Sign up at [Pinata](https://pinata.cloud/)
- Create API keys
- Set up your gateway

### 3. Configure Web3Auth

- Create account at [Web3Auth](https://web3auth.io/)
- Create a new project
- Get your client ID

### 4. Setup Google OAuth

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create OAuth 2.0 credentials
- Add authorized redirect URIs

## 🎯 Usage

### Creating a Collection

1. Connect your wallet
2. Click "Create Collection"
3. Fill in collection details:
   - Name and symbol
   - Description and image
   - Total shares and share price
4. Add NFTs to your collection (optional during creation)
5. Deploy to blockchain

### Adding NFTs to Collection

1. Open collection manager
2. Click "Add NFT" (owner only)
3. Upload image and fill metadata
4. Add attributes (optional)
5. Mint NFT with IPFS metadata

### Buying Shares

1. Browse available collections
2. Click on a collection
3. Go to "Shares" tab
4. Enter number of shares to buy
5. Confirm transaction

### Managing Collections

- **Owners**: Add NFTs, update metadata, set share prices
- **Shareholders**: View holdings, buy/sell shares
- **Public**: Browse collections, view statistics

## 🔧 Development

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Smart Contract Development

```bash
cd smart-contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

## 📖 Smart Contract Details

### NFTFactory

Main factory contract for creating collections:

```solidity
function createCollection(
    string memory name,
    string memory symbol,
    string memory description,
    string memory imageURI,
    string memory metadataURI,
    uint256 totalShares,
    uint256 sharePrice
) external returns (uint256)
```

### NFTCollection

ERC721 contract with fractional ownership:

```solidity
function mintNFT(string memory metadataURI) external returns (uint256)
function buyShares(uint256 shareAmount) external payable
```

### ShareToken

ERC20 token for collection shares:

```solidity
function getSharePercentage(address holder) external view returns (uint256)
```

## 🔐 Security

- All contracts use OpenZeppelin libraries
- ReentrancyGuard on critical functions
- Access control with Ownable pattern
- Input validation on all functions

## 🧪 Testing

### Smart Contracts

```bash
cd smart-contracts
npx hardhat test
```

### Frontend

```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Deployment

1. **Smart Contracts**: Deploy to mainnet
2. **Frontend**: Deploy to Vercel/Netlify
3. **Environment**: Update production environment variables

### Vercel Deployment

```bash
cd frontend
npm install -g vercel
vercel --prod
```

## 📊 Key Features Explained

### Fractional Ownership

- Collections divided into shares (ERC20 tokens)
- Share prices set by creators
- Automatic ownership transfer at >50% shares
- Real-time ownership tracking

### IPFS Integration

- Images uploaded to Pinata
- Metadata stored on IPFS
- Decentralized and permanent storage
- Fast retrieval via gateways

### Optimized Data Structure

- Collections store only essential data on-chain
- NFTs store only metadata URI (IPFS)
- Factory holds collection addresses array
- Efficient gas usage and storage

### Dark Theme UI

- Modern dark interface matching dashboard
- Improved text visibility and contrast
- Consistent styling across all components
- Enhanced user experience

## 🔄 Workflow

1. **Collection Creation**: Factory deploys new collection and share token contracts
2. **NFT Minting**: Owner uploads image to IPFS, creates metadata, mints with metadata URI
3. **Share Trading**: Users buy/sell shares, automatic ownership transfer
4. **Metadata Fetching**: Frontend fetches NFT metadata from IPFS for display

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:

1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Pinata Documentation](https://docs.pinata.cloud/)
- [Web3Auth Documentation](https://web3auth.io/docs/)

---

**Built with ❤️ for the future of NFTs**
