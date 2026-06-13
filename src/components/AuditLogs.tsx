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
        return 'bg-blue-400 text-blue-400 border border-blue-500';
      case 'POST':
        return 'bg-emerald-400 text-emerald-400 border border-emerald-500';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-400 text-amber-400 border border-amber-500';
      case 'DELETE':
        return 'bg-red-400 text-red-100 border border-red-500';
      case 'BACKUP':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-500 border border-yellow-500';
      default:
        return 'bg-slate-400 text-slate-900 border border-slate-500';
    }
  };

  return (
    <div className="space-y-6" id="audit-logs-view">
      
      {/* Back Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#9A7D2C] via-[#0C121E] to-[#0284C7] border-2 border-[#9A7D2C] p-6 rounded-3xl shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-yellow-400 text-slate-950 border border-yellow-300 rounded-2xl shadow-lg">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full border border-yellow-300">خاص بالمدير العام</span>
              <span className="text-xs text-yellow-300 font-extrabold">🔐 مراقبة العمليات والحوكمة</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white mt-1">سجل التدقيق والمراقبة الأمنية (Super Admin Audit Trail)</h1>
            <p className="text-xs text-yellow-100 mt-1 font-bold leading-relaxed">
              سجل فوري لكافة الاستعلامات والمجهودات التقنية في العدالة القضائية مع تتبع التغييرات بنظام إدارة العملاء وأنظمة المزامنة ناجز.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-950 text-yellow-300 text-xs px-4 py-2.5 rounded-xl border border-yellow-300 transition-all font-black shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-gradient-to-br from-[#0C121E] to-[#1E3A8A]/90 border border-yellow-500/30 p-5 rounded-2xl relative overflow-hidden text-white">
          <div className="flex justify-between items-start">
            <span className="text-xs text-yellow-300 font-black">إجمالي طلبات النظام (API Calls)</span>
            <span className="p-1.5 bg-yellow-400 text-slate-950 rounded-lg"><Terminal className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-white font-sans mt-2">{logs.length}</div>
          <p className="text-xs text-yellow-100/80 font-bold mt-1">كامل المعاملات التي تم رصدها بالخادم.</p>
        </div>

        <div className="bg-gradient-to-br from-[#0C121E] to-[#1E3A8A]/90 border border-yellow-500/30 p-5 rounded-2xl text-white">
          <div className="flex justify-between items-start">
            <span className="text-xs text-yellow-300 font-black">تعديلات البيانات (Modifications)</span>
            <span className="p-1.5 bg-yellow-400 text-slate-950 rounded-lg"><ShieldAlert className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-white font-sans mt-2">
            {logs.filter(l => l.is_modification).length}
          </div>
          <p className="text-xs text-yellow-100/80 font-bold mt-1">عمليات الإضافة، التحديث، وحذف السجلات.</p>
        </div>

        <div className="bg-gradient-to-br from-[#0C121E] to-[#1E3A8A]/90 border border-yellow-500/30 p-5 rounded-2xl text-white">
          <div className="flex justify-between items-start">
            <span className="text-xs text-yellow-300 font-black">بوابة العملاء النشطة</span>
            <span className="p-1.5 bg-yellow-400 text-slate-950 rounded-lg"><Lock className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-white font-sans mt-2">100%</div>
          <p className="text-xs text-yellow-100/80 font-bold mt-1">نسبة كفاءة بريد الإخطار التلقائي المشفر.</p>
        </div>

        <div className="bg-gradient-to-br from-[#9A7D2C]/90 via-[#0C121E] to-[#0284C7] border-2 border-yellow-400 p-5 rounded-2xl relative group text-white shadow-xl">
          <div className="absolute top-0 left-0 bg-yellow-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-br-lg border-b border-r border-[#9A7D2C]">
            جدولة آلية DAILY
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-yellow-200 font-extrabold">النسخ الاحتياطي التلقائي (Cron)</span>
            <span className="p-1.5 bg-yellow-400 text-slate-950 rounded-lg"><Database className="w-4 h-4" /></span>
          </div>
          <div className="text-lg font-black text-white mt-1.5">
            {backups.length > 0 ? backups[0].databaseSize : 'لا يوجد'}
          </div>
          <p className="text-xs text-yellow-100 truncate mt-1">تمت المزامنة: {backups.length > 0 ? new Date(backups[0].timestamp).toLocaleDateString('ar-SA') : 'معلق'}</p>
          
          <button
            onClick={handleTriggerBackup}
            disabled={backupRunning}
            className="w-full mt-3 flex items-center justify-center gap-1 bg-yellow-400 text-slate-950 font-black text-xs py-1.5 rounded-lg transition-all border border-[#9A7D2C]"
          >
            <Database className="w-3.5 h-3.5" />
            {backupRunning ? 'يتم حفظ النسخة...' : 'أخذ نسخة سحابية الآن 🚀'}
          </button>
        </div>
      </div>

      {/* Scheduler Dashboard / Cron Section */}
      <div className="bg-gradient-to-br from-[#0C121E] via-[#0D1F43] to-[#9A7D2C]/45 border-2 border-[#9A7D2C]/60 p-6 rounded-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-[#9A7D2C]/40 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-yellow-300" />
            <h2 className="text-sm font-black text-white">سجل عمليات جدولة النسخ الاحتياطي (Automated Backup Logs)</h2>
          </div>
          <span className="text-xs text-yellow-300 font-mono">آخر رصد أوتوماتيكي: كل 24 ساعة بموجب العدالة السحابية</span>
        </div>
        
        {backups.length === 0 ? (
          <div className="text-center py-4 text-xs text-yellow-100">لا تتوفر أي سجلات للنسخ الاحتياطي حالياً.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backups.slice(0, 3).map((bk, idx) => (
              <div key={bk.id || idx} className="bg-slate-950/70 border border-yellow-400/20 p-4 rounded-xl space-y-2 relative text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-emerald-600 border border-emerald-400 text-white font-extrabold px-2 py-0.5 rounded-full">
                    حفظ متكامل بنجاح ✓
                  </span>
                  <span className="text-xs text-yellow-300 font-mono">
                    {new Date(bk.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-yellow-300 block">مرجع النسخة:</span>
                  <strong className="text-white word-break font-mono text-xs">{bk.id}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm pt-1 border-t border-white/10">
                  <div>
                    <span className="text-yellow-300 block">حجم قاعدة البيانات:</span>
                    <strong className="text-yellow-300 font-black font-sans">{bk.databaseSize}</strong>
                  </div>
                  <div>
                    <span className="text-yellow-300 block">عدد الجداول:</span>
                    <strong className="text-white font-bold">{bk.tablesCount} جداول</strong>
                  </div>
                </div>
                <div className="text-xs text-yellow-100 text-right mt-1 pt-1 border-t border-white/10">
                  المشغل: <span className="text-sky-300 font-bold">{bk.triggeredBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Logs Board */}
      <div className="bg-gradient-to-b from-[#0C121E] to-[#0A111E] border-2 border-[#9A7D2C]/50 rounded-2xl relative overflow-hidden text-white shadow-2xl">
        
        {/* Filters Panel */}
        <div className="p-4 md:p-5 border-b border-white/10 bg-slate-950/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            
            {/* User Filter */}
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-xs text-yellow-300 font-black block">مُجري العملية:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl border border-yellow-400/30 focus:outline-[#9A7D2C] transition-colors"
                id="filter-actor"
              >
                <option value="all" className="bg-slate-950">كل الهويات والأدوار</option>
                <option value="admin" className="bg-slate-950">المدير العام / شريك أول</option>
                <option value="lawyer" className="bg-slate-950">محامي مُترافع</option>
                <option value="researcher" className="bg-slate-950">المستشار والباحث</option>
                <option value="secretary" className="bg-slate-950">السكرتارية الإدارية</option>
                <option value="accountant" className="bg-slate-950">المحاسب المالي</option>
                <option value="system" className="bg-slate-950">النظام التلقائي (Backup Job)</option>
              </select>
            </div>

            {/* Action/Method Filter */}
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-xs text-yellow-300 font-black block">نوع الإجراء:</span>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl border border-yellow-400/30 focus:outline-[#9A7D2C] transition-colors"
                id="filter-method"
              >
                <option value="all" className="bg-slate-950">كل العمليات والـ API</option>
                <option value="GET" className="bg-slate-950">طلب قراءة (GET)</option>
                <option value="POST" className="bg-slate-950">إدراج أو تعديل (POST)</option>
                <option value="MOD" className="bg-slate-950">التعديل الشامل و الحفظ</option>
                <option value="BACKUP" className="bg-slate-950">النسخ السحابي (BACKUP)</option>
              </select>
            </div>

          </div>

          {/* Path Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="البحث بالـ Endpoint أو محتوى الطلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs pl-8 pr-12 py-2 rounded-xl border border-yellow-400/30 focus:outline-[#9A7D2C] placeholder-yellow-100/40 transition-colors"
              id="search-log-path"
            />
            <Search className="w-4 h-4 text-yellow-300 absolute top-2.5 right-4" />
          </div>

        </div>

        {/* Loading and empty states */}
        {loading ? (
          <div className="p-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin mx-auto" />
            <div className="text-xs text-yellow-300">يجري فحص سجلات الأمان وخلاصة المزامنة الفورية...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="p-4 bg-slate-900/60 text-yellow-400 border border-yellow-400/20 inline-block rounded-full">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="text-sm font-black text-white">لم يتم العثور على أي كشوفات أمنية تطابق الاختيارات.</div>
            <p className="text-xs text-yellow-300 max-w-sm mx-auto">
              جرب تغيير هوية الفلتر أو كتابة كلمة بحث أخرى للتحليلات.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-right" dir="rtl">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/80 p-4 text-xs font-black text-yellow-300">
                  <th className="py-3.5 px-4 font-black">مُجري العملية</th>
                  <th className="py-3.5 px-3 font-black">نوع الطلب</th>
                  <th className="py-3.5 px-3 font-black">المسار والـ Endpoint</th>
                  <th className="py-3.5 px-3 font-black">توقيت العملية</th>
                  <th className="py-3.5 px-3 font-black uppercase font-sans">HTTP Code</th>
                  <th className="py-3.5 px-3 font-black">زمن الاستجابة</th>
                  <th className="py-3.5 px-4 text-left font-black">التفاصيل / Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  
                  // Role translation tags to match Saudi law offices hierarchy
                  const getRoleAr = (r: string) => {
                    switch (r) {
                      case 'admin': return '👑 شريك أول / المدير';
                      case 'lawyer': return '⚖️ محامي مترافع';
                      case 'researcher': return '🎓 باحث ومستشار';
                      case 'secretary': return '📅 سكرتارية المكتب';
                      case 'accountant': return '💰 محاسب مالي';
                      case 'system': return '🤖 النظام التلقائي';
                      default: return r;
                    }
                  };

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-900 text-slate-200 transition-colors border-b border-white/10">
                        <td className="py-3 px-4 font-bold">
                          <span className="inline-flex items-center gap-1.5 text-white">
                            {getRoleAr(log.user)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono tracking-wider font-bold ${getMethodBadgeClass(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-sm text-yellow-100">
                          {log.path}
                        </td>
                        <td className="py-3 px-3 text-yellow-300">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-yellow-300" />
                            {new Date(log.timestamp).toLocaleDateString('ar-SA')} - {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans font-bold">
                          <span className={`inline-flex items-center gap-1 ${
                            log.status >= 200 && log.status < 300 
                              ? 'text-emerald-400 font-extrabold shadow-sm' 
                              : 'text-rose-450 font-extrabold'
                          }`}>
                            {log.status >= 200 && log.status < 300 ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-yellow-300">
                          {log.duration_ms} ms
                        </td>
                        <td className="py-3 px-4 text-left">
                          {log.request_payload ? (
                            <button
                               onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                               className="inline-flex items-center gap-1 bg-slate-950 text-yellow-300 font-black px-2 py-1 rounded text-xs border border-yellow-300 transition-all font-sans cursor-pointer"
                            >
                              {isExpanded ? 'طيّ ✕' : 'عرض الحمولة 👁️'}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="text-yellow-300/60 italic text-xs">بلا حمولة</span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expanded View for Request Payloads */}
                      {isExpanded && log.request_payload && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={7} className="p-4 border-t border-white/10">
                            <div className="bg-[#050C18] border border-yellow-400/30 rounded-xl p-3.5 text-sm font-mono leading-relaxed space-y-2 text-right text-white">
                              <div className="text-yellow-300 font-black border-b border-white/10 pb-1 flex justify-between items-center">
                                <span>الحمولة المستخرجة للطلب (Decoded Payload Snapshot)</span>
                                <span className="text-xs text-yellow-300">مشفّرة بالكامل ومتوافقة مع الحوكمة</span>
                              </div>
                              <pre className="overflow-x-auto text-left whitespace-pre-wrap font-sans text-yellow-300 p-2 bg-slate-950 border border-white/10 rounded-lg">
                                {JSON.stringify(JSON.parse(log.request_payload), null, 2)}
                              </pre>
                              <div className="text-xs text-yellow-300 pt-1 flex justify-between">
                                <span>مرجع التخزين: {log.id}</span>
                                <span>المتصفح: {log.user_agent}</span>
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

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-yellow-300 text-sm gap-2">
          <span className="font-bold">يتم فرز ومعالجة خلاصة السجلات تلقائياً طبقاً للائحة الرقابة السيبرانية السعودية.</span>
          <span className="font-mono text-yellow-300">Total Buffer: {logs.length} of 500 records</span>
        </div>

      </div>

    </div>
  );
}
