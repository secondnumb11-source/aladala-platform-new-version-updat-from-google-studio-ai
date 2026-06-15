import * as fs from 'fs';

try {
  const code = fs.readFileSync('src/components/CasesModule.tsx', 'utf-8');
  const lines = code.split('\n');
  for (let i = 3270; i <= 3302; i++) {
    console.log(`${i}: ${JSON.stringify(lines[i - 1])}`);
  }
} catch (e: any) {
  console.error(e.message);
}
