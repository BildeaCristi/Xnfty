# Generate placeholder NFT image
Add-Type -AssemblyName System.Drawing

$width = 512
$height = 512

# Create bitmap
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Fill background with gradient
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($width, $height)),
    [System.Drawing.Color]::FromArgb(42, 42, 42),
    [System.Drawing.Color]::FromArgb(74, 74, 74)
)
$graphics.FillRectangle($brush, 0, 0, $width, $height)

# Draw border
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(102, 102, 102), 8)
$graphics.DrawRectangle($pen, 10, 10, $width - 20, $height - 20)

# Draw center circle
$circleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(85, 85, 85))
$graphics.FillEllipse($circleBrush, 156, 156, 200, 200)

# Draw NFT text
$font = New-Object System.Drawing.Font("Arial", 60, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(153, 153, 153))
$text = "NFT"
$textSize = $graphics.MeasureString($text, $font)
$x = ($width - $textSize.Width) / 2
$y = ($height - $textSize.Height) / 2
$graphics.DrawString($text, $font, $textBrush, $x, $y)

# Draw question mark
$font2 = New-Object System.Drawing.Font("Arial", 30)
$textBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(119, 119, 119))
$graphics.DrawString("?", $font2, $textBrush2, 240, 320)

# Save the image
$graphics.Dispose()
$bitmap.Save("placeholder-nft.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()

Write-Host "Placeholder NFT image generated successfully!" 