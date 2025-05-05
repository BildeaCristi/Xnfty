"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function WalletSignIn() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleWalletConnect = async () => {
    setIsConnecting(true);

    try {
      if (!window.ethereum) {
        alert("Please install MetaMask to connect your wallet");
        setIsConnecting(false);
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const walletAddress = (accounts as string[])[0];
      const message = `Sign this message to verify you own this wallet: ${new Date().toISOString()}`;

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, walletAddress],
      });

      await signIn("wallet-connect", {
        message,
        signature,
        walletAddress,
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <button
      onClick={handleWalletConnect}
      disabled={isConnecting}
      className="flex items-center justify-center gap-2 w-full md:w-auto
        bg-gradient-to-r from-purple-500/80 to-purple-700/80 hover:from-purple-400/80 hover:to-purple-800/80
        text-white font-medium p-3 px-6 rounded-lg text-lg transition-all duration-300 backdrop-blur-sm
        border border-purple-400/30 shadow-[0_0_10px_rgba(147,51,234,0.3)] hover:shadow-[0_0_15px_rgba(147,51,234,0.5)]
        hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <img
            src="https://cdn.iconscout.com/icon/free/png-256/metamask-2728406-2261817.png"
            alt="MetaMask"
            className="w-6 h-6"
          />
          Connect Wallet
        </>
      )}
    </button>
  );
}