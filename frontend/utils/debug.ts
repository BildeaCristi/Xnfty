import { 
  getUserNFTShares, 
  getCollectionsWithUserShares, 
  getAllFractionalizedNFTs,
  getFractionalNFTInfo,
  getNFTShareHolders,
  getExtendedNFTInfo
} from './blockchain';

/**
 * Debug utility to manually check user shares and contract status
 * Open browser console and call: window.debugUserShares('your-wallet-address')
 */
export async function debugUserShares(userAddress: string) {
  console.log('🔍 DEBUG: Checking user shares for:', userAddress);
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    // 1. Check getUserNFTShares
    console.log('\n📊 1. Getting user NFT shares...');
    const userShares = await getUserNFTShares(userAddress);
    console.log('Result:', userShares);
    
    // 2. Check getCollectionsWithUserShares
    console.log('\n🤝 2. Getting collections with user shares...');
    const collectionsWithShares = await getCollectionsWithUserShares(userAddress);
    console.log('Result:', collectionsWithShares);
    
    // 3. Check getAllFractionalizedNFTs
    console.log('\n🪙 3. Getting all fractionalized NFTs...');
    const allFractional = await getAllFractionalizedNFTs();
    console.log('Result:', allFractional);
    
    // 4. For each user share, get detailed info
    console.log('\n🔍 4. Detailed analysis of user shares...');
    for (let i = 0; i < userShares.length; i++) {
      const share = userShares[i];
      console.log(`\n--- NFT #${share.tokenId} Analysis ---`);
      console.log('Basic info:', {
        tokenId: share.tokenId,
        userShares: share.userShares,
        totalShares: share.totalShares,
        sharePercentage: share.sharePercentage,
        isOwner: share.isOwner,
        fractionalContract: share.fractionalContract
      });
      
      try {
        // Get fractional NFT info
        const fractionalInfo = await getFractionalNFTInfo(share.fractionalContract);
        console.log('Fractional info:', fractionalInfo);
        
        // Get extended info
        const extendedInfo = await getExtendedNFTInfo(share.fractionalContract);
        console.log('Extended info:', extendedInfo);
        
        // Get shareholders
        const shareholders = await getNFTShareHolders(share.fractionalContract);
        console.log('Shareholders:', shareholders);
        
        // Check if user should own the NFT
        const ownsAllShares = share.userShares === share.totalShares;
        console.log('Analysis:', {
          ownsAllShares,
          shouldHaveNFT: ownsAllShares,
          actualOwner: extendedInfo.currentOwner,
          userIsActualOwner: extendedInfo.currentOwner.toLowerCase() === userAddress.toLowerCase()
        });
        
      } catch (error) {
        console.error('Error getting detailed info for NFT', share.tokenId, ':', error);
      }
    }
    
    console.log('\n✅ DEBUG: Analysis complete');
    console.log('═══════════════════════════════════════════════════════════');
    
    return {
      userShares,
      collectionsWithShares,
      allFractional,
      summary: {
        totalUserShares: userShares.length,
        totalCollectionsWithShares: collectionsWithShares.length,
        totalFractionalizedNFTs: allFractional.length
      }
    };
    
  } catch (error) {
    console.error('❌ DEBUG: Error during analysis:', error);
    throw error;
  }
}

/**
 * Export debug functions to window for easy access
 */
if (typeof window !== 'undefined') {
  (window as any).debugUserShares = debugUserShares;
  console.log('🔧 Debug utility loaded! Use: window.debugUserShares("your-wallet-address")');
} 