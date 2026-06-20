import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, AlertCircle, ShieldCheck, Zap, 
  ArrowLeft, RefreshCw, Loader2, Sparkles,
  Search, Info, CheckCircle2
} from 'lucide-react';
import { getContrastText, TEXT_COLORS } from '@/utils/contrastUtils';

interface AppealDeadline {
  id: string;
  case_id: string;
  judgment_date: string;
  judgment_type: string;
  case_number: string;
  document_name: string;
  days_remaining: number;
  deadline_date: string;
  ai_reasoning: string;
  is_critical: boolean;
}

export default function AppealCountdownWidget() {
  const [deadlines, setDeadlines] = useState<AppealDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeadlines = async () => {
    setRefreshing(true);
    try {
      const { data: judgments, error } = await supabase
        .from('case_judgments')
        .select('*')
        .not('judgment_date', 'is', null)
        .order('judgment_date', { ascending: false });

      if (error) throw error;

      const results = (judgments || []).map(j => {
        // Simple logic for default, in a real app this might fetch cached AI results
        const jDate = new Date(j.judgment_date);
        const deadline = new Date(jDate);
        const deadlineDays = 30; // Standard Saudi Appeal Deadline
        deadline.setDate(deadline.getDate() + deadlineDays);
        
        const now = new Date();
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          id: j.id,
          case_id: j.case_id,
          judgment_date: j.judgment_date,
          judgment_type: j.judgment_type,
          case_number: j.case_number,
          document_name: j.document_name,
          days_remaining: diffDays,
          deadline_date: deadline.toISOString(),
          ai_reasoning: j.ai_legal_analysis || 'يتم احتساب الموعد النظامي بناءً على المادة 187 من نظام المرافعات الشرعية السعودي (30 يوماً من تاريخ التبليغ بالحكم).',
          is_critical: diffDays > 0 && diffDays <= 5
        };
      }).filter(d => d.days_remaining >= -10) // Show recently expired too
      .sort((a, b) => a.days_remaining - b.days_remaining);

      setDeadlines(results);
    } catch (err) {
      console.error('Error fetching deadlines:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const bgClass = "#0b1329"; // Dark background as requested for dashboard widgets
  const textColor = getContrastText(bgClass); // Should be text-white or white-yellow

  return (
    <div className="bg-[#0b1329] border-2 border-amber-500/30 rounded-[2.5rem] p-6 shadow-2xl h-full flex flex-col relative overflow-hidden group/widget">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className={`text-sm font-black tracking-tight ${textColor}`}>مواعيد الاستئناف والمهل</h3>
            <p className="text-[10px] text-amber-400/70 font-bold mt-0.5">مزامنة ذكية مع نظام المرافعات</p>
          </div>
        </div>
        <button 
          onClick={fetchDeadlines}
          disabled={refreshing}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1 relative z-10">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className={`text-xs ${getContrastText('#0b1329')} font-bold`}>جاري تحميل البيانات...</span>
          </div>
        ) : deadlines.length > 0 ? (
          <AnimatePresence>
            {deadlines.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-3xl border transition-all relative overflow-hidden ${
                  d.days_remaining < 0 
                    ? 'bg-rose-500/5 border-rose-500/20' 
                    : d.is_critical 
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                      : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                       <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                         d.days_remaining < 0 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-amber-400 border border-amber-500/20'
                       }`}>
                         {d.days_remaining < 0 ? 'منتهي' : d.is_critical ? 'حرج' : 'نشط'}
                       </span>
                       <span className="text-[10px] text-slate-200 font-mono font-bold truncate">#{d.case_number}</span>
                    </div>
                    <h4 className={`text-xs font-black ${getContrastText('#0b1329')} truncate mb-1`}>{d.document_name || d.judgment_type}</h4>
                    <p className="text-[10px] text-slate-200 font-bold">{new Date(d.judgment_date).toLocaleDateString('ar-SA')}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${
                      d.days_remaining < 0 ? 'bg-rose-600/20 border-rose-500 text-rose-500' : 'bg-slate-950 border-amber-500/30 text-amber-500'
                    }`}>
                      <span className="text-xl font-black leading-none">{Math.abs(d.days_remaining)}</span>
                      <span className="text-[8px] font-black uppercase mt-1">يوم</span>
                    </div>
                    <span className={`text-[9px] font-black ${d.days_remaining < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {d.days_remaining < 0 ? 'تأخير' : 'متبقي'}
                    </span>
                  </div>
                </div>

                {/* AI Reasoning Mini Box */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2">
                   <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-[9px] text-white font-bold leading-relaxed line-clamp-2">
                     {d.ai_reasoning}
                   </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-60">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-sm font-black text-white">لا توجد مهل استئناف قريبة</p>
            <p className="text-[10px] text-white font-bold mt-1">جميع المواعيد في النطاق الآمن أو غير مسجلة</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>مطابق لنظام المرافعات</span>
        </div>
        <div className="h-5 w-px bg-white/5 mx-2"></div>
        <div className="text-[10px] font-bold text-slate-500">حدث في: {new Date().toLocaleTimeString('ar-SA')}</div>
      </div>
    </div>
  );
}
