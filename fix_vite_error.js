import fs from 'fs';
let content = fs.readFileSync('src/index.css', 'utf-8');
if (!content.includes('vite-error-overlay')) {
  content += `\n\n/* Suppress Vite Error Overlay natively */
vite-error-overlay {
  display: none !important;
}

/* Intelligent WCAG Variables using color-mix for automatic contrast adjustment */
:root {
  --theme-text-primary: color-mix(in srgb, #ffffff 85%, var(--bg-main, #000));
  --theme-text-secondary: color-mix(in srgb, #facc15 90%, var(--bg-main, #000));
  --theme-text-muted: color-mix(in srgb, #9ca3af 70%, var(--bg-main, #000));
}
html:not(.dark) {
  --theme-text-primary: color-mix(in srgb, #0b1329 95%, #fff);
  --theme-text-secondary: color-mix(in srgb, #b8860b 90%, #fff);
  --theme-text-muted: color-mix(in srgb, #4b5563 80%, #fff);
}
`;
  fs.writeFileSync('src/index.css', content, 'utf-8');
  console.log('Appended elements to index.css');
}
