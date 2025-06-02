"use client";

import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { useSceneStore } from '@/store/sceneStore';
import { useMuseumStore } from '@/store/museumStore';
import * as THREE from 'three';

// Ceiling lamp component
function CeilingLamp({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF('/models/luminaria_ceiling_lamp.glb');
  const { quality } = useSceneStore();
  
  // Clone the scene to avoid issues with multiple instances
  const clonedScene = scene.clone();
  
  // Ensure materials are properly set for lighting
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.material instanceof THREE.Material) {
        // Ensure the lamp fixture doesn't emit light unless intended
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.roughness = 0.3;
          child.material.metalness = 0.8;
        }
      }
    }
  });

  return (
    <primitive 
      object={clonedScene} 
      position={position}
      scale={[scale, scale, scale]}
      castShadow={quality !== 'low'}
      receiveShadow={quality !== 'low'}
    />
  );
}

// Sculpture component for the draped woman
function DrapeWomanSculpture({ 
  position, 
  rotation = [0, 0, 0], 
  scale = 1 
}: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const { scene } = useGLTF('/models/slanke_met_lang_kleed_gedrapeerde_jonge_vrouw.glb');
  const { quality } = useSceneStore();
  
  const clonedScene = scene.clone();
  
  // Set up materials for sculpture
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.material instanceof THREE.Material) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.roughness = 0.7;
          child.material.metalness = 0.1;
          // Marble-like appearance
          child.material.color = new THREE.Color(0xf5f5f5);
        }
      }
    }
  });

  return (
    <primitive 
      object={clonedScene} 
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      castShadow={quality !== 'low'}
      receiveShadow
    />
  );
}

// Sculpture component for the fallen angel
function FallenAngelSculpture({ 
  position, 
  rotation = [0, 0, 0], 
  scale = 1 
}: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const { scene } = useGLTF('/models/the_fallen_angel_alexandre_cabanel.glb');
  const { quality } = useSceneStore();
  
  const clonedScene = scene.clone();
  
  // Set up materials for sculpture
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.material instanceof THREE.Material) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.roughness = 0.6;
          child.material.metalness = 0.1;
          // Slightly warmer marble tone
          child.material.color = new THREE.Color(0xf8f8f0);
        }
      }
    }
  });

  return (
    <primitive 
      object={clonedScene} 
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      castShadow={quality !== 'low'}
      receiveShadow
    />
  );
}

// Main component that places all museum assets
export default function MuseumAssets() {
  const { quality } = useSceneStore();
  const { themeName } = useMuseumStore();
  
  // Adjust scale based on quality to improve performance
  const modelScale = quality === 'low' ? 0.8 : 1.0;
  
  return (
    <Suspense fallback={null}>
      {/* Ceiling Lamps - positioned to match RectAreaLights */}
      <CeilingLamp position={[0, 5.2, 0]} scale={modelScale * 1.2} />
      <CeilingLamp position={[-4, 5.2, -4]} scale={modelScale * 0.9} />
      <CeilingLamp position={[4, 5.2, -4]} scale={modelScale * 0.9} />
      <CeilingLamp position={[-4, 5.2, 4]} scale={modelScale * 0.9} />
      <CeilingLamp position={[4, 5.2, 4]} scale={modelScale * 0.9} />
      
      {/* Sculptures - positioned strategically around the room */}
      <DrapeWomanSculpture 
        position={[-3.5, 0, -3.5]} 
        rotation={[0, Math.PI / 4, 0]}
        scale={modelScale * 0.8}
      />
      
      <FallenAngelSculpture 
        position={[3.5, 0, 3.5]} 
        rotation={[0, -Math.PI / 4, 0]}
        scale={modelScale * 0.8}
      />
      
      {/* Additional sculptures for larger spaces or higher quality */}
      {quality !== 'low' && (
        <>
          <DrapeWomanSculpture 
            position={[0, 0, -4.5]} 
            rotation={[0, 0, 0]}
            scale={modelScale * 0.7}
          />
          
          <FallenAngelSculpture 
            position={[0, 0, 4.5]} 
            rotation={[0, Math.PI, 0]}
            scale={modelScale * 0.7}
          />
        </>
      )}
    </Suspense>
  );
}

// Preload models to improve loading performance
useGLTF.preload('/models/luminaria_ceiling_lamp.glb');
useGLTF.preload('/models/slanke_met_lang_kleed_gedrapeerde_jonge_vrouw.glb');
useGLTF.preload('/models/the_fallen_angel_alexandre_cabanel.glb'); 