"use client";

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { NFT, Collection } from '@/types/blockchain';
import MuseumRoom from './MuseumRoom';
import NFTFrame from './NFTFrame';
import NFTDetailModal from '../collections/NFTDetailModal';
import FirstPersonControls from './FirstPersonControls';
import ThemeSelector from './ThemeSelector';
import Crosshair from './Crosshair';
import { useMuseumStore } from '@/store/museumStore';
import { Settings, Camera } from 'lucide-react';
import TextureManager from '@/utils/textureManager';

interface Museum3DViewProps {
  collection: Collection;
  nfts: NFT[];
  userAddress?: string;
}

// Component to handle raycasting in first-person mode
function FirstPersonRaycaster({ 
  nfts, 
  onHoverNFT, 
  nftPositions,
  enabled = true
}: { 
  nfts: NFT[], 
  onHoverNFT: (tokenId: number | null) => void,
  nftPositions: Map<number, THREE.Vector3>,
  enabled?: boolean
}) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const lastHovered = useRef<number | null>(null);

  useFrame(() => {
    // Don't update hover state if disabled
    if (!enabled) {
      // Force clear hover state when disabled
      if (lastHovered.current !== null) {
        onHoverNFT(null);
        lastHovered.current = null;
      }
      return;
    }

    // Cast ray from camera center (0, 0 for pointer lock)
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Get all objects in the scene
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    // Find the first NFT frame that was hit
    let hoveredTokenId: number | null = null;
    
    for (const intersect of intersects) {
      // Check if this object has NFT data
      let currentObject = intersect.object;
      
      // Traverse up the object hierarchy to find NFT data
      while (currentObject) {
        if (currentObject.userData && currentObject.userData.tokenId !== undefined) {
          hoveredTokenId = currentObject.userData.tokenId;
          break;
        }
        currentObject = currentObject.parent as THREE.Object3D;
      }
      
      if (hoveredTokenId !== null) {
        break;
      }
    }

    // Only update if hover state changed
    if (hoveredTokenId !== lastHovered.current) {
      onHoverNFT(hoveredTokenId);
      lastHovered.current = hoveredTokenId;
    }
  });

  return null;
}

export default function Museum3DView({ collection, nfts, userAddress }: Museum3DViewProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [hoveredNFT, setHoveredNFT] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const { 
    controlMode, 
    setControlMode, 
    currentTheme, 
    showThemeSelector,
    setShowThemeSelector,
    quality
  } = useMuseumStore();

  // Store NFT positions for raycasting
  const nftPositions = useRef(new Map<number, THREE.Vector3>());

  const handleNFTClick = (nft: NFT) => {
    // Only allow click if not transitioning
    if (isTransitioning) return;
    
    // Set transitioning state to prevent hover updates
    setIsTransitioning(true);
    setSelectedNFT(nft);
    // Clear the hovered NFT to prevent immediate re-opening
    setHoveredNFT(null);
  };

  const handleNFTHover = (tokenId: number | null) => {
    // Don't allow hovering when modal is open or during transitions
    if (selectedNFT || isTransitioning) {
      setHoveredNFT(null);
    } else {
      setHoveredNFT(tokenId);
    }
  };

  const handleCrosshairInteract = () => {
    // Only allow interaction when pointer is locked and not transitioning
    if (hoveredNFT !== null && !selectedNFT && !isTransitioning && isPointerLocked) {
      const nft = nfts.find(n => n.tokenId === hoveredNFT);
      if (nft) {
        handleNFTClick(nft);
      }
    }
  };

  // Store NFT positions
  useEffect(() => {
    nfts.forEach((nft, index) => {
      const position = calculateNFTPosition(index, nfts.length);
      nftPositions.current.set(nft.tokenId, new THREE.Vector3(...position));
    });
  }, [nfts]);

  // Listen for pointer lock changes directly from browser
  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement !== null;
      setIsPointerLocked(isLocked);
      
      // Clear hover state when pointer lock changes
      if (!isLocked) {
        setHoveredNFT(null);
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent actions during transitions
      if (isTransitioning) return;
      
      // Handle ESC key
      if (e.key === 'Escape') {
        if (selectedNFT) {
          // Close modal first if it's open
          handleCloseModal();
        } else if (showThemeSelector) {
          // Close theme selector if modal is closed
          setShowThemeSelector(false);
        } else {
          // Open theme selector if nothing is open
          setShowThemeSelector(true);
        }
      }
      // Don't allow control mode switching when modal is open
      if ((e.key === 'c' || e.key === 'C') && !selectedNFT && !isTransitioning) {
        setControlMode(controlMode === 'orbit' ? 'firstPerson' : 'orbit');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [controlMode, setControlMode, setShowThemeSelector, selectedNFT, showThemeSelector, isTransitioning]);

  // Handle loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Clear hoveredNFT when closing modal with cooldown
  const handleCloseModal = () => {
    setSelectedNFT(null);
    setHoveredNFT(null);
    setIsTransitioning(true);
    
    // Don't attempt automatic pointer lock - let user initiate it
    // This avoids the Chrome security timeout issue
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Increased transition period for better stability
  };

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      // Clear all cached textures when museum view unmounts
      const textureManager = TextureManager.getInstance();
      textureManager.clearAll();
    };
  }, []);

  return (
    <>
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="mb-8 relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-500/30 rounded-lg animate-spin [animation-duration:3s]"></div>
              <div className="absolute inset-2 border-4 border-purple-500/30 rounded-lg animate-spin [animation-duration:3s] [animation-direction:reverse]"></div>
              <div className="absolute inset-4 border-4 border-blue-400/30 rounded-lg animate-spin [animation-duration:3s]"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Preparing Your Museum</h2>
            <p className="text-gray-400">Setting up the exhibition space...</p>
          </div>
        </div>
      )}

      <div className="w-full h-screen relative">
        {/* Backdrop overlay when modal is open */}
        {selectedNFT && (
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
            onClick={handleCloseModal}
          />
        )}
        
        <Canvas
          shadows={quality !== 'low'}
          camera={{ position: [0, 2, 8], fov: 60 }}
          className={`bg-gray-900 transition-all duration-300 ${selectedNFT ? 'pointer-events-none' : ''}`}
          gl={{ 
            antialias: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
            depth: true,
            stencil: false,
            alpha: false
          }}
          onCreated={({ gl }) => {
            // Handle WebGL context loss
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              console.error('WebGL context lost. Attempting to restore...');
              
              // Clear texture cache to free memory
              const textureManager = TextureManager.getInstance();
              textureManager.clearAll();
              
              // Attempt to restore context
              setTimeout(() => {
                gl.forceContextRestore();
              }, 1000);
            });
            
            gl.domElement.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
              // Force re-render
              window.location.reload();
            });
          }}
        >
          <Suspense fallback={null}>
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

            {/* Enhanced lighting setup based on theme */}
            <ambientLight 
              intensity={currentTheme.lighting.ambientIntensity * 1.5} 
              color={currentTheme.lighting.ambientColor}
            />
            <directionalLight
              position={[10, 10, 5]}
              intensity={currentTheme.lighting.directionalIntensity * 1.2}
              color={currentTheme.lighting.directionalColor}
              castShadow={quality !== 'low'}
              shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
              shadow-camera-left={-15}
              shadow-camera-right={15}
              shadow-camera-top={15}
              shadow-camera-bottom={-15}
            />
            <pointLight 
              position={[0, 5, 0]} 
              intensity={0.5}
              color={currentTheme.lighting.ambientColor}
            />
            
            {/* Additional fill lights for better texture visibility */}
            <pointLight 
              position={[-5, 3, -5]} 
              intensity={0.3}
              color="#ffffff"
            />
            <pointLight 
              position={[5, 3, 5]} 
              intensity={0.3}
              color="#ffffff"
            />
            
            {/* Environment for reflections */}
            <Environment 
              preset={currentTheme.atmosphere.environment || 'city'} 
              background={false}
            />
            
            {/* Museum Room */}
            <MuseumRoom />
            
            {/* NFT Frames on walls */}
            {nfts.map((nft, index) => (
              <NFTFrame
                key={nft.tokenId}
                nft={nft}
                position={calculateNFTPosition(index, nfts.length)}
                rotation={calculateNFTRotation(index, nfts.length)}
                onClick={() => handleNFTClick(nft)}
                onPointerOver={() => controlMode === 'orbit' && handleNFTHover(nft.tokenId)}
                onPointerOut={() => controlMode === 'orbit' && handleNFTHover(null)}
                isHovered={hoveredNFT === nft.tokenId}
              />
            ))}
            
            {/* Camera Controls based on mode */}
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
              />
            ) : (
              <>
                <FirstPersonControls 
                  speed={10} 
                  jumpHeight={2} 
                  enabled={!selectedNFT} 
                  onLockChange={setIsPointerLocked}
                />
                <FirstPersonRaycaster 
                  nfts={nfts} 
                  onHoverNFT={handleNFTHover}
                  nftPositions={nftPositions.current}
                  enabled={!selectedNFT && !isTransitioning && isPointerLocked}
                />
              </>
            )}

            {/* Performance stats in development */}
            {process.env.NODE_ENV === 'development' && quality === 'high' && <Stats />}
          </Suspense>
        </Canvas>
        
        {/* Crosshair for first-person mode */}
        <Crosshair 
          isHovering={hoveredNFT !== null && !isTransitioning} 
          isFirstPerson={controlMode === 'firstPerson'}
        />
        
        {/* Click handler for first-person mode - only active when hovering an NFT and pointer is locked */}
        {controlMode === 'firstPerson' && hoveredNFT !== null && !selectedNFT && !isTransitioning && isPointerLocked && (
          <div 
            className="absolute inset-0 z-30"
            onClick={handleCrosshairInteract}
            style={{ cursor: 'pointer' }}
          />
        )}
        
        {/* Pointer lock hint - show when in first-person mode without pointer lock */}
        {controlMode === 'firstPerson' && !selectedNFT && !isPointerLocked && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-center transition-opacity duration-300">
              <p className="text-sm font-medium">Click anywhere to enable first-person controls</p>
              <p className="text-xs text-gray-300 mt-1">Press ESC to exit • C to switch to orbit mode</p>
            </div>
          </div>
        )}
        
        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 text-white pointer-events-none">
          <h2 className="text-2xl font-bold mb-2">{collection.name}</h2>
          <p className="text-sm text-gray-300">
            {controlMode === 'orbit' 
              ? 'Use mouse to look around • Click NFTs to view details' 
              : 'WASD to move • Mouse to look • Click on NFTs to view'
            }
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">C</kbd> to toggle controls • 
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs ml-1">ESC</kbd> for settings
          </p>
        </div>

        {/* Control Mode Toggle Button */}
        <button
          onClick={() => setControlMode(controlMode === 'orbit' ? 'firstPerson' : 'orbit')}
          className={`absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-gray-700/80 transition-all flex items-center space-x-2 ${selectedNFT ? 'opacity-50 pointer-events-none' : ''}`}
          disabled={!!selectedNFT}
        >
          <Camera className="w-4 h-4" />
          <span>{controlMode === 'orbit' ? 'Switch to First Person' : 'Switch to Orbit'}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowThemeSelector(true)}
          className={`absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-gray-700/80 transition-all ${selectedNFT ? 'opacity-50 pointer-events-none' : ''}`}
          title="Open Settings"
          disabled={!!selectedNFT}
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* NFT Count */}
        <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg">
          <span className="text-sm">{nfts.length} NFTs</span>
        </div>
      </div>
      
      {/* Theme Selector Modal */}
      <ThemeSelector />
      
      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          nft={selectedNFT}
          collection={collection}
          userAddress={userAddress}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

// Enhanced NFT positioning for better distribution
function calculateNFTPosition(index: number, total: number): [number, number, number] {
  const wallSpacing = 3.5;
  const height = 2;
  const roomSize = 9.8;
  
  const perWall = Math.ceil(total / 4);
  const wall = Math.floor(index / perWall);
  const positionOnWall = index % perWall;
  
  const wallLength = roomSize * 2;
  const totalWidth = (perWall - 1) * wallSpacing;
  const startOffset = -totalWidth / 2;
  const offset = startOffset + positionOnWall * wallSpacing;
  
  switch (wall) {
    case 0: // Front wall
      return [offset, height, -roomSize];
    case 1: // Right wall
      return [roomSize, height, offset];
    case 2: // Back wall
      return [-offset, height, roomSize];
    case 3: // Left wall
      return [-roomSize, height, -offset];
    default:
      return [0, height, 0];
  }
}

// Helper function to calculate NFT rotations
function calculateNFTRotation(index: number, total: number): [number, number, number] {
  const perWall = Math.ceil(total / 4);
  const wall = Math.floor(index / perWall);
  
  switch (wall) {
    case 0: // Front wall - facing forward
      return [0, 0, 0];
    case 1: // Right wall - facing left
      return [0, -Math.PI / 2, 0];
    case 2: // Back wall - facing backward
      return [0, Math.PI, 0];
    case 3: // Left wall - facing right
      return [0, Math.PI / 2, 0];
    default:
      return [0, 0, 0];
  }
} 