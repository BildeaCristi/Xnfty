export type DashboardTab = 'all' | 'owned' | 'shares';

export const DASHBOARD_MESSAGES = {
  LOADING: 'Loading...',
  LOADING_COLLECTIONS: 'Loading collections...',
  NO_COLLECTIONS: 'No collections found.',
  NO_OWNED_COLLECTIONS: 'You haven\'t created any collections yet.',
  NO_SHARES: 'You don\'t own shares in any collections yet.',
} as const;

export const DASHBOARD_LABELS = {
  COLLECTIONS: 'Collections',
  ALL_COLLECTIONS: 'All Collections',
  OWNED: 'Owned',
  YOUR_SHARES: 'Your Shares',
  CREATE_FIRST_COLLECTION: 'Create Your First Collection',
  YOUR_COLLECTION: 'Your Collection',
  SHARED_OWNERSHIP: 'Shared Ownership',
  COLLECTION_OWNER: 'Collection Owner',
  OWNER: 'Owner',
  TOTAL_NFTS: 'Total NFTs',
  FRACTIONALIZED: 'Fractionalized',
} as const;

export const SHARE_STATUS = {
  COMPLETE_OWNERSHIP: 'You own some NFTs completely!',
  OWNERSHIP_TRANSFERRED: 'Some NFTs have transferred ownership',
} as const; 