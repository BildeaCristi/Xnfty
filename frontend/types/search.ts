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

export interface SearchComponentProps {
  collections: Collection[];
  onResultClick: (result: SearchResult) => void;
  placeholder?: string;
  maxResults?: number;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}

export interface SearchResultsProps {
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  isLoading?: boolean;
  query: string;
}

import type { Collection } from './blockchain'; 