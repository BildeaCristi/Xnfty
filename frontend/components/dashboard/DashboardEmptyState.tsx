'use client';

import { DASHBOARD_MESSAGES, DASHBOARD_LABELS, type DashboardTab } from '@/utils/constants/dashboard';

interface DashboardEmptyStateProps {
  activeTab: DashboardTab;
  onCreateCollection: () => void;
}

export default function DashboardEmptyState({ 
  activeTab, 
  onCreateCollection 
}: DashboardEmptyStateProps) {
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'all':
        return DASHBOARD_MESSAGES.NO_COLLECTIONS;
      case 'owned':
        return DASHBOARD_MESSAGES.NO_OWNED_COLLECTIONS;
      case 'shares':
        return DASHBOARD_MESSAGES.NO_SHARES;
      default:
        return DASHBOARD_MESSAGES.NO_COLLECTIONS;
    }
  };

  const showCreateButton = activeTab === 'shares' || activeTab === 'owned';

  return (
    <div className="text-center py-12">
      <p className="text-blue-200 mb-4">{getEmptyMessage()}</p>
      {showCreateButton && (
        <button
          onClick={onCreateCollection}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          {DASHBOARD_LABELS.CREATE_FIRST_COLLECTION}
        </button>
      )}
    </div>
  );
} 