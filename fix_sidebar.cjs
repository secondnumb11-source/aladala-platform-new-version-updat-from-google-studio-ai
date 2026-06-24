const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

content = content.replace("icon: ShieldAlert },", "icon: Bot },");
content = content.replace("const ShieldAlert = Bot; ", "");

fs.writeFileSync('src/components/Sidebar.tsx', content);
console.log('fixed ShieldAlert');
