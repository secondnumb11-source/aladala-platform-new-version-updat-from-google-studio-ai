import fs from 'fs';
let code = fs.readFileSync('src/components/EmployeePortal.tsx', 'utf8');

if (!code.includes('hearings?: any[];')) {
  code = code.replace(/tasks: Task\[\];/, "tasks: Task[];\n  hearings?: any[];");
  code = code.replace(/tasks = \[\],(\s*)currentUser/, "tasks = [],\n  hearings = [],$1currentUser");
  fs.writeFileSync('src/components/EmployeePortal.tsx', code);
}

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('hearings={hearings}') && appCode.includes('<EmployeePortal')) {
  appCode = appCode.replace(/tasks=\{tasks\}/, "tasks={tasks}\n            hearings={hearings}");
  fs.writeFileSync('src/App.tsx', appCode);
}
console.log("Portal Props Fixed");
