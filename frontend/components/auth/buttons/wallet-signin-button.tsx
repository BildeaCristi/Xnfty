"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useNotifications } from "@/components/notifications/NotificationContext";

export default function WalletSignInButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { showError, showInfo } = useNotifications();

  const handleWalletSignIn = async () => {
    if (!window.ethereum) {
      showError("MetaMask Required", "Please install MetaMask to connect your wallet");
      return;
    }

    setIsConnecting(true);
    try {
      const result = await signIn("ethereum", { redirect: false });
      if (result?.error) {
        console.error("Sign in error:", result.error);
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <button
      onClick={handleWalletSignIn}
      disabled={isConnecting}
      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Connecting...
        </>
      ) : (
        "Connect Wallet"
      )}
    </button>
  );
}