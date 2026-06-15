import React, { useState } from 'react';
import { 
  MessageSquare, Send, CheckCircle, Sparkles, 
  Clock, ChevronDown, History, FileText, CalendarDays
} from 'lucide-react';
import { motion } from 'motion/react';

interface WhatsappTemplate {
  id: string;
  name: string;
  triggerEvent: string;
  messageText: string;
}

const defaultTemplates: WhatsappTemplate[] = [
  {
    id: 'tp-24h',
    name: '⏰ تذكير آلي بالجلسة المرافعة الشرعية قبل الموعد بـ 24 ساعة',
    triggerEvent: 'اقتراب موعد الجلسة بـ 24 ساعة',
    messageText: 'تذكير عدلي عاجل: المحترم {ClientName}، نحيط سعادتكم علماً باقتراب تاريخ جلسة المرافعة المجدولة لدعواكم المقيدة برقم {CaseNumber} صبيحة يوم غدٍ أي بعد أقل من 24 ساعة بالتحديد. نأمل منكم التواجد وتأكيد الحضور مع المستشار القضائي ⚖️.'
  },
  {
    id: 'tp-1',
    name: 'ترحيب وتسليم بوابة الموكلين 🔑',
    triggerEvent: 'تسجيل عميل جديد',
    messageText: 'أهلاً بك العميل الكريم {ClientName}، يسعدنا إعلامكم بتهيئة بوابتكم الرقمية التفاعلية بنجاح.'
  }
];

export default function WhatsappTemplates() {
  const [activeTab, setActiveTab] = useState<'new_notification' | 'outbox' | 'templates' | 'upcoming'>('new_notification');
  const [editorText, setEditorText] = useState(defaultTemplates[0].messageText);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('tp-24h');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const clients = ['شركة نادك للتنمية الزراعية', 'إسماعيل بن فيصل الحربي', 'عاصم بن طلال العقاد'];
  const cases = ['437194619 - نزاع تجاري دولي', '419284711 - استخلاص مبالغ عقارية'];
  
  const clientHistory = [
    { client: 'شركة نادك للتنمية الزراعية', date: '2026-06-12', msg: 'تم إرسال تذكير بالجلسة', status: 'Sent' },
    { client: 'شركة نادك للتنمية الزراعية', date: '2026-06-01', msg: 'تم تسليم بوابة الموكلين', status: 'Sent' }
  ];

  const upcomingReminders = [
    { client: 'إسماعيل بن فيصل الحربي', case: '419284711 - استخلاص مبالغ عقارية', date: '2026-06-18', due: 'هذا الأسبوع', msg: 'تذكير بموعد خبير' },
    { client: 'عاصم بن طلال العقاد', case: '437194619 - نزاع تجاري دولي', date: '2026-07-05', due: 'الشهر القادم', msg: 'إشعار سداد دفعة' }
  ];

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    const tmpl = defaultTemplates.find(t => t.id === e.target.value);
    if(tmpl) {
      let tText = tmpl.messageText;
      if (selectedClient) tText = tText.replace(/\{ClientName\}/g, selectedClient);
      if (selectedCase) tText = tText.replace(/\{CaseNumber\}/g, selectedCase.split(' ')[0]);
      setEditorText(tText);
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClient = e.target.value;
    setSelectedClient(newClient);
    let tText = editorText;
    if (newClient) tText = tText.replace(/\{ClientName\}/g, newClient);
    setEditorText(tText);
  };

  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCase = e.target.value;
    setSelectedCase(newCase);
    let tText = editorText;
    if (newCase) tText = tText.replace(/\{CaseNumber\}/g, newCase.split(' ')[0]);
    setEditorText(tText);
  };

  const handleNotifyEmployee = () => {
    alert('تم تنبيه الموظف المسئول بإرسال الرسالة للعميل.');
  };

  return (
    <div className="space-y-8 text-right animate-fade-in font-sans pb-10 min-h-screen" dir="rtl">
      
      {/* Top Banner - Enforced High Contrast */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="p-8 relative bg-slate-900 border-2 border-yellow-400 rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-4">
            <span className="text-xs text-yellow-400 bg-slate-950 px-6 py-2 rounded-full font-black flex items-center gap-2 w-fit shadow-lg uppercase border border-yellow-400/50">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              مركز التحكم التلقائي وإشعارات الواتساب
            </span>
            <h1 className="text-3xl md:text-xl lg:text-3xl font-black mt-4 text-white tracking-tight">إشعارات ومراسلات العملاء</h1>
            <p className="text-lg font-black text-yellow-400 max-w-2xl leading-relaxed">
              إدارة الإشعارات النصية، القوالب الجاهزة، الجدولة الآلية، ومتابعة سجل المراسلات لكل عميل بوضوح واحترافية عالية.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900 border border-yellow-400/30 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto shadow-md">
        {[
          { id: 'new_notification', label: 'إرسال وجدولة الرسائل', icon: Send },
          { id: 'upcoming', label: 'الرسائل المجدولة القادمة', icon: CalendarDays },
          { id: 'outbox', label: 'سجل المراسلات', icon: History },
          { id: 'templates', label: 'إدارة القوالب', icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'new_notification')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-emerald-950 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] border border-yellow-400' 
                  : 'text-white hover:bg-white/10 hover:text-yellow-400 font-black'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-yellow-400 font-black'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'new_notification' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 flex flex-col gap-6">
             <div className="bg-slate-900 border border-yellow-400/40 rounded-3xl p-8 shadow-xl relative select-none">
                <h2 className="text-2xl font-black text-yellow-400 font-black mb-8 flex items-center gap-3">
                  <FileText className="w-6 h-6" /> تجهيز رسالة مخصصة
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-white">اختيار العميل المستفيد:</label>
                    <div className="relative">
                      <select 
                        value={selectedClient} onChange={handleClientChange}
                        className="w-full bg-emerald-950 border border-white/20 rounded-xl py-3 px-4 text-white font-bold appearance-none outline-none focus:border-yellow-400"
                      >
                        <option value="">-- اختر العميل --</option>
                        {clients.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 font-black pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-white">الملف / القضية المرتبطة:</label>
                    <div className="relative">
                      <select 
                        value={selectedCase} onChange={handleCaseChange}
                        className="w-full bg-emerald-950 border border-white/20 rounded-xl py-3 px-4 text-white font-bold appearance-none outline-none focus:border-yellow-400"
                      >
                        <option value="">-- اختر القضية --</option>
                        {cases.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 font-black pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-sm font-black text-white">اختيار قالب الرسالة الجاهزة:</label>
                    <div className="relative">
                      <select 
                        value={selectedTemplate} onChange={handleTemplateChange}
                        className="w-full bg-emerald-950 border border-yellow-400/50 rounded-xl py-3 px-4 text-yellow-400 font-black font-bold appearance-none outline-none focus:border-yellow-400"
                      >
                        {defaultTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400 font-black pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <label className="text-sm font-black text-yellow-400 font-black">محتوى الرسالة (متاح للتعديل):</label>
                  <textarea
                    rows={6}
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-6 text-white text-lg font-bold outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-2xl border border-white/10">
                   <div className="md:col-span-2 text-yellow-400 font-black font-black text-sm flex items-center gap-2">
                     <Clock className="w-4 h-4" /> الجدولة الآلية للإرسال (اختياري)
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs text-yellow-400 font-bold">تاريخ الإرسال كحد أقصى:</label>
                     <input type="date" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} className="w-full bg-emerald-950 p-3 rounded-lg border border-white/20 text-white outline-none focus:border-yellow-400 [color-scheme:dark]" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs text-yellow-400 font-bold">توقيت الإرسال الدقيق:</label>
                     <input type="time" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} className="w-full bg-emerald-950 p-3 rounded-lg border border-white/20 text-white outline-none focus:border-yellow-400 [color-scheme:dark]" />
                   </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 items-center justify-end">
                  <button onClick={handleNotifyEmployee} className="px-6 py-4 rounded-xl border-2 border-yellow-400 bg-slate-950 text-white font-black flex items-center gap-2 transition-all">
                    تنبيه الموظف مبكراً
                  </button>
                  <button className="px-8 py-4 rounded-xl bg-slate-950 text-yellow-400 border border-yellow-400 font-black shadow-[0_0_15px_rgba(250,204,21,0.2)] transition-all flex items-center gap-2">
                    {scheduleDate ? <Clock className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                    {scheduleDate ? 'جدولة الإرسال آلياً' : 'إرسال الرسالة الآن'}
                  </button>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900 border border-yellow-400/40 rounded-3xl p-6 shadow-xl flex-1">
              <h3 className="text-lg font-black text-white border-b border-yellow-400/20 pb-4 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-yellow-400 font-black" />
                سجل رسائل العميل المحدد
              </h3>
              {!selectedClient ? (
                <div className="text-center py-10 opacity-100">
                  <p className="text-sm font-bold text-white">يرجى اختيار العميل أولاً</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientHistory.filter(h => h.client === selectedClient).map((history, idx) => (
                    <div key={idx} className="bg-emerald-950 p-4 rounded-xl border border-white/10">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-xs bg-yellow-400/20 text-yellow-400 font-black px-2 py-1 rounded font-black">{history.date}</span>
                         <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> تم التسليم</span>
                       </div>
                       <p className="text-sm text-white font-bold leading-relaxed">{history.msg}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'upcoming' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 border border-yellow-400/40 rounded-3xl p-8 shadow-xl">
           <h2 className="text-2xl font-black text-white tracking-tight mb-8 drop-shadow-sm flex items-center gap-3">
              <CalendarDays className="w-7 h-7 text-yellow-400 font-black" />
              رسائل أسبوعية وشهرية مجدولة للعملاء
           </h2>
           <div className="grid gap-6">
             {upcomingReminders.map((reminder, idx) => (
               <div key={idx} className="bg-emerald-950 border border-white/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                     <span className="bg-slate-950 border border-yellow-400 text-yellow-400 px-3 py-1 rounded-full text-xs font-black">{reminder.due}</span>
                     <h4 className="font-black text-lg text-white mt-1">{reminder.client}</h4>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/10 flex-1 md:mx-6">
                    <span className="text-base text-white font-bold">{reminder.msg}</span>
                  </div>
                  <div className="text-sm font-black text-yellow-400 font-black">تاريخ التنفيذ: {reminder.date}</div>
               </div>
             ))}
           </div>
        </motion.div>
      )}

      {activeTab === 'outbox' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 border border-yellow-400/40 rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-black text-white mb-8">سجل كافة المراسلات الصادرة</h2>
          <div className="space-y-4">
            {clientHistory.map((history, i) => (
              <div key={i} className="bg-emerald-950 p-5 rounded-xl border border-white/10 flex justify-between items-center">
                 <div>
                   <h4 className="font-bold text-white">{history.client}</h4>
                   <p className="text-xs text-yellow-400 font-black mt-1">{history.msg}</p>
                 </div>
                 <div className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-3 py-1 rounded-lg">مستلمة</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'templates' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 border border-yellow-400/40 rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-black text-white mb-8">إدارة قوالب الرسائل الجاهزة</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {defaultTemplates.map((t) => (
              <div key={t.id} className="bg-emerald-950 p-6 rounded-2xl border border-yellow-500/30 flex flex-col gap-4">
                <h3 className="font-black text-yellow-400 font-black text-lg">{t.name}</h3>
                <div className="bg-slate-950 p-4 rounded-xl border border-white/10 text-white font-black text-sm flex-1">
                  {t.messageText}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}
