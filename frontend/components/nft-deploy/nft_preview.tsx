import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface NFTPreview3DProps {
    imageUrl: string;
}

function NFTPreview3D({ imageUrl }: NFTPreview3DProps) {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Setup scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 2;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(300, 300);

        // Append the renderer's DOM element to the mount element
        mountRef.current.appendChild(renderer.domElement);

        // Create a cube with the NFT image as texture
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const texture = new THREE.TextureLoader().load(imageUrl);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup on unmount
        return () => {
            if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [imageUrl]);

    return <div ref={mountRef}></div>;
}

export default NFTPreview3D;
