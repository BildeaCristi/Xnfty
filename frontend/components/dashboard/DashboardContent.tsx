"use client";

import { signOut } from "next-auth/react";
import { User } from "next-auth";
import { useState } from "react";
import { Search, LogOut } from "lucide-react";
import GlassPanel from "./GlassPanel";
import DashboardBackground from "./DashboardBackground";
import { CreateCollectionButton } from "@/components/deploy";

interface DashboardContentProps {
    user: User;
}

export default function DashboardContent({ user }: DashboardContentProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // NFT collections placeholder - in a real app, this would come from API
    const collections = [
        {
            id: 1,
            name: "Crystal Gems",
            imageUrl: "https://via.placeholder.com/150/00ffff/ffffff",
            items: 8,
        },
        {
            id: 2,
            name: "Neon Warriors",
            imageUrl: "https://via.placeholder.com/150/ff00ff/ffffff",
            items: 12,
        },
        {
            id: 3,
            name: "Digital Dreams",
            imageUrl: "https://via.placeholder.com/150/00ff8f/ffffff",
            items: 5,
        },
    ];

    return (
        <>
            <DashboardBackground />
            
            <div className="min-h-screen text-white">
                <div className="container mx-auto px-4 py-4">
                    {/* Header Section */}
                    <header className="mb-6 flex justify-between items-center">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
                            Xnfty
                        </h1>
                        
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-cyan-300">
                                {user?.walletAddress && (
                                    <span>
                                        {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                                    </span>
                                )}
                            </p>
                            
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="bg-transparent hover:bg-red-900/20 p-2 rounded-full transition-colors"
                                aria-label="Sign Out"
                            >
                                <LogOut className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    </header>
                    
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-12 gap-4">
                        {/* Left Sidebar */}
                        <div className="col-span-3">
                            <GlassPanel className="p-4 mb-4">
                                <div className="text-center mb-3">
                                    <div className="w-14 h-14 mx-auto bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
                                        {user?.name?.[0] || "U"}
                                    </div>
                                    <h2 className="mt-2 text-lg font-medium">{user?.name || "User"}</h2>
                                </div>
                            </GlassPanel>
                            
                            <GlassPanel className="p-3">
                                <h3 className="text-base mb-3 font-medium text-purple-200">Quick Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Collections</span>
                                        <span className="font-medium text-cyan-300">{collections.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Total NFTs</span>
                                        <span className="font-medium text-cyan-300">
                                            {collections.reduce((sum, col) => sum + col.items, 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Wallet</span>
                                        <span className="font-medium text-cyan-300">Connected</span>
                                    </div>
                                </div>
                            </GlassPanel>
                        </div>
                        
                        {/* Main Content Area */}
                        <div className="col-span-9">
                            <GlassPanel className="p-3 mb-4">
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search collection"
                                        className="bg-black/20 text-white border border-cyan-500/20 rounded-lg py-1.5 pl-8 pr-4 w-full focus:outline-none focus:border-cyan-500/50 text-sm"
                                    />
                                </div>
                            </GlassPanel>
                            
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-medium text-purple-200">Your Collections</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {collections.map((collection) => (
                                    <GlassPanel key={collection.id} className="p-0 overflow-hidden">
                                        <div className="aspect-square overflow-hidden relative group">
                                            <img 
                                                src={collection.imageUrl} 
                                                alt={collection.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                                <div className="p-3 w-full">
                                                    <h3 className="text-base font-medium text-white">{collection.name}</h3>
                                                    <p className="text-cyan-300 text-xs">{collection.items} NFTs</p>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassPanel>
                                ))}
                                
                                {/* Create New Collection Card */}
                                <CreateCollectionButton variant="card" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 