import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf-8');

// remove empty keyframes entirely
content = content.replace(/@keyframes [a-zA-Z0-9_-]+\s*\{\s*\}/g, '');
// check if there are floating } from previous replacements
content = content.replace(/@keyframes bgPulseGlow \{\s*\n*\s*\}/g, '');
content = content.replace(/@keyframes delicateGoldPulse \{\s*\n*\s*\}/g, '');

fs.writeFileSync('src/index.css', content);
