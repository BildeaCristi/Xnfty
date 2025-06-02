"use client";

import React, { useState } from 'react';
import { useIPFSImage } from '@/hooks/useIPFSImage';

// Test URLs in different formats
const TEST_URLS = [
  {
    name: 'Pinata Cloud URL',
    url: 'https://blue-random-raven-153.mypinata.cloud/ipfs/QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js',
    expectedCID: 'QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js'
  },
  {
    name: 'IPFS Protocol URL',
    url: 'ipfs://QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js',
    expectedCID: 'QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js'
  },
  {
    name: 'Standard Gateway URL',
    url: 'https://ipfs.io/ipfs/QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js',
    expectedCID: 'QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js'
  },
  {
    name: 'Direct CID',
    url: 'QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js',
    expectedCID: 'QmXLrtLsDygk6jys8FMjufp3T9CGRo25NvM8A2Q51pe2js'
  }
];

interface IPFSTestItemProps {
  testUrl: {
    name: string;
    url: string;
    expectedCID: string;
  };
}

function IPFSTestItem({ testUrl }: IPFSTestItemProps) {
  const { texture, loading, error, progress, originalUrl, resolvedUrl } = useIPFSImage(testUrl.url, {
    quality: 'medium',
    maxRetries: 1,
    timeout: 10000,
  });

  const getStatusColor = () => {
    if (loading) return 'text-yellow-400';
    if (error) return 'text-red-400';
    if (texture) return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (loading) return `Loading... ${progress}%`;
    if (error) return `Error: ${error.substring(0, 50)}${error.length > 50 ? '...' : ''}`;
    if (texture) return 'Success';
    return 'Idle';
  };

  return (
    <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
      <h3 className="text-white font-medium mb-2">{testUrl.name}</h3>
      
      {/* Original URL */}
      <div className="mb-2">
        <span className="text-gray-400 text-sm">Original URL:</span>
        <div className="text-xs text-blue-300 break-all font-mono">
          {testUrl.url}
        </div>
      </div>

      {/* Expected CID */}
      <div className="mb-2">
        <span className="text-gray-400 text-sm">Expected CID:</span>
        <div className="text-xs text-purple-300 font-mono">
          {testUrl.expectedCID}
        </div>
      </div>

      {/* Resolved URL */}
      {resolvedUrl && (
        <div className="mb-2">
          <span className="text-gray-400 text-sm">Resolved URL:</span>
          <div className="text-xs text-green-300 break-all font-mono">
            {resolvedUrl}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mb-2">
        <span className="text-gray-400 text-sm">Status:</span>
        <span className={`ml-2 text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-2">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Image Preview */}
      {texture && (
        <div className="mt-3">
          <div className="text-gray-400 text-sm mb-1">Preview:</div>
          <div className="w-32 h-32 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
            <div className="text-green-400 text-xs">✓ Texture Loaded</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IPFSTestComponent() {
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">IPFS Loading Test</h2>
          <div className="text-sm text-gray-400">
            Testing new IPFS image loading system
          </div>
        </div>

        {/* Custom URL Test */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <h3 className="text-white font-medium mb-3">Custom URL Test</h3>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Enter IPFS URL to test..."
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm"
            />
            <button
              onClick={() => setSelectedUrl(customUrl)}
              disabled={!customUrl}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Test
            </button>
          </div>
          {selectedUrl && (
            <IPFSTestItem 
              testUrl={{
                name: 'Custom URL',
                url: selectedUrl,
                expectedCID: 'Unknown'
              }}
            />
          )}
        </div>

        {/* Predefined Tests */}
        <div>
          <h3 className="text-white font-medium mb-4">Predefined Tests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEST_URLS.map((testUrl, index) => (
              <IPFSTestItem key={index} testUrl={testUrl} />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">How it works:</h4>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Extracts CID from various IPFS URL formats</li>
            <li>• Tries multiple IPFS gateways with fallbacks</li>
            <li>• Supports Pinata cloud URLs, ipfs:// protocol, and standard gateways</li>
            <li>• Provides detailed progress and error reporting</li>
            <li>• Creates optimized Three.js textures for 3D rendering</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 