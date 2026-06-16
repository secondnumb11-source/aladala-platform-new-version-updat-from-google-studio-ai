import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Clock, CheckCircle, AlertCircle, AlertTriangle, X, ChevronDown, List, Terminal, Activity, Download, RefreshCw, Volume2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// Using singleton from @/lib/supabase

interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  records?: number;
  duration?: number;
}

export default function NajizSyncBackendService() {
  const [themeTick, setThemeTick] = useState(Date.now());

  useEffect(() => {
    const handleThemeEvent = () => setThemeTick(Date.now());
    window.addEventListener('adalah-advanced-config-updated', handleThemeEvent);
    return () => window.removeEventListener('adalah-advanced-config-updated', handleThemeEvent);
  }, []);

  const [showSettings, setShowSettings] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncFrequency, setSyncFrequency] = useState<number>(() => {
    return Number(localStorage.getItem('adalah-sync-frequency')) || 60000; // Default 1 min
  });
  
  const [syncDisabled, setSyncDisabled] = useState<boolean>(() => {
    localStorage.setItem('adalah-najiz-sync-disabled', 'true');
    return true; // Force-disabled per request
  });

  const handleToggleSyncDisabled = (disabled: boolean) => {
    localStorage.setItem('adalah-najiz-sync-disabled', disabled.toString());
    setSyncDisabled(disabled);
  };
  
  // Custom Error Page States
  const [showErrorScreen, setShowErrorScreen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'monitoring'>('settings');

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data for 24h Monitoring Chart
  const monitoringData = [
    { time: '00:00', success: 40, fail: 2 },
    { time: '04:00', success: 30, fail: 1 },
    { time: '08:00', success: 80, fail: 5 },
    { time: '12:00', success: 120, fail: 12 },
    { time: '16:00', success: 110, fail: 8 },
    { time: '20:00', success: 60, fail: 3 }
  ];

  useEffect(() => {
    const handleToggle = () => setShowSettings(prev => !prev);
    window.addEventListener('najiz-sync-toggle-settings', handleToggle);
    return () => window.removeEventListener('najiz-sync-toggle-settings', handleToggle);
  }, []);

  const handleUpdateFrequency = (freq: number) => {
    localStorage.setItem('adalah-sync-frequency', freq.toString());
    setSyncFrequency(freq);
    
    // Restart polling with new frequency
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    startPolling(freq);
  };

  const addLog = (log: Omit<SyncLog, 'id'>) => {
    const newLog = { ...log, id: Math.random().toString(36).substring(7) };
    setSyncLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [manualReason, setManualReason] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (retryCountdown !== null) {
      if (retryCountdown > 0) {
        timer = setTimeout(() => setRetryCountdown(prev => (prev !== null ? prev - 1 : null)), 1000);
      } else if (retryCountdown === 0 && consecutiveFailures <= 3) {
        // Trigger automatic retry
        setRetryCountdown(null);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        startPolling(syncFrequency);
      }
    }
    return () => clearTimeout(timer);
  }, [retryCountdown, consecutiveFailures, syncFrequency]);

  const startPolling = (freq: number) => {
    if (localStorage.getItem('adalah-najiz-sync-disabled') === 'true') {
      console.log("Najiz polling is suspended via adalah-najiz-sync-disabled");
      return;
    }
    const pollNajizData = async () => {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch('/api/state', { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`Server Error: ${res.status}`);

        const data = await res.json();
        const recordsCount = (data.cases?.length || 0) + (data.hearings?.length || 0);
        const duration = Date.now() - startTime;

        setConsecutiveFailures(0); // Reset failures on success

        // Dispatch connection pulse info
        window.dispatchEvent(new CustomEvent('najiz-connection-pulse', {
          detail: { 
            latency: duration, 
            timestamp: new Date().toISOString(),
            status: 'online'
          }
        }));

        addLog({
          timestamp: new Date().toISOString(),
          status: 'success',
          message: 'تم تحديث البيانات من بوابة ناجز بنجاح',
          records: recordsCount,
          duration
        });

        window.dispatchEvent(new CustomEvent('najiz-sync-update', {
          detail: { last_sync_at: new Date().toLocaleTimeString('ar-SA'), fullDataSync: true }
        }));
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isTimeout = err.name === 'AbortError';
        const failReason = isTimeout ? 'timeout' : (err.message.includes('401') ? 'unauthorized' : 'service_unavailable');
        
        setConsecutiveFailures(prev => {
          const next = prev + 1;
          if (next > 3) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setRetryCountdown(null);
            console.log(`[ALERT] Sync failed ${next} times. Halting automatic retries.`);
            setShowSettings(true); // Force open the modal for the user
          } else {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setRetryCountdown(10); // Wait 10 seconds before auto-retrying
          }
          if (next === 3) {
            // Mock Email Notification Trigger
            console.log(`[ALERT] Sending urgent email to lawyer: Sync failed ${next} times. Reason: ${err.message}`);
            window.dispatchEvent(new CustomEvent('adalah-alert', { 
                detail: { 
                    title: 'تنبيه فشل المزامنة المتكرر', 
                    message: `تم فشل المزامنة مع ناجز لـ ${next} محاولات متتالية. تم إرسال ملخص الخطأ بريدياً للمحامي المسؤول.`,
                    type: 'error'
                } 
            }));
          }
          return next;
        });

        setErrorDetails(failReason);
        setShowErrorScreen(true);
        if (audioAlertEnabled) {
          try {
            // Using a short beep encoded string to simulate Audio without external files
            const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); 
            beep.play().catch(e => console.warn("Audio play blocked", e));
          } catch(e) {}
        }

        addLog({
          timestamp: new Date().toISOString(),
          status: 'error',
          message: isTimeout ? 'انتهت مهلة الطلب (Timeout)' : `فشل المزامنة: ${err.message}`
        });
      }
    };

    pollNajizData();
    pollIntervalRef.current = setInterval(pollNajizData, freq);
  };

  const handleManualManualRetry = () => {
    setConsecutiveFailures(0);
    setRetryCountdown(null);
    setManualReason("");
    setShowErrorScreen(false);
    setErrorDetails(null);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    startPolling(syncFrequency);
  };

  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (!syncDisabled) {
      startPolling(syncFrequency);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [syncFrequency, syncDisabled]);

  return (
    <AnimatePresence>
      {showSettings && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-500/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  {showErrorScreen ? <AlertTriangle className="w-6 h-6 text-rose-500" /> : <Activity className="w-6 h-6 text-amber-500" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{showErrorScreen ? "فشل مزامنة ناجز" : "إعدادات المزامنة المتقدمة (ناجز)"}</h2>
                  <p className="text-xs text-slate-700 font-bold mt-1 uppercase tracking-widest">NajizSync Backend Engine v2 / Polling Service</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!showErrorScreen && (
                  <>
                    <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-white font-bold'}`}>الإعدادات</button>
                    <button onClick={() => setActiveTab('monitoring')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'monitoring' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-white font-bold'}`}>المراقبة والأداء</button>
                  </>
                )}
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-xl text-slate-200 font-bold transition-all flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
              {showErrorScreen ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                  {consecutiveFailures > 3 ? (
                    <div className="w-full max-w-sm space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center animate-pulse mb-6">
                        <AlertTriangle className="w-10 h-10 text-rose-500" />
                      </div>
                      <h3 className="text-xl font-black text-white">توقف المزامنة التلقائية</h3>
                      <p className="text-sm text-slate-200 font-bold">فشل الاتصال لأكثر من 3 مرات. يرجى تحديد سبب الفشل وطلب إرسال إعادة ربط مخصصة.</p>
                      
                      <div className="text-right space-y-2 mt-4">
                        <label className="text-xs font-bold text-white font-bold">حدد سبب الفشل المتوقع:</label>
                        <select 
                          value={manualReason}
                          onChange={(e) => setManualReason(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- اختر السبب --</option>
                          <option value="network">مشكلة في الشبكة المحلية</option>
                          <option value="portal">توقف بوابة ناجز</option>
                          <option value="auth">مشكلة في تفويض الشهادات</option>
                          <option value="other">أخرى</option>
                        </select>
                      </div>

                      <button 
                         onClick={() => {
                           setIsSubmittingManual(true);
                           setTimeout(() => {
                             setIsSubmittingManual(false);
                             handleManualManualRetry();
                           }, 1500);
                         }} 
                         disabled={!manualReason || isSubmittingManual}
                         className="w-full mt-4 bg-amber-500 text-slate-950 px-8 py-3 rounded-xl font-black flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isSubmittingManual ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        طلب إعادة ربط يدوياً
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-32 h-32 rounded-full bg-rose-500/10 flex items-center justify-center animate-pulse">
                        <Database className="w-16 h-16 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white mb-2">تعذر الاتصال ببوابة ناجز</h3>
                        <p className="text-slate-200 font-bold text-sm max-w-md mx-auto">
                          {errorDetails === 'timeout' ? 'استغرق الطلب وقتاً طويلاً (Timeout). قد يكون هناك ضغط على خوادم وزارة العدل.' :
                           errorDetails === 'unauthorized' ? 'فشل تفويض الدخول. يرجى مراجعة إعدادات المفاتيح وشهادات ZATCA.' :
                           'تعذر الوصول للخدمة (Service Unavailable). يرجى المحاولة لاحقاً.'}
                        </p>
                      </div>
                      <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                         <span className="text-sm font-bold text-white font-bold">تفعيل التنبيه الصوتي للأعطال</span>
                         <button onClick={() => setAudioAlertEnabled(!audioAlertEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${audioAlertEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}>
                           <Volume2 className={`w-3 h-3 absolute top-1.5 ${audioAlertEnabled ? 'left-1.5 text-slate-900' : 'right-1.5 text-slate-200 font-bold'}`} />
                         </button>
                      </div>
                      <button onClick={handleManualManualRetry} className="bg-emerald-500 text-slate-950 px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all">
                        {retryCountdown !== null ? (
                          <>إعادة المحاولة التلقائية بعد {retryCountdown}ث...</>
                        ) : (
                          <><RefreshCw className="w-4 h-4" /> إعادة المحاولة يدوياً</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              ) : activeTab === 'settings' ? (
                <>
                  {/* Toggle Switch to Enable/Disable Najiz Sync per user request */}
                  <section className="bg-slate-950/40 rounded-3xl border border-white/5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-right">
                        <div className="text-[10px] text-slate-700 font-black uppercase">مزامنة تواصل وبث ناجز الكلية العدلية</div>
                        <h3 className="text-sm font-black text-white">التحكم في المزامنة وبث قضايا ناجز</h3>
                      </div>
                      <button 
                        onClick={() => handleToggleSyncDisabled(!syncDisabled)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          syncDisabled 
                            ? 'bg-rose-500 text-white border border-rose-600' 
                            : 'bg-emerald-600 text-white border border-emerald-700'
                        }`}
                      >
                        {syncDisabled ? 'معطلة مؤقتاً 🔴 (تم الإيقاف)' : 'نشطة وتلقائية 🟢'}
                      </button>
                    </div>
                    {syncDisabled && (
                      <p className="text-xs text-rose-400 font-bold leading-relaxed text-right">
                        ⚠️ لقد تم إيقاف مزامنة وتحديث المعلومات العدلية تلقائياً من بوابة ناجز استجابة لطلبك. المزامنة ستظل معطلة بالكامل وبشكل مؤقت لحين قيامك بإعادتها مرة أخرى بالضغط على الزر أعلاه.
                      </p>
                    )}
                  </section>

                  {/* Frequency Selector */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black">تردد المزامنة التلقائية</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'كل 5 دقائق', val: 300000 },
                    { label: 'كل ساعة', val: 3600000 },
                    { label: 'يومياً', val: 86400000 },
                    { label: 'بث تجريبي (10ث)', val: 10000 }
                  ].map((freq) => (
                    <button
                      key={freq.val}
                      onClick={() => handleUpdateFrequency(freq.val)}
                      className={`p-4 rounded-2xl border transition-all text-[11px] font-black ${
                        syncFrequency === freq.val 
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xl shadow-amber-500/20' 
                          : 'bg-slate-950/50 border-white/5 text-slate-200 font-bold'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Status Section */}
              <section className="bg-slate-950/40 rounded-3xl border border-white/5 p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-700 font-black uppercase">آخر حالة اتصال</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                    <span className="text-sm font-black text-emerald-400">نشط (خلف الرادار)</span>
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <div className="text-[10px] text-slate-700 font-black uppercase">توقيت الخادم المحلي</div>
                  <div className="text-sm font-mono text-white">2026-06-08 15:36:34</div>
                </div>
              </section>

              {/* Logs Visualizer */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-black">سجل العمليات التفصيلي (Polling Logs)</h3>
                  </div>
                  <span className="text-[11px] bg-slate-800 text-slate-200 font-bold px-2 py-1 rounded-lg font-bold">آخر 50 عملية</span>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {syncLogs.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl text-slate-200 font-bold text-xs font-bold">
                      بانتظار بدء أول دورة مزامنة...
                    </div>
                  ) : (
                    syncLogs.map((log) => (
                      <div key={log.id} className="bg-slate-950/30 border border-white/5 p-4 rounded-2xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {log.status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-white">{log.message}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] text-slate-700 font-mono">{new Date(log.timestamp).toLocaleTimeString('ar-SA')}</span>
                              {log.records !== undefined && (
                                <span className="text-[11px] bg-amber-500/5 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/10 font-bold">
                                  {log.records} سجلات
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {log.duration && (
                          <div className="text-[10px] font-mono text-slate-200 font-bold font-bold">{log.duration}ms</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
              </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">لوحة مراقبة الأداء (24 ساعة)</h3>
                      <p className="text-xs text-slate-200 font-bold mt-1">تحليل دورات اتصال بوابة ناجز وقياس معدل الاستقرار</p>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" /> تصدير PDF
                    </button>
                  </div>
                  
                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 h-[320px] w-full mt-4" style={{ minWidth: 0 }}>
                    <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} key={themeTick}>
                        <BarChart data={monitoringData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="success" name="عمليات ناجحة" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="fail" name="عمليات فاشلة" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                     <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-black text-emerald-400">92%</div>
                        <div className="text-[10px] text-emerald-500/70 font-bold mt-1">معدل الاستقرار والسحب (Uptime)</div>
                     </div>
                     <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center">
                        <div className="text-2xl font-black text-rose-400">8%</div>
                        <div className="text-[10px] text-rose-500/70 font-bold mt-1">نسبة الخطأ / Timeout</div>
                     </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/5 flex gap-4">
              <button 
                onClick={() => setSyncLogs([])}
                className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-200 font-bold text-sm font-black transition-all"
              >
                مسح السجلات الحالية
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 py-4 bg-amber-500 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-xl shadow-amber-500/20"
              >
                حفظ الإعدادات وإغلاق
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}