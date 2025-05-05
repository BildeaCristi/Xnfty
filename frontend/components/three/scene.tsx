"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameState } from '@/hooks/useGameState';
import { WorldGenerator } from './world-generator';
import { CameraController } from './camera-controller';
import { InputController } from './input-controller';

const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const inputControllerRef = useRef<InputController | null>(null);
  const isPlaying = useGameState(state => state.isPlaying);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.7, 5); // Eye height
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Setup world
    const worldGenerator = new WorldGenerator(scene);
    worldGenerator.generateBasicWorld();

    // Setup camera controller
    const cameraController = new CameraController(camera);
    cameraController.setupControls();
    cameraControllerRef.current = cameraController;

    // Setup input controller
    const inputController = new InputController();
    inputController.setupListeners();
    inputControllerRef.current = inputController;

    // Handle camera rotation
    const handleCameraRotation = (event: Event) => {
      if (!cameraRef.current) return;

      const customEvent = event as CustomEvent;
      const { movementX, movementY } = customEvent.detail;

      cameraRef.current.rotation.y -= movementX * 0.002;

      // Limit vertical rotation to prevent camera flipping
      const currentRotationX = cameraRef.current.rotation.x;
      const newRotationX = currentRotationX - movementY * 0.002;
      cameraRef.current.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, newRotationX)
      );
    };

    document.addEventListener('camera-rotate', handleCameraRotation);

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (isPlaying && cameraControllerRef.current) {
        cameraControllerRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Cleanup
    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      if (cameraControllerRef.current) {
        cameraControllerRef.current.removeControls();
      }

      if (inputControllerRef.current) {
        inputControllerRef.current.removeListeners();
      }

      document.removeEventListener('camera-rotate', handleCameraRotation);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
    />
  );
};

export default ThreeScene;