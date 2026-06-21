import fs from 'fs';
import path from 'path';

function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // We only want to replace inside className strings
    // But since it's hard to parse JSX safely, we'll do targeted replacements
    content = content.replace(/className="([^"]*(?:bg-slate-800|bg-slate-900|bg-\[#0[5a-fA-F][0-9a-fA-F]*\])[^"]*)"/g, (match, classStr) => {
        let newClass = classStr;
        
        // Let's do the transformations requested
        newClass = newClass.replace(/\btext-slate-700\b/g, 'text-slate-300');
        newClass = newClass.replace(/\btext-slate-800\b/g, 'text-slate-200');
        newClass = newClass.replace(/\btext-slate-900\b/g, 'text-white');
        newClass = newClass.replace(/\btext-gray-700\b/g, 'text-slate-300');
        newClass = newClass.replace(/\btext-gray-800\b/g, 'text-slate-200');
        newClass = newClass.replace(/\btext-gray-900\b/g, 'text-white');
        newClass = newClass.replace(/\btext-black\b/g, 'text-white');
        newClass = newClass.replace(/\btext-slate-600\b/g, 'text-slate-400');
        newClass = newClass.replace(/\btext-gray-600\b/g, 'text-slate-400');
        
        // Exceptions
        newClass = newClass.replace(/\btext-slate-500\b/g, 'text-slate-500'); // No-op as requested

        return `className="${newClass}"`;
    });

    // Also replace template strings className={`...`}
    content = content.replace(/className=\{`([^`]*(?:bg-slate-800|bg-slate-900|bg-\[#0[5a-fA-F][0-9a-fA-F]*\])[^`]*)`\}/g, (match, classStr) => {
        let newClass = classStr;
        
        newClass = newClass.replace(/\btext-slate-700\b/g, 'text-slate-300');
        newClass = newClass.replace(/\btext-slate-800\b/g, 'text-slate-200');
        newClass = newClass.replace(/\btext-slate-900\b/g, 'text-white');
        newClass = newClass.replace(/\btext-gray-700\b/g, 'text-slate-300');
        newClass = newClass.replace(/\btext-gray-800\b/g, 'text-slate-200');
        newClass = newClass.replace(/\btext-gray-900\b/g, 'text-white');
        newClass = newClass.replace(/\btext-black\b/g, 'text-white');
        newClass = newClass.replace(/\btext-slate-600\b/g, 'text-slate-400');
        newClass = newClass.replace(/\btext-gray-600\b/g, 'text-slate-400');
        
        return `className={\`${newClass}\`}`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('Fixed', filePath);
    }
}

function walkDir(dir: string) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            walkDir(p);
        } else if (p.endsWith('.tsx')) {
            fixFile(p);
        }
    });
}

walkDir(path.join(process.cwd(), 'src/components'));
