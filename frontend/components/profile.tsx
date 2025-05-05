"use client";

import Image from "next/image";
import { Session } from "next-auth";
import { useEffect, useState } from "react";
import { web3auth, decodeToken } from "@/lib/web3auth";
import SignOut from "@/components/auth/buttons/signout-button";
import Loading from "@/components/loading";
import { handleSignOut } from "@/actions";

type UserInfoProps = {
    session: Session | null;
};

export default function UserInfo({ session }: UserInfoProps) {
    const [provider, setProvider] = useState<any>(null);
    const [publicAddress, setPublicAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                if (session?.walletAddress) {
                    setPublicAddress(session.walletAddress);
                } else if (session?.idToken) {
                    if (web3auth.status === "not_ready") {
                        await web3auth.init();
                    }

                    if (web3auth.status === "connected") {
                        const provider = web3auth.provider;
                        setProvider(provider);
                        const accounts = await provider?.request({ method: "eth_accounts" });
                        if (accounts && (accounts as any).length > 0) {
                            setPublicAddress((accounts as any)[0]);
                        }
                    } else {
                        const { payload } = decodeToken(session.idToken);
                        const provider = await web3auth.connect({
                            verifier: "Xnfty",
                            verifierId: (payload as any).email,
                            idToken: session.idToken,
                        });
                        setProvider(provider);

                        const accounts = await provider?.request({ method: "eth_accounts" });
                        if (accounts && (accounts as any).length > 0) {
                            setPublicAddress((accounts as any)[0]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error initializing & connecting:", error);
                setProvider(null);
                setPublicAddress(null);
                await handleSignOut();
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            init();
        }
    }, [session]);

    if (!session) return null;

    return (
        <div className="bg-white dark:bg-zinc-800/30 shadow-lg rounded-lg p-8 max-w-md w-full mx-auto mt-10">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loading />
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-4">
                    {session.user?.image && (
                        <Image
                            src={session.user.image}
                            alt="Profile picture"
                            width={140}
                            height={140}
                            className="rounded-full border-4 border-blue-500"
                            priority
                        />
                    )}
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {session.user?.name}
                    </h2>
                    {session.user?.email && (
                        <p className="text-gray-600 dark:text-gray-300 text-center">{session.user.email}</p>
                    )}
                    {publicAddress && (
                        <p className="text-gray-600 dark:text-gray-300 text-center break-all">
                            Wallet: {publicAddress}
                        </p>
                    )}
                    <SignOut />
                </div>
            )
            }
        </div>
    );
}