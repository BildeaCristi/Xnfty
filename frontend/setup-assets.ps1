# Create asset directories for 3D Museum
Write-Host "Creating asset directories..." -ForegroundColor Cyan

# Create directories
$directories = @(
    "public/textures",
    "public/models",
    "public/draco",
    "public/basis"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $PSScriptRoot $dir
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "Already exists: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`nAsset directories created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Download marble textures from: https://polyhaven.com/a/marble_01"
Write-Host "   - Save 2K version as: public/textures/marble_floor_2k.jpg"
Write-Host "   - Save 4K version as: public/textures/marble_floor_4k.jpg"
Write-Host "`n2. Create a placeholder NFT image (400x400px)"
Write-Host "   - Save as: public/placeholder-nft.png"
Write-Host "`n3. (Optional) Download 3D models from:"
Write-Host "   - Sketchfab: https://sketchfab.com/search?q=statue+free"
Write-Host "   - Polyhaven: https://polyhaven.com/models"
Write-Host "   - Save as .glb files in: public/models/" 