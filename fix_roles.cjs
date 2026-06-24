const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("roles.find(r => r.id === selectedRole)?.name", "selectedRole");

fs.writeFileSync('src/App.tsx', content);
console.log('fixed roles');
