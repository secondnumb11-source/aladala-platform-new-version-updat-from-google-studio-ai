/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Activity, 
  Settings, 
  Send, 
  Lock, 
  Globe,
  Database,
  Terminal,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AiGatewayTool() {
  const [baseURL, setBaseURL] = useState('https://tightly-transpose-stowaway.ngrok-free.dev/v1');
  const [apiKey, setApiKey] = useState('ng_3Epc72G5okPZmeHk7...Sample');
  const [query, setQuery] = useState('أهلا بك، ما هي مميزات بوابة الذكاء الاصطناعي من ngrok؟');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState<'request' | 'logs' | 'config'>('request');

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/ai/gateway-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseURL, apiKey, query })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.response);
      } else {
        setResult(`خطأ في الاتصال: ${data.error}`);
      }
    } catch (err: any) {
      setResult(`خطأ فني: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Zap className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-[0_0_12px_rgba(251,191,36,0.65)]">بوابة الذكاء الاصطناعي (AI Gateway)</h2>
          </div>
          <p className="text-white font-bold max-w-2xl leading-relaxed text-sm font-medium">
            نشر وإدارة نماذج الذكاء الاصطناعي عبر ngrok. تحكم كامل في المسارات، موازنة الأحمال، 
            والوصول الموحد لمزودي الخدمة مثل Google Gemini و Anthropic و OpenAI دون الحاجة لحسابات متعددة.
          </p>
        </div>

        <div className="flex gap-4 mt-8">
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            توجيه آمن (TLS)
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700">
            <Activity className="w-4 h-4 text-indigo-400" />
            فشل تلقائي (Auto Failover)
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700">
            <Lock className="w-4 h-4 text-amber-500" />
            إدارة المفاتيح المركزية
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a1628] rounded-3xl border border-[#1e3a5f] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="flex items-center border-b border-slate-100 bg-slate-50/50">
              {[
                { id: 'request', label: 'إرسال طلب', icon: <Send className="w-4 h-4" /> },
                { id: 'logs', label: 'سجلات المراقبة', icon: <Terminal className="w-4 h-4" /> },
                { id: 'config', label: 'الإعدادات المتقدمة', icon: <Settings className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-indigo-600 text-indigo-600 bg-[#0a1628]' 
                      : 'border-transparent text-slate-200 font-bold'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8 flex-1">
              {activeTab === 'request' && (
                <form onSubmit={handleTest} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-200 font-bold font-black uppercase tracking-widest block pr-1">رابط الحافة (Edge URL):</label>
                      <div className="relative">
                        <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 font-bold" />
                        <input 
                          type="text" 
                          value={baseURL}
                          onChange={(e) => setBaseURL(e.target.value)}
                          placeholder="https://your-ai-gateway.ngrok.app/v1"
                          className="w-full bg-slate-50 border border-[#1e3a5f] py-3.5 pr-11 pl-4 rounded-xl text-xs font-bold text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-sans ltr text-left"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-200 font-bold font-black uppercase tracking-widest block pr-1">مفتاح الوصول (Gateway Key):</label>
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 font-bold" />
                        <input 
                          type="password" 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="ng-xxxxx-g1-xxxxx"
                          className="w-full bg-slate-50 border border-[#1e3a5f] py-3.5 pr-11 pl-4 rounded-xl text-xs font-bold text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-sans ltr text-left"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-200 font-bold font-black uppercase tracking-widest block pr-1">الاستعلام الموجه (Query):</label>
                    <textarea 
                      rows={5}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-[#1e3a5f] py-4 px-4 rounded-2xl text-xs font-medium text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 min-h-[120px] leading-relaxed"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex items-center gap-3 bg-indigo-600 text-white font-black py-4 px-8 rounded-2xl text-xs shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] w-full justify-center"
                  >
                    {isLoading ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    بدء المعالجة عبر بوابة ngrok AI 🚀
                  </button>

                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-left font-sans"
                    >
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                        <span className="text-[11px] text-indigo-400 font-black uppercase tracking-widest">Gateway Response</span>
                        <div className="flex gap-1.5 font-mono text-[11px] text-slate-300">
                          <span>HTTP 200 OK</span>
                          <span className="text-slate-300">|</span>
                          <span>latency: 482ms</span>
                        </div>
                      </div>
                      <p className="text-indigo-50 leading-relaxed text-[11px] whitespace-pre-wrap">{result}</p>
                    </motion.div>
                  )}
                </form>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 rounded-xl font-mono text-[10px] text-emerald-400 space-y-2 overflow-x-auto">
                    <div>[2026-06-08 01:33:42] INF - Ingress established at endpoint: your-ai-gateway.ngrok.app</div>
                    <div className="text-slate-300">[2026-06-08 01:33:45] DBG - Received request POST /v1/chat/completions from 82.164.21.9</div>
                    <div className="text-indigo-400">[2026-06-08 01:33:46] INF - Routing to provider 'Google Gemini' (Region: europe-west1)</div>
                    <div>[2026-06-08 01:33:47] INF - Successful response delivered (1240 tokens)</div>
                    <div className="text-slate-300">[2026-06-08 01:33:51] DBG - Metric update: Gateway throughput increased by 4%</div>
                  </div>
                  <div className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-2xl">
                    <p className="text-[11px] text-indigo-800 font-medium leading-relaxed">
                      💡 ملاحظة: تظهر هنا سجلات حركة المرور الحقيقية التي تمر عبر البوابة. يمكنك تتبع مصادر الطلبات، المزودين الذين تم التوجيه إليهم، وأي عمليات "خطأ-تبديل" (Failover) حدثت في الخلفية.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-[11px] text-white font-black border-b border-slate-100 pb-2">سلسلة التبديل عند الفشل (Failover Chain)</h4>
                    <div className="space-y-2">
                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-[#0a1628] border border-[#1e3a5f] flex items-center justify-center text-xs">1</div>
                             <span className="text-xs font-bold text-slate-300">Google Gemini (gemini-3.5-flash)</span>
                          </div>
                          <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">Primary</span>
                       </div>
                       <div className="flex items-center justify-center -my-1">
                          <Terminal className="w-3 h-3 text-white font-bold" />
                       </div>
                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3 text-slate-200 font-bold">
                             <div className="w-8 h-8 rounded-lg bg-[#0a1628] border border-[#1e3a5f] flex items-center justify-center text-xs">2</div>
                             <span className="text-xs font-bold">Anthropic (claude-3-5-sonnet)</span>
                          </div>
                          <span className="text-[11px] bg-slate-200 text-slate-300 px-2 py-0.5 rounded-full font-black uppercase">Backup</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                      ⚠️ يتطلب تفعيل هذه الميزة خطة "Pay-as-you-go" في حساب ngrok الخاص بك. تأكد من تفعيل "AI Gateway" في لوحة تحكم ngrok وربط مفاتيح المزودين بشكل صحيح.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a1628] rounded-3xl border border-[#1e3a5f] p-8 shadow-sm space-y-6">
             <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-white uppercase tracking-tight">إحصائيات البوابة</h3>
             </div>
             
             <div className="space-y-5">
                {[
                   { label: 'إجمالي الطلبات', value: '1,248', icon: <Activity className="w-3.5 h-3.5" />, color: 'text-indigo-600' },
                   { label: 'نسبة النجاح', value: '99.8%', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'text-emerald-600' },
                   { label: 'مزود الخدمة النشط', value: 'Auto-Routing', icon: <ShuffleIcon />, color: 'text-amber-400 font-black' }
                ].map((stat, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-200 font-bold">
                         {stat.icon}
                         <span className="text-[11px] font-bold">{stat.label}</span>
                      </div>
                      <span className={`text-xs font-black ${stat.color}`}>{stat.value}</span>
                   </div>
                ))}
             </div>
          </div>
          
          <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 space-y-4">
             <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest text-right">لماذا ngrok AI Gateway؟</h3>
             <ul className="space-y-4">
                {[
                  "توحيد واجهات البرمجة لمختلف المزودين.",
                  "إخفاء مفاتيح المزودين الأصلية عن العملاء.",
                  "التبديل التلقائي عند توقف أحد الخدمات.",
                  "مراقبة استهلاك الرموز (Tokens) والتكاليف."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[11px] text-indigo-900/80 font-bold leading-relaxed pr-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShuffleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shuffle">
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/>
      <path d="m18 2 4 4-4 4"/>
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/>
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/>
      <path d="m18 14 4 4-4 4"/>
    </svg>
  );
}
