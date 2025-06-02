import { useMemo } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';

export interface RectAreaLightConfig {
  color: string;
  intensity: number;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface LightConfig {
  ambient: {
    intensity: number;
    color: string;
  };
  directional: {
    intensity: number;
    color: string;
    position: [number, number, number];
    castShadow: boolean;
  };
  rectAreaLights: RectAreaLightConfig[];
}

export function useLightingSetup() {
  const { themeName, currentTheme } = useMuseumStore();
  const { shadowsEnabled, quality } = useSceneStore();

  const lightConfig = useMemo<LightConfig>(() => {
    // Minimal ambient lighting for realism
    const baseAmbient = 0.01; // Very dim ambient
    const baseDirectional = 0.05; // Minimal directional for subtle fill
    
    // RectAreaLight configuration based on theme
    let lightIntensity = 2.5;
    let lightColor = '#ffcc88'; // Warm white
    let lightWidth = 4;
    let lightHeight = 4;
    
    switch (themeName) {
      case 'modern':
        lightIntensity = 3.0;
        lightColor = '#ffffff'; // Cool white
        lightWidth = 6;
        lightHeight = 6;
        break;
      case 'classic':
        lightIntensity = 2.2;
        lightColor = '#ffcc88'; // Warm white
        lightWidth = 4;
        lightHeight = 4;
        break;
      case 'futuristic':
        lightIntensity = 2.8;
        lightColor = '#88ccff'; // Cool blue-white
        lightWidth = 5;
        lightHeight = 5;
        break;
      case 'nature':
        lightIntensity = 2.0;
        lightColor = '#ffffcc'; // Soft yellow
        lightWidth = 4;
        lightHeight = 4;
        break;
    }
    
    // Adjust intensity based on quality (lower quality needs slightly brighter lights)
    if (quality === 'low') {
      lightIntensity *= 1.3;
    } else if (quality === 'medium') {
      lightIntensity *= 1.1;
    }
    
    // Generate ceiling RectAreaLight positions
    const rectAreaLights: RectAreaLightConfig[] = [
      // Main central light
      {
        color: lightColor,
        intensity: lightIntensity,
        width: lightWidth,
        height: lightHeight,
        position: [0, 5.5, 0],
        rotation: [-Math.PI / 2, 0, 0] // Point downward
      },
      // Corner lights
      {
        color: lightColor,
        intensity: lightIntensity * 0.8,
        width: lightWidth * 0.7,
        height: lightHeight * 0.7,
        position: [-4, 5.5, -4],
        rotation: [-Math.PI / 2, 0, 0]
      },
      {
        color: lightColor,
        intensity: lightIntensity * 0.8,
        width: lightWidth * 0.7,
        height: lightHeight * 0.7,
        position: [4, 5.5, -4],
        rotation: [-Math.PI / 2, 0, 0]
      },
      {
        color: lightColor,
        intensity: lightIntensity * 0.8,
        width: lightWidth * 0.7,
        height: lightHeight * 0.7,
        position: [-4, 5.5, 4],
        rotation: [-Math.PI / 2, 0, 0]
      },
      {
        color: lightColor,
        intensity: lightIntensity * 0.8,
        width: lightWidth * 0.7,
        height: lightHeight * 0.7,
        position: [4, 5.5, 4],
        rotation: [-Math.PI / 2, 0, 0]
      }
    ];

    // Add accent lights for medium/high quality
    if (quality !== 'low') {
      rectAreaLights.push(
        // Wall accent lights
        {
          color: lightColor,
          intensity: lightIntensity * 0.3,
          width: lightWidth * 0.5,
          height: lightHeight * 0.5,
          position: [0, 5.5, -6.5],
          rotation: [-Math.PI / 2, 0, 0]
        },
        {
          color: lightColor,
          intensity: lightIntensity * 0.3,
          width: lightWidth * 0.5,
          height: lightHeight * 0.5,
          position: [0, 5.5, 6.5],
          rotation: [-Math.PI / 2, 0, 0]
        }
      );
    }
    
    return {
      ambient: {
        intensity: baseAmbient,
        color: currentTheme.lighting.ambientColor,
      },
      directional: {
        intensity: baseDirectional,
        color: currentTheme.lighting.directionalColor,
        position: [10, 10, 5] as [number, number, number],
        castShadow: false, // RectAreaLights provide main illumination
      },
      rectAreaLights,
    };
  }, [themeName, currentTheme, quality]);

  return lightConfig;
} 