# IPFS Image Loading & Lighting Fixes

## 🌟 Issues Fixed

### 1. **Lighting Improvements**
- **Removed wall spotlights** - No more distracting wall-mounted lights
- **Enhanced ceiling lights** - Now the primary light source
  - Increased intensity from 0.2 to 0.35
  - Extended range from 6 to 8 units
  - Added 4 more lamp positions for better coverage
- **Reduced ambient light further**
  - Ultra: 0.2x (was 0.3x)
  - High: 0.25x (was 0.4x)
  - Medium/Low: 0.3x (was 0.5x)
- **Reduced directional light**
  - Ultra: 0.1x (was 0.2x)
  - High: 0.15x (was 0.3x)
  - Medium/Low: 0.2x (was 0.4x)

Result: Light now primarily comes from ceiling lamps as requested, creating a more realistic museum atmosphere.

### 2. **IPFS Image Loading Fix**
- **Fixed texture application** - Images now properly display when loaded
- **Added texture reset** - Ensures old textures are cleared before loading new ones
- **CORS handling** - Properly configured cross-origin image loading
- **Pinata gateway fix** - Automatically converts Pinata URLs to public IPFS gateway
- **Force texture updates** - Added multiple `needsUpdate = true` calls to ensure rendering

## 🔧 Technical Details

### IPFS Gateway Conversion
```typescript
// Pinata URLs are converted to public IPFS gateway
if (url.includes('mypinata.cloud')) {
  const match = url.match(/\/ipfs\/(.+)$/);
  if (match && match[1]) {
    url = `https://ipfs.io/ipfs/${match[1]}`;
  }
}
```

### Ceiling Lamp Positions
```typescript
const lampPositions = [
  [0, 5.5, 0],     // Center
  [-5, 5.5, -5],   // Corners
  [5, 5.5, -5],
  [-5, 5.5, 5],
  [5, 5.5, 5],
  [0, 5.5, -7],    // New: Front/Back
  [0, 5.5, 7],
  [-7, 5.5, 0],    // New: Sides
  [7, 5.5, 0],
];
```

## 🎯 Result

1. **Lighting** - Museum now has realistic lighting from ceiling fixtures
2. **IPFS Images** - NFT images from IPFS/Pinata now load and display correctly
3. **Performance** - Better optimized with focused light sources

## 🐛 Troubleshooting

If images still don't load:
1. Check browser console for CORS errors
2. Verify the IPFS hash is valid
3. Try opening the image URL directly in a new tab
4. The gateway might be slow - give it time to load

If lighting seems too dark:
1. Adjust quality settings (higher quality = darker for realism)
2. Try different themes (Modern is brightest, Futuristic is darkest)
3. Check if shadows are enabled (disabling can brighten the scene) 