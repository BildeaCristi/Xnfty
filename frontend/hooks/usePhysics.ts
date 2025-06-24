import { useRef, useEffect, useCallback } from 'react';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import { PhysicsService } from '@/services/physicsService';
import { PHYSICS_PRESETS, PHYSICS_MATERIALS } from '@/config/physicsSettings';

export interface UsePhysicsOptions {
  id: string;
  preset?: keyof typeof PHYSICS_PRESETS;
  material?: keyof typeof PHYSICS_MATERIALS;
  onCollisionEnter?: (otherId: string) => void;
  onCollisionExit?: (otherId: string) => void;
}

export interface UsePhysicsReturn {
  rigidBodyRef: React.RefObject<RapierRigidBody>;
  applyImpulse: (impulse: Vector3, point?: Vector3) => boolean;
  applyForce: (force: Vector3, point?: Vector3) => boolean;
  setVelocity: (velocity: Vector3) => boolean;
  setAngularVelocity: (velocity: Vector3) => boolean;
  teleport: (position: Vector3, rotation?: Vector3) => boolean;
  isColliding: (otherId: string) => boolean;
  getCollisions: () => string[];
}

export function usePhysics(options: UsePhysicsOptions): UsePhysicsReturn {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { id, onCollisionEnter, onCollisionExit } = options;

  useEffect(() => {
    const body = rigidBodyRef.current;
    if (body) {
      PhysicsService.registerRigidBody(id, body);
    }

    return () => {
      PhysicsService.unregisterRigidBody(id);
    };
  }, [id]);

  useEffect(() => {
    if (onCollisionEnter || onCollisionExit) {
      // In a real implementation, you would set up collision event listeners here
      // This is a simplified version
    }
  }, [onCollisionEnter, onCollisionExit]);

  const applyImpulse = useCallback((impulse: Vector3, point?: Vector3): boolean => {
    const result = PhysicsService.applyImpulse(id, impulse, point);
    return result.success;
  }, [id]);

  const applyForce = useCallback((force: Vector3, point?: Vector3): boolean => {
    const result = PhysicsService.applyForce(id, force, point);
    return result.success;
  }, [id]);

  const setVelocity = useCallback((velocity: Vector3): boolean => {
    const result = PhysicsService.setVelocity(id, velocity);
    return result.success;
  }, [id]);

  const setAngularVelocity = useCallback((velocity: Vector3): boolean => {
    const result = PhysicsService.setAngularVelocity(id, velocity);
    return result.success;
  }, [id]);

  const teleport = useCallback((position: Vector3, rotation?: Vector3): boolean => {
    const result = PhysicsService.teleport(id, position, rotation);
    return result.success;
  }, [id]);

  const isColliding = useCallback((otherId: string): boolean => {
    return PhysicsService.isColliding(id, otherId);
  }, [id]);

  const getCollisions = useCallback((): string[] => {
    return PhysicsService.getCollisions(id);
  }, [id]);

  return {
    rigidBodyRef,
    applyImpulse,
    applyForce,
    setVelocity,
    setAngularVelocity,
    teleport,
    isColliding,
    getCollisions,
  };
}

export function useCharacterController(id: string) {
  const physics = usePhysics({ id });
  
  const move = useCallback((direction: Vector3, speed: number) => {
    const velocity = direction.clone().multiplyScalar(speed);
    return physics.setVelocity(velocity);
  }, [physics]);

  const jump = useCallback((force: number) => {
    const jumpImpulse = new Vector3(0, force, 0);
    return physics.applyImpulse(jumpImpulse);
  }, [physics]);

  const stop = useCallback(() => {
    return physics.setVelocity(new Vector3(0, 0, 0));
  }, [physics]);

  return {
    ...physics,
    move,
    jump,
    stop,
  };
}
