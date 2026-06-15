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

  // Global contrast improvements for text colors
  content = content.replace(/text-slate-400/g, 'text-slate-100 font-bold');
  content = content.replace(/text-slate-300/g, 'text-white font-bold');
  content = content.replace(/text-slate-500/g, 'text-slate-200 font-bold');
  content = content.replace(/text-gray-400/g, 'text-white font-bold');
  content = content.replace(/text-gray-500/g, 'text-gray-200 font-bold');
  content = content.replace(/text-gray-300/g, 'text-white font-bold');
  
  // Specific to dashboard/landing
  content = content.replace(/text-white\/60/g, 'text-white font-bold');
  content = content.replace(/text-white\/70/g, 'text-white font-bold');
  content = content.replace(/text-white\/50/g, 'text-white font-bold');
  
  // Replace amber/yellow to be brighter
  content = content.replace(/text-amber-600/g, 'text-amber-400 font-black');
  content = content.replace(/text-yellow-600/g, 'text-yellow-400 font-black');
  content = content.replace(/text-yellow-500/g, 'text-yellow-400 font-black');

  // Fix up specific buttons
  content = content.replace(/text-\[\#0b1329\]/g, 'text-white');
  content = content.replace(/text-\[\#D4AF37\]/g, 'text-[#FACC15] font-black');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
  }
});
console.log('Global contrast update complete.');
