const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("import { verifyDataIsolation } from '@/lib/officeManager';\n", "");
const importIndex = content.lastIndexOf("import");
const endOfImports = content.indexOf("\n", importIndex) + 1;
content = content.substring(0, endOfImports) + "import { verifyDataIsolation } from '@/lib/officeManager';\n" + content.substring(endOfImports);

fs.writeFileSync('src/App.tsx', content);
console.log('moved import');
