const fs = require('fs');
let code = fs.readFileSync('src/components/cases/CaseCard.tsx', 'utf8');

// 1. Change isLightTheme to false always for this design request
code = code.replace(/const isLightTheme = true;/g, 'const isLightTheme = false;');

// 2. Change the cardStyle to strictly be dark blue
code = code.replace(/const cardStyle.*\{([\s\S]*?)\};/g, `const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #020817 0%, #0f172a 100%)', // Dark Blue Background
    boxShadow: (isHovered || isKeyboardFocused) ? luxuryHoverShadow : luxuryShadow,
    borderColor: (isHovered || isKeyboardFocused) ? '#FF7F00' : '#1e293b', // High Contrast Border
    transform: (isHovered || isKeyboardFocused) ? 'translateY(-6px) scale(1.018)' : 'translateY(0) scale(1)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  };`);

// 3. To make text White/Yellow/Orange with high contrast and increased weight/size, 
// I'll update calculateTextColor logic to enforce these colors instead of the generated palette.
const calcTextFuncOld = /export function calculateTextColor\([\s\S]*?}\n\}/;
const calcTextFuncNew = `export function calculateTextColor(isLightTheme: boolean, isHighContrast: boolean, type: 'primary' | 'secondary' | 'muted' | 'accent', currentPalette: WCAGAAATextPalette): string {
  // Enforced High Contrast (White / Yellow / Orange) with increased weight and font size
  switch (type) {
    case 'primary': return 'text-white font-[900] text-xl drop-shadow-md';
    case 'secondary': return 'text-yellow-400 font-[900] text-lg drop-shadow-sm';
    case 'muted': return 'text-orange-400 font-[800] text-base';
    case 'accent': return 'text-[#FF7F00] font-[900] text-xl drop-shadow-md';
    default: return 'text-white font-bold';
  }
}`;
code = code.replace(calcTextFuncOld, calcTextFuncNew);

// 4. Update the Action buttons inside CaseCard.tsx.
// We have several action buttons in CaseCard.tsx: Archive, Delete, Sync, Quick Note.
// Archive: <button ... {c.archived ? 'استعادة ملف الدعوى' : 'نقل القضية للأرشيف'}
// Delete: <button ... <span>حذف الدعوى</span>
// Sync: <button ... 'مزامنة ناجز'
// Quick Note: <button ... 'ملاحظة سريعة'

// Let's replace the Delete button
code = code.replace(
  /<button[\s\S]*?id={`btn-delete-\${c\.id}`}[\s\S]*?className={`([^`]*)`}[\s\S]*?>([\s\S]*?)<\/button>/g,
  (match, p1, p2) => {
    return `<button
                  type="button"
                  id={\`btn-delete-\${c.id}\`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCase(c.id);
                  }}
                  className="bg-transparent border-2 border-rose-500 text-rose-500 font-black py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-rose-500 hover:text-white flex items-center gap-1.5 shadow-sm"
                >${p2}</button>`;
  }
);

// Archive button
code = code.replace(
  /<button[\s\S]*?id={`btn-archive-\${c\.id}`}[\s\S]*?className={`([^`]*)`}[\s\S]*?>([\s\S]*?)<\/button>/g,
  (match, p1, p2) => {
    return `<button
                  type="button"
                  id={\`btn-archive-\${c.id}\`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveToggle(c);
                  }}
                  className="bg-transparent border-2 border-amber-500 text-amber-500 font-black py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-amber-500 hover:text-slate-900 shadow-sm"
                >${p2}</button>`;
  }
);

// Sync button
code = code.replace(
  /<button[\s\S]*?id={`btn-sync-\${c\.id}`}[\s\S]*?className={`([^`]*)`}[\s\S]*?>([\s\S]*?)<\/button>/g,
  (match, p1, p2) => {
    return `<button
                type="button"
                id={\`btn-sync-\${c.id}\`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNajizSync(c);
                }}
                disabled={isSyncing === c.id}
                className="bg-transparent border-2 border-emerald-400 text-emerald-400 font-black py-2 px-3 rounded-xl text-sm transition-all hover:bg-emerald-400 hover:text-slate-900 flex items-center gap-1.5 shadow-sm outline-none"
                title="سحب وقائع وبيانات صك الحكم من ناجز"
              >${p2}</button>`;
  }
);

// Quick Note button
code = code.replace(
  /<button[\s\S]*?id={`btn-quick-note-\${c\.id}`}[\s\S]*?className={`([^`]*)`}[\s\S]*?>([\s\S]*?)<\/button>/g,
  (match, p1, p2) => {
    return `<button
                type="button"
                id={\`btn-quick-note-\${c.id}\`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotePopoverOpen(true);
                }}
                className="bg-transparent border-2 border-[#FF7F00] text-[#FF7F00] font-black py-2 px-3 rounded-xl text-sm transition-all hover:bg-[#FF7F00] hover:text-slate-900 flex items-center gap-1.5 shadow-sm outline-none"
                title="إضافة ملاحظة سريعة للمكتب"
              >${p2}</button>`;
  }
);

fs.writeFileSync('src/components/cases/CaseCard.tsx', code, 'utf8');
console.log('CaseCard background and text colors updated to Dark Blue and White/Yellow/Orange. Buttons updated to high-contrast outline.');
