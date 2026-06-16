/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, RefreshCw, Eye, EyeOff, Search, Database, HardDrive, ShieldAlert, Award } from 'lucide-react';

interface FailedLog {
  timestamp: string;
  table: string;
  action: string;
  data: any;
  error?: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } & any;
}

export default function PersistentErrorLogger() {
  const [logs, setLogs] = useState<FailedLog[]>([]);
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);
  const [filterTable, setFilterTable] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadLogs = () => {
    try {
      const stored = localStorage.getItem('failed_persistence_logs');
      if (stored) {
        const parsed: FailedLog[] = JSON.parse(stored);
        // Sort descending by timestamp
        parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(parsed);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error("Error reading failed_persistence_logs:", e);
      setLogs([]);
    }
  };

  useEffect(() => {
    loadLogs();
    // Re-load logs when custom persistence events trigger
    window.addEventListener('adalah_error_logged', loadLogs);
    return () => {
      window.removeEventListener('adalah_error_logged', loadLogs);
    };
  }, []);

  const clearLogs = () => {
    if (confirm("هل أنت متأكد من رغبتك في مسح كافة سجلات أخطاء المزامنة السحابية؟")) {
      localStorage.removeItem('failed_persistence_logs');
      setLogs([]);
      setExpandedLogIndex(null);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchTable = filterTable === 'all' || log.table === filterTable;
    const jsonStr = JSON.stringify(log).toLowerCase();
    const matchSearch = searchQuery === '' || jsonStr.includes(searchQuery.toLowerCase());
    return matchTable && matchSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              لوحة مراقبة أخطاء المزامنة (Sync Debug)
              <span className="text-xs bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                قناة التشخيص والـ RLS
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              تسجيل وتحليل كافة العمليات المعلقة التي فشلت في إرسالها إلى Supabase بسبب جدار الحماية (RLS) أو مخالفة المخطط.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" /> تحديث السجل
          </button>
          
          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="p-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/40 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" /> تفريغ السجل ({logs.length})
          </button>
        </div>
      </div>

      {/* RLS Policy Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
          <Database className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-indigo-300">أكثر الجداول تأثراً</h4>
            <p className="text-lg font-black mt-1">
              {logs.length > 0 ? (
                (() => {
                  const counts: Record<string, number> = {};
                  logs.forEach(l => { counts[l.table] = (counts[l.table] || 0) + 1; });
                  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                  return `${sorted[0][0]} (${sorted[0][1]} أخطاء)`;
                })()
              ) : 'لا يوجد'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-300">مخالفات سياسة RLS النشطة</h4>
            <p className="text-lg font-black mt-1 text-amber-400 font-mono">
              {logs.filter(l => l.error?.code === '42501' || JSON.stringify(l).includes('42501')).length} عمليات محظورة
            </p>
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
          <HardDrive className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-300 font-mono">حالة مسودات المتصفح المحلية</h4>
            <p className="text-lg font-black mt-1 text-emerald-400">
              {logs.length > 0 ? 'مخزنة احتياطياً ومحمية' : 'خالية تماماً'}
            </p>
          </div>
        </div>
      </div>

      {/* Control Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في محتوى السجلات أو رسائل الخطأ أو البيانات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        <select
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-red-500/50 transition-colors"
        >
          <option value="all">كل الجداول</option>
          <option value="cases">جدول القضايا (cases)</option>
          <option value="clients">جدول العملاء (clients)</option>
          <option value="tasks">جدول المهام (tasks)</option>
        </select>
      </div>

      {/* Logs View Box */}
      {filteredLogs.length === 0 ? (
        <div className="bg-slate-950/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
          <p className="text-sm font-bold">لا توجد سجلات أخطاء مطابقة للمرشح نشطة حالياً</p>
          <p className="text-xs text-slate-600 mt-1">كافة عمليات المزامنة والتعديلات تجري بشكل سليم في السحاب</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 pb-1 font-bold">
            عرض {filteredLogs.length} سجلات أخطاء مرتبة من الأحدث إلى الأقدم:
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredLogs.map((log, index) => {
              const isExpanded = expandedLogIndex === index;
              const hasRlsViolation = log.error?.code === '42501' || JSON.stringify(log).includes('42501');
              const isValidation = log.error?.code === 'local_validation_error';

              return (
                <div
                  key={index}
                  className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                    isExpanded 
                      ? 'bg-slate-950 border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedLogIndex(isExpanded ? null : index)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wider shrink-0 select-none ${
                        isValidation
                          ? 'bg-purple-950 text-purple-400 border border-purple-900'
                          : hasRlsViolation
                            ? 'bg-red-950 text-red-400 border border-red-900'
                            : 'bg-amber-950 text-amber-400 border border-amber-900'
                      }`}>
                        {isValidation ? 'Validation' : hasRlsViolation ? 'RLS Policy Code: 42501' : 'Database Error'}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-tight">
                            {log.table} •
                          </span>
                          <span className="text-xs font-black text-slate-100 font-mono">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[280px] sm:max-w-md">
                          {log.error?.message || log.error || 'عطل مجهول أو غير مسجل بالتفصيل'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                      </span>
                      {isExpanded ? (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Inspector Panel */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-4 text-xs animate-in slide-in-from-top duration-250">
                      {/* Grid for details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Error info */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            تفاصيل استجابة خادم السحابة:
                          </h4>
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1.5 font-mono text-slate-200">
                            <div>
                              <span className="text-slate-500">رمز الخطأ (Code):</span>{' '}
                              <span className="text-red-400 font-bold">{log.error?.code || 'unknown'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">الرسالة (Message):</span>{' '}
                              <span className="text-slate-300">{log.error?.message || 'لا توجد رسالة مباشرة من الخادم'}</span>
                            </div>
                            {log.error?.details && (
                              <div>
                                <span className="text-slate-500">التفاصيل (Details):</span>{' '}
                                <span className="text-slate-400">{log.error.details}</span>
                              </div>
                            )}
                            {log.error?.hint && (
                              <div>
                                <span className="text-slate-500">تلميحات (Hint):</span>{' '}
                                <span className="text-slate-400 text-yellow-500/80">{log.error.hint}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payload log */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            البيانات المرسلة والـ Payload:
                          </h4>
                          <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono overflow-auto max-h-[160px] text-indigo-200 ltr-scroll text-left" dir="ltr">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Diagnostic Hint Banner */}
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3 text-[11px] text-slate-300">
                        <span>
                          {hasRlsViolation ? (
                            <strong>توجيه الـ RLS 👑:</strong>
                          ) : (
                            <strong>توجيه المخطط 📚:</strong>
                          )}{' '}
                          {hasRlsViolation 
                            ? 'تم رفض هذه العملية لأن سياسة row-level security تمنع التعديل على هذا الصف خارج قيود المالك (Owner) أو شريك الإدارة في لوحة النظام.'
                            : 'يرجى مراجعة الحقول الإلزامية التي تم إقرانها وضمان مطابقة البيانات مع حقول قواعد البيانات السحابية.'
                          }
                        </span>
                        
                        <span className="text-slate-500 font-mono text-[10px] shrink-0">
                          Timestamp: {log.timestamp}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
