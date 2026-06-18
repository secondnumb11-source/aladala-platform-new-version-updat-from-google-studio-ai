const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

[16, 48, 128].forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // خلفية ذهبية
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // رمز الميزان
  ctx.fillStyle = '#0b1329';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚖', size/2, size/2);
  
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), canvas.toBuffer('image/png'));
  console.log(`Created icon${size}.png`);
});
