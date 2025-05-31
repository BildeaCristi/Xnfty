"use client";

import {useEffect, useRef} from "react";
import * as THREE from "three";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function MainBackground() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mousePosition = useRef({x: 0, y: 0});
    const targetMousePosition = useRef({x: 0, y: 0});

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

        // Create NFT blockchain visualization nodes
        const createNodes = () => {
            const nodeCount = 200;
            const geometry = new THREE.IcosahedronGeometry(0.5, 0);
            const material = new THREE.MeshBasicMaterial();

            const nodes = new THREE.Group();
            const nodeMeshes: THREE.Mesh[] = [];
            const nodePositions: THREE.Vector3[] = [];
            const nodeColors: THREE.Color[] = [];

            // Color palette for nodes
            const colors = [
                new THREE.Color(0x00ffff), // cyan
                new THREE.Color(0xff00ff), // magenta
                new THREE.Color(0x00ff8f), // mint
                new THREE.Color(0x8f00ff), // purple
                new THREE.Color(0xff8f00)  // orange
            ];

            for (let i = 0; i < nodeCount; i++) {
                const mesh = new THREE.Mesh(geometry, material.clone());

                // Position in a spherical-like volume
                const radius = Math.random() * 25 + 10;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;

                const x = Math.sin(phi) * Math.cos(theta) * radius;
                const y = Math.sin(phi) * Math.sin(theta) * radius;
                const z = Math.cos(phi) * radius;

                mesh.position.set(x, y, z);
                mesh.scale.setScalar(Math.random() * 0.5 + 0.5);

                // Random color from palette
                const color = colors[Math.floor(Math.random() * colors.length)];
                (mesh.material as THREE.MeshBasicMaterial).color = color;
                (mesh.material as THREE.MeshBasicMaterial).transparent = true;
                (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;

                nodePositions.push(mesh.position.clone());
                nodeColors.push(color);
                nodeMeshes.push(mesh);
                nodes.add(mesh);
            }

            scene.add(nodes);
            return {meshes: nodeMeshes, positions: nodePositions, colors, group: nodes};
        };

        // Create connection lines between nodes
        const createConnections = (nodes: {
            meshes: THREE.Mesh[],
            positions: THREE.Vector3[],
            colors: THREE.Color[]
        }) => {
            const connections = new THREE.Group();
            const lineSegments: THREE.Line[] = [];
            const maxDistance = 10; // Max distance for connections

            for (let i = 0; i < nodes.meshes.length; i++) {
                for (let j = i + 1; j < nodes.meshes.length; j++) {
                    const distance = nodes.positions[i].distanceTo(nodes.positions[j]);

                    if (distance < maxDistance) {
                        // Create line geometry
                        const points = [nodes.positions[i], nodes.positions[j]];
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);

                        // Create gradient material based on node colors
                        const material = new THREE.LineBasicMaterial({
                            color: nodes.colors[i % nodes.colors.length],
                            transparent: true,
                            opacity: 0.2 * (1 - distance / maxDistance)
                        });

                        const line = new THREE.Line(geometry, material);
                        lineSegments.push(line);
                        connections.add(line);
                    }
                }
            }

            scene.add(connections);
            return {lines: lineSegments, group: connections};
        };

        // Create holographic NFT frames
        const createNFTDisplays = () => {
            const displayCount = 8;
            const displays = new THREE.Group();
            const displayMeshes: THREE.Mesh[] = [];

            for (let i = 0; i < displayCount; i++) {
                // Frame geometry
                const frameGeometry = new THREE.BoxGeometry(6, 6, 0.2);
                const frameMaterial = new THREE.ShaderMaterial({
                    transparent: true,
                    uniforms: {
                        uTime: {value: 0},
                        uColor: {value: new THREE.Color(0x00ffff)}
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

                const frame = new THREE.Mesh(frameGeometry, frameMaterial);

                // Position in a circular pattern around the scene
                const angle = (i / displayCount) * Math.PI * 2;
                const radius = 25;
                frame.position.x = Math.cos(angle) * radius;
                frame.position.z = Math.sin(angle) * radius;
                frame.position.y = Math.sin(angle * 3) * 5; // Vary height

                // Orient toward center
                frame.lookAt(0, 0, 0);

                displayMeshes.push(frame);
                displays.add(frame);
            }

            scene.add(displays);
            return {meshes: displayMeshes, group: displays};
        };

        // Create data flow particles
        const createDataFlow = () => {
            const geometry = new THREE.BufferGeometry();
            const particleCount = 1000;

            const positions = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            const speeds = new Float32Array(particleCount);
            const offsets = new Float32Array(particleCount);
            const colors = new Float32Array(particleCount * 3);

            // Color palette
            const colorsArray = [
                [0, 1, 1],    // cyan
                [1, 0, 1],    // magenta
                [0, 1, 0.56], // mint
                [0.56, 0, 1], // purple
                [1, 0.56, 0]  // orange
            ];

            for (let i = 0; i < particleCount; i++) {
                // Create flow paths (curved lines across the scene)
                const radius = Math.random() * 30 + 5;
                const angle = Math.random() * Math.PI * 2;
                const height = (Math.random() - 0.5) * 30;

                const idx = i * 3;
                positions[idx] = Math.cos(angle) * radius;
                positions[idx + 1] = height;
                positions[idx + 2] = Math.sin(angle) * radius;

                // Particle properties
                sizes[i] = Math.random() * 3 + 0.5;
                speeds[i] = Math.random() * 2 + 0.5;
                offsets[i] = Math.random() * 100;

                // Colors
                const colorIdx = Math.floor(Math.random() * colorsArray.length);
                colors[idx] = colorsArray[colorIdx][0];
                colors[idx + 1] = colorsArray[colorIdx][1];
                colors[idx + 2] = colorsArray[colorIdx][2];
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
            geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexShader: `
          attribute float size;
          attribute float speed;
          attribute float offset;
          attribute vec3 color;
          
          varying vec3 vColor;
          
          uniform float uTime;
          
          void main() {
            vColor = color;
            
            // Animated position along path
            vec3 pos = position;
            float animationProgress = mod(uTime * speed + offset, 100.0);
            
            // Move particles along their path
            float angle = atan(pos.z, pos.x) + animationProgress * 0.02;
            float radius = length(vec2(pos.x, pos.z));
            
            pos.x = cos(angle) * radius;
            pos.z = sin(angle) * radius;
            
            // Add vertical oscillation
            pos.y += sin(animationProgress * 0.3) * 2.0;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = size * (30.0 / -mvPosition.z);
          }
        `,
                fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            // Create circular particles with soft edges
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            // Glow effect
            vec3 glow = vColor;
            float intensity = 1.0 - dist * 2.0;
            intensity = pow(intensity, 2.0);
            
            gl_FragColor = vec4(glow, intensity);
          }
        `,
                uniforms: {
                    uTime: {value: 0}
                }
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            return {mesh: particles, material, geometry};
        };

        // Create dynamic blockchain background grid
        const createGrid = () => {
            const gridSize = 100;
            const divisions = 30;
            const geometry = new THREE.PlaneGeometry(gridSize, gridSize, divisions, divisions);

            const material = new THREE.ShaderMaterial({
                wireframe: true,
                transparent: true,
                uniforms: {
                    uTime: {value: 0},
                    uMouse: {value: new THREE.Vector2(0, 0)}
                },
                vertexShader: `
          uniform float uTime;
          uniform vec2 uMouse;
          
          varying vec2 vUv;
          varying float vElevation;
          
          // Noise function
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
          
          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
            m = m*m;
            m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }
          
          void main() {
            vUv = uv;
            
            // Calculate distance from mouse position in normalized space
            vec2 mouseEffect = uMouse * 0.5 + 0.5; // Convert -1,1 to 0,1
            float distToMouse = distance(vUv, mouseEffect);
            
            // Create wave effect that follows mouse
            float mouseWave = sin(distToMouse * 10.0 - uTime) * smoothstep(0.5, 0.0, distToMouse);
            
            // Add noise-based terrain
            float noise = snoise(vUv * 3.0 + uTime * 0.1) * 0.5;
            noise += snoise(vUv * 6.0 - uTime * 0.15) * 0.25;
            
            // Combine effects
            float elevation = noise + mouseWave * 2.0;
            vElevation = elevation;
            
            // Apply to vertex
            vec3 newPosition = position;
            newPosition.z = elevation * 5.0;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
                fragmentShader: `
          uniform float uTime;
          
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            // Create a glowing grid effect
            vec3 baseColor = vec3(0.0, 0.4, 0.8);
            vec3 highlightColor = vec3(0.0, 0.8, 1.0);
            
            // Pulse effect
            float pulse = (sin(uTime) * 0.5 + 0.5) * 0.2;
            
            // Grid elevation affects color
            float elevationColor = smoothstep(-1.0, 1.0, vElevation);
            vec3 color = mix(baseColor, highlightColor, elevationColor + pulse);
            
            // Fade edges and by elevation
            float alpha = 0.3 + elevationColor * 0.2;
            
            gl_FragColor = vec4(color, alpha);
          }
        `
            });

            const grid = new THREE.Mesh(geometry, material);
            grid.rotation.x = -Math.PI / 2;
            grid.position.y = -10;
            scene.add(grid);

            return {mesh: grid, material, geometry};
        };

        // Initialize scene elements
        const nodes = createNodes();
        const connections = createConnections(nodes);
        const nftDisplays = createNFTDisplays();
        const dataFlow = createDataFlow();
        const grid = createGrid();

        // Camera movement based on mouse
        const handleMouseMove = (event: MouseEvent) => {
            // Normalize coordinates (-1 to 1)
            targetMousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            targetMousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        // Handle touch events for mobile
        const handleTouchMove = (event: TouchEvent) => {
            if (event.touches.length > 0) {
                targetMousePosition.current.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
                targetMousePosition.current.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        };

        // Interactive effects on click/tap
        const handleInteraction = (event: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in event
                ? (event as TouchEvent).touches[0].clientX
                : (event as MouseEvent).clientX;

            const clientY = 'touches' in event
                ? (event as TouchEvent).touches[0].clientY
                : (event as MouseEvent).clientY;

            // Calculate click/tap position in normalized device coordinates
            const x = (clientX / window.innerWidth) * 2 - 1;
            const y = -(clientY / window.innerHeight) * 2 + 1;

            // Create ripple effect from the grid
            const createRipple = () => {
                const timeline = {value: 0};
                const duration = 1.5; // seconds
                const startTime = performance.now();

                const animateRipple = () => {
                    const elapsed = (performance.now() - startTime) / 1000;
                    const progress = Math.min(elapsed / duration, 1);

                    if (progress < 1) {
                        requestAnimationFrame(animateRipple);
                    }
                };

                animateRipple();
            };

            createRipple();

            // Animate a random display to "showcase" an NFT
            const randomDisplay = Math.floor(Math.random() * nftDisplays.meshes.length);
            const display = nftDisplays.meshes[randomDisplay];

            // Highlight animation
            const originalScale = display.scale.x;
            display.scale.set(originalScale * 1.3, originalScale * 1.3, originalScale * 1.3);

            setTimeout(() => {
                display.scale.set(originalScale, originalScale, originalScale);
            }, 1000);
        };

        // Animation loop
        const clock = new THREE.Clock();
        let lastElapsedTime = 0;

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            const deltaTime = elapsedTime - lastElapsedTime;
            lastElapsedTime = elapsedTime;

            // Update uniforms with time
            if (dataFlow.material.uniforms) dataFlow.material.uniforms.uTime.value = elapsedTime;
            if (grid.material.uniforms) {
                grid.material.uniforms.uTime.value = elapsedTime;
                grid.material.uniforms.uMouse.value.x = mousePosition.current.x;
                grid.material.uniforms.uMouse.value.y = mousePosition.current.y;
            }

            // Update NFT displays
            nftDisplays.meshes.forEach(display => {
                if ((display.material as THREE.ShaderMaterial).uniforms) {
                    (display.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
                }
            });

            // Smooth camera movement towards mouse position
            mousePosition.current.x += (targetMousePosition.current.x - mousePosition.current.x) * 2 * deltaTime;
            mousePosition.current.y += (targetMousePosition.current.y - mousePosition.current.y) * 2 * deltaTime;

            // Move camera based on mouse for parallax effect
            camera.position.x = mousePosition.current.x * 5;
            camera.position.y = mousePosition.current.y * 5;

            // Always look at center
            camera.lookAt(0, 0, 0);

            // Rotate node network slowly
            nodes.group.rotation.y += deltaTime * 0.05;

            // Render with composer for post-processing effects
            composer.render();

            requestAnimationFrame(animate);
        };

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };

        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('resize', handleResize);

        // Start animation
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('resize', handleResize);

            containerRef.current?.removeChild(renderer.domElement);

            // Dispose resources
            renderer.dispose();
            composer.dispose();

            // Dispose geometries and materials
            grid.geometry.dispose();
            (grid.material as THREE.Material).dispose();

            dataFlow.geometry.dispose();
            (dataFlow.material as THREE.Material).dispose();

            // Dispose NFT displays
            nftDisplays.meshes.forEach(mesh => {
                mesh.geometry.dispose();
                (mesh.material as THREE.Material).dispose();
            });

            // Dispose nodes and connections
            connections.lines.forEach(line => {
                line.geometry.dispose();
                (line.material as THREE.Material).dispose();
            });

            nodes.meshes.forEach(mesh => {
                mesh.geometry.dispose();
                (mesh.material as THREE.Material).dispose();
            });
        };
    }, []);

    return <>
        <div ref={containerRef} className="fixed inset-0 -z-10"/>
    </>
}