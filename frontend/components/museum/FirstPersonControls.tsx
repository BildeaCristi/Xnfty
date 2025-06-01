"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler, Quaternion } from 'three';
import { PointerLockControls as PointerLockControlsImpl } from 'three/examples/jsm/controls/PointerLockControls';

interface FirstPersonControlsProps {
  speed?: number;
  jumpHeight?: number;
  enabled?: boolean;
  onLockChange?: (locked: boolean) => void;
}

export interface FirstPersonControlsRef {
  isLocked: () => boolean;
}

const FirstPersonControls = forwardRef<FirstPersonControlsRef, FirstPersonControlsProps>(
  ({ speed = 10, jumpHeight = 2, enabled = true, onLockChange }, ref) => {
    const { camera, gl } = useThree();
    const controlsRef = useRef<PointerLockControlsImpl | null>(null);
    
    // Movement state
    const moveForward = useRef(false);
    const moveBackward = useRef(false);
    const moveLeft = useRef(false);
    const moveRight = useRef(false);
    const canJump = useRef(true);
    const velocity = useRef(new Vector3());
    const direction = useRef(new Vector3());
    
    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      isLocked: () => controlsRef.current?.isLocked || false,
    }));
    
    useEffect(() => {
      // Create controls
      const controls = new PointerLockControlsImpl(camera, gl.domElement);
      controlsRef.current = controls;
      
      // Add click to lock pointer
      const handleClick = () => {
        if (enabled) {
          controls.lock();
        }
      };
      
      gl.domElement.addEventListener('click', handleClick);
      
      // Keyboard controls
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!enabled) return;
        
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            moveForward.current = true;
            break;
          case 'KeyS':
          case 'ArrowDown':
            moveBackward.current = true;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            moveLeft.current = true;
            break;
          case 'KeyD':
          case 'ArrowRight':
            moveRight.current = true;
            break;
          case 'Space':
            if (canJump.current) {
              velocity.current.y = jumpHeight;
              canJump.current = false;
            }
            break;
          case 'Escape':
            controls.unlock();
            break;
        }
      };
      
      const handleKeyUp = (e: KeyboardEvent) => {
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            moveForward.current = false;
            break;
          case 'KeyS':
          case 'ArrowDown':
            moveBackward.current = false;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            moveLeft.current = false;
            break;
          case 'KeyD':
          case 'ArrowRight':
            moveRight.current = false;
            break;
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      // Show instructions when pointer is locked
      controls.addEventListener('lock', () => {
        onLockChange?.(true);
      });
      
      controls.addEventListener('unlock', () => {
        onLockChange?.(false);
      });
      
      return () => {
        gl.domElement.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        controls.dispose();
      };
    }, [camera, gl, jumpHeight, onLockChange]);
    
    // Separate effect to handle enabled state changes
    useEffect(() => {
      // Unlock controls when disabled (e.g., when modal opens)
      if (!enabled && controlsRef.current?.isLocked) {
        controlsRef.current.unlock();
        // Reset movement states
        moveForward.current = false;
        moveBackward.current = false;
        moveLeft.current = false;
        moveRight.current = false;
      }
    }, [enabled]);
    
    useFrame((state, delta) => {
      if (!controlsRef.current || !controlsRef.current.isLocked || !enabled) return;
      
      // Apply gravity
      velocity.current.y -= 9.8 * delta;
      
      // Calculate movement direction
      direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
      direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
      direction.current.normalize();
      
      // Apply movement
      if (moveForward.current || moveBackward.current) {
        velocity.current.z -= direction.current.z * speed * delta;
      }
      if (moveLeft.current || moveRight.current) {
        velocity.current.x -= direction.current.x * speed * delta;
      }
      
      // Move the camera
      controlsRef.current.moveRight(-velocity.current.x * delta);
      controlsRef.current.moveForward(-velocity.current.z * delta);
      
      // Apply vertical movement (jumping/falling)
      camera.position.y += velocity.current.y * delta;
      
      // Simple ground collision
      if (camera.position.y <= 1.6) {
        velocity.current.y = 0;
        camera.position.y = 1.6;
        canJump.current = true;
      }
      
      // Apply damping
      velocity.current.x *= 0.9;
      velocity.current.z *= 0.9;
      
      // Keep camera within museum bounds
      const bounds = 9.5; // Half of room size minus margin
      camera.position.x = Math.max(-bounds, Math.min(bounds, camera.position.x));
      camera.position.z = Math.max(-bounds, Math.min(bounds, camera.position.z));
    });
    
    return null;
  }
);

export default FirstPersonControls; 