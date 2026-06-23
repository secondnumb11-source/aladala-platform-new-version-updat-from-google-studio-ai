const fs = require('fs');
let code = fs.readFileSync('src/components/CasesModule.tsx', 'utf8');

const startIndex = code.indexOf('{isCreateOpen && (');
const endIndex = code.indexOf('      {/* Scanned Document Attachments Upload Modal */}');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{isCreateOpen && (
        <AddCaseModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          clients={clients} 
          onUpdateState={onUpdateState} 
        />
      )}

`;
  
  const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/components/CasesModule.tsx', newCode, 'utf8');
  console.log('Successfully replaced isCreateOpen modal block!');
} else {
  console.log('Could not find start or end index.');
}
