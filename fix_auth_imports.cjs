const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("import { clearAllAppData, clearSession } from '@/lib/auth';", "");
content = content.replace("clearAllAppData();", "localStorage.clear();");
content = content.replace("clearSession();", "sessionStorage.clear();");

fs.writeFileSync('src/App.tsx', content);
console.log('done fixes');
