import {LIGHTING_CONFIG, QUALITY_LEVELS} from '@/utils/constants/museumConstants';

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

export const UNIFIED_LIGHTING: LightingSettings = {
    ambient: {
        intensity: LIGHTING_CONFIG.AMBIENT_BASE * 1.2,
        color: '#ffffff',
    },
    directional: {
        intensity: LIGHTING_CONFIG.DIRECTIONAL_BASE * 1.1,
        color: '#ffffff',
        position: [10, 10, 5],
        castShadow: false,
    },
    centerLights: [
        {
            color: '#ffffff',
            intensity: 1.2,
            position: [0, 5.5, 0],
            rotation: [-Math.PI / 2, 0, 0],
        },
        {
            color: '#ffffff',
            intensity: 0.8,
            position: [-4, 5.5, -4],
            rotation: [-Math.PI / 2, 0, 0],
        },
        {
            color: '#ffffff',
            intensity: 0.8,
            position: [4, 5.5, 4],
            rotation: [-Math.PI / 2, 0, 0],
        },
        {
            color: '#ffffff',
            intensity: 0.8,
            position: [-4, 5.5, 4],
            rotation: [-Math.PI / 2, 0, 0],
        },
        {
            color: '#ffffff',
            intensity: 0.8,
            position: [4, 5.5, -4],
            rotation: [-Math.PI / 2, 0, 0],
        },
        {
            color: '#f0f8ff',
            intensity: 0.6,
            position: [0, 4, 6],
            rotation: [0, 0, 0],
        },
        {
            color: '#f0f8ff',
            intensity: 0.6,
            position: [0, 4, -6],
            rotation: [Math.PI, 0, 0],
        },
        {
            color: '#f0f8ff',
            intensity: 0.6,
            position: [6, 4, 0],
            rotation: [0, -Math.PI / 2, 0],
        },
        {
            color: '#f0f8ff',
            intensity: 0.6,
            position: [-6, 4, 0],
            rotation: [0, Math.PI / 2, 0],
        },
    ],
}; 