import fs from 'fs';
import path from 'path';

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Mass replacement for max text contrast
  
  // Slate grayscale
  content = content.replace(/text-slate-200/g, 'text-white font-bold');
  content = content.replace(/text-slate-300/g, 'text-white font-bold');
  content = content.replace(/text-slate-400/g, 'text-slate-100 font-bold');
  content = content.replace(/text-slate-500/g, 'text-slate-100 font-bold');
  content = content.replace(/text-slate-600/g, 'text-slate-200 font-bold'); // Or dark? In dark theme this needs to be lighter
  
  // Gray grayscale
  content = content.replace(/text-gray-300/g, 'text-white font-bold');
  content = content.replace(/text-gray-400/g, 'text-gray-100 font-bold');
  content = content.replace(/text-gray-500/g, 'text-gray-200 font-bold');
  
  // Zinc / Neutral grayscale
  content = content.replace(/text-zinc-300/g, 'text-white font-bold');
  content = content.replace(/text-zinc-400/g, 'text-white font-bold');
  content = content.replace(/text-neutral-300/g, 'text-white font-bold');
  content = content.replace(/text-neutral-400/g, 'text-white font-bold');
  
  // Light opacity texts
  content = content.replace(/text-white\/30/g, 'text-white/80 font-bold');
  content = content.replace(/text-white\/40/g, 'text-white/90 font-bold');
  content = content.replace(/text-white\/50/g, 'text-white font-bold');
  content = content.replace(/text-white\/60/g, 'text-white font-bold');
  content = content.replace(/text-white\/70/g, 'text-white font-bold');
  content = content.replace(/text-white\/80/g, 'text-white font-bold');
  content = content.replace(/text-[#FFFFFF]\/50/g, 'text-[#FFFFFF] font-bold');
  content = content.replace(/text-[#FFFFFF]\/60/g, 'text-[#FFFFFF] font-bold');
  content = content.replace(/text-[#FFFFFF]\/70/g, 'text-[#FFFFFF] font-bold');
  
  // Dark text on dark bg mistakes (if any)
  // Gold texts to brighter yellow for better contrast
  content = content.replace(/text-\[\#D4AF37\]/g, 'text-[#FACC15] font-black');
  content = content.replace(/text-yellow-600/g, 'text-[#FACC15] font-black');
  content = content.replace(/text-yellow-700/g, 'text-[#FACC15] font-black');
  content = content.replace(/text-amber-600/g, 'text-amber-400 font-black');
  content = content.replace(/text-amber-700/g, 'text-amber-400 font-black');

  // Fix button text contrast on primary gold button (bg-[#D4AF37] text-white -> text-[#0b1329])
  content = content.replace(/bg-\[\#D4AF37\] text-white/g, 'bg-[#D4AF37] text-[#0b1329] font-black');
  content = content.replace(/bg-amber-400 text-white/g, 'bg-amber-400 text-[#0b1329] font-black');
  content = content.replace(/bg-yellow-400 text-white/g, 'bg-yellow-400 text-[#0b1329] font-black');
  content = content.replace(/bg-\[\#FACC15\] text-white/g, 'bg-[#FACC15] text-[#0b1329] font-black');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
  }
});
console.log('Heavy global contrast improvements applied.');
