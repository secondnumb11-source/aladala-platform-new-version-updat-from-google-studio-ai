/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Cpu, 
  FileSearch, 
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Search,
  Scale
} from 'lucide-react';

export default function AISwotTool() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [swotResult, setSwotResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwotAnalysis = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    setSwotResult(null);
    setError(null);

    try {
      const prompt = `قم بإجراء تحليل SWOT (نقاط القوة، نقاط الضعف، الفرص، التهديدات) لهذه الصحيفة/اللائحة القانونية بناءً على الأنظمة القضائية السعودية المعاصرة (مثل نظام المعاملات المدنية، نظام الإثبات، نظام المرافعات الشرعية).
      
      كما يرجى اقتراح دفوع قانونية إضافية (Suggested Legal Defenses) مدعومة بالنصوص النظامية ذات الصلة لتقوية الموقف القضائي.
      
      ${content}
      
      المطلوب إرجاع النتيجة بتنسيق JSON يحتوي على:
      {
        "strengths": ["نقطة 1", ...],
        "weaknesses": ["نقطة 1", ...],
        "opportunities": ["نقطة 1", ...],
        "threats": ["نقطة 1", ...],
        "suggestedDefenses": ["دفع مع النص النظامي 1", ...],
        "legalAdvice": "نصيحة قانونية ختامية شاملة"
      }`;

      const { callAnthropicAPI } = await import('@/lib/anthropic');
      const responseText = await callAnthropicAPI(prompt);
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setSwotResult(parsed);
        } else {
          throw new Error('لم يتم إرجاع JSON صالح');
        }
      } catch {
        setSwotResult({
          strengths: [responseText],
          weaknesses: [],
          opportunities: [],
          threats: [],
          suggestedDefenses: [],
          legalAdvice: "لم يتمكن المحرك من تصنيف البيانات بدقة كـ JSON، يرجى مراجعة النص أعلاه."
        });
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'حدث خطأ أثناء معالجة التحليل.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group text-high-contrast-light-bg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
            <h3 className="text-xl font-black text-white flex items-center gap-3 relative z-10">
              <Scale className="w-6 h-6 text-amber-400" />
              محلل الموقف النظامي (SWOT)
            </h3>
            <p className="text-slate-200 font-bold text-[10px] mt-2 font-bold leading-relaxed relative z-10">
              أدخل نص صحيفة الدعوى أو الدفاع لاستخراج مصفوفة المخاطر والفرص فوراً.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-xl space-y-5">
            <textarea 
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="الصق نص الصحيفة أو اللائحة هنا للتحليل..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-5 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all font-sans"
            />
            <button 
              onClick={handleSwotAnalysis}
              disabled={isLoading || !content.trim()}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  جاري تفكيك النص نظامياً...
                </>
              ) : (
                <>
                  <FileSearch className="w-5 h-5" />
                  بدء تحليل مصفوفة SWOT
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                تقرير التهديدات والفرص النظامية
              </h4>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {!swotResult && !isLoading && !error ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <Search className="w-16 h-16 text-white font-bold mb-4" />
                  <p className="text-sm font-bold">يرجى إدخال النص لبدء المعالجة العميقة...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                  <AlertTriangle className="w-16 h-16 text-rose-500" />
                  <h3 className="text-lg font-black text-slate-900">فشل التحليل</h3>
                  <p className="text-sm font-bold text-rose-600">{error}</p>
                </div>
              ) : swotResult ? (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3 text-emerald-700 font-black text-xs">
                        <ShieldCheck className="w-5 h-5" />
                        نقاط القوة (Strengths)
                      </div>
                      <ul className="space-y-2">
                        {swotResult.strengths?.map((s: string, i: number) => (
                          <li key={i} className="text-[11px] font-bold text-slate-700 leading-relaxed bg-white/50 p-2 rounded-lg border border-emerald-50 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3 text-rose-700 font-black text-xs">
                        <TrendingDown className="w-5 h-5" />
                        نقاط الضعف (Weaknesses)
                      </div>
                      <ul className="space-y-2">
                        {swotResult.weaknesses?.map((w: string, i: number) => (
                          <li key={i} className="text-[11px] font-bold text-slate-700 leading-relaxed bg-white/50 p-2 rounded-lg border border-rose-50 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="bg-sky-50/50 border border-sky-100 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3 text-sky-700 font-black text-xs">
                        <TrendingUp className="w-5 h-5" />
                        الفرص النظامية (Opportunities)
                      </div>
                      <ul className="space-y-2">
                        {swotResult.opportunities?.map((o: string, i: number) => (
                          <li key={i} className="text-[11px] font-bold text-slate-700 leading-relaxed bg-white/50 p-2 rounded-lg border border-sky-50 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Threats */}
                    <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl space-y-4 md:col-span-2">
                      <div className="flex items-center gap-3 text-amber-400 font-black font-black text-xs">
                        <ShieldAlert className="w-5 h-5" />
                        التهديدات (Threats)
                      </div>
                      <ul className="space-y-2">
                        {swotResult.threats?.map((t: string, i: number) => (
                          <li key={i} className="text-[11px] font-bold text-slate-700 leading-relaxed bg-white/50 p-2 rounded-lg border border-amber-50 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggested Defenses - New Section */}
                    {swotResult.suggestedDefenses && swotResult.suggestedDefenses.length > 0 && (
                      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl space-y-4 md:col-span-2 shadow-sm">
                        <div className="flex items-center gap-3 text-indigo-700 font-black text-xs">
                          <Scale className="w-5 h-5" />
                          الدفوع القانونية الإضافية المقترحة (Strategic Defenses)
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {swotResult.suggestedDefenses.map((d: string, i: number) => (
                            <div key={i} className="text-[11px] font-black text-indigo-900 leading-relaxed bg-white p-4 rounded-2xl border border-indigo-200 flex items-start gap-3 shadow-ghost">
                              <span className="mt-1 flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-[11px] shrink-0 font-mono">
                                {i + 1}
                              </span>
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-high-contrast-light-bg">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-x-16 -translate-y-16"></div>
                    <div className="flex items-start gap-4 relative z-10">
                      <Lightbulb className="w-6 h-6 text-amber-500 shrink-0" />
                      <div className="space-y-2">
                        <h5 className="text-xs font-black uppercase text-amber-500 tracking-widest">توجيه المحرك الذكي</h5>
                        <p className="text-sm font-bold leading-relaxed">{swotResult.legalAdvice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                  <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-200 font-bold">جاري تحليل المواد النظامية السعودية ذات الصلة...</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">إخلاء مسؤولية: التحليل استرشادي لدعم القرار القانوني البشري فقط.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
