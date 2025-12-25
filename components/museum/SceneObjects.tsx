"use client";

import {useEffect, useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {BallCollider, CuboidCollider, RigidBody} from '@react-three/rapier';
import {Float} from '@react-three/drei';
import * as THREE from 'three';
import {useSceneStore} from '@/store/SceneStore';
import {useMuseumStore} from '@/store/MuseumStore';
import {PhysicsPresets} from '@/providers/PhysicsProvider';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {MUSEUM_THEMES, QUALITY_LEVELS} from '@/utils/constants/museumConstants';

export default function SceneObjects() {
    const {quality} = useSceneStore();
    const {themeName} = useMuseumStore();

    if (quality === QUALITY_LEVELS.LOW) return null;

    return (
        <group name="scene-objects">
            {/* Theme-specific content with full asset integration */}
            {themeName === MUSEUM_THEMES.CLASSIC && <ClassicThemeObjects/>}
            {themeName === MUSEUM_THEMES.MODERN && <ModernThemeObjects/>}
            {themeName === MUSEUM_THEMES.FUTURISTIC && <FuturisticThemeObjects/>}
            {themeName === MUSEUM_THEMES.NATURE && <NatureThemeObjects/>}

            {/* Universal objects that appear in all themes */}
            <CenterPedestal/>
        </group>
    );
}

// === CLASSIC THEME ===
function ClassicThemeObjects() {
    const {quality} = useSceneStore();

    return (
        <group name="classical-theme">
            {/* Classical Sculptures with Physics */}
            <ClassicalSculptures/>

            {/* Classical Columns */}
            <ClassicalColumns/>
        </group>
    );
}

// === MODERN THEME ===
function ModernThemeObjects() {
    return (
        <group name="modern-theme">
            {/* Modern Furniture from assets */}
            <ModernFurniture/>

            {/* Minimalist Decorations */}
            <MinimalistDecorations/>

        </group>
    );
}

// === FUTURISTIC THEME
function FuturisticThemeObjects() {
    return (
        <group name="futuristic-theme">
            {/* Futuristic Furniture from assets */}
            <FuturisticFurniture/>

            {/* Glowing Decorations */}
            <GlowingDecorations/>
        </group>
    );
}

// === NATURE THEME ===
function NatureThemeObjects() {
    return (
        <group name="nature-theme">
            {/* Natural Plants and Trees from assets */}
            <NaturalPlants/>

            {/* Wooden Furniture */}
            <WoodenFurniture/>

            {/* Stone Elements */}
            <StoneElements/>
        </group>
    );
}

// === CLASSICAL SCULPTURES WITH PHYSICS ===
function ClassicalSculptures() {
    const {shadowsEnabled, quality} = useSceneStore();
    const [drapeWomanModel, setDrapeWomanModel] = useState<THREE.Group | null>(null);
    const [fallenAngelModel, setFallenAngelModel] = useState<THREE.Group | null>(null);

    useEffect(() => {
        const loader = new GLTFLoader();

        // Load draped woman sculpture
        loader.load(
            '/models/classical-theme/slanke_met_lang_kleed_gedrapeerde_jonge_vrouw.glb',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                        // Apply classical marble material
                        if (child.material instanceof THREE.Material) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: '#f5f5f5',
                                roughness: 0.3,
                                metalness: 0.1,
                                emissive: 0x000000,
                            });
                        }
                    }
                });
                setDrapeWomanModel(model);
            },
            undefined,
            (error) => {
                // Model not found, continue without it
            }
        );

        // Load fallen angel sculpture
        loader.load(
            '/models/classical-theme/the_fallen_angel_alexandre_cabanel.glb',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                        // Apply classical marble material
                        if (child.material instanceof THREE.Material) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: '#f8f8f0',
                                roughness: 0.4,
                                metalness: 0.1,
                                emissive: 0x000000,
                            });
                        }
                    }
                });
                setFallenAngelModel(model);
            },
            undefined,
            (error) => {
                // Model not found, continue without it
            }
        );
    }, [shadowsEnabled]);

    return (
        <>
            {/* Draped Woman Sculpture - positioned above floor */}
            {drapeWomanModel && (
                <RigidBody {...PhysicsPresets.static()} position={[-6, 0.1, -3]}>
                    <primitive
                        object={drapeWomanModel.clone()}
                        scale={0.8}
                    />
                    <CuboidCollider args={[0.5, 1.5, 0.5]} position={[0, 0.75, 0]}/>
                </RigidBody>
            )}

            {/* Fallen Angel Sculpture - positioned above floor */}
            {fallenAngelModel && (
                <RigidBody {...PhysicsPresets.static()} position={[6, 0.1, 3]}>
                    <primitive
                        object={fallenAngelModel.clone()}
                        scale={0.8}
                        rotation={[0, Math.PI, 0]}
                    />
                    <CuboidCollider args={[0.6, 1.2, 0.6]} position={[0, 0.6, 0]}/>
                </RigidBody>
            )}
        </>
    );
}

// === CLASSICAL COLUMNS ===
function ClassicalColumns() {
    const {shadowsEnabled} = useSceneStore();
    const [columnModel, setColumnModel] = useState<THREE.Group | null>(null);

    useEffect(() => {
        const loader = new GLTFLoader();

        loader.load(
            '/models/classical-theme/greek_underwater_column_5.glb',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                        // Apply classical stone material
                        if (child.material instanceof THREE.Material) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: '#e8e8e8',
                                roughness: 0.6,
                                metalness: 0.1,
                            });
                        }
                    }
                });
                setColumnModel(model);
            },
            undefined,
            (error) => {
                // Model not found, continue without it
            }
        );
    }, [shadowsEnabled]);

    const columnPositions: [number, number, number][] = [
        [-8, 0.1, -8],
        [8, 0.1, -8],
        [-8, 0.1, 8],
        [8, 0.1, 8],
    ];

    return (
        <>
            {columnModel && columnPositions.map((position, index) => (
                <RigidBody key={`column-${index}`} {...PhysicsPresets.static()} position={position}>
                    <primitive
                        object={columnModel.clone()}
                        scale={1.5}
                    />
                    <CuboidCollider args={[0.4, 2.5, 0.4]} position={[0, 1.2, 0]}/>
                </RigidBody>
            ))}
        </>
    );
}


// === MODERN FURNITURE ===
function ModernFurniture() {
    const {shadowsEnabled} = useSceneStore();
    const [sofaModel, setSofaModel] = useState<THREE.Group | null>(null);
    const [furnitureModel, setFurnitureModel] = useState<THREE.Group | null>(null);

    useEffect(() => {
        const loader = new GLTFLoader();

        // Load modern gray sofa
        loader.load(
            '/models/modern-theme/modern_gray_sofa__3d_model.glb',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                    }
                });
                setSofaModel(model);
            },
            undefined,
            (error) => console.log('Modern sofa not found:', error)
        );

        // Load modern furniture set
        loader.load(
            '/models/modern-theme/furniture__no-20.glb',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                    }
                });
                setFurnitureModel(model);
            },
            undefined,
            (error) => console.log('Modern furniture not found:', error)
        );
    }, [shadowsEnabled]);

    return (
        <>
            {/* Modern Gray Sofa - positioned above floor */}
            {sofaModel && (
                <RigidBody {...PhysicsPresets.static()} position={[-6, 0.1, 0]}>
                    <primitive
                        object={sofaModel.clone()}
                        scale={1.2}
                    />
                    <CuboidCollider args={[1.5, 0.8, 0.8]} position={[0, 0.4, 0]}/>
                </RigidBody>
            )}

            {/* Modern Furniture Set - positioned above floor */}
            {furnitureModel && (
                <RigidBody {...PhysicsPresets.static()} position={[6, 0.1, 0]}>
                    <primitive
                        object={furnitureModel.clone()}
                        scale={0.8}
                    />
                    <CuboidCollider args={[1.2, 0.6, 1.2]} position={[0, 0.3, 0]}/>
                </RigidBody>
            )}

            {/* Modern Minimalist Benches */}
            <RigidBody {...PhysicsPresets.static()} position={[0, 0.35, 6]}>
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[3, 0.4, 0.6]}/>
                    <meshStandardMaterial
                        color="#2a2a2a"
                        roughness={0.1}
                        metalness={0.8}
                    />
                </mesh>
                <CuboidCollider args={[1.5, 0.2, 0.3]}/>
            </RigidBody>
        </>
    );
}

// === FUTURISTIC FURNITURE ===
function FuturisticFurniture() {
    const {shadowsEnabled} = useSceneStore();
    const [sofaModel, setSofaModel] = useState<THREE.Group | null>(null);

    useEffect(() => {
        const loader = new GLTFLoader();

        loader.load(
            '/models/cyber-theme/futuristic_reddish_sofa.glb',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                    }
                });
                setSofaModel(model);
            },
            undefined,
            (error) => {
                // Model not found, continue without it
            }
        );
    }, [shadowsEnabled]);

    return (
        <>
            {/* Futuristic Sofa - positioned above floor */}
            {sofaModel && (
                <RigidBody {...PhysicsPresets.static()} position={[0, 0.1, 6]}>
                    <primitive
                        object={sofaModel.clone()}
                        scale={1}
                        rotation={[0, Math.PI, 0]}
                    />
                    <CuboidCollider args={[1.5, 0.8, 0.8]} position={[0, 0.4, 0]}/>
                </RigidBody>
            )}

            {/* Futuristic Platform Benches */}
            <RigidBody {...PhysicsPresets.static()} position={[-6, 0.2, 4]}>
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <cylinderGeometry args={[1.5, 1.8, 0.4, 16]}/>
                    <meshStandardMaterial
                        color="#1a1a2e"
                        roughness={0.1}
                        metalness={0.9}
                        emissive="#0f3460"
                        emissiveIntensity={0.02}
                    />
                </mesh>
                <CuboidCollider args={[1.5, 0.2, 1.5]}/>
            </RigidBody>

            <RigidBody {...PhysicsPresets.static()} position={[6, 0.2, -4]}>
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <cylinderGeometry args={[1.2, 1.5, 0.4, 16]}/>
                    <meshStandardMaterial
                        color="#2e1a1a"
                        roughness={0.1}
                        metalness={0.9}
                        emissive="#602e0f"
                        emissiveIntensity={0.02}
                    />
                </mesh>
                <CuboidCollider args={[1.2, 0.2, 1.2]}/>
            </RigidBody>
        </>
    );
}

// === NATURAL PLANTS ===
function NaturalPlants() {
    const {shadowsEnabled, quality} = useSceneStore();
    const [ficusModel, setFicusModel] = useState<THREE.Group | null>(null);
    const [pottedPlantModel, setPottedPlantModel] = useState<THREE.Group | null>(null);

    useEffect(() => {
        const loader = new GLTFLoader();

        // Load ficus bonsai
        loader.load(
            '/models/garden-theme/ficus_bonsai/scene.gltf',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                    }
                });
                setFicusModel(model);
            },
            undefined,
            (error) => console.log('Ficus model not found:', error)
        );

        // Load potted plant
        loader.load(
            '/models/garden-theme/potted_plant/scene.gltf',
            (gltf) => {
                const model = gltf.scene.clone();
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = shadowsEnabled;
                        child.receiveShadow = shadowsEnabled;
                    }
                });
                setPottedPlantModel(model);
            },
            undefined,
            (error) => console.log('Potted plant model not found:', error)
        );
    }, [shadowsEnabled]);

    const plantPositions: [number, number, number][] = [
        [-7, 0.1, -7],
        [7, 0.1, -7],
        [-7, 0.1, 7],
        [7, 0.1, 7],
        [-3, 0.1, -7],
        [3, 0.1, 7],
        [0, 0.1, -8],
        [0, 0.1, 8],
    ];

    return (
        <>
            {plantPositions.map((position, index) => (
                <RigidBody key={`plant-${index}`} {...PhysicsPresets.static()} position={position}>
                    {(index % 2 === 0 ? ficusModel : pottedPlantModel) ? (
                        <primitive
                            object={(index % 2 === 0 ? ficusModel : pottedPlantModel)!.clone()}
                            scale={index % 2 === 0 ? 0.02 : 0.5}
                        />
                    ) : (
                        // Fallback simple plant
                        <>
                            <mesh position={[0, 0.3, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                                <cylinderGeometry args={[0.3, 0.25, 0.5, 12]}/>
                                <meshStandardMaterial color="#8b4513" roughness={0.9}/>
                            </mesh>
                            <mesh position={[0, 0.8, 0]} castShadow={shadowsEnabled}>
                                <sphereGeometry args={[0.4, 12, 8]}/>
                                <meshStandardMaterial color="#228b22" roughness={0.8}/>
                            </mesh>
                        </>
                    )}
                    <CuboidCollider args={[0.3, 0.5, 0.3]} position={[0, 0.25, 0]}/>
                </RigidBody>
            ))}
        </>
    );
}


// === CENTER PEDESTAL (Universal) ===
function CenterPedestal() {
    const sculptureRef = useRef<THREE.Group>(null);
    const {shadowsEnabled} = useSceneStore();
    const {themeName} = useMuseumStore();
    const [statueModel, setStatueModel] = useState<THREE.Group | null>(null);

    // Load theme-appropriate center piece
    useEffect(() => {
        if (themeName === MUSEUM_THEMES.CLASSIC) {
            const loader = new GLTFLoader();
            loader.load(
                '/models/classical-theme/hebe_goddess_of_youth/scene.gltf',
                (gltf) => {
                    const model = gltf.scene.clone();
                    model.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = shadowsEnabled;
                            child.receiveShadow = shadowsEnabled;
                        }
                    });
                    setStatueModel(model);
                },
                undefined,
                (error) => console.log('Hebe statue not found, using default')
            );
        }
    }, [shadowsEnabled, themeName]);

    useFrame((state) => {
        if (sculptureRef.current) {
            sculptureRef.current.rotation.y = state.clock.elapsedTime * 0.2;
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Pedestal base - positioned above floor */}
            <RigidBody {...PhysicsPresets.static()} position={[0, 0.1, 0]}>
                <mesh position={[0, 0.5, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <cylinderGeometry args={[1.5, 2, 1, 32]}/>
                    <meshStandardMaterial
                        color={themeName === MUSEUM_THEMES.CLASSIC ? "#3a3a3a" : "#2a2a2a"}
                        roughness={0.3}
                        metalness={0.7}
                    />
                </mesh>
                <CuboidCollider args={[1.5, 0.5, 1.5]}/>
            </RigidBody>

            {/* Rotating center piece */}
            <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
                <group ref={sculptureRef} position={[0, 2, 0]}>
                    {statueModel && themeName === MUSEUM_THEMES.CLASSIC ? (
                        <primitive
                            object={statueModel}
                            scale={0.01}
                            castShadow={shadowsEnabled}
                            receiveShadow={shadowsEnabled}
                        />
                    ) : (
                        <mesh castShadow={shadowsEnabled}>
                            <torusKnotGeometry args={[0.6, 0.2, 128, 32]}/>
                            <meshStandardMaterial
                                color={themeName === MUSEUM_THEMES.FUTURISTIC ? "#4a90e2" : "#8b4513"}
                                metalness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.9 : 0.3}
                                roughness={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.1 : 0.7}
                                emissive={themeName === MUSEUM_THEMES.FUTURISTIC ? "#1a4480" : "#000000"}
                                emissiveIntensity={themeName === MUSEUM_THEMES.FUTURISTIC ? 0.05 : 0}
                            />
                        </mesh>
                    )}
                </group>
            </Float>
        </group>
    );
}

function MinimalistDecorations() {
    const {shadowsEnabled} = useSceneStore();

    return (
        <>
            {/* Modern geometric planters */}
            <RigidBody {...PhysicsPresets.static()} position={[-4, 0.1, -6]}>
                <mesh position={[0, 0.3, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[0.6, 0.6, 0.6]}/>
                    <meshStandardMaterial color="#333333" roughness={0.2} metalness={0.8}/>
                </mesh>
                <CuboidCollider args={[0.3, 0.3, 0.3]}/>
            </RigidBody>

            <RigidBody {...PhysicsPresets.static()} position={[4, 0.1, 6]}>
                <mesh position={[0, 0.3, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[0.6, 0.6, 0.6]}/>
                    <meshStandardMaterial color="#333333" roughness={0.2} metalness={0.8}/>
                </mesh>
                <CuboidCollider args={[0.3, 0.3, 0.3]}/>
            </RigidBody>
        </>
    );
}

function GlowingDecorations() {
    const {shadowsEnabled} = useSceneStore();

    return (
        <>
            {/* Glowing tech orbs */}
            <RigidBody {...PhysicsPresets.static()} position={[-4, 0.5, 2]}>
                <mesh castShadow={shadowsEnabled}>
                    <sphereGeometry args={[0.4, 16, 16]}/>
                    <meshStandardMaterial
                        color="#00ffff"
                        emissive="#004466"
                        emissiveIntensity={0.05}
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>
                <BallCollider args={[0.4]}/>
            </RigidBody>

            <RigidBody {...PhysicsPresets.static()} position={[4, 0.5, -2]}>
                <mesh castShadow={shadowsEnabled}>
                    <sphereGeometry args={[0.4, 16, 16]}/>
                    <meshStandardMaterial
                        color="#ff0088"
                        emissive="#440044"
                        emissiveIntensity={0.05}
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>
                <BallCollider args={[0.4]}/>
            </RigidBody>
        </>
    );
}

function WoodenFurniture() {
    const {shadowsEnabled} = useSceneStore();

    return (
        <>
            {/* Wooden benches */}
            <RigidBody {...PhysicsPresets.static()} position={[-6, 0.3, 0]}>
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[2.5, 0.4, 0.6]}/>
                    <meshStandardMaterial color="#8b4513" roughness={0.8} metalness={0.1}/>
                </mesh>
                <CuboidCollider args={[1.25, 0.2, 0.3]}/>
            </RigidBody>

            <RigidBody {...PhysicsPresets.static()} position={[6, 0.3, 0]}>
                <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <boxGeometry args={[2.5, 0.4, 0.6]}/>
                    <meshStandardMaterial color="#8b4513" roughness={0.8} metalness={0.1}/>
                </mesh>
                <CuboidCollider args={[1.25, 0.2, 0.3]}/>
            </RigidBody>
        </>
    );
}

function StoneElements() {
    const {shadowsEnabled} = useSceneStore();

    return (
        <>
            {/* Stone formations */}
            <RigidBody {...PhysicsPresets.static()} position={[-5, 0.1, -3]}>
                <mesh position={[0, 0.3, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <sphereGeometry args={[0.5, 12, 8]}/>
                    <meshStandardMaterial color="#666666" roughness={0.9} metalness={0.1}/>
                </mesh>
                <BallCollider args={[0.5]}/>
            </RigidBody>

            <RigidBody {...PhysicsPresets.static()} position={[5, 0.1, 3]}>
                <mesh position={[0, 0.4, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                    <cylinderGeometry args={[0.4, 0.6, 0.8, 8]}/>
                    <meshStandardMaterial color="#777777" roughness={0.8} metalness={0.1}/>
                </mesh>
                <CuboidCollider args={[0.4, 0.4, 0.4]}/>
            </RigidBody>
        </>
    );
}