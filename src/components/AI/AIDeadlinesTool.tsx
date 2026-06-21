/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Timer, CalendarRange, ShieldCheck, ArrowUpRight, Loader2 } from 'lucide-react';
import { addDays, format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

export default function AIDeadlinesTool() {
  const [judgmentCases, setJudgmentCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  
  const [judgmentDate, setJudgmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'appeal' | 'execution' | 'objection'>('appeal');
  const [isFetchingJudgments, setIsFetchingJudgments] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [judgmentSource, setJudgmentSource] = useState<'manual' | 'ai'>('manual');
  const [aiAnalysis, setAiAnalysis] = useState<{
    deadlineDays: number;
    legalReasoning: string;
    advice: string;
    priority: string;
  } | null>(null);
  
  const deadlinesMap = {
    appeal: 30,
    execution: 15,
    objection: 60
  };

  useEffect(() => {
    const loadJudgmentCases = async () => {
      const { data } = await supabase
        .from('case_documents')
        .select('case_number, case_name, judgment_date, judgment_type, court_name')
        .eq('document_type', 'judgment')
        .not('judgment_date', 'is', null)
        .order('judgment_date', { ascending: false });

      if (data) setJudgmentCases(data);
    };
    loadJudgmentCases();
  }, []);

  const calculateDeadlines = async () => {
    if (!selectedCase) return;
    setIsAnalyzingAI(true);
    setJudgmentSource('ai');
    setJudgmentDate(selectedCase.judgment_date);

    try {
      const response = await fetch('/api/ai/analyze-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgmentDate: selectedCase.judgment_date,
          type: type,
          caseTitle: selectedCase.case_name,
          judgmentType: selectedCase.judgment_type,
          courtName: selectedCase.court_name
        })
      });
      const data = await response.json();
      if (data) setAiAnalysis(data);
    } catch(err: any) {
      console.error('خطأ في الحساب', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  useEffect(() => {
    if (selectedCase) {
        calculateDeadlines();
    }
  }, [selectedCase, type]);

  useEffect(() => {
    if (!judgmentDate) {
        setJudgmentDate(new Date().toISOString().split('T')[0]);
    }
  }, [type, judgmentDate]);

  const effectiveDeadlineDays = aiAnalysis ? aiAnalysis.deadlineDays : deadlinesMap[type];
  const deadlineDate = addDays(new Date(judgmentDate || new Date()), effectiveDeadlineDays);
  const daysRemaining = differenceInDays(deadlineDate, new Date());
  const isExpired = daysRemaining < 0;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 text-high-contrast-light-bg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full translate-x-32 -translate-y-32"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white flex items-center gap-4 drop-shadow-sm">
            <CalendarRange className="w-8 h-8 text-amber-500" />
            حاسبة المهل والمدد النظامية
          </h2>
          <p className="text-slate-200 mt-1 font-bold">حساب تلقائي لمدد الاستئناف والاعتراض وفق الأنظمة القضائية السعودية ومزامنة لتواريخ الأحكام.</p>
        </div>
        <div className="relative z-10 flex gap-2">
          <div className="bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700 flex flex-col items-center min-w-[120px]">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">المنطقة الزمنية</span>
             <span className="text-sm font-black text-white">توقيت مكة - KSA</span>
          </div>
        </div>
      </div>
      
      <select
        value={selectedCase?.case_number || ''}
        onChange={e => {
          const c = judgmentCases.find(j => j.case_number === e.target.value);
          setSelectedCase(c || null);
        }}
        className="w-full ai-select-high-contrast px-4 py-3 rounded-2xl focus:outline-none focus:border-amber-400"
      >
        <option value="">— اختر قضية من النظام —</option>
        {judgmentCases.map((c, i) => (
          <option key={i} value={c.case_number}>
            #{c.case_number} — {c.case_name} | حكم: {c.judgment_date}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-lg space-y-8 relative">
            {isFetchingJudgments && (
               <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 rounded-[2rem] flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
               </div>
            )}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">نوع القيد/المهلة النظامية</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'appeal', label: 'الاستئناف (30 يوماً)', desc: 'للمطالبة بالحقوق ومراجعة حكم أول درجة' },
                  { id: 'execution', label: 'التنفيذ (15 يوماً)', desc: 'مهلة الوفاء قبل إجراءات التنفيذ الجبرية' },
                  { id: 'objection', label: 'الاعتراض (60 يوماً)', desc: 'الاعتراض أمام المحكمة العليا' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id as any)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-right ${
                      type === t.id 
                        ? 'bg-slate-900 text-white border-amber-500 shadow-xl' 
                        : 'bg-slate-50 text-white border-slate-100'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${type === t.id ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-500 border border-slate-200'}`}>
                      <Timer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black">{t.label}</p>
                      <p className={`text-[10px] font-semibold ${type === t.id ? 'text-slate-300' : 'text-slate-500'}`}>{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">تاريخ صدور الحكم / القرار</label>
                 {judgmentSource === 'ai' && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black">AI استيراد تلقائي</span>}
              </div>
              <div className="relative">
                <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="date"
                  value={judgmentDate || ''}
                  onChange={(e) => {
                     setJudgmentDate(e.target.value);
                     setJudgmentSource('manual');
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-14 pl-5 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                />
              </div>
            </div>

            <button className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-black shadow-xl transition-all flex items-center justify-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              تفعيل التنبيهات الذكية لهذا الموعد
            </button>
          </div>
        </div>

        {/* Status Display */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
            {/* Background elements */}
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full opacity-10 -translate-x-12 -translate-y-12 ${isExpired ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

            <div className={`p-8 rounded-full shadow-2xl relative z-10 ${
              isExpired ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'
            } border-4`}>
              <Clock className="w-16 h-16" />
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className={`text-4xl font-black ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                {isExpired ? 'انتهت المهلة' : `متبقي ${daysRemaining} يوماً`}
              </h3>
              <p className="text-slate-600 text-sm font-bold">
                الموعد النهائي: {format(deadlineDate, 'd MMMM yyyy (EEEE)', { locale: ar })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full relative z-10">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">تاريخ البداية (الحكم)</p>
                <p className="text-sm font-black text-slate-900">{judgmentDate ? format(new Date(judgmentDate), 'yyyy/MM/dd') : 'غير محدد'}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-2">المدة المقررة نظاماً</p>
                <p className="text-sm font-black text-slate-900">{effectiveDeadlineDays} يوماً</p>
              </div>
            </div>

            {aiAnalysis && (
              <div className="w-full bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3 text-right">
                <div className="flex items-center gap-2 text-amber-800">
                   <ShieldCheck className="w-5 h-5 text-amber-600" />
                   <h4 className="text-xs font-black">التحليل القانوني للذكاء الاصطناعي (Gemini):</h4>
                </div>
                <p className="text-[11px] text-slate-800 font-bold leading-relaxed">
                  {aiAnalysis.legalReasoning}
                </p>
              </div>
            )}

            {!isExpired && (
              <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4 text-right">
                <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">نصيحة المساعد القانوني (AI):</h4>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed font-bold">
                    {aiAnalysis?.advice || `تبقي وقت كافٍ لتجهيز ${type === 'appeal' ? 'اللائحة الاعتراضية' : 'طلب التنفيذ'}. النظام يوصي بتجهيز المستندات قبل اقتراب الموعد النهائي بـ 5 أيام.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <ArrowUpRight className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="font-black text-white text-base">تقديم استئناف أو تنفيذ عبر ناجز</h4>
                  <p className="text-slate-300 text-[10px] font-bold">انتقل مباشرة لبوابة الخدمات العدلية لتنفيذ الإجراء.</p>
               </div>
            </div>
            <a href="https://najiz.sa/" target="_blank" rel="noopener noreferrer" className="bg-white text-slate-950 px-6 py-3 rounded-xl text-xs font-black shadow-lg hover:bg-slate-200 transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500">
               الذهاب لناجز <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
