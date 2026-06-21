import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

interface SystemErrorRecoveryProps {
  onRetry: () => void;
  isError?: boolean;
  error?: Error | null;
  componentName?: string;
  errorContext?: string;
  errorDetails?: any;
  children?: React.ReactNode;
}

export const SystemErrorRecovery: React.FC<SystemErrorRecoveryProps> = ({ 
  onRetry, 
  isError,
  error, 
  componentName = 'لوحة التحكم',
  errorContext,
  errorDetails,
  children 
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 3;

  const displayError = isError || !!error;

  useEffect(() => {
    if (displayError && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 3000 * (retryCount + 1));
      return () => clearTimeout(timer);
    }
  }, [displayError, retryCount]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        onRetry();
        setIsRetrying(false);
      }, 1000);
    }
  };

  if (!displayError) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-[#0c1427]/80 backdrop-blur-xl border-2 border-white/5 rounded-[2.5rem] shadow-2xl text-center space-y-6 max-w-2xl mx-auto my-12" dir="rtl">
      <div className="relative">
        <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.3)]">
          {retryCount >= maxRetries ? (
            <AlertTriangle className="w-12 h-12 text-white animate-bounce" />
          ) : (
            <Activity className="w-12 h-12 text-white animate-spin-slow" />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-black text-white drop-shadow-md">
          {retryCount >= maxRetries ? 'عذراً، تعذر الربط التلقائي بالنظام' : `جاري رصد واستعادة ${componentName}...`}
        </h2>
        <p className="text-slate-200 font-bold text-sm font-bold leading-relaxed max-w-md mx-auto">
          {retryCount >= maxRetries 
            ? 'لقد تجاوز النظام عدد محاولات استعادة الجلسة الآمنة. يرجى محاولة التحديث اليدوي أو التأكد من جودة اتصالك بالإنترنت.'
            : `النظام يقوم حالياً بمعالجة خطأ تقني في ${componentName}. المحاولة رقم (${retryCount + 1} من ${maxRetries})`}
        </p>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleRetry}
          disabled={isRetrying || retryCount >= maxRetries}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs transition-all shadow-xl ${
            retryCount >= maxRetries
              ? 'bg-slate-800 text-slate-300 cursor-not-allowed opacity-50'
              : 'bg-amber-500 text-slate-950 active:scale-95'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>إعادة المحاولة الآن</span>
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs bg-white/5 text-white border border-white/10 transition-all shadow-lg"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>تحديث المتصفح</span>
        </button>
      </div>

      {error && (
        <div className="mt-8 p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-[10px] font-mono text-slate-700 text-left w-full overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-rose-400/70 uppercase tracking-widest font-black">
            <span className="w-2 h-2 rounded-full bg-rose-500/50 animate-pulse"></span>
            System Logs
          </div>
          {error.message}
        </div>
      )}
    </div>
  );
};

export default SystemErrorRecovery;
