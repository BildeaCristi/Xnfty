"use client";

import { Suspense, lazy, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Stats, 
  Preload, 
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
  Loader
} from '@react-three/drei';
import { EffectComposer, Bloom, SSAO, DepthOfField } from '@react-three/postprocessing';
import { NFT, Collection } from '@/types/blockchain';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore, QualityLevel } from '@/store/sceneStore';
import PhysicsProvider from '../providers/PhysicsProvider';
import MuseumLoadingScreen from './MuseumLoadingScreen';
import NFTDetailModal from '../collections/NFTDetailModal';
import SettingsPanel from './SettingsPanel';
import * as THREE from 'three';
import { useLightingSetup } from '@/hooks/useLightingSetup';

// Lazy load heavy components
const EnhancedMuseumRoom = lazy(() => import('./EnhancedMuseumRoom'));
const EnhancedNFTFrame = lazy(() => import('./EnhancedNFTFrame'));
const FirstPersonCharacterController = lazy(() => import('./FirstPersonCharacterController'));
const Cursor3D = lazy(() => import('./Cursor3D'));
const SceneObjects = lazy(() => import('./SceneObjects'));
const CustomPerformanceMonitor = lazy(() => import('./PerformanceMonitor'));

interface Museum3DSceneProps {
  collection: Collection;
  nfts: NFT[];
  userAddress?: string;
}

export default function Museum3DScene({ 
  collection, 
  nfts, 
  userAddress 
}: Museum3DSceneProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [hoveredNFT, setHoveredNFT] = useState<number | null>(null);
  const [dpr, setDpr] = useState(1.5);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { 
    controlMode, 
    setControlMode, 
    currentTheme
  } = useMuseumStore();
  
  const { 
    getRenderSettings,
    shadowsEnabled,
    postProcessingEnabled,
    updatePerformanceMetrics,
    physicsConfig,
    quality
  } = useSceneStore();

  const renderSettings = getRenderSettings();
  const lightConfig = useLightingSetup();

  // NFT positioning logic
  const nftPositions = useMemo(() => {
    return calculateNFTPositions(nfts.length);
  }, [nfts.length]);

  // Handle NFT click
  const handleNFTClick = useCallback((nft: NFT) => {
    setSelectedNFT(nft);
    setHoveredNFT(null);
  }, []);

  // Handle performance changes
  const handlePerformanceChange = useCallback(({ fps, factor }: { fps: number; factor: number }) => {
    updatePerformanceMetrics({ fps });
    
    // Adjust quality based on performance
    if (factor < 0.5 && quality !== 'low') {
      // Performance is poor, consider lowering quality
      console.warn('Poor performance detected:', fps, 'fps');
    }
  }, [quality, updatePerformanceMetrics]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle control mode with 'C'
      if (e.key === 'c' || e.key === 'C') {
        setControlMode(controlMode === 'orbit' ? 'firstPerson' : 'orbit');
      }
      // Toggle settings with 'ESC'
      if (e.key === 'Escape') {
        setSettingsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [controlMode, setControlMode]);

  return (
    <>
      <div className="w-full h-screen relative bg-gray-900">
        <Canvas
          shadows={renderSettings.shadows}
          dpr={dpr}
          camera={{ 
            position: [0, 2, 8], 
            fov: 60,
            near: 0.1,
            far: 100
          }}
          gl={{ 
            antialias: renderSettings.antialias,
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true,
            toneMapping: renderSettings.toneMapping,
            toneMappingExposure: renderSettings.toneMappingExposure,
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = renderSettings.shadows;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <Suspense fallback={null}>
            {/* Performance monitoring */}
            <PerformanceMonitor
              onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
              onDecline={() => setDpr(1)}
              onChange={handlePerformanceChange}
              flipflops={3}
              onFallback={() => setDpr(1)}
            />
            
            {/* Adaptive quality */}
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />

            {/* Physics wrapper */}
            <PhysicsProvider 
              gravity={physicsConfig.gravity}
              debug={false}
              paused={!physicsConfig.enabled}
            >
              {/* Fog for atmosphere */}
              {currentTheme.atmosphere.fog && (
                <fog
                  attach="fog"
                  args={[
                    currentTheme.atmosphere.fog.color,
                    currentTheme.atmosphere.fog.near,
                    currentTheme.atmosphere.fog.far
                  ]}
                />
              )}

              {/* Lighting setup */}
              <ambientLight 
                intensity={lightConfig.ambient.intensity}
                color={lightConfig.ambient.color}
              />
              <directionalLight
                position={lightConfig.directional.position}
                intensity={lightConfig.directional.intensity}
                color={lightConfig.directional.color}
                castShadow={lightConfig.directional.castShadow}
              />
              
              {/* Environment */}
              <Environment 
                preset={currentTheme.atmosphere.environment || 'city'} 
                background={false}
                blur={0.5}
              />

              {/* Museum Room */}
              <EnhancedMuseumRoom />

              {/* NFT Frames */}
              {nfts.map((nft, index) => (
                <EnhancedNFTFrame
                  key={nft.tokenId}
                  nft={nft}
                  position={nftPositions[index]}
                  rotation={calculateNFTRotation(index, nfts.length)}
                  onClick={() => handleNFTClick(nft)}
                  onHover={(hovered) => setHoveredNFT(hovered ? nft.tokenId : null)}
                  isHovered={hoveredNFT === nft.tokenId}
                  enablePhysics={false}
                />
              ))}

              {/* Additional scene objects */}
              <Suspense fallback={null}>
                <SceneObjects />
              </Suspense>

              {/* 3D Cursor for first-person mode */}
              {controlMode === 'firstPerson' && (
                <Cursor3D
                  enabled={!selectedNFT}
                  onHoverObject={(obj) => {
                    if (obj?.userData?.tokenId) {
                      setHoveredNFT(obj.userData.tokenId);
                    } else {
                      setHoveredNFT(null);
                    }
                  }}
                  onClickObject={(obj) => {
                    if (obj?.userData?.tokenId) {
                      const nft = nfts.find(n => n.tokenId === obj.userData.tokenId);
                      if (nft) handleNFTClick(nft);
                    }
                  }}
                />
              )}

              {/* Camera Controls */}
              {controlMode === 'orbit' ? (
                <OrbitControls
                  enablePan={!selectedNFT}
                  enableZoom={!selectedNFT}
                  enableRotate={!selectedNFT}
                  minDistance={2}
                  maxDistance={20}
                  maxPolarAngle={Math.PI / 2 - 0.1}
                  target={[0, 1.5, 0]}
                  dampingFactor={0.05}
                  enableDamping
                  makeDefault
                />
              ) : (
                <FirstPersonCharacterController 
                  enabled={!selectedNFT} 
                  position={[0, 2.5, 5]}
                />
              )}

              {/* Post-processing effects */}
              {postProcessingEnabled && quality !== 'low' && quality !== 'medium' && (
                quality === 'ultra' ? (
                  <EffectComposer>
                    <Bloom 
                      intensity={0.5}
                      luminanceThreshold={0.9}
                      luminanceSmoothing={0.9}
                    />
                    <DepthOfField
                      focusDistance={0}
                      focalLength={0.02}
                      bokehScale={2}
                      height={480}
                    />
                  </EffectComposer>
                ) : (
                  <EffectComposer>
                    <Bloom 
                      intensity={0.5}
                      luminanceThreshold={0.9}
                      luminanceSmoothing={0.9}
                    />
                  </EffectComposer>
                )
              )}
            </PhysicsProvider>

            {/* Performance stats in development */}
            {process.env.NODE_ENV === 'development' && <Stats />}
            
            {/* Preload all assets */}
            <Preload all />
          </Suspense>
        </Canvas>

        {/* Loading screen */}
        <Loader 
          containerStyles={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          innerStyles={{
            width: 200,
            height: 200,
            color: 'white',
          }}
          barStyles={{
            height: 10,
            background: '#4a90e2',
          }}
          dataStyles={{
            color: 'white',
            fontSize: '14px',
            marginTop: '10px',
          }}
        />

        {/* Performance monitoring - outside Canvas */}
        <Suspense fallback={null}>
          <CustomPerformanceMonitor />
        </Suspense>

        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 text-white pointer-events-none select-none">
          <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">
            {collection.name}
          </h2>
          <p className="text-sm text-gray-300 drop-shadow">
            {nfts.length} NFTs • {controlMode === 'orbit' ? 'Orbit Mode' : 'First Person Mode'}
          </p>
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-4 left-4 text-white text-sm pointer-events-none select-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 space-y-1">
            <p>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs mr-1">C</kbd>
              Toggle camera mode
            </p>
            <p>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs mr-1">ESC</kbd>
              Settings / Exit
            </p>
            {controlMode === 'firstPerson' && (
              <p>
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs mr-1">WASD</kbd>
                Move • 
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs mx-1">SPACE</kbd>
                Jump
              </p>
            )}
          </div>
        </div>

        {/* Quality indicator */}
        <div className="absolute top-4 right-4 text-white text-sm">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
            Quality: <span className="font-medium capitalize">{quality}</span>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          nft={selectedNFT}
          collection={collection}
          userAddress={userAddress}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </>
  );
}

// Helper functions
function calculateNFTPositions(total: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const wallSpacing = 3.5;
  const height = 2;
  const roomSize = 10; // Half of room width/depth (20/2 = 10)
  
  const perWall = Math.ceil(total / 4);
  
  for (let i = 0; i < total; i++) {
    const wall = Math.floor(i / perWall);
    const positionOnWall = i % perWall;
    
    const wallLength = roomSize * 2;
    const totalWidth = (perWall - 1) * wallSpacing;
    const startOffset = -totalWidth / 2;
    const offset = startOffset + positionOnWall * wallSpacing;
    
    switch (wall) {
      case 0: // Front wall
        positions.push([offset, height, -(roomSize - 0.2)]); // Slightly off the wall
        break;
      case 1: // Right wall
        positions.push([roomSize - 0.2, height, offset]);
        break;
      case 2: // Back wall
        positions.push([-offset, height, roomSize - 0.2]);
        break;
      case 3: // Left wall
        positions.push([-(roomSize - 0.2), height, -offset]);
        break;
      default:
        positions.push([0, height, 0]);
    }
  }
  
  return positions;
}

function calculateNFTRotation(index: number, total: number): [number, number, number] {
  const perWall = Math.ceil(total / 4);
  const wall = Math.floor(index / perWall);
  
  switch (wall) {
    case 0: return [0, 0, 0];        // Front wall
    case 1: return [0, -Math.PI / 2, 0]; // Right wall
    case 2: return [0, Math.PI, 0];      // Back wall
    case 3: return [0, Math.PI / 2, 0];  // Left wall
    default: return [0, 0, 0];
  }
} 