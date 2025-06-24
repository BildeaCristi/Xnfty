"use client";

import { useProgress } from '@react-three/drei';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';
import { useEffect, useState } from 'react';
import {MUSEUM_THEMES} from "@/utils/constants/museumConstants";

// Enhanced floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            backgroundColor: `rgba(${Math.random() > 0.5 ? '59, 130, 246' : '139, 92, 246'}, ${0.2 + Math.random() * 0.3})`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

// Animated museum icon
function MuseumIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={`${className} animate-museum-icon`} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Building base */}
      <rect x="8" y="48" width="48" height="12" fill="currentColor" opacity="0.9" rx="1" />
      
      {/* Columns with subtle animation delays */}
      {[12, 20, 28, 36, 44, 52].map((x, i) => (
        <rect 
          key={i}
          x={x} 
          y="20" 
          width="4" 
          height="28" 
          fill="currentColor" 
          opacity={0.8 + (i * 0.03)}
          rx="0.5"
        />
      ))}
      
      {/* Roof with gradient effect */}
      <polygon points="32,4 8,20 56,20" fill="currentColor" opacity="0.95" />
      
      {/* Steps with depth */}
      <rect x="4" y="52" width="56" height="3" fill="currentColor" opacity="0.6" rx="1" />
      <rect x="2" y="56" width="60" height="3" fill="currentColor" opacity="0.4" rx="1" />
      
      {/* Decorative elements */}
      <circle cx="32" cy="12" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// Dynamic loading messages with more variety
function getLoadingMessage(progress: number) {
  if (progress < 10) return "Initializing museum architecture...";
  if (progress < 25) return "Loading NFT images from IPFS...";
  if (progress < 50) return "Processing NFT textures...";
  if (progress < 75) return "Preparing exhibition frames...";
  if (progress < 90) return "Setting up lighting and materials...";
  if (progress < 99) return "Finalizing museum experience...";
  return "Welcome to your museum!";
}

// Enhanced theme-based color schemes
function getThemeColors(themeName: string) {
  switch (themeName) {
    case MUSEUM_THEMES.CLASSIC:
      return {
        primary: 'from-amber-400 to-orange-500',
        secondary: 'from-yellow-400 to-amber-500',
        accent: 'text-amber-400',
        accentSecondary: 'text-orange-400',
        bg: 'from-amber-900/20 to-orange-900/20',
        glow: 'shadow-amber-500/30',
        particle: 'rgba(251, 191, 36, 0.4)',
      };
    case MUSEUM_THEMES.MODERN:
      return {
        primary: 'from-blue-400 to-cyan-500',
        secondary: 'from-indigo-400 to-blue-500',
        accent: 'text-blue-400',
        accentSecondary: 'text-cyan-400',
        bg: 'from-blue-900/20 to-cyan-900/20',
        glow: 'shadow-blue-500/30',
        particle: 'rgba(59, 130, 246, 0.4)',
      };
    case MUSEUM_THEMES.FUTURISTIC:
      return {
        primary: 'from-purple-400 to-pink-500',
        secondary: 'from-violet-400 to-purple-500',
        accent: 'text-purple-400',
        accentSecondary: 'text-pink-400',
        bg: 'from-purple-900/20 to-pink-900/20',
        glow: 'shadow-purple-500/30',
        particle: 'rgba(139, 92, 246, 0.4)',
      };
    case MUSEUM_THEMES.NATURE:
      return {
        primary: 'from-green-400 to-emerald-500',
        secondary: 'from-lime-400 to-green-500',
        accent: 'text-green-400',
        accentSecondary: 'text-emerald-400',
        bg: 'from-green-900/20 to-emerald-900/20',
        glow: 'shadow-green-500/30',
        particle: 'rgba(16, 185, 129, 0.4)',
      };
    default:
      return {
        primary: 'from-blue-400 to-purple-500',
        secondary: 'from-indigo-400 to-blue-500',
        accent: 'text-blue-400',
        accentSecondary: 'text-purple-400',
        bg: 'from-blue-900/20 to-purple-900/20',
        glow: 'shadow-blue-500/30',
        particle: 'rgba(59, 130, 246, 0.4)',
      };
  }
}

export default function MuseumLoadingScreen() {
  const { active, progress } = useProgress();
  const { themeName } = useMuseumStore();
  const { quality } = useSceneStore();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  // Loading tips that rotate
  const loadingTips = [
    "Use WASD keys to move around your museum",
    "Press ESC to access theme and quality settings",
    "Click on NFTs to view detailed information",
    "Use mouse wheel to zoom in and out",
    "Try different themes for unique experiences",
    "Higher quality settings provide better visuals"
  ];

  // Smooth progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.1) return progress;
        return prev + diff * 0.15; // Slightly faster animation
      });
    }, 16);

    return () => clearInterval(timer);
  }, [progress]);

  // Rotate tips
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 3000);

    return () => clearInterval(tipTimer);
  }, [loadingTips.length]);

  // Handle exit animation
  useEffect(() => {
    if (!active && displayProgress >= 99) {
      setIsExiting(true);
      setTimeout(() => setIsExiting(false), 1000);
    }
  }, [active, displayProgress]);

  // Don't render if not active and exit animation is complete
  if (!active && !isExiting) return null;

  const colors = getThemeColors(themeName);
  const message = getLoadingMessage(displayProgress);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 museum-loader-transition ${
      isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
    }`}>
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} animate-pulse`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      
      {/* Enhanced floating particles */}
      <FloatingParticles />
      
      {/* Main content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        
        {/* Animated museum icon with enhanced effects */}
        <div className="mb-8 relative">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto ${colors.accent} animate-glow`}>
            <MuseumIcon className="w-full h-full filter drop-shadow-2xl" />
          </div>
          
          {/* Enhanced rotating rings */}
          <div className="absolute inset-0 border-4 border-transparent rounded-full animate-spin [animation-duration:6s]">
            <div className={`absolute inset-0 border-t-4 border-l-4 bg-gradient-to-r ${colors.primary} rounded-full opacity-40`} />
          </div>
          
          <div className="absolute inset-2 border-2 border-transparent rounded-full animate-spin [animation-duration:4s] [animation-direction:reverse]">
            <div className={`absolute inset-0 border-r-2 border-b-2 bg-gradient-to-l ${colors.secondary} rounded-full opacity-30`} />
          </div>

          <div className="absolute inset-4 border border-transparent rounded-full animate-spin [animation-duration:8s]">
            <div className={`absolute inset-0 border-t border-r bg-gradient-to-br ${colors.primary} rounded-full opacity-20`} />
          </div>
        </div>
        
        {/* Enhanced title */}
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6 tracking-tight museum-loader-title">
          <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent animate-pulse">
            Preparing Your
          </span>
          <br />
          <span className={`bg-gradient-to-r ${colors.primary} bg-clip-text text-transparent animate-glow`}>
            NFT Museum
          </span>
        </h1>
        
        {/* Dynamic loading message with animation */}
        <div className="h-8 mb-8">
          <p className={`text-lg sm:text-xl text-gray-300 font-medium transition-all duration-500 museum-loader-message ${colors.accentSecondary}`}>
            {message}
          </p>
        </div>
        
        {/* Enhanced progress bar */}
        <div className="w-full max-w-lg mx-auto mb-8">
          {/* Progress bar container */}
          <div className="relative h-4 bg-gray-800/80 rounded-full overflow-hidden shadow-inner backdrop-blur-sm border border-white/10">
            {/* Background glow */}
            <div className={`absolute inset-0 bg-gradient-to-r ${colors.primary} opacity-10 animate-pulse`} />
            
            {/* Progress fill with enhanced animation */}
            <div 
              className={`h-full bg-gradient-to-r ${colors.primary} relative transition-all duration-500 ease-out shadow-lg ${colors.glow} animate-progress-pulse`}
              style={{ width: `${Math.max(displayProgress, 3)}%` }}
            >
              {/* Enhanced shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              
              {/* Progress pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
            </div>
            
            {/* Enhanced progress indicator dot */}
            <div 
              className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white rounded-full ${colors.glow} transition-all duration-500 shadow-lg border-2 border-white/50`}
              style={{ left: `calc(${Math.max(displayProgress, 3)}% - 10px)` }}
            >
              <div className={`absolute inset-1 bg-gradient-to-r ${colors.primary} rounded-full animate-pulse`} />
            </div>
          </div>
          
          {/* Progress percentage and quality info */}
          <div className="flex justify-between items-center mt-4">
            <span className={`text-lg font-bold ${colors.accent}`}>
              {Math.round(displayProgress)}%
            </span>
            <span className={`text-sm font-medium ${colors.accentSecondary} uppercase tracking-wider`}>
              {quality} Quality
            </span>
          </div>
        </div>
        
        {/* Enhanced loading stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="p-4 bg-black/30 rounded-xl backdrop-blur-sm border border-white/10 museum-loader-transition hover:bg-black/40">
            <div className={`text-2xl sm:text-3xl font-bold ${colors.accent} mb-2 animate-pulse`}>
              {Math.min(Math.floor(displayProgress / 20) + 1, 5)}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 font-medium">Rooms Ready</div>
          </div>
          
          <div className="p-4 bg-black/30 rounded-xl backdrop-blur-sm border border-white/10 museum-loader-transition hover:bg-black/40">
            <div className={`text-2xl sm:text-3xl font-bold ${colors.accent} mb-2 animate-pulse`}>
              {Math.min(Math.floor(displayProgress / 8), 12)}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 font-medium">Assets Loaded</div>
          </div>
          
          <div className="p-4 bg-black/30 rounded-xl backdrop-blur-sm border border-white/10 museum-loader-transition hover:bg-black/40">
            <div className={`text-2xl sm:text-3xl font-bold ${colors.accent} mb-2 capitalize`}>
              {themeName}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 font-medium">Theme</div>
          </div>
        </div>
        
        {/* Enhanced rotating tip */}
        <div className="p-4 bg-black/20 rounded-xl backdrop-blur-sm border border-white/5 museum-loader-transition">
          <p className="text-sm text-gray-400 leading-relaxed transition-all duration-500">
            <span className="inline-block transition-all duration-500">
              {loadingTips[currentTip]}
            </span>
          </p>
        </div>
      </div>
      
      {/* Enhanced bottom decorative elements */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className={`h-px bg-gradient-to-r ${colors.primary} opacity-50`} />
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/20 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/20 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/20 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/20 rounded-br-lg" />
    </div>
  );
} 