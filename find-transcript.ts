import * as fs from 'fs';
import * as path from 'path';

function searchUp(dir: string, depth = 0): string | null {
  if (depth > 6) return null;
  console.log('Searching up at depth', depth, ':', dir);
  try {
    const files = fs.readdirSync(dir);
    if (files.includes('.gemini')) {
      console.log('Found .gemini folder at:', path.join(dir, '.gemini'));
      return path.join(dir, '.gemini');
    }
  } catch (e: any) {
    console.log('Error reading', dir, e.message);
  }
  const parent = path.dirname(dir);
  if (parent === dir) return null;
  return searchUp(parent, depth + 1);
}

try {
  const geminiDir = searchUp(process.cwd());
  if (geminiDir) {
    // Let's recursively search all files inside the geminiDir
    const findTranscript = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        if (file === 'transcript.jsonl') {
          results.push(full);
        } else if (fs.statSync(full).isDirectory()) {
          results = results.concat(findTranscript(full));
        }
      }
      return results;
    };
    const transcripts = findTranscript(geminiDir);
    console.log('Transcripts found:', transcripts);
  }
} catch (e: any) {
  console.error('Error:', e.message);
}
