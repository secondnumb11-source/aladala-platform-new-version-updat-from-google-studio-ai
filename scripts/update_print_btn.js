import fs from 'fs';
let code = fs.readFileSync('src/components/EmployeesData.tsx', 'utf8');

const printButtonHTML = `
            <button 
              type="button"
              onClick={() => window.print()}
              className="px-6 py-4 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-black rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <FileText className="w-5 h-5" />
              تصدير ملف الموظف (PDF)
            </button>
            <button 
`;

code = code.replace(/<button \s*onClick=\{\(\) => \{ setView\('list'\); setSelectedConfigEmployee\(null\); setFormData\(\{\}\); \}\}\s*className="px-8 py-4/, printButtonHTML + '<button onClick={() => { setView(\'list\'); setSelectedConfigEmployee(null); setFormData({}); }}\n              className="px-8 py-4');

if (!code.includes("import {") || !code.includes("FileText")) {
    code = code.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, FileText } from 'lucide-react';");
}

fs.writeFileSync('src/components/EmployeesData.tsx', code);
console.log("Print button added");
