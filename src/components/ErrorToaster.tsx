import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X } from 'lucide-react';

interface ErrorEventDetail {
  message: string;
  source?: string;
  timestamp: string;
}

export const ErrorToaster = () => {
  const [errors, setErrors] = useState<ErrorEventDetail[]>([]);

  useEffect(() => {
    const handleError = (e: any) => {
      const detail = e.detail;
      if (detail && detail.message) {
        setErrors(prev => {
          // Keep only the latest 3 active errors
          const updated = [...prev, detail];
          return updated.length > 3 ? updated.slice(updated.length - 3) : updated;
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
          setErrors(prev => prev.filter(err => err !== detail));
        }, 5000);
      }
    };

    window.addEventListener('adalah_error_logged', handleError);
    return () => window.removeEventListener('adalah_error_logged', handleError);
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {errors.map((error, idx) => (
          <motion.div
            key={`${error.timestamp}-${idx}`}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm pointer-events-auto"
            dir="rtl"
          >
            <div className="bg-red-500/10 p-2 rounded-full shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white mb-1">تنبيه بالنظام</h4>
              <p className="text-xs text-slate-200 font-bold font-medium line-clamp-2">{error.message}</p>
            </div>
            <button 
              onClick={() => setErrors(prev => prev.filter(e => e !== error))}
              className="text-slate-700 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
