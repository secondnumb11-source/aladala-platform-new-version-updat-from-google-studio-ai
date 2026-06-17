import fs from 'fs';

let content = fs.readFileSync('src/components/UnifiedAuthLanding.tsx', 'utf-8');

// Increase text contrast
content = content.replace(/text-slate-900/g, 'text-slate-950 font-black');
content = content.replace(/text-slate-700/g, 'text-slate-900 font-bold');
content = content.replace(/text-slate-600/g, 'text-slate-800 font-bold');
content = content.replace(/text-slate-500/g, 'text-slate-700 font-bold');
content = content.replace(/text-slate-400/g, 'text-slate-600 font-bold');
content = content.replace(/text-amber-700/g, 'text-[#B8860B]'); 
content = content.replace(/text-amber-500/g, 'text-[#D4AF37]'); 
content = content.replace(/bg-amber-50/g, 'bg-[#D4AF37]/10');
content = content.replace(/text-amber-800/g, 'text-[#8B6508]'); 

// Luxury typography adjustments
content = content.replace(/font-black/g, 'font-black tracking-tight');
content = content.replace(/font-black tracking-tight tracking-tight/g, 'font-black tracking-tight'); // cleanup
content = content.replace(/placeholder:text-slate-600 font-bold font-bold/g, 'placeholder:text-slate-500 font-bold');

// Tweak borders for a more luxury elegant feel
content = content.replace(/border-slate-300/g, 'border-[#D4AF37]/50');
content = content.replace(/border-slate-200/g, 'border-[#D4AF37]/30');
content = content.replace(/focus:border-amber-400/g, 'focus:border-[#D4AF37]');
content = content.replace(/focus:border-amber-500/g, 'focus:border-[#D4AF37]');
content = content.replace(/hover:border-amber-400/g, 'hover:border-[#D4AF37]');
content = content.replace(/hover:border-amber-500/g, 'hover:border-[#D4AF37]');
content = content.replace(/focus:ring-amber-500\/20/g, 'focus:ring-[#D4AF37]/30');
content = content.replace(/focus:ring-amber-500\/30/g, 'focus:ring-[#D4AF37]/40');
content = content.replace(/active:scale-95/g, 'active:scale-95 transition-transform duration-300');

// Golden gradients for "luxury touch"
content = content.replace(/from-white via-slate-50 to-slate-100/g, 'from-[#FAFAFA] via-white to-[#F0EDDF]');
content = content.replace(/from-slate-100 to-slate-200/g, 'from-white to-[#F5F2E6]');
content = content.replace(/from-slate-100 via-white to-slate-50/g, 'from-[#F5F2E6] via-white to-white');
content = content.replace(/bg-slate-50/g, 'bg-[#FAFAFA]'); 
content = content.replace(/bg-slate-100/g, 'bg-[#F0EDDF]'); 

content = content.replace(/shadow-lg shadow-amber-900\/10/g, 'shadow-2xl shadow-[#D4AF37]/20');
content = content.replace(/shadow-md shadow-slate-200/g, 'shadow-xl shadow-[#D4AF37]/15');
content = content.replace(/shadow-sm hover:shadow-md/g, 'shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/20');

// Some touchups for input backgrounds
content = content.replace(/bg-white border/g, 'bg-white/80 backdrop-blur-sm border');

fs.writeFileSync('src/components/UnifiedAuthLanding.tsx', content);

console.log("Applied luxury styling edits");
