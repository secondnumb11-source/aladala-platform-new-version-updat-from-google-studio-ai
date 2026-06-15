import fs from 'fs';
let content = fs.readFileSync('src/index.css', 'utf-8');
if (!content.includes('@keyframes scan')) {
  content += `\n
@keyframes scan {
  0% { transform: translateY(0); }
  50% { transform: translateY(290px); }
  100% { transform: translateY(0); }
}
`;
  fs.writeFileSync('src/index.css', content, 'utf-8');
}
