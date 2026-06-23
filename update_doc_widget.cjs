const fs = require('fs');

let code = fs.readFileSync('src/components/cases/DocumentUploadWidget.tsx', 'utf8');

const sIdx = code.indexOf('<button');
const eIdx = code.indexOf('<span>{isUploading');

if (sIdx !== -1 && eIdx !== -1) {
  let firstPart = code.substring(0, sIdx);
  let endPart = code.substring(eIdx);

  const replacement = `<button
          type="button"
          onClick={handleUploadAction}
          disabled={status !== 'idle' || pendingFiles.length === 0}
          className="bg-transparent border-2 border-emerald-500 text-emerald-500 font-extrabold py-2.5 px-6 rounded-xl text-sm transition-all hover:bg-emerald-500 hover:text-white flex items-center gap-2 outline-none disabled:opacity-50 shadow-sm"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          `;
          
  fs.writeFileSync('src/components/cases/DocumentUploadWidget.tsx', firstPart + replacement + endPart, 'utf8');
  console.log('Update DocumentUploadWidget - forced string replace');
}
