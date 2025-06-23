"use client";

import { useWalletEvents } from "@/hooks/useWalletEvents";
import { ReactNode, useEffect, useState } from "react";

interface WalletProviderProps {
  children: ReactNode;
}

function ClientWalletEvents() {
  useWalletEvents();
  return null;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <>
      {isClient && <ClientWalletEvents />}
      {children}
    </>
  );
} 