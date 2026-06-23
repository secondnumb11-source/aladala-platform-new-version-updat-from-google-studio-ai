const fs = require('fs');
let code = fs.readFileSync('src/components/CasesModule.tsx', 'utf8');

code = code.replace(/bg-\[\#0e2145\]/g, 'bg-slate-100');
code = code.replace(/bg-\[\#0f172a\]\[\#1e293b\]/g, 'bg-amber-100');
code = code.replace(/bg-\[\#050e21\]\/90/g, 'bg-white');
code = code.replace(/border-slate-800 text-xs text-white/g, 'border-slate-200 text-xs text-slate-800');

fs.writeFileSync('src/components/CasesModule.tsx', code, 'utf8');
console.log('Fixed leftover dark classes');
