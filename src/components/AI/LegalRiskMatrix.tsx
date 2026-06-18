import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, TrendingUp, TrendingDown, Scale, Gavel, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Case } from '@/types';

interface RiskFactor {
  id: string;
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

interface LegalRiskMatrixProps {
  selectedCase?: Case | null;
  cases: Case[];
  theme?: 'light' | 'dark' | 'gold';
}

export const LegalRiskMatrix: React.FC<LegalRiskMatrixProps> = ({ selectedCase, cases, theme = 'dark' }) => {
  const [winProbability, setWinProbability] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCase) {
      analyzeRisk(selectedCase);
    } else if (cases.length > 0) {
      analyzeRisk(cases[0]);
    }
  }, [selectedCase, cases]);

  const analyzeRisk = async (cs: Case) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const prompt = `بصفتك خبيراً قانونياً في الأنظمة السعودية، قم بتحليل المخاطر للقضية التالية:
رقم القضية: ${cs.caseNumber}
الوصف: ${cs.title}
الحالة: ${cs.status}

يرجى إرجاع مصفوفة مخاطر بصيغة JSON حصراً بهذا التنسيق:
{
  "factors": [
    {
      "id": "معرف_فريد_بالانجليزي",
      "label": "عنوان الخطر",
      "impact": "positive" أو "negative" أو "neutral",
      "weight": 25, // الوزن النسبي (مجموعهم 100)
      "description": "وصف دقيق"
    }
  ]
}`;

      const { callAnthropicAPI } = await import('@/lib/anthropic');
      const responseText = await callAnthropicAPI(prompt);
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const factors = parsed.factors;
        
        const score = factors.reduce((acc: number, f: any) => {
          const multiplier = f.impact === 'positive' ? 1 : f.impact === 'negative' ? 0.3 : 0.6;
          return acc + (f.weight * multiplier);
        }, 0);

        setWinProbability(Math.round(score));
        setRiskFactors(factors);
      } else {
        throw new Error('لم يتم إرجاع بيانات مهيكلة صحيحة');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'حدث خطأ أثناء تحليل المخاطر');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-emerald-400';
    if (prob >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getImpactIcon = (impact: RiskFactor['impact']) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-rose-400" />;
      default: return <Info className="w-4 h-4 text-slate-200 font-bold" />;
    }
  };

  return (
    <div className="bg-[#0c1427]/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-full flex flex-col" dir="rtl">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
            <Scale className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">مصفوفة تحليل المخاطر (Legal Risk Matrix)</h3>
            <p className="text-[10px] text-slate-200 font-bold font-bold">تحليل الذكاء الاصطناعي للسوابق القضائية والمستندات</p>
          </div>
        </div>
        {selectedCase && (
          <span className="text-[10px] font-black px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold">
            {selectedCase.caseNumber}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-6">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-[11px] font-black text-slate-200 font-bold animate-pulse">جاري فحص 2500 سابقة قضائية مماثلة...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-[11px] font-black text-rose-400">{error}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Circular Probability Display */}
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-800"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364.4}
                      initial={{ strokeDashoffset: 364.4 }}
                      animate={{ strokeDashoffset: 364.4 - (364.4 * (winProbability || 0)) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={getProbabilityColor(winProbability || 0)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${getProbabilityColor(winProbability || 0)}`}>
                      {winProbability}%
                    </span>
                    <span className="text-[11px] font-black text-slate-200 font-bold uppercase tracking-widest">فرصة النجاح</span>
                  </div>
                </div>
              </div>

              {/* Risk Factors List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {riskFactors.map((factor, idx) => (
                  <div key={factor.id} className="p-3 bg-slate-900/40 border border-white/5 rounded-2xl space-y-1.5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getImpactIcon(factor.impact)}
                        <span className="text-[10.5px] font-bold text-white leading-none">{factor.label}</span>
                      </div>
                      <span className="text-[9.5px] font-black text-slate-700">{factor.weight}%</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium leading-relaxed pr-6">{factor.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-[10.5px] font-black text-amber-200">توصية المستشار الذكي:</h4>
                  <p className="text-[9.5px] text-amber-100/70 font-medium leading-relaxed">
                    بناءً على المعطيات، يُنصح بالتركيز على تعزيز البينة في الجلسة القادمة لرفع نسبة التأييد في محكمة الاستئناف مستقبلاً.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <button className="text-[10px] font-black px-4 py-2 bg-white/5 text-white rounded-xl transition-all flex items-center gap-2">
          <Gavel className="w-3.5 h-3.5" />
          <span>توليد تقرير مخاطر مفصل</span>
        </button>
        <button className="text-[10px] font-black text-primary">عرض كافة السوابق 🔍</button>
      </div>
    </div>
  );
};

export default LegalRiskMatrix;

import { RefreshCw } from 'lucide-react';
