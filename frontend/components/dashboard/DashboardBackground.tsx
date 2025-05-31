"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function DashboardBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetMousePosition = useRef({ x: 0, y: 0 });
  const [webglSupported, setWebglSupported] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Check WebGL support
  const checkWebGLSupport = () => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!context;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL support first
    if (!checkWebGLSupport()) {
      console.warn('WebGL is not supported, falling back to CSS animation');
      setWebglSupported(false);
      return;
    }

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let composer: EffectComposer;
    let isDisposed = false;

    try {
      // Setup
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x070715);

      // Camera with perspective that enhances 3D feel
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 40);

      // Renderer with error handling and lower performance settings for stability
      renderer = new THREE.WebGLRenderer({
        antialias: window.devicePixelRatio <= 1, // Disable antialiasing on high DPI devices
        powerPreference: "default", // Use default instead of high-performance
        alpha: true,
        failIfMajorPerformanceCaveat: true // Fail if performance would be poor
      });

      // Handle WebGL context loss and restore
      const canvas = renderer.domElement;
      
      const handleContextLost = (event: Event) => {
        event.preventDefault();
        setContextLost(true);
        console.warn('WebGL context lost, attempting to restore...');
        
        // Cancel animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      const handleContextRestored = () => {
        console.log('WebGL context restored');
        setContextLost(false);
        // Reinitialize scene if needed
      };

      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      
      containerRef.current.appendChild(renderer.domElement);

      // Post-processing with reduced quality for stability
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      // Simplified bloom effect
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.2, // reduced strength
        0.1, // radius
        0.9  // threshold
      );
      composer.addPass(bloomPass);

      // Create grid floor (simplified)
      const createGrid = () => {
        const gridSize = 50;
        const gridDivisions = 20;
        const gridMaterial = new THREE.LineBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.15
        });

        // Main grid
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00ffff, 0x00ffff);
        gridHelper.position.y = -10;
        gridHelper.material = gridMaterial;
        scene.add(gridHelper);

        return { gridHelper };
      };

      // Create simplified NFT frames
      const createNFTFrames = () => {
        const frames = new THREE.Group();
        
        // Create center frame (larger) with simpler material
        const centerFrameGeometry = new THREE.BoxGeometry(20, 12, 0.2);
        const centerFrameMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.3,
          wireframe: true
        });

        const centerFrame = new THREE.Mesh(centerFrameGeometry, centerFrameMaterial);
        centerFrame.position.set(0, 0, -15);
        frames.add(centerFrame);

        // Create side frames (smaller)
        const sideFrameGeometry = new THREE.BoxGeometry(8, 8, 0.2);
        
        // Left frame
        const leftFrameMaterial = new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.3,
          wireframe: true
        });
        const leftFrame = new THREE.Mesh(sideFrameGeometry, leftFrameMaterial);
        leftFrame.position.set(-15, 0, -10);
        leftFrame.rotation.y = Math.PI / 8;
        frames.add(leftFrame);
        
        // Right frame
        const rightFrameMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff8f,
          transparent: true,
          opacity: 0.3,
          wireframe: true
        });
        const rightFrame = new THREE.Mesh(sideFrameGeometry, rightFrameMaterial);
        rightFrame.position.set(15, 0, -10);
        rightFrame.rotation.y = -Math.PI / 8;
        frames.add(rightFrame);

        scene.add(frames);
        
        return { 
          frames,
          centerFrame,
          leftFrame,
          rightFrame
        };
      };

      // Create simplified network nodes
      const createNetworkNodes = () => {
        const nodeCount = 50; // Reduced count
        const nodeSize = 0.15;
        const nodeGroup = new THREE.Group();
        
        const nodeGeometry = new THREE.SphereGeometry(nodeSize, 6, 6); // Lower detail
        const colors = [
          new THREE.Color(0x00ffff),
          new THREE.Color(0xff00ff),
          new THREE.Color(0x00ff8f),
        ];
        
        const nodes = [];
        
        for (let i = 0; i < nodeCount; i++) {
          const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 0.6
          });
          
          const node = new THREE.Mesh(nodeGeometry, material);
          
          // Position nodes in a cylindrical volume around the scene
          const radius = 25 + Math.random() * 15;
          const theta = Math.random() * Math.PI * 2;
          const y = Math.random() * 30 - 15;
          
          const x = Math.cos(theta) * radius;
          const z = Math.sin(theta) * radius;
          
          node.position.set(x, y, z);
          nodes.push(node);
          nodeGroup.add(node);
        }
        
        scene.add(nodeGroup);
        
        return { nodeGroup, nodes };
      };

      // Initialize scene objects
      const grid = createGrid();
      const nftFrames = createNFTFrames();
      const network = createNetworkNodes();

      // Handle mouse movement
      const handleMouseMove = (event: MouseEvent) => {
        mousePosition.current = {
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: -(event.clientY / window.innerHeight) * 2 + 1
        };
      };

      // Animation loop with error handling
      const clock = new THREE.Clock();
      const animate = () => {
        if (isDisposed || contextLost) return;

        try {
          const elapsedTime = clock.getElapsedTime();
          
          // Smooth camera movement following mouse
          targetMousePosition.current.x += (mousePosition.current.x - targetMousePosition.current.x) * 0.05;
          targetMousePosition.current.y += (mousePosition.current.y - targetMousePosition.current.y) * 0.05;
          
          camera.position.x = targetMousePosition.current.x * 10;
          camera.position.y = targetMousePosition.current.y * 5;
          camera.lookAt(0, 0, -10);
          
          // Simple rotation animations
          nftFrames.centerFrame.rotation.y = elapsedTime * 0.1;
          nftFrames.leftFrame.rotation.y = Math.PI / 8 + elapsedTime * 0.15;
          nftFrames.rightFrame.rotation.y = -Math.PI / 8 - elapsedTime * 0.15;
          
          // Animate network nodes
          network.nodes.forEach((node, i) => {
            const speed = 0.2 + (i % 5) * 0.05;
            node.position.y += Math.sin(elapsedTime * speed) * 0.002;
            (node.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(elapsedTime * speed) * 0.3;
          });
          
          composer.render();
          animationFrameRef.current = requestAnimationFrame(animate);
        } catch (error) {
          console.error('Animation error:', error);
          setWebglSupported(false);
        }
      };

      // Handle window resize
      const handleResize = () => {
        if (isDisposed) return;

        try {
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          
          renderer.setSize(width, height);
          composer.setSize(width, height);
        } catch (error) {
          console.error('Resize error:', error);
        }
      };

      // Add event listeners
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);
      
      // Start animation
      animate();
      
      // Cleanup function
      return () => {
        isDisposed = true;
        
        // Remove event listeners
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        
        // Cancel animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Clean up THREE.js resources
        try {
          // Remove canvas event listeners
          canvas.removeEventListener('webglcontextlost', handleContextLost);
          canvas.removeEventListener('webglcontextrestored', handleContextRestored);
          
          scene.clear();
          
          // Dispose renderer and composer
          renderer.dispose();
          composer.dispose();
          
          // Remove canvas from DOM
          if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
          }
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };

    } catch (error) {
      console.error('WebGL initialization error:', error);
      setWebglSupported(false);
      return;
    }
  }, []);

  // Fallback CSS animation when WebGL is not supported or fails
  if (!webglSupported || contextLost) {
    return (
      <div 
        className="fixed inset-0 w-full h-full z-[-1] animate-pulse"
        style={{ 
          background: `
            linear-gradient(45deg, #070715 0%, #0a0a20 25%, #070715 50%, #0a0a20 75%, #070715 100%),
            radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)
          `,
          backgroundSize: '400% 400%, 100% 100%, 100% 100%',
          animation: 'gradientShift 8s ease infinite'
        }}
      >
        <style jsx>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%, 0% 0%, 0% 0%; }
            50% { background-position: 100% 50%, 0% 0%, 0% 0%; }
          }
        `}</style>
        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-400 text-sm opacity-50">
            <div className="bg-gray-900/80 px-4 py-2 rounded-lg backdrop-blur-sm">
              Graphics context restored - Fallback mode active
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full z-[-1]"
      style={{ background: 'linear-gradient(to bottom, #070715, #0a0a20)' }}
    />
  );
} 