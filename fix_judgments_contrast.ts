import fs from 'fs';

function fixContrast(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Convert text-slate-600 to text-slate-400
    // Convert text-slate-500 to text-slate-300
    content = content.replace(/\btext-slate-600\b/g, 'text-slate-400');
    content = content.replace(/\btext-slate-500\b/g, 'text-slate-300');
    content = content.replace(/\btext-slate-400\b/g, 'text-slate-200');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Fixed contrast for:', filePath);
    }
}

fixContrast('src/components/CaseJudgmentsModule.tsx');
