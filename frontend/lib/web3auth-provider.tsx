"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { web3AuthContextConfig } from "./web3auth-context";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

// Create wagmi config
const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

// Create query client
const queryClient = new QueryClient();

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: any;
  userInfo: any;
  isConnected: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
  getAccounts: () => Promise<string[]>;
  getBalance: () => Promise<string>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  userInfo: null,
  isConnected: false,
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => null,
  getAccounts: async () => [],
  getBalance: async () => "0",
});

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error("useWeb3Auth must be used within Web3AuthProvider");
  }
  return context;
};

interface Web3AuthProviderProps {
  children: React.ReactNode;
}

export const Web3AuthProvider: React.FC<Web3AuthProviderProps> = ({ children }) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const web3authInstance = new Web3Auth(web3AuthContextConfig.web3AuthOptions);
        setWeb3auth(web3authInstance);
        await web3authInstance.initModal();
        
        if (web3authInstance.connected) {
          setProvider(web3authInstance.provider);
          setIsConnected(true);
          const user = await web3authInstance.getUserInfo();
          setUserInfo(user);
        }
      } catch (error) {
        console.error("Web3Auth initialization error:", error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      console.log("Web3Auth not initialized");
      return;
    }

    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setIsConnected(true);
      
      if (web3auth.connected) {
        const user = await web3auth.getUserInfo();
        setUserInfo(user);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      console.log("Web3Auth not initialized");
      return;
    }

    try {
      await web3auth.logout();
      setProvider(null);
      setUserInfo(null);
      setIsConnected(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserInfo = async () => {
    if (web3auth && web3auth.connected) {
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      return user;
    }
    return null;
  };

  const getAccounts = async () => {
    if (!provider) {
      return [];
    }

    try {
      const accounts = await provider.request({
        method: "eth_accounts",
      });
      return accounts;
    } catch (error) {
      console.error("Get accounts error:", error);
      return [];
    }
  };

  const getBalance = async () => {
    if (!provider) {
      return "0";
    }

    try {
      const accounts = await getAccounts();
      if (accounts.length === 0) return "0";

      const balance = await provider.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });
      
      // Convert from wei to ether
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth.toString();
    } catch (error) {
      console.error("Get balance error:", error);
      return "0";
    }
  };

  const contextValue: Web3AuthContextType = {
    web3auth,
    provider,
    userInfo,
    isConnected,
    login,
    logout,
    getUserInfo,
    getAccounts,
    getBalance,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <Web3AuthContext.Provider value={contextValue}>
          {children}
        </Web3AuthContext.Provider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}; 