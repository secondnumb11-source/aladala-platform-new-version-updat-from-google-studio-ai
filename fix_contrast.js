import fs from 'fs';

let content = fs.readFileSync('src/components/WhatsappTemplates.tsx', 'utf-8');

content = content.replace(/bg-\[\#0b1329\]/g, 'bg-slate-900'); 
content = content.replace(/bg-\[\#111c38\]/g, 'bg-emerald-950'); 
content = content.replace(/bg-\[\#1c2c54\]/g, 'bg-emerald-950'); 
content = content.replace(/bg-\[\#060a17\]/g, 'bg-slate-950'); 
content = content.replace(/bg-black\/60/g, 'bg-slate-950');

content = content.replace(/text-white\/70/g, 'text-yellow-400');
content = content.replace(/text-gray-400/g, 'text-yellow-400');
content = content.replace(/text-\[\#0b1329\]/g, 'text-white');
content = content.replace(/text-\[\#D4AF37\]/g, 'text-yellow-400 font-black');
content = content.replace(/text-yellow-300/g, 'text-yellow-400 font-black');
content = content.replace(/text-yellow-500/g, 'text-yellow-400 font-black');
content = content.replace(/opacity-60/g, 'opacity-100');
content = content.replace(/text-white\/60/g, 'text-white');
content = content.replace(/text-white\/80/g, 'text-white');
content = content.replace(/!bg-transparent/g, 'bg-transparent');

// Buttons and accents
content = content.replace(/bg-\[\#D4AF37\]/g, 'bg-yellow-400');
content = content.replace(/border-\[\#D4AF37\]/g, 'border-yellow-400');

fs.writeFileSync('src/components/WhatsappTemplates.tsx', content);

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

sidebar = sidebar.replace(/group\/nav-item/g, 'nav-item-no-group');
sidebar = sidebar.replace(/text-slate-300/g, 'text-white font-black');
sidebar = sidebar.replace(/text-slate-400/g, 'text-white font-black');

sidebar = sidebar.replace(
  /isActive \n\s*\? 'text-white font-extrabold border-\[\#B3933B\] bg-amber-500\/10' \n\s*: 'text-white font-black border-transparent hover:bg-transparent'/g,
  "isActive ? 'text-white font-black border-amber-500 bg-amber-500/20' : 'text-neutral-50 font-black border-transparent'"
);

sidebar = sidebar.replace(/text-sky-400/g, 'text-white');
sidebar = sidebar.replace(/text-sky-200/g, 'text-white');
sidebar = sidebar.replace(/text-\[\#fcd34d\]/g, 'text-yellow-400');
sidebar = sidebar.replace(/text-slate-600/g, 'text-white font-black');
sidebar = sidebar.replace(/text-\[\#B3933B\]/g, 'text-yellow-400');

fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
