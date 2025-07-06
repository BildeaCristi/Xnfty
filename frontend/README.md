# 🎨 Xnfty Frontend - 3D Virtual Museum for Fractional NFTs

[![Next.js](https://img.shields.io/badge/Next.js-15.2.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174.0-red)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-blue)](https://tailwindcss.com/)

A modern Next.js web application that creates an immersive 3D virtual museum experience for fractional NFT ownership. Users can create, collect, and trade fractional shares of NFTs in a beautiful 3D environment.

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔧 Configuration](#-configuration)
- [📁 Project Structure](#-project-structure)
- [🎮 3D Museum Experience](#-3d-museum-experience)
- [🔗 Web3 Integration](#-web3-integration)
- [📱 Pages & Components](#-pages--components)
- [🛠️ Development](#-development)
- [🚢 Deployment](#-deployment)

## 🎯 Overview

Xnfty is a revolutionary platform that combines the power of Web3 technology with immersive 3D experiences. Users can:

- **Create NFT Collections**: Deploy custom ERC721 contracts with fractional ownership
- **3D Virtual Museum**: Explore collections in a realistic 3D environment
- **Fractional Trading**: Buy and sell shares of NFTs using ERC20 tokens
- **Interactive Experience**: First-person and orbit camera controls
- **Decentralized Storage**: IPFS integration for metadata and images

## ✨ Features

### 🎨 3D Virtual Museum
- **Immersive Environment**: Realistic 3D museum with dynamic lighting
- **Smart NFT Display**: Automatic wall positioning and rotation
- **Multiple View Modes**: First-person exploration and orbit camera
- **Interactive Elements**: Click-to-view NFT details and purchase options
- **Physics Integration**: Realistic movement and collision detection

### 🔗 Blockchain Integration
- **Multi-Wallet Support**: MetaMask, WalletConnect, and Web3Auth
- **Smart Contract Interaction**: Direct integration with Ethereum blockchain
- **Fractional Ownership**: ERC20 token-based share system
- **Real-time Updates**: Live blockchain data synchronization

### 🎯 NFT Management
- **Collection Creation**: Easy-to-use forms for deploying new collections
- **Metadata Management**: IPFS-based storage with Pinata integration
- **Share Trading**: Buy/sell fractional ownership shares
- **Portfolio Tracking**: Comprehensive dashboard for owned assets

### 🌐 Modern Web Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Customizable user interface
- **Real-time Notifications**: Toast notifications for transactions
- **Progressive Loading**: Optimized 3D asset loading

## 🏗️ Architecture

### Tech Stack

#### Core Framework
- **Next.js 15.2.0** - React framework with App Router
- **React 19.0.0** - Latest React with concurrent features
- **TypeScript 5.0** - Type-safe JavaScript development

#### 3D Graphics & Physics
- **Three.js 0.174.0** - WebGL-based 3D graphics library
- **@react-three/fiber 9.0.4** - React renderer for Three.js
- **@react-three/drei 10.0.3** - Useful helpers for R3F
- **@react-three/postprocessing 3.0.4** - Post-processing effects
- **@react-three/rapier 2.1.0** - Physics engine integration

#### Web3 & Blockchain
- **Wagmi 2.15.2** - React hooks for Ethereum
- **Viem 2.28.3** - TypeScript interface for Ethereum
- **Ethers.js 6.13.5** - Ethereum JavaScript library
- **Web3Auth 9.7.0** - Web3 authentication provider

#### State Management & Data
- **Zustand 5.0.5** - Lightweight state management
- **TanStack Query 5.81.2** - Server state management
- **@pinata/sdk 2.1.0** - IPFS storage integration

#### UI & Styling
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **@headlessui/react 2.2.2** - Accessible UI components
- **Lucide React 0.507.0** - Beautiful icons
- **React Spring** - Smooth animations

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│  Pages Layer                                                │
│  ├─ Dashboard (/dashboard)                                  │
│  ├─ Create Collection (/create-collection)                  │
│  ├─ Museum (/museum)                                        │
│  ├─ Collections (/collections)                              │
│  ├─ Profile (/profile)                                      │
│  └─ Authentication (/login)                                 │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                           │
│  ├─ 3D Museum Components                                    │
│  ├─ NFT Management Components                               │
│  ├─ Web3 Integration Components                             │
│  ├─ UI Components                                           │
│  └─ Layout Components                                       │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  ├─ Blockchain Service                                      │
│  ├─ IPFS Service                                            │
│  ├─ 3D Scene Service                                        │
│  └─ Asset Loading Service                                   │
├─────────────────────────────────────────────────────────────┤
│  External APIs                                              │
│  ├─ Ethereum Network                                        │
│  ├─ IPFS (Pinata)                                          │
│  ├─ Web3Auth                                                │
│  └─ Smart Contracts                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **npm or yarn** - Package manager
- **MetaMask** - Browser wallet extension
- **Sepolia ETH** - For testing (get from faucet)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/xnfty.git
   cd xnfty/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Update environment variables**
   ```bash
   # Blockchain Configuration
   NEXT_PUBLIC_NFT_FACTORY_ADDRESS=0x2B3842F3B3525aDC59304483212c28Eb8Ee59047
   NEXT_PUBLIC_NFT_FACTORY_VIEW_ADDRESS=0x0f9270b91CEe38fdd93e6D14ADb6Fe1b49B01E8e
   NEXT_PUBLIC_CHAIN_ID=11155111
   NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   
   # IPFS Configuration
   NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
   NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
   NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
   
   # Web3Auth Configuration
   NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
   
   # NextAuth Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### First Steps

1. **Connect Your Wallet** - Use MetaMask or Web3Auth
2. **Switch to Sepolia** - Ensure you're on the correct network
3. **Create a Collection** - Deploy your first NFT collection
4. **Explore the Museum** - View collections in 3D
5. **Trade Shares** - Buy fractional ownership of NFTs

## 🔧 Configuration

### Environment Variables

#### Required Variables
- `NEXT_PUBLIC_NFT_FACTORY_ADDRESS` - Factory contract address
- `NEXT_PUBLIC_NFT_FACTORY_VIEW_ADDRESS` - View contract address
- `NEXT_PUBLIC_CHAIN_ID` - Ethereum chain ID (11155111 for Sepolia)
- `NEXT_PUBLIC_RPC_URL` - Ethereum RPC endpoint

#### Optional Variables
- `NEXT_PUBLIC_PINATA_API_KEY` - Pinata API key for IPFS
- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` - Web3Auth client ID
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - Application URL

### Network Configuration

The application is configured for Sepolia testnet by default. To use other networks:

1. Update chain ID in environment variables
2. Deploy smart contracts to the target network
3. Update contract addresses
4. Configure RPC endpoints

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── api/                      # API routes
│   ├── collections/              # Collection pages
│   ├── create-collection/        # Collection creation
│   ├── dashboard/                # User dashboard
│   ├── museum/                   # 3D museum
│   ├── profile/                  # User profile
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── collections/              # Collection components
│   ├── create-collection/        # Creation components
│   ├── dashboard/                # Dashboard components
│   ├── museum/                   # 3D museum components
│   ├── providers/                # Context providers
│   ├── shared/                   # Shared components
│   └── ui/                       # UI components
├── config/                       # Configuration files
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
├── providers/                    # Global providers
├── services/                     # Business logic services
├── store/                        # State management
├── types/                        # TypeScript type definitions
└── utils/                        # Utility functions
```

## 🎮 3D Museum Experience

### Museum Features

#### **Dynamic NFT Display**
- Automatic positioning on four walls
- Smart rotation for optimal viewing
- Responsive scaling based on content
- Interactive hover and click effects

#### **Camera Controls**
- **First Person Mode**: WASD movement, mouse look
- **Orbit Mode**: Mouse drag, scroll zoom
- **Smooth Transitions**: Animated camera movement
- **Collision Detection**: Realistic physics boundaries

#### **Lighting System**
- **Ambient Lighting**: Soft fill light
- **Directional Lighting**: Dramatic shadows
- **Spotlight Effects**: Focused NFT illumination
- **Dynamic Shadows**: Real-time shadow casting

#### **Interactive Elements**
- **NFT Hover Effects**: Highlight on mouseover
- **Click-to-View**: Detailed NFT information
- **Purchase Integration**: Direct buying interface
- **Share Trading**: In-museum share transactions

### Performance Optimizations

- **LOD (Level of Detail)**: Distance-based quality scaling
- **Frustum Culling**: Only render visible objects
- **Texture Compression**: Optimized image formats
- **Asset Streaming**: Progressive loading
- **Memory Management**: Automatic cleanup

## 🔗 Web3 Integration

### Wallet Connection
```typescript
// Multiple wallet support
const connectors = [
  injected(), // MetaMask
  walletConnect(), // WalletConnect
  coinbaseWallet(), // Coinbase Wallet
];

// Web3Auth integration
const web3AuthInstance = new Web3Auth({
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
  chainConfig: {
    chainId: "0xaa36a7", // Sepolia
    rpcTarget: process.env.NEXT_PUBLIC_RPC_URL,
  },
});
```

### Smart Contract Interaction
```typescript
// Factory contract interaction
const { data: collections } = useContractRead({
  address: NFT_FACTORY_ADDRESS,
  abi: NFTFactoryABI,
  functionName: 'getAllCollections',
});

// Collection creation
const { write: createCollection } = useContractWrite({
  address: NFT_FACTORY_ADDRESS,
  abi: NFTFactoryABI,
  functionName: 'createCollection',
});
```

### IPFS Integration
```typescript
// Metadata upload to IPFS
const uploadToIPFS = async (file: File) => {
  const result = await pinata.pinFileToIPFS(file);
  return `ipfs://${result.IpfsHash}`;
};

// JSON metadata storage
const uploadMetadata = async (metadata: NFTMetadata) => {
  const result = await pinata.pinJSONToIPFS(metadata);
  return `ipfs://${result.IpfsHash}`;
};
```

## 📱 Pages & Components

### Core Pages

#### **Dashboard** (`/dashboard`)
- **Collections Overview**: Grid view of owned collections
- **Share Portfolio**: Fractional ownership tracking
- **Quick Actions**: Create, buy, sell shortcuts
- **Statistics**: Portfolio value and performance

#### **Create Collection** (`/create-collection`)
- **Collection Form**: Name, symbol, description
- **Metadata Upload**: Images and JSON metadata
- **Share Configuration**: Price and quantity settings
- **Deployment**: Smart contract deployment

#### **Museum** (`/museum`)
- **3D Environment**: Immersive museum experience
- **NFT Gallery**: Wall-mounted NFT displays
- **Interactive Navigation**: First-person and orbit modes
- **Purchase Interface**: In-museum buying experience

#### **Collections** (`/collections`)
- **Collection Browser**: Explore all collections
- **Search & Filter**: Find specific collections
- **Detailed View**: Collection statistics and NFTs
- **Share Trading**: Buy/sell fractional shares

#### **Profile** (`/profile`)
- **User Information**: Profile settings
- **Collection History**: Created collections
- **Transaction History**: Trading activity
- **Wallet Integration**: Connected wallet info

### Key Components

#### **3D Museum Components**
- `MuseumRoom` - Main 3D environment
- `NFTFrame` - Interactive NFT displays
- `FirstPersonCharacterController` - Movement controls
- `CrosshairRaycaster` - Interaction system

#### **NFT Management Components**
- `CollectionForm` - Collection creation form
- `NFTForm` - Individual NFT creation
- `CollectionCard` - Collection display card
- `NFTCard` - Individual NFT display

#### **Web3 Components**
- `WalletProvider` - Wallet connection context
- `BlockchainService` - Smart contract interactions
- `Web3AuthProvider` - Authentication provider

## 🛠️ Development

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Development Guidelines

#### **Code Style**
- Use TypeScript for all new files
- Follow ESLint configuration
- Use Prettier for code formatting
- Write descriptive component names

#### **3D Development**
- Use React Three Fiber for 3D components
- Implement proper cleanup in useEffect
- Use refs for Three.js objects
- Optimize for performance

#### **Web3 Integration**
- Always handle loading states
- Implement proper error handling
- Use try-catch for async operations
- Validate user inputs

### Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

### Debugging

#### **3D Issues**
- Use Three.js Inspector browser extension
- Check console for WebGL errors
- Monitor performance with browser dev tools
- Use React DevTools for component debugging

#### **Web3 Issues**
- Check network connectivity
- Verify contract addresses
- Monitor transaction status
- Use MetaMask developer tools

## 🚢 Deployment

### Build Process

1. **Environment Setup**
   ```bash
   # Production environment variables
   cp .env.example .env.production
   # Update production values
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Deploy to Platform**
   ```bash
   # Vercel
   vercel --prod
   
   # Netlify
   netlify deploy --prod
   
   # AWS S3
   aws s3 sync ./out s3://your-bucket --delete
   ```

### Deployment Checklist

- [ ] Update environment variables
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure CDN for assets
- [ ] Set up monitoring
- [ ] Test all functionality
- [ ] Verify smart contract addresses
- [ ] Test wallet connections

### Performance Optimization

#### **3D Assets**
- Compress textures (WebP, AVIF)
- Use appropriate polygon counts
- Implement texture atlasing
- Use instancing for repeated objects

#### **Web Performance**
- Enable Next.js Image optimization
- Use dynamic imports for 3D components
- Implement service worker caching
- Optimize bundle size

### Monitoring

- **Error Tracking**: Sentry or similar
- **Performance Monitoring**: Core Web Vitals
- **User Analytics**: Google Analytics
- **Blockchain Monitoring**: Transaction tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation wiki
- Email: support@xnfty.com

---

**Built with ❤️ by the Xnfty Team** 