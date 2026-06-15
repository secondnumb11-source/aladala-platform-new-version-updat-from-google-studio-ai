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
  // Update badges to include borders and clear contrasting text
  content = content.replace(/bg-emerald-500\/10 text-emerald-400/g, 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold');
  content = content.replace(/bg-amber-500\/10 text-amber-400/g, 'bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold');
  content = content.replace(/bg-rose-500\/10 text-rose-400/g, 'bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold');
  
  content = content.replace(/bg-emerald-100 text-emerald-600/g, 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold');
  content = content.replace(/bg-amber-100 text-amber-600/g, 'bg-amber-100 border border-amber-300 text-amber-800 font-bold');
  content = content.replace(/bg-rose-100 text-rose-600/g, 'bg-rose-100 border border-rose-300 text-rose-800 font-bold');
  
  content = content.replace(/bg-sky-500\/10 text-sky-400/g, 'bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold');
  content = content.replace(/bg-blue-500\/10 text-blue-400/g, 'bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
  }
});
console.log('Update badges contrast with borders.');

