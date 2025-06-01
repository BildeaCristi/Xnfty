# Lighting Improvements for 3D Museum

## 🌟 Changes Made

### 1. **Reduced Overall Scene Lighting**
- **Ambient Light**: Reduced by 50-70% across all quality levels
  - Ultra: 0.3x base intensity (was 0.8x)
  - High: 0.4x base intensity (was 1.0x)
  - Medium/Low: 0.5x base intensity (was 1.5x)
  
- **Directional Light**: Reduced by 60-70%
  - Ultra: 0.2x base intensity (was 0.6x)
  - High: 0.3x base intensity (was 0.8x)
  - Medium/Low: 0.4x base intensity (was 1.2x)

### 2. **Adjusted Theme Base Values**
- **Modern Theme**: 
  - Ambient: 0.3 (was 0.5)
  - Directional: 0.4 (was 0.7)
  - Accent: 1.2 (was 2.0)

- **Classic Theme**:
  - Ambient: 0.2 (was 0.3)
  - Directional: 0.3 (was 0.5)
  - Accent: 0.8 (was 1.5)

- **Futuristic Theme**:
  - Ambient: 0.15 (was 0.2)
  - Directional: 0.2 (was 0.3)
  - Accent: 1.5 (was 3.0)

- **Nature Theme**:
  - Ambient: 0.35 (was 0.6)
  - Directional: 0.5 (was 0.8)
  - Accent: 0.6 (was 1.0)

### 3. **Local Light Sources**
- **Ceiling Lamps**: 0.2 intensity (was 0.3)
- **Wall Spotlights**: 0.1-0.2x accent intensity (was 0.3-0.7x)
- **Sculpture Spotlight**: 0.8 intensity (was 2.0)
- **Floating Orbs**: 0.15 intensity (was 0.5)
- **Futuristic Sofa Glow**: 0.2 intensity (was 0.3)

## 🎯 Result

The museum now has:
- More realistic, subtle lighting
- Light primarily from ceiling lamps and spotlights
- No overwhelming ambient brightness
- Better contrast between lit and unlit areas
- More atmospheric and museum-like ambiance

## 💡 Lighting Philosophy

The new lighting follows real museum standards:
- **Ambient light** is kept minimal (just enough to see)
- **Accent lighting** highlights specific artworks
- **Local light sources** (lamps, spotlights) provide main illumination
- **Natural shadows** create depth and atmosphere

## 🔧 Fine-tuning

If you need to adjust lighting further:
1. Press **ESC** to open settings
2. Try different quality levels (each has different multipliers)
3. Switch themes to see variations
4. The futuristic theme is intentionally darker
5. The nature theme is brighter for outdoor feel

## 📊 Performance Impact

Lower lighting intensity also improves performance:
- Less GPU stress from lighting calculations
- Better frame rates on lower-end hardware
- Shadows are more subtle and less demanding 