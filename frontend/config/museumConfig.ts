import { QUALITY_LEVELS, LIGHTING_CONFIG } from '@/utils/constants/museumConstants';

export interface RenderConfig {
  shadows: boolean;
  antialias: boolean;
  toneMapping: number;
  toneMappingExposure: number;
}

export interface LightingSettings {
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

export const RENDER_CONFIGS: Record<string, RenderConfig> = {
  [QUALITY_LEVELS.LOW]: {
    shadows: false,
    antialias: false,
    toneMapping: 1,
    toneMappingExposure: 1,
  },
  [QUALITY_LEVELS.MEDIUM]: {
    shadows: true,
    antialias: false,
    toneMapping: 1,
    toneMappingExposure: 1,
  },
  [QUALITY_LEVELS.HIGH]: {
    shadows: true,
    antialias: true,
    toneMapping: 1,
    toneMappingExposure: 1,
  },
};

export const UNIFIED_LIGHTING: LightingSettings = {
  ambient: {
    intensity: LIGHTING_CONFIG.AMBIENT_BASE * 1.5,
    color: '#ffffff',
  },
  directional: {
    intensity: LIGHTING_CONFIG.DIRECTIONAL_BASE * 1.2,
    color: '#ffffff',
    position: [10, 10, 5],
    castShadow: false,
  },
  centerLights: [
    {
      color: '#ffffff',
      intensity: 0.3,
      position: [0, 5.5, 0],
      rotation: [-Math.PI / 2, 0, 0],
    },
    {
      color: '#ffffff',
      intensity: 0.2,
      position: [-3, 5.5, -3],
      rotation: [-Math.PI / 2, 0, 0],
    },
    {
      color: '#ffffff',
      intensity: 0.2,
      position: [3, 5.5, 3],
      rotation: [-Math.PI / 2, 0, 0],
    },
  ],
}; 