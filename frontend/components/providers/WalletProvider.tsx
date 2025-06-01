"use client";

import { useWalletEvents } from "@/hooks/useWalletEvents";
import { ReactNode } from "react";

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  // Initialize wallet event listeners
  useWalletEvents();
  
  return <>{children}</>;
} 