import React, { useState } from 'react';
import moment from 'moment-hijri';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, X, ArrowLeftRight } from 'lucide-react';

export default function DateConverterWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [converterMode, setConverterMode] = useState<'hijriToGregorian' | 'gregorianToHijri'>('hijriToGregorian');
  const [hijriInput, setHijriInput] = useState('');
  const [gregorianInput, setGregorianInput] = useState('');
  const [conversionResult, setConversionResult] = useState({ hijri: '', gregorian: '' });

  const handleConvertDate = () => {
    if (converterMode === 'hijriToGregorian' && hijriInput) {
      if (moment(hijriInput, 'iYYYY/iMM/iDD').isValid()) {
        const m = moment(hijriInput, 'iYYYY/iMM/iDD');
        setConversionResult({
          hijri: m.format('iYYYY/iMM/iDD'),
          gregorian: m.format('YYYY-MM-DD')
        });
      } else {
        setConversionResult({ hijri: 'صيغة خاطئة', gregorian: '' });
      }
    } else if (converterMode === 'gregorianToHijri' && gregorianInput) {
      if (moment(gregorianInput, 'YYYY-MM-DD').isValid()) {
        const m = moment(gregorianInput, 'YYYY-MM-DD');
        setConversionResult({
          hijri: m.format('iYYYY/iMM/iDD'),
          gregorian: m.format('YYYY-MM-DD')
        });
      } else {
        setConversionResult({ hijri: '', gregorian: 'صيغة خاطئة' });
      }
    }
  };

  return (
    <div className="relative z-[9999]" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`absolute bottom-16 left-0 origin-bottom-left flex flex-col rounded-2xl shadow-2xl overflow-hidden border-2 border-[#D4AF37]/50 bg-[#070d19] text-white transition-colors duration-500 w-[24rem] max-h-[80vh]`}
          >
             <div className="flex justify-between items-center px-6 py-4 border-b border-[#D4AF37]/30 bg-[#0b1329]">
                 <span className="text-[#FACC15] font-black text-lg flex items-center gap-2">
                   <CalendarDays className="w-5 h-5 text-[#FACC15]" />
                   محول التاريخ الذكي
                 </span>
                 <button onClick={() => setIsOpen(false)} className="text-[#ffffff] hover:text-[#facc15] hover:bg-[#D4AF37]/10 p-2 rounded-full transition-colors font-bold">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6">
                <div className="flex bg-[#0b1329] p-1.5 rounded-xl border border-[#D4AF37]/30 mb-6">
                  <button 
                    onClick={() => setConverterMode('hijriToGregorian')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black rounded-lg transition-all border-2 ${converterMode === 'hijriToGregorian' ? 'bg-[#D4AF37] text-[#0b1329] font-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-[#ffffff] border-transparent hover:text-[#facc15]'}`}
                  >
                    هجري إلى ميلادي
                  </button>
                  <button 
                    onClick={() => setConverterMode('gregorianToHijri')} 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black rounded-lg transition-all border-2 ${converterMode === 'gregorianToHijri' ? 'bg-[#D4AF37] text-[#0b1329] font-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-[#ffffff] border-transparent hover:text-[#facc15]'}`}
                  >
                    ميلادي إلى هجري
                  </button>
                </div>

                {converterMode === 'hijriToGregorian' ? (
                  <div className="space-y-3 mb-6">
                    <label className="text-sm text-[#FACC15] font-black block">التاريخ الهجري (سنة/شهر/يوم)</label>
                    <input 
                      type="text" 
                      placeholder="1445/09/15"
                      value={hijriInput}
                      onChange={(e) => setHijriInput(e.target.value)}
                      className="w-full bg-[#0b1329] border-2 border-[#D4AF37]/30 text-white placeholder-white/30 rounded-xl px-5 py-3 text-lg focus:border-[#FACC15] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 outline-none font-black transition-all"
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    <label className="text-sm text-[#FACC15] font-black block">التاريخ الميلادي</label>
                    <input 
                      type="date" 
                      value={gregorianInput}
                      onChange={(e) => setGregorianInput(e.target.value)}
                      className="w-full bg-[#0b1329] border-2 border-[#D4AF37]/30 text-white rounded-xl px-5 py-3 text-lg focus:border-[#FACC15] focus:outline-none focus:ring-2 focus:ring-[#FACC15]/30 outline-none font-black transition-all [color-scheme:dark]"
                    />
                  </div>
                )}

                <button 
                  onClick={handleConvertDate}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FACC15] hover:from-[#FACC15] hover:to-[#D4AF37] text-white font-black text-lg rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.4)] transition-all active:scale-95 border border-[#D4AF37]"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                  تحويل الآن
                </button>

                {conversionResult.gregorian && conversionResult.hijri && (
                  <div className="mt-6 p-5 bg-[#0b1329] rounded-xl border border-[#D4AF37]/40 space-y-4 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#ffffff] font-bold">الموافق هجرياً:</span>
                      <span className="text-lg font-black text-[#FACC15] tracking-widest">{converterMode === 'gregorianToHijri' ? conversionResult.hijri : conversionResult.hijri}</span>
                    </div>
                    <div className="h-px w-full bg-[#D4AF37]/20"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#ffffff] font-bold">الموافق ميلادياً:</span>
                      <span className="text-lg font-black text-[#FACC15] tracking-widest">{converterMode === 'hijriToGregorian' ? conversionResult.gregorian : conversionResult.gregorian}</span>
                    </div>
                  </div>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 overflow-hidden bg-[#1E293B] border border-[#D4AF37]/50 rounded-full shadow-[0_4px_20px_rgba(212,175,55,0.3)] text-[#FACC15] font-black transition-all z-50 group px-4 py-3 cursor-pointer"
        title="محول التاريخ"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FACC15] flex items-center justify-center text-slate-900 shrink-0">
          <CalendarDays className="w-3.5 h-3.5" />
        </div>
        <span className="font-black text-xs whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FACC15]">محول التاريخ</span>
      </motion.button>
    </div>
  );
}
