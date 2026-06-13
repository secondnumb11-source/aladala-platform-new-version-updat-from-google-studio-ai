import fs from 'fs';
let code = fs.readFileSync('src/components/FinanceModule.tsx', 'utf8');

if (!code.includes("import {") || !code.includes("Bell")) {
    code = code.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, Bell } from 'lucide-react';");
}

code = code.replace(/<button onClick=\{\(\) => setPrintInvoice\(inv\)\} className="text-\[10px\] bg-rose-600 hover:bg-rose-700 transition-colors text-white px-3 py-1\.5 rounded-lg font-black shadow-md flex items-center shrink-0 gap-1">\s*فتح الفاتورة <ExternalLink className="w-3 h-3" \/>\s*<\/button>/g,
  `<div className="flex gap-2">
      <button onClick={(e) => {
        e.stopPropagation();
        alert(\`تم إرسال إشعار فوري للمحامي المسؤول عن فاتورة العميل: \${inv.clientName}\`);
      }} className="text-[10px] bg-white border border-rose-200 hover:bg-rose-50 transition-colors text-rose-600 px-3 py-1.5 rounded-lg font-black shadow-sm flex items-center shrink-0 gap-1">
         إشعار المحامي <Bell className="w-3 h-3" />
      </button>
      <button onClick={() => setPrintInvoice(inv)} className="text-[10px] bg-rose-600 hover:bg-rose-700 transition-colors text-white px-3 py-1.5 rounded-lg font-black shadow-md flex items-center shrink-0 gap-1">
         فتح الفاتورة <ExternalLink className="w-3 h-3" />
      </button>
   </div>`
);
fs.writeFileSync('src/components/FinanceModule.tsx', code);
console.log("Finance updated");
