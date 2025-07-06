"use client";

import {LightingService} from '@/services/LightingService';

export default function SceneLighting() {
    const lightingConfig = LightingService.getLightingConfig();

    return (
        <>
            {/* Ambient lighting for overall scene illumination */}
            <ambientLight
                intensity={lightingConfig.ambient.intensity}
                color={lightingConfig.ambient.color}
            />

            {/* Main directional light */}
            <directionalLight
                position={lightingConfig.directional.position}
                intensity={lightingConfig.directional.intensity}
                color={lightingConfig.directional.color}
                castShadow={lightingConfig.directional.castShadow}
            />

            {/* Ceiling area lights for museum-style lighting */}
            {lightingConfig.centerLights.map((light, index) => (
                <rectAreaLight
                    key={index}
                    args={[light.color, light.intensity, 4, 4]}
                    position={light.position}
                    rotation={light.rotation}
                />
            ))}

            {/* Additional point lights for better visibility */}
            {/* Center floor light to illuminate the ground */}
            <pointLight
                position={[0, 1, 0]}
                intensity={0.5}
                color="#ffffff"
                distance={12}
                decay={2}
            />

            {/* Corner point lights for balanced illumination */}
            <pointLight
                position={[-5, 3, -5]}
                intensity={0.4}
                color="#f8f8ff"
                distance={10}
                decay={2}
            />

            <pointLight
                position={[5, 3, 5]}
                intensity={0.4}
                color="#f8f8ff"
                distance={10}
                decay={2}
            />

            <pointLight
                position={[-5, 3, 5]}
                intensity={0.4}
                color="#f8f8ff"
                distance={10}
                decay={2}
            />

            <pointLight
                position={[5, 3, -5]}
                intensity={0.4}
                color="#f8f8ff"
                distance={10}
                decay={2}
            />

            {/* Wall-mounted accent lights for NFT illumination */}
            <spotLight
                position={[0, 4, 7]}
                target-position={[0, 2, 0]}
                angle={Math.PI / 6}
                penumbra={0.5}
                intensity={0.6}
                color="#ffffff"
                distance={15}
            />

            <spotLight
                position={[0, 4, -7]}
                target-position={[0, 2, 0]}
                angle={Math.PI / 6}
                penumbra={0.5}
                intensity={0.6}
                color="#ffffff"
                distance={15}
            />

            <spotLight
                position={[7, 4, 0]}
                target-position={[0, 2, 0]}
                angle={Math.PI / 6}
                penumbra={0.5}
                intensity={0.6}
                color="#ffffff"
                distance={15}
            />

            <spotLight
                position={[-7, 4, 0]}
                target-position={[0, 2, 0]}
                angle={Math.PI / 6}
                penumbra={0.5}
                intensity={0.6}
                color="#ffffff"
                distance={15}
            />
        </>
    );
}
