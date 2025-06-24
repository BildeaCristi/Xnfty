"use client";

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
  error?: string | null;
  onRetry?: () => void;
  onSkip?: () => void;
}

export default function LoadingScreen({
  progress = 0,
  message = "Loading 3D Museum...",
  error = null,
  onRetry,
  onSkip,
}: LoadingScreenProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Loading Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Continue Anyway
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">NFT Museum</h1>
        <p className="text-gray-400 mb-8">{message}</p>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Progress</span>
            <span className="text-sm text-gray-300">{Math.round(animatedProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 