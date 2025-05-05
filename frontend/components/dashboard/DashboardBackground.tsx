"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function DashboardBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070715);

    // Camera with perspective that enhances 3D feel
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 40);

    // Renderer with high quality settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom effect for neon glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4, // strength
      0.1, // radius
      0.9  // threshold
    );
    composer.addPass(bloomPass);

    // Create grid floor
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

      // Create glowing line at grid intersection
      const glowingLineGeometry = new THREE.BufferGeometry();
      const points = [];
      for (let i = -gridSize / 2; i <= gridSize / 2; i += gridSize / gridDivisions) {
        points.push(new THREE.Vector3(i, -10, 0));
      }
      glowingLineGeometry.setFromPoints(points);
      
      const glowingLineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5
      });
      
      const glowingLine = new THREE.Line(glowingLineGeometry, glowingLineMaterial);
      scene.add(glowingLine);

      // Create second glowing line perpendicular to the first
      const glowingLineGeometry2 = new THREE.BufferGeometry();
      const points2 = [];
      for (let i = -gridSize / 2; i <= gridSize / 2; i += gridSize / gridDivisions) {
        points2.push(new THREE.Vector3(0, -10, i));
      }
      glowingLineGeometry2.setFromPoints(points2);
      
      const glowingLine2 = new THREE.Line(glowingLineGeometry2, glowingLineMaterial);
      scene.add(glowingLine2);

      return { gridHelper, glowingLine, glowingLine2 };
    };

    // Create NFT display frames
    const createNFTFrames = () => {
      const frames = new THREE.Group();
      
      // Create center frame (larger)
      const centerFrameGeometry = new THREE.BoxGeometry(20, 12, 0.2);
      const centerFrameMaterial = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x00ffff) }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            // Edge glow
            float edgeX = min(vUv.x, 1.0 - vUv.x);
            float edgeY = min(vUv.y, 1.0 - vUv.y);
            float edge = min(edgeX, edgeY);
            
            // Animated holographic effect
            float pulse = sin(uTime * 2.0 + vUv.x * 10.0) * 0.5 + 0.5;
            float scanLine = step(0.98, sin(vUv.y * 50.0 - uTime * 5.0) * 0.5 + 0.5) * 0.15;
            
            // Final color
            vec3 color = uColor * mix(0.5, 1.0, pulse);
            color += scanLine;
            
            // Edge glow
            float alpha = smoothstep(0.0, 0.15, edge);
            alpha = mix(1.0, alpha, 0.4);
            alpha *= 0.7;
            
            gl_FragColor = vec4(color, alpha);
          }
        `
      });

      const centerFrame = new THREE.Mesh(centerFrameGeometry, centerFrameMaterial);
      centerFrame.position.set(0, 0, -15);
      frames.add(centerFrame);

      // Create side frames (smaller)
      const sideFrameGeometry = new THREE.BoxGeometry(8, 8, 0.2);
      
      // Left frame
      const leftFrameMaterial = centerFrameMaterial.clone();
      (leftFrameMaterial as THREE.ShaderMaterial).uniforms.uColor.value = new THREE.Color(0xff00ff);
      const leftFrame = new THREE.Mesh(sideFrameGeometry, leftFrameMaterial);
      leftFrame.position.set(-15, 0, -10);
      leftFrame.rotation.y = Math.PI / 8;
      frames.add(leftFrame);
      
      // Right frame
      const rightFrameMaterial = centerFrameMaterial.clone();
      (rightFrameMaterial as THREE.ShaderMaterial).uniforms.uColor.value = new THREE.Color(0x00ff8f);
      const rightFrame = new THREE.Mesh(sideFrameGeometry, rightFrameMaterial);
      rightFrame.position.set(15, 0, -10);
      rightFrame.rotation.y = -Math.PI / 8;
      frames.add(rightFrame);

      scene.add(frames);
      
      return { 
        frames,
        materials: [centerFrameMaterial, leftFrameMaterial, rightFrameMaterial]
      };
    };

    // Create subtle network nodes and connections
    const createNetworkNodes = () => {
      const nodeCount = 100;
      const nodeSize = 0.15;
      const nodeGroup = new THREE.Group();
      
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 8, 8);
      const colors = [
        new THREE.Color(0x00ffff), // cyan
        new THREE.Color(0xff00ff), // magenta
        new THREE.Color(0x00ff8f), // mint
      ];
      
      const nodes = [];
      const nodePositions = [];
      
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
        nodePositions.push(node.position.clone());
        nodes.push(node);
        nodeGroup.add(node);
      }
      
      scene.add(nodeGroup);
      
      // Create connections between nodes
      const connections = new THREE.Group();
      const maxConnectDistance = 10;
      
      for (let i = 0; i < nodes.length; i++) {
        // Connect each node to its 2 nearest neighbors
        const nearestNeighbors = [];
        
        for (let j = 0; j < nodes.length; j++) {
          if (i !== j) {
            const distance = nodePositions[i].distanceTo(nodePositions[j]);
            if (distance < maxConnectDistance) {
              nearestNeighbors.push({ index: j, distance });
            }
          }
        }
        
        // Sort by distance and take the 2 nearest
        nearestNeighbors.sort((a, b) => a.distance - b.distance);
        const toConnect = nearestNeighbors.slice(0, 2);
        
        for (const neighbor of toConnect) {
          const points = [nodePositions[i], nodePositions[neighbor.index]];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          
          const material = new THREE.LineBasicMaterial({
            color: (nodes[i].material as THREE.MeshBasicMaterial).color,
            transparent: true,
            opacity: 0.2
          });
          
          const line = new THREE.Line(geometry, material);
          connections.add(line);
        }
      }
      
      scene.add(connections);
      
      return { nodeGroup, connections, nodes };
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

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      
      // Smooth camera movement following mouse
      targetMousePosition.current.x += (mousePosition.current.x - targetMousePosition.current.x) * 0.05;
      targetMousePosition.current.y += (mousePosition.current.y - targetMousePosition.current.y) * 0.05;
      
      camera.position.x = targetMousePosition.current.x * 10;
      camera.position.y = targetMousePosition.current.y * 5;
      camera.lookAt(0, 0, -10);
      
      // Animate NFT frames glow
      nftFrames.materials.forEach(material => {
        (material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
      });
      
      // Animate network nodes
      network.nodes.forEach((node, i) => {
        const speed = 0.2 + (i % 5) * 0.05;
        node.position.y += Math.sin(elapsedTime * speed) * 0.002;
        (node.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(elapsedTime * speed) * 0.3;
      });
      
      composer.render();
      requestAnimationFrame(animate);
    };

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Clean up THREE.js resources
      scene.clear();
      renderer.dispose();
      composer.dispose();
      
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full z-[-1]"
      style={{ background: 'linear-gradient(to bottom, #070715, #0a0a20)' }}
    />
  );
} 