# 🏛️ Xnfty - 3D Virtual Museum for Fractional NFTs

[![Next.js](https://img.shields.io/badge/Next.js-15.2.0-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)](https://soliditylang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174.0-black)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Xnfty** este o platformă Web3 inovativă care combină un muzeu virtual 3D interactiv cu un sistem avansat de NFT-uri cu proprietate fracționată. Aplicația permite utilizatorilor să creeze, să desfășoare (deploy) și să tranzacționeze NFT-uri într-un mediu 3D imersiv, oferind o experiență unică în ecosistemul blockchain.

## 🎯 Ce este Xnfty?

Xnfty revoluționează modul în care interacționăm cu NFT-urile prin:

- **🏛️ Muzeu Virtual 3D**: Experiență imersivă de vizualizare a NFT-urilor cu navigare first-person și orbit camera
- **💎 Proprietate Fracționată**: Sistem inovativ care permite cumpărarea de shares ale unui NFT (ERC-20 + ERC-721)
- **🚀 Deployment Automatizat**: Factory pattern pentru crearea automată de colecții NFT
- **🔗 Multi-Blockchain**: Suport pentru Ethereum, Polygon și alte rețele Layer 2
- **🎮 Fizică Realistă**: Integrare Rapier physics engine pentru interacțiuni autentice

## ✨ Funcționalități Principale

### 🎨 Creator Tools
- **Automated Collection Deployment** - Factory pattern elimină procesele manuale
- **NFT Minting** cu metadata IPFS și 3D asset support
- **Fractional Configuration** - setare shares, pricing și governance
- **Multi-format Support** - imagini, video, modele 3D, animații

### 💰 Trading & Ownership
- **Fractional NFT Trading** - cumpărare/vânzare shares individual
- **Automatic Ownership Transfer** - la deținerea >50% shares
- **Dynamic Pricing** - piață liberă pentru share pricing
- **Real-time Portfolio Tracking** - monitoring investiții și returns

### 🏛️ Museum Experience
- **Immersive 3D Navigation** - first-person și orbit camera controls
- **Physics-based Interactions** - coliziuni și manipulare obiecte
- **Adaptive Quality Systems** - LOD pentru cross-platform performance
- **Interactive NFT Displays** - hover effects, metadata integration
- **Social Features** - multiplayer potential pentru experiențe shared

### 🔐 Web3 Integration
- **Multiple Authentication** - Web3Auth (social + wallet login)
- **Cross-wallet Support** - MetaMask, WalletConnect, și altele
- **Real-time Blockchain Sync** - live updates și notificări
- **IPFS Decentralized Storage** - metadata și assets decentralizate

## 🛠️ Stack Tehnologic

### 🔗 Blockchain Layer
- **Solidity 0.8.20** - Smart contracts cu optimizări avansate
- **OpenZeppelin 4.9.6** - Security patterns și standardized contracts
- **Hardhat 2.17.2** - Development environment și testing framework
- **TypeChain 8.3.1** - Type-safe contract interactions
- **Ethers.js 6.13.5** - Blockchain interaction library

### 🎨 Frontend Stack
- **Next.js 15.2.0** cu Turbopack pentru fast development
- **React 19.0.0** cu concurrent features pentru performance
- **TypeScript 5** pentru type safety și developer experience
- **Tailwind CSS 4.0.15** pentru modern, responsive design
- **Zustand 5.0.5** pentru predictable state management

### 🎮 3D Graphics & Physics
- **Three.js 0.174.0** - Core 3D rendering engine
- **React Three Fiber 9.0.4** - Declarative 3D programming
- **Rapier Physics 2.1.0** - WebAssembly-based physics simulation
- **@react-three/drei 10.0.3** - Enhanced 3D components și helpers
- **@react-three/postprocessing 3.0.4** - Advanced visual effects

### 🌐 Web3 & Storage
- **Wagmi 2.15.2** + **Viem 2.28.3** - Type-safe Web3 React hooks
- **Web3Auth 9.7.0** - Social și wallet authentication
- **IPFS + Pinata SDK 2.1.0** - Decentralized storage solution
- **NextAuth 5.0.0-beta** - Session management și social login

## 🏗️ Design Patterns Implementate

### 🎭 Smart Contract Patterns

#### 1. **Factory Pattern**
```solidity
// NFTFactory.sol - Automated contract deployment
function createCollection(string memory name, string memory symbol, string memory metadataURI) 
    external returns (uint256)
```
- **Eliminarea deployment-ului manual**
- **Standardizarea interfețelor**
- **Centralized tracking și discovery**

#### 2. **Clone Factory Pattern**
```solidity
// CollectionFactory.sol - Gas-efficient contract cloning
address clone = Clones.clone(implementation);
FractionalNFT(clone).initialize(_name, _description);
```
- **Reduced deployment costs** prin shared bytecode
- **Upgradeability** prin new implementation contracts

#### 3. **Dual Token System**
- **ERC-721** pentru NFT-uri unice cu metadata IPFS
- **ERC-20** pentru shares și fractional ownership
- **Cross-contract coordination** pentru ownership transfer

#### 4. **State Machine Pattern**
```solidity
// NFT state transitions: Normal → Fractionalized → Complete Ownership
bool isfractionalized;
function _checkOwnershipChange() internal // Automatic state transitions
```

#### 5. **Access Control Patterns**
- **Ownable** pentru creator permissions
- **ReentrancyGuard** pentru attack prevention
- **Role-based access** cu multiple authorization levels

### 🎨 Frontend Patterns

#### 1. **Provider Pattern**
```typescript
// Web3 context management
<Web3Provider>
  <AuthProvider>
    <MuseumProvider>
```

#### 2. **Custom Hooks Pattern**
```typescript
// hooks/useNFTCollection.ts
// hooks/useWeb3Auth.ts
// hooks/useMuseumControls.ts
```

#### 3. **Observer Pattern**
- **Zustand stores** pentru state synchronization
- **Event-driven architecture** pentru blockchain updates
- **Real-time UI updates** prin WebSocket-like connections

#### 4. **Strategy Pattern**
- **Multiple authentication strategies** (social + wallet)
- **Adaptive quality rendering** based pe device capabilities
- **Cross-platform asset loading** strategies

## 📁 Arhitectura Proiectului

```
xnfty/
├── 🎨 frontend/                     # Next.js application
│   ├── 📱 app/                      # App Router pages
│   │   ├── museum/                  # 3D museum interface
│   │   ├── marketplace/             # NFT trading platform
│   │   ├── dashboard/               # User management
│   │   ├── collections/             # Collection management
│   │   └── api/                     # API routes
│   ├── 🧩 components/               # Reusable components
│   │   ├── museum/                  # 3D scene components
│   │   ├── auth/                    # Authentication UI
│   │   ├── collections/             # Collection management
│   │   ├── ui/                      # Base UI components
│   │   └── providers/               # Context providers
│   ├── 🔗 hooks/                    # Custom React hooks
│   ├── 🗄️ store/                    # Zustand state management
│   │   ├── SceneStore.ts            # 3D scene state
│   │   ├── MuseumStore.ts           # Museum specific state
│   │   └── WalletStore.ts           # Wallet connection state
│   ├── 🎭 types/                    # TypeScript definitions
│   └── 🛠️ utils/                    # Helper functions
├── 🔗 smart-contracts/              # Blockchain layer
│   ├── 📜 contracts/                # Smart contracts
│   │   ├── NFTFactory.sol           # Factory pattern implementation
│   │   ├── NFTCollection.sol        # ERC-721 with fractional support
│   │   ├── FractionalNFT.sol        # ERC-20 shares contract
│   │   └── CollectionFactory.sol    # Clone factory implementation
│   ├── 🧪 test/                     # Contract tests
│   ├── 📝 scripts/                  # Deployment scripts
│   └── 🔧 typechain-types/          # Generated TypeScript types
└── 📖 docs/                         # Documentation
```

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** v18+ și npm/yarn
- **Git** pentru version control
- **MetaMask** sau alt Web3 wallet
- **Sepolia ETH** pentru testing (free din faucet)

### 🔧 Installation

```bash
# Clone repository
git clone https://github.com/your-username/xnfty.git
cd xnfty

# Install dependencies
npm install

# Setup smart contracts
cd smart-contracts
npm install
npx hardhat compile

# Setup frontend
cd ../frontend
npm install
```

### ⚙️ Environment Configuration

#### Smart Contracts `.env`:
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

#### Frontend `.env.local`:
```env
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=deployed_factory_address
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
NEXT_PUBLIC_CHAIN_ID=11155111
```

### 🚀 Deployment

#### 1. Deploy Smart Contracts
```bash
cd smart-contracts

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan (optional)
npx hardhat verify --network sepolia <FACTORY_ADDRESS>
```

#### 2. Start Frontend
```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build
npm start
```

### 🌐 Access Application
- **Local Development**: http://localhost:3000
- **3D Museum**: http://localhost:3000/museum
- **Marketplace**: http://localhost:3000/marketplace
- **Dashboard**: http://localhost:3000/dashboard

## 🎮 User Guide

### 👤 Pentru Creators

1. **Connect Wallet** - Web3Auth sau MetaMask
2. **Create Collection** - Factory deployment cu custom metadata
3. **Mint NFTs** - Upload assets la IPFS și mint pe blockchain
4. **Setup Fractional Ownership** - Configure shares și pricing
5. **Launch în Museum** - 3D gallery cu custom layout

### 💰 Pentru Investors

1. **Browse Museum** - Explorare 3D collection gallery
2. **Discover NFTs** - Interactive browsing cu metadata details
3. **Buy Shares** - Fractional investment cu dynamic pricing
4. **Track Portfolio** - Real-time monitoring returns
5. **Trade Shares** - Secondary market cu instant settlement

### 🏛️ Pentru Visitors

1. **Explore Museum** - First-person navigation prin galleries
2. **Interactive Experiences** - Physics-based object manipulation
3. **Educational Content** - Artist stories și collection context
4. **Social Features** - Share discoveries și favorite pieces
5. **Cross-platform Access** - Desktop, mobile, și VR ready

## 🔒 Security Features

- **🛡️ Smart Contract Security**: OpenZeppelin patterns, reentrancy protection
- **🔐 Wallet Security**: Non-custodial approach, private key management
- **📁 Decentralized Storage**: IPFS pentru censorship resistance
- **🔍 Transparent Transactions**: Open-source contracts cu public verification
- **⚡ Gas Optimization**: Efficient contract design pentru reduced costs

## 🧪 Testing

### Smart Contracts
```bash
cd smart-contracts
npx hardhat test
npx hardhat coverage
```

### Frontend
```bash
cd frontend
npm test
npm run test:e2e
```

### Integration Tests
```bash
npm run test:integration
```

## 📈 Performance Optimizations

- **🎮 Adaptive Quality Systems** - Dynamic LOD based pe device capabilities
- **⚡ Code Splitting** - Lazy loading pentru 3D components
- **🗄️ Efficient State Management** - Zustand pentru minimal re-renders
- **📦 Asset Optimization** - Compressed textures și model optimization
- **🔗 Blockchain Efficiency** - Batched transactions și gas optimization

## 🤝 Contributing

Welcomem contribuții! Vedeți [CONTRIBUTING.md](CONTRIBUTING.md) pentru guidelines.

### Development Workflow
1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

Acest proiect este licensed sub [MIT License](LICENSE).

## 🔗 Links & Resources

- **📖 Documentation**: [docs.xnfty.com](https://docs.xnfty.com)
- **🐦 Twitter**: [@XnftyPlatform](https://twitter.com/XnftyPlatform)
- **💬 Discord**: [discord.gg/xnfty](https://discord.gg/xnfty)
- **🐛 Issues**: [GitHub Issues](https://github.com/your-username/xnfty/issues)

## 🆘 Support

Pentru întrebări sau support:
1. Verificați [Documentation](https://docs.xnfty.com)
2. Căutați în [GitHub Issues](https://github.com/your-username/xnfty/issues)
3. Alăturați-vă [Discord Community](https://discord.gg/xnfty)
4. Creați un [New Issue](https://github.com/your-username/xnfty/issues/new)

---

**Built with ❤️ for the future of digital art and fractional ownership.**

*Xnfty - Where Art Meets Innovation în Web3 Era*
