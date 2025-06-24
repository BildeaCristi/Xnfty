import { UNIFIED_LIGHTING } from '@/config/museumConfig';
import { LIGHTING_CONFIG } from '@/utils/constants/museumConstants';

type QualityLevel = 'low' | 'medium' | 'high';

export class LightingService {
  static getLightingConfig(quality?: QualityLevel) {
    if (!quality) {
      return UNIFIED_LIGHTING;
    }

    const multiplier = LIGHTING_CONFIG.QUALITY_MULTIPLIERS[quality];
    
    return {
      ...UNIFIED_LIGHTING,
      ambient: {
        ...UNIFIED_LIGHTING.ambient,
        intensity: UNIFIED_LIGHTING.ambient.intensity * multiplier,
      },
      directional: {
        ...UNIFIED_LIGHTING.directional,
        intensity: UNIFIED_LIGHTING.directional.intensity * multiplier,
      },
      centerLights: UNIFIED_LIGHTING.centerLights.map(light => ({
        ...light,
        intensity: light.intensity * multiplier,
      })),
    };
  }

  static getCenterLights(quality?: QualityLevel) {
    return this.getLightingConfig(quality).centerLights;
  }

  static getAmbientLight(quality?: QualityLevel) {
    return this.getLightingConfig(quality).ambient;
  }

  static getDirectionalLight(quality?: QualityLevel) {
    return this.getLightingConfig(quality).directional;
  }
} 