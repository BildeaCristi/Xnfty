"use client";

import {useState} from "react";
import {ethers} from "ethers";
import {signIn} from "next-auth/react";
import {useNotifications} from "@/providers/NotificationContext";
import {useWalletStore} from "@/store/WalletStore";
import {MetaMaskLogo} from "@/components/shared/MetaMaskLogo";

export default function WalletLoginButton() {
    const [isConnecting, setIsConnecting] = useState(false);
    const {showError, showSuccess} = useNotifications();
    const {setWalletData} = useWalletStore();

    const handleWalletLogin = async () => {
        if (!window.ethereum) {
            showError("MetaMask Required", "Please install MetaMask to connect your wallet");
            window.open("https://metamask.io/download/", "_blank");
            return;
        }

        setIsConnecting(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = await provider.getSigner();
            const walletAddress = await signer.getAddress();

            const balance = await provider.getBalance(walletAddress);
            const network = await provider.getNetwork();

            setWalletData({
                isConnected: true,
                walletAddress,
                balance: ethers.formatEther(balance),
                chainId: Number(network.chainId),
            });

            const message = `Sign this message to authenticate with Xnfty\nTimestamp: ${Date.now()}`;
            const signature = await signer.signMessage(message);

            const result = await signIn("wallet-connect", {
                message,
                signature,
                walletAddress,
                redirect: false,
            });

            if (result?.error) {
                showError("Authentication Failed", result.error);
                setWalletData({
                    isConnected: false,
                    walletAddress: null,
                });
            } else if (result?.ok) {
                showSuccess("Success", "Wallet connected successfully!");
                window.location.href = "/dashboard";
            }
        } catch (error: any) {
            if (error.code === 4001) {
                showError("Connection Cancelled", "You rejected the connection request");
            } else {
                showError("Connection Failed", error.message || "Failed to connect wallet");
            }
            setWalletData({
                isConnected: false,
                walletAddress: null,
            });
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <button
            onClick={handleWalletLogin}
            disabled={isConnecting}
            className="flex items-center justify-center gap-3 w-full md:w-auto
              bg-gradient-to-r from-orange-500/80 to-orange-600/80 hover:from-orange-400/80 hover:to-orange-700/80
              text-white font-medium p-3 px-6 rounded-lg text-lg transition-all duration-300 backdrop-blur-sm
              border border-orange-400/30 shadow-[0_0_10px_rgba(251,146,60,0.3)] hover:shadow-[0_0_15px_rgba(251,146,60,0.5)]
              hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
            {isConnecting ? (
                <>
                    <svg
                        className="animate-spin h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span>Connecting...</span>
                </>
            ) : (<MetaMaskLogo/>
            )}
        </button>
    );
}