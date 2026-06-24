const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("import { verifyDataIsolation } from '@/lib/officeManager';\n", "");
content = content.replace("import { verifyDataIsolation } from '@/lib/officeManager';", "");

content = "import { verifyDataIsolation } from '@/lib/officeManager';\n" + content;

content = content.replace("if (!verifyDataIsolation()) {", "if (typeof verifyDataIsolation === 'function' && !verifyDataIsolation()) {");
content = content.replace("clearAllAppData()", "localStorage.clear()");
content = content.replace("clearSession()", "sessionStorage.clear()");

// also we need Bell and roles
// Wait, Bell is from lucide-react. Let's add it to the import.
content = content.replace("import { Search, AlertCircle, X, Wifi, Activity, AlertTriangle, Server, LogOut, RefreshCw } from 'lucide-react';", "import { Search, AlertCircle, X, Wifi, Activity, AlertTriangle, Server, LogOut, RefreshCw, Bell } from 'lucide-react';");

fs.writeFileSync('src/App.tsx', content);
console.log('fixed');
