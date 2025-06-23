export interface SearchResult {
  id: string;
  type: 'collection' | 'nft';
  title: string;
  subtitle: string;
  imageUrl: string;
  collectionId: number;
  tokenId?: number;
  collectionAddress?: string;
  description?: string;
}

export interface SearchFilters {
  type: 'all' | 'collections' | 'nfts';
  sortBy: 'relevance' | 'name' | 'recent';
}