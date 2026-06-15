/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  X, 
  Check, 
  Sparkles, 
  Smartphone, 
  Eye, 
  HelpCircle,
  AlertTriangle,
  Play,
  Sun,
  Moon,
  Clock,
  Calendar,
  ChevronDown,
  Archive,
  MailOpen,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

interface WhatsappTemplate {
  id: string;
  name: string;
  triggerEvent: string;
  messageText: string;
  active: boolean;
  variables: string[];
}

interface MotionLuminanceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

function MotionLuminanceCard({ children, className = '', active, ...props }: MotionLuminanceCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  // High accessibility and contrast mode: force pure brilliant white text (#ffffff) and brilliant yellow accent (#ffff00) for ease of reading on strong dark backgrounds.
  const textColor = '#ffffff';
  const accentColor = '#ffff00';
  const mutedColor = '#ffff00'; // Brilliant yellow to guide eyes easily
  const borderColor = 'rgba(255, 255, 255, 0.25)';
  const bgClass = 'backdrop-blur-2xl text-right border-white/30';

  return (
    <motion.div
      ref={cardRef}
      {...(props as any)}
      style={{
        color: textColor,
        '--card-text': textColor,
        '--card-accent': accentColor,
        '--card-muted': mutedColor,
        '--card-border': borderColor,
        borderColor: borderColor,
        ...props.style
      } as any}
      className={`rounded-2xl border transition-all duration-500 shadow-xl overflow-hidden ${bgClass} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export default function WhatsappTemplates() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([
    {
      id: 'tp-24h',
      name: '⏰ تذكير آلي بالجلسة المرافعة الشرعية قبل الموعد بـ 24 ساعة ⚡',
      triggerEvent: 'اقتراب موعد الجلسة بـ 24 ساعة',
      messageText: 'تذكير عدلي عاجل: المحترم {اسم_الالعدالة}، نحيط سعادتكم علماً باقتراب تاريخ جلسة المرافعة المجدولة لدعواكم المقيدة برقم {رقم_القضية} صبيحة يوم غدٍ أي بعد أقل من 24 ساعة بالتحديد (الموافق: {تاريخ_الجلسة} الساعة {ساعة_الجلسة} بتوقيت الرياض). نأمل منكم التواجد وتأكيد الحضور مع المستشار القضائي والعميل الشرعي والمرافع المسؤول مسبقاً. موكل ⚖️.',
      active: true,
      variables: ['{اسم_الالعدالة}', '{رقم_القضية}', '{تاريخ_الجلسة}', '{ساعة_الجلسة}']
    },
    {
      id: 'tp-1',
      name: 'ترحيب وتسليم بوابة الالعدالةين (العدالة) 🔑',
      triggerEvent: 'تسجيل العدالة جديد',
      messageText: 'أهلاً بك الالعدالة الكريم {اسم_الالعدالة}، يسعدنا في موكل إعلامكم بتهيئة بوابتكم الرقمية التفاعلية بنجاح. يمكنك مراجعة لوائح الدعوى ومستندات صك الدعوى فوراً عبر الرابط السري المرفق: {رابط_البوابة}. نسعى لخدمتكم بنزاهة ⚖️.',
      active: true,
      variables: ['{اسم_الالعدالة}', '{رابط_البوابة}']
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsappTemplate>(templates[0]);
  const [testPhoneNumber, setTestPhoneNumber] = useState('+966501234567');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [editorText, setEditorText] = useState(templates[0].messageText);
  const [activeTab, setActiveTab] = useState<'new_notification' | 'outbox' | 'templates' | 'drafts'>('new_notification');
  const [automatedRemindersActive, setAutomatedRemindersActive] = useState(true);
  const [cronCountdown, setCronCountdown] = useState(30);
  const [sentSearchTerm, setSentSearchTerm] = useState('');
  
  const [scheduledHearings, setScheduledHearings] = useState([
    {
      id: "sh-1",
      caseNumber: "437194619",
      caseName: "نزاع عقد توريد خدمات لوجستية",
      clientName: "شركة نادك للتنمية الزراعية",
      clientPhone: "+966504499122",
      hearingDate: "غداً (15 يونيو 2026)",
      hearingTime: "10:30 صباحاً",
      courtName: "المحكمة التجارية بالرياض",
      sentStatus: "pending", 
    }
  ]);

  const [sentMessages] = useState([
    { id: 1, client: 'شركة نادك للتنمية', caseName: 'نزاع تجاري', date: '2026-06-12', msg: 'تذكير بموعد الجلسة غداً...', status: 'success' },
  ]);

  const [drafts] = useState([
    { id: 'd-1', recipient: 'فهد العتيبي', subject: 'تنبيه موعد خبير', date: '2026-06-13', content: 'نحيطكم علما بأن الدائرة قررت ندب خبير...' },
  ]);

  const filteredSentMessages = sentMessages.filter(row => row.client.includes(sentSearchTerm));

  const handleSelectTemplate = (tp: WhatsappTemplate) => {
    setSelectedTemplate(tp);
    setEditorText(tp.messageText);
  };

  const handleUpdateTemplateText = () => {
    setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? { ...t, messageText: editorText } : t));
    alert('تم الحفظ');
  };

  const handleToggleTemplate = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const handleSendTestMessage = async () => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      setTestSendResult('success');
      setTimeout(() => setTestSendResult('idle'), 3000);
    }, 1500);
  };

  const handleDispatchHearingReminder = (id: string) => {
    setScheduledHearings(prev => prev.map(h => h.id === id ? { ...h, sentStatus: 'sent' } : h));
  };

  const getRenderedPreview = (text: string) => {
    return text
      .replace(/{اسم_الالعدالة}/g, 'شركة نادك للتنمية الزراعية 🏢')
      .replace(/{رابط_البوابة}/g, 'https://justice.sa/portal')
      .replace(/{رقم_القضية}/g, '437194619');
  };

  return (
    <div className="space-y-8 text-right animate-fade-in font-sans pb-10" dir="rtl">
      
      {/* Top Banner - Dark Blue Theme */}
      <MotionLuminanceCard className="p-8 relative bg-[#02050f] border-2 border-blue-900/50 shadow-2xl overflow-hidden ring-4 ring-blue-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/40 blur-[150px] rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-4">
            <span className="text-[12px] text-yellow-300 bg-yellow-900/40 border-2 border-yellow-700 px-6 py-2 rounded-full font-black flex items-center gap-2 w-fit uppercase tracking-widest shadow-lg">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              مركز التحكم التلقائي وإشعارات الواتساب
            </span>
            <h1 className="text-3xl md:text-5xl font-black mt-4 tracking-tighter text-white drop-shadow-md">إشعارات ومراسلة العملاء المعتمدة</h1>
            <p className="text-lg opacity-90 mt-4 font-bold leading-relaxed max-w-2xl text-blue-100 drop-shadow-sm">
              إدارة الإشعارات النصية ورسائل الواتساب، إنشاء قوالب جاهزة، ومتابعة سجل المراسلات الصادرة للعملاء بكل سهولة ونزاهة واحترافية.
            </p>
          </div>
          <button
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="p-4 rounded-3xl border-2 border-blue-700 bg-blue-950 hover:bg-blue-900 transition-all active:scale-95 shadow-xl backdrop-blur-3xl group"
          >
            {theme === 'dark' ? <Sun className="w-8 h-8 text-yellow-300 group-hover:rotate-45 transition-transform duration-500"/> : <Moon className="w-8 h-8 text-yellow-200"/>}
          </button>
        </div>
      </MotionLuminanceCard>

      <div className="bg-[#02050f] border-2 border-emerald-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 group transition-all hover:border-emerald-500/50 ring-4 ring-emerald-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 space-y-4 text-right">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
            <h3 className="font-black text-white text-xl tracking-tight drop-shadow-md">نظام الأتمتة: رسائل تذكير العملاء (WhatsApp & Email)</h3>
          </div>
          <p className="text-xs font-bold leading-loose text-blue-100/80 max-w-2xl drop-shadow-sm">
            يقوم النظام التلقائي برصد الجلسات القانونية التي يتبقى على موعد انعقادها أقل من 24 ساعة، ويبدأ ببث رسائل تذكير للعملاء المعنيين لضمان الالتزام والحضور.
            <span className="block mt-2 text-yellow-300 font-black">يتم استخدام "قالب تذكير 24 ساعة" المعرف أدناه في عملية البث التلقائي.</span>
          </p>
        </div>
        <button 
          onClick={() => {
            alert('جاري مسح الجلسات وإرسال الإشعارات... تم استهداف 3 عملاء لديهم جلسات قضائية خلال 24 ساعة عبر المنصة بنجاح.');
          }}
          className="relative z-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-4 rounded-xl flex items-center gap-4 transition-all shadow-lg active:scale-95 border-b-4 border-emerald-900 group-hover:shadow-emerald-500/20"
        >
          <Send className="w-5 h-5 animate-bounce" />
          <span className="text-base">تشغيل بث الإشعارات الآن</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-[#02050f] border-2 border-blue-900/50 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xl ring-4 ring-blue-900/10">
        {[
          { id: 'new_notification', label: 'الإشعارات الجديدة', icon: Send },
          { id: 'drafts', label: 'مسودات الرسائل', icon: Smartphone },
          { id: 'outbox', label: 'المراسلات الصادرة', icon: Clock },
          { id: 'templates', label: 'قوالب الرسائل الجاهزة', icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap border-2 ${
                isActive 
                  ? 'bg-yellow-400 text-black shadow-lg border-yellow-300 scale-105 z-10' 
                  : 'text-white border-white/10 bg-white/5 hover:bg-yellow-400/10 hover:text-yellow-400 hover:border-yellow-400/40'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-yellow-400'}`} />
              <span className="drop-shadow-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 text-right" dir="rtl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <MotionLuminanceCard className="p-6 space-y-6 bg-[#02050f] border-2 border-blue-900/50 shadow-xl ring-2 ring-blue-900/20">
                <h3 className="text-xl font-black tracking-tight text-white uppercase drop-shadow-sm border-r-4 border-blue-800 pr-5">اختر قالب الإشعار للضبط والمراجعة:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tp => (
                    <div 
                      key={tp.id}
                      onClick={() => handleSelectTemplate(tp)}
                      className={`p-5 rounded-2xl border-2 transition-all duration-500 cursor-pointer flex flex-col justify-between gap-4 overflow-hidden relative group shadow-lg ${
                        selectedTemplate.id === tp.id 
                          ? 'border-yellow-700 bg-[#2b1e02] shadow-md scale-[1.01]' 
                          : 'border-blue-900/50 bg-[#050b18] hover:border-blue-700 hover:bg-[#0a152e]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-base font-black text-white group-hover:text-yellow-300 transition-colors leading-tight drop-shadow-sm">{tp.name}</h4>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleTemplate(tp.id); }}
                          className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm border transition-all ${
                            tp.active ? 'bg-emerald-900 text-emerald-100 border-emerald-700' : 'bg-gray-900 border-gray-700 text-gray-400 opacity-60'
                          }`}
                        >
                          {tp.active ? 'نشط' : 'متوقف'}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-gray-100 line-clamp-2 bg-black/40 p-3 rounded-xl border border-blue-900/30 group-hover:border-blue-700 transition-all leading-relaxed">{tp.messageText}</p>
                    </div>
                  ))}
                </div>
              </MotionLuminanceCard>

              <MotionLuminanceCard className="p-6 space-y-6 bg-[#1f1602] border-2 border-yellow-900 shadow-xl">
                <h3 className="text-xl font-black border-b-2 border-yellow-900/50 pb-4 text-yellow-300 drop-shadow-sm">تحرير محتوى القالب</h3>
                <textarea
                  rows={6}
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  className="w-full bg-[#050505] border-2 border-yellow-400/40 rounded-2xl p-4 text-sm font-bold text-white leading-relaxed outline-none focus:border-yellow-400 transition-all placeholder:text-white/20 shadow-inner"
                  placeholder="أدخل نص القالب هنا..."
                />
                <div className="flex justify-end">
                  <button onClick={handleUpdateTemplateText} className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 border-b-4 border-yellow-700">
                    <CheckCircle className="w-5 h-5 text-black" />
                    <span>حفظ التغييرات النهائية</span>
                  </button>
                </div>
              </MotionLuminanceCard>
            </div>

            <div className="lg:col-span-4 space-y-12">
              <div className="bg-[#020805] border-[16px] border-[#0a0a0a] rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative h-[650px] flex flex-col overflow-hidden scale-100 origin-top group ring-8 ring-emerald-900/10">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-8 w-36 bg-[#0a0a0a] rounded-b-[2rem] z-20 border-x-2 border-b-2 border-white/5"></div>
                <div className="bg-[#062622] pt-12 pb-6 px-6 flex items-center justify-between text-white border-b border-black/20 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-900/50 border-2 border-emerald-700 p-1 animate-pulse overflow-hidden shadow-inner">
                       <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=LegalOffice" alt="Office" className="w-full h-full rounded-full" />
                    </div>
                    <div className="text-right">
                       <h4 className="text-[15px] font-bold tracking-tight text-white drop-shadow-md">مكتب العدالة للمحاماة</h4>
                       <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                        نشط الآن
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-end gap-6 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-contain bg-blend-soft-light bg-[#050f0c]">
                   <div className="self-center bg-[#0a1a15] text-emerald-100 text-[11px] font-bold py-2 px-6 rounded-full uppercase tracking-widest shadow-xl border-2 border-emerald-900">اليوم</div>
                  <div className="bg-[#052922] text-white p-7 rounded-[2.5rem] rounded-tr-none text-[15px] leading-relaxed shadow-lg self-start max-w-[90%] whitespace-pre-line font-medium relative border-l-6 border-yellow-600 shadow-black/50">
                    {getRenderedPreview(editorText)}
                    <div className="text-[11px] text-yellow-300 mt-4 text-left flex justify-between items-center font-black">
                       <span className="opacity-70">11:43 م</span>
                       <span className="text-yellow-400 flex items-center gap-1">
                          <Check className="w-4 h-4 text-yellow-400 stroke-[4px]" />
                          <Check className="w-4 h-4 -mr-2 text-yellow-400 stroke-[4px]" />
                       </span>
                    </div>
                  </div>
                  <div className="bg-black/90 backdrop-blur-xl border-2 border-white/10 p-5 rounded-3xl text-[12px] text-white text-center leading-relaxed font-black shadow-2xl ring-1 ring-white/5">
                    🛡️ الرسائل مشفرة تماماً ومحمية بنظام أمني عالي النزاهة.
                  </div>
                </div>
                <div className="bg-[#121b22] p-6 flex items-center gap-4 border-t border-white/10 shadow-2xl">
                   <div className="bg-[#2a3942] flex-1 py-4 px-8 rounded-full text-sm text-white/70 text-right font-black border-2 border-white/10">اكتب رسالتك...</div>
                   <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-[0_10px_20px_-5px_rgba(16,185,129,0.5)] active:scale-90 transition-all cursor-pointer border-2 border-emerald-400">
                      <Send className="w-6 h-6 translate-x-1 text-black" />
                   </div>
                </div>
              </div>

              <MotionLuminanceCard className="p-8 space-y-8 bg-[#02050f] border-2 border-blue-900 shadow-2xl ring-4 ring-blue-900/20">
                <h4 className="text-lg font-black flex items-center gap-3 text-white">
                  <div className="p-2 bg-blue-900/40 rounded-xl border border-blue-700 shadow-inner">
                    <Play className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  </div>
                  <span className="text-white drop-shadow-sm">نبض الإرسال التجريبي (API Endpoint)</span>
                </h4>
                <div className="space-y-3">
                   <label className="text-[12px] text-blue-200/80 font-bold uppercase tracking-widest block">رقم هاتف تجربة الرسائل الموثق:</label>
                   <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="+966..."
                    className="w-full bg-[#050b18] border-2 border-blue-900/50 rounded-2xl py-3 px-6 text-xl font-mono text-center text-yellow-300 outline-none focus:border-yellow-700 transition-all font-black shadow-inner"
                  />
                </div>
                <button
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest}
                  className="w-full bg-yellow-600 text-white py-3 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 hover:bg-yellow-500 active:scale-95 shadow-lg border-b-4 border-yellow-900"
                >
                  {isSendingTest ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span className="text-white">جاري معالجة الإرسال العدلي...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 text-yellow-300" />
                      <span className="text-white text-base">بث نبضة تجريبية فورية</span>
                    </>
                  )}
                </button>
              </MotionLuminanceCard>
            </div>
          </div>

          <MotionLuminanceCard className="p-8 border-t-8 border-yellow-400 shadow-2xl relative overflow-hidden bg-[#1f1602] ring-4 ring-yellow-500/10">
            <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-yellow-500/15 blur-[180px] rounded-full"></div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative z-10">
              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tighter text-white drop-shadow-md">محرك التذكير العدلي الذكي</h2>
                <div className="flex items-center gap-4">
                   <div className="h-2 w-20 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)]"></div>
                   <p className="text-lg font-bold text-yellow-400 italic drop-shadow-sm">مراقبة حية وجدولة فورية بالارتباط مع الأنظمة القضائية.</p>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-black/90 p-6 rounded-[2.5rem] border-2 border-white/10 backdrop-blur-3xl shadow-xl ring-2 ring-white/5">
                <div className="text-right">
                  <span className="text-[12px] text-white/50 font-black uppercase tracking-widest block mb-2">Engine Protocol:</span>
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-full border-2 border-white/10 ${automatedRemindersActive ? 'bg-emerald-400 animate-pulse shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                    <span className="text-xl font-black text-white">{automatedRemindersActive ? `نشط (${cronCountdown}ث)` : 'متوقف'}</span>
                  </div>
                </div>
                <div className="h-12 w-px bg-white/20 mx-2"></div>
                <button
                  onClick={() => setAutomatedRemindersActive(!automatedRemindersActive)}
                  className={`px-8 py-3 rounded-2xl text-base font-black transition-all shadow-lg active:scale-95 border-b-4 ${
                    automatedRemindersActive 
                      ? 'bg-rose-700 text-white border-rose-900 hover:brightness-110' 
                      : 'bg-emerald-700 text-white border-emerald-900 hover:brightness-110'
                  }`}
                >
                  {automatedRemindersActive ? 'إيقاف المحرك' : 'بدء البث'}
                </button>
              </div>
            </div>

            <div className="grid gap-6 relative z-10">
              {scheduledHearings.map(sh => (
                <div key={sh.id} className="bg-[#050b18]/80 border-2 border-white/10 p-6 rounded-3xl flex flex-col lg:grid lg:grid-cols-12 items-center gap-6 hover:border-yellow-400 transition-all group relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-transparent group-hover:bg-yellow-400 transition-all duration-300"></div>
                  
                  <div className="col-span-4 flex items-center gap-6 w-full">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center shrink-0 border-2 border-yellow-400/30 shadow-inner group-hover:bg-yellow-400/20 transition-all">
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="text-right">
                      <h4 className="font-black text-xl text-white group-hover:text-yellow-400 transition-colors drop-shadow-sm">{sh.clientName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-black text-white bg-blue-600/30 px-3 py-0.5 rounded-full border border-blue-500/40">قضية رقم: {sh.caseNumber}</span>
                      </div>
                      <p className="text-[11px] text-white/50 font-bold mt-1 uppercase tracking-widest">{sh.caseName}</p>
                    </div>
                  </div>

                  <div className="col-span-3 w-full">
                    <div className="bg-black border border-white/10 p-4 rounded-2xl inline-block w-full shadow-lg ring-1 ring-white/5">
                        <h5 className="text-[11px] font-black text-white/80 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-yellow-400/50"></div>
                          {sh.courtName}
                        </h5>
                        <div className="flex items-center gap-3 text-base font-black text-yellow-400">
                           <Calendar className="w-5 h-5" />
                           <span>{sh.hearingDate}</span>
                           <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg mr-auto text-[10px]">{sh.hearingTime}</span>
                        </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-center w-full">
                     <div className="font-mono text-lg font-black text-white tracking-widest mb-2 drop-shadow-md">{sh.clientPhone}</div>
                     <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border-2 shadow-lg transition-all ${
                       sh.sentStatus === 'sent' ? 'bg-emerald-600 text-white border-emerald-400' :
                       sh.sentStatus === 'sending' ? 'bg-yellow-400 text-black border-yellow-250 animate-bounce' :
                       'bg-black/60 text-white/40 border-white/10'
                     }`}>
                       {sh.sentStatus === 'sent' ? '✓ تم التوصيل' : sh.sentStatus === 'sending' ? 'جاري البث...' : 'في الانتظار'}
                     </span>
                  </div>

                  <div className="col-span-3 flex justify-end w-full">
                    {sh.sentStatus === 'pending' ? (
                      <button
                        onClick={() => handleDispatchHearingReminder(sh.id)}
                        className="bg-yellow-400 text-black px-8 py-3 rounded-2xl text-base font-black hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-3 border-b-4 border-yellow-700 w-full justify-center lg:w-auto"
                      >
                        <Send className="w-5 h-5" />
                        <span>بث نبضة فورية</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-emerald-600/20 px-6 py-3 rounded-2xl border-2 border-emerald-500/40 text-emerald-400 font-black text-base shadow-inner relative w-full lg:w-auto">
                         <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                         <CheckCircle className="w-6 h-6 text-emerald-400" />
                         <span>تمت المطابقة ✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </MotionLuminanceCard>
        </div>
      )}

      {activeTab === 'new_notification' && (
        <MotionLuminanceCard className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 border-2 border-blue-400 bg-[#010a1d] shadow-2xl relative overflow-hidden ring-4 ring-blue-500/10">
          <div className="absolute top-0 right-0 w-4 h-full bg-blue-600/80 shadow-[0_0_40px_rgba(37,99,235,0.8)]"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-2 border-white/10 pb-10 text-right relative z-10">
            <div className="space-y-4">
              <span className="text-[14px] bg-blue-600/30 text-white px-8 py-2 rounded-full border-2 border-blue-400/60 font-black tracking-widest inline-block uppercase shadow-lg">📤 إرسال إشعار فوري وبث تذكير</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white drop-shadow-md">إرسال إشعار مخصص للعملاء</h2>
              <p className="text-lg font-bold mt-4 text-white leading-relaxed drop-shadow-sm">قم بتحديد العميل والقضية واختر قالباً جاهزاً أو اكتب رسالة مخصصة ليتم بثها فوراً عبر القنوات الموثقة.</p>
            </div>
            <div className="flex items-center gap-6 bg-black/90 p-8 rounded-3xl border-2 border-white/10 shadow-xl backdrop-blur-3xl min-w-[320px] ring-2 ring-white/5">
               <div className="w-16 h-16 rounded-2xl bg-blue-600/30 flex items-center justify-center border-2 border-blue-400 shadow-lg">
                  <Send className="w-8 h-8 text-blue-400" />
               </div>
               <div className="text-right">
                  <span className="text-[12px] text-white/50 block font-black leading-none mb-2 tracking-widest uppercase">Security Level:</span>
                  <span className="text-2xl font-black text-white">WA API 2.8 (High)</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div className="space-y-3 text-right">
              <label className="text-sm font-black text-yellow-400 uppercase tracking-widest block drop-shadow-sm">العميل المستفيد:</label>
              <div className="relative group">
                <select className="w-full bg-[#051128] border-2 border-white/10 rounded-2xl py-4 px-6 text-base font-bold text-white outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer shadow-inner">
                  <option value="">-- اختر العميل من السجل --</option>
                  <option>شركة نادك للتنمية الزراعية</option>
                  <option>إسماعيل بن فيصل الحربي</option>
                  <option>عاصم بن طلال العقاد</option>
                </select>
                <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3 text-right">
              <label className="text-sm font-black text-yellow-400 uppercase tracking-widest block drop-shadow-sm">القضية / الملف العدلي:</label>
              <div className="relative group">
                <select className="w-full bg-[#051128] border-2 border-white/10 rounded-2xl py-4 px-6 text-base font-bold text-white outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer shadow-inner">
                  <option value="">-- اختر الملف المرتبط --</option>
                  <option>437194619 - نزاع تجاري دولي</option>
                  <option>419284711 - استخلاص مبالغ عقارية</option>
                </select>
                <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 pointer-events-none" />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3 text-right">
              <label className="text-sm font-black text-yellow-400 uppercase tracking-widest block drop-shadow-sm">اختيار قالب احترافي للبدء:</label>
              <div className="relative group">
                <select 
                  className="w-full bg-[#3a2905] border-2 border-yellow-400/60 rounded-2xl py-4 px-6 text-base font-bold text-yellow-300 outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer shadow-inner" 
                  onChange={(e) => {
                    const t = templates.find(temp => temp.id === e.target.value);
                    if (t) setEditorText(t.messageText);
                  }}
                >
                  <option value="">-- استعراض وتضمين القوالب الذكية الجاهزة --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-6 text-right relative z-10">
            <label className="text-lg font-black text-white flex items-center gap-3 drop-shadow-sm">
               <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
               <span>محتوى الإشعار الصادر (يدعم الرموز والوسائط):</span>
            </label>
            <textarea
              rows={6}
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              className="w-full bg-black/90 border-2 border-white/10 rounded-3xl p-8 text-xl font-bold text-white leading-relaxed focus:outline-none focus:border-blue-400 transition-all font-sans shadow-inner placeholder:text-white/10"
              placeholder="اكتب رسالة الإشعار العدلي هنا..."
            />
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pt-10 border-t-2 border-white/10">
             <label className="flex items-center gap-6 cursor-pointer group p-4 bg-black/80 rounded-2xl border border-white/10 hover:border-yellow-400 transition-all shadow-xl">
                <div className="w-10 h-10 rounded-lg border-2 border-white/20 bg-[#051128] flex items-center justify-center group-has-[:checked]:bg-yellow-400 group-has-[:checked]:border-yellow-300 transition-all shadow-inner">
                   <input type="checkbox" className="hidden" />
                   <Check className="w-6 h-6 text-black opacity-0 group-has-[:checked]:opacity-100 transition-opacity stroke-[4px]" />
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-white group-hover:text-yellow-400 transition-colors block leading-none mb-1 drop-shadow-sm">طلب توقيع رقمي معتمد ✍️</span>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Legal e-Signature Protocol</p>
                </div>
             </label>

             <div className="flex flex-wrap gap-4 w-full lg:w-auto">
               <button className="flex-1 lg:flex-none border-2 border-white/10 bg-white/5 text-white px-8 py-3 rounded-2xl text-base font-black hover:bg-white/10 transition-all active:scale-95 shadow-lg">حفظ كمسودة فنية</button>
               <button className="flex-1 lg:flex-none bg-blue-700 text-white px-10 py-3 rounded-2xl text-lg font-black shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 border-b-4 border-blue-950">
                 <Send className="w-6 h-6 text-white" />
                 <span>بث الإشعار الآن</span>
               </button>
             </div>
          </div>
        </MotionLuminanceCard>
      )}

      {activeTab === 'outbox' && (
        <MotionLuminanceCard className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 overflow-hidden relative bg-[#041c10] border-2 border-emerald-500 shadow-2xl ring-4 ring-emerald-500/10">
           <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-emerald-500/15 blur-[250px] rounded-full"></div>
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b-2 border-white/10 pb-12 text-right relative z-10">
              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tighter text-white drop-shadow-md">أرشيف المراسلات الصادرة</h2>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-20 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15]"></div>
                  <p className="text-lg font-bold text-yellow-400 drop-shadow-sm">سجل تاريخي كامل لجميع العمليات الصادرة وحالات التوصيل.</p>
                </div>
              </div>
              <div className="relative w-full lg:w-[35rem] group">
                <input 
                  type="text" 
                  value={sentSearchTerm}
                  onChange={(e) => setSentSearchTerm(e.target.value)}
                  placeholder="بحث سريع في سجلات البث..." 
                  className="w-full bg-black/90 border-4 border-white/10 rounded-2xl py-4 px-12 text-lg font-bold text-white outline-none focus:border-emerald-400 transition-all shadow-xl"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400 transition-transform" />
              </div>
           </div>

           <div className="space-y-6 relative z-10">
             {filteredSentMessages.length > 0 ? (
               <div className="overflow-x-auto pb-6 no-scrollbar">
                 <table className="w-full text-right border-separate border-spacing-y-4">
                   <thead>
                     <tr className="text-[12px] font-black text-yellow-400 uppercase tracking-widest px-6">
                       <th className="pb-4 px-6 text-right">المستفيد والملف العدلي</th>
                       <th className="pb-4 px-6 text-right">محتوى الرسالة الصادرة</th>
                       <th className="pb-4 px-6 text-right md:w-32">توقيت البث</th>
                       <th className="pb-4 px-6 text-center">النتيجة</th>
                       <th className="pb-4 px-6"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredSentMessages.map(msg => (
                       <tr key={msg.id} className="group transition-all">
                         <td className="py-6 px-8 rounded-r-2xl border-y-2 border-r-2 border-white/10 bg-black/90 group-hover:bg-[#06201a] transition-all shadow-lg">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0 border-2 border-blue-400/30">
                                <MailOpen className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <strong className="text-lg font-black block text-white group-hover:text-yellow-400 transition-colors leading-none mb-1 drop-shadow-sm">{msg.client}</strong>
                                <span className="text-[10px] font-black text-blue-400 bg-blue-600/10 px-3 py-0.5 rounded-md border border-blue-500/20">{msg.caseName}</span>
                              </div>
                           </div>
                         </td>
                         <td className="py-4 px-6 border-y-2 border-white/10 bg-black/80 group-hover:bg-[#06201a]/80 transition-all">
                            <p className="text-sm text-white font-bold line-clamp-1 max-w-sm leading-relaxed drop-shadow-sm">{msg.msg}</p>
                         </td>
                         <td className="py-4 px-6 border-y-2 border-white/10 bg-black/80 group-hover:bg-[#06201a]/80 transition-all">
                            <div className="flex flex-col">
                               <span className="text-sm font-black text-white">{msg.date}</span>
                               <span className="text-[10px] text-yellow-400 font-black uppercase mt-1">11:45 PM</span>
                            </div>
                         </td>
                         <td className="py-4 px-6 border-y-2 border-white/10 bg-black/80 group-hover:bg-[#06201a]/80 transition-all text-center">
                            <span className={`text-[10px] font-black px-6 py-1.5 rounded-full border-2 shadow-lg transition-all ${
                              msg.status === 'success' ? 'bg-emerald-600 text-white border-emerald-400' :
                              msg.status === 'urgent' ? 'bg-yellow-400 text-black border-yellow-300' :
                              'bg-rose-700 text-white border-rose-500'
                            }`}>
                              {msg.status === 'success' ? 'تم الوصول ✓' : msg.status === 'urgent' ? 'قيد المعالجة ⚡' : 'فشل ✖'}
                            </span>
                         </td>
                         <td className="py-4 px-6 rounded-l-2xl border-y-2 border-l-2 border-white/10 bg-black/90 group-hover:bg-[#06201a] transition-all">
                            <button className="w-10 h-10 rounded-xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-yellow-400 hover:text-black transition-all opacity-60 group-hover:opacity-100 scale-90 ">
                               <Eye className="w-5 h-5" />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="py-24 flex flex-col items-center justify-center text-white/20 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border-4 border-white/10 shadow-xl">
                    <Archive className="w-10 h-10" />
                  </div>
                  <p className="text-2xl font-black italic tracking-tight drop-shadow-sm">لا توجد مراسلات مطابقة لبحثكم حالياً</p>
               </div>
             )}
           </div>
        </MotionLuminanceCard>
      )}

      {activeTab === 'drafts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 text-right">
          {drafts.map(draft => (
             <MotionLuminanceCard key={draft.id} className="p-6 space-y-6 hover:border-yellow-400 transition-all duration-500 cursor-pointer group hover:-translate-y-1 relative overflow-hidden bg-[#1f1602] border-2 border-white/10 shadow-xl ring-2 ring-yellow-500/10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/15 blur-[120px] rounded-full"></div>
                <div className="flex justify-between items-start relative z-10">
                   <div className="p-3 rounded-xl bg-black border border-white/10 group-hover:bg-yellow-400 transition-all shadow-md">
                      <Smartphone className="w-6 h-6 text-yellow-400 group-hover:text-black" />
                   </div>
                   <div className="text-left font-black font-mono text-sm text-yellow-400 flex flex-col items-end gap-1">
                      <span className="opacity-60 uppercase tracking-widest text-[9px]">Legal Archive</span>
                      <span className="text-white text-base">{draft.date}</span>
                   </div>
                </div>
                <div className="space-y-4 relative z-10">
                  <h4 className="font-black text-2xl text-white group-hover:text-yellow-400 transition-colors tracking-tight leading-tight drop-shadow-md">{draft.recipient}</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black text-yellow-300 bg-yellow-400/20 px-4 py-1.5 rounded-full border border-yellow-400/40 shadow-lg tracking-widest">{draft.subject}</span>
                  </div>
                </div>
                <p className="text-sm text-white/90 font-bold line-clamp-3 leading-relaxed bg-black/60 p-4 rounded-2xl border border-white/10 relative z-10 group-hover:border-yellow-400/20 transition-all shadow-inner">{draft.content}</p>
                <div className="flex justify-between items-center pt-6 relative z-10 border-t-2 border-white/10">
                  <span className="text-[11px] font-black text-white/50 flex items-center gap-3 uppercase tracking-wider">
                     <Clock className="w-5 h-5 text-yellow-400/60" />
                     <span>آخر تعديل صاغته العدالة: 12:40 PM</span>
                  </span>
                  <button className="text-base font-black text-yellow-400 flex items-center gap-4 group-hover:gap-6 transition-all hover:brightness-125">
                     <span>مواصلة العمل</span>
                     <span className="text-xl leading-none transition-transform group-hover:translate-x-2">←</span>
                  </button>
                </div>
             </MotionLuminanceCard>
          ))}
          <div className="border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 hover:border-yellow-400/60 hover:bg-yellow-400/5 transition-all cursor-pointer group min-h-[300px] scale-95  shadow-inner">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-6 border-2 border-white/10 group-hover:bg-yellow-400 transition-all shadow-lg group-hover:shadow-yellow-400/40">
               <Send className="w-8 h-8 text-yellow-400 group-hover:text-black group-hover:rotate-12 transition-all translate-x-1" />
            </div>
            <span className="text-xl font-black text-white tracking-tight mb-2 drop-shadow-sm">تجهيز مسودة جديدة</span>
            <span className="text-[10px] font-black text-white/40 group-hover:text-yellow-400/80 transition-colors uppercase tracking-widest">Craft New Legal Broadcast</span>
          </div>
        </div>
      )}
    </div>
  );
}
