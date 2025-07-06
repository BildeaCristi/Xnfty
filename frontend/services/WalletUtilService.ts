/**
 * Wallet connection utilities
 */
import { ethers } from 'ethers';

// Function to safely format an Ethereum address with proper checksum
export function formatAddress(address: string): string {
  try {
    // Convert to lowercase first to bypass checksum validation
    return ethers.getAddress(String(address).toLowerCase());
  } catch (error) {
    console.error("Error formatting address:", error);
    return address; // Return original if cannot format
  }
}

// Function to request wallet connection and return the connected address
export async function connectWallet(sessionWalletAddress?: string): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to connect your wallet.");
    }
    
    // Request connection to MetaMask
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect your MetaMask wallet.");
    }
    
    const connectedAddress = formatAddress(accounts[0] as string);
    
    // If a session wallet address is provided, verify it matches the connected wallet
    if (sessionWalletAddress) {
      const formattedSessionAddress = formatAddress(sessionWalletAddress);
      if (formattedSessionAddress.toLowerCase() !== connectedAddress.toLowerCase()) {
        throw new Error(
          "Connected wallet doesn't match your logged-in wallet. Please connect with the same wallet you used to login."
        );
      }
    }
    
    return connectedAddress;
  } catch (error: any) {
    console.error("Wallet connection error:", error);
    throw error;
  }
}

// Function to check if the current metamask wallet matches the session wallet
export async function verifyWalletConnection(sessionWalletAddress?: string): Promise<boolean> {
  try {
    if (!sessionWalletAddress) return false;
    if (typeof window === 'undefined' || !window.ethereum) return false;
    
    // Get current accounts without prompting
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    
    if (!accounts || accounts.length === 0) return false;
    
    const connectedAddress = formatAddress(accounts[0] as string);
    const formattedSessionAddress = formatAddress(sessionWalletAddress);
    return formattedSessionAddress.toLowerCase() === connectedAddress.toLowerCase();
  } catch (error) {
    console.error("Wallet verification error:", error);
    return false;
  }
}

// Listen for account changes in MetaMask
export function setupWalletListeners(callback: (accounts: string[]) => void): () => void {
  if (typeof window === 'undefined' || !window.ethereum) return () => {};
  
  const handleAccountsChanged = (accounts: string[]) => {
    callback(accounts);
  };
  
  // Use proper event handling through request method
  const ethereum = window.ethereum as any; // Type assertion to access event methods
  
  if (ethereum && ethereum.on) {
    ethereum.on('accountsChanged', handleAccountsChanged);
    
    // Return cleanup function
    return () => {
      if (ethereum && ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }
  
  return () => {}; // Fallback empty cleanup function
} 