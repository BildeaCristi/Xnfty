"use client";

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, BallCollider } from '@react-three/rapier';
import { Float, useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { useMuseumStore } from '@/store/museumStore';
import { PhysicsPresets } from '../providers/PhysicsProvider';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useLightingSetup } from '@/hooks/useLightingSetup';

// Component for animated decorative objects in the museum
export default function SceneObjects() {
  const { quality, shadowsEnabled } = useSceneStore();
  const { currentTheme, themeName } = useMuseumStore();

  // Don't render extra objects on low quality
  if (quality === 'low') return null;

  return (
    <group name="scene-objects">
      {/* Center pedestal with rotating sculpture */}
      <CenterPedestal />

      {/* Benches along the walls */}
      {themeName !== 'futuristic' && <Benches />}
      
      {/* Futuristic sofa for futuristic theme */}
      {themeName === 'futuristic' && (quality === 'medium' || quality === 'high' || quality === 'ultra') && <FuturisticSofa />}

      {/* Decorative plants */}
      {(quality === 'high' || quality === 'ultra') && <Plants />}

      {/* Ceiling lamps */}
      <CeilingLamps />

      {/* Interactive spheres */}
      <InteractiveSpheres />
    </group>
  );
}

// Center pedestal with rotating sculpture
function CenterPedestal() {
  const sculptureRef = useRef<THREE.Group>(null);
  const { shadowsEnabled } = useSceneStore();
  const { currentTheme, themeName } = useMuseumStore();
  const [statueModel, setStatueModel] = useState<THREE.Group | null>(null);

  // Load statue model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/models/hebe_goddess_of_youth/scene.gltf',
      (gltf) => {
        const model = gltf.scene.clone();
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = shadowsEnabled;
            child.receiveShadow = shadowsEnabled;
          }
        });
        setStatueModel(model);
      },
      undefined,
      (error) => {
        console.log('Using default sculpture - statue model not found');
      }
    );
  }, [shadowsEnabled]);

  useFrame((state) => {
    if (sculptureRef.current) {
      sculptureRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Pedestal base */}
      <RigidBody {...PhysicsPresets.static()}>
        <mesh position={[0, 0.5, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
          <cylinderGeometry args={[1.5, 2, 1, 32]} />
          <meshStandardMaterial 
            color={themeName === 'classic' ? "#3a3a3a" : "#2a2a2a"}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
        <CuboidCollider args={[1.5, 0.5, 1.5]} />
      </RigidBody>

      {/* Rotating sculpture or statue */}
      <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
        <group 
          ref={sculptureRef}
          position={[0, 2, 0]} 
        >
          {statueModel && themeName === 'classic' ? (
            <primitive 
              object={statueModel} 
              scale={0.01}
              castShadow={shadowsEnabled}
              receiveShadow={shadowsEnabled}
            />
          ) : (
            <mesh castShadow={shadowsEnabled}>
              <torusKnotGeometry args={[0.6, 0.2, 128, 32]} />
              <meshStandardMaterial
                color={currentTheme.lighting.accentColor}
                metalness={0.9}
                roughness={0.1}
                emissive={currentTheme.lighting.accentColor}
                emissiveIntensity={0.2}
              />
            </mesh>
          )}
        </group>
      </Float>

      {/* Remove spotlight on sculpture - only ceiling lights allowed */}
    </group>
  );
}

// Benches along the walls
function Benches() {
  const { shadowsEnabled } = useSceneStore();
  const benchPositions: [number, number, number][] = [
    [-6, 0.4, 0],
    [6, 0.4, 0],
    [0, 0.4, -6],
    [0, 0.4, 6],
  ];

  const benchRotations: [number, number, number][] = [
    [0, Math.PI / 2, 0],
    [0, Math.PI / 2, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  return (
    <>
      {benchPositions.map((position, index) => (
        <RigidBody key={`bench-${index}`} {...PhysicsPresets.static()}>
          <group position={position} rotation={benchRotations[index]}>
            {/* Bench seat */}
            <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
              <boxGeometry args={[3, 0.1, 0.6]} />
              <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </mesh>
            {/* Bench legs */}
            <mesh position={[-1.3, -0.2, 0]} castShadow={shadowsEnabled}>
              <boxGeometry args={[0.1, 0.4, 0.5]} />
              <meshStandardMaterial color="#654321" roughness={0.9} />
            </mesh>
            <mesh position={[1.3, -0.2, 0]} castShadow={shadowsEnabled}>
              <boxGeometry args={[0.1, 0.4, 0.5]} />
              <meshStandardMaterial color="#654321" roughness={0.9} />
            </mesh>
          </group>
          <CuboidCollider args={[1.5, 0.4, 0.3]} />
        </RigidBody>
      ))}
    </>
  );
}

// Decorative plants
function Plants() {
  const { shadowsEnabled } = useSceneStore();
  const { themeName } = useMuseumStore();
  const [plantModel, setPlantModel] = useState<THREE.Group | null>(null);
  
  useEffect(() => {
    const loader = new GLTFLoader();
    const plantPath = themeName === 'nature' 
      ? '/models/ficus_bonsai/scene.gltf'
      : '/models/potted_plant/scene.gltf';
      
    loader.load(
      plantPath,
      (gltf) => {
        const model = gltf.scene.clone();
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = shadowsEnabled;
            child.receiveShadow = shadowsEnabled;
          }
        });
        setPlantModel(model);
      },
      undefined,
      (error) => {
        console.log('Plant model not found, using default');
      }
    );
  }, [themeName, shadowsEnabled]);

  const plantPositions: [number, number, number][] = [
    [-8, 0, -8],
    [8, 0, -8],
    [-8, 0, 8],
    [8, 0, 8],
  ];

  return (
    <>
      {plantPositions.map((position, index) => (
        <RigidBody 
          key={`plant-${index}`} 
          {...PhysicsPresets.static()}
          position={position}
        >
          {plantModel ? (
            <>
              <primitive 
                object={plantModel.clone()} 
                scale={themeName === 'nature' ? 0.02 : 0.5}
              />
              <CuboidCollider args={[0.3, 0.5, 0.3]} position={[0, 0.25, 0]} />
            </>
          ) : (
            <>
              {/* Fallback pot */}
              <mesh position={[0, 0.3, 0]} castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
                <cylinderGeometry args={[0.4, 0.3, 0.6, 16]} />
                <meshStandardMaterial color="#8b4513" roughness={0.9} />
              </mesh>
              {/* Fallback plant */}
              <mesh position={[0, 0.8, 0]} castShadow={shadowsEnabled}>
                <coneGeometry args={[0.5, 1, 8]} />
                <meshStandardMaterial color="#228b22" roughness={0.8} />
              </mesh>
              <CuboidCollider args={[0.3, 0.5, 0.3]} position={[0, 0.25, 0]} />
            </>
          )}
        </RigidBody>
      ))}
    </>
  );
}

// Ceiling lamps based on theme
function CeilingLamps() {
  const { shadowsEnabled } = useSceneStore();
  const { themeName } = useMuseumStore();
  const [lampModel, setLampModel] = useState<THREE.Group | null>(null);
  const [fanModel, setFanModel] = useState<THREE.Group | null>(null);
  const lightConfig = useLightingSetup();
  
  useEffect(() => {
    const loader = new GLTFLoader();
    
    // Load lamp model
    const lampPath = themeName === 'modern' 
      ? '/models/modern_lantern.glb'
      : '/models/luminaria_ceiling_lamp.glb';
      
    loader.load(
      lampPath,
      (gltf) => {
        const model = gltf.scene.clone();
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = shadowsEnabled;
            child.receiveShadow = shadowsEnabled;
          }
        });
        setLampModel(model);
      },
      undefined,
      (error) => {
        console.log('Lamp model not found');
      }
    );
    
    // Load ceiling fan for nature theme
    if (themeName === 'nature') {
      loader.load(
        '/models/ceiling_fan.glb',
        (gltf) => {
          const model = gltf.scene.clone();
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = shadowsEnabled;
              child.receiveShadow = shadowsEnabled;
            }
          });
          setFanModel(model);
        },
        undefined,
        (error) => {
          console.log('Ceiling fan model not found');
        }
      );
    }
  }, [themeName, shadowsEnabled]);

  // Use ceiling fan for nature theme
  if (themeName === 'nature' && fanModel) {
    return (
      <RigidBody {...PhysicsPresets.static()} position={[0, 5.5, 0]}>
        <primitive 
          object={fanModel} 
          scale={0.02}
        />
        <CuboidCollider args={[1, 0.3, 1]} position={[0, 0, 0]} />
        <pointLight
          intensity={lightConfig.ceiling.intensity}
          color={lightConfig.ceiling.color}
          distance={lightConfig.ceiling.distance}
          decay={lightConfig.ceiling.decay}
          castShadow={shadowsEnabled}
        />
      </RigidBody>
    );
  }

  if (!lampModel || themeName === 'nature') return null;

  return (
    <>
      {lightConfig.ceiling.positions.map((position, index) => (
        <RigidBody key={`lamp-${index}`} {...PhysicsPresets.static()} position={position}>
          <primitive 
            object={lampModel.clone()} 
            scale={themeName === 'modern' ? 0.01 : 1}
          />
          <CuboidCollider args={[0.3, 0.3, 0.3]} />
          <pointLight
            intensity={lightConfig.ceiling.intensity}
            color={lightConfig.ceiling.color}
            distance={lightConfig.ceiling.distance}
            decay={lightConfig.ceiling.decay}
            castShadow={shadowsEnabled}
          />
        </RigidBody>
      ))}
    </>
  );
}

// Interactive physics spheres
function InteractiveSpheres() {
  const { shadowsEnabled } = useSceneStore();
  const { quality } = useSceneStore();

  if (quality === 'low' || quality === 'medium') return null;

  const spherePositions: [number, number, number][] = [
    [-3, 5, -3],
    [3, 5, -3],
    [-3, 5, 3],
    [3, 5, 3],
  ];

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];

  return (
    <>
      {spherePositions.map((position, index) => (
        <RigidBody
          key={`sphere-${index}`}
          {...PhysicsPresets.bouncy()}
          position={position}
        >
          <mesh castShadow={shadowsEnabled}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
              color={colors[index]}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
          <BallCollider args={[0.3]} />
        </RigidBody>
      ))}
    </>
  );
}

// Futuristic sofa for futuristic theme
function FuturisticSofa() {
  const { shadowsEnabled } = useSceneStore();
  const [sofaModel, setSofaModel] = useState<THREE.Group | null>(null);
  
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/models/futuristic_reddish_sofa.glb',
      (gltf) => {
        const model = gltf.scene.clone();
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = shadowsEnabled;
            child.receiveShadow = shadowsEnabled;
          }
        });
        setSofaModel(model);
      },
      undefined,
      (error) => {
        console.log('Futuristic sofa model not found');
      }
    );
  }, [shadowsEnabled]);

  if (!sofaModel) return null;

  const sofaPositions: { position: [number, number, number]; rotation: number }[] = [
    { position: [-6, 0, 0], rotation: Math.PI / 2 },
    { position: [6, 0, 0], rotation: -Math.PI / 2 },
    { position: [0, 0, 6], rotation: Math.PI },
    { position: [0, 0, -6], rotation: 0 },
  ];

  return (
    <>
      {sofaPositions.map((config, index) => (
        <RigidBody 
          key={`sofa-${index}`}
          {...PhysicsPresets.static()}
          position={config.position}
          rotation={[0, config.rotation, 0]}
        >
          <primitive 
            object={sofaModel.clone()} 
            scale={0.02}
          />
          {/* Add collider for sofa */}
          <CuboidCollider args={[1.2, 0.4, 0.6]} position={[0, 0.4, 0]} />
        </RigidBody>
      ))}
    </>
  );
} 