import fs from 'fs';
let content = fs.readFileSync('src/components/CasesModule.tsx', 'utf-8');

// The user requested: "زيادة حدة تباين النصوص في كارت أدخال بيانات القضايا"
// So we need to find "إضافة قضية جديدة" or input fields there and make them highly contrasted.
content = content.replace(/border-white\/10 text-white/g, 'border-white/20 text-[#FFFFFF] font-black outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]');
content = content.replace(/bg-slate-900 border-white\/10 text-white/g, 'bg-[#0b1329] border-white/20 text-[#FFFFFF] font-black');
content = content.replace(/text-slate-200 text-sm/g, 'text-white font-black text-sm');
content = content.replace(/text-slate-300 font-medium/g, 'text-white font-black');
content = content.replace(/text-slate-300 text-sm/g, 'text-white font-black text-sm');
content = content.replace(/text-slate-400 text-sm/g, 'text-white font-black text-sm');
content = content.replace(/text-gray-400 text-sm/g, 'text-white font-black text-sm');

fs.writeFileSync('src/components/CasesModule.tsx', content, 'utf-8');
