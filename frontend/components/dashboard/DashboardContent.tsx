"use client";

import { signOut } from "next-auth/react";
import { User } from "next-auth";
import CollectionModalWrapper from "@/components/CollectionModalWrapper";

interface DashboardContentProps {
    user: User;
}

export default function DashboardContent({ user }: DashboardContentProps) {
    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Welcome, {user?.name || "User"}!
                            </h2>
                            {user?.walletAddress && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Wallet: {user.walletAddress}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Sign Out
                        </button>
                    </div>
                    
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Your Dashboard</h3>
                            <CollectionModalWrapper />
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Add your dashboard content here */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900">Feature 1</h4>
                                <p className="mt-1 text-sm text-gray-500">Description of feature 1</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900">Feature 2</h4>
                                <p className="mt-1 text-sm text-gray-500">Description of feature 2</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900">Feature 3</h4>
                                <p className="mt-1 text-sm text-gray-500">Description of feature 3</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 