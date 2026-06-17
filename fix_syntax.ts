import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf-8');

// Fix broken keyframes by completely removing the empty pulse glow
content = content.replace(/@keyframes bgPulseGlow\s*\{\s*0%,\s*\}\s*/g, '');
content = content.replace(/@keyframes delicateGoldPulse\s*\{\s*0%,\s*\}\s*/g, '');
content = content.replace(/0%,\s*/g, '');

fs.writeFileSync('src/index.css', content);
