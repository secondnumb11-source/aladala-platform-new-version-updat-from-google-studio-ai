import fs from 'fs';

let content = fs.readFileSync('src/components/WhatsappTemplates.tsx', 'utf8');

// Fix invalid tailwind colors from previous bad generation
content = content.replace(/bg-amber-955\/40/g, 'bg-amber-900/40');
content = content.replace(/text-yellow-350/g, 'text-yellow-300');
content = content.replace(/bg-slate-955/g, 'bg-slate-900');

// Fix the Compliance Card under phone to match slate theme
content = content.replace(
  /bg-\[#0b1b36\] border border-slate-800 p-4 rounded-2xl space-y-2/g,
  'bg-blue-950/30 border border-blue-900/50 p-4 rounded-2xl space-y-2'
);

content = content.replace(
  /bg-gradient-to-br from-\[#1E3A8A\]\/90 via-\[#0F172A\] to-\[#9A7D2C\]\/85 border-2 border-\[#9A7D2C\]/g,
  'bg-slate-900 border border-slate-800'
);

content = content.replace(
  /bg-gradient-to-br from-\[#9A7D2C\]\/90 via-\[#0F172A\] to-\[#0284C7\]\/85 border-2 border-\[#9A7D2C\]/g,
  'bg-slate-900 border border-slate-800'
);

fs.writeFileSync('src/components/WhatsappTemplates.tsx', content);
