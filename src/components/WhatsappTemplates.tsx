import React, { useState } from 'react';
import { 
  MessageSquare, Send, CheckCircle, Sparkles, 
  Clock, ChevronDown, History, FileText, CalendarDays,
  Search, Users, Briefcase, Award, Check, AlertCircle, Calendar,
  Plus, ArrowRightLeft, Star, Volume2, Bookmark, CheckCircle2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsappTemplate {
  id: string;
  name: string;
  triggerEvent: string;
  messageText: string;
  category: 'court' | 'onboarding' | 'finance' | 'social' | 'urgent';
}

const initialTemplates: WhatsappTemplate[] = [
  {
    id: 'tp-24h',
    name: '⏰ تذكير آلي بالجلسة المرافعة الشرعية (قبل الموعد بـ 24 ساعة)',
    triggerEvent: 'اقتراب موعد الجلسة بـ 24 ساعة',
    category: 'court',
    messageText: 'تذكير عدلي عاجل: المحترم {ClientName}، نحيط سعادتكم علماً باقتراب تاريخ جلسة المرافعة المجدولة لدعواكم المقيدة برقم {CaseNumber} صبيحة يوم غدٍ أي بعد أقل من 24 ساعة بالتحديد. نأمل منكم التواجد وتأكيد الحضور مع المستشار القضائي ⚖️.'
  },
  {
    id: 'tp-today',
    name: '🚨 تنبيه فوري بموعد الجلسة (اليوم)',
    triggerEvent: 'يوم الجلسة',
    category: 'court',
    messageText: 'عاجل وهام: المحترم {ClientName}، نذكركم بموعد جلستكم القضائية اليوم رقم {CaseNumber}. نرجو منكم الدخول لبوابة ناجز قبل الموعد بـ 15 دقيقة لضمان عدم فوات المرافعة. فريقنا في انتظاركم ⚖️.'
  },
  {
    id: 'tp-1',
    name: '🔑 ترحيب وتسليم بوابة الموكلين الرقمية الفورية',
    triggerEvent: 'تسجيل عميل جديد',
    category: 'onboarding',
    messageText: 'أهلاً بك العميل الكريم الأستاذ/الأستاذة {ClientName}، يسعدنا أطيب السعادة إعلامكم بتهيئة بوابتكم الرقمية التفاعلية بنجاح. يمكنكم تتبع كافة مستجدات قضاياكم وأرشيف المستندات على مدار الساعة أولاً بأول ⚖️.'
  },
  {
    id: 'tp-winning',
    name: '🎉 تهنئة بصدور حكم قضائي قطعي لصالح الموكل بالكامل',
    triggerEvent: 'كسب القضية',
    category: 'court',
    messageText: 'نبارك لسعادتكم {ClientName}! صَدَرَ بحمد الله وتوفيقه حكم قضائي لِصالحنا في القضية المقيدة برقم {CaseNumber}. جاري العمل على استخراج نسخة الحكم الرسمية وبدء إجراءات التنفيذ بمحكمة التنفيذ الفورية. شكراً لثقتكم بمكتبنا ⚖️.'
  },
  {
    id: 'tp-meeting',
    name: '📅 دعوة لحضور اجتماع استشاري بمقر المكتب / عبر الاتصال المرئي',
    triggerEvent: 'تحديد موعد اجتماع',
    category: 'urgent',
    messageText: 'أهلاً بك {ClientName}، نود دعوتكم لحضور اجتماع استشاري لمناقشة مستجدات القضية رقم {CaseNumber}. تم حجز الموعد المرتقب بمشيئة الله في [اليوم/التاريخ] عند الساعة [الساعة]. نرجو التأكيد ⚖️.'
  },
  {
    id: 'tp-docs',
    name: '📝 طلب تزويد المكتب بمستندات أو بينات أو مستندات عاجلة',
    triggerEvent: 'نقص البيانات',
    category: 'urgent',
    messageText: 'المحترم {ClientName}، من أجل تنظيم مذكرة الدفاع في القضية رقم {CaseNumber} على الوجه الأكمل، نرجو من سعادتكم التكرم بموافاتنا بنسخة من المستندات المطلوبة في أسرع وقت ممكن ليتسنى لفريقنا صياغة اللائحة القضائية وتقديمها ناظر الدعوى.'
  },
  {
    id: 'tp-invoice',
    name: '💳 إشعار بإصدار فاتورة ضريبية ودفعة مالية مستحقة',
    triggerEvent: 'استحقاق دفع مالي',
    category: 'finance',
    messageText: 'السيد/السادة {ClientName} المحترمين، نأمل إحاطتكم بصدور الفاتورة الضريبية للدفعة المالية المستحقة لعقدكم القضائي المبرم مع المكتب. يرجى التكرم بإنهاء إجراءات السداد وتزويدنا بإيصال التحويل لضمان المتابعة المستمرة.'
  },
  {
    id: 'tp-payment-received',
    name: '✅ تأكيد استلام دفعة مالية وإصدار سند قبض',
    triggerEvent: 'سداد مبلغ',
    category: 'finance',
    messageText: 'المحترم {ClientName}، تم بحمد الله استلام الحوالة المالية بنجاح. جاري إصدار سند القبض الرسمي وإرساله لبريدكم الإلكتروني المعتمد. نقدر التزامكم ونتطلع لمزيد من النجاحات ⚖️.'
  },
  {
    id: 'tp-contract',
    name: '🤝 دعوة لتوقيع العقد الجديد أو اعتماد مسودة المذكرة واللائحة',
    triggerEvent: 'اعتماد المستندات',
    category: 'onboarding',
    messageText: 'الموقر {ClientName}، تم بحمد الله صياغة النسخة النهائية من العقد/مذكرة الجواب في دعواكم رقم {CaseNumber}. نأمل من سعادتكم الاطلاع عليها واعتمادها أو تفويضنا للحضور لمكتبنا للتوقيع لتقديمها لفضيلة ناظر الدعوى بـ ناجز.'
  },
  {
    id: 'tp-eid',
    name: '🌙 تهنئة رسمية فاخرة بمناسبة الأعياد والمناسبات الإسلامية المباركة',
    triggerEvent: 'مناسبة دينية اجتماعية',
    category: 'social',
    messageText: 'يطيب لفريق العمل بمكتب العدالة للمحاماة والاستشارات القانونية أن يتقدم لسعادتكم {ClientName} بأصدق التهاني والتبريكات بمناسبة حلول عيد الفطر المبارك. تقبل الله منا ومنكم صالح الأعمال، وكل عام وأنتم بخير وبأفضل رقيّ وحال.'
  },
  {
    id: 'tp-national',
    name: '🇸🇦 تهنئة بمناسبة اليوم الوطني للمملكة العربية السعودية / يوم التأسيس',
    triggerEvent: 'مناسبة وطنية رسمية',
    category: 'social',
    messageText: 'يهنئكم مكتبنا الفاخر بمناسبة اليوم الوطني السعودي / يوم التأسيس المجيد 🇸🇦. نسأل الله العظيم أن يديم على مملكتنا الغالية نعمة الأمن والأمان والازدهار والعدل في ظل قيادتنا الرشيدة، وكل عام وموطننا الأغلى تفرداً وعزة.'
  },
  {
    id: 'tp-ramadan',
    name: '✨ تهنئة بمناسبة حلول شهر رمضان المبارك لشريك النجاح',
    triggerEvent: 'مناسبة دينية',
    category: 'social',
    messageText: 'الموقر {ClientName}، بمناسبة حلول شهر رمضان المبارك 🌙 يتقدم إليك كادر الاستشارات القانونية بالمكتب بأبهى التبريكات، سائلين المولى كرم عونه وتوفيقه صياماً وقياماً وقبولاً. مبارك عليكم الشهر المبارك العظيم.'
  }
];

export default function WhatsappTemplates() {
  const [activeTab, setActiveTab] = useState<'new_notification' | 'upcoming' | 'outbox' | 'templates'>('new_notification');
  const [templates, setTemplates] = useState<WhatsappTemplate[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState('tp-24h');
  const [editorText, setEditorText] = useState(initialTemplates[0].messageText);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom states to store user-added data dynamically
  const [clientHistory, setClientHistory] = useState([
    { id: 1, client: 'شركة نادك للتنمية الزراعية', date: '2026-06-12 10:15 ص', msg: 'تم إرسال تذكير بالجلسة القضائية رقم 437194619 والمجدولة غداً بنجاح.', status: 'Sent', template: 'تذكير الجلسة' },
    { id: 2, client: 'شركة نادك للتنمية الزراعية', date: '2026-06-01 09:00 ص', msg: 'تم تسليم وفتح بوابة الموكلين التفاعلية للأستاذ بن فيصل.', status: 'Sent', template: 'تسليم البوابة' },
    { id: 3, client: 'عاصم بن طلال العقاد', date: '2026-06-15 01:22 م', msg: 'طلب عاجل لتزويد المكتب بمسوغات الوكالة الجديدة وصورة من فسوحات عقود التأسيس.', status: 'Sent', template: 'طلب مستندات' }
  ]);

  const [upcomingReminders, setUpcomingReminders] = useState([
    { id: 101, client: 'إسماعيل بن فيصل الحربي', case: '419284711 - استخلاص مبالغ عقارية', date: '2026-06-19', time: '11:00 ص', due: 'غداً صباحاً', msg: 'تذكير بموعد تقرير الخبير الحسابي المعتمد بالدعوى.' },
    { id: 102, client: 'عاصم بن طلال العقاد', case: '437194619 - نزاع تجاري دولي', date: '2026-07-05', time: '02:00 م', due: 'الشهر القادم', msg: 'إشعار سداد الدفعة الثانية للضريبة القضائية.' }
  ]);

  // Toast / Status state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clients = [
    'شركة نادك للتنمية الزراعية', 
    'إسماعيل بن فيصل الحربي', 
    'عاصم بن طلال العقاد',
    'مجموعة التميمي القابضة والاستثمارات',
    'عبدالرحمن بن حمود الشبيلي'
  ];
  const cases = [
    '437194619 - نزاع تجاري دولي بمحكمة الاستئناف', 
    '419284711 - استخلاص مبالغ عقارية بمحكمة شمال الرياض',
    '451829014 - منازعة تنفيذ شيك بدون رصيد بالمحكمة العامة'
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) {
      let tText = tmpl.messageText;
      if (selectedClient) tText = tText.replace(/\{ClientName\}/g, selectedClient);
      if (selectedCase) {
        const caseNo = selectedCase.split(' ')[0];
        tText = tText.replace(/\{CaseNumber\}/g, caseNo);
      } else {
        tText = tText.replace(/\{CaseNumber\}/g, '[رقم القضية]');
      }
      setEditorText(tText);
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClient = e.target.value;
    setSelectedClient(newClient);
    
    // Reset editor text with default and update tokens
    const tmpl = templates.find(t => t.id === selectedTemplate);
    if (tmpl) {
      let tText = tmpl.messageText;
      if (newClient) {
        tText = tText.replace(/\{ClientName\}/g, newClient);
      } else {
        tText = tText.replace(/\{ClientName\}/g, '[اسم الموكل]');
      }
      if (selectedCase) {
        tText = tText.replace(/\{CaseNumber\}/g, selectedCase.split(' ')[0]);
      }
      setEditorText(tText);
    }
  };

  const handleCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCase = e.target.value;
    setSelectedCase(newCase);
    
    const tmpl = templates.find(t => t.id === selectedTemplate);
    if (tmpl) {
      let tText = tmpl.messageText;
      if (selectedClient) {
        tText = tText.replace(/\{ClientName\}/g, selectedClient);
      }
      if (newCase) {
        tText = tText.replace(/\{CaseNumber\}/g, newCase.split(' ')[0]);
      } else {
        tText = tText.replace(/\{CaseNumber\}/g, '[رقم القضية]');
      }
      setEditorText(tText);
    }
  };

  const handleNotifyEmployee = () => {
    alert('تم توجيه وتنبيه الموظف المستشار المسئول عن المتابعة لمزامنة وإرسال هذه المراسلة عبر قنوات الاتصال المعتمدة لدى العميل.');
    triggerToast('🔔 تم إرسال الإشعار وتنبيه الموظف المسئول بنجاح!');
  };

  const handleSendMessage = () => {
    if (!selectedClient) {
      alert('الرجاء اختيار العميل المستفيد أولاً.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'م' : 'ص'}`;

    if (scheduleDate) {
      // Add to upcoming
      const newUpcoming = {
        id: Date.now(),
        client: selectedClient,
        case: selectedCase || 'ملف استشاري عام للمكتب',
        date: scheduleDate,
        time: scheduleTime || '09:00 ص',
        due: 'مجدولة لاحقاً',
        msg: editorText
      };
      setUpcomingReminders([newUpcoming, ...upcomingReminders]);
      triggerToast(`📅 تم جدولة مراسلة العميل بنجاح في تاريخ ${scheduleDate} الساعة ${scheduleTime || '09:00 ص'}`);
      
      // Reset inputs
      setScheduleDate('');
      setScheduleTime('');
    } else {
      // Add to history / outbox
      const newHistory = {
        id: Date.now(),
        client: selectedClient,
        date: formattedDate,
        msg: editorText,
        status: 'Sent',
        template: templates.find(t => t.id === selectedTemplate)?.name.substring(0, 20) || 'مراسلة فورية'
      };
      setClientHistory([newHistory, ...clientHistory]);
      triggerToast('🟢 تم إرسال إشعار الواتساب التلقائي وبثه بنجاح فوري للموكل!');
    }
  };

  const handleAddNewTemplate = () => {
    const name = prompt('الرجاء إدخال اسم القالب الجديد (مثال: تنبيه بموعد المذكرة الجوابية):');
    if (!name) return;
    const desc = prompt('الرجاء إدخال صياغة ونص قالب الرسالة الجاري إرسالها (يمكنك استخدام الفراغ البديل {ClientName} و {CaseNumber}):');
    if (!desc) return;
    
    const newTemplate: WhatsappTemplate = {
      id: `tp-custom-${Date.now()}`,
      name: `✨ ${name}`,
      triggerEvent: 'إشعار مخصص حسب الطلب',
      category: 'onboarding',
      messageText: desc
    };

    setTemplates([...templates, newTemplate]);
    triggerToast('🆕 تم إضافة قالب المراسلة الجديد بنجاح إلى القائمة الخاصة بك!');
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('هل أنت متأكد من حذف قالب المراسلة المخصص هذا؟')) {
      setTemplates(templates.filter(t => t.id !== id));
      triggerToast('🗑️ تم حذف قالب المراسلة بنجاح.');
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('هل ترغب في استعادة القوالب الافتراضية للمنصة؟ سيتم الحفاظ على سجل المراسلات المتبقي.')) {
      setTemplates(initialTemplates);
      triggerToast('🔄 تم استعادة القوالب الأساسية للنظام بنجاح.');
    }
  };

  // Filtered Templates
  const filteredTemplates = templates.filter(tmpl => {
    const matchesCategory = categoryFilter === 'all' || tmpl.category === categoryFilter;
    const matchesSearch = tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tmpl.messageText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-right animate-fade-in font-sans pb-12 bg-white min-h-screen" dir="rtl">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 md:left-auto md:right-12 md:w-[420px] bg-white border-r-4 border-emerald-600 shadow-2xl p-4 rounded-xl z-50 flex items-start gap-3 border border-slate-200"
          >
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-950 leading-relaxed mb-0.5">منصة العدالة الرقمية</p>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Beautiful Light Banner - Luminous Royal Theme */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="p-8 relative bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden overflow-hidden"
      >
        {/* Luminous background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-50/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-50/30 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-3">
            <span className="text-[11px] text-emerald-950 bg-emerald-100 font-extrabold px-3.5 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 w-fit shadow-sm uppercase">
              <Sparkles className="w-4 h-4 text-emerald-700 animate-spin-slow" />
              منصة البث والإشعارات الذكية المتكاملة
            </span>
            <h1 className="text-3xl md:text-2xl lg:text-3xl font-black mt-2 text-slate-950 leading-tight tracking-tight">
              إشعارات ومراسلات الموكلين التلقائية
            </h1>
            <p className="text-sm md:text-base font-bold text-slate-700 max-w-2xl leading-relaxed">
              أتمتة ذكية ومراسلات وقائية للعملاء لجميع المناسبات والتذكيرات القضائية مع تباين فائق وعرض مريح يدعم الهوية البصرية الرسمية.
            </p>
          </div>
          <div className="flex gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm shrink-0">
            <div className="text-center px-4">
              <span className="block text-2xl font-black text-emerald-700">{templates.length}</span>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">صياغات الأتمتة</span>
            </div>
            <div className="w-[1px] bg-slate-200"></div>
            <div className="text-center px-4">
              <span className="block text-2xl font-black text-slate-900">{clientHistory.length}</span>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">مراسلة ممضاة</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs - Gilded Contrasts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between flex-wrap gap-2 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto p-1">
          {[
            { id: 'new_notification', label: 'إرسال وجدولة الرسائل 📨', icon: Send },
            { id: 'upcoming', label: 'الرسائل المجدولة القادمة ⏳', icon: CalendarDays },
            { id: 'outbox', label: 'أرشيف وسجل الصادرات 📂', icon: History },
            { id: 'templates', label: 'إدارة وتخصيص القوالب ⚙️', icon: MessageSquare }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'new_notification')}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap border-2 ${
                  isActive 
                    ? 'bg-slate-950 text-white shadow-lg border-slate-950 scale-[1.02]' 
                    : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-100 hover:border-slate-200 font-bold'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'templates' && (
          <div className="flex items-center gap-2 mt-2 md:mt-0 px-2 pb-2 md:pb-0">
            <button 
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
              title="إعادة تعيين القوالب الافتراضية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>الخيارات الأصلية</span>
            </button>
            <button 
              onClick={handleAddNewTemplate}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قالب مخصص</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Sections */}
      {activeTab === 'new_notification' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main message editor panel */}
          <div className="lg:col-span-8 flex flex-col gap-6">
             <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm relative">
                <h2 className="text-xl font-black text-slate-950 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2.5">
                  <FileText className="w-5.5 h-5.5 text-emerald-600" /> 
                  <span>تجهيز وصياغة رسالة الموكل الفورية</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  {/* Client Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-950">
                      اسم الموكل المستفيد والطرف الآخر: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedClient} 
                        onChange={handleClientChange}
                        className="w-full bg-white border border-slate-200 hover:border-emerald-500 rounded-xl py-3 px-4 text-slate-900 font-extrabold appearance-none outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-sm"
                      >
                        <option value="">-- اضغط لتحديد العميل --</option>
                        {clients.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* Case Related Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-950">
                      الدعوى أو المعاملة القضائية المرتبطة:
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedCase} 
                        onChange={handleCaseChange}
                        className="w-full bg-white border border-slate-200 hover:border-emerald-500 rounded-xl py-3 px-4 text-slate-900 font-extrabold appearance-none outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-sm"
                      >
                        <option value="">-- اضغط للاختيار أو دعها كاستشارة --</option>
                        {cases.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* Template Picker */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-950">
                      قائمة القوالب المسجلة الجاهزة للاختيار:
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedTemplate} 
                        onChange={handleTemplateChange}
                        className="w-full bg-emerald-50/30 border border-emerald-500/40 rounded-xl py-3.5 px-4 text-emerald-900 font-extrabold appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600 transition-all text-sm shadow-sm"
                      >
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-emerald-700 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold block mt-1">
                      💡 اختيار القالب سيقوم بتعبئة الصياغة أدناه آلياً، كما سيستبدل المسميات والبيانات المدخلة تلقائياً.
                    </span>
                  </div>
                </div>

                {/* Editor Textarea with premium look */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-950">
                      الصياغة القانونية والرسالة (متاحة للتثبيت والتعديل اليدوي):
                    </label>
                    <span className="text-[10px] bg-slate-100 text-slate-950 px-2 py-0.5 rounded font-black border border-slate-200">
                      {editorText.length} حرف
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-2xl p-4.5 text-slate-950 text-[15px] font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-emerald-500/25 leading-relaxed shadow-sm"
                    placeholder="اكتب نص الرسالة هنا..."
                  />
                  {editorText.includes('{ClientName}') && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex gap-2 items-center text-amber-900 text-xs font-bold leading-relaxed">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-700 shrink-0" />
                      <span>تنبيه: نص الرسالة يحتوي على رمز البديل <code className="bg-amber-100 font-mono px-1.5 py-0.5 rounded text-amber-950 font-black">{"{ClientName}"}</code>. سيتم استبداله تلقائياً باسم العميل عند الإرسال والبث.</span>
                    </div>
                  )}
                </div>

                {/* Automation Scheduling Inputs */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 mb-6">
                   <div className="text-slate-950 font-black text-xs flex items-center gap-2 mb-4">
                     <Clock className="w-4 h-4 text-emerald-700" />
                     <span>جدولة موعد بث المراسلة التلقائي (اختياري تماماً)</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                       <label className="text-[11px] text-slate-800 font-black">تحديد تاريخ الإرسال:</label>
                       <input 
                         type="date" 
                         value={scheduleDate} 
                         onChange={e => setScheduleDate(e.target.value)} 
                         className="w-full bg-white p-3 rounded-xl border border-slate-200 text-slate-950 font-bold text-xs outline-none focus:border-emerald-500 shadow-sm" 
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-[11px] text-slate-800 font-black">تحديد ساعة البث الدقيقة:</label>
                       <input 
                         type="time" 
                         value={scheduleTime} 
                         onChange={e => setScheduleTime(e.target.value)} 
                         className="w-full bg-white p-3 rounded-xl border border-slate-200 text-slate-950 font-bold text-xs outline-none focus:border-emerald-500 shadow-sm" 
                       />
                     </div>
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 items-center justify-end border-t border-slate-100 pt-5">
                  <button 
                    onClick={handleNotifyEmployee} 
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-950 font-black text-xs transition-all shadow-sm"
                  >
                    تنبيه المستشار المسئول ⚖️
                  </button>
                  <button 
                    onClick={handleSendMessage}
                    className="px-7 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2"
                  >
                    {scheduleDate ? <Clock className="w-4.5 h-4.5 text-emerald-400" /> : <Send className="w-4.5 h-4.5 text-emerald-400" />}
                    <span>{scheduleDate ? 'تثبيت وجدولة الإرسال التلقائي' : 'بث وإرسال الرسالة عبر الواتساب الآن'}</span>
                  </button>
                </div>
             </div>
          </div>

          {/* Right sidebar info panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-950 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-emerald-700" />
                <span>سجل المراسلات للعميل النشط</span>
              </h3>
              
              {!selectedClient ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-800">تتبع السجل والمكالمات الصادرة</p>
                  <p className="text-[10px] text-slate-500 mt-1">يرجى تحديد اسم العميل من القائمة المنسدلة لعرض أرشيف المراسلات الخاصة به مباشرة.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-2">
                    <span className="text-[11px] font-black text-emerald-950 block">العميل المحدد حالياً:</span>
                    <span className="text-xs font-extrabold text-emerald-800">{selectedClient}</span>
                  </div>
                  
                  {clientHistory.filter(h => h.client === selectedClient).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-bold bg-slate-50 rounded-xl">
                      لا يوجد مراسلات مسجلة لـ {selectedClient.split(' ')[0]} حتى الآن.
                    </div>
                  ) : (
                    clientHistory.filter(h => h.client === selectedClient).map((history) => (
                      <div key={history.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] bg-slate-200 text-slate-900 font-extrabold px-2 py-0.5 rounded">
                             {history.date}
                           </span>
                           <span className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1">
                             <CheckCircle className="w-3.5 h-3.5" /> 
                             <span>بث فوري ناجح</span>
                           </span>
                         </div>
                         <p className="text-xs text-slate-800 font-extrabold leading-relaxed text-right mb-1">
                           {history.msg}
                         </p>
                         <div className="text-[9px] text-slate-500">
                           نوع القالب: {history.template}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quick tips */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-right">
              <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-700" />
                <span>تعليمات الصياغة الآمنة والموثوقية</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-700 font-bold leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full mt-1.5 shrink-0" />
                  <span>تلقائياً يتكامل البث مع مزود الخدمة المعتمد لضمان الوصول الفوري لجوّال العميل.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full mt-1.5 shrink-0" />
                  <span>يرجى عدم تكرار إرسال التذكيرات القضائية بفوارق زمنية تزيد عن النطاق الإجرائي.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full mt-1.5 shrink-0" />
                  <span>يمكنك حفظ وتثبيت القوالب لجميع المناسبات من قسم إدارة وتخصيص القوالب.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'upcoming' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
           <h2 className="text-xl font-black text-slate-950 tracking-tight mb-6 flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-emerald-600" />
              <span>رسائل أسبوعية وشهرية مجدولة للعملاء آلياً</span>
           </h2>
           <p className="text-xs font-bold text-slate-800 mb-6 leading-relaxed">
             هنا يتم عرض الإشعارات والمباركات وقوائم المتابعة التي ستشق طريقها تلقائياً لهاتف الموكل عند استحقاق الفاصل الزمني والجدولة المبرمجة مسبقاً.
           </p>

           {upcomingReminders.length === 0 ? (
             <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
               <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-2" />
               <p className="text-sm font-black text-slate-950">لا توجد رسائل مجدولة قريباً</p>
               <p className="text-xs text-slate-600 mt-1 font-bold">تستطيع جدولة أي إشعار أو رسالة جديدة من خلال تبويب (إرسال وجدولة الرسائل).</p>
             </div>
           ) : (
             <div className="grid gap-4">
               {upcomingReminders.map((reminder) => (
                 <div key={reminder.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition-all">
                    <div className="space-y-1.5 shrink-0">
                       <span className="bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-[10px] font-black border border-emerald-200">
                         {reminder.due}
                       </span>
                       <h4 className="font-black text-base text-slate-950 mt-1.5">{reminder.client}</h4>
                       <span className="text-[11px] text-slate-700 block font-bold">{reminder.case}</span>
                    </div>
                    
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex-1 text-slate-900 text-xs font-bold leading-relaxed text-right md:mx-4 shadow-inner">
                      {reminder.msg}
                    </div>
                    
                    <div className="text-xs text-slate-950 flex flex-col items-start md:items-end gap-1 shrink-0 font-black bg-slate-200/50 p-2.5 rounded-lg border border-slate-200/40">
                      <span>📆 تاريخ البث: {reminder.date}</span>
                      <span>⏰ توقيت دقيق: {reminder.time}</span>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </motion.div>
      )}

      {activeTab === 'outbox' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
           <h2 className="text-xl font-black text-slate-950 mb-4 flex items-center gap-2">
             <History className="w-6 h-6 text-emerald-600" />
             <span>سجلات المراسلات الصادرة والأكثر طلباً</span>
           </h2>
           <p className="text-xs font-bold text-slate-800 mb-6 leading-relaxed">
             مراقبة شاملة لكامل المراسلات والإشعارات القانونية التي انبثقت من المكتب نحو هواتف الموكلين مع بيان الوقت وحالة القنوات الرقمية.
           </p>

           <div className="space-y-3.5">
             {clientHistory.map((history) => (
                <div key={history.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex justify-between items-center gap-4 flex-wrap md:flex-nowrap shadow-sm">
                   <div className="space-y-1">
                     <h4 className="font-black text-sm text-slate-950">{history.client}</h4>
                     <p className="text-xs text-slate-900 font-bold leading-relaxed">{history.msg}</p>
                     <span className="text-[10px] text-slate-600 block font-bold">نوع القالب: {history.template}</span>
                   </div>
                   <div className="flex items-center gap-3 shrink-0 text-left">
                     <span className="text-[10px] font-black text-slate-700 block">{history.date}</span>
                     <span className="text-xs text-emerald-900 font-black bg-emerald-50 hover:bg-emerald-100 transition-colors px-3.5 py-2 rounded-lg border border-emerald-200 flex items-center gap-1">
                       <Check className="w-3.5 h-3.5" />
                       <span>بث فوري ناجح الفعالية</span>
                     </span>
                   </div>
                </div>
             ))}
           </div>
        </motion.div>
      )}

      {activeTab === 'templates' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-950">إدارة قوالب المراسلة الجاهزة لجميع المناسبات</h2>
              <p className="text-xs font-bold text-slate-800 mt-1 leading-relaxed">
                هنا تجد القوالب الممتدة لجميع المناسبات الوطنية والدينية وتحديثات المرافعة وكسب القضية. يمكنك إضافة وحذف قوالب جديدة للمكتب.
              </p>
            </div>
          </div>

          {/* Filter Bar with Category Tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-dashed border-slate-100 flex-wrap md:flex-nowrap">
            <span className="text-xs font-black text-slate-950 shrink-0">تصفية القوالب:</span>
            {[
              { id: 'all', label: 'الجميع 🔍' },
              { id: 'court', label: 'القضاء والمحاكم ⚖️' },
              { id: 'onboarding', label: 'الترحيب والتعاقد 🔑' },
              { id: 'finance', label: 'الفواتير والمالية 💳' },
              { id: 'social', label: 'الأعياد والمناسبات 🌙' },
              { id: 'urgent', label: 'طلبات عاجلة 🚨' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                  categoryFilter === cat.id
                    ? 'bg-slate-950 text-white border-slate-950'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
            
            <div className="relative flex-1 md:max-w-xs md:mr-auto mt-2 md:mt-0">
              <input
                type="text"
                placeholder="ابحث في نص القالب..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3.5 pr-9 text-xs font-bold text-slate-950 outline-none focus:border-slate-400 placeholder:text-slate-500 shadow-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Cards list */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl text-slate-700 font-bold text-xs border border-dashed border-slate-200">
               🤷‍♂️ لا تتوفر أي نتائج مطابقة للتصفية الحالية.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredTemplates.map((t) => (
                <div 
                  key={t.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-400 transition-all flex flex-col justify-between gap-4 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-950 bg-emerald-50 px-3 py-1 rounded-md font-black block border border-emerald-200">
                        {t.triggerEvent}
                      </span>
                      {t.id.startsWith('tp-custom-') && (
                        <button
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="text-xs font-black text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 p-1.5 rounded border border-rose-100"
                          title="حذف هذا القالب المخصص"
                        >
                          حذف القالب
                        </button>
                      )}
                    </div>
                    <h3 className="font-black text-slate-950 text-sm leading-snug">{t.name}</h3>
                    <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs leading-relaxed max-h-[140px] overflow-y-auto select-all text-right shadow-inner">
                      {t.messageText}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1 shrink-0">
                    <div className="text-[10px] text-slate-700 font-bold">
                      الفئة: {t.category === 'court' ? 'قسم القضاء المتكامل' : t.category === 'social' ? 'العلاقات والمناسبات' : t.category === 'finance' ? 'الإدارة المالية' : t.category === 'onboarding' ? 'تسكين الموكلين' : 'الحالات العاجلة'}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(t.id);
                        setEditorText(t.messageText);
                        setActiveTab('new_notification');
                        triggerToast('📥 تم تحميل القالب المحدد بنجاح في المحرر القضائي!');
                      }}
                      className="text-[10px] font-black text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded shadow-sm transition-all"
                    >
                      تحميل في المحرر 📥
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
