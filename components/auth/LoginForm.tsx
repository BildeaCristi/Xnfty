"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ethers } from "ethers";
import { ROUTES } from "@/config/routes";

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signIn("google", { callbackUrl: "/dashboard" });
        } catch (error) {
            setError("Failed to sign in with Google");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletSignIn = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!window.ethereum) {
                throw new Error("Please install MetaMask to use wallet authentication");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const message = `Sign this message to authenticate with Xnfty. Nonce: ${Date.now()}`;
            const signature = await signer.signMessage(message);

            const result = await signIn("wallet-connect", {
                message,
                signature,
                walletAddress: address,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            window.location.href = ROUTES.DASHBOARD as string;
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to sign in with wallet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {isLoading ? "Loading..." : "Sign in with Google"}
            </button>

            <button
                onClick={handleWalletSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
                {isLoading ? "Loading..." : "Sign in with Wallet"}
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue without account</span>
                </div>
            </div>

            <button
                onClick={() => signIn("guest-login", { callbackUrl: "/dashboard" })}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                Continue as Guest
            </button>
        </div>
    );
} 