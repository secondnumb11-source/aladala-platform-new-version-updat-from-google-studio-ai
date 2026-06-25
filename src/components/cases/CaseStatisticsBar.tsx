import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Scale, Gavel, Archive, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface CaseStatisticsBarProps {
  casesTrigger?: any; // To allow external reload trigger
  onCountsCalculated?: (counts: { pending: number; scheduled: number; closed: number; total: number }) => void;
}

export default function CaseStatisticsBar({ casesTrigger, onCountsCalculated }: CaseStatisticsBarProps) {
  const [counts, setCounts] = useState({
    pending: 0,
    scheduled: 0,
    closed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealTimeStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Perform a direct Supabase query
      const { data, error: queryError } = await supabase
        .from('cases')
        .select('id, status, archived, nextSessionDate');

      if (queryError) throw queryError;

      if (data) {
        let pending = 0;
        let scheduled = 0;
        let closed = 0;

        const pendingStatusList = ['active', 'under_study', 'pending', 'pending_session', 'new', 'under_review', 'postponed'];
        const closedStatusList = ['closed', 'struck_off'];

        data.forEach((item: any) => {
          if (item.nextSessionDate) scheduled++;
          
          if (item.archived === true) {
            closed++;
          } else {
            const statusLower = (item.status || '').toLowerCase();
            if (closedStatusList.includes(statusLower)) {
              closed++;
            } else if (pendingStatusList.includes(statusLower) || !statusLower) {
              pending++;
            } else {
              pending++;
            }
          }
        });

        const newCounts = { pending, scheduled, closed, total: data.length };
        setCounts(newCounts);
        if (onCountsCalculated) onCountsCalculated(newCounts);
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
    const casesChannel = supabase
      .channel('realtime-stats-bar-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => fetchRealTimeStats())
      .subscribe();
    return () => { supabase.removeChannel(casesChannel); };
  }, [casesTrigger]);

  return (
    <div id="case-statistics-bar-container" className="w-full mb-10 font-sans" dir="rtl">
      {loading && counts.total === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-3xl p-6 animate-pulse h-28 flex items-center justify-between shadow-sm">
              <div className="space-y-3 w-2/3">
                <div className="h-3 bg-slate-100 rounded-full w-1/2"></div>
                <div className="h-6 bg-slate-100 rounded-full w-1/3"></div>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-right font-bold text-rose-800 text-xs flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchRealTimeStats} className="bg-rose-100 hover:bg-rose-200 px-4 py-1.5 rounded-xl">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1 text-right">
              <span className="text-xs font-bold text-slate-500 block">إجمالي القضايا</span>
              <h3 className="text-3xl font-black text-slate-900 leading-none">{counts.total}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Scale className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 2: Pending */}
          <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1 text-right">
              <span className="text-xs font-bold text-slate-500 block">قيد النظر</span>
              <h3 className="text-3xl font-black text-amber-600 leading-none">{counts.pending}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
              <RefreshCw className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 3: Scheduled */}
          <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1 text-right">
              <span className="text-xs font-bold text-slate-500 block">محددة جلسة</span>
              <h3 className="text-3xl font-black text-emerald-600 leading-none">{counts.scheduled}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 4: Closed */}
          <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1 text-right">
              <span className="text-xs font-bold text-slate-500 block">منتهية</span>
              <h3 className="text-3xl font-black text-rose-600 leading-none">{counts.closed}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Archive className="w-6 h-6" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
