import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf-8');

// Replace shadow depths with clean flat design ones
css = css.replace(/--shadow-depth-1:[^;]+;/g, '--shadow-depth-1: 0 4px 6px rgba(0, 0, 0, 0.1);');
css = css.replace(/--shadow-depth-2:[^;]+;/g, '--shadow-depth-2: 0 10px 15px rgba(0, 0, 0, 0.1);');

// Remove before/after blocks
css = css.replace(/\.card-professional::before\s*\{[^}]+\}/g, '');
css = css.replace(/\.card-professional:not\(:hover\)::before\s*\{[^}]+\}/g, '');
css = css.replace(/\.card-professional::after\s*\{[^}]+\}/g, '');
css = css.replace(/\.card-professional:not\(:hover\)::after\s*\{[^}]+\}/g, '');

css = css.replace(/@keyframes card-border-pulse\s*\{[^}]+\}/g, '');
css = css.replace(/@keyframes borderGlowPulse\s*\{[^}]+\}/g, '');
css = css.replace(/@keyframes borderPulseGold\s*\{[^}]+\}/g, '');
css = css.replace(/\.animate-card-pulse\s*\{[^}]+\}/g, '');

// Extra cleanup for nested rules inside animations
css = css.replace(/50%\s*\{[^}]+\}/g, '');
css = css.replace(/100%\s*\{[^}]+\}/g, '');
css = css.replace(/0%,\s*100%\s*\{[^}]+\}/g, '');

fs.writeFileSync('src/index.css', css);
