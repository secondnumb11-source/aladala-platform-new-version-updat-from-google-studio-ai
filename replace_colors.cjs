const fs = require('fs');
let code = fs.readFileSync('src/components/CasesModule.tsx', 'utf8');

const startIndex = code.indexOf('{/* Scanned Document Attachments Upload Modal */}');
if (startIndex !== -1) {
  let firstPart = code.substring(0, startIndex);
  let processPart = code.substring(startIndex);
  
  processPart = processPart
    .replaceAll('bg-[#050e21]/90', 'bg-slate-900/40')
    .replaceAll('bg-[#050e21]', 'bg-white')
    .replaceAll('bg-[#0c1a35]', 'bg-slate-50')
    .replaceAll('bg-[#09101f]', 'bg-slate-100')
    .replaceAll('text-white', 'text-slate-900')
    .replaceAll('text-primary', 'text-amber-600')
    .replaceAll('border-slate-800', 'border-slate-200')
    .replaceAll('text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]', 'text-slate-800')
    .replaceAll('bg-slate-950/70', 'bg-slate-50')
    .replaceAll('bg-slate-950', 'bg-slate-100');
    
  fs.writeFileSync('src/components/CasesModule.tsx', firstPart + processPart, 'utf8');
  console.log('Replaced dark colors in remaining modals successfully!');
} else {
  console.log('Failed to find start index.');
}
