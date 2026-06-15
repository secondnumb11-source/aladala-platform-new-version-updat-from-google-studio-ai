import fs from 'fs';
import path from 'path';

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        filelist = walkSync(dirFile, filelist);
      }
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

  // Enhance bad text contrast in table cells and generally
  content = content.replace(/text-gray-500/g, 'text-gray-100 font-bold');
  content = content.replace(/text-slate-500/g, 'text-slate-100 font-bold');
  content = content.replace(/text-gray-400/g, 'text-white font-bold');
  content = content.replace(/text-slate-400/g, 'text-white font-bold');
  content = content.replace(/text-gray-600/g, 'text-gray-100 font-bold');
  content = content.replace(/text-slate-600/g, 'text-slate-100 font-bold');
  
  if (file.includes('CasesModule')) {
      content = content.replace(/text-slate-300/g, 'text-white font-bold');
      content = content.replace(/text-slate-200/g, 'text-white font-black');
      content = content.replace(/bg-slate-800\/50/g, 'bg-slate-900 border border-slate-700');
  }

  // Update original App.tsx colors to CSS vars if necessary (optional as handled elsewhere)

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
  }
});
console.log('Update tables and colors.');
