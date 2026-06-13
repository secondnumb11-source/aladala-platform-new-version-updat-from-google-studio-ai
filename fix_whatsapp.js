import fs from 'fs';

let content = fs.readFileSync('src/components/WhatsappTemplates.tsx', 'utf8');

// The Table Card background
content = content.replace(
  /className="bg-gradient-to-br from-\[#9A7D2C\]\/90 via-\[#0c1424\] to-\[#0284C7\]\/85 border-2 border-\[#9A7D2C\] rounded-3xl p-6 shadow-2xl space-y-6 text-white text-right"/g,
  'className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-white text-right relative overflow-hidden"'
);

// The Table Header row bg
content = content.replace(
  /className="bg-\[#0c1830\] border-b border-slate-800 text-slate-200 font-bold"/g,
  'className="bg-slate-950/80 border-b border-slate-800 text-slate-300 font-bold"'
);

content = content.replace(
  /className="overflow-x-auto rounded-2xl border border-slate-800 bg-\[#040d1f\]"/g,
  'className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 block"'
);

// The table row hover
content = content.replace(
  /className="hover:bg-\[#0c1830\]\/50 transition-colors"/g,
  'className="hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/50"'
);

// Fix title section styling of table card
content = content.replace(
  /text-xs bg-yellow-500\/20 text-yellow-300 px-2.5 py-1 rounded-full border border-yellow-400 font-extrabold/g,
  'text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 font-bold uppercase tracking-wide'
);

content = content.replace(
  /text-xs text-yellow-300 font-bold/g,
  'text-xs text-slate-400 font-bold mt-2'
);

content = content.replace(
  /text-base font-black text-white flex items-center gap-2 mt-1/g,
  'text-lg font-black text-white flex items-center gap-2 mt-2'
);

// Fix status box styling in the table card header
content = content.replace(
  /bg-slate-950\/60 p-2.5 rounded-2xl border border-white\/10/g,
  'bg-slate-950 p-4 rounded-2xl border border-slate-800'
);

content = content.replace(
  /text-xs text-yellow-200 block font-black/g,
  'text-[10px] text-slate-500 block font-bold uppercase tracking-widest'
);

content = content.replace(
  /text-xs text-yellow-350 font-bold/g,
  'text-xs text-slate-300 font-bold'
);

// WhatsApp Phone framing
content = content.replace(
  /bg-slate-950 border-4 border-slate-900 rounded-\[35px\] p-4 shadow-2xl relative h-\[560px\] flex flex-col justify-between overflow-hidden/g,
  'bg-[#0b141a] border-[6px] border-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] relative h-[560px] flex flex-col justify-between overflow-hidden'
);

// WhatsApp notch (camera)
content = content.replace(
  /absolute top-2 left-1\/2 transform -translate-x-1\/2 h-4 w-28 bg-\[#151d30\] rounded-full z-25 flex items-center justify-center/g,
  'absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-2xl z-25 flex items-center justify-center'
);

// WhatsApp Top bar styling
content = content.replace(
  /bg-\[#0b141a\]\/95 border-b border-\[#12222d\] pt-3 pb-2.5 px-3/g,
  'bg-[#202c33] pt-5 pb-3 px-4 shadow-sm'
);

// Inside WhatsApp replace text colors
content = content.replace(
  /bg-\[#054735\] text-white border border-\[#0d5945\] p-3 rounded-2xl rounded-tr-none text-right shadow relative space-y-2 select-text/g,
  'bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none text-right shadow-sm relative space-y-2 select-text'
);

content = content.replace(
  /text-\[10.5px\] leading-relaxed whitespace-pre-line text-slate-100 font-sans/g,
  'text-[12px] leading-relaxed whitespace-pre-line text-[#e9edef] font-sans'
);

content = content.replace(
  /border-t-\[#054735\]/g,
  'border-t-[#005c4b]'
);

content = content.replace(
  /text-\[#869650\]/g,
  'text-[#8696a0]'
);

content = content.replace(
  /text-emerald-400/g,
  'text-[#53bdeb]'
);

content = content.replace(
  /bg-\[#152026\]\/40 p-2/g,
  'bg-[#182229] p-2 shadow-sm border border-[#2a3942]/50'
);

fs.writeFileSync('src/components/WhatsappTemplates.tsx', content);
