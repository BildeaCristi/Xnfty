"use client";

import {useEffect, useMemo, useRef} from 'react';
import {CuboidCollider, RigidBody} from '@react-three/rapier';
import {Float, Text} from '@react-three/drei';
import * as THREE from 'three';
import {animated, useSpring} from '@react-spring/three';
import {NFT} from '@/types/blockchain';
import {useMuseumStore} from '@/store/MuseumStore';
import {useSceneStore} from '@/store/SceneStore';
import {PhysicsPresets} from '@/providers/PhysicsProvider';
import {useIPFSImage} from '@/hooks/useIPFSImage';

interface EnhancedNFTFrameProps {
    nft: NFT;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    interactive?: boolean;
    onClick?: () => void;
    onHover?: (hovered: boolean) => void;
    isHovered?: boolean;
    enablePhysics?: boolean;
}

export default function NFTFrame({
                                     nft,
                                     position,
                                     rotation = [0, 0, 0],
                                     scale = 1,
                                     interactive = true,
                                     onClick,
                                     onHover,
                                     isHovered = false,
                                     enablePhysics = false,
                                 }: EnhancedNFTFrameProps) {
    const frameRef = useRef<THREE.Group>(null);
    const {currentTheme} = useMuseumStore();
    const {quality, shadowsEnabled} = useSceneStore();

    const {texture, loading, error, progress, originalUrl, resolvedUrl} = useIPFSImage(nft.imageURI, {
        quality,
        timeout: 20000,
    });

    // Frame animation
    const [springs, api] = useSpring(() => ({
        scale: 1,
        frameColor: currentTheme.frame.defaultColor,
        glowIntensity: 0,
        rotation: [0, 0, 0],
        config: {
            mass: 1,
            tension: 280,
            friction: 60,
        },
    }));

    // Hover effects
    useEffect(() => {
        if (isHovered) {
            api.start({
                scale: 1.05,
                frameColor: currentTheme.frame.hoverColor,
                glowIntensity: 0.5,
            });
        } else {
            api.start({
                scale: 1,
                frameColor: currentTheme.frame.defaultColor,
                glowIntensity: 0,
            });
        }
    }, [isHovered, api, currentTheme]);

    // Calculate frame dimensions based on image aspect ratio
    const frameSize = useMemo(() => {
        if (texture?.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            const baseSize = 2;
            return {
                width: aspectRatio > 1 ? baseSize : baseSize * aspectRatio,
                height: aspectRatio > 1 ? baseSize / aspectRatio : baseSize,
            };
        }
        return {width: 2, height: 2};
    }, [texture]);

    // Create NFT material with proper settings
    const nftMaterial = useMemo(() => {
        if (loading) {
            // Loading state material
            return new THREE.MeshStandardMaterial({
                color: '#333333',
                emissive: 0x000000,
                roughness: 0.8,
                metalness: 0.1,
                transparent: true,
                opacity: 0.7,
            });
        }

        if (error || !texture) {
            return new THREE.MeshStandardMaterial({
                color: '#444444',
                emissive: 0x220000,
                emissiveIntensity: 0.02,
                roughness: 0.9,
                metalness: 0.0,
                transparent: true,
                opacity: 0.8,
            });
        }

        // Successfully loaded texture
        return new THREE.MeshStandardMaterial({
            map: texture,
            emissive: 0x000000,
            roughness: 0.1,
            metalness: 0.0,
            transparent: false,
        });
    }, [texture, loading, error, quality]);

    // Create frame content
    const frameContent = (
        <animated.group
            ref={frameRef}
            scale={springs.scale.to((s: number) => s * scale)}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                onHover?.(true);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                onHover?.(false);
            }}
            userData={{
                interactive: true,
                tooltip: nft.name,
                tokenId: nft.tokenId,
                type: 'nft-frame'
            }}
        >
            {/* Frame border */}
            <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                <boxGeometry args={[
                    frameSize.width + 0.2,
                    frameSize.height + 0.2,
                    0.1
                ]}/>
                <animated.meshStandardMaterial
                    color={springs.frameColor}
                    metalness={currentTheme.frame.metalness}
                    roughness={currentTheme.frame.roughness}
                    envMapIntensity={1}
                />
            </mesh>

            {/* Inner frame (matting) */}
            <mesh position={[0, 0, 0.051]}>
                <planeGeometry args={[
                    frameSize.width + 0.1,
                    frameSize.height + 0.1
                ]}/>
                <meshStandardMaterial
                    color="#1a1a1a"
                    roughness={0.9}
                />
            </mesh>

            {/* NFT Image */}
            <mesh position={[0, 0, 0.052]}>
                <planeGeometry args={[frameSize.width, frameSize.height]}/>
                <primitive object={nftMaterial} attach="material"/>
            </mesh>

            {/* Loading Progress Indicator */}
            {loading && (
                <group position={[0, 0, 0.053]}>
                    {/* Loading background */}
                    <mesh>
                        <planeGeometry args={[frameSize.width * 0.9, frameSize.height * 0.9]}/>
                        <meshBasicMaterial color="#000000" transparent opacity={0.8}/>
                    </mesh>

                    {/* Progress bar background */}
                    <mesh position={[0, -frameSize.height * 0.3, 0.001]}>
                        <planeGeometry args={[frameSize.width * 0.8, 0.05]}/>
                        <meshBasicMaterial color="#333333"/>
                    </mesh>

                    {/* Progress bar fill */}
                    <mesh position={[
                        -(frameSize.width * 0.8) / 2 + (frameSize.width * 0.8 * progress) / 200,
                        -frameSize.height * 0.3,
                        0.002
                    ]}>
                        <planeGeometry args={[(frameSize.width * 0.8 * progress) / 100, 0.05]}/>
                        <meshBasicMaterial color="#4a90e2"/>
                    </mesh>

                    {/* Loading text */}
                    <Text
                        position={[0, 0, 0.001]}
                        fontSize={0.12}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        maxWidth={frameSize.width - 0.2}
                    >
                        Loading NFT...
                    </Text>

                    {/* Progress percentage */}
                    <Text
                        position={[0, -frameSize.height * 0.15, 0.001]}
                        fontSize={0.08}
                        color="#aaaaaa"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {progress}%
                    </Text>
                </group>
            )}

            {/* Error State Indicator */}
            {error && !loading && (
                <group position={[0, 0, 0.053]}>
                    {/* Error background */}
                    <mesh>
                        <planeGeometry args={[frameSize.width * 0.9, frameSize.height * 0.9]}/>
                        <meshBasicMaterial color="#220000" transparent opacity={0.8}/>
                    </mesh>

                    {/* Error icon (simple X) */}
                    <group position={[0, frameSize.height * 0.1, 0.001]}>
                        <mesh rotation={[0, 0, Math.PI / 4]}>
                            <planeGeometry args={[0.3, 0.05]}/>
                            <meshBasicMaterial color="#ff4444"/>
                        </mesh>
                        <mesh rotation={[0, 0, -Math.PI / 4]}>
                            <planeGeometry args={[0.3, 0.05]}/>
                            <meshBasicMaterial color="#ff4444"/>
                        </mesh>
                    </group>

                    {/* Error text */}
                    <Text
                        position={[0, -frameSize.height * 0.1, 0.001]}
                        fontSize={0.1}
                        color="#ff6666"
                        anchorX="center"
                        anchorY="middle"
                        maxWidth={frameSize.width - 0.2}
                    >
                        Failed to load
                    </Text>

                    {/* Error details */}
                    <Text
                        position={[0, -frameSize.height * 0.25, 0.001]}
                        fontSize={0.06}
                        color="#888888"
                        anchorX="center"
                        anchorY="middle"
                        maxWidth={frameSize.width - 0.1}
                    >
                        {error.length > 50 ? `${error.substring(0, 47)}...` : error}
                    </Text>
                </group>
            )}

            {/* Glass cover */}
            {quality === 'medium' && (
                <mesh position={[0, 0, 0.06]}>
                    <planeGeometry args={[frameSize.width, frameSize.height]}/>
                    <meshPhysicalMaterial
                        transparent
                        transmission={0.9}
                        thickness={0.1}
                        roughness={0}
                        metalness={0}
                        clearcoat={1}
                        clearcoatRoughness={0}
                    />
                </mesh>
            )}

            {/* NFT Info label */}
            <group position={[0, -(frameSize.height / 2) - 0.3, 0.1]}>
                <mesh>
                    <planeGeometry args={[frameSize.width, 0.3]}/>
                    <meshStandardMaterial
                        color="#000000"
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
                <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.12}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={frameSize.width - 0.1}
                >
                    {nft.name}
                </Text>
                <Text
                    position={[0, -0.1, 0.01]}
                    fontSize={0.08}
                    color="#888888"
                    anchorX="center"
                    anchorY="middle"
                >
                    #{nft.tokenId}
                </Text>
            </group>

            {/* Interactive indicator */}
            {quality !== 'low' && (
                <Float
                    speed={2}
                    rotationIntensity={0.2}
                    floatIntensity={0.2}
                    floatingRange={[-0.05, 0.05]}
                >
                    <mesh position={[frameSize.width / 2 - 0.2, frameSize.height / 2 - 0.2, 0.1]}>
                        <sphereGeometry args={[0.08, 16, 16]}/>
                        <meshBasicMaterial
                            color="#4a90e2"
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                </Float>
            )}
        </animated.group>
    );

    // Regular positioning
    return (
        <RigidBody {...PhysicsPresets.static()} position={position} rotation={rotation}>
            {frameContent}
            <CuboidCollider args={[
                (frameSize.width + 0.2) / 2,
                (frameSize.height + 0.2) / 2,
                0.1
            ]}/>
        </RigidBody>
    );
} 