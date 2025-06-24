'use client';

import {useEffect, useState} from 'react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {Share2, TrendingUp, User, Wallet} from 'lucide-react';
import DashboardBackground from '@/components/dashboard/DashboardBackground';
import GlassPanel from '@/components/dashboard/GlassPanel';
import UserSharesSummary from '@/components/dashboard/UserSharesSummary';
import Navbar from '@/components/shared/Navbar';
import GuestWarning from '@/components/shared/GuestWarning';
import type {Collection, UserNFTShare} from '@/types';
import {formatAddress as formatAddr, getAllCollections, getUserNFTShares} from '@/services/BlockchainService';
import {getUserStatus, getUserDisplayName, getUserDisplayType} from '@/utils/auth';
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
        } finally {
            setIsLoading(false);
        }
    };

    const formatAddress = (address: string) => {
        return formatAddr(address);
    };

    const userStatus = getUserStatus(session);
    const displayName = getUserDisplayName(session);
    const displayType = getUserDisplayType(session);

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
                <GlassPanel className="p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        {/* Profile Image */}
                        <div className="relative">
                            {session?.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full border-4 border-white/20"
                                />
                            ) : (
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-white/20 ${
                                    userStatus.isGuest 
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                                }`}>
                                    <User className="w-12 h-12 text-white"/>
                                </div>
                            )}
                            {/* Status Indicator */}
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-gray-900 flex items-center justify-center ${
                                userStatus.isGuest 
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                            }`}>
                                {userStatus.isGuest ? (
                                    <span className="text-white text-xs font-bold">G</span>
                                ) : (
                                    <Wallet className="w-4 h-4 text-white"/>
                                )}
                            </div>
                        </div>

                        {/* Profile Information */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="mb-4">
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    {session?.user?.name || displayName}
                                </h1>
                                <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                        userStatus.isGuest 
                                            ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' 
                                            : 'bg-green-900/50 text-green-300 border border-green-500/30'
                                    }`}>
                                        {displayType}
                                    </span>
                                    {userStatus.isFullUser && (
                                        <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-500/30">
                                            Verified User
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-3">
                                {session?.user?.email && (
                                    <div className="flex items-center justify-center md:justify-start space-x-2 text-blue-200">
                                        <span className="text-sm opacity-70">Email:</span>
                                        <span className="text-sm font-medium">{session.user.email}</span>
                                    </div>
                                )}
                                {walletAddress && (
                                    <div className="flex items-center justify-center md:justify-start space-x-2 text-green-200">
                                        <Wallet className="w-4 h-4"/>
                                        <span className="text-sm opacity-70">Wallet:</span>
                                        <span className="text-sm font-mono font-medium">{formatAddress(walletAddress)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Join Date */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-sm text-gray-400">
                                    Member since {new Date().toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long' 
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassPanel>

                {/* Guest User Warning */}
                {userStatus.isGuest && (
                    <GuestWarning 
                        message="You're browsing as a guest. Connect your wallet to buy NFT shares, create collections, and track your ownership."
                        className="mb-8"
                    />
                )}

                {/* Profile Stats - Only show for full users */}
                {userStatus.isFullUser && (
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
                )}

                {/* NFT Shares Summary - Only for full users */}
                {userStatus.isFullUser ? (
                    userNFTShares.length > 0 ? (
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
                    )
                ) : (
                    <GlassPanel className="p-6">
                        <div className="text-center py-12">
                            <div
                                className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-amber-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Guest Profile</h3>
                            <p className="text-blue-200 mb-6">
                                You're browsing as a guest. Your profile shows limited information because you haven't connected a wallet yet.
                            </p>
                            <button
                                onClick={() => router.push(ROUTES.DASHBOARD)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors mr-4"
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