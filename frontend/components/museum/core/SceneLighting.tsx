"use client";

import { Environment } from '@react-three/drei';
import { LightingService } from '@/services/lightingService';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';

export default function SceneLighting() {
  const { currentTheme } = useMuseumStore();
  const { quality } = useSceneStore();
  const lightingConfig = LightingService.getLightingConfig(quality);

  return (
    <>
      {/* Fog for atmosphere */}
      {currentTheme.atmosphere.fog && (
        <fog
          attach="fog"
          args={[
            currentTheme.atmosphere.fog.color,
            currentTheme.atmosphere.fog.near,
            currentTheme.atmosphere.fog.far
          ]}
        />
      )}

      {/* Lighting setup */}
      <ambientLight
        intensity={lightingConfig.ambient.intensity}
        color={lightingConfig.ambient.color}
      />
      <directionalLight
        position={lightingConfig.directional.position}
        intensity={lightingConfig.directional.intensity}
        color={lightingConfig.directional.color}
        castShadow={lightingConfig.directional.castShadow}
      />

      {lightingConfig.centerLights.map((light, index) => (
        <rectAreaLight
          key={index}
          args={[light.color, light.intensity, 4, 4]}
          position={light.position}
          rotation={light.rotation}
        />
      ))}

      {/* Environment */}
      <Environment
        preset={currentTheme.atmosphere.environment || 'city'}
        background={false}
        blur={0.5}
      />
    </>
  );
}
