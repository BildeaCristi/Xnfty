"use client";

import {useEffect, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {CapsuleCollider, RigidBody} from '@react-three/rapier';
import {Euler, Vector3} from 'three';
import {useMuseumStore} from '@/store/MuseumStore';

interface FirstPersonCharacterControllerProps {
    enabled?: boolean;
    position?: [number, number, number];
}

export default function FirstPersonCharacterController({
                                                           enabled = true,
                                                           position = [0, 1.6, 0]
                                                       }: FirstPersonCharacterControllerProps) {
    const {camera, gl} = useThree();
    const {playerSpeed} = useMuseumStore();

    const rigidBodyRef = useRef<any>(null);
    const isLocked = useRef(false);

    // Movement state
    const moveForward = useRef(false);
    const moveBackward = useRef(false);
    const moveLeft = useRef(false);
    const moveRight = useRef(false);
    const jump = useRef(false);

    // Camera rotation
    const euler = useRef(new Euler(0, 0, 0, 'YXZ'));
    const minPolarAngle = 0;
    const maxPolarAngle = Math.PI;

    useEffect(() => {
        // Pointer lock controls
        const handleClick = () => {
            if (enabled) {
                gl.domElement.requestPointerLock();
            }
        };

        const handleLockChange = () => {
            isLocked.current = document.pointerLockElement === gl.domElement;
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!isLocked.current || !enabled) return;

            const {movementX, movementY} = event;

            euler.current.setFromQuaternion(camera.quaternion);
            euler.current.y -= movementX * 0.002;
            euler.current.x -= movementY * 0.002;
            euler.current.x = Math.max(minPolarAngle - Math.PI / 2, Math.min(maxPolarAngle - Math.PI / 2, euler.current.x));

            camera.quaternion.setFromEuler(euler.current);
        };

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
                    jump.current = true;
                    break;
                case 'Escape':
                    document.exitPointerLock();
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
                case 'Space':
                    jump.current = false;
                    break;
            }
        };

        gl.domElement.addEventListener('click', handleClick);
        document.addEventListener('pointerlockchange', handleLockChange);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            gl.domElement.removeEventListener('click', handleClick);
            document.removeEventListener('pointerlockchange', handleLockChange);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            if (isLocked.current) {
                document.exitPointerLock();
            }
        };
    }, [camera, gl, enabled]);

    useFrame(() => {
        if (!rigidBodyRef.current || !enabled || !isLocked.current) return;

        const body = rigidBodyRef.current;
        const velocity = body.linvel();

        // Get movement direction based on camera rotation
        const cameraDirection = new Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const cameraRight = new Vector3();
        cameraRight.crossVectors(cameraDirection, camera.up).normalize();

        // Calculate movement
        const movement = new Vector3();

        if (moveForward.current) movement.add(cameraDirection);  // W = forward
        if (moveBackward.current) movement.sub(cameraDirection); // S = backward
        if (moveRight.current) movement.add(cameraRight);       // D = right
        if (moveLeft.current) movement.sub(cameraRight);        // A = left

        movement.normalize();

        // Only apply movement if there is input
        if (movement.length() > 0) {
            movement.multiplyScalar(playerSpeed);
        }

        // Apply movement while preserving vertical velocity
        body.setLinvel({x: movement.x, y: velocity.y, z: movement.z}, true);

        // Jump
        if (jump.current && Math.abs(velocity.y) < 0.1) {
            body.setLinvel({x: velocity.x, y: 5, z: velocity.z}, true);
        }

        // Sync camera position with physics body
        const position = body.translation();
        camera.position.set(position.x, position.y + 0.5, position.z);
    });

    return (
        <RigidBody
            ref={rigidBodyRef}
            position={position}
            type="dynamic"
            enabledRotations={[false, false, false]}
            linearDamping={4}
            angularDamping={4}
        >
            <CapsuleCollider args={[0.5, 0.35]}/>
        </RigidBody>
    );
} 