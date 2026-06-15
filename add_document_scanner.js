import fs from 'fs';
let content = fs.readFileSync('src/components/DocumentsModule.tsx', 'utf-8');

if (!content.includes('OCR_AI_SCANNER')) {
  const codeInjection = `
  const [showAiScanner, setShowAiScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, analyzing, complete
  
  const handleAiScan = () => {
    setShowAiScanner(true);
    setScanStatus('scanning');
    
    // Simulate AI extraction timing
    setTimeout(() => setScanStatus('analyzing'), 2000);
    setTimeout(() => {
      setScanStatus('complete');
      // show success toast or auto fill
    }, 4500);
  };
  `;
  content = content.replace('const [searchQuery, setSearchQuery]', codeInjection + '\n  const [searchQuery, setSearchQuery]');

  const styleInjection = `
  {showAiScanner && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 OCR_AI_SCANNER">
      <div className="bg-[#0b1329] border border-[#D4AF37]/50 rounded-[3rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
        {scanStatus === 'scanning' && <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] animate-pulse"></div>}
        
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <Camera className="w-6 h-6 text-[#FACC15]" />
          مسح ضوئي ذكي للمستند
        </h3>
        
        <div className="relative w-full h-[300px] bg-black/50 rounded-2xl border-2 border-dashed border-[#D4AF37]/50 flex items-center justify-center overflow-hidden mb-6">
          {scanStatus === 'scanning' && (
            <div className="absolute top-0 left-0 w-full h-2 bg-[#FACC15] shadow-[0_0_20px_#FACC15] animate-[scan_2s_ease-in-out_infinite]" />
          )}
          {scanStatus === 'analyzing' && (
            <div className="text-center">
              <RefreshCw className="w-10 h-10 text-[#FACC15] animate-spin mx-auto mb-3" />
              <p className="text-white font-bold text-sm">يقوم الذكاء الاصطناعي باستخراج البيانات...</p>
            </div>
          )}
          {scanStatus === 'complete' && (
             <div className="bg-[#0b1329]/90 border border-emerald-500/50 p-6 rounded-2xl w-10/12 text-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg mb-2">
                   <span className="text-emerald-400 font-bold">رقم القضية:</span>
                   <span className="text-white font-black">453216790</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                   <span className="text-emerald-400 font-bold">تاريخ الجلسة المكتشف:</span>
                   <span className="text-white font-black">1445-09-12</span>
                </div>
             </div>
          )}
          {scanStatus === 'idle' && (
             <Camera className="w-16 h-16 text-white/20" />
          )}
        </div>
        
        <div className="flex gap-4">
           {scanStatus === 'complete' ? (
             <button onClick={() => setShowAiScanner(false)} className="flex-1 bg-[#D4AF37] text-[#0b1329] font-black py-4 rounded-xl hover:bg-[#FACC15] transition-all">تأكيد وإضافة المستند</button>
           ) : (
             <button onClick={() => setShowAiScanner(false)} className="flex-1 border border-white/20 text-white font-black py-4 rounded-xl hover:bg-white/5 transition-all">إلغاء</button>
           )}
        </div>
      </div>
    </div>
  )}
  `;

  content = content.replace('{showUploadModal && (', styleInjection + '\n      {showUploadModal && (');
  
  // Also we need to inject `{ Camera, RefreshCw, CheckCircle2 }` to lucide-react import
  content = content.replace('import { Upload, FileText,', 'import { Upload, FileText, Camera, RefreshCw, CheckCircle2,');
  
  // Add a button inside the documents module to open this
  const buttonStr = `
  <div className="mb-8 flex gap-4">
    <button onClick={handleAiScan} className="flex-1 bg-[#0b1329] border border-[#D4AF37]/50 text-white p-6 rounded-3xl flex items-center justify-center gap-3 hover:bg-[#D4AF37]/10 transition-colors shadow-lg group">
      <div className="bg-[#D4AF37]/20 p-3 rounded-2xl group-hover:bg-[#D4AF37] transition-colors">
        <Camera className="w-6 h-6 text-[#FACC15] group-hover:text-[#0b1329]" />
      </div>
      <div className="text-right">
        <h3 className="font-black text-lg group-hover:text-[#FACC15] transition-colors">مسح ضوئي ذكي</h3>
        <p className="text-xs text-slate-300 font-bold">استخراج البيانات بالذكاء الاصطناعي</p>
      </div>
    </button>
  </div>
  `;
  content = content.replace('      <div className="flex flex-col', buttonStr + '\n      <div className="flex flex-col');
  
  fs.writeFileSync('src/components/DocumentsModule.tsx', content, 'utf-8');
  console.log('Injected OCR scanner');
}
