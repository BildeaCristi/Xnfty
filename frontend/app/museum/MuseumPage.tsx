"use client";

import {useState, useEffect} from 'react';
import dynamic from 'next/dynamic';
import {Collection, NFT} from '@/types/blockchain';
import {useMuseumStore} from '@/store/MuseumStore';
import {Settings} from 'lucide-react';

// Dynamically import heavy 3D components
const Museum3DScene = dynamic(
    () => import('@/components/museum/Museum3DScene'),
    {
        ssr: false,
        loading: () => <MuseumLoadingFallback/>
    }
);

const SettingsPanel = dynamic(
    () => import('@/components/museum/SettingsPanel'),
    {ssr: false}
);

interface MuseumPageProps {
    collection: Collection;
    nfts: NFT[];
    userAddress?: string;
}

export default function MuseumPage({
                                       collection,
                                       nfts,
                                       userAddress
                                   }: MuseumPageProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const {showThemeSelector, setShowThemeSelector} = useMuseumStore();

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (settingsOpen) {
                    setSettingsOpen(false);
                } else {
                    setSettingsOpen(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [settingsOpen]);

    useEffect(() => {
        const hasVisited = localStorage.getItem('museum-visited');
        if (!hasVisited && showThemeSelector) {
            setTimeout(() => {
                setShowThemeSelector(false);
                localStorage.setItem('museum-visited', 'true');
            }, 5000);
        }
    }, [showThemeSelector, setShowThemeSelector]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gray-900">
            {/* Main 3D Scene */}
            <Museum3DScene
                collection={collection}
                nfts={nfts}
                userAddress={userAddress}
            />

            {/* Settings Button (visible when panel is closed) */}
            {!settingsOpen && (
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm
                     text-white p-3 rounded-lg hover:bg-gray-700/80 
                     transition-all group"
                    title="Open Settings (ESC)"
                >
                    <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform"/>
                </button>
            )}

            {/* Settings Panel */}
            <SettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />

            {/* Performance Warning */}
            <PerformanceWarning/>
        </div>
    );
}

function MuseumLoadingFallback() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <div className="mb-8 relative w-24 h-24 mx-auto">
                    <div
                        className="absolute inset-0 border-4 border-blue-500/30 rounded-lg animate-spin [animation-duration:3s]"></div>
                    <div
                        className="absolute inset-2 border-4 border-purple-500/30 rounded-lg animate-spin [animation-duration:3s] [animation-direction:reverse]"></div>
                    <div
                        className="absolute inset-4 border-4 border-blue-400/30 rounded-lg animate-spin [animation-duration:3s]"></div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Preparing Your Museum</h2>
                <p className="text-gray-400">Loading 3D assets...</p>
            </div>
        </div>
    );
}

function PerformanceWarning() {
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        // Check if device might have performance issues
        const checkPerformance = () => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
            const hasManyTabs = (performance as any).memory?.usedJSHeapSize > 500000000; // 500MB

            if (isMobile || hasLowMemory || hasManyTabs) {
                setShowWarning(true);
            }
        };

        checkPerformance();
    }, []);

    if (!showWarning) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-md">
            <div className="bg-yellow-500/10 border border-yellow-500/50 backdrop-blur-sm
                      rounded-lg px-4 py-3 text-sm text-yellow-200">
                <p className="font-medium mb-1">Performance Notice</p>
                <p className="text-xs opacity-90">
                    For the best experience, we recommend using a desktop computer with a dedicated graphics card.
                    You can adjust quality settings using the settings panel.
                </p>
                <button
                    onClick={() => setShowWarning(false)}
                    className="mt-2 text-xs underline hover:no-underline"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}