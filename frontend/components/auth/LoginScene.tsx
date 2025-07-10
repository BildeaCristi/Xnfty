"use client";

import {useEffect, useRef} from "react";
import * as THREE from "three";

export default function LoginScene() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mousePosition = useRef({x: 0, y: 0});
    const targetMousePosition = useRef({x: 0, y: 0});

    useEffect(() => {
        if (!containerRef.current) return;

        // Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x070715);

        // Camera
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 30);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Create floating particles
        const createParticles = () => {
            const particleCount = 100;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);

            // Color palette
            const colorPalette = [
                [0, 1, 1],    // cyan
                [1, 0, 1],    // magenta
                [0, 1, 0.56], // mint
                [0.56, 0, 1], // purple
                [1, 0.56, 0]  // orange
            ];

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;

                // Random positions in a sphere
                const radius = Math.random() * 25 + 5;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;

                positions[i3] = Math.sin(phi) * Math.cos(theta) * radius;
                positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
                positions[i3 + 2] = Math.cos(phi) * radius;

                // Random colors
                const colorIndex = Math.floor(Math.random() * colorPalette.length);
                colors[i3] = colorPalette[colorIndex][0];
                colors[i3 + 1] = colorPalette[colorIndex][1];
                colors[i3 + 2] = colorPalette[colorIndex][2];
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: 2,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            return {mesh: particles, positions};
        };

        // Create floating NFT frames
        const createNFTFrames = () => {
            const frameCount = 6;
            const frames = [];

            for (let i = 0; i < frameCount; i++) {
                // Frame geometry
                const frameGeometry = new THREE.BoxGeometry(4, 4, 0.1);
                const frameMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(i / frameCount, 0.8, 0.6),
                    transparent: true,
                    opacity: 0.6,
                    wireframe: true
                });

                const frame = new THREE.Mesh(frameGeometry, frameMaterial);

                // Position in a circle
                const angle = (i / frameCount) * Math.PI * 2;
                const radius = 20;
                frame.position.x = Math.cos(angle) * radius;
                frame.position.z = Math.sin(angle) * radius;
                frame.position.y = Math.sin(angle * 2) * 3;

                frames.push(frame);
                scene.add(frame);
            }

            return frames;
        };

        // Initialize scene elements
        const particles = createParticles();
        const nftFrames = createNFTFrames();

        // Mouse interaction
        const handleMouseMove = (event: MouseEvent) => {
            targetMousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            targetMousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        // Touch interaction
        const handleTouchMove = (event: TouchEvent) => {
            if (event.touches.length > 0) {
                targetMousePosition.current.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
                targetMousePosition.current.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        };

        // Click interaction
        const handleClick = () => {
            // Simple animation on click - rotate a random frame
            const randomFrame = nftFrames[Math.floor(Math.random() * nftFrames.length)];
            const originalRotation = randomFrame.rotation.z;

            // Animate rotation
            let progress = 0;
            const animate = () => {
                progress += 0.05;
                randomFrame.rotation.z = originalRotation + Math.sin(progress) * 0.5;

                if (progress < Math.PI * 2) {
                    requestAnimationFrame(animate);
                } else {
                    randomFrame.rotation.z = originalRotation;
                }
            };
            animate();
        };

        // Animation loop
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Smooth mouse following
            mousePosition.current.x += (targetMousePosition.current.x - mousePosition.current.x) * 0.02;
            mousePosition.current.y += (targetMousePosition.current.y - mousePosition.current.y) * 0.02;

            // Camera parallax
            camera.position.x = mousePosition.current.x * 3;
            camera.position.y = mousePosition.current.y * 3;
            camera.lookAt(0, 0, 0);

            // Rotate particles slowly
            particles.mesh.rotation.y = elapsedTime * 0.1;
            particles.mesh.rotation.x = elapsedTime * 0.05;

            // Animate NFT frames
            nftFrames.forEach((frame, index) => {
                frame.rotation.y = elapsedTime * 0.2 + index;
                frame.position.y = Math.sin(elapsedTime + index) * 2;
            });

            // Animate particles positions slightly
            const positions = particles.mesh.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(elapsedTime + i) * 0.01;
            }
            particles.mesh.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('resize', handleResize);

        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('resize', handleResize);

            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }

            renderer.dispose();
            particles.mesh.geometry.dispose();
            (particles.mesh.material as THREE.Material).dispose();

            nftFrames.forEach(frame => {
                frame.geometry.dispose();
                (frame.material as THREE.Material).dispose();
            });
        };
    }, []);

    return <div ref={containerRef} className="fixed inset-0 -z-10"/>;
}