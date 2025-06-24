import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import { PHYSICS_WORLD_CONFIG, PHYSICS_PRESETS, PHYSICS_MATERIALS } from '@/config/physicsSettings';

export interface PhysicsInteractionResult {
  success: boolean;
  error?: string;
}

export class PhysicsService {
  private static activeCollisions = new Map<string, Set<string>>();
  private static rigidBodies = new Map<string, RapierRigidBody>();

  static registerRigidBody(id: string, body: RapierRigidBody): void {
    this.rigidBodies.set(id, body);
  }

  static unregisterRigidBody(id: string): void {
    this.rigidBodies.delete(id);
    this.activeCollisions.delete(id);
  }

  static applyImpulse(
    bodyId: string,
    impulse: Vector3,
    point?: Vector3
  ): PhysicsInteractionResult {
    const body = this.rigidBodies.get(bodyId);
    if (!body) {
      return { success: false, error: `RigidBody ${bodyId} not found` };
    }

    try {
      if (point) {
        body.applyImpulseAtPoint(impulse, point, true);
      } else {
        body.applyImpulse(impulse, true);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to apply impulse: ${error}` };
    }
  }

  static applyForce(
    bodyId: string,
    force: Vector3,
    point?: Vector3
  ): PhysicsInteractionResult {
    const body = this.rigidBodies.get(bodyId);
    if (!body) {
      return { success: false, error: `RigidBody ${bodyId} not found` };
    }

    try {
      if (point) {
        body.addForceAtPoint(force, point, true);
      } else {
        body.addForce(force, true);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to apply force: ${error}` };
    }
  }

  static setVelocity(bodyId: string, velocity: Vector3): PhysicsInteractionResult {
    const body = this.rigidBodies.get(bodyId);
    if (!body) {
      return { success: false, error: `RigidBody ${bodyId} not found` };
    }

    try {
      body.setLinvel(velocity, true);
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to set velocity: ${error}` };
    }
  }

  static setAngularVelocity(bodyId: string, velocity: Vector3): PhysicsInteractionResult {
    const body = this.rigidBodies.get(bodyId);
    if (!body) {
      return { success: false, error: `RigidBody ${bodyId} not found` };
    }

    try {
      body.setAngvel(velocity, true);
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to set angular velocity: ${error}` };
    }
  }

  static teleport(
    bodyId: string,
    position: Vector3,
    rotation?: Vector3
  ): PhysicsInteractionResult {
    const body = this.rigidBodies.get(bodyId);
    if (!body) {
      return { success: false, error: `RigidBody ${bodyId} not found` };
    }

    try {
      body.setTranslation(position, true);
      if (rotation) {
        body.setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: 1 }, true);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to teleport: ${error}` };
    }
  }

  static handleCollisionEnter(bodyId1: string, bodyId2: string): void {
    if (!this.activeCollisions.has(bodyId1)) {
      this.activeCollisions.set(bodyId1, new Set());
    }
    if (!this.activeCollisions.has(bodyId2)) {
      this.activeCollisions.set(bodyId2, new Set());
    }

    this.activeCollisions.get(bodyId1)?.add(bodyId2);
    this.activeCollisions.get(bodyId2)?.add(bodyId1);
  }

  static handleCollisionExit(bodyId1: string, bodyId2: string): void {
    this.activeCollisions.get(bodyId1)?.delete(bodyId2);
    this.activeCollisions.get(bodyId2)?.delete(bodyId1);
  }

  static isColliding(bodyId1: string, bodyId2: string): boolean {
    return this.activeCollisions.get(bodyId1)?.has(bodyId2) || false;
  }

  static getCollisions(bodyId: string): string[] {
    return Array.from(this.activeCollisions.get(bodyId) || []);
  }

  static getPhysicsPreset(presetName: keyof typeof PHYSICS_PRESETS) {
    return PHYSICS_PRESETS[presetName];
  }

  static getPhysicsMaterial(materialName: keyof typeof PHYSICS_MATERIALS) {
    return PHYSICS_MATERIALS[materialName];
  }

  static createCharacterController(bodyId: string) {
    return {
      move: (direction: Vector3, speed: number) => {
        const velocity = direction.clone().multiplyScalar(speed);
        velocity.y = 0; // Preserve gravity
        return this.setVelocity(bodyId, velocity);
      },
      jump: (force: number) => {
        const jumpImpulse = new Vector3(0, force, 0);
        return this.applyImpulse(bodyId, jumpImpulse);
      },
      stop: () => {
        return this.setVelocity(bodyId, new Vector3(0, 0, 0));
      },
    };
  }

  static cleanup(): void {
    this.activeCollisions.clear();
    this.rigidBodies.clear();
  }

  static getStats() {
    return {
      rigidBodies: this.rigidBodies.size,
      activeCollisions: Array.from(this.activeCollisions.values())
        .reduce((sum, set) => sum + set.size, 0),
    };
  }
}
