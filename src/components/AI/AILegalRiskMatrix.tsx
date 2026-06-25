import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, AlertTriangle, CheckCircle, Brain, Scale, ShieldAlert, BarChart3, TrendingUp, TrendingDown, Info, Gavel, RefreshCw } from 'lucide-react';

interface AILegalRiskMatrixProps {
  cases: any[];
}

interface RiskFactor {
  id: string;
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

export default function AILegalRiskMatrix({ cases }: AILegalRiskMatrixProps) {
  const [selectedCase, setSelectedCase] = useState(cases?.[0] || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [winProbability, setWinProbability] = useState<number>(0);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);

  useEffect(() => {
    if (selectedCase) {
      runAnalysis(selectedCase);
    }
  }, [selectedCase]);

  const runAnalysis = (cs: any) => {
    setIsAnalyzing(true);
    // Simulated deep judicial analysis
    setTimeout(() => {
      const factors: RiskFactor[] = [
        { 
          id: 'precedents', 
          label: 'مؤشر السوابق (JudicialObservatory)', 
          impact: cs.status === 'active' ? 'positive' : 'negative', 
          weight: 40,
          description: 'تحليل 18 سابقة قضائية مماثلة من المرصد القضائي في نفس الدائرة.'
        },
        { 
          id: 'weakness', 
          label: 'نقاط الضعف في الدعوى', 
          impact: 'negative', 
          weight: 30,
          description: 'الكشف عن ثغرة في تسلسل التبليغات الإجرائية قد تعيق قبول الدفع.'
        },
        { 
          id: 'evidence', 
          label: 'كفاية الأدلة المادية', 
          impact: 'positive', 
          weight: 20,
          description: 'المستندات المرفوعة تدعم البينة بنسبة 85% وفقاً للمعايير النظامية.'
        },
        { 
          id: 'timing', 
          label: 'السلامة من التقادم', 
          impact: 'neutral', 
          weight: 10,
          description: 'الدعوى مرفوعة في أواخر المهل النظامية، يوصى بسرعة الإرسال.'
        }
      ];

      const score = factors.reduce((acc, f) => {
        const multiplier = f.impact === 'positive' ? 1.2 : f.impact === 'negative' ? 0.4 : 0.8;
        return acc + (f.weight * multiplier);
      }, 0);

      setWinProbability(Math.min(99, Math.round(score)));
      setRiskFactors(factors);
      setIsAnalyzing(false);
    }, 1200);
  };

  const getStatusColor = (prob: number) => {
    if (prob >= 75) return 'text-emerald-500';
    if (prob >= 45) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (!cases || cases.length === 0) {
    return (
      <div className="p-12 text-center text-slate-700 font-bold border-2 border-dashed border-[#1e3a5f] rounded-3xl" dir="rtl">
        لا توجد قضايا حالية لتحليل مخاطرها.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 border-2 border-amber-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Scale className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white">
          <div className="space-y-2">
            <h2 className="text-2xl font-black flex items-center gap-3 text-amber-500">
               <ShieldAlert className="w-6 h-6" /> لوحة تحليل المخاطر القانونية (Legal Risk Matrix)
            </h2>
            <p className="text-slate-200 font-bold text-sm font-bold">نموذج AI تنبؤي يقوم بتحليل "نقاط الضعف" بمواجهة "السوابق القضائية" المستخرجة من المرصد.</p>
          </div>
          
          <select 
            className="w-full md:w-80 ai-select-high-contrast rounded-2xl p-4 text-sm font-black focus:outline-none focus:border-amber-400 transition-all font-sans"
            value={selectedCase?.id}
            onChange={(e) => setSelectedCase(cases.find(c => c.id === e.target.value) || cases[0])}
          >
            {cases.map(c => (
               <option key={c.id} value={c.id}>{c.caseName} - {c.caseNumber}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Win Probability Circular Display */}
        <div className="lg:col-span-4 bg-[#0a1628] border border-[#1e3a5f] p-8 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h3 className="text-slate-200 font-bold text-[10px] font-black uppercase tracking-[0.2em] mb-2">احتمالية النجاح التقريبية</h3>
            <p className="text-slate-900 text-xs font-black">Win Probability Index</p>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center space-y-3"
                >
                  <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                  <span className="text-[10px] font-black text-slate-200 font-bold animate-pulse">جاري التحليل...</span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative w-full h-full"
                >
                   <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                    <motion.circle
                      cx="18" cy="18" r="16" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeDasharray="100, 100"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - winProbability }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={getStatusColor(winProbability)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black tracking-tighter ${getStatusColor(winProbability)}`}>{winProbability}%</span>
                    <span className="text-[11px] font-bold text-slate-200 font-bold mt-1 uppercase">Confidence Level</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full space-y-3">
             <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span>الحالة المكتشفة:</span>
                <span className={`font-black ${getStatusColor(winProbability)} px-3 py-1 rounded-lg bg-[#0a1628] shadow-sm border border-slate-100`}>
                  {winProbability > 70 ? 'موقف قانوني قوي' : winProbability > 40 ? 'موقف قانوني متوسط' : 'موقف محفوف بالمخاطر'}
                </span>
             </div>
          </div>
        </div>

        {/* Detailed Risk Factors */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0a1628] border border-[#1e3a5f] p-8 rounded-[2.5rem] shadow-xl">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-950 text-amber-500 rounded-xl">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">عوامل تحليل الخطر والارتباط بالسوابق</h3>
                    <p className="text-[10px] text-slate-200 font-bold font-bold">مقارنة نقاط ضعف العميل بـ Judicial Observatory</p>
                  </div>
                </div>
                <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Target className="w-3 h-3" /> محرك نشط
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {isAnalyzing ? (
                 Array(4).fill(0).map((_, i) => (
                   <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse border border-slate-100" />
                 ))
               ) : (
                 riskFactors.map((factor) => (
                   <motion.div 
                     key={factor.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-slate-50 border border-slate-100 p-5 rounded-3xl space-y-3 transition-all group"
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         {factor.impact === 'positive' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : factor.impact === 'negative' ? <TrendingDown className="w-4 h-4 text-rose-500" /> : <Info className="w-4 h-4 text-slate-200 font-bold" />}
                         <span className="text-[11px] font-black text-slate-800">{factor.label}</span>
                       </div>
                       <span className="text-[10px] font-black text-slate-900 bg-[#0a1628] px-2 py-1 rounded-lg border border-[#1e3a5f]">{factor.weight}%</span>
                     </div>
                     <p className="text-[10px] text-slate-700 font-bold leading-relaxed">{factor.description}</p>
                   </motion.div>
                 ))
               )}
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
                <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[11px] font-black transition-all shadow-lg">
                  <Gavel className="w-4 h-4 text-amber-500" />
                  تصحيح الموقف القانوني الموصى به
                </button>
                <button className="flex items-center gap-2 border border-[#1e3a5f] text-slate-200 font-bold px-6 py-3 rounded-2xl text-[11px] font-black transition-all">
                  عرض السوابق المشابهة بالكامل
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
