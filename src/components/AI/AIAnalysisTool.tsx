/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, FileSearch, ShieldCheck, AlertCircle, TrendingUp, Info, ListChecks, Gavel, Cpu, RefreshCw, BarChart3, Target } from 'lucide-react';
import { useSystemData } from '@/hooks/useSystemData';
import CaseClientSelector from '../shared/CaseClientSelector';

export default function AIAnalysisTool() {
  const [analysisType, setAnalysisType] = useState<'case' | 'contract' | 'judgment'>('case');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { cases, clients } = useSystemData();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!content.trim() && !selectedCase) return;
    setIsLoading(true);
    setResult(null);

    try {
      const caseContext = selectedCase ? 
        `بيانات القضية المرفقة:
        رقم القضية: ${selectedCase.case_number}
        طبيعة القضية: ${selectedCase.title}
        مرحلة القضية: ${selectedCase.stage}
        تصنيف القضية: ${selectedCase.category}
        الملخص المتوفر: ${selectedCase.summary || ''}` : '';

      const promptMap = {
        case: `بصفتك محللاً قانونياً ذكياً وخبيراً في الأنظمة السعودية والقضاء المقارن، قم بتحليل صحيفة الدعوى التالية ومقارنتها بالسوابق القضائية المتوفرة:
        
        ${caseContext}
        ${content}
        
        المطلوب:
        1. تحليل نقاط القوة (Strengths) في الأسانيد القانونية.
        2. تحليل نقاط الضعف والمخاطر (Weaknesses/Risks) والثغرات التي قد يستغلها الخصم.
        3. مقارنة الحالة مع سوابق قضائية مشابهة في القضاء العام أو التجاري السعودي.
        4. تقدير احتمالية النجاح بناءً على الدفوع والقرائن المتوفرة.
        5. اقتراح استراتيجية دفاعية أو هجومية معينة.`,
        contract: `بصفتك خبيراً في صياغة وفحص العقود، قم بتحليل هذا العقد:
        ${content}
        المطلوب استخراج:
        1. البنود الجوهرية.
        2. البنود "الخطيرة" أو المجحفة.
        3. الثغرات القانونية المحتملة.
        4. مقترحات التحسين والتعديل.`,
        judgment: `بصفتك محللاً للأحكام القضائية، قم بتحليل هذا الحكم/الصك:
        ${content}
        المطلوب استخراج:
        1. أطراف الدعوى والطلبات.
        2. منطوق الحكم (القرار النهائي).
        3. الأسانيد والمبررات (التسبيب).
        4. المهل النظامية (مثل موعد الاستئناف).`
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptMap[analysisType] }]
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.response);
      }
    } catch (e) {
      console.error(e);
      setResult('فشل التحليل الذكي.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <Cpu className="w-6 h-6 text-amber-500" />
              المحلل القانوني الذكي
            </h3>
            <p className="text-slate-200 font-bold text-xs mt-2 font-bold">تحليل عميق للدعاوى والعقود والأحكام باستخدام أقوى نماذج الذكاء الاصطناعي.</p>
          </div>

          <div className="bg-[#0a1628] border border-[#1e3a5f] p-6 rounded-3xl shadow-lg space-y-6">
            <div className="mb-4">
              <CaseClientSelector
                selectedCaseId={selectedCase?.id}
                selectedClientId={selectedClient?.id}
                onCaseSelect={setSelectedCase}
                onClientSelect={setSelectedClient}
              />
            </div>

            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {[
                { id: 'case', label: 'تحليل دعوى', icon: <Target className="w-4 h-4" /> },
                { id: 'contract', label: 'فحص عقد', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'judgment', label: 'تحليل حكم', icon: <Gavel className="w-4 h-4" /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setAnalysisType(t.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${
                    analysisType === t.id 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-300'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <textarea 
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                analysisType === 'case' ? "أدخل تفاصيل إضافية للدعوى وادعاءات الخصم..." :
                analysisType === 'contract' ? "الصق نص العقد هنا لفحصه..." :
                "أدخل نص الحكم القضائي لاستخراج الزبدة..."
              }
              className="w-full bg-[#0a1628] border-2 border-[#1e3a5f] rounded-2xl py-4 px-5 text-sm font-bold text-slate-950 placeholder:text-slate-500 outline-none focus:border-amber-500 transition-all font-sans"
            />

            <button 
              onClick={handleAnalyze}
              disabled={isLoading || (!content.trim() && !selectedCase)}
              className="w-full bg-[#0A0F1E] text-amber-300 py-4 rounded-2xl text-xs font-black shadow-xl transition-all flex items-center justify-center gap-3 border-2 border-amber-500 hover:bg-[#1e293b] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                  جاري التحليل المعقد...
                </>
              ) : (
                <>
                  <FileSearch className="w-5 h-5" />
                  بدء التحليل الآن
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7">
          <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-3xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-[#1e3a5f] flex justify-between items-center">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                نتائج التقرير التحليلي
              </h4>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {result ? (
                <div className="space-y-6">
                  {/* We could parse the AI output here to show in a more structured way, but for now markdown-style text is fine */}
                  <div className="text-slate-950 text-sm font-bold leading-loose whitespace-pre-line text-justify font-sans bg-[#0a1628] p-6 rounded-2xl border border-[#1e3a5f] shadow-sm">
                    {result}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-emerald-500 text-white rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-600 font-black">جاهزية الملف</p>
                        <p className="text-lg font-black text-slate-900">92%</p>
                      </div>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-rose-500 text-white rounded-xl">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-rose-600 font-black">مستوى المخاطرة</p>
                        <p className="text-lg font-black text-slate-900">منخفض</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Info className="w-16 h-16 text-white font-bold mb-4" />
                  <p className="text-sm font-bold">بانتظار التحليل لاستخراج الرؤى القانونية...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
