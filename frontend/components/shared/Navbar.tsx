'use client';

import React, { useState } from 'react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, User, Wallet, ChevronDown, AlertTriangle } from 'lucide-react';
import SearchComponent from '@/components/search/SearchComponent';
import type { Collection } from '@/types';
import { formatAddress } from '@/services/BlockchainService';
import { getUserStatus, getUserDisplayName, getUserDisplayType, canCreateCollections } from '@/utils/auth';
import { ROUTES } from '@/config/routes';

interface NavbarProps {
  session: Session;
  collections: Collection[];
  onCreateCollection: () => void;
}

export default function Navbar({ session, collections, onCreateCollection }: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();
  const walletAddress = session.walletAddress;
  const userStatus = getUserStatus(session);
  const displayName = getUserDisplayName(session);
  const displayType = getUserDisplayType(session);
  const canCreate = canCreateCollections(session);

  const handleLogout = () => {
    signOut({ callbackUrl: ROUTES.HOME });
  };

  const handleProfileClick = () => {
    router.push(ROUTES.PROFILE);
    setShowProfileMenu(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">X</span>
              </div>
              <span className="ml-2 text-xl font-bold text-white">nfty</span>
            </div>
          </div>

          {/* SearchComponent Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <SearchComponent
              collections={collections}
              placeholder="SearchComponent collections and NFTs..."
              maxResults={8}
              className="w-full"
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Create Collection Button */}
            {canCreate ? (
              <button
                onClick={onCreateCollection}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Collection</span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center space-x-2 bg-gray-600 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
                title="Connect wallet to create collections"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Collection</span>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-6 h-6 rounded-full border border-white/20"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    userStatus.isGuest 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {userStatus.isGuest ? (
                      <AlertTriangle className="w-3 h-3 text-white" />
                    ) : (
                      <User className="w-3 h-3 text-white" />
                    )}
                  </div>
                )}
                <span className="hidden md:inline text-sm">
                  {walletAddress ? formatAddress(walletAddress) : displayName}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      {session?.user?.image ? (
                        <img
                          src={session.user.image}
                          alt="Profile"
                          className="w-10 h-10 rounded-full border-2 border-white/20"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          userStatus.isGuest 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                          {userStatus.isGuest ? (
                            <AlertTriangle className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {session?.user?.name || displayName}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userStatus.isGuest 
                              ? 'bg-amber-900/50 text-amber-300' 
                              : 'bg-green-900/50 text-green-300'
                          }`}>
                            {displayType}
                          </span>
                          {walletAddress && (
                            <div className="flex items-center space-x-1 text-gray-400 text-sm">
                              <Wallet className="w-3 h-3" />
                              <span>{formatAddress(walletAddress)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded-lg transition-colors text-left mb-1"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile SearchComponent (hidden on desktop) */}
      <div className="lg:hidden px-4 pb-3">
        <SearchComponent
          collections={collections}
          placeholder="SearchComponent collections and NFTs..."
          maxResults={6}
          className="w-full"
        />
      </div>

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </nav>
  );
} 