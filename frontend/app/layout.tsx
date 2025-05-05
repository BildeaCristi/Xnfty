import "./globals.css";
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import React from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";

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
          <AuthProvider>
            {children}
          </AuthProvider>
        </body>
        </html>
    );
}