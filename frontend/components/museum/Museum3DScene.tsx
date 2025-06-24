"use client";

import {lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {AdaptiveDpr, AdaptiveEvents, OrbitControls, PerformanceMonitor, Preload, Stats} from '@react-three/drei';
import {Bloom, EffectComposer} from '@react-three/postprocessing';
import {Collection, NFT} from '@/types/blockchain';
import {useMuseumStore} from '@/store/museumStore';
import {useSceneStore} from '@/store/sceneStore';
import PhysicsProvider from '@/providers/PhysicsProvider';
import LoadingScreen from './core/EnhancedLoadingScreen';
import NFTDetailModal from '../collections/NFTDetailModal';
import SettingsPanel from './SettingsPanel';
import * as THREE from 'three';
import {MuseumService} from '@/services/museumService';
import {LightingService} from '@/services/lightingService';
import {
    CAMERA_SETTINGS,
    CONTROL_MODES,
    KEYBOARD_CONTROLS,
    MODAL_SETTINGS,
    PERFORMANCE_SETTINGS,
    QUALITY_LEVELS
} from '@/utils/constants/museumConstants';
import NFTImagePreloader from './core/NFTImagePreloader';
import CrosshairRaycaster from './core/CrosshairRaycaster';
import SceneLighting from './core/SceneLighting';

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


export default function Museum3DScene({
                                          collection,
                                          nfts,
                                          userAddress
                                      }: Museum3DSceneProps) {
    const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
    const [hoveredNFT, setHoveredNFT] = useState<number | null>(null);
    const [dpr, setDpr] = useState<number>(PERFORMANCE_SETTINGS.DEFAULT_DPR);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [allImagesLoaded, setAllImagesLoaded] = useState(false);
    const [modalJustClosed, setModalJustClosed] = useState(false);
    const [isInteractionKeyPressed, setIsInteractionKeyPressed] = useState(false);
    const {
        controlMode,
        setControlMode,
        currentTheme
    } = useMuseumStore();

    const [imageLoadProgress, setImageLoadProgress] = useState(0);
    const [themeLoading, setThemeLoading] = useState(false);
    const prevTheme = useRef(currentTheme);

    const {
        getRenderSettings,
        shadowsEnabled,
        postProcessingEnabled,
        updatePerformanceMetrics,
        physicsConfig,
        quality
    } = useSceneStore();

    const renderSettings = getRenderSettings();
    const lightingConfig = LightingService.getLightingConfig();

    // NFT positioning logic
    const nftPositions = useMemo(() => {
        return MuseumService.calculateNFTPositions(nfts.length);
    }, [nfts.length]);

    // Handle NFT click with cooldown to prevent immediate re-opening
    const handleNFTClick = useCallback((nft: NFT) => {
        // Block if modal is open or just closed
        if (modalJustClosed || selectedNFT) {
            return;
        }

        setSelectedNFT(nft);
        setHoveredNFT(null);
    }, [modalJustClosed, selectedNFT]);

    // Handle modal close with state clearing
    const handleModalClose = useCallback(() => {
        setSelectedNFT(null);
        setHoveredNFT(null); // Clear hover state
        setModalJustClosed(true);

        // Clear the cooldown after a short delay
        setTimeout(() => {
            setModalJustClosed(false);
        }, MODAL_SETTINGS.CLOSE_COOLDOWN); // 300ms cooldown
    }, []);

    // Handle performance changes
    const handlePerformanceChange = useCallback(({fps, factor}: { fps: number; factor: number }) => {
        updatePerformanceMetrics({fps});

        // Adjust quality based on performance
        if (factor < 0.5 && quality !== QUALITY_LEVELS.LOW) {
            // Performance is poor, consider lowering quality
        }
    }, [quality, updatePerformanceMetrics]);

    // Handle when all images are loaded
    const handleAllImagesLoaded = useCallback(() => {
        setAllImagesLoaded(true);
    }, []);

    // Handle theme change loading
    useEffect(() => {
        if (prevTheme.current !== currentTheme) {
            setThemeLoading(true);
            const timer = setTimeout(() => {
                setThemeLoading(false);
                prevTheme.current = currentTheme;
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentTheme]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((KEYBOARD_CONTROLS.TOGGLE_CONTROL as readonly string[]).includes(e.key)) {
                setControlMode(controlMode === CONTROL_MODES.ORBIT ? CONTROL_MODES.FIRST_PERSON : CONTROL_MODES.ORBIT);
            }
            if (e.key === KEYBOARD_CONTROLS.TOGGLE_SETTINGS) {
                setSettingsOpen(prev => !prev);
            }
            if ((KEYBOARD_CONTROLS.INTERACTION as readonly string[]).includes(e.key)) {
                setIsInteractionKeyPressed(true);
            }
        };

        const handleKeyRelease = (e: KeyboardEvent) => {
            if ((KEYBOARD_CONTROLS.INTERACTION as readonly string[]).includes(e.key)) {
                setIsInteractionKeyPressed(false);
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

    // Initialize loading state
    useEffect(() => {
        if (nfts.length === 0) {
            setAllImagesLoaded(true);
        } else {
            setAllImagesLoaded(false);
        }
    }, [nfts.length]);


    return (
        <>
            {/* Preload NFT images */}
            <NFTImagePreloader
                nfts={nfts}
                onAllLoaded={handleAllImagesLoaded}
                onProgress={setImageLoadProgress}
            />

            {/* Show loading screen until all images are ready */}
            {!allImagesLoaded && (
                <LoadingScreen
                    progress={imageLoadProgress}
                    message="Loading NFT images..."
                />
            )}

            {/* Theme switching loader */}
            {themeLoading && (
                <LoadingScreen
                    progress={75}
                    message="Applying theme..."
                />
            )}

            <div className={`w-full h-screen relative bg-gray-900 ${!allImagesLoaded ? 'invisible' : 'visible'}`}>
                <Canvas
                    shadows={renderSettings.shadows}
                    dpr={dpr}
                    camera={{
                        position: CAMERA_SETTINGS.DEFAULT_POSITION,
                        fov: CAMERA_SETTINGS.FOV,
                        near: CAMERA_SETTINGS.NEAR,
                        far: CAMERA_SETTINGS.FAR
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
                    onCreated={({gl}) => {
                        gl.shadowMap.enabled = renderSettings.shadows;
                        gl.shadowMap.type = THREE.PCFSoftShadowMap;
                    }}
                >
                    <Suspense fallback={null}>
                        {/* Performance monitoring */}
                        <PerformanceMonitor
                            onIncline={() => setDpr(Math.min(PERFORMANCE_SETTINGS.MAX_DPR, window.devicePixelRatio))}
                            onDecline={() => setDpr(PERFORMANCE_SETTINGS.MIN_DPR)}
                            onChange={handlePerformanceChange}
                            flipflops={PERFORMANCE_SETTINGS.PERFORMANCE_FLIPFLOPS}
                            onFallback={() => setDpr(PERFORMANCE_SETTINGS.MIN_DPR)}
                        />

                        {/* Adaptive quality */}
                        <AdaptiveDpr pixelated/>
                        <AdaptiveEvents/>

                        {/* Physics wrapper */}
                        <PhysicsProvider
                            gravity={physicsConfig.gravity}
                            debug={false}
                            paused={!physicsConfig.enabled}
                        >
                            {/* Scene Lighting */}
                            <SceneLighting/>

                            {/* Museum Room */}
                            <EnhancedMuseumRoom/>

                            {/* NFT Frames */}
                            {nfts.map((nft, index) => (
                                <EnhancedNFTFrame
                                    key={nft.tokenId}
                                    nft={nft}
                                    position={nftPositions[index]}
                                    rotation={MuseumService.calculateNFTRotation(index, nfts.length)}
                                    onClick={() => {
                                        // Only allow direct clicks in orbit mode
                                        if (controlMode === CONTROL_MODES.ORBIT && !modalJustClosed) {
                                            handleNFTClick(nft);
                                        }
                                    }}
                                    onHover={(hovered) => {
                                        // Only allow hover in orbit mode
                                        if (controlMode === CONTROL_MODES.ORBIT && !modalJustClosed) {
                                            setHoveredNFT(hovered ? nft.tokenId : null);
                                        }
                                    }}
                                    isHovered={hoveredNFT === nft.tokenId && !modalJustClosed && controlMode === CONTROL_MODES.ORBIT}
                                    enablePhysics={false}
                                />
                            ))}

                            {/* Additional scene objects */}
                            <Suspense fallback={null}>
                                <SceneObjects/>
                            </Suspense>

                            {/* Crosshair Raycaster for First Person Mode */}
                            {controlMode === CONTROL_MODES.FIRST_PERSON && (
                                <CrosshairRaycaster
                                    enabled={!selectedNFT && !modalJustClosed}
                                    onHoverNFT={(tokenId) => setHoveredNFT(tokenId)}
                                    onClickNFT={(nft) => {
                                        if (nft && !modalJustClosed) {
                                            handleNFTClick(nft);
                                        }
                                    }}
                                    nfts={nfts}
                                    interactionMode={isInteractionKeyPressed}
                                />
                            )}

                            {/* Camera Controls */}
                            {controlMode === CONTROL_MODES.ORBIT ? (
                                <OrbitControls
                                    enablePan={!selectedNFT && !modalJustClosed}
                                    enableZoom={!selectedNFT && !modalJustClosed}
                                    enableRotate={!selectedNFT && !modalJustClosed}
                                    minDistance={2}
                                    maxDistance={20}
                                    minPolarAngle={0}
                                    maxPolarAngle={Math.PI / 2}
                                />
                            ) : (
                                <FirstPersonCharacterController
                                    enabled={!selectedNFT && !modalJustClosed}
                                    position={[0, 2.5, 5]}
                                />
                            )}

                            {/* Post-processing effects */}
                            {postProcessingEnabled && (
                                <EffectComposer>
                                    <Bloom
                                        intensity={0.3}
                                        luminanceThreshold={0.95}
                                        luminanceSmoothing={0.9}
                                    />
                                </EffectComposer>
                            )}
                        </PhysicsProvider>

                        {/* Performance stats in development */}
                        {process.env.NODE_ENV === 'development' && <Stats/>}

                        {/* Preload all assets */}
                        <Preload all/>
                    </Suspense>
                </Canvas>

                {/* HUD Overlay */}
                {allImagesLoaded && (
                    <div className="absolute top-4 left-4 text-white pointer-events-none select-none">
                        <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">
                            {collection.name}
                        </h2>
                        <p className="text-sm text-gray-300 drop-shadow">
                            {nfts.length} NFTs
                            • {controlMode === CONTROL_MODES.ORBIT ? 'Orbit Mode' : 'First Person Mode'}
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
                            {controlMode === CONTROL_MODES.FIRST_PERSON && (
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
                {allImagesLoaded && controlMode === CONTROL_MODES.FIRST_PERSON && (
                    <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-4 h-4 border-2 border-white rounded-full bg-white/20"/>
                        {hoveredNFT !== null && isInteractionKeyPressed && (
                            <div
                                className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                                Click to view NFT details
                            </div>
                        )}
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