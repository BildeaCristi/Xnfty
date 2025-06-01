# Create placeholder NFT image using base64
Write-Host "Creating placeholder NFT image..." -ForegroundColor Cyan

# Base64 encoded 1x1 purple pixel PNG
$base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkuPz/PwAFOALN8KlEaQAAAABJRU5ErkJggg=="

# Decode and save
$imageBytes = [Convert]::FromBase64String($base64Image)
$imagePath = Join-Path $PSScriptRoot "public\placeholder-nft.png"

[System.IO.File]::WriteAllBytes($imagePath, $imageBytes)

Write-Host "Placeholder image created at: $imagePath" -ForegroundColor Green
Write-Host "Note: This is a temporary 1x1 pixel image." -ForegroundColor Yellow
Write-Host "For a proper placeholder, open public/generate-placeholder.html in your browser" -ForegroundColor Yellow 