"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ethers } from "ethers";
import { ROUTES } from "@/config/routes";

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGuestInput, setShowGuestInput] = useState(false);
    const [guestUsername, setGuestUsername] = useState("");

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

    const handleGuestSignIn = async () => {
        if (showGuestInput && !guestUsername.trim()) {
            setError("Please enter a username or just click 'Continue as Guest' without inputting a name");
            return;
        }

        try {
            setIsLoading(true);
            await signIn("guest-login", {
                username: guestUsername || "Guest User",
                callbackUrl: "/dashboard"
            });
        } catch (error) {
            setError("Failed to sign in as guest");
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

            {!showGuestInput ? (
                <>
                    <div className="relative group w-full">
                        <button
                            type="button"
                            disabled
                            aria-disabled="true"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl text-white
                            bg-gradient-to-r from-blue-500/70 via-blue-600/70 to-indigo-600/70
                            border border-blue-200/30 shadow-[0_10px_20px_rgba(37,99,235,0.25)]
                            backdrop-blur-sm opacity-70 cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                                <path
                                    fill="#FFC107"
                                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                                />
                                <path
                                    fill="#FF3D00"
                                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                                />
                                <path
                                    fill="#4CAF50"
                                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                                />
                                <path
                                    fill="#1976D2"
                                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                                />
                            </svg>
                            <span>Sign in with Google</span>
                        </button>
                        <div
                            className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                            role="tooltip"
                        >
                            Coming soon
                        </div>
                    </div>

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
                        onClick={() => setShowGuestInput(true)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        Guest Options
                    </button>
                </>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Choose a Guest Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={guestUsername}
                            onChange={(e) => setGuestUsername(e.target.value)}
                            placeholder="Enter username (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <button
                        onClick={handleGuestSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {isLoading ? "Entering..." : (guestUsername ? `Play as ${guestUsername}` : "Continue as Guest")}
                    </button>

                    <button
                        onClick={() => setShowGuestInput(false)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                        Back to Login Options
                    </button>
                </div>
            )}
        </div>
    );
}
