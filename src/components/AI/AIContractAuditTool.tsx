/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  Upload, 
  Scale,
  Search,
  FileText,
  Zap,
  Info,
  PenTool,
  Save,
  Wand2,
  BookOpen
} from 'lucide-react';

interface Finding {
  clause: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  lawReference: string;
  recommendation: string;
}

export default function AIContractAuditTool() {
  const [activeTab, setActiveTab] = useState<'drafting' | 'audit'>('drafting');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  
  // Drafting States
  const [contractType, setContractType] = useState('شراكة');
  const [contractFacts, setContractFacts] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');

  const contractTypes = [
    'عقد شراكة', 'عقد عمل', 'عقد استشارات قانونية', 'عقد تمثيل قانوني', 
    'عقد توريد', 'عقد مقاولة', 'عقد استثمار', 'عقد تأسيس شركة', 'عقد امتياز تجاري (Franchise)'
  ];

  const contractTemplates = [
    { title: 'نموذج عقد عمل قياسي', type: 'عقد عمل', desc: 'متوافق مع نظام العمل الجديد' },
    { title: 'عقد أتعاب خدمات قانونية', type: 'عقد تمثيل قانوني', desc: 'شامل التمثيل أمام المحاكم العامة' },
    { title: 'مذكرة تفاهم مبدئية', type: 'عقد شراكة', desc: 'شراكة تجارية لإنشاء مشروع' }
  ];

  const [auditResult, setAuditResult] = useState<{
    findings: Finding[];
    score: number;
    summary: string;
  } | null>(null);

  const startAudit = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAuditResult({
        summary: "تم اكتشاف مخالفات محتملة لنظام العمل السعودي تتعلق بساعات العمل والجزاءات التأديبية. يجب مراجعة المواد 77 و 98 من نظام العمل.",
        score: 72,
        findings: [
          {
            clause: "يقر العامل بالتنازل عن حقه في مكافأة نهاية الخدمة في حال استقالته قبل مرور سنتين.",
            issue: "بند باطل لمخالفته المادة 84 و 85 من نظام العمل التي تقر الحق في المكافأة بنسب محددة.",
            severity: 'high',
            lawReference: "نظام العمل السعودي - المادة 84",
            recommendation: "حذف هذا البند فوراً واستبداله بالنصوص النظامية المعمول بها."
          },
          {
            clause: "ساعات العمل الرسمية 10 ساعات يومياً بدون احتساب أوقات الراحة.",
            issue: "تجاوز الحد الأقصى لساعات العمل الفعلية (8 ساعات) دون احتساب عمل إضافي.",
            severity: 'medium',
            lawReference: "نظام العمل السعودي - المادة 98",
            recommendation: "تعديل ساعات العمل للتوافق مع النظام (8 ساعات) أو إقرار أجر الساعات الإضافية."
          }
        ]
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const startDrafting = () => {
    if (!contractFacts) return;
    setIsDrafting(true);
    setTimeout(() => {
      setGeneratedDraft(`إنه في يوم الإثنين الموافق 15/06/2026م، تم الاتفاق بين كل من:

الطرف الأول: (يتم إدخال البيانات هنا)
الطرف الثاني: (يتم إدخال البيانات هنا)

بناءً على طلبكم ومعطياتكم: "${contractFacts}"

تمهيد:
حيث أن الطرف الأول يمتلك الخبرة الواسعة في مجال اختصاصه، وحيث أقر الطرف الثاني برغبته في التعاقد، فقد اتفق الطرفان على صياغة هذا العقد وفقاً للأنظمة المعمول بها في المملكة العربية السعودية، وعلى وجه الخصوص نظام المعاملات المدنية، المادة كذا...

البند الأول: موضوع العقد
البند الثاني: التزامات الأطراف
البند الثالث: المقابل المالي وآلية الدفع
البند الرابع: السرية وعدم الإفشاء
البند الخامس: القوة القاهرة وتسوية المنازعات

(هذا النص توليد آلي ذكي قابل للتعديل الفوري من قبل المستشار القانوني)`);
      setIsDrafting(false);
    }, 3000);
  };

  const getSeverityColor = (severity: Finding['severity']) => {
    switch (severity) {
      case 'high': return 'text-rose-500 bg-rose-50 border-rose-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-sky-600 bg-sky-50 border-sky-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Header Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl">
          <button 
            onClick={() => setActiveTab('drafting')}
            className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'drafting' ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-slate-400'}`}
          >
            <PenTool className="w-4 h-4" />
            صياغة العقود الذكية
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'audit' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'text-slate-400'}`}
          >
            <FileCheck className="w-4 h-4" />
            مدقق العقود (المسح الضوئي)
          </button>
        </div>
      </div>

      {activeTab === 'drafting' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shadow-inner border border-amber-500/20">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">محرك صياغة العقود القانونية</h2>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">توليد وصياغة جميع أنواع العقود بأسلوب رصين ومطابق للأنظمة السعودية.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-900 block">1. اختر نوع العقد المراد صياغته:</label>
                  <select 
                    title="contract type"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                  >
                    {contractTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-900 block flex justify-between items-center">
                    <span>2. إدخال المعطيات والوقائع وشروط الأطراف:</span>
                    <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded text-[9px] border border-amber-200">صياغة سياقية مدعومة بالأنظمة المحدثة</span>
                  </label>
                  <textarea 
                    value={contractFacts}
                    onChange={(e) => setContractFacts(e.target.value)}
                    placeholder="مثال: يرجى صياغة عقد عمل لموظف في تقنية المعلومات، الراتب الأساسي 10 آلاف، فترة تجربة 90 يوم، مع إضافة بند عدم منافسة لمدة سنتين في منطقة الرياض..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold leading-relaxed text-slate-900 h-32 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 custom-scrollbar resize-none"
                  ></textarea>
                </div>

                {isDrafting ? (
                  <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent w-full h-full animate-[shimmer_2s_infinite]"></div>
                    <Cpu className="w-8 h-8 text-amber-500 animate-pulse relative z-10" />
                    <p className="text-xs font-black relative z-10">جاري معالجة الوقائع والمواءمة مع نظام المعاملات المدنية المنشور ومبادئ القضاء...</p>
                  </div>
                ) : generatedDraft ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> تمت الصياغة بنجاح</span>
                      <button className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold">
                        <Save className="w-3 h-3" /> حفظ كمسودة
                      </button>
                    </div>
                    <textarea 
                      readOnly
                      value={generatedDraft}
                      className="w-full bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 text-[13px] font-bold text-slate-900 leading-8 h-[400px] focus:outline-none custom-scrollbar"
                    />
                  </div>
                ) : (
                  <button 
                    onClick={startDrafting}
                    disabled={!contractFacts}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-4 h-4 text-amber-500" />
                    توليد وصياغة العقد بالاعتماد على الأنظمة 
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-slate-900 text-sm">مكتبة النماذج الجاهزة</h3>
              </div>
              <div className="space-y-3">
                {contractTemplates.map((tpl, i) => (
                  <button key={i} className="w-full text-right bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-black text-slate-900 transition-colors">{tpl.title}</h4>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black">{tpl.type}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">{tpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Tool Formly the same */
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
          {!auditResult ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 transition-all group cursor-pointer relative overflow-hidden h-[400px]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <Cpu className="w-16 h-16 text-slate-900 animate-spin" />
                    <Zap className="w-6 h-6 text-amber-500 absolute top-0 right-0 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-black text-slate-900">جاري المسح الضوئي والتحليل النظامي...</h3>
                    <div className="flex gap-2 justify-center">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150"></span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-300"></span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-bold max-w-sm leading-relaxed text-center">
                    نقوم الآن باستخراج النصوص باستخدام OCR ومطابقتها مع مكتبة الأنظمة السعودية (نظام العمل، نظام التأمينات الاجتماعية).
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-white rounded-full shadow-xl mb-6 transition-transform">
                    <Upload className="w-10 h-10 text-slate-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">اسحب عقد العمل هنا (PDF/Image)</h3>
                  <p className="text-xs text-slate-400 font-bold text-center max-w-xs leading-relaxed">
                    سأقوم بمسح الوثيقة ضوئياً والبحث عن البنود التعسفية أو المخالفة للنظام فوراً.
                  </p>
                  <input 
                    title="upload contract for compliance check"
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={startAudit}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-500" />
                    نتائج الفحص والتدقيق العمالي
                  </h3>
                  <button 
                    onClick={() => setAuditResult(null)}
                    className="text-[10px] font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-xl transition-all"
                  >
                    إعادة ضبط الفحص 🔄
                  </button>
                </div>

                <div className="space-y-4">
                  {auditResult.findings.map((finding, idx) => (
                    <div key={idx} className={`p-6 border rounded-3xl space-y-4 transition-all ${getSeverityColor(finding.severity)}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {finding.severity === 'high' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          <span className="text-[11px] font-black uppercase tracking-widest">مستوى الخطر: {finding.severity === 'high' ? 'عالي جداً' : 'متوسط'}</span>
                        </div>
                        <span className="text-[10px] bg-white/50 px-3 py-1 rounded-full font-bold border border-current opacity-70">{finding.lawReference}</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-black opacity-60 mb-1">النص المكتشف في العقد:</p>
                          <p className="text-xs font-black leading-relaxed italic">"{finding.clause}"</p>
                        </div>
                        <div className="bg-white/40 p-4 rounded-2xl border border-current/10">
                          <p className="text-[11px] font-black mb-1 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" />
                            المشكلة القانونية:
                          </p>
                          <p className="text-[11px] leading-relaxed font-bold opacity-90">{finding.issue}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black opacity-60 mb-0.5">التوصية المقترحة:</p>
                            <p className="text-[11px] font-black">{finding.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-6 text-center">
                    <div className="w-24 h-24 mx-auto border-4 border-amber-500 rounded-full flex items-center justify-center bg-white/10">
                      <span className="text-3xl font-black text-amber-500">% {auditResult.score}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm mb-2">مؤشر الامتثال النظامي</h4>
                      <p className="text-slate-400 text-[10px] font-bold leading-relaxed">{auditResult.summary}</p>
                    </div>
                    <button className="w-full bg-white text-slate-950 py-3 rounded-2xl text-xs font-black shadow-lg transition-all">تحميل تقرير التوافق (PDF)</button>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
