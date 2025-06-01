import "./globals.css";
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import React from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotificationProvider } from "@/components/notifications/NotificationContext";
import WalletProvider from "@/components/providers/WalletProvider";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Xnfty",
    description: "Your NFT Platform",
};

export default function RootLayout({
   children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={inter.className}>
          <NotificationProvider>
            <WalletProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </WalletProvider>
          </NotificationProvider>
        </body>
        </html>
    );
}