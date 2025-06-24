"use client";

import { AlertTriangle, Wallet } from 'lucide-react';
import { signIn, signOut } from 'next-auth/react';
import { ROUTES } from '@/config/routes';

interface GuestWarningProps {
  message: string;
  showConnectButton?: boolean;
  className?: string;
}

export default function GuestWarning({ 
  message, 
  showConnectButton = true, 
  className = '' 
}: GuestWarningProps) {
  const handleConnectWallet = async () => {
    await signOut({ redirect: false });
    signIn('wallet-connect', { callbackUrl: ROUTES.DASHBOARD });
  };

  return (
    <div className={`bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-amber-200 text-sm">{message}</p>
          {showConnectButton && (
            <button
              onClick={handleConnectWallet}
              className="mt-3 flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 