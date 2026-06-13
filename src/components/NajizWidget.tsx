import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InteractiveCard } from './InteractiveCard';

export const NajizWidget = () => {
  const [syncedOps, setSyncedOps] = useState(1432);
  const [latency, setLatency] = useState(120);
  const [status, setStatus] = useState<'connected' | 'syncing' | 'error'>('connected');

  // Simulate real-time data updates
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const variation = Math.random() > 0.5 ? 5 : -5;
        let newLatency = prev + variation;
        if (newLatency < 45) newLatency = 45;
        if (newLatency > 800) newLatency = 800;
        
        if (newLatency > 500) {
          setStatus('error');
        } else if (Math.random() > 0.8) {
          setStatus('syncing');
        } else {
          setStatus('connected');
        }
        
        return newLatency;
      });
      
      if (Math.random() > 0.7) {
        setSyncedOps(prev => prev + 1);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  */

  return (
    <InteractiveCard className="h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative">
      <div className="p-5">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              مؤشرات الربط مع ناجز
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">مراقبة الأداء اللحظي لمنصة العدالة</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 
            ${status === 'connected' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
              status === 'syncing' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 
              'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'connected' ? 'bg-emerald-500' : status === 'syncing' ? 'bg-blue-500' : 'bg-red-500'}`} />
            {status === 'connected' ? 'متصل ومستقر' : status === 'syncing' ? 'جاري المزامنة...' : 'تأخر في الاستجابة'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium">العمليات المكتملة</span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-white font-mono flex items-baseline gap-1">
              {syncedOps.toLocaleString('en-US')}
              <span className="text-[10px] text-emerald-500 flex items-center">
                <TrendingUp className="w-3 h-3 ml-0.5" /> +12
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium">زمن الاستجابة (Latency)</span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-white font-mono flex items-baseline gap-1">
              {latency}
              <span className="text-xs text-slate-500 font-sans font-normal ml-1">ms</span>
            </div>
            {latency > 300 && (
              <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" /> استجابة بطيئة نسبياً
              </div>
            )}
          </div>
        </div>

        {/* Real-time wave animation */}
        <div className="mt-6 h-8 w-full flex items-end gap-1 opacity-50 relative bottom-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-full rounded-t-sm ${status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
              animate={{ 
                height: ['20%', `${Math.random() * 80 + 20}%`, '20%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </InteractiveCard>
  );
};
