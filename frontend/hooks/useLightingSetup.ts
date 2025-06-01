import { useMemo } from 'react';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';

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
  ceiling: {
    count: number;
    intensity: number;
    color: string;
    distance: number;
    decay: number;
    positions: [number, number, number][];
  };
}

export function useLightingSetup() {
  const { themeName, currentTheme } = useMuseumStore();
  const { shadowsEnabled, quality } = useSceneStore();

  const lightConfig = useMemo<LightConfig>(() => {
    // Base lighting is very dim - only ceiling lights provide illumination
    const baseAmbient = 0.02; // Barely visible
    const baseDirectional = 0.01; // Almost nothing
    
    // Ceiling light configuration based on theme
    let ceilingIntensity = 0.15;
    let ceilingColor = '#ffcc88';
    let ceilingDistance = 8;
    let ceilingDecay = 2;
    
    switch (themeName) {
      case 'modern':
        ceilingIntensity = 0.18;
        ceilingColor = '#ffffff';
        ceilingDistance = 10;
        break;
      case 'classic':
        ceilingIntensity = 0.15;
        ceilingColor = '#ffcc88';
        ceilingDistance = 8;
        break;
      case 'futuristic':
        ceilingIntensity = 0.12;
        ceilingColor = '#88ccff';
        ceilingDistance = 12;
        ceilingDecay = 1.5;
        break;
      case 'nature':
        ceilingIntensity = 0.2;
        ceilingColor = '#ffffcc';
        ceilingDistance = 10;
        break;
    }
    
    // Generate ceiling lamp positions
    const positions: [number, number, number][] = [
      [0, 5.5, 0],      // Center
      [-5, 5.5, -5],    // Corners
      [5, 5.5, -5],
      [-5, 5.5, 5],
      [5, 5.5, 5],
      [0, 5.5, -7],     // Front/Back
      [0, 5.5, 7],
      [-7, 5.5, 0],     // Sides
      [7, 5.5, 0],
    ];
    
    // Add extra lamps for larger rooms or lower quality
    if (quality === 'low' || quality === 'medium') {
      // Add more lamps to compensate for lack of other effects
      positions.push(
        [-3.5, 5.5, -3.5],
        [3.5, 5.5, -3.5],
        [-3.5, 5.5, 3.5],
        [3.5, 5.5, 3.5]
      );
      ceilingIntensity *= 1.2; // Slightly brighter for lower quality
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
        castShadow: false, // No shadows from weak directional light
      },
      ceiling: {
        count: positions.length,
        intensity: ceilingIntensity,
        color: ceilingColor,
        distance: ceilingDistance,
        decay: ceilingDecay,
        positions,
      },
    };
  }, [themeName, currentTheme, quality]);

  return lightConfig;
} 