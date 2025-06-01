# 3D NFT Museum

A Three.js/React Three Fiber implementation of an interactive 3D museum for displaying NFT collections.

## Features Implemented

### ✅ Core Components

1. **Museum3DView.tsx** - Main 3D scene orchestrator
   - Canvas setup with shadows and camera configuration
   - NFT positioning algorithm for wall placement
   - Integration with existing NFTDetailModal
   - HUD overlay with collection information

2. **MuseumRoom.tsx** - Museum environment
   - 3D room with walls, floor, and ceiling
   - Decorative columns for visual interest
   - Accent lighting strips
   - Configurable dimensions

3. **NFTFrame.tsx** - Interactive NFT displays
   - 3D frames with NFT images as textures
   - Hover animations (scale effect)
   - Click to open NFTDetailModal
   - Title plaques with NFT names
   - Individual spotlight for each NFT

4. **FirstPersonControls.tsx** - FPS navigation (optional)
   - WASD movement
   - Mouse look with pointer lock
   - Jump functionality (Space)
   - Collision detection with ground
   - Boundary enforcement

5. **museumThemes.ts** - Theme configuration
   - Multiple preset themes (Modern, Classic, Futuristic, Nature)
   - Customizable colors, materials, and lighting
   - Environment presets
   - Fog effects for atmosphere

## Usage

### Basic Implementation

In your collection page, the 3D view is toggled with a button:

```tsx
<button onClick={() => setIs3DView(true)}>
  View in 3D Museum
</button>

{is3DView && (
  <Museum3DView 
    collection={collection} 
    nfts={nfts} 
    userAddress={userAddress}
  />
)}
```

### Controls

**OrbitControls (Default)**
- Left click + drag: Rotate view
- Right click + drag: Pan
- Scroll: Zoom in/out

**FirstPersonControls (Optional)**
- Click canvas to lock pointer
- WASD/Arrow keys: Move
- Mouse: Look around
- Space: Jump
- ESC: Exit pointer lock

## Customization

### Changing Room Size

Edit `MuseumRoom.tsx`:
```tsx
const roomWidth = 20;  // Adjust width
const roomHeight = 6;  // Adjust height
const roomDepth = 20;  // Adjust depth
```

### NFT Layout Algorithm

The `calculateNFTPosition` function in `Museum3DView.tsx` distributes NFTs across four walls. Modify the `wallSpacing` variable to adjust distance between frames.

### Applying Themes

To use the theme system:

```tsx
import { museumThemes } from './museumThemes';

// In MuseumRoom component
const theme = museumThemes.modern; // or classic, futuristic, nature

// Apply theme colors to materials
<meshStandardMaterial 
  color={theme.room.wallColor}
  roughness={theme.room.wallRoughness}
  metalness={theme.room.wallMetalness}
/>
```

## Performance Optimization

### Current Optimizations
- Texture loading with proper filtering
- Suspense boundary for lazy loading
- Shadow map size configuration
- Reasonable polygon counts

### Recommended Optimizations
1. **Texture Size Limits** - Resize NFT images to max 1024x1024
2. **Level of Detail (LOD)** - Use lower quality models for distant objects
3. **Instanced Rendering** - For repeated elements like frames
4. **Occlusion Culling** - Don't render NFTs behind walls

## Future Enhancements

### High Priority
1. **Better Navigation** - Implement teleportation or waypoint system
2. **NFT Info Panels** - Floating information displays on hover
3. **Loading States** - Skeleton frames while textures load
4. **Mobile Support** - Touch controls and performance modes

### Nice to Have
1. **Audio System** - Ambient sounds and footsteps
2. **Multiplayer** - See other visitors in real-time
3. **VR Support** - WebXR integration
4. **Dynamic Layouts** - Different room configurations based on NFT count

## Troubleshooting

### Performance Issues
- Reduce shadow map size in Museum3DView
- Lower texture resolutions
- Disable post-processing effects
- Use simpler geometries

### Loading Issues
- Check CORS settings for NFT images
- Ensure proper IPFS gateway configuration
- Verify texture formats (JPG, PNG, WebP)

### Navigation Problems
- Adjust camera bounds in controls
- Modify movement speed parameters
- Check for z-fighting on overlapping geometries

## Dependencies

- `three`: ^0.174.0
- `@react-three/fiber`: ^9.0.4
- `@react-three/drei`: ^10.0.3
- `next`: 15.2.0
- `react`: ^19.0.0 