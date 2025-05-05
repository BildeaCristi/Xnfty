"use client";

import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/single-factor-auth";

// Check if we're in the browser environment
const isBrowser = typeof window !== "undefined";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? "";
const rpcTarget = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL ?? "https://eth-sepolia.g.alchemy.com/v2/demo";

// Create a singleton instance
let web3authInstance: Web3Auth | null = null;

// Only initialize web3auth in the browser, not on the server
if (isBrowser) {
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7", // Sepolia testnet
    rpcTarget: rpcTarget,
    displayName: "Ethereum Sepolia Testnet",
    ticker: "ETH",
    tickerName: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  };

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
  });

  web3authInstance = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
  });
}

export const web3auth = web3authInstance;