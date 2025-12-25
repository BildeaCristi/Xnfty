"use client";

import {useEffect, useMemo, useRef, useState} from 'react';
import {CuboidCollider, RigidBody} from '@react-three/rapier';
import {MeshReflectorMaterial} from '@react-three/drei';
import * as THREE from 'three';
import {PhysicsPresets} from '@/providers/PhysicsProvider';
import {MUSEUM_THEMES, QUALITY_LEVELS} from "@/utils/constants/museumConstants";
import {useMuseumStore} from "@/store/MuseumStore";
import {useSceneStore} from "@/store/SceneStore";

interface PBRTextures {
    diffuse: THREE.Texture | null;
    normal: THREE.Texture | null;
    roughness: THREE.Texture | null;
    displacement: THREE.Texture | null;
}

interface MuseumRoomProps {
    width?: number;
    height?: number;
    depth?: number;
}

export default function MuseumRoom({
                                       width = 20,
                                       height = 6,
                                       depth = 20,
                                   }: MuseumRoomProps) {
    const {currentTheme, themeName} = useMuseumStore();
    const {shadowsEnabled, quality} = useSceneStore();
    const groupRef = useRef<THREE.Group>(null);

    // PBR texture states for different surfaces
    const [floorTextures, setFloorTextures] = useState<PBRTextures>({
        diffuse: null, normal: null, roughness: null, displacement: null
    });
    const [wallTextures, setWallTextures] = useState<PBRTextures>({
        diffuse: null, normal: null, roughness: null, displacement: null
    });
    const [loading, setLoading] = useState(true);

    // Texture loading system
    useEffect(() => {
        const loadPBRTextures = async () => {
            setLoading(true);
            const textureLoader = new THREE.TextureLoader();

            const loadTexture = async (path: string): Promise<THREE.Texture | null> => {
                try {
                    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
                        textureLoader.load(path, resolve, undefined, reject);
                    });

                    // Configure texture
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    return texture;
                } catch (error) {
                    return null;
                }
            };

            const loadPBRMaterial = async (basePath: string, textureName: string): Promise<PBRTextures> => {
                const [diffuse, normal, roughness, displacement] = await Promise.all([
                    loadTexture(`${basePath}/${textureName}_diff_2k.jpg`),
                    loadTexture(`${basePath}/${textureName}_nor_gl_2k.exr`),
                    loadTexture(`${basePath}/${textureName}_rough_2k.exr`),
                    loadTexture(`${basePath}/${textureName}_disp_2k.png`)
                ]);

                // Set appropriate repeat for different surfaces
                [diffuse, normal, roughness, displacement].forEach(texture => {
                    if (texture) {
                        texture.repeat.set(width / 4, depth / 4);
                        if (quality === 'medium') {
                            texture.anisotropy = 4;
                        }
                    }
                });

                return {diffuse, normal, roughness, displacement};
            };

            try {
                // Load theme-specific textures
                switch (themeName) {
                    case MUSEUM_THEMES.CLASSIC:
                        const classicalFloor = await loadTexture(
                            '/textures/classical-theme/marble_floor_2k.jpg'
                        );
                        if (classicalFloor) {
                            classicalFloor.repeat.set(width / 4, depth / 4);
                            if (quality === 'medium') {
                                classicalFloor.anisotropy = 8;
                            }
                            setFloorTextures({
                                diffuse: classicalFloor,
                                normal: null,
                                roughness: null,
                                displacement: null
                            });
                        }

                        const plasterWall = await loadTexture('/textures/classical-theme/white_plaster_02_2k.blend/textures/white_plaster_02_diff_2k.jpg');
                        if (plasterWall) {
                            plasterWall.repeat.set(2, 1);
                            setWallTextures({diffuse: plasterWall, normal: null, roughness: null, displacement: null});
                        }
                        break;

                    case MUSEUM_THEMES.MODERN:
                        const concreteTextures = await loadPBRMaterial(
                            '/textures/modern-theme/concrete_floor_painted_2k.blend/textures',
                            'concrete_floor_painted'
                        );
                        setFloorTextures(concreteTextures);

                        const woodTextures = await loadPBRMaterial(
                            '/textures/modern-theme/wood_floor_2k.blend/textures',
                            'wood_floor'
                        );
                        // Use wood for walls in modern theme
                        if (woodTextures.diffuse) {
                            woodTextures.diffuse.repeat.set(2, 1);
                            woodTextures.normal?.repeat.set(2, 1);
                            woodTextures.roughness?.repeat.set(2, 1);
                        }
                        setWallTextures(woodTextures);
                        break;

                    case MUSEUM_THEMES.FUTURISTIC:
                        break;

                    case MUSEUM_THEMES.NATURE:
                        break;

                    default:
                        break;
                }

            } catch (error) {
                // Texture loading failed, continue with defaults
            }

            setLoading(false);
        };

        loadPBRTextures();
    }, [themeName, quality, width, depth]);

    // Create material with PBR textures
    const createPBRMaterial = (textures: PBRTextures, baseColor: string, baseRoughness: number, baseMetalness: number) => {
        const materialProps: any = {
            color: textures.diffuse ? '#ffffff' : baseColor,
            map: textures.diffuse,
            normalMap: textures.normal,
            roughnessMap: textures.roughness,
            displacementMap: textures.displacement,
            roughness: baseRoughness,
            metalness: baseMetalness,
            envMapIntensity: 0.5,
            side: THREE.DoubleSide,
        };

        if (textures.displacement) {
            materialProps.displacementScale = 0.1;
        }

        return new THREE.MeshStandardMaterial(materialProps);
    };

    // Enhanced floor material with PBR support
    const floorMaterial = useMemo(() => {
        if (!floorTextures.diffuse && !loading) {
            // Fallback material when no texture is loaded
            return new THREE.MeshStandardMaterial({
                color: currentTheme.room.floorColor,
                roughness: currentTheme.room.floorRoughness,
                metalness: currentTheme.room.floorMetalness,
            });
        }

        const baseProps: any = {
            color: floorTextures.diffuse ? '#ffffff' : currentTheme.room.floorColor,
            map: floorTextures.diffuse,
            normalMap: floorTextures.normal,
            roughnessMap: floorTextures.roughness,
            displacementMap: floorTextures.displacement,
            roughness: currentTheme.room.floorRoughness,
            metalness: currentTheme.room.floorMetalness,
        };

        // Theme-specific enhancements
        switch (themeName) {
            case MUSEUM_THEMES.CLASSIC:
                baseProps.roughness = floorTextures.roughness ? 0.2 : 0.1;
                baseProps.metalness = 0.0;
                break;
            case MUSEUM_THEMES.MODERN:
                baseProps.roughness = floorTextures.roughness ? 0.4 : 0.3;
                baseProps.metalness = 0.1;
                break;
            case MUSEUM_THEMES.FUTURISTIC:
                baseProps.roughness = 0.1;
                baseProps.metalness = 0.8;
                baseProps.emissive = new THREE.Color('#001122');
                baseProps.emissiveIntensity = 0.02;
                break;
            case MUSEUM_THEMES.NATURE:
                baseProps.roughness = 0.8;
                baseProps.metalness = 0.0;
                break;
        }

        if (floorTextures.displacement) {
            baseProps.displacementScale = 0.1;
        }

        return new THREE.MeshStandardMaterial(baseProps);
    }, [floorTextures, currentTheme, themeName, loading]);

    // Wall material with PBR support
    const wallMaterial = useMemo(() => {
        return createPBRMaterial(
            wallTextures,
            currentTheme.room.wallColor,
            currentTheme.room.wallRoughness,
            currentTheme.room.wallMetalness
        );
    }, [wallTextures, currentTheme]);

    // Ceiling material
    const ceilingMaterial = useMemo(() => {
        const baseProps: any = {
            color: currentTheme.room.ceilingColor,
            roughness: 0.9,
            metalness: 0.1,
        };

        // Theme-specific ceiling enhancements
        switch (themeName) {
            case MUSEUM_THEMES.FUTURISTIC:
                baseProps.roughness = 0.2;
                baseProps.metalness = 0.3;
                baseProps.emissive = new THREE.Color('#000022');
                baseProps.emissiveIntensity = 0.01;
                break;
            case MUSEUM_THEMES.MODERN:
                baseProps.roughness = 0.3;
                baseProps.metalness = 0.1;
                break;
        }

        return new THREE.MeshStandardMaterial(baseProps);
    }, [currentTheme, themeName]);

    return (
        <group ref={groupRef}>
            {/* Floor with physics and enhanced materials */}
            <RigidBody {...PhysicsPresets.static()}>
                <mesh
                    position={[0, 0, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    receiveShadow={shadowsEnabled}
                >
                    <planeGeometry args={[width, depth, 32, 32]}/>
                    {quality === 'medium' && floorTextures.diffuse ? (
                        <MeshReflectorMaterial
                            color={currentTheme.room.floorColor}
                            roughness={currentTheme.room.floorRoughness}
                            metalness={currentTheme.room.floorMetalness}
                            mirror={0.3}
                            mixBlur={1}
                            mixStrength={0.5}
                            blur={[512, 512]}
                            resolution={1024}
                            depthScale={1}
                            minDepthThreshold={0.8}
                            maxDepthThreshold={1}
                            depthToBlurRatioBias={0.2}
                            map={floorTextures.diffuse}
                            normalMap={floorTextures.normal}
                            roughnessMap={floorTextures.roughness}
                            distortion={0.01}
                        />
                    ) : (
                        <primitive object={floorMaterial}/>
                    )}
                </mesh>
                <CuboidCollider args={[width / 2, 0.1, depth / 2]} position={[0, -0.1, 0]}/>
            </RigidBody>

            {/* Walls with physics and PBR materials */}
            {/* Front Wall */}
            <RigidBody {...PhysicsPresets.static()} position={[0, height / 2, -depth / 2]}>
                <mesh
                    castShadow={shadowsEnabled}
                    receiveShadow={shadowsEnabled}
                >
                    <planeGeometry args={[width, height]}/>
                    <primitive object={wallMaterial}/>
                </mesh>
                <CuboidCollider args={[width / 2, height / 2, 0.1]}/>
            </RigidBody>

            {/* Back Wall */}
            <RigidBody {...PhysicsPresets.static()} position={[0, height / 2, depth / 2]}>
                <mesh
                    rotation={[0, Math.PI, 0]}
                    castShadow={shadowsEnabled}
                    receiveShadow={shadowsEnabled}
                >
                    <planeGeometry args={[width, height]}/>
                    <primitive object={wallMaterial.clone()}/>
                </mesh>
                <CuboidCollider args={[width / 2, height / 2, 0.1]}/>
            </RigidBody>

            {/* Left Wall */}
            <RigidBody {...PhysicsPresets.static()} position={[-width / 2, height / 2, 0]}>
                <mesh
                    rotation={[0, Math.PI / 2, 0]}
                    castShadow={shadowsEnabled}
                    receiveShadow={shadowsEnabled}
                >
                    <planeGeometry args={[depth, height]}/>
                    <primitive object={wallMaterial.clone()}/>
                </mesh>
                <CuboidCollider args={[0.1, height / 2, depth / 2]}/>
            </RigidBody>

            {/* Right Wall */}
            <RigidBody {...PhysicsPresets.static()} position={[width / 2, height / 2, 0]}>
                <mesh
                    rotation={[0, -Math.PI / 2, 0]}
                    castShadow={shadowsEnabled}
                    receiveShadow={shadowsEnabled}
                >
                    <planeGeometry args={[depth, height]}/>
                    <primitive object={wallMaterial.clone()}/>
                </mesh>
                <CuboidCollider args={[0.1, height / 2, depth / 2]}/>
            </RigidBody>

            {/* Ceiling with enhanced materials */}
            <RigidBody {...PhysicsPresets.static()}>
                <mesh
                    position={[0, height, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                    receiveShadow={shadowsEnabled}
                >
                    <planeGeometry args={[width, depth]}/>
                    <primitive object={ceilingMaterial}/>
                </mesh>
                <CuboidCollider args={[width / 2, 0.1, depth / 2]} position={[0, 0.1, 0]}/>
            </RigidBody>

            {/* architectural details */}
            {quality === QUALITY_LEVELS.MEDIUM && (
                <>
                    <group>
                        {/* Front baseboard */}
                        <mesh position={[0, 0.15, -depth / 2 + 0.05]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[width, 0.3, 0.1]}/>
                            <meshStandardMaterial
                                color="#2a2a2a"
                                roughness={themeName === MUSEUM_THEMES.MODERN ? 0.3 : 0.8}
                                metalness={themeName === MUSEUM_THEMES.MODERN || themeName === MUSEUM_THEMES.FUTURISTIC ? 0.4 : 0.1}
                            />
                        </mesh>
                        {/* Back baseboard */}
                        <mesh position={[0, 0.15, depth / 2 - 0.05]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[width, 0.3, 0.1]}/>
                            <meshStandardMaterial
                                color="#2a2a2a"
                                roughness={themeName === MUSEUM_THEMES.MODERN ? 0.3 : 0.8}
                                metalness={themeName === MUSEUM_THEMES.MODERN || themeName === MUSEUM_THEMES.FUTURISTIC ? 0.4 : 0.1}
                            />
                        </mesh>
                        {/* Left baseboard */}
                        <mesh position={[-width / 2 + 0.05, 0.15, 0]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[0.1, 0.3, depth]}/>
                            <meshStandardMaterial
                                color="#2a2a2a"
                                roughness={themeName === MUSEUM_THEMES.MODERN ? 0.3 : 0.8}
                                metalness={themeName === MUSEUM_THEMES.MODERN || themeName === MUSEUM_THEMES.FUTURISTIC ? 0.4 : 0.1}
                            />
                        </mesh>
                        {/* Right baseboard */}
                        <mesh position={[width / 2 - 0.05, 0.15, 0]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[0.1, 0.3, depth]}/>
                            <meshStandardMaterial
                                color="#2a2a2a"
                                roughness={themeName === MUSEUM_THEMES.MODERN ? 0.3 : 0.8}
                                metalness={themeName === MUSEUM_THEMES.MODERN || themeName === MUSEUM_THEMES.FUTURISTIC ? 0.4 : 0.1}
                            />
                        </mesh>
                    </group>

                    {/* Crown molding with enhanced materials */}
                    <group>
                        {/* Front crown */}
                        <mesh position={[0, height - 0.15, -depth / 2 + 0.05]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[width, 0.3, 0.1]}/>
                            <meshStandardMaterial
                                color="#f0f0f0"
                                roughness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.2 : 0.7}
                                metalness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.8 : 0.1}
                                emissive={themeName === MUSEUM_THEMES.FUTURISTIC ? new THREE.Color('#001144') : new THREE.Color('#000000')}
                                emissiveIntensity={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.02 : 0}
                            />
                        </mesh>
                        {/* Back crown */}
                        <mesh position={[0, height - 0.15, depth / 2 - 0.05]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[width, 0.3, 0.1]}/>
                            <meshStandardMaterial
                                color="#f0f0f0"
                                roughness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.2 : 0.7}
                                metalness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.8 : 0.1}
                                emissive={themeName === MUSEUM_THEMES.FUTURISTIC ? new THREE.Color('#001144') : new THREE.Color('#000000')}
                                emissiveIntensity={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.02 : 0}
                            />
                        </mesh>
                        {/* Left crown */}
                        <mesh position={[-width / 2 + 0.05, height - 0.15, 0]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[0.1, 0.3, depth]}/>
                            <meshStandardMaterial
                                color="#f0f0f0"
                                roughness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.2 : 0.7}
                                metalness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.8 : 0.1}
                                emissive={themeName === MUSEUM_THEMES.FUTURISTIC ? new THREE.Color('#001144') : new THREE.Color('#000000')}
                                emissiveIntensity={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.02 : 0}
                            />
                        </mesh>
                        {/* Right crown */}
                        <mesh position={[width / 2 - 0.05, height - 0.15, 0]} castShadow={shadowsEnabled}>
                            <boxGeometry args={[0.1, 0.3, depth]}/>
                            <meshStandardMaterial
                                color="#f0f0f0"
                                roughness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.2 : 0.7}
                                metalness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.8 : 0.1}
                                emissive={themeName === MUSEUM_THEMES.FUTURISTIC ? new THREE.Color('#001144') : new THREE.Color('#000000')}
                                emissiveIntensity={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.02 : 0}
                            />
                        </mesh>
                    </group>
                </>
            )}

            {/* Loading indicator */}
            {loading && (
                <mesh position={[0, 0.1, 0]}>
                    <planeGeometry args={[2, 0.5]}/>
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.8}/>
                </mesh>
            )}
        </group>
    );
} 