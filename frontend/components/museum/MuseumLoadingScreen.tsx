"use client";

import { useProgress } from '@react-three/drei';

export default function MuseumLoadingScreen() {
  const { active, progress } = useProgress();
  
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900">
      <div className="text-center">
        {/* 3D Cube Animation */}
        <div className="mb-8 relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-blue-500/30 rounded-lg animate-spin [animation-duration:3s]"></div>
          <div className="absolute inset-2 border-4 border-purple-500/30 rounded-lg animate-spin [animation-duration:3s] [animation-direction:reverse]"></div>
          <div className="absolute inset-4 border-4 border-blue-400/30 rounded-lg animate-spin [animation-duration:3s]"></div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-white mb-2">Preparing Your Museum</h2>
        <p className="text-gray-400 mb-6">Loading {Math.round(progress)}%</p>
        
        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading Tips */}
        <div className="mt-8 text-sm text-gray-500">
          {progress < 33 && "Setting up the exhibition space..."}
          {progress >= 33 && progress < 66 && "Hanging your NFTs on the walls..."}
          {progress >= 66 && "Adjusting the lighting..."}
        </div>
      </div>
    </div>
  );
} 