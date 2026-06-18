/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  FileText, 
  FileCheck,
  FileSearch, 
  Search, 
  CalendarRange, 
  DollarSign, 
  Cpu, 
  Zap, 
  MessageSquare,
  Database,
  ArrowRight,
  Scale,
  CheckCircle2
} from 'lucide-react';

// Import new tool components
const AIDraftingTool = React.lazy(() => import('./AI/AIDraftingTool'));
const AIAnalysisTool = React.lazy(() => import('./AI/AIAnalysisTool'));
const AILegalSearch = React.lazy(() => import('./AI/AILegalSearch'));
const AIDeadlinesTool = React.lazy(() => import('./AI/AIDeadlinesTool'));
const AiGatewayTool = React.lazy(() => import('./AiGatewayTool'));
const AISwotTool = React.lazy(() => import('./AI/AISwotTool'));
const AIContractAuditTool = React.lazy(() => import('./AI/AIContractAuditTool'));
const AIFinanceTool = React.lazy(() => import('./AI/AIFinanceTool'));
const AILegalRiskMatrix = React.lazy(() => import('./AI/AILegalRiskMatrix'));
const AIZatcaTool = React.lazy(() => import('./AI/AIZatcaTool'));

interface AIModuleProps {
  onUpdateState: (type: string, data: any) => void;
  cases?: any[];
  invoices?: any[];
  initialTab?: 'advisor' | 'drafting' | 'analysis' | 'swot' | 'search' | 'deadlines' | 'gateway' | 'finance' | 'contract_audit' | 'risk_matrix' | 'zatca';
}

export default function AIModule({ onUpdateState, cases = [], invoices = [], initialTab = 'advisor' }: AIModuleProps) {
  const [activeTab, setActiveTab] = useState<'advisor' | 'drafting' | 'analysis' | 'swot' | 'search' | 'deadlines' | 'gateway' | 'finance' | 'contract_audit' | 'risk_matrix' | 'zatca'>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
    {
      sender: 'bot',
      text: "أهلاً بك زميلي العزيز المستشار. أنا مساعد الذكاء الاصطناعي القانوني المخصص لمكتب العدالة. يمكنني مساعدتك في صياغة اللوائح الاعتراضية، تتبع أحكام نظام المعاملات المدنية، المادة 77 العمالية، أو صيانة صكوك التحكيم بالمملكة. كيف يمكنني إسناد عملكم اليوم؟",
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleAdvisorChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = { 
      sender: 'user' as const, 
      text: aiInput, 
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) 
    };
    setChatHistory(prev => [...prev, userMsg]);
    setIsAiLoading(true);
    const currentInput = aiInput;
    setAiInput('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: currentInput }]
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [...prev, {
          sender: 'bot',
          text: data.response,
          time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch {
      setChatHistory(prev => [...prev, {
        sender: 'bot',
        text: "عذراً زميلي، تعطل الاتصال بالخادم، جاري الارتداد للتلخيص المحلي المعرب.",
        time: "الآن"
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      
      {/* Top Banner and Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900 text-amber-500 rounded-3xl shadow-2xl">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              المساعد القانوني الخارق AI
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-black px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest font-black">Pro Version</span>
            </h1>
            <p className="text-slate-200 font-bold text-sm mt-1 font-bold">منظومة ذكاء اصطناعي متكاملة لدعم صياغة وتحليل وبحث الأنظمة السعودية.</p>
          </div>
        </div>

        <div className="flex flex-wrap bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-1 shadow-inner">
          {[
            { id: 'advisor', name: 'المستشار', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'drafting', name: 'الصياغة', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'risk_matrix', name: 'مصفوفة المخاطر', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'swot', name: 'تحليل SWOT', icon: <Scale className="w-3.5 h-3.5" /> },
            { id: 'analysis', name: 'التحليل العادي', icon: <FileSearch className="w-3.5 h-3.5" /> },
            { id: 'search', name: 'البحث والأنظمة', icon: <Search className="w-3.5 h-3.5" /> },
            { id: 'contract_audit', name: 'تدقيق العقود', icon: <FileCheck className="w-3.5 h-3.5" /> },
            { id: 'deadlines', name: 'المهل وتنبيهات', icon: <CalendarRange className="w-3.5 h-3.5" /> },
            { id: 'finance', name: 'المالية AI', icon: <DollarSign className="w-3.5 h-3.5" /> },
            { id: 'zatca', name: 'الفواتير المعتمدة ZATCA', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
            { id: 'gateway', name: 'البوابة', icon: <Zap className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-700'
              } `}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[700px]">
        {activeTab === 'advisor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chat Room */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl flex flex-col h-[700px] overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <h4 className="text-sm font-black text-slate-900">غرفة المشورة القانونية المباشرة</h4>
                </div>
                <div className="text-[10px] font-black text-slate-200 font-bold uppercase tracking-widest">Powered by Gemini 1.5 Pro</div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col gap-2 max-w-[85%] ${msg.sender === 'user' ? 'mr-auto items-end' : 'ml-auto items-start'}`}
                  >
                    <div className={`px-6 py-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                    } `}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-200 font-bold font-bold px-2">{msg.time}</span>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex flex-col gap-2 opacity-70 animate-pulse">
                    <div className="px-6 py-4 bg-white border border-slate-100 rounded-3xl rounded-tl-none text-sm font-bold text-slate-200 font-bold flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150"></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-300"></div>
                      </div>
                      بانتظار الرأي من Gemini...
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleAdvisorChatSubmit} className="relative">
                  <input 
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="وجه تساؤلك أو اطلب صياغة رأي قانوني هنا..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 pr-6 pl-16 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition-all font-sans"
                  />
                  <button 
                    type="submit"
                    disabled={isAiLoading || !aiInput.trim()}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar with quick actions */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -translate-y-16 translate-x-16"></div>
                <h4 className="text-white font-black text-lg mb-4 flex items-center gap-2 relative z-10">
                  <Database className="w-6 h-6 text-amber-500" />
                  تحليل البيانات الضخمة (RAG)
                </h4>
                <p className="text-slate-200 font-bold text-xs font-bold leading-relaxed mb-6 relative z-10">قم برفع ملفات القضية لمساءلتها دلالياً واستخراج الإجابات من متونها مباشرة.</p>
                <button className="w-full bg-amber-500 text-slate-950 py-3 rounded-2xl text-xs font-black shadow-lg transition-all relative z-10">تفعيل الفهرسة المتجهة 📂</button>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl">
                <h4 className="text-slate-900 font-black text-sm mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  قوالب الذكاء السريع
                </h4>
                <div className="space-y-3">
                  {[
                    "حلل موقف العميل في دعوى عمالية",
                    "صغ دفعاً بعدم الاختصاص المكاني",
                    "تلخيص حكم صادر من الاستئناف",
                    "تأكد من توافق عقد تأسيس مع نظام الشركات"
                  ].map((tpl, i) => (
                    <button 
                      key={i}
                      onClick={() => setAiInput(tpl)}
                      className="w-full text-right p-4 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-200 font-bold border border-slate-100 transition-all group flex items-center justify-between"
                    >
                      {tpl}
                      <ArrowRight className="w-3.5 h-3.5 text-white font-bold" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <React.Suspense fallback={<div className="h-96 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-[2.5rem] animate-pulse gap-4 text-slate-500 font-bold"><div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>جاري تحميل أداة الذكاء الاصطناعي...</div>}>
          {activeTab === 'drafting' && <AIDraftingTool cases={cases} />}
          {activeTab === 'risk_matrix' && <AILegalRiskMatrix cases={cases} />}
          {activeTab === 'swot' && <AISwotTool />}
          {activeTab === 'analysis' && <AIAnalysisTool />}
          {activeTab === 'search' && <AILegalSearch />}
          {activeTab === 'deadlines' && <AIDeadlinesTool />}
          {activeTab === 'finance' && <AIFinanceTool invoices={invoices} />}
          {activeTab === 'zatca' && <AIZatcaTool invoices={invoices} />}
          {activeTab === 'contract_audit' && <AIContractAuditTool />}
          {activeTab === 'gateway' && <AiGatewayTool />}
        </React.Suspense>
      </div>
    </div>
  );
}
