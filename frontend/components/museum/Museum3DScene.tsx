"use client";

import { Suspense, lazy, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Stats, 
  Preload, 
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents
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
import { useIPFSImage } from '@/hooks/useIPFSImage';

// Lazy load heavy components
const EnhancedMuseumRoom = lazy(() => import('./EnhancedMuseumRoom'));
const EnhancedNFTFrame = lazy(() => import('./EnhancedNFTFrame'));
const FirstPersonCharacterController = lazy(() => import('./FirstPersonCharacterController'));
const SceneObjects = lazy(() => import('./SceneObjects'));

interface Museum3DSceneProps {
  collection: Collection;
  nfts: NFT[];
  userAddress?: string;
}

// NFT Image Preloader Component
function NFTImagePreloader({ nfts, onAllLoaded }: { nfts: NFT[], onAllLoaded: () => void }) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>(new Array(nfts.length).fill(true));
  
  // Track each NFT image loading
  const imageHooks = nfts.map((nft, index) => {
    const { texture, loading, error } = useIPFSImage(nft.imageURI, { quality: 'medium' });
    
    useEffect(() => {
      if (!loading) {
        setLoadingStates(prev => {
          const newStates = [...prev];
          if (newStates[index] === true) {
            newStates[index] = false;
            setLoadedCount(count => {
              const newCount = count + 1;
              console.log(`📸 NFT Image ${index + 1} loaded. Total: ${newCount}/${nfts.length}`);
              return newCount;
            });
          }
          return newStates;
        });
      }
    }, [loading, index]);
    
    return { texture, loading, error };
  });
  
  // Check if all images are loaded
  useEffect(() => {
    console.log(`🔍 Image loading check: ${loadedCount}/${nfts.length} loaded`);
    if (loadedCount === nfts.length && nfts.length > 0) {
      console.log(`✅ All ${nfts.length} NFT images loaded successfully!`);
      // Add small delay to ensure smooth transition
      setTimeout(() => {
        onAllLoaded();
      }, 500);
    }
  }, [loadedCount, nfts.length, onAllLoaded]);
  
  // Fallback timeout - show scene after 10 seconds regardless
  useEffect(() => {
    console.log(`⏰ Setting 5-second fallback timeout for ${nfts.length} NFTs`);
    const fallbackTimeout = setTimeout(() => {
      console.log(`⚠️ Fallback timeout reached - showing scene with ${loadedCount}/${nfts.length} images loaded`);
      onAllLoaded();
    }, 5000); // 5 second timeout (reduced from 10)
    
    return () => clearTimeout(fallbackTimeout);
  }, [nfts.length, onAllLoaded, loadedCount]);
  
  // If no NFTs, immediately show scene
  useEffect(() => {
    if (nfts.length === 0) {
      console.log(`📭 No NFTs to load - showing scene immediately`);
      onAllLoaded();
    }
  }, [nfts.length, onAllLoaded]);
  
  // Calculate loading progress
  const progress = nfts.length > 0 ? Math.round((loadedCount / nfts.length) * 100) : 100;
  
  // Update loading screen with image loading progress
  useEffect(() => {
    if (nfts.length > 0) {
      console.log(`📊 NFT Images progress: ${loadedCount}/${nfts.length} (${progress}%)`);
    }
  }, [loadedCount, nfts.length, progress]);
  
  return null; // This component doesn't render anything
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

// Crosshair Raycaster Component - handles NFT detection for 2D crosshair
function CrosshairRaycaster({ 
  enabled, 
  onHoverNFT, 
  onClickNFT,
  nfts,
  interactionMode
}: { 
  enabled: boolean;
  onHoverNFT: (tokenId: number | null) => void;
  onClickNFT: (nft: NFT | null) => void;
  nfts: NFT[];
  interactionMode: boolean;
}) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  
  useFrame(() => {
    if (!enabled) {
      onHoverNFT(null);
      return;
    }

    // Only detect NFTs when in interaction mode (E key held)
    if (!interactionMode) {
      onHoverNFT(null);
      return;
    }

    // Cast ray from camera center (where 2D crosshair is)
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Get all intersections
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    // Find the first NFT frame intersection
    let foundNFT = false;
    for (const intersect of intersects) {
      let obj = intersect.object;
      
      // Traverse up to find NFT frame
      while (obj) {
        if (obj.userData?.tokenId) {
          onHoverNFT(obj.userData.tokenId);
          foundNFT = true;
          break;
        }
        obj = obj.parent as THREE.Object3D;
      }
      
      if (foundNFT) break;
    }
    
    if (!foundNFT) {
      onHoverNFT(null);
    }
  });

  // Handle click events
  useEffect(() => {
    if (!enabled) return;

    const handleClick = () => {
      // Only allow clicks when in interaction mode
      if (!enabled || !interactionMode) return;

      // Cast ray from camera center
      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      
      // Find clicked NFT
      for (const intersect of intersects) {
        let obj = intersect.object;
        
        while (obj) {
          if (obj.userData?.tokenId) {
            // Find the actual NFT object from the nfts array
            const nft = nfts.find(n => n.tokenId === obj.userData.tokenId);
            onClickNFT(nft || null);
            return;
          }
          obj = obj.parent as THREE.Object3D;
        }
      }
      
      onClickNFT(null);
    };

    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [enabled, camera, scene, gl, onClickNFT, nfts, interactionMode]);

  return null;
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
  const [allImagesLoaded, setAllImagesLoaded] = useState(true);
  const [modalJustClosed, setModalJustClosed] = useState(false);
  const [isInteractionKeyPressed, setIsInteractionKeyPressed] = useState(false);
  
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

  // Handle NFT click with cooldown to prevent immediate re-opening
  const handleNFTClick = useCallback((nft: NFT) => {
    // Block if modal is open or just closed
    if (modalJustClosed || selectedNFT) {
      console.log('🚫 NFT click blocked - modal active or cooldown');
      return;
    }
    
    console.log('🖼️ Opening NFT modal:', nft.name);
    setSelectedNFT(nft);
    setHoveredNFT(null);
  }, [modalJustClosed, selectedNFT]);

  // Handle modal close with state clearing
  const handleModalClose = useCallback(() => {
    console.log('❌ Closing NFT modal');
    setSelectedNFT(null);
    setHoveredNFT(null); // Clear hover state
    setModalJustClosed(true);
    
    // Clear the cooldown after a short delay
    setTimeout(() => {
      setModalJustClosed(false);
      console.log('✅ Modal cooldown cleared');
    }, 300); // 300ms cooldown
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

  // Handle when all images are loaded
  const handleAllImagesLoaded = useCallback(() => {
    console.log(`🎉 handleAllImagesLoaded called - setting allImagesLoaded to true`);
    setAllImagesLoaded(true);
  }, []);

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
      // Track 'E' key for interactions
      if (e.key === 'e' || e.key === 'E') {
        setIsInteractionKeyPressed(true);
      }
    };

    const handleKeyRelease = (e: KeyboardEvent) => {
      // Release 'E' key
      if (e.key === 'e' || e.key === 'E') {
        setIsInteractionKeyPressed(false);
        // Clear hover state when exiting interaction mode
        setHoveredNFT(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyRelease);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyRelease);
    };
  }, [controlMode, setControlMode]);

  // Debug loading state
  useEffect(() => {
    console.log(`🎭 Museum scene state: allImagesLoaded=${allImagesLoaded}, NFTs=${nfts.length}`);
  }, [allImagesLoaded, nfts.length]);

  // Initialize loading state
  useEffect(() => {
    console.log(`🚀 Museum3DScene initialized with ${nfts.length} NFTs`);
    if (nfts.length === 0) {
      console.log(`📭 No NFTs detected - keeping scene visible`);
      setAllImagesLoaded(true);
    } else {
      console.log(`📸 Starting to load ${nfts.length} NFT images...`);
      setAllImagesLoaded(false); // Hide scene while loading images
    }
  }, [nfts.length]); // Depend on nfts.length

  return (
    <>
      {/* Preload NFT images */}
      <NFTImagePreloader nfts={nfts} onAllLoaded={handleAllImagesLoaded} />
      
      {/* Show loading screen until all images are ready */}
      {!allImagesLoaded && <MuseumLoadingScreen />}
      
      <div className={`w-full h-screen relative bg-gray-900 ${!allImagesLoaded ? 'invisible' : 'visible'}`}>
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
                  onClick={() => {
                    // Only allow direct clicks in orbit mode
                    if (controlMode === 'orbit' && !modalJustClosed) {
                      handleNFTClick(nft);
                    }
                  }}
                  onHover={(hovered) => {
                    // Only allow hover in orbit mode
                    if (controlMode === 'orbit' && !modalJustClosed) {
                      setHoveredNFT(hovered ? nft.tokenId : null);
                    }
                  }}
                  isHovered={hoveredNFT === nft.tokenId && !modalJustClosed && controlMode === 'orbit'}
                  enablePhysics={false}
                />
              ))}

              {/* Additional scene objects */}
              <Suspense fallback={null}>
                <SceneObjects />
              </Suspense>

              {/* Crosshair Raycaster for First Person Mode */}
              {controlMode === 'firstPerson' && (
                <CrosshairRaycaster
                  enabled={!selectedNFT && !modalJustClosed}
                  onHoverNFT={(tokenId) => setHoveredNFT(tokenId)}
                  onClickNFT={(nft) => {
                    if (nft) {
                      handleNFTClick(nft);
                    }
                  }}
                  nfts={nfts}
                  interactionMode={isInteractionKeyPressed}
                />
              )}

              {/* Camera Controls */}
              {controlMode === 'orbit' ? (
                <OrbitControls
                  enablePan={!selectedNFT && !modalJustClosed}
                  enableZoom={!selectedNFT && !modalJustClosed}
                  enableRotate={!selectedNFT && !modalJustClosed}
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
                  enabled={!selectedNFT && !modalJustClosed} 
                  position={[0, 2.5, 5]}
                />
              )}

              {/* Post-processing effects */}
              {postProcessingEnabled && quality === 'high' && (
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
              )}
            </PhysicsProvider>

            {/* Performance stats in development */}
            {process.env.NODE_ENV === 'development' && <Stats />}
            
            {/* Preload all assets */}
            <Preload all />
          </Suspense>
        </Canvas>

        {/* HUD Overlay */}
        {allImagesLoaded && (
          <div className="absolute top-4 left-4 text-white pointer-events-none select-none">
            <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">
              {collection.name}
            </h2>
            <p className="text-sm text-gray-300 drop-shadow">
              {nfts.length} NFTs • {controlMode === 'orbit' ? 'Orbit Mode' : 'First Person Mode'}
              {modalJustClosed && <span className="text-yellow-400 ml-2">• Cooldown...</span>}
            </p>
          </div>
        )}

        {/* Controls hint */}
        {allImagesLoaded && (
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
                <>
                  <p>
                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs mr-1">WASD</kbd>
                    Move • 
                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs mx-1">SPACE</kbd>
                    Jump
                  </p>
                  <p>
                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs mr-1">E</kbd>
                    Hold to interact with NFTs
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Quality indicator */}
        {allImagesLoaded && (
          <div className="absolute top-4 right-4 text-white text-sm">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
              Quality: <span className="font-medium capitalize">{quality}</span>
            </div>
          </div>
        )}

        {/* Simple 2D Crosshair for First Person Mode */}
        {allImagesLoaded && controlMode === 'firstPerson' && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="relative">
              {/* Center dot */}
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                hoveredNFT && !modalJustClosed && isInteractionKeyPressed 
                  ? 'bg-green-400 scale-150' 
                  : isInteractionKeyPressed 
                    ? 'bg-yellow-400 scale-125'
                    : 'bg-white/60'
              }`} />
              
              {/* Crosshair lines */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Horizontal line */}
                <div className={`absolute h-[1px] w-6 -left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  hoveredNFT && !modalJustClosed && isInteractionKeyPressed
                    ? 'bg-green-400' 
                    : isInteractionKeyPressed
                      ? 'bg-yellow-400'
                      : 'bg-white/40'
                }`} />
                {/* Vertical line */}
                <div className={`absolute w-[1px] h-6 left-1/2 -top-3 -translate-x-1/2 transition-colors ${
                  hoveredNFT && !modalJustClosed && isInteractionKeyPressed
                    ? 'bg-green-400' 
                    : isInteractionKeyPressed
                      ? 'bg-yellow-400'
                      : 'bg-white/40'
                }`} />
              </div>

              {/* Interaction hints */}
              {!modalJustClosed && (
                <>
                  {/* NFT detected - ready to click */}
                  {hoveredNFT && isInteractionKeyPressed && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-xs bg-black/70 px-3 py-1 rounded-full whitespace-nowrap">
                      Click to view NFT
                    </div>
                  )}

                  {/* E key instruction when looking at NFT */}
                  {hoveredNFT && !isInteractionKeyPressed && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-xs bg-black/70 px-3 py-1 rounded-full whitespace-nowrap">
                      Hold <kbd className="bg-gray-600 px-1 rounded">E</kbd> to interact
                    </div>
                  )}

                  {/* Interaction mode active */}
                  {!hoveredNFT && isInteractionKeyPressed && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-xs bg-black/70 px-3 py-1 rounded-full whitespace-nowrap">
                      Interaction mode active
                    </div>
                  )}
                </>
              )}

              {/* Cooldown hint */}
              {modalJustClosed && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs bg-black/70 px-3 py-1 rounded-full whitespace-nowrap">
                  Wait a moment...
                </div>
              )}
            </div>
          </div>
        )}
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
          onClose={handleModalClose}
        />
      )}
    </>
  );
}