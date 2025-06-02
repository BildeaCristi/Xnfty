"use client";

import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { useLightingSetup } from '@/hooks/useLightingSetup';
import { useSceneStore } from '@/store/sceneStore';

interface MuseumLightingProps {
  showHelpers?: boolean;
}

export default function MuseumLighting({ showHelpers = false }: MuseumLightingProps) {
  const { scene } = useThree();
  const lightConfig = useLightingSetup();
  const { quality } = useSceneStore();

  // Initialize RectAreaLight uniforms
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);

  // Create ambient light
  const ambientLight = new THREE.AmbientLight(
    lightConfig.ambient.color,
    lightConfig.ambient.intensity
  );

  // Create directional light
  const directionalLight = new THREE.DirectionalLight(
    lightConfig.directional.color,
    lightConfig.directional.intensity
  );
  directionalLight.position.set(...lightConfig.directional.position);
  directionalLight.castShadow = lightConfig.directional.castShadow;

  // Create RectAreaLights
  const rectAreaLights = lightConfig.rectAreaLights.map((config, index) => {
    const light = new THREE.RectAreaLight(
      config.color,
      config.intensity,
      config.width,
      config.height
    );
    
    light.position.set(...config.position);
    light.rotation.set(...config.rotation);
    
    // Add helper if enabled and not in low quality mode
    if (showHelpers && quality !== 'low') {
      const helper = new RectAreaLightHelper(light);
      light.add(helper);
    }
    
    return light;
  });

  // Add lights to scene
  useEffect(() => {
    scene.add(ambientLight);
    scene.add(directionalLight);
    rectAreaLights.forEach(light => scene.add(light));

    return () => {
      scene.remove(ambientLight);
      scene.remove(directionalLight);
      rectAreaLights.forEach(light => scene.remove(light));
    };
  }, [scene, ambientLight, directionalLight, ...rectAreaLights]);

  return null;
}

// Component to ensure materials are compatible with RectAreaLight
export function EnsureRectAreaLightMaterials({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Traverse the scene and update materials to be compatible with RectAreaLight
    const updateMaterials = (object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material;
        
        if (Array.isArray(material)) {
          material.forEach(mat => {
            if (mat instanceof THREE.MeshBasicMaterial || 
                mat instanceof THREE.MeshLambertMaterial ||
                mat instanceof THREE.MeshPhongMaterial) {
              // Replace with MeshStandardMaterial for RectAreaLight compatibility
              const newMaterial = new THREE.MeshStandardMaterial({
                color: mat.color,
                map: mat.map,
                transparent: mat.transparent,
                opacity: mat.opacity,
                emissive: new THREE.Color(0x000000), // Ensure no emission
                roughness: 0.8,
                metalness: 0.0,
              });
              
              object.material = newMaterial;
              mat.dispose();
            }
          });
        } else if (
          material instanceof THREE.MeshBasicMaterial || 
          material instanceof THREE.MeshLambertMaterial ||
          material instanceof THREE.MeshPhongMaterial
        ) {
          // Replace with MeshStandardMaterial for RectAreaLight compatibility
          const newMaterial = new THREE.MeshStandardMaterial({
            color: material.color,
            map: material.map,
            transparent: material.transparent,
            opacity: material.opacity,
            emissive: new THREE.Color(0x000000), // Ensure no emission
            roughness: 0.8,
            metalness: 0.0,
          });
          
          object.material = newMaterial;
          material.dispose();
        }
      }
      
      object.children.forEach(updateMaterials);
    };

    // Note: This would need to be called when the scene is fully loaded
    // In practice, this should be integrated with the scene loading logic
  }, []);

  return <>{children}</>;
}

// Hook to create proper materials for RectAreaLight
export function useRectAreaLightMaterial(color: string | number = 0xdddddd) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: 0x000000, // No emission unless intended
    roughness: 0.9,
    metalness: 0.0,
  });
} 