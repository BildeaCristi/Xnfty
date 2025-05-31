import type { Collection, NFT, SearchResult } from '@/types';
import { getCollectionNFTs } from './blockchain';

/**
 * Search through collections and their NFTs
 */
export class SearchEngine {
  private collections: Collection[] = [];
  private nftsCache: Map<number, NFT[]> = new Map();

  constructor(collections: Collection[] = []) {
    this.collections = collections;
  }

  updateCollections(collections: Collection[]) {
    this.collections = collections;
    // Clear cache when collections update
    this.nftsCache.clear();
  }

  /**
   * Load NFTs for a collection if not already cached
   */
  private async loadCollectionNFTs(collection: Collection): Promise<NFT[]> {
    if (this.nftsCache.has(collection.collectionId)) {
      return this.nftsCache.get(collection.collectionId)!;
    }

    try {
      const nfts = await getCollectionNFTs(collection.collectionAddress);
      this.nftsCache.set(collection.collectionId, nfts);
      return nfts;
    } catch (error) {
      console.error(`Failed to load NFTs for collection ${collection.collectionId}:`, error);
      return [];
    }
  }

  /**
   * Search collections by name or description
   */
  private searchCollections(query: string): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    return this.collections
      .filter(collection => {
        const name = (collection.name || '').toLowerCase();
        const description = (collection.description || '').toLowerCase();
        const symbol = (collection.symbol || '').toLowerCase();
        
        return name.includes(normalizedQuery) || 
               description.includes(normalizedQuery) ||
               symbol.includes(normalizedQuery);
      })
      .map(collection => ({
        id: `collection-${collection.collectionId}`,
        type: 'collection' as const,
        title: collection.name || 'Untitled Collection',
        subtitle: `Collection • ${collection.symbol || 'N/A'}`,
        imageUrl: collection.imageURI || '/placeholder-collection.png',
        collectionId: collection.collectionId,
        collectionAddress: collection.collectionAddress,
        description: collection.description || ''
      }))
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.title.toLowerCase() === normalizedQuery;
        const bExact = b.title.toLowerCase() === normalizedQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then prioritize starts with
        const aStartsWith = a.title.toLowerCase().startsWith(normalizedQuery);
        const bStartsWith = b.title.toLowerCase().startsWith(normalizedQuery);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Finally alphabetical
        return a.title.localeCompare(b.title);
      });
  }

  /**
   * Search NFTs across all collections
   */
  private async searchNFTs(query: string): Promise<SearchResult[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const allResults: SearchResult[] = [];

    // Search through all collections
    for (const collection of this.collections) {
      try {
        const nfts = await this.loadCollectionNFTs(collection);
        
        const matchingNFTs = nfts
          .filter(nft => {
            const name = (nft.name || '').toLowerCase();
            const description = nft.description?.toLowerCase() || '';
            const tokenId = nft.tokenId.toString();
            
            return name.includes(normalizedQuery) || 
                   description.includes(normalizedQuery) ||
                   tokenId.includes(normalizedQuery);
          })
          .map(nft => ({
            id: `nft-${collection.collectionId}-${nft.tokenId}`,
            type: 'nft' as const,
            title: nft.name || `NFT #${nft.tokenId}`,
            subtitle: `NFT #${nft.tokenId} • ${collection.name || 'Unknown Collection'}`,
            imageUrl: nft.imageURI || '/placeholder-nft.png',
            collectionId: collection.collectionId,
            tokenId: nft.tokenId,
            collectionAddress: collection.collectionAddress,
            description: nft.description || ''
          }));

        allResults.push(...matchingNFTs);
      } catch (error) {
        console.error(`Error searching NFTs in collection ${collection.collectionId}:`, error);
      }
    }

    return allResults.sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.title.toLowerCase() === normalizedQuery;
      const bExact = b.title.toLowerCase() === normalizedQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then prioritize starts with
      const aStartsWith = a.title.toLowerCase().startsWith(normalizedQuery);
      const bStartsWith = b.title.toLowerCase().startsWith(normalizedQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Finally alphabetical
      return a.title.localeCompare(b.title);
    });
  }

  /**
   * Main search function that searches both collections and NFTs
   */
  async search(query: string, options: {
    type?: 'all' | 'collections' | 'nfts';
    maxResults?: number;
  } = {}): Promise<SearchResult[]> {
    const { type = 'all', maxResults = 10 } = options;
    
    if (!query.trim()) return [];

    let results: SearchResult[] = [];

    if (type === 'all' || type === 'collections') {
      const collectionResults = this.searchCollections(query);
      results.push(...collectionResults);
    }

    if (type === 'all' || type === 'nfts') {
      const nftResults = await this.searchNFTs(query);
      results.push(...nftResults);
    }

    // Remove duplicates and limit results
    const uniqueResults = results.filter((result, index, arr) => 
      arr.findIndex(r => r.id === result.id) === index
    );

    return uniqueResults.slice(0, maxResults);
  }

  /**
   * Get suggestions based on partial input
   */
  getSuggestions(query: string, limit: number = 5): string[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const suggestions = new Set<string>();

    // Add collection names
    this.collections.forEach(collection => {
      const name = collection.name || '';
      const symbol = collection.symbol || '';
      
      if (name.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(name);
      }
      if (symbol.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(symbol);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

/**
 * Utility function to highlight search terms in text
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>');
}

/**
 * Utility function to truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
} 