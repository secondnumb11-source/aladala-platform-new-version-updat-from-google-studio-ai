import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf-8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const char of line) {
    if (char === '{') balance++;
    if (char === '}') balance--;
  }
  if (balance < 0) {
    console.log(`Unbalanced closing } at line ${i + 1}: ${line}`);
    balance = 0; // reset to find multiple
  }
}

if (balance > 0) {
  console.log(`Missing ${balance} closing braces`);
}
