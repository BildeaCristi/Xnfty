"use client";

import { useRef, useMemo } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MeshReflectorMaterial, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { PhysicsPresets } from '../providers/PhysicsProvider';

interface EnhancedMuseumRoomProps {
  width?: number;
  height?: number;
  depth?: number;
}

export default function EnhancedMuseumRoom({
  width = 20,
  height = 6,
  depth = 20,
}: EnhancedMuseumRoomProps) {
  const { currentTheme, themeName } = useMuseumStore();
  const { shadowsEnabled, quality } = useSceneStore();
  const groupRef = useRef<THREE.Group>(null);

  // Load textures with quality settings
  const textureUrl = useMemo(() => {
    const isHighQuality = quality === 'ultra' || quality === 'high';
    const baseUrl = isHighQuality ? '/textures/marble_floor_4k.jpg' : '/textures/marble_floor_2k.jpg';
    
    // You can add theme-specific textures here
    switch (themeName) {
      case 'modern':
      case 'classic':
        return baseUrl;
      case 'futuristic':
        // Could use a different texture for futuristic theme
        return baseUrl;
      case 'nature':
        // Could use wood or grass texture for nature theme
        return baseUrl;
      default:
        return baseUrl;
    }
  }, [quality, themeName]);

  const floorTexture = useTexture(textureUrl);

  // Configure texture
  useMemo(() => {
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(width / 4, depth / 4);
    if (quality === 'ultra' || quality === 'high') {
      floorTexture.anisotropy = 16;
    }
    return floorTexture;
  }, [floorTexture, width, depth, quality]);

  // Wall material with subtle variations
  const wallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: currentTheme.room.wallColor,
      roughness: currentTheme.room.wallRoughness,
      metalness: currentTheme.room.wallMetalness,
      envMapIntensity: 0.5,
      side: THREE.DoubleSide,
    });
  }, [currentTheme]);

  // Ceiling material
  const ceilingMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: currentTheme.room.ceilingColor,
      roughness: 0.9,
      metalness: 0.1,
    });
  }, [currentTheme]);

  return (
    <group ref={groupRef}>
      {/* Floor with physics */}
      <RigidBody {...PhysicsPresets.static()}>
        <mesh 
          position={[0, 0, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow={shadowsEnabled}
        >
          <planeGeometry args={[width, depth]} />
          {quality === 'ultra' || quality === 'high' ? (
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
              distortionMap={floorTexture}
              distortion={0.01}
            />
          ) : (
            <meshStandardMaterial
              color={currentTheme.room.floorColor}
              roughness={currentTheme.room.floorRoughness}
              metalness={currentTheme.room.floorMetalness}
              map={floorTexture}
            />
          )}
        </mesh>
        <CuboidCollider args={[width / 2, 0.1, depth / 2]} position={[0, -0.1, 0]} />
      </RigidBody>

      {/* Walls with physics */}
      {/* Front Wall */}
      <RigidBody {...PhysicsPresets.static()} position={[0, height / 2, -depth / 2]}>
        <mesh 
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
        >
          <planeGeometry args={[width, height]} />
          <primitive object={wallMaterial} />
        </mesh>
        <CuboidCollider args={[width / 2, height / 2, 0.1]} />
      </RigidBody>

      {/* Back Wall */}
      <RigidBody {...PhysicsPresets.static()} position={[0, height / 2, depth / 2]}>
        <mesh 
          rotation={[0, Math.PI, 0]}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
        >
          <planeGeometry args={[width, height]} />
          <primitive object={wallMaterial} />
        </mesh>
        <CuboidCollider args={[width / 2, height / 2, 0.1]} />
      </RigidBody>

      {/* Left Wall */}
      <RigidBody {...PhysicsPresets.static()} position={[-width / 2, height / 2, 0]}>
        <mesh 
          rotation={[0, Math.PI / 2, 0]}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
        >
          <planeGeometry args={[depth, height]} />
          <primitive object={wallMaterial} />
        </mesh>
        <CuboidCollider args={[0.1, height / 2, depth / 2]} />
      </RigidBody>

      {/* Right Wall */}
      <RigidBody {...PhysicsPresets.static()} position={[width / 2, height / 2, 0]}>
        <mesh 
          rotation={[0, -Math.PI / 2, 0]}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
        >
          <planeGeometry args={[depth, height]} />
          <primitive object={wallMaterial} />
        </mesh>
        <CuboidCollider args={[0.1, height / 2, depth / 2]} />
      </RigidBody>

      {/* Ceiling */}
      <RigidBody {...PhysicsPresets.static()}>
        <mesh 
          position={[0, height, 0]} 
          rotation={[Math.PI / 2, 0, 0]}
          receiveShadow={shadowsEnabled}
        >
          <planeGeometry args={[width, depth]} />
          <primitive object={ceilingMaterial} />
        </mesh>
        <CuboidCollider args={[width / 2, 0.1, depth / 2]} position={[0, 0.1, 0]} />
      </RigidBody>

      {/* Architectural details */}
      {(quality === 'high' || quality === 'ultra') && (
        <>
          {/* Baseboards */}
          <group>
            {/* Front baseboard */}
            <mesh position={[0, 0.15, -depth / 2 + 0.05]} castShadow={shadowsEnabled}>
              <boxGeometry args={[width, 0.3, 0.1]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>
            {/* Back baseboard */}
            <mesh position={[0, 0.15, depth / 2 - 0.05]} castShadow={shadowsEnabled}>
              <boxGeometry args={[width, 0.3, 0.1]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>
            {/* Left baseboard */}
            <mesh position={[-width / 2 + 0.05, 0.15, 0]} castShadow={shadowsEnabled}>
              <boxGeometry args={[0.1, 0.3, depth]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>
            {/* Right baseboard */}
            <mesh position={[width / 2 - 0.05, 0.15, 0]} castShadow={shadowsEnabled}>
              <boxGeometry args={[0.1, 0.3, depth]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>
          </group>

          {/* Crown molding */}
          <group>
            {/* Front crown */}
            <mesh position={[0, height - 0.15, -depth / 2 + 0.05]} castShadow={shadowsEnabled}>
              <boxGeometry args={[width, 0.3, 0.1]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </mesh>
            {/* Back crown */}
            <mesh position={[0, height - 0.15, depth / 2 - 0.05]} castShadow={shadowsEnabled}>
              <boxGeometry args={[width, 0.3, 0.1]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </mesh>
            {/* Left crown */}
            <mesh position={[-width / 2 + 0.05, height - 0.15, 0]} castShadow={shadowsEnabled}>
              <boxGeometry args={[0.1, 0.3, depth]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </mesh>
            {/* Right crown */}
            <mesh position={[width / 2 - 0.05, height - 0.15, 0]} castShadow={shadowsEnabled}>
              <boxGeometry args={[0.1, 0.3, depth]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
} 