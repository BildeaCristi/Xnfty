# Texture Assets for 3D Museum

This directory should contain texture files for the museum environment.

## Required Textures

### Floor Textures
- `marble_floor_2k.jpg` - 2K resolution marble floor texture (for medium/low quality)
- `marble_floor_4k.jpg` - 4K resolution marble floor texture (for high/ultra quality)

### Recommended Texture Sources

1. **Free Texture Sites**:
   - [Polyhaven](https://polyhaven.com/textures) - High quality, free textures
   - [TextureHaven](https://texturehaven.com/) - CC0 licensed textures
   - [Texture.com](https://www.textures.com/) - Free account available
   - [AmbientCG](https://ambientcg.com/) - CC0 PBR materials

2. **Example Downloads**:
   - Marble Floor: https://polyhaven.com/a/marble_01
   - Wood Floor: https://polyhaven.com/a/wood_floor_deck
   - Concrete: https://polyhaven.com/a/concrete_wall_004

## Texture Guidelines

- **Format**: Use JPG for diffuse/color maps, PNG for normal/alpha maps
- **Resolution**: 
  - 2K (2048x2048) for medium quality
  - 4K (4096x4096) for high/ultra quality
- **Optimization**: Compress textures using tools like [Squoosh](https://squoosh.app/)

## Placeholder Generation

If you need placeholder textures for testing:

```javascript
// Generate a simple marble-like texture
const canvas = document.createElement('canvas');
canvas.width = 2048;
canvas.height = 2048;
const ctx = canvas.getContext('2d');

// Create marble pattern
const gradient = ctx.createLinearGradient(0, 0, 2048, 2048);
gradient.addColorStop(0, '#f0f0f0');
gradient.addColorStop(0.5, '#e0e0e0');
gradient.addColorStop(1, '#d0d0d0');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 2048, 2048);

// Add some noise/veins
for (let i = 0; i < 20; i++) {
  ctx.strokeStyle = `rgba(200, 200, 200, ${Math.random() * 0.3})`;
  ctx.lineWidth = Math.random() * 10 + 2;
  ctx.beginPath();
  ctx.moveTo(Math.random() * 2048, 0);
  ctx.quadraticCurveTo(
    Math.random() * 2048, 
    Math.random() * 2048,
    Math.random() * 2048, 
    2048
  );
  ctx.stroke();
}

// Save as marble_floor_2k.jpg
``` 