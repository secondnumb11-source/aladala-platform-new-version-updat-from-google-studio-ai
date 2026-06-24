const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

// I will find <main className="..."> and replace everything up to the first tab content wrapper or something.
const mainStart = content.indexOf('<main className="flex-1 p-4 pt-24 lg:p-8 overflow-y-auto overflow-x-hidden space-y-8 relative min-h-0">');

// But actually, I can just replace the main class to remove padding top and background
const replacedMain = content.replace(
  '<main className="flex-1 p-4 pt-24 lg:p-8 overflow-y-auto overflow-x-hidden space-y-8 relative min-h-0">',
  '<main className="flex-1 min-h-screen bg-[#f0f2f5] overflow-y-auto relative">'
);

fs.writeFileSync('src/App.tsx', replacedMain);
console.log('done main tag replacement');
