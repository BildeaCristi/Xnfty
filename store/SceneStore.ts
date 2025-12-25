import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import * as THREE from 'three';

export type QualityLevel = 'low' | 'medium';

interface PhysicsConfig {
    timeStep: number | "vary" | undefined;
    enabled: boolean;
    gravity: [number, number, number];
    debug: boolean;
}

interface RenderSettings {
    shadows: boolean;
    antialias: boolean;
    shadowMapSize: number;
    toneMapping: THREE.ToneMapping;
    toneMappingExposure: number;
}

interface PerformanceMetrics {
    fps: number;
    drawCalls?: number;
    triangles?: number;
    points?: number;
    lines?: number;
}

interface SceneState {
    // Quality settings
    quality: QualityLevel;
    autoQuality: boolean;

    // Rendering settings
    shadowsEnabled: boolean;
    reflectionsEnabled: boolean;

    // Physics settings
    physicsConfig: PhysicsConfig;

    // Performance metrics
    performanceMetrics: PerformanceMetrics;

    // Actions
    setQuality: (quality: QualityLevel) => void;
    setAutoQuality: (auto: boolean) => void;
    setShadowsEnabled: (enabled: boolean) => void;
    setReflectionsEnabled: (enabled: boolean) => void;
    updatePhysicsConfig: (config: {
        enabled: boolean;
        gravity: [number, number, number] | undefined;
        debug: undefined | boolean;
        timeStep: number | undefined
    }) => void;
    updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
    getRenderSettings: () => RenderSettings;
    reset: () => void;
}

const defaultPhysicsConfig: PhysicsConfig = {
    enabled: true,
    gravity: [0, -9.81, 0],
    debug: false,
    timeStep: undefined
};

const defaultPerformanceMetrics: PerformanceMetrics = {
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
};

// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
export const useSceneStore = create<SceneState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                quality: 'low',
                autoQuality: true,
                shadowsEnabled: true,
                reflectionsEnabled: true,
                physicsConfig: defaultPhysicsConfig,
                performanceMetrics: defaultPerformanceMetrics,

                // Actions
                setQuality: (quality) => {
                    set({ quality });
                    // Automatically adjust other settings based on quality
                    switch (quality) {
                        case 'low':
                            set({
                                shadowsEnabled: false,
                                reflectionsEnabled: false,
                            });
                            break;
                        case 'medium':
                            set({
                                shadowsEnabled: true,
                                reflectionsEnabled: true,
                            });
                            break;
                    }
                },

                setAutoQuality: (auto) => set({ autoQuality: auto }),
                setShadowsEnabled: (enabled) => set({ shadowsEnabled: enabled }),
                setReflectionsEnabled: (enabled) => set({ reflectionsEnabled: enabled }),

                updatePhysicsConfig: (config) =>
                    set((state) => ({
                        physicsConfig: { ...state.physicsConfig, ...config } as PhysicsConfig
                    })),

                updatePerformanceMetrics: (metrics) =>
                    set((state) => ({
                        performanceMetrics: { ...state.performanceMetrics, ...metrics }
                    })),

                getRenderSettings: () => {
                    const state = get();
                    const quality = state.quality;

                    const baseSettings: RenderSettings = {
                        shadows: state.shadowsEnabled,
                        antialias: quality !== 'low',
                        shadowMapSize: 2048,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1,
                    };

                    // Adjust settings based on quality
                    switch (quality) {
                        case 'low':
                            return {
                                ...baseSettings,
                                shadowMapSize: 512,
                                toneMapping: THREE.NoToneMapping,
                            };
                        case 'medium':
                            return {
                                ...baseSettings,
                                shadowMapSize: 1024,
                            };
                        default:
                            return baseSettings;
                    }
                },

                reset: () => {
                    set({
                        quality: 'low',
                        shadowsEnabled: false,
                        reflectionsEnabled: false,
                        physicsConfig: defaultPhysicsConfig,
                        performanceMetrics: defaultPerformanceMetrics,
                    });
                },
            }),
            {
                name: 'scene-settings',
                partialize: (state) => ({
                    quality: state.quality,
                    shadowsEnabled: state.shadowsEnabled,
                    reflectionsEnabled: state.reflectionsEnabled,
                    physicsConfig: state.physicsConfig,
                }),
            }
        ),
        {
            name: 'SceneStore',
        }
    )
); 