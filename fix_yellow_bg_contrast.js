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

  // Revert contrast issues: bg-yellow-400 text-white -> bg-yellow-400 text-[#0b1329]
  content = content.replace(/bg-\[#FACC15\]\stext-white/g, 'bg-[#FACC15] text-[#0b1329]');
  content = content.replace(/bg-yellow-400\stext-white/g, 'bg-yellow-400 text-[#0b1329]');
  content = content.replace(/bg-amber-400\stext-white/g, 'bg-amber-400 text-[#0b1329]');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
  }
});
console.log('Fixed contrast for yellow backgrounds.');
