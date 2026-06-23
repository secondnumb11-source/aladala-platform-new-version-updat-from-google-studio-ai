const fs = require('fs');

// AddCaseModal
let code1 = fs.readFileSync('src/components/cases/AddCaseModal.tsx', 'utf8');
code1 = code1.replace(
  /<button\s+type="submit"\s+disabled={isSubmitting}\s+className="bg-slate-900 text-white font-black py-3 px-12 rounded-xl text-xs uppercase hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 shadow-lg"\s*>([\s\S]*?)<\/button>/g,
  (match, content) => {
    return `<button
              type="submit"
              disabled={isSubmitting}
              className="bg-transparent border-2 border-slate-900 text-slate-900 font-black py-3 px-12 rounded-xl text-sm transition-all hover:bg-slate-900 hover:text-white flex items-center gap-2 shadow-sm outline-none uppercase"
            >${content}</button>`;
  }
);
fs.writeFileSync('src/components/cases/AddCaseModal.tsx', code1, 'utf8');

// CasesList
let code2 = fs.readFileSync('src/components/cases/CasesList.tsx', 'utf8');
code2 = code2.replace(
  /<button\s+type="button"\s+onClick={[\s\S]*?className={`([^`]*)`}\s+title="حذف القضية نهائياً"\s*>\s*<Trash2 className="w-3.5 h-3.5" \/>\s*<\/button>/g,
  (match, p1) => {
    return `<button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCase && onDeleteCase(c.id);
                    }}
                    className="bg-transparent border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-all shadow-sm flex items-center justify-center outline-none"
                    title="حذف القضية نهائياً"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                  </button>`;
  }
);
fs.writeFileSync('src/components/cases/CasesList.tsx', code2, 'utf8');

console.log('Action buttons updated in AddCaseModal and CasesList');
