'use client';

import {useEffect, useState} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {Share2, TrendingUp, User, Wallet} from 'lucide-react';
import DashboardBackground from '@/components/dashboard/DashboardBackground';
import GlassPanel from '@/components/dashboard/GlassPanel';
import UserSharesSummary from '@/components/dashboard/UserSharesSummary';
import Navbar from '@/components/shared/Navbar';
import type {Collection, UserNFTShare} from '@/types';
import {formatAddress as formatAddr, getAllCollections, getUserNFTShares} from '@/services/BlockchainService';
import {ROUTES} from "@/config/routes";

export default function ProfilePage() {
    const {data: session, status} = useSession();
    const router = useRouter();
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [userNFTShares, setUserNFTShares] = useState<UserNFTShare[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const walletAddress = session?.walletAddress;

    useEffect(() => {
        if (status === 'loading') return;
        if (session) {
            loadProfileData();
        }
    }, [session, status, walletAddress]);

    const loadProfileData = async () => {
        try {
            setIsLoading(true);

            const collections = await getAllCollections();
            setAllCollections(collections);

            if (walletAddress) {
                const nftShares = await getUserNFTShares(walletAddress);
                setUserNFTShares(nftShares);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatAddress = (address: string) => {
        return formatAddr(address);
    };

    if (status === 'loading') {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white mt-4">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <DashboardBackground/>

            {/* Navbar */}
            <Navbar
                session={session!}
                collections={allCollections}
                onCreateCollection={() => {
                }}
            />

            {/* Main Content */}
            <div className="relative z-10 pt-20 p-6">
                {/* Profile Header */}
                <GlassPanel className="p-6 mb-8">
                    <div className="flex items-center space-x-6">
                        <div
                            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-10 h-10 text-white"/>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                            {walletAddress && (
                                <div className="flex items-center space-x-2 text-blue-200">
                                    <Wallet className="w-4 h-4"/>
                                    <span className="text-lg">{formatAddress(walletAddress)}</span>
                                </div>
                            )}
                            {session?.user?.email && (
                                <p className="text-blue-300 mt-1">{session.user.email}</p>
                            )}
                        </div>
                    </div>
                </GlassPanel>

                {/* Profile Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <GlassPanel className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Share2 className="w-6 h-6 text-blue-400"/>
                            </div>
                            <div>
                                <p className="text-blue-300 text-sm">NFT Shares Owned</p>
                                <p className="text-white text-2xl font-bold">{userNFTShares.length}</p>
                            </div>
                        </div>
                    </GlassPanel>

                    <GlassPanel className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-400"/>
                            </div>
                            <div>
                                <p className="text-purple-300 text-sm">Total Share Value</p>
                                <p className="text-white text-2xl font-bold">
                                    {userNFTShares.reduce((sum, share) => sum + share.userShares, 0)}
                                </p>
                            </div>
                        </div>
                    </GlassPanel>

                    <GlassPanel className="p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-green-400"/>
                            </div>
                            <div>
                                <p className="text-green-300 text-sm">Collections Involved</p>
                                <p className="text-white text-2xl font-bold">
                                    {new Set(userNFTShares.map(share => share.collectionId)).size}
                                </p>
                            </div>
                        </div>
                    </GlassPanel>
                </div>

                {/* NFT Shares Summary */}
                {walletAddress && userNFTShares.length > 0 ? (
                    <GlassPanel className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Your NFT Shares</h2>
                            <p className="text-blue-200">
                                Overview of all your fractional NFT ownership across different collections
                            </p>
                        </div>
                        <UserSharesSummary userNFTShares={userNFTShares}/>
                    </GlassPanel>
                ) : (
                    <GlassPanel className="p-6">
                        <div className="text-center py-12">
                            <div
                                className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Share2 className="w-8 h-8 text-blue-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No NFT Shares Yet</h3>
                            <p className="text-blue-200 mb-6">
                                You haven't acquired any fractional NFT shares yet. Start exploring collections to find
                                NFTs you'd like to own shares in.
                            </p>
                            <button
                                onClick={() => router.push(ROUTES.DASHBOARD)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                            >
                                Explore Collections
                            </button>
                        </div>
                    </GlassPanel>
                )}
            </div>
        </div>
    );
} 