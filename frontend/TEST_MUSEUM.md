# Museum Test Checklist

## ✅ Fixed Issues

1. **First Person Mode Error** - Fixed the "Cannot assign to read only property 'position'" error by wrapping the Html component in an animated.group
2. **NFT Frames Movement** - Removed the Float wrapper for rare NFTs so all frames remain static on walls

## 🧪 Test Steps

1. **Run the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to a collection**:
   - Go to http://localhost:3000
   - Login if needed
   - Click on any collection
   - Click "View in 3D Museum"

3. **Test First Person Mode**:
   - Press `C` to switch to First Person mode
   - Click anywhere to lock the pointer
   - Use WASD to move around
   - Space to jump
   - Mouse to look around
   - ESC to unlock pointer

4. **Test Settings Panel**:
   - Press `ESC` to open settings
   - Try changing themes (Classic, Modern, Futuristic, Nature)
   - Adjust quality settings
   - Toggle physics on/off

5. **Verify NFT Frames**:
   - All NFT frames should be static on walls
   - No floating or moving frames
   - Only the small interactive indicator should float slightly
   - Hover over frames to see hover effects (slight scale increase)

## 🎯 Expected Behavior

- **First Person Mode**: Should work without errors
- **NFT Frames**: Static on walls, not floating
- **Settings Panel**: Opens/closes with ESC
- **Themes**: Different models/assets load per theme
- **Quality**: Performance adjusts based on setting

## 🐛 If Issues Persist

1. Check browser console for errors
2. Try clearing browser cache (Ctrl+F5)
3. Ensure placeholder-nft.png exists in public/
4. Check that all models are properly loaded in public/models/ 