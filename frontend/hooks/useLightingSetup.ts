import { useMemo } from 'react';
import { UNIFIED_LIGHTING } from '@/config/museumConfig';

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
  centerLights: Array<{
    color: string;
    intensity: number;
    position: [number, number, number];
    rotation: [number, number, number];
  }>;
}

export function useLightingSetup(): LightConfig {
  return useMemo(() => UNIFIED_LIGHTING, []);
} 