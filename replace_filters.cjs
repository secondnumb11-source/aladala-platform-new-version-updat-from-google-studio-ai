const fs = require('fs');
let code = fs.readFileSync('src/components/CasesModule.tsx', 'utf8');

const sIdx = code.indexOf('const filterBarMarkup = (');
const eIdx = code.indexOf('              <div className="flex flex-col gap-6 w-full">'); 

if (sIdx !== -1 && eIdx !== -1) {
  let firstPart = code.substring(0, sIdx);
  let processPart = code.substring(sIdx, eIdx);
  let lastPart = code.substring(eIdx);

  processPart = processPart
    .replaceAll('bg-[#050e21]', 'bg-white')
    .replaceAll('bg-[#0c1a35]', 'bg-slate-50')
    .replaceAll('border-slate-800', 'border-slate-200')
    .replaceAll('border-slate-700/50', 'border-slate-200')
    .replaceAll('border-slate-700/60', 'border-slate-200')
    .replaceAll('bg-slate-900', 'bg-slate-100')
    .replaceAll('bg-slate-900/60', 'bg-slate-50')
    .replaceAll('bg-[#0b1329]', 'bg-white')
    .replaceAll('text-white', 'text-slate-900');
    
  fs.writeFileSync('src/components/CasesModule.tsx', firstPart + processPart + lastPart, 'utf8');
  console.log('Replaced filter bar colors safely.');
} else {
  console.log('Indices not found!');
  console.log({sIdx, eIdx});
}
