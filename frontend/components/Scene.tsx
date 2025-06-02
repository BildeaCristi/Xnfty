/*
"use client";

import React, { useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import dynamic from 'next/dynamic';

// Dynamically import PointerLockControls (client-side only)
const PointerLockControls = dynamic(
    () => import('@react-three/drei').then((mod) => mod.PointerLockControls),
    { ssr: false }
);

export function NFTFrame({
                             texture,
                             position = [0, 1.5, 0],
                             rotation = [0, 0, 0]
                         }: {
    texture: any;
    position?: number[];
    rotation?: number[];
}) {
    return (
        <group position={position} rotation={rotation}>
            {/!* Frame (slightly larger brown plane) *!/}
            <mesh castShadow receiveShadow>
                <planeGeometry args={[1.2, 1.2]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/!* NFT Painting *!/}
            <mesh position={[0, 0, 0.01]} castShadow>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial map={texture} />
            </mesh>
        </group>
    );
}

export function MuseumScene({ images }: { images: string[] }) {
    // Memoize images so that the loader receives a stable array
    const stableImages = useMemo(() => images, [images]);
    const textures = useLoader(TextureLoader, stableImages);

    // Room dimensions
    const wallHeight = 3;
    const roomWidth = 10,
        roomDepth = 10;
    const halfW = roomWidth / 2,
        halfD = roomDepth / 2;

    // Distribute textures to 4 walls
    const walls: any[][] = [[], [], [], []];
    textures.forEach((tex, i) => {
        walls[i % 4].push(tex);
    });

    const wallElements: JSX.Element[] = [];

    // North wall (at -Z)
    walls[0].forEach((tex, idx) => {
        const total = walls[0].length;
        const offset = (idx - (total - 1) / 2) * 1.7;
        wallElements.push(
            <NFTFrame
                key={`north-${idx}`}
                texture={tex}
                position={[offset, 1.5, -halfD - 0.001]}
                rotation={[0, 0, 0]}
            />
        );
    });
    // South wall (at +Z)
    walls[1].forEach((tex, idx) => {
        const total = walls[1].length;
        const offset = (idx - (total - 1) / 2) * 1.7;
        wallElements.push(
            <NFTFrame
                key={`south-${idx}`}
                texture={tex}
                position={[offset, 1.5, halfD + 0.001]}
                rotation={[0, Math.PI, 0]}
            />
        );
    });
    // West wall (at -X)
    walls[2].forEach((tex, idx) => {
        const total = walls[2].length;
        const offset = (idx - (total - 1) / 2) * 1.7;
        wallElements.push(
            <NFTFrame
                key={`west-${idx}`}
                texture={tex}
                position={[-halfW - 0.001, 1.5, offset]}
                rotation={[0, Math.PI / 2, 0]}
            />
        );
    });
    // East wall (at +X)
    walls[3].forEach((tex, idx) => {
        const total = walls[3].length;
        const offset = (idx - (total - 1) / 2) * 1.7;
        wallElements.push(
            <NFTFrame
                key={`east-${idx}`}
                texture={tex}
                position={[halfW + 0.001, 1.5, offset]}
                rotation={[0, -Math.PI / 2, 0]}
            />
        );
    });

    return (
        <>
            {/!* Floor *!/}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[roomWidth, roomDepth]} />
                <meshStandardMaterial color="#777" />
            </mesh>
            {/!* Walls *!/}
            <mesh position={[0, wallHeight / 2, -halfD]} receiveShadow>
                <planeGeometry args={[roomWidth, wallHeight]} />
                <meshStandardMaterial color="#999" />
            </mesh>
            <mesh
                position={[0, wallHeight / 2, halfD]}
                rotation={[0, Math.PI, 0]}
                receiveShadow
            >
                <planeGeometry args={[roomWidth, wallHeight]} />
                <meshStandardMaterial color="#999" />
            </mesh>
            <mesh
                position={[-halfW, wallHeight / 2, 0]}
                rotation={[0, Math.PI / 2, 0]}
                receiveShadow
            >
                <planeGeometry args={[roomDepth, wallHeight]} />
                <meshStandardMaterial color="#999" />
            </mesh>
            <mesh
                position={[halfW, wallHeight / 2, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                receiveShadow
            >
                <planeGeometry args={[roomDepth, wallHeight]} />
                <meshStandardMaterial color="#999" />
            </mesh>
            {wallElements}
        </>
    );
}

function FirstPersonMovement() {
    const { camera } = useThree();
    const keys = useRef<{ [key: string]: boolean }>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keys.current[e.code] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keys.current[e.code] = false;
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useFrame((_, delta) => {
        const speed = 3;
        if (keys.current["KeyW"]) camera.translateZ(-speed * delta);
        if (keys.current["KeyS"]) camera.translateZ(speed * delta);
        if (keys.current["KeyA"]) camera.translateX(-speed * delta);
        if (keys.current["KeyD"]) camera.translateX(speed * delta);
    });
    return null;
}

export function MuseumCanvas({ images }: { images: string[] }) {
    const controlsRef = useRef<any>(null);

    // Trigger pointer lock on button click
    const handleLock = () => {
        if (controlsRef.current) {
            controlsRef.current.lock();
        }
    };

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
            {/!* Button to trigger pointer lock (user gesture required) *!/}
            <button
                onClick={handleLock}
                style={{
                    position: "absolute",
                    zIndex: 1,
                    top: "20px",
                    left: "20px",
                    padding: "10px 20px",
                    fontSize: "16px"
                }}
            >
                Enter 3D Museum
            </button>
            <Canvas shadows camera={{ position: [0, 1.5, 5] }}>
                <ambientLight intensity={0.3} />
                <directionalLight position={[5, 5, 5]} castShadow intensity={0.8} />
                {/!* Wrap MuseumScene in Suspense so the scene only renders once textures load *!/}
                <Suspense fallback={null}>
                    <MuseumScene images={images} />
                </Suspense>
                <PointerLockControls ref={controlsRef} />
                <FirstPersonMovement />
            </Canvas>
        </div>
    );
}
*/
