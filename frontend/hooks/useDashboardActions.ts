'use client';

import { useRouter } from 'next/navigation';
import { formatAddress as formatAddr } from '@/services/BlockchainService';
import { ROUTES } from '@/config/routes';

export function useDashboardActions() {
  const router = useRouter();

  const handleCreateSuccess = (collectionId: number) => {
    router.push(`${ROUTES.COLLECTIONS}/${collectionId}`);
  };

  const handleCollectionClick = (collectionId: number) => {
    router.push(`${ROUTES.COLLECTIONS}/${collectionId}`);
  };

  const formatAddress = (address: string) => {
    return formatAddr(address);
  };

  return {
    handleCreateSuccess,
    handleCollectionClick,
    formatAddress
  };
} 