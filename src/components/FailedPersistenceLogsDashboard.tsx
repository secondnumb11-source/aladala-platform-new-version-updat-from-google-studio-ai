import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Briefcase, 
  Code,
  Check,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface FailedLogEntry {
  id: string; // Add id
  timestamp: string;
  type: string;  // e.g., 'cases', 'clients'
  action?: string; // e.g., 'INSERT', 'UPDATE', 'DELETE'
  data: any;       // The raw JSON payload
  error?: any;     // Error details
}

interface FailedPersistenceLogsDashboardProps {
  onUpdateState: (type: string, data: any) => Promise<any>;
}

export default function FailedPersistenceLogsDashboard({ onUpdateState }: FailedPersistenceLogsDashboardProps) {
  const [logs, setLogs] = useState<FailedLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<FailedLogEntry | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'cases' | 'clients'>('all');
  const [syncStatus, setSyncStatus] = useState<Record<number, 'idle' | 'loading' | 'success' | 'failed'>>({});
  const [bulkSyncLoading, setBulkSyncLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Fetch logs from Supabase
  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }

      // Filter and map to FailedLogEntry format
      const filtered = (data || []).filter(item => 
        item.event_data && 
        (item.event_data.type === 'cases' || item.event_data.type === 'clients' || item.event_data.table === 'cases' || item.event_data.table === 'clients')
      ).map(item => {
        const type = item.event_data.type || item.event_data.table || 'unknown';
        return {
          id: item.id, // Include id
          timestamp: item.created_at || new Date().toISOString(),
          type,
          action: item.event_data.action || 'INSERT',
          data: item.event_data.data || {},
          error: item.event_data.error || 'N/A'
        };
      });
      setLogs(filtered);
    } catch (e) {
      console.error('Failed to fetch logs from system_errors:', e);
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Subscribe to changes in system_errors
    const channel = supabase.channel('system_errors_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_errors' }, fetchLogs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClearLogs = async () => {
    if (confirm('هل أنت متأكد من رغبتك في تفريغ قائمة الأخطاء والمسودات المعلقة؟')) {
      try {
        const idsToDelete = logs.map(l => l.id);
        const { error } = await supabase
          .from('system_errors')
          .delete()
          .in('id', idsToDelete);
        
        if (error) throw error;

        setLogs([]);
        setSelectedLog(null);
        showToast('تم تفريغ السجلات بنجاح.', true);
      } catch (e: any) {
        console.error(e);
        showToast(`فشل تفريغ السجلات: ${e.message}`, false);
      }
    }
  };

  const showToast = (text: string, success: boolean) => {
    setActionMessage({ text, success });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Sync a single record
  const handleRetrySyncSingle = async (index: number, entry: FailedLogEntry) => {
    setSyncStatus(prev => ({ ...prev, [index]: 'loading' }));
    try {
      // Invoke the handleUpdateGlobalState function passed as prop
      console.log(`[Dashboard Retry] Syncing record single type=${entry.type} action=${entry.action}`);
      
      const res = await onUpdateState(entry.type, entry.data);
      
      // If of format { success: false }
      if (res && res.success === false) {
        throw new Error(res.error?.message || res.message || 'Supabase returned RLS or persistence block');
      }

      setSyncStatus(prev => ({ ...prev, [index]: 'success' }));
      
      // Successfully synchronized, now remove from system_errors
      const { error } = await supabase
        .from('system_errors')
        .delete()
        .eq('id', entry.id);
        
      if (error) throw error;

      showToast(`تم مزامنة العنصر [${entry.type === 'cases' ? 'القضية' : 'العميل'}] بنجاح!`, true);
      
      // Reload logs
      setTimeout(fetchLogs, 800);
    } catch (err: any) {
      console.error('[Single Retry Failed]:', err);
      setSyncStatus(prev => ({ ...prev, [index]: 'failed' }));
      showToast(`فشلت إعادة المزامنة: ${err.message || String(err)}`, false);
    }
  };

  // Sync all records bulk
  const handleRetrySyncAll = async () => {
    if (logs.length === 0) return;
    setBulkSyncLoading(true);
    let successCount = 0;
    let failedCount = 0;

    const successfulIds = [];

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      setSyncStatus(prev => ({ ...prev, [i]: 'loading' }));
      try {
        const res = await onUpdateState(entry.type, entry.data);
        if (res && res.success === false) {
          throw new Error(res.error?.message || 'Blocked');
        }
        
        setSyncStatus(prev => ({ ...prev, [i]: 'success' }));
        successCount++;
        successfulIds.push(entry.id);
      } catch (err) {
        console.warn(`Bulk sync item index ${i} failed:`, err);
        setSyncStatus(prev => ({ ...prev, [i]: 'failed' }));
        failedCount++;
      }
    }

    if (successfulIds.length > 0) {
      await supabase
        .from('system_errors')
        .delete()
        .in('id', successfulIds);
    }

    setBulkSyncLoading(false);
    fetchLogs();
    showToast(`اكتملت المزامنة الجماعية: نجح (${successCount})، وفشل (${failedCount})`, successCount > 0);
  };


  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'all') return true;
    return log.type === activeFilter;
  });

  return (
    <div className="w-full min-h-[85vh] bg-slate-950 text-slate-100 rounded-3xl p-6 md:p-8 space-y-8 border border-slate-800 relative z-10 font-sans" dir="rtl">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] uppercase font-black bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20 tracking-wider">
              صيانة قاعدة البيانات ومزامنة الأخطاء
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-200">Persistence Outbox</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-rose-500" />
            مراجعة معلقات ومسودات الـ RLS وحفظ البيانات
          </h1>
          <p className="text-slate-300 font-bold text-sm max-w-3xl leading-relaxed">
            منظومة مراقبة الصيانة للمدراء لمتابعة ومراجعة البيانات (JSON Payloads) للقضايا والعملاء التي تعذر إرسالها لسحابة Supabase بسبب قيود حماية الصفوف (RLS) أو انقطاع الشبكة.
          </p>
        </div>

        {/* Global Stats bar */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shrink-0 min-w-full sm:min-w-[340px] shadow-lg">
          <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-black">إجمالي السجلات المعلقة</div>
            <div className="text-lg font-black font-mono text-white flex items-center gap-2">
              <span>{logs.length}</span>
              <span className="text-xs text-slate-400">محاولات غير سحابية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold font-bold ${
              actionMessage.success 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {actionMessage.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{actionMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controller Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Table Filters */}
        <div className="flex bg-slate-900/60 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            الكل ({logs.length})
          </button>
          <button
            onClick={() => setActiveFilter('cases')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === 'cases' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            القضايا ({logs.filter(l => l.type === 'cases').length})
          </button>
          <button
            onClick={() => setActiveFilter('clients')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === 'clients' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            العملاء ({logs.filter(l => l.type === 'clients').length})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleRetrySyncAll}
            disabled={bulkSyncLoading || filteredLogs.length === 0}
            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-l from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-rose-950/20"
          >
            {bulkSyncLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> جاري المزامنة...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> إعادة دفع ومزامنة كافة السجلات
              </>
            )}
          </button>

          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-slate-400" /> تفريغ قائمة الأخطاء
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Failed items list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-rose-500" />
                سجلات المسودات المعلقة للمزامنة
              </h3>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 mx-auto">
                  <Check className="w-6 h-6 text-emerald-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-200">لا توجد مسودات معلقة!</h4>
                  <p className="text-slate-400 text-xs">رائع! جميع عمليات حفظ القضايا والعملاء تمت مزامنتها مع خادم Supabase بشكل سليم.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredLogs.map((log, index) => {
                  const stateVal = syncStatus[index] || 'idle';
                  const isCase = log.type === 'cases';
                  
                  // Extract helpful human label from payload
                  const rowTitle = isCase 
                    ? (log.data?.title || log.data?.caseName || `قضية غير مسمى [رقم ${log.data?.case_number || 'مجهول'}]`)
                    : (log.data?.name || log.data?.phone || 'عميل غير مسمى');

                  return (
                    <div 
                      key={index}
                      className={`p-4 transition hover:bg-slate-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        selectedLog === log ? 'bg-slate-900/70 border-r-2 border-rose-500' : ''
                      }`}
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isCase 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isCase ? 'قضية (Cases)' : 'عميل (Clients)'}
                          </span>
                          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-mono">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(log.timestamp).toLocaleTimeString('ar-SA')} | {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-white truncate max-w-md">
                          {rowTitle}
                        </h4>
                        
                        {log.error && (
                          <div className="text-[10px] text-red-400/90 truncate font-mono max-w-sm">
                            ⚠️ {typeof log.error === 'string' ? log.error : (log.error?.message || log.error?.error_description || 'RLS violation / connectivity error')}
                          </div>
                        )}
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-800 transition flex items-center gap-1.5"
                          title="عرض ملف الـ JSON"
                        >
                          <Eye className="w-3.5 h-3.5" /> استعراض Payload
                        </button>

                        <button
                          onClick={() => handleRetrySyncSingle(index, log)}
                          disabled={stateVal === 'loading'}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition ${
                            stateVal === 'loading'
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : stateVal === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : stateVal === 'failed'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                          }`}
                        >
                          {stateVal === 'loading' ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري المزامنة...
                            </>
                          ) : stateVal === 'success' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> نجح المزامنة
                            </>
                          ) : stateVal === 'failed' ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" /> إعادة الدفع (فشل)
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" /> مزامنة الآن
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-5 py-3.5 bg-slate-950/20 border-t border-slate-800/60 text-[10px] text-slate-400">
              💡 يؤدي المزامنة الناجحة لإزالة السجل تلقائياً من outbox ودفعه لسحابة Supabase.
            </div>
          </div>
        </div>

        {/* Payload Inspector column */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg h-full flex flex-col justify-between">
            <div>
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code className="w-4.5 h-4.5 text-rose-500" />
                  مستعرض حزم البيانات (Payload JSON Viewer)
                </h3>
              </div>

              {selectedLog ? (
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>نوع السجل: {selectedLog.type === 'cases' ? 'قضية جديدة' : 'بيانات عميل'}</span>
                      <span className="font-mono">{selectedLog.action}</span>
                    </div>
                    <div className="text-xs font-bold text-white font-mono break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-left" style={{ direction: 'ltr' }}>
                      {selectedLog.type} {selectedLog.action ? `[${selectedLog.action}]` : ''} - Registered at: {new Date(selectedLog.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">الـ Payload المرسل (JSON):</label>
                    <div className="p-4 bg-slate-950 text-sky-400 text-xs font-mono h-60 overflow-y-auto rounded-xl border border-slate-800 uppercase text-left select-text" style={{ direction: 'ltr' }}>
                      <pre>{JSON.stringify(selectedLog.data, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <label className="text-xs font-bold text-slate-200">الاستجابة والخطأ المسجل (Server Exception):</label>
                    <div className="p-3 bg-red-950/20 border border-red-900/30 text-rose-300 text-xs font-mono rounded-lg text-left overflow-x-auto select-text" style={{ direction: 'ltr' }}>
                      <pre className="whitespace-pre-wrap">{typeof selectedLog.error === 'object' ? JSON.stringify(selectedLog.error, null, 2) : String(selectedLog.error)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 h-96 flex flex-col justify-center items-center gap-3">
                  <Code className="w-12 h-12 text-slate-700" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-300">لم يتم اختيار أي سجل</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs">اضغط على زر "عرض Payload" بجانب السجل المعلق لرؤية تفاصيل وحزمة البيانات ومسببات الرفض.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 bg-slate-900/20">
              <div className="flex items-start gap-4">
                <Server className="w-8 h-8 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-white">إرشادات تفويض الـ RLS 42501</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    فشل العمليات بسبب الـ RLS يعني توجيهات أمنية معطلة في سحابة Supabase. تحقق من صلاحية INSERT/UPDATE لجداول القضايا (cases) والعملاء (clients) من خلال تفعيل صلاحيات المستخدمين النشطين.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
