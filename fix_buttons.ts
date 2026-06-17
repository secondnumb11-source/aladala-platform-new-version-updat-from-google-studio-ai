import fs from 'fs';
let content = fs.readFileSync('src/components/UnifiedAuthLanding.tsx', 'utf-8');

// Fix buttons that still have heavy dark shadow
content = content.replace(/shadow-\[0_0_20px_rgba\(212,175,55,0\.4\)\]/g, 'shadow-md shadow-amber-900/10');

fs.writeFileSync('src/components/UnifiedAuthLanding.tsx', content);
