import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InteractiveCard } from './InteractiveCard';

export const NajizWidget = () => {
  const [syncedOps, setSyncedOps] = useState(1432);
  const [latency, setLatency] = useState(120);
  const [status, setStatus] = useState<'connected' | 'syncing' | 'error'>('connected');

  return (
    <InteractiveCard className="h-full border border-amber-900/30 bg-[#0c2461] overflow-hidden relative">
      <div className="p-5">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-50 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              مؤشرات الربط مع ناجز
            </h3>
            <p className="text-xs text-amber-200/70">مراقبة الأداء اللحظي لمنصة العدالة</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 
            ${status === 'connected' ? 'bg-emerald-900 text-emerald-100' : 
              status === 'syncing' ? 'bg-blue-900 text-blue-100' : 
              'bg-red-900 text-red-100'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'connected' ? 'bg-emerald-400' : status === 'syncing' ? 'bg-blue-400' : 'bg-red-400'}`} />
            {status === 'connected' ? 'متصل ومستقر' : status === 'syncing' ? 'جاري المزامنة...' : 'تأخر في الاستجابة'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0f2d7a] p-4 rounded-xl border border-amber-500/10">
            <div className="flex items-center gap-2 mb-2 text-amber-100/70">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium">العمليات المكتملة</span>
            </div>
            <div className="text-2xl font-black text-slate-50 font-mono flex items-baseline gap-1">
              {syncedOps.toLocaleString('en-US')}
              <span className="text-[10px] text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 ml-0.5" /> +12
              </span>
            </div>
          </div>

          <div className="bg-[#0f2d7a] p-4 rounded-xl border border-amber-500/10">
            <div className="flex items-center gap-2 mb-2 text-amber-100/70">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium">زمن الاستجابة (ms)</span>
            </div>
            <div className="text-2xl font-black text-slate-50 font-mono flex items-baseline gap-1">
              {latency}
            </div>
          </div>
        </div>

        {/* Real-time wave animation */}
        <div className="mt-6 h-8 w-full flex items-end gap-1 opacity-50 relative bottom-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-full rounded-t-sm ${status === 'error' ? 'bg-red-500' : 'bg-amber-400'}`}
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
