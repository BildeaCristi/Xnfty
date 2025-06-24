'use client';

import { DASHBOARD_LABELS, type DashboardTab } from '@/utils/constants/dashboard';

interface CollectionTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  sharesCount: number;
  ownedCount: number;
  isGuest?: boolean;
}

export default function CollectionTabs({
  activeTab,
  onTabChange,
  sharesCount,
  ownedCount,
  isGuest = false
}: CollectionTabsProps) {
  const allTabs = [
    { id: 'all' as const, label: DASHBOARD_LABELS.ALL_COLLECTIONS, count: null },
    { id: 'owned' as const, label: DASHBOARD_LABELS.OWNED, count: ownedCount },
    { id: 'shares' as const, label: DASHBOARD_LABELS.YOUR_SHARES, count: sharesCount }
  ];

  const tabs = isGuest ? allTabs.filter(tab => tab.id === 'all') : allTabs;

  return (
    <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-white/20 text-white'
              : 'text-blue-200 hover:text-white'
          }`}
        >
          {tab.label}
          {tab.count !== null && tab.count > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
} 