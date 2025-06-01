"use client";

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { animated, useSpring, SpringValue } from '@react-spring/three';

interface Cursor3DProps {
  enabled?: boolean;
  onHoverObject?: (object: THREE.Object3D | null) => void;
  onClickObject?: (object: THREE.Object3D) => void;
  maxDistance?: number;
  excludeLayers?: number[];
  showTooltip?: boolean;
  color?: string;
  hoverColor?: string;
  clickColor?: string;
}

export default function Cursor3D({
  enabled = true,
  onHoverObject,
  onClickObject,
  maxDistance = 100,
  excludeLayers = [],
  showTooltip = true,
  color = '#ffffff',
  hoverColor = '#00ff88',
  clickColor = '#ff0088',
}: Cursor3DProps) {
  const { camera, scene, gl } = useThree();
  const cursorRef = useRef<THREE.Mesh>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const lastHoveredObject = useRef<THREE.Object3D | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Animation springs for smooth cursor movement and scaling
  const [springs, api] = useSpring(() => ({
    position: [0, 0, 0],
    scale: 0.015,
    color: color,
    opacity: 0.8,
    config: {
      mass: 0.5,
      tension: 300,
      friction: 20,
    },
  }));

  // Click animation spring
  const [clickSpring, clickApi] = useSpring(() => ({
    scale: 1,
    config: {
      mass: 0.2,
      tension: 400,
      friction: 10,
    },
  }));

  // Create excluded layers set for performance
  const excludedLayersSet = useMemo(() => new Set(excludeLayers), [excludeLayers]);

  // Handle clicking
  const handleClick = () => {
    if (!enabled || !lastHoveredObject.current) return;

    // Trigger click animation
    clickApi.start({
      from: { scale: 1 },
      to: [
        { scale: 1.5 },
        { scale: 0.8 },
        { scale: 1 },
      ],
    });

    // Play click sound (optional)
    // playSound('click');

    if (onClickObject) {
      onClickObject(lastHoveredObject.current);
    }
  };

  useFrame((state) => {
    if (!enabled || !cursorRef.current) {
      // Hide cursor when disabled
      api.start({ opacity: 0 });
      return;
    }

    // Set raycaster from camera center (for first-person mode)
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Filter out excluded layers
    const intersectObjects = scene.children.filter(
      (obj) => !excludedLayersSet.has(obj.layers.mask)
    );
    
    // Get intersections
    const intersects = raycaster.current.intersectObjects(intersectObjects, true);
    
    if (intersects.length > 0) {
      // Filter to get the first valid intersection
      const validIntersect = intersects.find((intersect) => {
        // Skip if distance exceeds maximum
        if (intersect.distance > maxDistance) return false;
        
        // Skip if object is marked as non-interactive
        let obj = intersect.object;
        while (obj) {
          if (obj.userData?.nonInteractive) return false;
          obj = obj.parent as THREE.Object3D;
        }
        
        return true;
      });

      if (validIntersect) {
        const { point, object, face } = validIntersect;
        
        // Calculate offset from surface based on face normal
        const offset = face ? face.normal.clone().multiplyScalar(0.05) : new THREE.Vector3(0, 0, 0.05);
        const cursorPosition = point.clone().add(offset);
        
        // Update cursor position with smooth animation
        api.start({
          position: cursorPosition.toArray(),
          opacity: 0.9,
        });

        // Check if we're hovering over an interactive object
        let interactiveObject = object;
        let isInteractive = false;
        let tooltipText = '';
        
        // Traverse up to find interactive parent
        while (interactiveObject) {
          if (interactiveObject.userData?.interactive) {
            isInteractive = true;
            tooltipText = interactiveObject.userData?.tooltip || interactiveObject.userData?.name || 'Interactive Object';
            break;
          }
          interactiveObject = interactiveObject.parent as THREE.Object3D;
        }

        // Update hover state
        if (isInteractive) {
          api.start({
            scale: 0.02,
            color: hoverColor,
          });
          
          // Update tooltip
          if (tooltipRef.current && showTooltip) {
            tooltipRef.current.textContent = tooltipText;
            tooltipRef.current.style.opacity = '1';
          }

          // Set cursor style
          gl.domElement.style.cursor = 'pointer';
        } else {
          api.start({
            scale: 0.015,
            color: color,
          });
          
          // Hide tooltip
          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = '0';
          }

          gl.domElement.style.cursor = 'default';
        }

        // Handle hover callbacks
        if (interactiveObject !== lastHoveredObject.current) {
          if (onHoverObject) {
            onHoverObject(isInteractive ? interactiveObject : null);
          }
          lastHoveredObject.current = isInteractive ? interactiveObject : null;
        }
      } else {
        // No valid intersection, hide cursor
        api.start({ opacity: 0 });
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
        gl.domElement.style.cursor = 'default';
        
        if (lastHoveredObject.current) {
          if (onHoverObject) onHoverObject(null);
          lastHoveredObject.current = null;
        }
      }
    } else {
      // No intersections at all
      api.start({ opacity: 0 });
      if (tooltipRef.current) {
        tooltipRef.current.style.opacity = '0';
      }
      gl.domElement.style.cursor = 'default';
      
      if (lastHoveredObject.current) {
        if (onHoverObject) onHoverObject(null);
        lastHoveredObject.current = null;
      }
    }
  });

  // Add click listener
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl, handleClick]);

  return (
    <group>
      {/* 3D Cursor Sphere */}
      <animated.mesh
        ref={cursorRef}
        position={springs.position as any}
        scale={springs.scale.to((s: number) => {
          const clickScale = clickSpring.scale.get();
          return [s * clickScale, s * clickScale, s * clickScale];
        }) as any}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <animated.meshBasicMaterial
          color={springs.color as SpringValue<string>}
          opacity={springs.opacity as SpringValue<number>}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </animated.mesh>

      {/* Outer ring for better visibility */}
      <animated.mesh
        position={springs.position as any}
        scale={springs.scale.to((s: number) => {
          const scale = s * clickSpring.scale.get() * 1.5;
          return [scale, scale, 0.1];
        })}
      >
        <ringGeometry args={[0.8, 1, 32]} />
        <animated.meshBasicMaterial
          color={springs.color as SpringValue<string>}
          opacity={springs.opacity.to((o: number) => o * 0.5)}
          transparent
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </animated.mesh>

      {/* HTML Tooltip */}
      {showTooltip && (
        <animated.group position={springs.position as any}>
          <Html
            center
            style={{
              transition: 'opacity 0.2s',
              opacity: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div
              ref={tooltipRef}
              className="bg-gray-900/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium 
                         shadow-lg backdrop-blur-sm border border-gray-700/50 whitespace-nowrap
                         transform -translate-y-8"
            >
              {/* Content will be set dynamically */}
            </div>
          </Html>
        </animated.group>
      )}

      {/* Debug ray visualization (optional) */}
      {process.env.NODE_ENV === 'development' && false && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                camera.position.x, camera.position.y, camera.position.z,
                ...(springs.position.get() as number[]),
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="red" opacity={0.5} transparent />
        </line>
      )}
    </group>
  );
} 