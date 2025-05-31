# Environment Setup Guide

## 🔧 Required Environment Variables

Create a `.env.local` file in your `frontend` directory with the following variables:

```env
# Pinata IPFS Configuration (Required for image uploads)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Blockchain Configuration
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=0xD7F7CC167FbBC23D7e7E22444529ce197F71a816

# Authentication
AUTH_SECRET=your_auth_secret_here
WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 📋 How to Get Pinata Credentials

1. **Go to Pinata**: https://app.pinata.cloud/
2. **Sign up/Login** to your account
3. **Navigate to API Keys**: https://app.pinata.cloud/keys
4. **Create New Key**:
   - Name: "Xnfty Development"
   - Permissions: Check "Admin" (or at minimum "pinFileToIPFS" and "pinJSONToIPFS")
5. **Copy the credentials**:
   - API Key → `NEXT_PUBLIC_PINATA_API_KEY`
   - API Secret → `NEXT_PUBLIC_PINATA_SECRET_KEY`

## 🧪 Testing Your Setup

1. **Restart your development server** after creating `.env.local`
2. **Open the Create Collection modal**
3. **Click "Test Pinata"** button
4. **Check console logs** for detailed feedback

## 🔍 Troubleshooting

### 401 Unauthorized Error
- Double-check your API key and secret
- Ensure the API key has proper permissions
- Make sure there are no extra spaces in your .env.local file

### Environment Variables Not Loading
- Restart your Next.js development server
- Ensure the file is named exactly `.env.local`
- Check that variables start with `NEXT_PUBLIC_` for client-side access

### Contract Function Errors (e.g., "getCreator is not a function")

If you're getting errors like "fractionalNFT.getCreator is not a function", this means the smart contracts need to be updated with the new functions:

#### **Step 1: Compile Updated Contracts**
```bash
cd smart-contracts
npm run compile
```

#### **Step 2: Deploy Updated Contracts**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

#### **Step 3: Update Frontend ABIs**
After deploying, copy the new ABI files from `smart-contracts/artifacts/contracts/` to `frontend/utils/artifacts/contracts/`:

```bash
# From the project root
cp smart-contracts/artifacts/contracts/FractionalNFT.sol/FractionalNFT.json frontend/utils/artifacts/contracts/FractionalNFT.sol/
cp smart-contracts/artifacts/contracts/NFTFactory.sol/NFTFactory.json frontend/utils/artifacts/contracts/NFTFactory.sol/
cp smart-contracts/artifacts/contracts/NFTCollection.sol/NFTCollection.json frontend/utils/artifacts/contracts/NFTCollection.sol/
```

#### **Step 4: Update Contract Address**
Update the `NEXT_PUBLIC_NFT_FACTORY_ADDRESS` in your `.env.local` file with the new deployed factory address.

#### **Step 5: Restart Frontend**
```bash
cd frontend
npm run dev
```

#### **Debugging Contract Functions**
In the NFT detail modal, click the "Debug" button next to "View on Etherscan" to see which functions are available in the contract. Check the browser console for a detailed report.

### Share Buying Issues

If share buying is not working:

1. **Check Contract Functions**: Use the Debug button to verify `buyShares()` function exists
2. **Verify Balance**: Ensure you have enough ETH for the transaction
3. **Check Available Shares**: Make sure there are shares available for purchase
4. **Contract Address**: Verify the fractional contract address is correct
5. **Network**: Ensure you're connected to the correct network (Sepolia testnet)

### Still Having Issues?
- Check browser console for detailed error logs
- Use the "Debug" button to inspect contract state
- Verify your .env.local file is in the correct directory (frontend/)
- Ensure smart contracts are deployed with the latest updates

## 🆕 Latest Smart Contract Updates

The smart contracts have been comprehensively updated with major improvements:

### 🛠️ Core Fixes:
- **✅ Fixed Share Buying Logic**: Resolved ERC20 transfer errors - users can now buy shares seamlessly
- **✅ Ownership Transfer**: Automatic NFT ownership transfer when someone owns 100% of shares or >50% majority
- **✅ Removed Double Tracking**: Fixed internal share tracking that was causing conflicts
- **✅ Contract Size Optimization**: Optimized for successful testnet deployment

### 🎯 New Features:
- **Creator vs Owner Tracking**: Distinguish between original NFT creator and current owner
- **Enhanced Share Availability**: Better logic for determining available shares for purchase
- **Improved Error Handling**: Clear error messages for share buying failures
- **Extended NFT Info**: Access to creator information and ownership transfer status

### 🔧 New Contract Functions:
- `getCreator()`: Returns the original NFT creator address
- `hasShares(address)`: Check if a user has any shares in an NFT
- `getExtendedNFTInfo()`: Get comprehensive NFT information including creator
- `getAvailableSharesForBuyer()`: Get shares available for a specific buyer

### 📱 UI Enhancements:
- **Enhanced Dashboard**: Shows creator vs owner information for shared NFTs
- **Better Share Display**: Clear indication of ownership transfers and share details
- **Improved Share Buying**: Real-time available shares and affordability checks
- **Creator Information**: Display original creator alongside current owner
- **Ownership Transfer Alerts**: Visual indicators when NFT ownership has changed hands

### 🏗️ Contract Addresses:
- **NFTFactory**: `0xD7F7CC167FbBC23D7e7E22444529ce197F71a816` (Sepolia)

### 📊 Key Improvements:
1. **Seamless Trading**: Buy shares without seller approval
2. **Automatic Transfers**: NFT ownership transfers automatically at 100% share ownership
3. **Enhanced Performance**: Optimized smart contract calls for better UX
4. **Clear Ownership**: Distinguish between creator and current owner
5. **Better Error Messages**: Helpful feedback for transaction failures

Make sure to update your `.env.local` file with the new factory address above! After compiling and deploying the updated contracts, copy the new ABIs to ensure all new functions are available in the UI. 