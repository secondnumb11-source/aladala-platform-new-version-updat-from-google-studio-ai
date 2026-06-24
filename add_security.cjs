const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const importAdd = `import { clearAllAppData, clearSession } from '@/lib/auth';\nimport { verifyDataIsolation } from '@/lib/officeManager';\n`;

const hookAdd = `
  // Security: Monitor unauthorized changes to office_id
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'adala_office_id') {
        console.error('[Adala Security] Unauthorized change to office ID detected! Purging session.');
        try {
           clearAllAppData();
           clearSession();
        } catch(err) {
           localStorage.clear();
           sessionStorage.clear();
        }
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Initial verification
    if (!verifyDataIsolation()) {
        try {
           clearAllAppData();
           clearSession();
        } catch(err) {
           localStorage.clear();
           sessionStorage.clear();
        }
        window.location.reload();
    }
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
`;

let newContent = content;
if (!content.includes('verifyDataIsolation')) {
  // Add imports
  const importIndex = content.lastIndexOf("import");
  const endOfImports = content.indexOf("\n", importIndex) + 1;
  newContent = newContent.substring(0, endOfImports) + importAdd + newContent.substring(endOfImports);
  
  // Add hook inside App function
  const appStart = newContent.indexOf('function App() {') > -1 ? newContent.indexOf('function App() {') + 16 : newContent.indexOf('export default function App() {') + 31;
  newContent = newContent.substring(0, appStart) + hookAdd + newContent.substring(appStart);
}

fs.writeFileSync('src/App.tsx', newContent);
console.log('done security listener');
