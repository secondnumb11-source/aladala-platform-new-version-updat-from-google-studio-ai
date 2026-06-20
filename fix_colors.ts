import * as fs from 'fs';

function replaceColors(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace classNames that are simple strings containing text-slate-XYZ 
  content = content.replace(/className="([^"]*?)text-slate-(900|800|700|600|200)([^"]*?)"/g, (match, p1, p2, p3) => {
    let bgBase = 'bg-slate-50'; // default fallback for light bg
    if (p2 === '200') bgBase = 'bg-slate-900'; // dark bg
    return `className={\`${p1}\${getContrastText('${bgBase}')}${p3}\`}`;
  });

  fs.writeFileSync(filePath, content);
}

replaceColors('src/components/AuditLogs.tsx');
replaceColors('src/components/WhatsappTemplates.tsx');
