import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function NajizPerformanceWidget() {
  const [latency, setLatency] = useState(120);
  const [ops, setOps] = useState(482);
  const [last_sync_at, setLast_sync_at] = useState(new Date().toLocaleTimeString('ar-SA'));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const pulse = setInterval(() => {
      setLatency(100 + Math.floor(Math.random() * 50));
      if (Math.random() > 0.7) {
        setOps(prev => prev + 1);
        setLast_sync_at(new Date().toLocaleTimeString('ar-SA'));
      }
    }, 2000);
    return () => clearInterval(pulse);
  }, []);

  const manualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setOps(prev => prev + 3);
      setLast_sync_at(new Date().toLocaleTimeString('ar-SA'));
    }, 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white" dir="rtl">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
        <h3 className="font-bold text-sm text-white font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          الحالة المباشرة لبوابة ناجز
        </h3>
        <button onClick={manualSync} disabled={syncing} className="p-1.5 bg-slate-800 rounded transition-colors">
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0b1e33] p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-200 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-bold">العمليات الناجحة</span>
          </div>
          <div className="text-xl font-mono font-black text-emerald-400">{ops.toLocaleString()}</div>
        </div>

        <div className="bg-[#0b1e33] p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-200 font-bold mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold">زمن الاستجابة</span>
          </div>
          <div className="text-xl font-mono font-black text-amber-400">{latency}ms</div>
        </div>

        <div className="col-span-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex justify-between items-center">
          <span className="text-[10px] text-emerald-500 font-bold">آخر مزامنة تم تسجيلها:</span>
          <span className="text-xs font-mono text-emerald-400 font-black">{last_sync_at}</span>
        </div>
      </div>
    </div>
  );
}
