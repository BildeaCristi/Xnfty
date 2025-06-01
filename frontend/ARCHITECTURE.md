# Next.js 3D NFT Museum - Professional Architecture

## Overview

This is a professional-grade, modular Next.js application featuring an immersive 3D NFT museum gallery built with React Three Fiber, Drei, and Rapier physics. The architecture emphasizes performance, scalability, and maintainability.

## Directory Structure

```
frontend/
├── app/                      # Next.js app router pages
│   ├── museum/              # Museum page
│   └── ...
├── components/
│   ├── museum/              # Museum-specific components
│   │   ├── Museum3DScene.tsx        # Main scene orchestrator
│   │   ├── EnhancedMuseumRoom.tsx   # Physics-enabled room
│   │   ├── EnhancedNFTFrame.tsx     # Advanced NFT displays
│   │   ├── Cursor3D.tsx             # 3D raycast cursor
│   │   ├── SceneObjects.tsx         # Decorative objects
│   │   ├── SettingsPanel.tsx        # Advanced settings UI
│   │   └── ...
│   └── providers/           # Context providers
│       └── PhysicsProvider.tsx      # Rapier physics wrapper
├── hooks/
│   ├── useAssetLoader.ts    # Advanced asset loading
│   └── ...
├── store/
│   ├── museumStore.ts       # Museum-specific state
│   ├── sceneStore.ts        # 3D scene state & settings
│   └── ...
├── types/
│   └── blockchain.ts        # TypeScript interfaces
└── utils/
    └── textureManager.ts    # Texture caching
```

## Key Features

### 1. **Modular Component Architecture**

- **Separation of Concerns**: Each component has a single responsibility
- **Lazy Loading**: Heavy 3D components are dynamically imported
- **Reusable Hooks**: Logic extraction for asset loading, physics, etc.

### 2. **Advanced State Management**

```typescript
// Scene Store (Zustand)
- Quality settings (low/medium/high/ultra)
- Performance metrics tracking
- Physics configuration
- Asset loading states
- Scene object registry

// Museum Store
- Theme management
- Control modes
- UI states
```

### 3. **Performance Optimizations**

- **Adaptive Quality**: Automatic quality adjustment based on FPS
- **LOD System**: Level of detail for complex geometries
- **Texture Optimization**: Mipmapping and compression
- **Asset Caching**: LRU cache for loaded assets
- **Instancing**: For repeated objects

### 4. **3D Cursor System**

The advanced 3D cursor replaces the static crosshair:
- Raycast intersection detection
- Smooth spring animations
- Interactive tooltips
- Visual hover states
- Depth-aware positioning

### 5. **Physics Integration**

Using Rapier physics engine:
- Static colliders for walls/floor
- Dynamic bodies for interactive objects
- Configurable gravity
- Physics presets for different object types

### 6. **Scene Enhancement**

Additional objects include:
- Rotating center sculpture
- Interactive benches
- Decorative plants
- Floating light orbs
- Physics-enabled spheres

## Component Details

### Museum3DScene

The main orchestrator that:
- Sets up the Three.js canvas with optimal settings
- Manages camera controls (orbit/first-person)
- Handles NFT positioning and interactions
- Integrates post-processing effects
- Monitors performance

### EnhancedMuseumRoom

Physics-enabled room with:
- Reflective floors (high quality)
- Architectural details (baseboards, crown molding)
- Dynamic lighting fixtures
- Optimized materials based on quality

### EnhancedNFTFrame

Advanced NFT display with:
- Aspect ratio preservation
- Glass cover effect (high quality)
- Glow effects for rare NFTs
- Physics support (optional)
- Interactive indicators

### Cursor3D

3D pointer system featuring:
- Surface normal offset calculation
- Interactive object detection
- Smooth spring animations
- Click handling
- Tooltip integration

## Performance Guidelines

### Quality Presets

```typescript
low: {
  shadows: false,
  antialias: false,
  postProcessing: false,
  pixelRatio: 1
}

medium: {
  shadows: true,
  antialias: true,
  postProcessing: false,
  pixelRatio: 1
}

high: {
  shadows: true,
  antialias: true,
  postProcessing: true,
  pixelRatio: min(devicePixelRatio, 2)
}

ultra: {
  shadows: true,
  antialias: true,
  postProcessing: true,
  pixelRatio: devicePixelRatio,
  additionalEffects: ['SSAO', 'DOF']
}
```

### Asset Loading Strategy

1. **Preload Critical Assets**: Museum room, UI elements
2. **Lazy Load NFTs**: Load as needed with progress tracking
3. **Background Loading**: Non-critical decorative objects
4. **Fallback URLs**: For failed asset loads

## Usage Examples

### Adding New 3D Objects

```typescript
// In SceneObjects.tsx
function CustomObject() {
  const { shadowsEnabled } = useSceneStore();
  
  return (
    <RigidBody {...PhysicsPresets.interactive()}>
      <mesh castShadow={shadowsEnabled}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
    </RigidBody>
  );
}
```

### Custom Physics Preset

```typescript
export const CustomPreset = (): PhysicsObjectConfig => ({
  type: 'dynamic',
  mass: 2,
  friction: 0.6,
  restitution: 0.4,
  linearDamping: 0.3,
  angularDamping: 0.3,
  ccd: true
});
```

### Asset Manifest

```typescript
const assetManifest: AssetManifest[] = [
  {
    id: 'statue-1',
    url: '/models/statue.glb',
    type: 'model',
    format: 'glb',
    preload: true,
    optimize: true,
    fallbackUrl: '/models/statue-low.glb'
  }
];
```

## Best Practices

1. **Component Naming**: Use descriptive prefixes (Enhanced*, Use*, etc.)
2. **Performance First**: Always check quality settings before expensive operations
3. **Error Boundaries**: Wrap 3D components in error boundaries
4. **Memory Management**: Clean up textures and geometries on unmount
5. **Accessibility**: Provide keyboard navigation and screen reader support

## Future Enhancements

- **Multiplayer Support**: Share museum experiences
- **VR/AR Integration**: WebXR support
- **Advanced Audio**: Spatial audio system
- **Procedural Generation**: Dynamic museum layouts
- **NFT Animations**: Support for animated NFTs
- **Social Features**: Comments, likes, sharing

## Performance Monitoring

```typescript
// In Museum3DScene
<PerformanceMonitor
  onIncline={() => increaseQuality()}
  onDecline={() => decreaseQuality()}
  onChange={({ fps }) => updateMetrics({ fps })}
/>
```

## Deployment Considerations

1. **CDN Setup**: Host 3D assets on CDN
2. **Compression**: Enable gzip/brotli for models
3. **Caching**: Implement service worker caching
4. **Progressive Enhancement**: 2D fallback for unsupported browsers

## Dependencies

- `@react-three/fiber`: Three.js React renderer
- `@react-three/drei`: Three.js helpers
- `@react-three/rapier`: Physics engine
- `@react-three/postprocessing`: Visual effects
- `zustand`: State management
- `@react-spring/three`: 3D animations 