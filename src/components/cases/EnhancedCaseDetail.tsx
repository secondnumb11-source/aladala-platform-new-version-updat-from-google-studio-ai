import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Eye, 
  Cpu, 
  Share2, 
  Printer, 
  Archive, 
  FileText, 
  Paperclip, 
  Gavel, 
  Zap, 
  Check, 
  Sparkles,
  Users,
  Download,
  X,
  History,
  MessageSquare,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Case, Client, Attachment } from '@/types';
import { generateUUID } from '@/lib/uuid';

interface EnhancedCaseDetailProps {
  selectedCase: Case;
  clients: Client[];
  isHighContrast: boolean;
  onSelectCase: (caseObj: Case | null) => void;
  onUpdateState: (type: string, data: any) => void;
  handleTriggerAiAnalysis: (c: Case) => void;
  handleExportToPdf: (c: Case) => void;
  handleStatusTransition: (c: Case, status: any) => void;
  handleCaseSummarize: () => void;
  isAiLoading: boolean;
  aiAnalysis: string;
  setAiAnalysis: (val: string) => void;
  caseDocumentText: string;
  setCaseDocumentText: (val: string) => void;
  caseDocumentMemo: string;
  setCaseDocumentMemo: (val: string) => void;
  isCaseSummarizing: boolean;
  caseSummarizeError: string | null;
  whatsAppLogs: any[];
  setActivityLogCaseId: (id: string | null) => void;
}

export const EnhancedCaseDetail: React.FC<EnhancedCaseDetailProps> = ({
  selectedCase,
  clients,
  isHighContrast,
  onSelectCase,
  onUpdateState,
  handleTriggerAiAnalysis,
  handleExportToPdf,
  handleStatusTransition,
  handleCaseSummarize,
  isAiLoading,
  aiAnalysis,
  setAiAnalysis,
  caseDocumentText,
  setCaseDocumentText,
  caseDocumentMemo,
  setCaseDocumentMemo,
  isCaseSummarizing,
  caseSummarizeError,
  whatsAppLogs,
  setActivityLogCaseId,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history' | 'finance'>('details');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-8"
      dir="rtl"
    >
      {/* Back button */}
      <button 
        onClick={() => {
          onSelectCase(null);
          setAiAnalysis('');
        }}
        className="flex items-center gap-3 text-sm text-slate-500 font-bold hover:text-amber-600 transition-all group w-fit"
      >
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm group-hover:border-amber-200 transition-all">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </div>
        <span>العودة لقائمة جميع الدعاوى والنزاعات</span>
      </button>

      {/* Main Hero Header Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[60px] -ml-24 -mb-24"></div>

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
          <div className="space-y-6 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${
                selectedCase.priority === 'high' 
                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                : selectedCase.priority === 'medium' 
                ? 'bg-amber-50 text-amber-600 border-amber-100' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <ShieldAlert className="w-3 h-3" />
                أولوية {selectedCase.priority === 'high' ? 'قصوى عاجلة' : selectedCase.priority === 'medium' ? 'متوسطة' : 'عادية'}
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                رقم الملف: {selectedCase.caseNumber}
              </span>
              {selectedCase.isNajizSync && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-black px-3 py-1 rounded-full inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  مزامنة ناجز النشطة
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight leading-tight">
                {selectedCase.caseName}
              </h1>
              <button
                type="button"
                onClick={() => setActivityLogCaseId(selectedCase.id)}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100 transition-all"
                title="سجل النشاط والتعديلات"
              >
                <Clock className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-500">
              <div className="flex items-center gap-2 text-sm font-bold">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>{selectedCase.courtName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>آخر تحديث: {selectedCase.lastSessionDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 w-full xl:w-80">
            <button 
              onClick={() => handleTriggerAiAnalysis(selectedCase)}
              className="w-full bg-slate-900 text-white font-black px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95 group"
            >
              <Cpu className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>تحليل قانوني معمق (AI)</span>
            </button>

            <button 
              onClick={() => {
                const clientObj = clients.find(cl => cl.id === selectedCase.clientId);
                if (!clientObj) return;
                const msg = `أهلاً بك سعادة العميل / ${clientObj.name}\nلقد تم تفعيل حسابكم في بوابتكم القضائية (العدالة) لمتابعة مستجدات الدعوى رقم (${selectedCase.caseNumber}).`;
                const phone = clientObj.phone.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="w-full bg-white border border-slate-200 text-slate-700 font-black px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700 active:scale-95 shadow-sm"
            >
              <Share2 className="w-5 h-5 text-emerald-500" />
              <span>إرسال تعميد العميل</span>
            </button>

            <button 
              onClick={() => handleExportToPdf(selectedCase)}
              className="w-full bg-amber-50 text-amber-700 border border-amber-200 font-black px-6 py-4 rounded-2xl text-xs flex items-center justify-center gap-3 transition-all hover:bg-amber-100 active:scale-95 shadow-sm"
            >
              <Printer className="w-5 h-5" />
              <span>تصدير ملف الدعوى (PDF)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Stepper */}
        <div className="mt-12 pt-12 border-t border-slate-100">
          <div className="flex justify-between items-center px-4 md:px-12 relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2"></div>
            
            {[
              { id: 'litigation', label: 'تجهيز اللائحة' },
              { id: 'sessions', label: 'المرافعات' },
              { id: 'appeals', label: 'الاستئناف' },
              { id: 'execution', label: 'التنفيذ' },
              { id: 'done', label: 'الحكم القطعي' }
            ].map((st, idx) => {
              const stages = ['litigation', 'appeals', 'execution', 'archived'];
              const currentIdx = stages.indexOf(selectedCase.stage);
              const isPassed = idx <= (currentIdx === -1 ? 1 : currentIdx);
              const isCurrent = idx === (currentIdx === -1 ? 1 : currentIdx);
              
              return (
                <div key={idx} className="flex flex-col items-center group relative z-10 space-y-3">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 shadow-md ${
                    isPassed 
                    ? 'bg-slate-900 text-amber-400 scale-110 shadow-slate-200' 
                    : 'bg-white text-slate-300 border border-slate-200'
                  } ${isCurrent ? 'ring-4 ring-amber-500/10' : ''}`}>
                    {isPassed && idx < (currentIdx === -1 ? 1 : currentIdx) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase text-center max-w-[80px] leading-tight transition-all ${
                    isPassed ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Details & Documentation */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Bento-style Archive Section */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-slate-50 text-amber-600 rounded-2xl border border-slate-100 shadow-sm">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900 tracking-tight">الأرشفة الإلكترونية المنظمة</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Structured Legal Workspace</p>
                </div>
              </div>
              <button className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                إيداع مستند جديد
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'pleadings', label: 'اللوائح الجوابية والاعتبارية', icon: FileText, count: 3, color: 'text-amber-600', bg: 'bg-amber-50' },
                { id: 'documents', label: 'المستندات الثبوتية والمرافعات', icon: Paperclip, count: 8, color: 'text-blue-600', bg: 'bg-blue-50' },
                { id: 'judgments', label: 'الأحكام والصكوك القضائية', icon: Gavel, count: 1, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'execution', label: 'قرارات التنفيذ (مادة ٣٤/٤٦)', icon: Zap, count: 2, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((cat) => (
                <div key={cat.id} className="p-5 border border-slate-100 rounded-3xl hover:border-amber-200 hover:shadow-md transition-all group cursor-pointer bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border border-transparent group-hover:border-white transition-all ${cat.bg} ${cat.color}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                      {cat.count} مستندات
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">{cat.label}</h4>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-4 mt-4 border-t border-slate-50">
                    <span>آخر تحديث: قبل يومين</span>
                    <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Deep Details Section */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="p-3.5 bg-slate-50 text-amber-600 rounded-2xl border border-slate-100">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-slate-900 tracking-tight">تفاصيل موضوع النزاع</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Foundation Context Details</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <p className="text-sm md:text-base leading-relaxed font-bold text-slate-700 text-justify">
                  {selectedCase.details || 'لم يتم إدخال تفاصيل مطولة بعد لهذا الملف القضائي.'}
                </p>
              </div>

              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 flex flex-col md:flex-row gap-6">
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-600">ملخص الربط:</span>
                  <div className="w-10 h-1 bg-amber-400 rounded-full"></div>
                </div>
                <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                  "{selectedCase.summary}"
                </p>
              </div>
            </div>
          </section>

          {/* AI Analysis Result (Light Mode Version) */}
          <AnimatePresence>
            {(isAiLoading || aiAnalysis) && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-6 relative z-10 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xl text-white tracking-tight">تحليل موكل (AI) المعمق</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sovereign Legal Intelligence</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">
                    V5.0 NEURAL CORE
                  </span>
                </div>

                {isAiLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-6 relative z-10">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-amber-500 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>
                    <p className="text-xs font-black tracking-widest text-slate-300 animate-pulse">جاري استنباط الأسانيد وفحص اللوائح التنفيذية...</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/50 p-8 rounded-[2rem] border border-slate-700 text-base leading-loose font-bold text-white text-justify relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                      <span className="text-[11px] uppercase font-black tracking-widest text-amber-400">ملخص الدراسة الفنية المقترحة للمرافعة</span>
                    </div>
                    <div className="whitespace-pre-line font-sans text-slate-200">
                      {aiAnalysis}
                    </div>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: AI Tools & Alerts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Gemini RAG Summarizer Card */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">موجز المستندات الذكي</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Gemini RAG Summarizer Engine</p>
              </div>
            </div>

            <div className="space-y-4">
              {caseDocumentMemo ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[12px] text-slate-600 leading-relaxed font-bold whitespace-pre-line italic">
                    {caseDocumentMemo}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                        setCaseDocumentMemo('');
                        onUpdateState('cases', { ...selectedCase, summary: '' });
                    }}
                    className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 text-[10px] font-black transition-all"
                  >
                    إعادة الصياغة / مسح الموجز 🗑️
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    rows={4}
                    value={caseDocumentText}
                    onChange={(e) => setCaseDocumentText(e.target.value)}
                    placeholder="ألصق نصوص المرافعة أو المستندات هنا لاستخراج ملخص آلي..."
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all"
                  />
                  
                  <button
                    type="button"
                    onClick={handleCaseSummarize}
                    disabled={isCaseSummarizing || !caseDocumentText.trim()}
                    className={`w-full py-3.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                      isCaseSummarizing 
                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                        : !caseDocumentText.trim()
                          ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isCaseSummarizing ? (
                      <div className="w-4 h-4 border-t-2 border-amber-500 rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>تلخيص المستند بـ Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Automated Protocol Card */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] -mr-12 -mt-12"></div>
            
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4 relative z-10">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">بروتوكول الإشعارات التلقائية</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Automated Client Broadcast Protocol</p>
              </div>
            </div>

            {/* Toggle Status Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center relative z-10 shadow-inner">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-900 font-black block">إرسال تلقائي للموكل</span>
                <span className="text-[9px] text-emerald-600 font-black uppercase">Active via WhatsApp Gateway</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentVal = (selectedCase as any).whatsappNotificationsEnabled !== false;
                  onUpdateState('cases', { ...selectedCase, whatsappNotificationsEnabled: !currentVal });
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                    (selectedCase as any).whatsappNotificationsEnabled !== false ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-300 ease-in-out ${
                   (selectedCase as any).whatsappNotificationsEnabled !== false ? '-translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Quick Status Switches */}
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-4">تحفيز بث الإشعار الفوري:</span>
              
              <div className="space-y-2">
                {[
                  { id: 'active', label: 'نشطة مرافعة جارية', color: 'blue' },
                  { id: 'judgment_issued', label: 'حكم قضائي صادر', color: 'amber' },
                  { id: 'closed', label: 'إغلاق وتصفية الملف', color: 'rose' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStatusTransition(selectedCase, st.id)}
                    className={`w-full py-3 px-4 rounded-xl text-[10.5px] font-black flex items-center justify-between border-2 transition-all group ${
                      selectedCase.status === st.id
                        ? `bg-slate-900 text-white border-slate-900 shadow-lg`
                        : `bg-white text-slate-600 border-slate-100 hover:border-amber-200`
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        selectedCase.status === st.id ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'
                      }`} />
                      <span>{st.label}</span>
                    </span>
                    {selectedCase.status === st.id && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery History Log */}
            <div className="space-y-4 pt-4 border-t border-slate-50 relative z-10">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">سجل البث لقنوات الواتساب</span>
              <div className="space-y-2.5">
                {whatsAppLogs.filter(log => log.caseNumber === selectedCase.caseNumber).length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-50 rounded-3xl flex flex-col items-center justify-center gap-3">
                    <MessageSquare className="w-6 h-6 text-slate-200" />
                    <p className="text-[10px] text-slate-300 font-black uppercase">No delivery events logged yet</p>
                  </div>
                ) : (
                  whatsAppLogs.filter(log => log.caseNumber === selectedCase.caseNumber).map((log, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`font-black uppercase ${log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.status === 'success' ? 'SENT SUCCESS' : 'FAILED'}
                        </span>
                        <span className="text-slate-400 font-mono font-bold">{log.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-bold leading-tight">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Parties Insight */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-6 shadow-sm overflow-hidden group">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">أطراف النزاع</h3>
            </div>
            <div className="space-y-4">
               <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all">
                  <span className="text-[9px] text-slate-400 font-black uppercase block mb-1">المدعي (نظامي)</span>
                  <p className="text-sm font-black text-slate-900">{selectedCase.clientName}</p>
               </div>
               <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:bg-rose-50 hover:border-rose-100 transition-all group/opp">
                  <span className="text-[9px] text-slate-400 font-black uppercase block mb-1 group-hover/opp:text-rose-600">الطرف الخصم</span>
                  <p className="text-sm font-black text-slate-900 uppercase">{selectedCase.opponentName}</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedCaseDetail;
