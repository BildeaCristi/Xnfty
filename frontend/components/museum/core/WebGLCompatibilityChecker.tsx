"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Monitor, Smartphone, Settings } from 'lucide-react';

interface WebGLCapabilities {
  isSupported: boolean;
  version: '1' | '2' | null;
  maxTextureSize: number;
  maxVertexAttributes: number;
  maxRenderBufferSize: number;
  extensions: string[];
  isMobile: boolean;
  performanceRating: 'high' | 'medium' | 'low' | 'unsupported';
}

interface WebGLCompatibilityCheckerProps {
  children: React.ReactNode;
  onCapabilitiesDetected?: (capabilities: WebGLCapabilities) => void;
  fallback?: React.ReactNode;
}

export default function WebGLCompatibilityChecker({
  children,
  onCapabilitiesDetected,
  fallback,
}: WebGLCompatibilityCheckerProps) {
  const [capabilities, setCapabilities] = useState<WebGLCapabilities | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkWebGLCapabilities = (): WebGLCapabilities => {
      const canvas = document.createElement('canvas');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
      let version: '1' | '2' | null = null;

      // Try WebGL 2 first
      try {
        gl = canvas.getContext('webgl2');
        if (gl) version = '2';
      } catch (e) {
        // Fallback to WebGL 1
      }

      // Try WebGL 1 if WebGL 2 failed
      if (!gl) {
        try {
          gl = canvas.getContext('webgl') as WebGLRenderingContext || 
               canvas.getContext('experimental-webgl') as WebGLRenderingContext;
          if (gl) version = '1';
        } catch (e) {
          // WebGL not supported
        }
      }

      if (!gl) {
        return {
          isSupported: false,
          version: null,
          maxTextureSize: 0,
          maxVertexAttributes: 0,
          maxRenderBufferSize: 0,
          extensions: [],
          isMobile,
          performanceRating: 'unsupported',
        };
      }

      // Get capabilities
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      const maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      const extensions = gl.getSupportedExtensions() || [];

      // Determine performance rating
      let performanceRating: 'high' | 'medium' | 'low' = 'low';
      
      if (version === '2' && maxTextureSize >= 4096 && !isMobile) {
        performanceRating = 'high';
      } else if (maxTextureSize >= 2048 && maxVertexAttributes >= 16) {
        performanceRating = 'medium';
      }

      // Mobile devices get downgraded performance rating
      if (isMobile && performanceRating === 'high') {
        performanceRating = 'medium';
      }

      return {
        isSupported: true,
        version,
        maxTextureSize,
        maxVertexAttributes,
        maxRenderBufferSize,
        extensions,
        isMobile,
        performanceRating,
      };
    };

    const capabilities = checkWebGLCapabilities();
    setCapabilities(capabilities);
    setIsChecking(false);
    onCapabilitiesDetected?.(capabilities);
  }, [onCapabilitiesDetected]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Monitor className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Checking 3D capabilities...</p>
        </div>
      </div>
    );
  }

  if (!capabilities?.isSupported) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          
          <h2 className="text-2xl font-bold mb-4">3D Not Supported</h2>
          
          <p className="text-gray-400 mb-6">
            Your device doesn't support WebGL, which is required for the 3D museum experience.
          </p>

          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">System Requirements:</h3>
            <ul className="text-sm text-gray-400 space-y-2 text-left">
              <li>• Modern browser (Chrome, Firefox, Safari, Edge)</li>
              <li>• WebGL 1.0 support (WebGL 2.0 recommended)</li>
              <li>• Dedicated graphics card (recommended)</li>
              <li>• At least 2GB RAM</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
            
            <a
              href="/dashboard"
              className="block w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show performance warning for low-end devices
  if (capabilities.performanceRating === 'low') {
    return (
      <div className="relative">
        {children}
        
        <div className="fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            <span>Consider lowering graphics quality for better performance</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 