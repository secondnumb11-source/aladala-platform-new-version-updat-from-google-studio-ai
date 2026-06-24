import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  execSync('npx degit secondnumb11-source/toooooool tmp_extension --force');
  console.log('Downloaded from github!');
  
  // copy everything from tmp_extension to extension
  const outDir = path.join(process.cwd(), 'extension');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  
  // Actually let's just run mv
  execSync('cp -r tmp_extension/* extension/');
  console.log('Copied to extension directory.');
} catch (e) {
  console.error(e);
}

