import { useEffect, useState, useCallback, useRef } from 'react';
import { useSceneStore, QualityLevel } from '@/store/sceneStore';

interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memory: number;
}

export default function PerformanceMonitor() {
  const { quality, setQuality, updatePerformanceMetrics } = useSceneStore();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    avgFps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
  });
  
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const lastAdjustTimeRef = useRef(0);
  const isMountedRef = useRef(false);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  
  // Auto-adjust quality based on FPS
  const autoAdjustQuality = useCallback((avgFps: number) => {
    const currentTime = Date.now();
    const qualityLevels: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualityLevels.indexOf(quality);
    
    if (avgFps < 25 && currentIndex > 0) {
      // Performance is poor, reduce quality
      const newQuality = qualityLevels[currentIndex - 1];
      console.warn(`Performance degraded (${avgFps} FPS), reducing quality to ${newQuality}`);
      setQuality(newQuality);
      lastAdjustTimeRef.current = currentTime;
    } else if (avgFps > 55 && currentIndex < qualityLevels.length - 1) {
      // Performance is good, try increasing quality
      const newQuality = qualityLevels[currentIndex + 1];
      console.log(`Performance stable (${avgFps} FPS), trying quality ${newQuality}`);
      setQuality(newQuality);
      lastAdjustTimeRef.current = currentTime;
    }
  }, [quality, setQuality]);
  
  // FPS tracking using requestAnimationFrame
  useEffect(() => {
    isMountedRef.current = true;
    let animationId: number;
    
    const trackFPS = () => {
      if (!isMountedRef.current) {
        return;
      }
      
      frameCountRef.current++;
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
        
        // Update FPS history and metrics
        setFpsHistory(prev => {
          const newHistory = [...prev, fps].slice(-30); // Keep last 30 seconds
          const avgFps = Math.round(newHistory.reduce((a, b) => a + b, 0) / newHistory.length);
          
          const memory = (performance as any).memory;
          
          const newMetrics: PerformanceMetrics = {
            fps,
            avgFps,
            frameTime: Math.round(1000 / fps * 100) / 100,
            drawCalls: 0, // We can't get this outside of Canvas
            triangles: 0, // We can't get this outside of Canvas
            memory: memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0,
          };
          
          // Update metrics state
          setMetrics(newMetrics);
          
          // Update store only if mounted
          if (isMountedRef.current) {
            updatePerformanceMetrics({ fps });
          }
          
          // Auto-adjust quality based on performance
          if (autoAdjust && currentTime - lastAdjustTimeRef.current > 5000) { // Wait 5 seconds between adjustments
            autoAdjustQuality(avgFps);
          }
          
          return newHistory;
        });
      }
      
      animationId = requestAnimationFrame(trackFPS);
    };
    
    // Start tracking after a small delay to ensure everything is mounted
    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(trackFPS);
    }, 100);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [autoAdjust, updatePerformanceMetrics, autoAdjustQuality]);
  
  // Performance overlay (only in development)
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div 
      className="fixed top-20 right-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono z-50"
      style={{ minWidth: '200px' }}
    >
      <div className="mb-1 font-bold text-center">Performance Monitor</div>
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={metrics.fps < 30 ? 'text-red-500' : metrics.fps < 50 ? 'text-yellow-500' : 'text-green-500'}>
            {metrics.fps} / {metrics.avgFps} avg
          </span>
        </div>
        <div className="flex justify-between">
          <span>Frame Time:</span>
          <span>{metrics.frameTime}ms</span>
        </div>
        {metrics.memory > 0 && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span>{metrics.memory}MB</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Quality:</span>
          <span className="capitalize">{quality}</span>
        </div>
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-600">
          <span>Auto-adjust:</span>
          <button
            onClick={() => setAutoAdjust(!autoAdjust)}
            className={`px-2 py-0.5 rounded text-xs ${
              autoAdjust ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            {autoAdjust ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
} 