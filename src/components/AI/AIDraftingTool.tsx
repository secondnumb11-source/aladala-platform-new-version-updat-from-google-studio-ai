/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  FileText, 
  Send, 
  BookOpen, 
  Scaling, 
  Gavel, 
  FileCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle,
  Eye,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useSystemData } from '@/hooks/useSystemData';
import CaseClientSelector from '../shared/CaseClientSelector';

interface AIDraftingToolProps {
  onDraftGenerated?: (text: string) => void;
  cases?: any[];
}

export default function AIDraftingTool({ onDraftGenerated }: AIDraftingToolProps) {
  const { cases, clients, employees } = useSystemData();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [draftType, setDraftType] = useState<'pleading' | 'appeal' | 'defense' | 'contract' | 'reminder'>('pleading');
  const [facts, setFacts] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  // Dynamic contrast card state (customizable backgrounds to showcase brightness analysis live)
  const [cardBgs, setCardBgs] = useState<{ [key: string]: string }>({
    cardA: 'bg-slate-900',       // Dark (contrast: white text)
    cardB: 'bg-white',            // Light (contrast: slate-900 text)
    cardC: 'bg-indigo-950'        // Deep Indigo (contrast: white text)
  });

  const analyzeContrastAndGetColors = (bgClass: string) => {
    // If the class contains dark keywords, return white/light themes
    const darkKeywords = ['bg-slate-900', 'bg-indigo-950', 'bg-emerald-950', 'bg-slate-800'];
    const isDark = darkKeywords.some(keyword => bgClass.includes(keyword));
    return {
      headingClass: isDark ? 'text-amber-300 font-sans font-black tracking-wide' : 'text-slate-950 font-sans font-black tracking-wide', // Yellow/Dark contrast
      textClass: isDark ? 'text-white font-bold font-sans font-medium' : 'text-slate-900 font-bold font-sans font-medium', // High contrast
      metricClass: isDark ? 'text-amber-400 font-mono font-black' : 'text-amber-600 font-black font-mono font-black',
      badgeClass: isDark ? 'bg-amber-400/20 text-amber-200 font-black' : 'bg-slate-800 text-amber-300 font-black',
      borderClass: isDark ? 'border-amber-500/30' : 'border-slate-300'
    };
  };

  const cycleBg = (cardId: 'cardA' | 'cardB' | 'cardC') => {
    const list = ['bg-white', 'bg-slate-900', 'bg-indigo-950', 'bg-amber-500/10'];
    setCardBgs(prev => {
      const current = prev[cardId];
      const nextIndex = (list.indexOf(current) + 1) % list.length;
      return { ...prev, [cardId]: list[nextIndex] };
    });
  };

  const handleDraft = async () => {
    if (!facts.trim() && !selectedCase && !selectedClient) return;
    setIsLoading(true);
    setOutput('');

    try {
      const contextData = selectedCase ? {
        caseNumber: selectedCase.case_number,
        caseName: selectedCase.title,
        clientName: selectedCase.client_name || selectedClient?.name || '',
        clientNationalId: selectedClient?.national_id || '',
        opponentName: selectedCase.opponent_name || '',
        courtName: selectedCase.court_name || '',
        category: selectedCase.category,
        stage: selectedCase.stage,
        summary: selectedCase.summary || '',
        agreedFees: selectedCase.agreed_fees || 0,
      } : {};

      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: draftType,
          details: facts,
          caseContext: contextData,
          clientContext: selectedClient || {}
        })
      });

      const data = await res.json();
      if (data.success) {
        setOutput(data.result || data.response);
        onDraftGenerated?.(data.result || data.response);
      } else {
        setOutput(data.error || 'حدث خطأ أثناء الصياغة. يرجى المحاولة لاحقاً.');
      }
    } catch (e: any) {
      console.error(e);
      setOutput(e.message || 'حدث خطأ أثناء الصياغة. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).catch(e => console.error(e));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Dynamic Brightness Readability Showcase Section */}
      <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-[2.5rem] space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900">البطاقات الذكية لتبديل وتحليل المقروئية والسطوع (Readability Control)</h3>
          <p className="text-[11px] text-slate-700 font-bold mt-1">انقر على أي كارت بالأسفل لتبديل خلفيته مجهرياً بين السطوع والعتام. سيقوم الكود والذكاء الاصطناعي بتحليل لومينانس الخلفية الجديدة وتكييف ألوان النصوص ومؤامتها تلقائياً لضمان منتهى الوضوح البصري الملاءم.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'cardA', title: 'مذكرة مطالبة تجارية', description: 'يحلل السوابق ويوافقها مع محكمة الاستئناف بالرياض بالتوجيه الفقهي.', badge: 'مستودع الأنماط' },
            { id: 'cardB', title: 'صحيفة دعوى الحق المالي', description: 'تأسيس الالتزامات ونفي الضرر الفادح بمباديء المعاملات المدنية.', badge: 'موثّق ناجز' },
            { id: 'cardC', title: 'عقود الاستثمار والشراكة', description: 'متوافقة كلياً مع نظام الشركات السعودي الجديد لدرء مخاطر التصفية.', badge: 'صيغة استباقية' }
          ].map((item) => {
            const currentBg = cardBgs[item.id];
            const colors = analyzeContrastAndGetColors(currentBg);
            return (
              <motion.div
                key={item.id}
                onClick={() => cycleBg(item.id as any)}
                layout
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`${currentBg} border ${colors.borderClass} p-6 rounded-2xl cursor-pointer shadow-md select-none relative overflow-hidden flex flex-col justify-between h-[180px]`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-sans ${colors.badgeClass}`}>
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-yellow-400 font-black flex items-center gap-1 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                      <Sun className="w-3 h-3 text-white animate-spin drop-shadow-md" />
                      تبديل السطوع
                    </span>
                  </div>
                  <h4 className={`${colors.headingClass} text-sm mb-1.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}>{item.title}</h4>
                  <p className={`${colors.textClass} text-[11px] leading-relaxed drop-shadow-sm`}>{item.description}</p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50/10">
                  <span className="text-[11px] font-black text-white drop-shadow-md">تحليل فوري دقيق</span>
                  <span className={`${colors.headingClass} text-[10px] uppercase font-black drop-shadow-md`}>متكامل 100%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Side */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
            <h3 className="text-xl font-black text-white flex items-center gap-3 relative z-10">
              <Sparkles className="w-6 h-6 text-amber-500" />
              صياغة المستندات بذكاء اصطناعي
            </h3>
            <p className="text-slate-200 font-bold text-xs mt-2 font-bold relative z-10">توليد مسودات قانونية ممتثلة للأنظمة السعودية في ثوانٍ.</p>
          </div>

          <div className="bg-slate-900 border-2 border-amber-500/30 p-6 rounded-[2rem] shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-amber-500/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="mb-4">
                <CaseClientSelector
                  selectedCaseId={selectedCase?.id}
                  selectedClientId={selectedClient?.id}
                  onCaseSelect={(c) => {
                    setSelectedCase(c);
                    // ملء البيانات تلقائياً من القضية
                    setFacts(
                      `القضية رقم: ${c.case_number}\n` +
                      `الموكل: ${c.client_name}\n` +
                      `الخصم: ${c.opponent_name || ''}\n` +
                      `المحكمة: ${c.court_name || ''}\n` +
                      `التصنيف: ${c.category}\n` +
                      `الملخص: ${c.summary || ''}`
                    );
                  }}
                  onClientSelect={(cl) => {
                    setSelectedClient(cl);
                  }}
                />
              </div>

              <label className="text-[10px] font-black text-yellow-400 drop-shadow-md uppercase tracking-widest mb-3 block">نوع المستند المطلوب صياغته</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { id: 'pleading', label: 'صحيفة دعوى', icon: <FileText className="w-4 h-4" /> },
                  { id: 'appeal', label: 'لائحة اعتراض', icon: <Scaling className="w-4 h-4" /> },
                  { id: 'defense', label: 'مذكرة دفاع', icon: <Gavel className="w-4 h-4" /> },
                  { id: 'contract', label: 'عقد قانوني', icon: <BookOpen className="w-4 h-4" /> },
                  { id: 'reminder', label: 'إنذار عدلي', icon: <FileCheck className="w-4 h-4" /> }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setDraftType(type.id as any)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-[10px] font-black transition-all border ${
                      draftType === type.id 
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                        : 'bg-slate-800 text-white font-bold border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/80'
                    }`}
                  >
                    {type.icon}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <label className="text-[10px] font-black text-yellow-400 drop-shadow-md uppercase tracking-widest mb-3 block">الوقائع والبيانات الجوهرية (اختياري / مكمل)</label>
              <textarea 
                rows={8}
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                placeholder="أدخل تفاصيل إضافية عن القضية أو السياق..."
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 px-5 text-sm font-bold text-white drop-shadow-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 transition-all font-sans leading-relaxed placeholder-slate-500"
              />
            </div>

            <button 
              onClick={handleDraft}
              disabled={isLoading || (!facts.trim() && !selectedCase)}
              className="w-full bg-amber-500 text-slate-950 py-4 rounded-2xl text-xs font-black shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  جاري الصياغة القانونية الرصينة...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  توليد المذكرة الآن ✨
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Side */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                المسودة القانونية المتولدة
              </h4>
              {output && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-[10px] font-black transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'تم النسخ' : 'نسخ النص'}
                  </button>
                  <button className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all">
                    <Download className="w-3.5 h-3.5" />
                    تصدير PDF
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto max-h-[600px] bg-slate-50/30">
              {output ? (
                <div className="text-slate-800 text-sm font-bold leading-loose whitespace-pre-line text-justify font-sans">
                  {output}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <FileText className="w-16 h-16 text-white font-bold mb-4" />
                  <p className="text-sm font-bold">بانتظار المدخلات لبدء الصياغة...</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                هذه المذكرة متولدة آلياً بناءً على الوقائع المدخلة. يرجى مراجعتها بدقة والتأكد من مطابقتها للتفاصيل الفعلية للقضية قبل تقديمها رسمياً.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
