const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create a 400x400 placeholder NFT image
const width = 400;
const height = 400;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create gradient background
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add grid pattern
ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
ctx.lineWidth = 2;
for (let i = 0; i < 8; i++) {
  ctx.beginPath();
  ctx.moveTo(i * 50, 0);
  ctx.lineTo(i * 50, height);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0, i * 50);
  ctx.lineTo(width, i * 50);
  ctx.stroke();
}

// Add center design
ctx.save();
ctx.translate(width / 2, height / 2);
ctx.rotate(Math.PI / 4);

ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
ctx.fillRect(-100, -100, 200, 200);

ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
ctx.fillRect(-60, -60, 120, 120);

ctx.restore();

// Add text
ctx.fillStyle = 'white';
ctx.font = 'bold 48px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('NFT', width / 2, height / 2);

ctx.font = '24px Arial';
ctx.fillText('PLACEHOLDER', width / 2, height / 2 + 40);

// Save the image
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '..', 'public', 'placeholder-nft.png');
fs.writeFileSync(outputPath, buffer);

console.log('Placeholder NFT image created at:', outputPath); 