"use client";

import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useMuseumStore } from '@/store/museumStore';

export default function MuseumRoom() {
  const { currentTheme } = useMuseumStore();
  
  // Room dimensions
  const roomWidth = 20;
  const roomHeight = 6;
  const roomDepth = 20;

  return (
    <group>
      {/* Floor with reflection */}
      <mesh 
        receiveShadow 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshStandardMaterial 
          color={currentTheme.room.floorColor}
          roughness={currentTheme.room.floorRoughness}
          metalness={currentTheme.room.floorMetalness}
        />
      </mesh>

      {/* Ceiling with details */}
      <mesh 
        receiveShadow 
        position={[0, roomHeight, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshStandardMaterial 
          color={currentTheme.room.ceilingColor}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Ceiling frame details */}
      {[
        [roomWidth / 2, roomHeight - 0.05, 0, roomDepth, 0.1],
        [-roomWidth / 2, roomHeight - 0.05, 0, roomDepth, 0.1],
        [0, roomHeight - 0.05, roomDepth / 2, roomWidth, 0.1],
        [0, roomHeight - 0.05, -roomDepth / 2, roomWidth, 0.1]
      ].map(([x, y, z, length, width], i) => (
        <mesh key={`ceiling-frame-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[
            i < 2 ? 0.2 : length,
            0.1,
            i < 2 ? length : 0.2
          ]} />
          <meshStandardMaterial 
            color={currentTheme.room.wallColor}
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
      ))}

      {/* Back Wall */}
      <mesh 
        receiveShadow 
        castShadow
        position={[0, roomHeight / 2, -roomDepth / 2]}
      >
        <planeGeometry args={[roomWidth, roomHeight]} />
        <meshStandardMaterial 
          color={currentTheme.room.wallColor}
          roughness={currentTheme.room.wallRoughness}
          metalness={currentTheme.room.wallMetalness}
        />
      </mesh>

      {/* Front Wall */}
      <mesh 
        receiveShadow 
        castShadow
        position={[0, roomHeight / 2, roomDepth / 2]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[roomWidth, roomHeight]} />
        <meshStandardMaterial 
          color={currentTheme.room.wallColor}
          roughness={currentTheme.room.wallRoughness}
          metalness={currentTheme.room.wallMetalness}
        />
      </mesh>

      {/* Left Wall */}
      <mesh 
        receiveShadow 
        castShadow
        position={[-roomWidth / 2, roomHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomDepth, roomHeight]} />
        <meshStandardMaterial 
          color={currentTheme.room.wallColor}
          roughness={currentTheme.room.wallRoughness}
          metalness={currentTheme.room.wallMetalness}
        />
      </mesh>

      {/* Right Wall */}
      <mesh 
        receiveShadow 
        castShadow
        position={[roomWidth / 2, roomHeight / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomDepth, roomHeight]} />
        <meshStandardMaterial 
          color={currentTheme.room.wallColor}
          roughness={currentTheme.room.wallRoughness}
          metalness={currentTheme.room.wallMetalness}
        />
      </mesh>

      {/* Accent lighting strips */}
      <mesh position={[0, roomHeight - 0.1, -roomDepth / 2 + 0.1]}>
        <boxGeometry args={[roomWidth - 2, 0.2, 0.2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={currentTheme.lighting.accentIntensity}
        />
      </mesh>

      <mesh position={[0, roomHeight - 0.1, roomDepth / 2 - 0.1]}>
        <boxGeometry args={[roomWidth - 2, 0.2, 0.2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={currentTheme.lighting.accentIntensity}
        />
      </mesh>

      {/* Side accent lights */}
      <mesh position={[-roomWidth / 2 + 0.1, roomHeight - 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, roomDepth - 2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={currentTheme.lighting.accentIntensity}
        />
      </mesh>

      <mesh position={[roomWidth / 2 - 0.1, roomHeight - 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, roomDepth - 2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={currentTheme.lighting.accentIntensity}
        />
      </mesh>

      {/* Decorative columns - only for classic theme */}
      {currentTheme.name === 'Classic Museum' && (
        <>
          {[-roomWidth / 3, roomWidth / 3].map((x, i) => (
            [-roomDepth / 3, roomDepth / 3].map((z, j) => (
              <mesh 
                key={`column-${i}-${j}`}
                position={[x, roomHeight / 2, z]}
                castShadow
              >
                <cylinderGeometry args={[0.5, 0.5, roomHeight, 16]} />
                <meshStandardMaterial 
                  color="#e0e0e0"
                  roughness={0.3}
                  metalness={0.7}
                />
              </mesh>
            ))
          ))}
        </>
      )}

      {/* Floor pattern - grid lines for modern theme */}
      {currentTheme.name === 'Modern Gallery' && (
        <>
          {/* Grid lines */}
          {Array.from({ length: 9 }, (_, i) => (
            <mesh 
              key={`grid-x-${i}`}
              position={[-8 + i * 2, 0.001, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.02, roomDepth]} />
              <meshStandardMaterial 
                color="#666666"
                metalness={0.5}
              />
            </mesh>
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <mesh 
              key={`grid-z-${i}`}
              position={[0, 0.001, -8 + i * 2]}
              rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            >
              <planeGeometry args={[0.02, roomWidth]} />
              <meshStandardMaterial 
                color="#666666"
                metalness={0.5}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Baseboards */}
      {[
        [0, 0.1, -roomDepth / 2 + 0.05, roomWidth, 0.2, 0.1],
        [0, 0.1, roomDepth / 2 - 0.05, roomWidth, 0.2, 0.1],
        [-roomWidth / 2 + 0.05, 0.1, 0, 0.1, 0.2, roomDepth],
        [roomWidth / 2 - 0.05, 0.1, 0, 0.1, 0.2, roomDepth]
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`baseboard-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial 
            color={currentTheme.room.wallColor}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
} 