/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  Database, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Terminal, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  UserCheck,
  Mail
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  is_modification: boolean;
  user_agent: string;
  request_payload: string | null;
  user: string;
}

interface BackupHistory {
  id: string;
  timestamp: string;
  status: string;
  databaseSize: string;
  tablesCount: number;
  destination: string;
  triggeredBy: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [backups, setBackups] = useState<BackupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [resLogs, resBackups] = await Promise.all([
        fetch('/api/audit-logs'),
        fetch('/api/backup/history')
      ]);
      
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data);
      }
      if (resBackups.ok) {
        const data = await resBackups.json();
        setBackups(data);
      }
    } catch (err) {
      console.error('Failed to load audit network details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(true), 5000); // refresh silently every 5s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleTriggerBackup = async () => {
    setBackupRunning(true);
    try {
      const res = await fetch('/api/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'المدير العام (Super Admin)' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBackups(data.history);
          // fetch logs because backup triggered log event!
          fetchLogs(true);
        }
      }
    } catch (err) {
      console.error("Backup runner exception:", err);
    } finally {
      setBackupRunning(false);
    }
  };

  // Filter computations
  const filteredLogs = logs.filter(log => {
    const matchUser = selectedUser === 'all' || log.user === selectedUser;
    const matchMethod = selectedMethod === 'all' || 
                        (selectedMethod === 'MOD' && log.is_modification) ||
                        log.method === selectedMethod;
    const matchQuery = !searchQuery || 
                       log.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (log.request_payload && log.request_payload.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchUser && matchMethod && matchQuery;
  });

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-400 text-blue-950 border border-blue-500';
      case 'POST':
        return 'bg-emerald-400 text-blue-950 border border-emerald-500';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-400 text-blue-950 border border-amber-500';
      case 'DELETE':
        return 'bg-red-400 text-white border border-red-500';
      case 'BACKUP':
        return 'bg-yellow-400 text-blue-950 border border-yellow-500';
      default:
        return 'bg-slate-400 text-blue-950 border border-slate-500';
    }
  };

  return (
    <div className="space-y-6" id="audit-logs-view">
      
      {/* Back Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-700 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px]" />
        <div className="flex items-start gap-6 relative z-10">
          <div className="p-4 bg-yellow-400 text-slate-900 rounded-[2rem] shadow-lg border-2 border-yellow-300">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-black px-3 py-1 rounded-xl border border-yellow-400/30 uppercase tracking-widest">صلاحية المدير العام</span>
              <span className="text-[10px] text-white font-bold tracking-wider">مراقبة الحوكمة المركزية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">سجل التدقيق والمراقبة الأمنية</h1>
            <p className="text-sm text-slate-400 mt-2 font-bold leading-relaxed max-w-2xl text-balance">
              مرصد الإدارة العليا لتتبع حركة النظام التشغيلية. يعكس السجل بصورة فورية الاستعلامات التقنية والتعديلات المطبقة في النظام وقواعد ناجز المزامنة.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-3 self-end md:self-center shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-3xl font-black shadow-lg hover:bg-yellow-400 hover:text-slate-900 transition-all active:scale-95 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            مزامنة السجل
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-yellow-400/50 transition-all shadow-md">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest leading-relaxed">إجمالي<br/>طلبات النظام (API)</span>
            <div className="p-3 bg-slate-800 text-yellow-400 rounded-2xl"><Terminal className="w-5 h-5" /></div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">{logs.length}</div>
          <p className="text-[10px] text-slate-400 font-bold mt-3 relative z-10">كامل المعاملات التقنية المرصودة</p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-400/50 transition-all shadow-md">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-100 rounded-full blur-[40px]" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="text-[10px] text-blue-900 font-black uppercase tracking-widest leading-relaxed">العمليات<br/>التحكمية والتعديل</span>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ShieldAlert className="w-5 h-5" /></div>
          </div>
          <div className="text-4xl font-black text-blue-950 relative z-10">
            {logs.filter(l => l.is_modification).length}

          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-3 relative z-10">عمليات الإضافة، التحديث، وحذف السجلات.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-yellow-400/50 transition-all shadow-md">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest leading-relaxed">بوابة<br/>العملاء النشطة</span>
            <div className="p-3 bg-slate-800 text-yellow-400 rounded-2xl"><Lock className="w-5 h-5" /></div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">100%</div>
          <p className="text-[10px] text-slate-400 font-bold mt-3 relative z-10">نسبة كفاءة بريد الإخطار التلقائي المشفر.</p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] relative flex flex-col justify-between group overflow-hidden shadow-xl hover:border-blue-400/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-[5rem] -mr-8 -mt-8 pointer-events-none transition-colors" />
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-br-2xl">جدولة آلية DAILY</div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start mt-4">
              <span className="text-[10px] text-blue-900 font-black uppercase tracking-widest leading-relaxed">النسخ الاحتياطي<br/>التلقائي السحابي</span>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Database className="w-5 h-5" /></div>
            </div>
            <div className="text-xl font-black text-blue-950 mt-2">
              {backups.length > 0 ? backups[0].databaseSize : 'لا يوجد'}
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-1 font-bold">تمت المزامنة: {backups.length > 0 ? new Date(backups[0].timestamp).toLocaleDateString('ar-SA') : 'معلق'}</p>
          </div>
          
          <button
            onClick={handleTriggerBackup}
            disabled={backupRunning}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-900 text-white font-black text-xs py-4 rounded-xl transition-all hover:bg-slate-800 active:scale-95 shadow-lg"
          >
            <Database className="w-4 h-4" />
            {backupRunning ? 'يتم تصدير النسخة...' : 'أخذ تجميد سحابي الآن'}
          </button>
        </div>
      </div>

      {/* Scheduler Dashboard / Cron Section */}
      <div className="bg-white border border-slate-200 p-8 rounded-[3rem] space-y-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-inner">
               <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">سجل عمليات جدولة النسخ الاحتياطي</h2>
              <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">تتبع تفاصيل التزامات (Automated Backup Logs)</p>
            </div>
          </div>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-4 py-2 font-black rounded-xl">آخر رصد أوتوماتيكي: كل 24 ساعة بموجب العدالة السحابية</span>
        </div>
        
        {backups.length === 0 ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">لا تتوفر أي سجلات للنسخ الاحتياطي حالياً.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {backups.slice(0, 3).map((bk, idx) => (
              <div key={bk.id || idx} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold px-3 py-1 rounded-xl uppercase tracking-widest">
                    اكتمل بنجاح
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    {new Date(bk.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest mb-1">معرف النسخة الآمنة</span>
                  <strong className="text-slate-900 font-mono text-xs font-black block truncate">{bk.id}</strong>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest mb-1">حجم البيانات</span>
                    <strong className="text-slate-900 font-black font-sans">{bk.databaseSize}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest mb-1">جداول محمية</span>
                    <strong className="text-slate-900 font-black font-sans">{bk.tablesCount}</strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 pt-4 flex justify-between items-center bg-slate-100/50 p-3 rounded-xl">
                  <span>المستودع: <span className="font-bold text-slate-900">{bk.destination}</span></span>
                  <span>المنفذ: <span className="font-bold text-slate-900">{bk.triggeredBy}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Logs Board */}
      <div className="bg-blue-950 border border-blue-900 rounded-[3rem] relative overflow-hidden shadow-2xl">
        
        {/* Filters Panel */}
        <div className="p-8 border-b border-white/10 bg-slate-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">المستخدم المنفذ:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-blue-950 text-white text-xs px-6 py-3 rounded-2xl border border-white/10 focus:border-yellow-400 transition-all font-bold outline-none shadow-inner"
              >
                <option value="all">الكل (الهوية المفتوحة)</option>
                <option value="admin">صلاحية المدير 👑</option>
                <option value="system">النظام الآلي 🤖</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">نوع العملية:</span>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="bg-blue-950 text-white text-xs px-6 py-3 rounded-2xl border border-white/10 focus:border-yellow-400 transition-all font-bold outline-none shadow-inner"
              >
                <option value="all">كل الإجراءات التقنية</option>
                <option value="GET">قراءة بيانات (GET)</option>
                <option value="POST">إضافة عناصر (POST)</option>
                <option value="MOD">تعديل وحذف (MOD)</option>
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-yellow-400 transition-colors" />
            <input
              type="text"
              placeholder="البحث العميق في سجلات الجلسات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-blue-950 text-white text-xs pr-14 pl-6 py-4 rounded-2xl border border-white/10 focus:border-yellow-400 focus:ring-[6px] focus:ring-yellow-400/20 transition-all font-bold placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Professional Log Table */}
        {loading ? (
          <div className="p-32 text-center space-y-6">
            <RefreshCw className="w-12 h-12 text-yellow-400 animate-spin mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
            <div className="text-xs text-white font-black tracking-widest uppercase">جاري استيراد سجل الحوكمة التقنية...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-32 text-center space-y-8">
            <div className="w-24 h-24 bg-slate-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto text-yellow-400 shadow-inner">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div className="text-sm font-black text-white">لا توجد سجلات أمنية مطابقة لمعايير البحث.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-900 text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                  <th className="py-6 px-8 border-b border-white/5 whitespace-nowrap">هوية التنفيذ</th>
                  <th className="py-6 px-6 border-b border-white/5 font-mono whitespace-nowrap">STATUS CODE</th>
                  <th className="py-6 px-6 border-b border-white/5 whitespace-nowrap">الإجراء التقني</th>
                  <th className="py-6 px-6 border-b border-white/5 whitespace-nowrap">زمن العملية</th>
                  <th className="py-6 px-6 border-b border-white/5 whitespace-nowrap">المسار (ENDPOINT)</th>
                  <th className="py-6 px-8 border-b border-white/5 text-left whitespace-nowrap">شريط البصمة التشغيلية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[12px] font-bold">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-900 transition-colors text-white">
                        <td className="py-5 px-8 text-yellow-400">{log.user === 'admin' ? 'المدير 👑' : log.user}</td>
                        <td className="py-5 px-6 font-mono font-black">
                          <span className={`px-2 py-1 rounded-lg ${log.status < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono whitespace-nowrap ${getMethodBadgeClass(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-slate-300 text-[11px] font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                        </td>
                        <td className="py-5 px-6 font-mono text-yellow-200 truncate max-w-[200px]">
                          {log.path}
                        </td>
                        <td className="py-5 px-8 text-left">
                          {log.request_payload ? (
                            <button
                               onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                               className="text-yellow-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 ml-0 mr-auto font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
                            >
                              {isExpanded ? 'طي الإفادة' : 'بيانات الحمولة (Payload)'}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px] uppercase tracking-widest">NO_PAYLOAD</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && log.request_payload && (
                        <tr className="bg-slate-900">
                           <td colSpan={6} className="p-0">
                               <div className="p-8 border-t border-b border-yellow-400/20">
                                  <div className="bg-blue-950 border border-yellow-400/30 rounded-[2rem] p-8 shadow-inner relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-bl-full" />
                                     <div className="relative z-10 flex justify-between items-center mb-6">
                                       <span className="text-[10px] font-black text-yellow-400 tracking-widest uppercase">System Metadata Snapshot</span>
                                       <Terminal className="w-4 h-4 text-yellow-400" />
                                     </div>
                                     <pre className="relative z-10 font-mono text-white text-xs overflow-x-auto p-6 bg-slate-900 rounded-[1.5rem] border border-white/10 whitespace-pre-wrap leading-relaxed shadow-sm block direction-ltr text-left">
                                       {JSON.stringify(JSON.parse(log.request_payload), null, 2)}
                                     </pre>
                                  </div>
                               </div>
                           </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-8 bg-slate-900 flex flex-col md:flex-row items-center justify-between text-[10px] font-black tracking-widest border-t border-white/10 text-white">
          <span>{new Date().toISOString().split('T')[0]} - يتم تدوين السجلات أوتوماتيكياً في خوادم الحماية</span>
          <span className="font-mono text-yellow-400 uppercase">SYS_LOGS: {logs.length} PROTECTED ENTRIES</span>
        </div>
      </div>

    </div>
  );
}
