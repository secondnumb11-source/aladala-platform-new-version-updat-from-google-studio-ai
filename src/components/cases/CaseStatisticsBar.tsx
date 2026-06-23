import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Scale, Gavel, Archive, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface CaseStatisticsBarProps {
  casesTrigger?: any; // To allow external reload trigger
  onCountsCalculated?: (counts: { pending: number; judged: number; closed: number; total: number }) => void;
}

export default function CaseStatisticsBar({ casesTrigger, onCountsCalculated }: CaseStatisticsBarProps) {
  const [counts, setCounts] = useState({
    pending: 0,
    judged: 0,
    closed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealTimeStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Perform a direct Supabase query to get the live state of all cases in the db
      const { data, error: queryError } = await supabase
        .from('cases')
        .select('id, status, archived');

      if (queryError) {
        throw queryError;
      }

      if (data) {
        let pending = 0;
        let judged = 0;
        let closed = 0;

        // Pending/Active status keys mapping
        const pendingStatusList = [
          'active', 'under_study', 'pending', 'pending_session', 
          'new', 'under_review', 'postponed'
        ];

        // Judged/Adjudicated status keys mapping
        const judgedStatusList = [
          'judgment_issued', 'final_judgment', 'primary_judgment', 
          'appeal', 'execution'
        ];

        // Closed status keys mapping
        const closedStatusList = [
          'closed', 'struck_off'
        ];

        data.forEach((item: any) => {
          // If explicitly archived in system metadata, we group it under Closed
          if (item.archived === true) {
            closed++;
          } else {
            const statusLower = (item.status || '').toLowerCase();
            if (judgedStatusList.includes(statusLower)) {
              judged++;
            } else if (closedStatusList.includes(statusLower)) {
              closed++;
            } else if (pendingStatusList.includes(statusLower) || !statusLower) {
              pending++;
            } else {
              pending++; // Default fallback for newly inserted/unspecified cases
            }
          }
        });

        const newCounts = {
          pending,
          judged,
          closed,
          total: data.length
        };

        setCounts(newCounts);
        if (onCountsCalculated) {
          onCountsCalculated(newCounts);
        }
      }
    } catch (err: any) {
      console.error('❌ Error fetching direct Supabase statistics:', err);
      setError(err?.message || 'فشل الاتصال بـ Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeStats();

    // Listen to real-time additions/modifications/deletions on 'cases' table via postgres_changes
    const casesChannel = supabase
      .channel('realtime-stats-bar-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        () => {
          console.log('🔄 Live refresh: cases table modified, updating stats bar...');
          fetchRealTimeStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(casesChannel);
    };
  }, [casesTrigger]);

  return (
    <div id="case-statistics-bar-container" className="w-full mb-8 font-sans" dir="rtl">
      {/* Decorative Title Area */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></div>
          <h2 className="text-sm font-black text-slate-800 dark:text-amber-100 flex items-center gap-2">
            مؤشرات الأداء القضائي اللحظية
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
              متصل بـ Supabase
            </span>
          </h2>
        </div>
        
        <button
          onClick={fetchRealTimeStats}
          disabled={loading}
          className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-50 hover:bg-amber-50 px-3 py-1.5 rounded-xl border border-slate-200"
          title="تحديث البيانات يدوياً"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          <span className="hidden sm:inline">مزامنة يدوية</span>
        </button>
      </div>

      {loading && counts.total === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900 border border-slate-850 rounded-[2rem] p-6 animate-pulse h-28 flex items-center justify-between">
              <div className="space-y-3 w-2/3">
                <div className="h-3 bg-slate-800 rounded-full w-1/2"></div>
                <div className="h-6 bg-slate-800 rounded-full w-1/3"></div>
              </div>
              <div className="w-12 h-12 bg-slate-800 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-5 text-right font-bold text-rose-800 text-xs flex justify-between items-center">
          <span>⚠️ {error} - فشل في جلب الإحصائيات مباشرة من قاعدة البيانات.</span>
          <button 
            onClick={fetchRealTimeStats} 
            className="bg-rose-100 hover:bg-rose-200 transition-colors px-4 py-1.5 rounded-xl text-rose-950"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Pending */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-slate-900 border border-amber-500/30 rounded-[2rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-amber-400/60 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
            <div className="space-y-1 relative z-10 text-right">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block font-sans">
                الدعاوى قيد النظر (Pending)
              </span>
              <h3 className="text-3xl font-mono font-black text-white leading-none">
                {counts.pending} <span className="text-xs text-slate-400 font-sans">ملف</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">بانتظار المرافعة أو سحب المواعيد</p>
            </div>
            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-lg relative z-10 transition-transform group-hover:rotate-12 duration-300">
              <Scale className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 2: Judged */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-slate-900 border border-emerald-500/30 rounded-[2rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-emerald-400/60 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="space-y-1 relative z-10 text-right">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block font-sans">
                الدعاوى المحكومة (Judged)
              </span>
              <h3 className="text-3xl font-mono font-black text-white leading-none">
                {counts.judged} <span className="text-xs text-slate-400 font-sans">حكم</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">صدرت فيها أحكام وصكوك إلكترونية</p>
            </div>
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-lg relative z-10 transition-transform group-hover:-rotate-12 duration-300">
              <Gavel className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 3: Closed */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-slate-900 border border-[#FF7F00]/30 rounded-[2rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#FF7F00]/60 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF7F00]/5 rounded-full blur-2xl group-hover:bg-[#FF7F00]/10 transition-all"></div>
            <div className="space-y-1 relative z-10 text-right">
              <span className="text-[10px] font-black text-[#FF7F00] uppercase tracking-widest block font-sans">
                المنتهية والمؤرشفة (Closed)
              </span>
              <h3 className="text-3xl font-mono font-black text-white leading-none">
                {counts.closed} <span className="text-xs text-slate-400 font-sans">قضية</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">دعاوى مغلقة منتهية أو مشطوبة نهائياً</p>
            </div>
            <div className="p-4 bg-[#FF7F00]/15 text-[#FF7F00] rounded-2xl border border-[#FF7F00]/25 shadow-lg relative z-10 transition-transform group-hover:scale-110 duration-300">
              <Archive className="w-5 h-5" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
