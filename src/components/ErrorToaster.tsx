import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X } from 'lucide-react';

interface ErrorEventDetail {
  message: string;
  source?: string;
  timestamp: string;
  isSaveFailure?: boolean;
  type?: string;
  action?: string;
  payload?: any;
}

export const ErrorToaster = () => {
  const [errors, setErrors] = useState<ErrorEventDetail[]>([]);

  useEffect(() => {
    const handleError = (event: any) => {
      const detail = event.detail as ErrorEventDetail;
      const id = Math.random().toString(36).substring(2, 9);
      const newError = { ...detail, id } as any;
      
      setErrors(prev => [newError, ...prev].slice(0, 3));

      // Auto-remove after 8 seconds
      setTimeout(() => {
        setErrors(prev => prev.filter(e => (e as any).id !== id));
      }, 8000);
    };

    window.addEventListener('adalah_error_logged', handleError);
    window.addEventListener('adalah_rls_friction_detected', handleError);
    
    return () => {
      window.removeEventListener('adalah_error_logged', handleError);
      window.removeEventListener('adalah_rls_friction_detected', handleError);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col gap-3 max-w-md w-full pointer-events-none" dir="rtl">
      <AnimatePresence>
        {errors.map((err: any) => (
          <motion.div
            key={err.id}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            className="pointer-events-auto bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl p-4 flex flex-col gap-2 relative overflow-hidden group"
          >
            {/* Background warning pattern */}
            <div className="absolute top-0 right-0 w-1 h-full bg-red-500"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>

            <div className="flex items-start gap-3">
              <div className="bg-red-500/20 text-red-500 p-2 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-red-400 font-black text-sm">تنبيه: خطأ في النظام</h4>
                  <button 
                    onClick={() => setErrors(prev => prev.filter(e => (e as any).id !== err.id))}
                    className="text-slate-500 hover:text-white transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-200 font-bold leading-relaxed whitespace-pre-line">
                  {err.message || "حدث خطأ غير متوقع أثناء معالجة الطلب."}
                </p>
              </div>
            </div>

            {err.sqlCode && (
              <div className="mt-2 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold">يمكنك حل المشكلة بلمسة واحدة:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(err.sqlCode);
                      // Visual feedback could be added here
                    }}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-50 text-white font-black text-[10px] rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    نسخ كود الإصلاح 📋
                  </button>
                  {err.consoleUrl && (
                    <a
                      href={err.consoleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] rounded-lg transition-all border border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      فتح Console ↗
                    </a>
                  )}
                </div>
              </div>
            )}
            
            <div className="text-[9px] text-slate-500 font-mono mt-1 text-left" dir="ltr">
              {new Date().toLocaleTimeString()} • {err.source || 'Engine'}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
