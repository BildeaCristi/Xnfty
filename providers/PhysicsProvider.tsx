"use client";

import {ReactNode, useEffect} from 'react';
import {Physics} from '@react-three/rapier';
import {useSceneStore} from '@/store/SceneStore';

interface PhysicsProviderProps {
    children: ReactNode;
    debug?: boolean;
    gravity?: [number, number, number];
    timeStep?: number;
    paused?: boolean;
}

export default function PhysicsProvider({
                                            children,
                                            debug = false,
                                            gravity = [0, -9.81, 0],
                                            timeStep = 1 / 60,
                                            paused = false,
                                        }: PhysicsProviderProps) {
    const {physicsConfig, updatePhysicsConfig} = useSceneStore();

    useEffect(() => {
        updatePhysicsConfig({
            enabled: true,
            gravity,
            debug,
            timeStep,
        });
    }, [gravity, debug, timeStep, updatePhysicsConfig]);

    return (
        <Physics
            gravity={physicsConfig.gravity}
            debug={physicsConfig.debug}
            timeStep={physicsConfig.timeStep}
            paused={paused || !physicsConfig.enabled}
            interpolate
            updatePriority={-50}
            colliders={false}
        >
            {children}
        </Physics>
    );
}

// Physics utilities
export interface PhysicsObjectConfig {
    type: 'dynamic' | 'kinematicPosition' | 'kinematicVelocity' | 'fixed';
    mass?: number;
    restitution?: number;
    friction?: number;
    linearDamping?: number;
    angularDamping?: number;
    gravityScale?: number;
    ccd?: boolean;
    lockTranslations?: boolean;
    lockRotations?: boolean;
    enabledTranslations?: [boolean, boolean, boolean];
    enabledRotations?: [boolean, boolean, boolean];
}

// Helper to create physics config for common objects
export const PhysicsPresets = {
    // Static museum walls/floor
    static: (): PhysicsObjectConfig => ({
        type: 'fixed',
        friction: 0.7,
        restitution: 0.1,
    }),

    // Interactive objects that can be moved
    interactive: (): PhysicsObjectConfig => ({
        type: 'dynamic',
        mass: 1,
        friction: 0.5,
        restitution: 0.3,
        linearDamping: 0.5,
        angularDamping: 0.5,
        ccd: true,
    })
};