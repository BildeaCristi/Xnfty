# 🎨 Xnfty - 3D Virtual NFT Museum with Fractional Ownership

<div align="center">

**A revolutionary 3D immersive platform for NFT creation, trading, and exhibition with fractional ownership capabilities**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.0-black)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174.0-blue)](https://threejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

</div>

---

## 📖 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Project Structure](#️-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [📱 Usage Guide](#-usage-guide)
- [🔧 Smart Contracts](#-smart-contracts)
- [🎮 3D Museum Features](#-3d-museum-features)
- [🌐 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

---

## 🎯 Overview

**Xnfty** is a next-generation NFT platform that combines the power of blockchain technology with immersive 3D experiences. Unlike traditional NFT marketplaces that display static images, Xnfty allows users to explore their digital assets in a fully interactive 3D virtual museum environment.

### 🌟 What Makes Xnfty Special?

- **🏛️ 3D Virtual Museum**: Experience your NFTs in beautifully crafted 3D spaces
- **🔄 Fractional Ownership**: Buy and sell shares of expensive NFTs 
- **⚡ Real-time Physics**: Powered by Rapier physics engine for realistic interactions
- **🎨 Multiple Themes**: Classical, Modern, Cyber, and Garden museum themes
- **🔗 Blockchain Native**: Built on Ethereum with IPFS storage
- **👥 Social Trading**: Trade NFT shares with automatic ownership transfers
- Automatic deployment of a collection using a factory contratc and then cand create a erc721 collection with erc72 nfts and fractionalized by using a erc20 token with shares, if buy all shares that becoming owner

---

## ✨ Key Features

### 🎨 NFT Creation & Management
- **Multi-NFT Collections**: Create collections with multiple NFTs in one transaction
- **Fractional Ownership**: Split NFT ownership into tradeable ERC-20 shares
- **IPFS Storage**: Decentralized storage for images and metadata
- **Smart Contracts**: Fully on-chain ownership and trading logic

### 🏛️ 3D Virtual Museum
- **Immersive Experience**: Walk through your NFT collections in 3D space
- **Multiple Themes**: Choose from Classical, Modern, Cyber, and Garden themes
- **Physics Simulation**: Realistic lighting, shadows, and object interactions
- **First-Person & Orbit Controls**: Multiple ways to navigate the space
- **Dynamic Loading**: Efficient asset loading with progress indicators

### 💰 Advanced Trading
- **Share Trading**: Buy/sell fractional ownership without seller approval
- **Automatic Transfers**: NFT ownership transfers at 100% share ownership
- **Real-time Pricing**: Dynamic share pricing with availability checks
- **Creator Royalties**: Support for original creators through share trading

### 🔐 Security & Authentication
- **MetaMask Integration**: Secure wallet connections
- **Multi-auth Support**: Web3Auth, Google OAuth options
- **Session Management**: Persistent authentication across sessions
- **Error Boundaries**: Comprehensive error handling and recovery

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.0 with App Router
- **3D Graphics**: Three.js + React Three Fiber
- **Physics**: Rapier Physics Engine (@react-three/rapier)
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand
- **Authentication**: NextAuth.js + Web3Auth
- **API Queries**: TanStack React Query

### Blockchain
- **Smart Contracts**: Solidity 0.8.20
- **Development**: Hardhat + TypeScript
- **Libraries**: OpenZeppelin Contracts
- **Web3 Integration**: Ethers.js 6.13.5 + Wagmi + Viem
- **Storage**: IPFS via Pinata

### Development & DevOps
- **Language**: TypeScript
- **Package Manager**: npm
- **Testing**: Hardhat + Chai
- **Deployment**: Vercel (Frontend) + Sepolia Testnet

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** wallet extension
- **Git** for cloning the repository

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/xnfty.git
cd xnfty
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install smart contract dependencies
cd ../smart-contracts
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the `frontend` directory:

```env
# Pinata IPFS Configuration (Required)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Blockchain Configuration
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=0xD7F7CC167FbBC23D7e7E22444529ce197F71a816

# Authentication
AUTH_SECRET=your_auth_secret_here
WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

### 4. Start Development

```bash
# Start the frontend development server
cd frontend
npm run dev

# In a new terminal, start local blockchain (optional)
cd smart-contracts
npx hardhat node
```

🎉 **You're ready!** Open [http://localhost:3000](http://localhost:3000) to see Xnfty in action.

---

## ⚙️ Configuration

### 🔗 Blockchain Networks

The application supports multiple networks:

| Network | RPC URL | Chain ID | Purpose |
|---------|---------|----------|---------|
| **Sepolia** | `https://sepolia.infura.io/v3/YOUR_KEY` | 11155111 | Testnet (Recommended) |
| **Mumbai** | `https://rpc-mumbai.maticvigil.com` | 80001 | Polygon Testnet |
| **Local** | `http://localhost:8545` | 31337 | Development |

### 📦 IPFS Configuration

Xnfty uses [Pinata](https://pinata.cloud) for IPFS storage:

1. Create a Pinata account
2. Generate API keys with `pinFileToIPFS` and `pinJSONToIPFS` permissions
3. Add the keys to your `.env.local` file

---

## 📱 Usage Guide

### Creating Your First NFT Collection

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Create Collection**: Navigate to Dashboard → "Create Collection"
3. **Upload Assets**: Add collection image and individual NFT images
4. **Configure Sharing**: Choose which NFTs to fractionalize and set share parameters
5. **Deploy**: Review and deploy to blockchain (requires ETH for gas fees)

### Exploring the 3D Museum

1. **View Collections**: Visit any collection page
2. **Enter Museum**: Click "View in 3D Museum"
3. **Navigate**: Use WASD keys or mouse for orbit controls
4. **Interact**: Click on NFTs to view details and trading options
5. **Settings**: Adjust graphics quality, controls, and theme

### Trading NFT Shares

1. **Browse Collections**: Find collections with fractional ownership
2. **View Details**: Click on any NFT to see share information
3. **Buy Shares**: Specify quantity and confirm transaction
4. **Automatic Transfer**: NFT ownership transfers at 100% share ownership

---

## 🔧 Smart Contracts

### Contract Architecture

Xnfty uses a factory pattern with three main contracts:

#### 🏭 NFTFactory.sol
- **Purpose**: Main factory for creating NFT collections
- **Functions**: `createCollection()`, `getUserCollections()`, `getAllCollections()`
- **Address**: `0xD7F7CC167FbBC23D7e7E22444529ce197F71a816` (Sepolia)

#### 🎨 NFTCollection.sol
- **Purpose**: Individual NFT collection contract (ERC-721)
- **Functions**: `mintNFT()`, `fractionalize()`, `getCollectionNFTs()`
- **Features**: Metadata storage, fractional ownership integration

#### 💰 FractionalNFT.sol
- **Purpose**: Fractional ownership contract (ERC-20)
- **Functions**: `buyShares()`, `getSharePrice()`, `getAvailableShares()`
- **Features**: Automatic ownership transfer, creator tracking

### Deployment Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to local network
npm run deploy:local
```

---

## 🎮 3D Museum Features

### 🎯 Interactive Elements

- **NFT Frames**: Hover effects and click interactions
- **Physics Objects**: Decorative items with realistic physics
- **Lighting**: Dynamic lighting with shadows and reflections
- **Audio**: Background music and interaction sounds

### 🎮 Controls

| Control | Action |
|---------|--------|
| **W/A/S/D** | Move around the museum |
| **Mouse** | Look around (first-person mode) |
| **Mouse + Drag** | Orbit camera (orbit mode) |
| **Click** | Interact with NFTs |
| **E** | Toggle control mode |
| **Esc** | Settings panel |

### ⚡ Performance Features

- **Level of Detail (LOD)**: Automatic quality adjustment based on distance
- **Frustum Culling**: Only render visible objects
- **Texture Compression**: Optimized textures for web delivery
- **Progressive Loading**: Load assets as needed

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables
3. **Build Settings**: Next.js is auto-detected
4. **Deploy**: Vercel handles the rest automatically

```bash
# Build for production
npm run build

# Start production server locally
npm run start
```

### Smart Contract Deployment

```bash
# Deploy to Sepolia testnet
cd smart-contracts
npm run deploy:sepolia

# Copy ABI files to frontend
cp -r artifacts/ ../frontend/utils/artifacts/
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Test thoroughly**: Run tests for both frontend and smart contracts
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes clearly

### 📝 Coding Standards

- **TypeScript**: Strict mode enabled, properly typed code
- **ESLint**: Follow the existing linting rules
- **Prettier**: Auto-format code on save
- **Conventional Commits**: Use conventional commit messages
- **Testing**: Add tests for new functionality

---

## 🔮 Roadmap

### 🚀 Upcoming Features

- **🎮 VR Support**: Virtual reality museum experiences
- **🤖 AI Curation**: AI-powered NFT recommendations
- **🌍 Metaverse Integration**: Connect with other virtual worlds
- **📱 Mobile App**: Native mobile applications
- **🎵 Audio NFTs**: Support for music and audio NFTs

### 🔧 Technical Improvements

- **Layer 2 Integration**: Polygon, Arbitrum, Optimism support
- **Cross-chain Bridge**: Trade NFTs across different blockchains
- **Enhanced Physics**: More realistic interactions and animations
- **Performance**: Further optimization for low-end devices

---

## 🙏 Acknowledgments

Special thanks to:

- **[Three.js](https://threejs.org/)** - For the amazing 3D graphics library
- **[Rapier](https://rapier.rs/)** - For the physics simulation engine
- **[OpenZeppelin](https://openzeppelin.com/)** - For secure smart contract libraries
- **[Pinata](https://pinata.cloud/)** - For reliable IPFS infrastructure
- **[Next.js](https://nextjs.org/)** - For the excellent React framework

---

<div align="center">

**Built with ❤️ for the NFT community**

⭐ **Star this repo if you find it helpful!** ⭐

</div>
