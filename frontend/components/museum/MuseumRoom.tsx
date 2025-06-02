"use client";

import { useTexture } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useMuseumStore } from '@/store/museumStore';
import { useSceneStore } from '@/store/sceneStore';
import { useEffect, useState } from 'react';

// PBR Material interface
interface PBRTextures {
  diffuse: THREE.Texture | null;
  normal: THREE.Texture | null;
  roughness: THREE.Texture | null;
  displacement: THREE.Texture | null;
}

// Enhanced MuseumRoom with comprehensive PBR texture system
export default function MuseumRoom() {
  const { currentTheme, themeName } = useMuseumStore();
  const { quality } = useSceneStore();
  
  // PBR texture states for different surfaces
  const [floorTextures, setFloorTextures] = useState<PBRTextures>({
    diffuse: null, normal: null, roughness: null, displacement: null
  });
  const [wallTextures, setWallTextures] = useState<PBRTextures>({
    diffuse: null, normal: null, roughness: null, displacement: null
  });
  const [ceilingTextures, setCeilingTextures] = useState<PBRTextures>({
    diffuse: null, normal: null, roughness: null, displacement: null
  });
  const [loading, setLoading] = useState(true);
  
  // Room dimensions
  const roomWidth = 20;
  const roomHeight = 6;
  const roomDepth = 20;

  // Comprehensive texture loading system
  useEffect(() => {
    const loadPBRTextures = async () => {
      setLoading(true);
      const textureLoader = new THREE.TextureLoader();
      
      // Helper function to load a single texture with error handling
      const loadTexture = async (path: string): Promise<THREE.Texture | null> => {
        try {
          const texture = await new Promise<THREE.Texture>((resolve, reject) => {
            textureLoader.load(path, resolve, undefined, reject);
          });
          
          // Configure texture
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          return texture;
        } catch (error) {
          console.log(`Texture not found: ${path}`);
          return null;
        }
      };

      // Helper function to load complete PBR material
      const loadPBRMaterial = async (basePath: string, textureName: string): Promise<PBRTextures> => {
        const [diffuse, normal, roughness, displacement] = await Promise.all([
          loadTexture(`${basePath}/${textureName}_diff_2k.jpg`),
          loadTexture(`${basePath}/${textureName}_nor_gl_2k.exr`),
          loadTexture(`${basePath}/${textureName}_rough_2k.exr`),
          loadTexture(`${basePath}/${textureName}_disp_2k.png`)
        ]);

        // Set appropriate repeat for different surfaces
        [diffuse, normal, roughness, displacement].forEach(texture => {
          if (texture) {
            texture.repeat.set(4, 4); // Default tiling
          }
        });

        return { diffuse, normal, roughness, displacement };
      };

      try {
        // Load theme-specific textures
        switch (themeName) {
          case 'classic':
            // Classical theme: marble floor, plaster walls
            const classicalFloor = await loadTexture(
              quality === 'high' 
                ? '/textures/classical-theme/marble_floor_4k.jpg'
                : '/textures/classical-theme/marble_floor_2k.jpg'
            );
            if (classicalFloor) {
              classicalFloor.repeat.set(4, 4);
              setFloorTextures({ diffuse: classicalFloor, normal: null, roughness: null, displacement: null });
            }

            // Try to load plaster wall texture
            const plasterWall = await loadTexture('/textures/classical-theme/white_plaster_02_2k.blend/textures/white_plaster_02_diff_2k.jpg');
            if (plasterWall) {
              plasterWall.repeat.set(2, 1);
              setWallTextures({ diffuse: plasterWall, normal: null, roughness: null, displacement: null });
            }
            break;

          case 'modern':
            // Modern theme: concrete floor, wood walls
            const concreteTextures = await loadPBRMaterial(
              '/textures/modern-theme/concrete_floor_painted_2k.blend/textures',
              'concrete_floor_painted'
            );
            setFloorTextures(concreteTextures);

            const woodTextures = await loadPBRMaterial(
              '/textures/modern-theme/wood_floor_2k.blend/textures',
              'wood_floor'
            );
            // Use wood for walls in modern theme
            if (woodTextures.diffuse) {
              woodTextures.diffuse.repeat.set(2, 1);
              woodTextures.normal?.repeat.set(2, 1);
              woodTextures.roughness?.repeat.set(2, 1);
            }
            setWallTextures(woodTextures);
            break;

          case 'futuristic':
            // Futuristic theme: metallic surfaces (create programmatically if no textures)
            console.log('Futuristic theme: Using procedural materials');
            break;

          case 'nature':
            // Nature theme: wood surfaces (create programmatically if no textures)
            console.log('Nature theme: Using procedural materials');
            break;

          default:
            console.log('Using default theme materials');
        }

      } catch (error) {
        console.error('Error loading theme textures:', error);
      }
      
      setLoading(false);
    };
    
    loadPBRTextures();
  }, [themeName, quality]);

  // Create material with PBR textures
  const createPBRMaterial = (textures: PBRTextures, baseColor: string, baseRoughness: number, baseMetalness: number) => {
    const materialProps: any = {
      color: textures.diffuse ? '#ffffff' : baseColor,
      map: textures.diffuse,
      normalMap: textures.normal,
      roughnessMap: textures.roughness,
      displacementMap: textures.displacement,
      roughness: baseRoughness,
      metalness: baseMetalness,
    };

    // Adjust displacement scale if displacement map exists
    if (textures.displacement) {
      materialProps.displacementScale = 0.1;
    }

    return materialProps;
  };

  // Theme-specific material properties for floors
  const getFloorMaterial = () => {
    const baseProps = createPBRMaterial(
      floorTextures, 
      currentTheme.room.floorColor, 
      currentTheme.room.floorRoughness, 
      currentTheme.room.floorMetalness
    );
    
    // Theme-specific enhancements
    switch (themeName) {
      case 'classic':
        return {
          ...baseProps,
          roughness: floorTextures.roughness ? 0.2 : 0.1,
          metalness: 0.0,
        };
      case 'modern':
        return {
          ...baseProps,
          roughness: floorTextures.roughness ? 0.4 : 0.3,
          metalness: 0.1,
        };
      case 'futuristic':
        return {
          ...baseProps,
          roughness: 0.1,
          metalness: 0.8,
          emissive: '#001122',
          emissiveIntensity: 0.1,
        };
      case 'nature':
        return {
          ...baseProps,
          roughness: 0.8,
          metalness: 0.0,
        };
      default:
        return baseProps;
    }
  };

  // Theme-specific material properties for walls
  const getWallMaterial = () => {
    const baseProps = createPBRMaterial(
      wallTextures,
      currentTheme.room.wallColor,
      currentTheme.room.wallRoughness,
      currentTheme.room.wallMetalness
    );
    
    // Theme-specific wall enhancements
    switch (themeName) {
      case 'classic':
        return {
          ...baseProps,
          roughness: wallTextures.roughness ? 0.8 : 0.7,
          metalness: 0.0,
        };
      case 'modern':
        return {
          ...baseProps,
          roughness: wallTextures.roughness ? 0.3 : 0.2,
          metalness: 0.1,
        };
      case 'futuristic':
        return {
          ...baseProps,
          roughness: 0.1,
          metalness: 0.6,
          emissive: '#000011',
          emissiveIntensity: 0.05,
        };
      case 'nature':
        return {
          ...baseProps,
          roughness: 0.9,
          metalness: 0.0,
        };
      default:
        return baseProps;
    }
  };

  // Theme-specific material properties for ceiling
  const getCeilingMaterial = () => {
    const baseProps = createPBRMaterial(
      ceilingTextures,
      currentTheme.room.ceilingColor,
      1.0,
      0.0
    );

    switch (themeName) {
      case 'futuristic':
        return {
          ...baseProps,
          roughness: 0.2,
          metalness: 0.3,
          emissive: '#000022',
          emissiveIntensity: 0.05,
        };
      case 'modern':
        return {
          ...baseProps,
          roughness: 0.3,
          metalness: 0.1,
        };
      default:
        return baseProps;
    }
  };

  return (
    <group>
      {/* Enhanced Floor with comprehensive PBR textures */}
      <mesh 
        receiveShadow 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[roomWidth, roomDepth, 32, 32]} />
        <meshStandardMaterial {...getFloorMaterial()} />
      </mesh>

      {/* Enhanced Ceiling with theme-appropriate materials */}
      <mesh 
        receiveShadow 
        position={[0, roomHeight, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshStandardMaterial {...getCeilingMaterial()} />
      </mesh>

      {/* Enhanced ceiling frame details with theme materials */}
      {[
        [roomWidth / 2, roomHeight - 0.05, 0, roomDepth, 0.1],
        [-roomWidth / 2, roomHeight - 0.05, 0, roomDepth, 0.1],
        [0, roomHeight - 0.05, roomDepth / 2, roomWidth, 0.1],
        [0, roomHeight - 0.05, -roomDepth / 2, roomWidth, 0.1]
      ].map(([x, y, z, length, width], i) => (
        <mesh key={`ceiling-frame-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[
            i < 2 ? 0.2 : length,
            0.1,
            i < 2 ? length : 0.2
          ]} />
          <meshStandardMaterial 
            color={currentTheme.room.wallColor}
            roughness={themeName === 'modern' ? 0.2 : 0.5}
            metalness={themeName === 'modern' || themeName === 'futuristic' ? 0.8 : 0.3}
          />
        </mesh>
      ))}

      {/* Back Wall with PBR textures */}
      <mesh 
        receiveShadow 
        castShadow
        position={[0, roomHeight / 2, -roomDepth / 2]}
      >
        <planeGeometry args={[roomWidth, roomHeight]} />
        <meshStandardMaterial {...getWallMaterial()} />
      </mesh>

      {/* Front Wall with PBR textures */}
      <mesh 
        receiveShadow 
        castShadow
        position={[0, roomHeight / 2, roomDepth / 2]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[roomWidth, roomHeight]} />
        <meshStandardMaterial {...getWallMaterial()} />
      </mesh>

      {/* Left Wall with PBR textures */}
      <mesh 
        receiveShadow 
        castShadow
        position={[-roomWidth / 2, roomHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomDepth, roomHeight]} />
        <meshStandardMaterial {...getWallMaterial()} />
      </mesh>

      {/* Right Wall with PBR textures */}
      <mesh 
        receiveShadow 
        castShadow
        position={[roomWidth / 2, roomHeight / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomDepth, roomHeight]} />
        <meshStandardMaterial {...getWallMaterial()} />
      </mesh>

      {/* Enhanced accent lighting strips with theme-specific intensity */}
      <mesh position={[0, roomHeight - 0.1, -roomDepth / 2 + 0.1]}>
        <boxGeometry args={[roomWidth - 2, 0.2, 0.2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={themeName === 'futuristic' ? 0.3 : currentTheme.lighting.accentIntensity}
          metalness={themeName === 'futuristic' ? 0.9 : 0}
          roughness={themeName === 'futuristic' ? 0.1 : 0.5}
        />
      </mesh>

      <mesh position={[0, roomHeight - 0.1, roomDepth / 2 - 0.1]}>
        <boxGeometry args={[roomWidth - 2, 0.2, 0.2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={themeName === 'futuristic' ? 0.3 : currentTheme.lighting.accentIntensity}
          metalness={themeName === 'futuristic' ? 0.9 : 0}
          roughness={themeName === 'futuristic' ? 0.1 : 0.5}
        />
      </mesh>

      {/* Side accent lights */}
      <mesh position={[-roomWidth / 2 + 0.1, roomHeight - 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, roomDepth - 2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={themeName === 'futuristic' ? 0.3 : currentTheme.lighting.accentIntensity}
          metalness={themeName === 'futuristic' ? 0.9 : 0}
          roughness={themeName === 'futuristic' ? 0.1 : 0.5}
        />
      </mesh>

      <mesh position={[roomWidth / 2 - 0.1, roomHeight - 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, roomDepth - 2]} />
        <meshStandardMaterial 
          color={currentTheme.lighting.accentColor}
          emissive={currentTheme.lighting.accentColor}
          emissiveIntensity={themeName === 'futuristic' ? 0.3 : currentTheme.lighting.accentIntensity}
          metalness={themeName === 'futuristic' ? 0.9 : 0}
          roughness={themeName === 'futuristic' ? 0.1 : 0.5}
        />
      </mesh>

      {/* Theme-specific floor patterns */}
      {themeName === 'modern' && <ModernFloorGrid />}
      {themeName === 'futuristic' && <FuturisticFloorElements />}
      {themeName === 'nature' && <NatureFloorElements />}

      {/* Enhanced baseboards with theme materials */}
      {[
        [0, 0.1, -roomDepth / 2 + 0.05, roomWidth, 0.2, 0.1],
        [0, 0.1, roomDepth / 2 - 0.05, roomWidth, 0.2, 0.1],
        [-roomWidth / 2 + 0.05, 0.1, 0, 0.1, 0.2, roomDepth],
        [roomWidth / 2 - 0.05, 0.1, 0, 0.1, 0.2, roomDepth]
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`baseboard-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial 
            color={currentTheme.room.wallColor}
            roughness={themeName === 'modern' ? 0.3 : 0.8}
            metalness={themeName === 'modern' || themeName === 'futuristic' ? 0.4 : 0.1}
          />
        </mesh>
      ))}

      {/* Loading indicator */}
      {loading && (
        <mesh position={[0, 0.1, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// Modern theme floor grid with enhanced materials
function ModernFloorGrid() {
  return (
    <>
      {/* Grid lines with metallic finish */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh 
          key={`grid-x-${i}`}
          position={[-8 + i * 2, 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.02, 20]} />
          <meshStandardMaterial 
            color="#666666"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh 
          key={`grid-z-${i}`}
          position={[0, 0.001, -8 + i * 2]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        >
          <planeGeometry args={[0.02, 20]} />
          <meshStandardMaterial 
            color="#666666"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </>
  );
}

// Futuristic theme floor elements with enhanced effects
function FuturisticFloorElements() {
  return (
    <>
      {/* Glowing circuit-like lines */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh 
          key={`circuit-${i}`}
          position={[-6 + i * 3, 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.05, 16]} />
          <meshStandardMaterial 
            color="#00ffff"
            emissive="#003366"
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
      {/* Central power line */}
      <mesh 
        position={[0, 0.003, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
        <planeGeometry args={[0.1, 18]} />
        <meshStandardMaterial 
          color="#ff0088"
          emissive="#440022"
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </>
  );
}

// Nature theme floor elements
function NatureFloorElements() {
  return (
    <>
      {/* Natural stone path */}
      {Array.from({ length: 3 }, (_, i) => (
        <mesh 
          key={`stone-path-${i}`}
          position={[-2 + i * 2, 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.8, 16]} />
          <meshStandardMaterial 
            color="#8b7355"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      ))}
      {/* Scattered natural elements */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh 
          key={`nature-accent-${i}`}
          position={[
            -7 + (i % 3) * 7, 
            0.001, 
            -6 + Math.floor(i / 3) * 12
          ]}
          rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
        >
          <circleGeometry args={[0.3, 8]} />
          <meshStandardMaterial 
            color="#654321"
            roughness={1.0}
            metalness={0.0}
          />
        </mesh>
      ))}
    </>
  );
} 