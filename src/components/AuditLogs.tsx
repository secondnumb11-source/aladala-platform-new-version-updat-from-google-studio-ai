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
  Clock, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  Activity,
  CheckCircle,
  HelpCircle
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
        return 'bg-blue-50 text-blue-800 border-blue-200/60';
      case 'POST':
        return 'bg-emerald-50 text-emerald-800 border-emerald-250/60';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-50 text-amber-800 border-amber-250/60';
      case 'DELETE':
        return 'bg-rose-50 text-rose-800 border-rose-200/60';
      case 'BACKUP':
        return 'bg-purple-50 text-purple-800 border-purple-200/60';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200/60';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans p-1 md:p-3" id="audit-logs-view" dir="rtl">
      
      {/* Top Banner - Steel Slate Gradient Header (Same beautiful styling) */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 border border-slate-800 p-8 md:p-10 shadow-xl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
          <ShieldAlert className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-extrabold px-3 py-1 rounded-full border border-yellow-400/30 uppercase tracking-widest">
                صلاحية المدير العام
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-full border border-slate-700">
                حوكمة تشغيلية أمنية
              </span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-black text-white tracking-tight leading-tight animate-fade-in">
              سجل التدقيق والمراقبة الأمنية (System Logs & Audit)
            </h1>
            <p className="text-slate-300 max-w-2xl text-xs md:text-sm font-medium leading-relaxed">
              مرصد الحماية وتتبع سجل النظام وحركته التشغيلية. يعكس السجل بصورة فورية وتلقائية كافة العمليات المطبقة والنفاذ لبوابة الموظفين والعملاء.
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-950 px-7 py-4 rounded-xl font-black shadow-md transition-all active:scale-95 text-xs shrink-0 cursor-pointer border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 text-slate-900 ${refreshing ? 'animate-spin' : ''}`} />
            <span>مزامنة وتحديث فوري</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid - Perfect, Uniform Light Cards with Great Spacing and High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl relative overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">إجمالي طلبات النظام</span>
              <h4 className="text-xs text-slate-400 font-bold">API Transactions Logs</h4>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-100 text-slate-800 rounded-xl">
              <Terminal className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">{logs.length}</div>
          <p className="text-[10px] text-slate-500 font-bold mt-2 pt-2 border-t border-slate-100">كامل المدخلات ومحاولات التحصيل المرصودة</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl relative overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">التعديل ومنشئ السجلات</span>
              <h4 className="text-xs text-slate-400 font-bold">Control & Modifications</h4>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
            {logs.filter(l => l.is_modification).length}
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-2 pt-2 border-t border-slate-100 font-sans">عمليات الإضافة، تعديل أو حذف السجلات</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl relative overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">أمان وسلامة الإخطارات</span>
              <h4 className="text-xs text-slate-400 font-bold">Security Authenticity</h4>
            </div>
            <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-900 rounded-xl">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-900 font-mono tracking-tight">100%</div>
          <p className="text-[10px] text-slate-500 font-bold mt-2 pt-2 border-t border-slate-100">برشام تشفير الجلسات والإخطار التلقائي</p>
        </div>

        {/* Card 4 - Backup Action integrated perfectly */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl relative overflow-hidden shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">نسخ احتياطي فوري</span>
                <h4 className="text-xs text-slate-400 font-bold">Encrypted Backup Cloud</h4>
              </div>
              <div className="p-2.5 bg-purple-50 border border-purple-100 text-purple-900 rounded-xl">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {backups.length > 0 ? backups[0].databaseSize : 'قيد الانتظار'}
            </div>
            <p className="text-[10px] text-slate-500 font-bold truncate mt-1">آخر تجميد سحابي: {backups.length > 0 ? new Date(backups[0].timestamp).toLocaleDateString('ar-SA') : 'معلق'}</p>
          </div>
          
          <button
            onClick={handleTriggerBackup}
            disabled={backupRunning}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] py-3 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-45"
          >
            <Database className="w-3.5 h-3.5 text-yellow-400" />
            <span>{backupRunning ? 'يتم سحب النسخة...' : 'أخذ تجميد سحابي الآن'}</span>
          </button>
        </div>
      </div>

      {/* Scheduler Dashboard Backup History logs */}
      <div className="bg-white border border-slate-200/80 p-8 rounded-[2rem] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
          <div className="flex items-center gap-4.5">
            <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900">
              <Database className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">سجل عمليات جدولة النسخ الاحتياطي السحابي</h2>
              <p className="text-xs text-slate-500 font-bold mt-0.5">تفاصيل ومطابقة الكتل السحابية المؤرشفة تلقائياً (Automated backups)</p>
            </div>
          </div>
          <span className="text-[10px] text-blue-800 bg-blue-100/50 border border-blue-200/50 px-4 py-1.5 font-black rounded-full">
            مجدول آلياً: كل 24 ساعة بموجب حماية كفاءة العدالة
          </span>
        </div>
        
        {backups.length === 0 ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            لا تتوفر أي سجلات للنسخ الاحتياطي حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {backups.slice(0, 3).map((bk, idx) => (
              <div key={bk.id || idx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3.5 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] bg-emerald-50 border border-emerald-250/50 text-emerald-800 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    اكتمل بنجاح
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-black flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(bk.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">رمز الكتلة السحابية الآمنة</span>
                  <strong className="text-slate-900 font-mono text-xs font-black block truncate">{bk.id}</strong>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">حجم البيانات</span>
                    <strong className="text-slate-900 font-black">{bk.databaseSize}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">جداول مفحوصة</span>
                    <strong className="text-slate-900 font-black">{bk.tablesCount} جدول</strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 pt-3 flex justify-between items-center bg-slate-200/40 p-3 rounded-xl">
                  <span>المستودع: <span className="font-extrabold text-slate-900">{bk.destination}</span></span>
                  <span>المنفذ: <span className="font-extrabold text-slate-900">{bk.triggeredBy}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Logs Table and Filters Board - Unified Perfect Visual Identity */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden">
        
        {/* Superior Filters Row with crisp titles */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-800 font-black uppercase tracking-wider">المستخدم المنفذ:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-white hover:bg-slate-50 text-slate-900 text-xs px-4 py-3 rounded-xl border border-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">الكل (الهوية المفتوحة)</option>
                <option value="admin">صلاحية المدير 👑</option>
                <option value="system">النظام الآلي 🤖</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-800 font-black uppercase tracking-wider">نوع العملية:</span>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="bg-white hover:bg-slate-50 text-slate-900 text-xs px-4 py-3 rounded-xl border border-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">كل الإجراءات التقنية</option>
                <option value="GET">قراءة واستعلام (GET)</option>
                <option value="POST">إضافة عناصر (POST)</option>
                <option value="MOD">تعديل وحذف (MOD)</option>
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="البحث العميق في سجلات الجلسات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-900 text-xs pr-11 pl-4 py-3.5 rounded-xl border border-slate-200 focus:border-slate-800 transition-all font-bold placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <div className="p-20 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-slate-900 animate-spin mx-auto" />
            <div className="text-xs text-slate-500 font-black tracking-widest uppercase">جاري استيراد وتحديث منصة الحوكمة...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center space-y-5">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <ShieldAlert className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-xs font-black text-slate-500">لا توجد أي سجلات أمنية مطابقة لمعايير التصفية الحالية.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-200">
                  <th className="py-5 px-6 whitespace-nowrap">اسم المنفذ</th>
                  <th className="py-5 px-6 font-mono whitespace-nowrap">رمز الحالة (STATUS)</th>
                  <th className="py-5 px-6 whitespace-nowrap">الإجراء التقني</th>
                  <th className="py-5 px-6 whitespace-nowrap">زمن العملية</th>
                  <th className="py-5 px-6 whitespace-nowrap">البوابة / مسار الفحص</th>
                  <th className="py-5 px-6 text-left whitespace-nowrap">بيانات الجلسة (Payload)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900 font-bold text-xs md:text-sm">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors text-slate-900">
                        <td className="py-4 px-6 text-slate-900 font-extrabold">{log.user === 'admin' ? 'المدير العام 👑' : log.user}</td>
                        <td className="py-4 px-6 font-mono font-black">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${log.status < 300 ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' : 'bg-rose-50 text-rose-800 border-rose-250/50'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono leading-none ${getMethodBadgeClass(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-xs font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-700 text-xs truncate max-w-[240px]">
                          {log.path}
                        </td>
                        <td className="py-4 px-6 text-left">
                          {log.request_payload ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-slate-900 hover:text-white transition-all bg-slate-50 hover:bg-slate-900 border border-slate-200/60 px-3.5 py-2 rounded-xl flex items-center gap-1.5 ml-0 mr-auto font-black text-[10px] uppercase tracking-wider whitespace-nowrap cursor-pointer"
                            >
                              <span>{isExpanded ? 'طي الإفادة' : 'بيانات الحمولة (Payload)'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] uppercase tracking-widest pl-4">بدون محتوى</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && log.request_payload && (
                        <tr className="bg-slate-50/60">
                           <td colSpan={6} className="p-0">
                               <div className="p-6 md:p-8 border-t border-b border-slate-200/60">
                                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                                     <div className="relative z-10 flex justify-between items-center mb-4">
                                       <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
                                         <Terminal className="w-3.5 h-3.5 text-emerald-400" /> SYSTEM_METADATA_SNAPSHOT
                                       </span>
                                       <span className="w-2 h-2 rounded-full bg-blue-500" />
                                     </div>
                                     <pre className="relative z-10 font-mono text-emerald-400 text-xs overflow-x-auto p-5 bg-slate-900/90 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner block direction-ltr text-left">
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

        {/* Table footer info */}
        <div className="p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-[10px] font-black tracking-widest border-t border-slate-200 text-slate-500 gap-3">
          <span>{new Date().toISOString().split('T')[0]} - المراقبة التقنية نشطة ويتم تدوين العمليات فورياً لمطابقة المعايير العامة</span>
          <span className="font-mono text-slate-700 uppercase bg-slate-200/60 px-3 py-1.5 rounded-md">SYS_LOGS: {logs.length} SECURE RECORDS</span>
        </div>
      </div>

    </div>
  );
}
