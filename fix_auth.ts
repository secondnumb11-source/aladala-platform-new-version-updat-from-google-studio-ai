import fs from 'fs';

let content = fs.readFileSync('src/components/UnifiedAuthLanding.tsx', 'utf-8');

// Replace placeholder contrast
content = content.replace(/placeholder:text-gray-600/g, 'placeholder:text-gray-400 text-white font-extrabold text-base');
content = content.replace(/placeholder:text-gray-700/g, 'placeholder:text-gray-400 text-white font-extrabold text-base');

// Fix input padding
content = content.replace(/px-4 py-3\.5/g, 'px-5 py-4');

// Border Gold #D4AF37 instead of /50
content = content.replace(/border-\[#D4AF37\]\/50/g, 'border-[#D4AF37]');

// Ensure redirectTo uses window.location.origin explicitly
content = content.replace(/redirectTo: redirectUrl,/g, "redirectTo: window.location.origin,");

fs.writeFileSync('src/components/UnifiedAuthLanding.tsx', content);
