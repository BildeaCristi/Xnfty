"use client";

import { ReactNode, useEffect } from 'react';
import { Physics, RapierRigidBody } from '@react-three/rapier';
import { useSceneStore } from '@/store/sceneStore';
import { Vector3 } from 'three';

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
  const { physicsConfig, updatePhysicsConfig } = useSceneStore();

  // Sync physics config with store
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
      colliders={false} // We'll define colliders per object for better control
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
  ccd?: boolean; // Continuous collision detection
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
  }),

  // Floating/hovering objects
  floating: (): PhysicsObjectConfig => ({
    type: 'dynamic',
    mass: 0.5,
    gravityScale: -0.1,
    linearDamping: 2,
    angularDamping: 1,
    friction: 0.1,
  }),

  // Heavy objects
  heavy: (): PhysicsObjectConfig => ({
    type: 'dynamic',
    mass: 10,
    friction: 0.8,
    restitution: 0.1,
    linearDamping: 0.8,
    angularDamping: 0.8,
  }),

  // Bouncy objects
  bouncy: (): PhysicsObjectConfig => ({
    type: 'dynamic',
    mass: 0.5,
    restitution: 0.9,
    friction: 0.2,
    linearDamping: 0.1,
    angularDamping: 0.1,
  }),

  // Player/Character controller
  character: (): PhysicsObjectConfig => ({
    type: 'kinematicPosition',
    enabledRotations: [false, true, false],
    friction: 0,
    restitution: 0,
    ccd: true,
  }),
};

// Hook for physics interactions
export function usePhysicsInteraction() {
  const applyImpulse = (
    body: RapierRigidBody,
    impulse: Vector3,
    point?: Vector3
  ) => {
    if (point) {
      body.applyImpulseAtPoint(impulse, point, true);
    } else {
      body.applyImpulse(impulse, true);
    }
  };

  const applyForce = (
    body: RapierRigidBody,
    force: Vector3,
    point?: Vector3
  ) => {
    if (point) {
      body.addForceAtPoint(force, point, true);
    } else {
      body.addForce(force, true);
    }
  };

  const setVelocity = (body: RapierRigidBody, velocity: Vector3) => {
    body.setLinvel(velocity, true);
  };

  const setAngularVelocity = (body: RapierRigidBody, velocity: Vector3) => {
    body.setAngvel(velocity, true);
  };

  const teleport = (body: RapierRigidBody, position: Vector3, rotation?: Vector3) => {
    body.setTranslation(position, true);
    if (rotation) {
      body.setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: 1 }, true);
    }
  };

  return {
    applyImpulse,
    applyForce,
    setVelocity,
    setAngularVelocity,
    teleport,
  };
}

// Collision event handler
export interface CollisionEvent {
  other: RapierRigidBody;
  manifold: any;
  flipped: boolean;
}

export function useCollisionHandler(
  onCollisionEnter?: (event: CollisionEvent) => void,
  onCollisionExit?: (event: CollisionEvent) => void,
  onCollisionStay?: (event: CollisionEvent) => void
) {
  return {
    onCollisionEnter,
    onCollisionExit,
    onIntersectionEnter: onCollisionStay,
  };
} 