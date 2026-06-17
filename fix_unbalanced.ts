import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let newLines = [];
let removed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let lineBalanceChange = 0;
  for (const char of line) {
    if (char === '{') lineBalanceChange++;
    if (char === '}') lineBalanceChange--;
  }

  if (balance + lineBalanceChange < 0) {
    // This line causes negative balance. We just remove the extra '}' from this line
    // or just don't add the line if it's just '}'
    if (line.trim() === '}') {
      console.log(`Removing dangling } at line ${i}`);
      removed++;
      // don't add to newLines
    } else {
      // replace first } with ''
      newLines.push(line.replace('}', ''));
    }
    balance = 0; // reset
  } else {
    balance += lineBalanceChange;
    newLines.push(line);
  }
}

fs.writeFileSync('src/index.css', newLines.join('\n'));
console.log(`Done, removed ${removed} braces.`);
