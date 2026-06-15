import fs from 'fs';
let content = fs.readFileSync('src/index.css', 'utf-8');
if (!content.includes('text-light-theme-optimized')) {
  content += `
.text-light-theme-optimized {
  color: #020617 !important;
  font-weight: 800 !important;
}
.text-dark-theme-optimized {
  color: #ffffff !important;
  font-weight: 800 !important;
}
`;
  fs.writeFileSync('src/index.css', content, 'utf-8');
}
