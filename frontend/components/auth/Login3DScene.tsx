"use client";

import {useEffect, useRef} from "react";
import * as THREE from "three";

export default function Login3DScene() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useRef(0);
    const mouseY = useRef(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // Setting up the 3D world
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);

        // Creating the camera to look at our 3D world
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        // Creating the renderer that draws everything on screen
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Making 30 colorful cubes floating around
        const cubes: THREE.Mesh[] = [];
        for (let i = 0; i < 30; i++) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({
                color: Math.random() * 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const cube = new THREE.Mesh(geometry, material);

            // Put each cube at a random position
            cube.position.x = (Math.random() - 0.5) * 40;
            cube.position.y = (Math.random() - 0.5) * 40;
            cube.position.z = (Math.random() - 0.5) * 40;

            scene.add(cube);
            cubes.push(cube);
        }

        // Making some lines to connect things
        const lines: THREE.Line[] = [];
        for (let i = 0; i < 15; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(6);

            // Setting start and end points for each line
            positions[0] = (Math.random() - 0.5) * 30;
            positions[1] = (Math.random() - 0.5) * 30;
            positions[2] = (Math.random() - 0.5) * 30;
            positions[3] = (Math.random() - 0.5) * 30;
            positions[4] = (Math.random() - 0.5) * 30;
            positions[5] = (Math.random() - 0.5) * 30;

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.LineBasicMaterial({
                color: 0x0099ff,
                transparent: true,
                opacity: 0.3
            });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            lines.push(line);
        }

        // Creating small green balls as particles
        const particles: THREE.Mesh[] = [];
        for (let i = 0; i < 60; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.9
            });
            const particle = new THREE.Mesh(geometry, material);

            // Spreading particles around randomly
            particle.position.x = (Math.random() - 0.5) * 50;
            particle.position.y = (Math.random() - 0.5) * 50;
            particle.position.z = (Math.random() - 0.5) * 50;

            scene.add(particle);
            particles.push(particle);
        }

        // Function to track mouse movement
        const handleMouseMove = (event: MouseEvent) => {
            mouseX.current = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY.current = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        // Function to handle when window gets resized
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        // Main animation loop that runs every frame
        const animate = () => {
            requestAnimationFrame(animate);

            // Spinning all the cubes slowly
            cubes.forEach((cube) => {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
            });

            // Moving particles in a wave pattern
            particles.forEach((particle, index) => {
                particle.position.x += Math.sin(Date.now() * 0.0003 + index) * 0.01;
                particle.position.y += Math.cos(Date.now() * 0.0003 + index) * 0.01;
            });

            // Making camera follow mouse movement
            camera.position.x += (mouseX.current * 3 - camera.position.x) * 0.02;
            camera.position.y += (mouseY.current * 3 - camera.position.y) * 0.02;
            camera.lookAt(0, 0, 0);

            // Actually drawing everything on screen
            renderer.render(scene, camera);
        };

        // Starting the mouse and resize listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);
        animate();

        // Cleanup when component unmounts
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);

            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }

            // Cleaning up all the 3D objects to prevent memory leaks
            cubes.forEach(cube => {
                cube.geometry.dispose();
                (cube.material as THREE.Material).dispose();
            });

            lines.forEach(line => {
                line.geometry.dispose();
                (line.material as THREE.Material).dispose();
            });

            particles.forEach(particle => {
                particle.geometry.dispose();
                (particle.material as THREE.Material).dispose();
            });

            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="fixed inset-0 -z-10"/>;
}