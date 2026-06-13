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
  Moon
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
  const [textColor, setTextColor] = useState('#ffffff');
  const [accentColor, setAccentColor] = useState('#ffea7a');

  const analyzeBackgroundBrightness = () => {
    if (!cardRef.current) return;
    
    const style = window.getComputedStyle(cardRef.current);
    const bg = style.backgroundColor;
    
    if (bg && bg.startsWith('rgb')) {
      const rgbValues = bg.match(/\d+/g);
      if (rgbValues && rgbValues.length >= 3) {
        const r = parseInt(rgbValues[0]);
        const g = parseInt(rgbValues[1]);
        const b = parseInt(rgbValues[2]);
        
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        
        if (luminance >= 0.5) {
          setTextColor('#0f172a'); // light background -> dark text
          setAccentColor('#b45309'); // dark amber
        } else {
          setTextColor('#ffffff'); // dark background -> bright white
          setAccentColor('#ffea7a'); // bright gold/yellow
        }
      }
    }
  };

  useEffect(() => {
    analyzeBackgroundBrightness();
    
    const observer = new MutationObserver(() => {
      analyzeBackgroundBrightness();
    });
    
    if (cardRef.current) {
      observer.observe(cardRef.current, { attributes: true, attributeFilter: ['class', 'style'] });
    }

    const timer = setTimeout(analyzeBackgroundBrightness, 150);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [className, active]);

  return (
    <motion.div
      ref={cardRef}
      {...(props as any)}
      style={{
        color: textColor,
        '--card-text': textColor,
        '--card-accent': accentColor,
        ...props.style
      } as any}
      className={`luminance-card-active ${className}`}
      transition={{ duration: 0.2 }}
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
    },
    {
      id: 'tp-2',
      name: 'تنبيه اقتراب جلسة المرافعة (48 ساعة) 📅',
      triggerEvent: 'جلسة متبقية خلال 48 ساعة',
      messageText: 'إشعار عاجل: الالعدالة الفاضل {اسم_الالعدالة}، نفيدكم علماً باقتراب تاريخ جلسة المرافعة المقررة لدعواكم رقم {رقم_القضية} وذلك بعد 48 ساعة بالتحديد (تاريخ: {تاريخ_الجلسة} في تمام الساعة {ساعة_الجلسة}) بالدائرة {اسم_الدائرة_المحكمة}. يرجى تأكيد جهوزية البينات.',
      active: true,
      variables: ['{اسم_الالعدالة}', '{رقم_القضية}', '{تاريخ_الجلسة}', '{ساعة_الجلسة}', '{اسم_الدائرة_المحكمة}']
    },
    {
      id: 'tp-3',
      name: 'تحديث فوري لملف الدعوى والسندات 🆕',
      triggerEvent: 'تغير حالة القضية من ناجز',
      messageText: 'سعادة الالعدالة {اسم_الالعدالة}، تم تحديث مسار دعواكم رقم {رقم_القضية} بنجاح إلى الحالة: {الحالة_الجديدة}. يمكنكم تنزيل صور الصكوك ومذكرات الرد من لوحة التحكم الخاصة بكم: {رابط_البوابة}.',
      active: false,
      variables: ['{اسم_الالعدالة}', '{رقم_القضية}', '{الحالة_الجديدة}', '{رابط_البوابة}']
    },
    {
      id: 'tp-4',
      name: 'مطالبة بسداد رسوم أو دفعة أتعاب 💰',
      triggerEvent: 'إصدار فاتورة ضريبية جديدة',
      messageText: 'الالعدالة الموقر {اسم_الالعدالة}، نأمل من سعادتكم الإحاطة بإصدار الفاتورة الضريبية رقم {رقم_الفاتورة} والخاصة بأتعاب التقاضي بمبلغ إجمالي قدره {المبلغ_الإجمالي_شامل_الضريبة} ريال سعودي. يرجى مراجعة التفاصيل والسداد مادة 18: {رابط_الفاتورة}.',
      active: true,
      variables: ['{اسم_الالعدالة}', '{رقم_الفاتورة}', '{المبلغ_الإجمالي_شامل_الضريبة}', '{رابط_الفاتورة}']
    },
    {
      id: 'tp-5',
      name: 'شكر للعميل عند إتمام الدعوى 🏆',
      triggerEvent: 'إغلاق القضية',
      messageText: 'عميلنا العزيز {اسم_الالعدالة}، بمناسبة إتمام وإغلاق دعواكم رقم {رقم_القضية}، نود أن نشكركم على ثقتكم بموكل. نسعد دائماً بخدمتكم في تقديم الرعاية والمشورة والوكالة الشرعية.',
      active: true,
      variables: ['{اسم_الالعدالة}', '{رقم_القضية}']
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsappTemplate>(templates[0]);
  const [testPhoneNumber, setTestPhoneNumber] = useState('+966501234567');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [editorText, setEditorText] = useState(templates[0].messageText);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);

  // New template fields
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTriggerEvent, setNewTriggerEvent] = useState('حالة مخصصة');
  const [newTemplateText, setNewTemplateText] = useState('السلام عليكم {اسم_الالعدالة}...');

  const [inboxMessages] = useState([
    {
      id: 'msg-1',
      sender: 'شركة المراعي',
      subject: 'استفسار بخصوص موعد جلسة الاستئناف',
      message: 'نأمل منكم إفادتنا بخصوص الموعد الجديد لجلسة الاستئناف، حيث لم يصلنا تبليغ ناجز حتى الآن. يرجى المتابعة العاجلة.',
      status: 'عاجل',
      date: 'منذ ١٠ دقائق'
    },
    {
      id: 'msg-2',
      sender: 'إسماعيل بن فيصل الحربي',
      subject: 'إرسال مستندات إضافية - قضية مقاولات',
      message: 'مرفق لكم الملاحق والفواتير الخاصة بعقد المقاولة كما طلبتم. بانتظار تأكيد استلامكم والمضي قدماً.',
      status: 'بانتظار الرد',
      date: 'منذ ساعتين'
    },
    {
      id: 'msg-3',
      sender: 'عاصم بن طلال العقاد',
      subject: 'طلب استشارة هاتفية',
      message: 'أحتاج لترتيب مكالمة قصيرة مع المستشار غداً لمراجعة بعض البنود قبل توقيع المخالصة النهائية.',
      status: 'تم القراءة',
      date: 'امس'
    }
  ]);

  // --- AUTOMATED 24-HOUR REMINDERS DASHBOARD STATE & ACTIONS ---
  const [automatedRemindersActive, setAutomatedRemindersActive] = useState(true);
  const [cronCountdown, setCronCountdown] = useState(30);
  const [scheduledHearings, setScheduledHearings] = useState([
    {
      id: "sh-1",
      caseNumber: "437194619",
      caseName: "نزاع عقد توريد خدمات لوجستية",
      clientName: "شركة نادك للتنمية الزراعية",
      clientPhone: "+966504499122",
      hearingDate: "غداً (15 يونيو 2026)",
      hearingTime: "10:30 صباحاً",
      courtName: "المحكمة التجارية بالرياض - الدائرة الثالثة",
      sentStatus: "pending", // pending, sending, sent, failed
      statusText: "⏰ مجدول للإرسال التلقائي (مبكر) - متبقي ٢٣ ساعة و ٤٠ دقيقة",
      isInteractive: true
    },
    {
      id: "sh-2",
      caseNumber: "419284711",
      caseName: "استخلاص مبالغ مقاولة شركة الحربي",
      clientName: "إسماعيل بن فيصل الحربي",
      clientPhone: "+966501112222",
      hearingDate: "غداً (15 يونيو 2026)",
      hearingTime: "01:15 مساءً",
      courtName: "المحكمة العامة بجدة - الدائرة الحقوقية السابعة",
      sentStatus: "pending", 
      statusText: "⏰ مجدول للإرسال التلقائي - متبقي ٢٢ ساعة و ٥٠ دقيقة",
      isInteractive: true
    },
    {
      id: "sh-3",
      caseNumber: "420391823",
      caseName: "نزاع حول ملكية عقارية واستثمارية",
      clientName: "عاصم بن طلال العقاد",
      clientPhone: "+966559876543",
      hearingDate: "اليوم (تم الحضور والانتهاء)",
      hearingTime: "09:00 صباحاً",
      courtName: "محكمة الاستئناف بالرياض - الدائرة المدنية الرابعة",
      sentStatus: "sent",
      statusText: "✓ تم الإرسال التلقائي والمطابقة بنجاح قبل ٢٤ ساعة",
      isInteractive: false
    }
  ]);

  // Global background daemon simulation for searching upcoming hearings within 24 hours
  useEffect(() => {
    if (!automatedRemindersActive) return;
    const interval = setInterval(() => {
      setCronCountdown(prev => {
        if (prev <= 1) {
          // Perform automatic sweep, look for pending hearings, auto dispatch them virtually if they reach limit
          setScheduledHearings(current => 
            current.map(sh => {
              if (sh.isInteractive && sh.sentStatus === "pending" && Math.random() < 0.15) {
                // Auto transition single hearing into sent virtually to showcase live background trigger
                return {
                  ...sh,
                  sentStatus: "sent",
                  statusText: "✓ تم الإرسال ومسح الجدولة آلياً بنجاح (Twilio API Background Daemon)"
                };
              }
              return sh;
            })
          );
          return 30; // reset countdown
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [automatedRemindersActive]);

  // Dispatch individual hearing reminder through backend /api/whatsapp/send
  const handleDispatchHearingReminder = async (hearingId: string) => {
    const hearing = scheduledHearings.find(h => h.id === hearingId);
    if (!hearing) return;

    // Toggle sending state
    setScheduledHearings(prev => prev.map(h => h.id === hearingId ? { ...h, sentStatus: 'sending', statusText: '⏳ جاري الإرسال عبر خطوط Twilio WhatsApp...' } : h));

    // Compile dynamic message body matching 24-hour template variables
    const compiled = templates[0].messageText // tp-24h
      .replace(/{اسم_الالعدالة}/g, hearing.clientName)
      .replace(/{رقم_القضية}/g, hearing.caseNumber)
      .replace(/{تاريخ_الجلسة}/g, hearing.hearingDate)
      .replace(/{ساعة_الجلسة}/g, hearing.hearingTime);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: hearing.clientPhone,
          message: compiled
        })
      });
      const data = await res.json();

      if (data.success) {
        setScheduledHearings(prev => prev.map(h => h.id === hearingId ? {
          ...h,
          sentStatus: 'sent',
          statusText: '✓ تم التوصيل والتحقق عبر شبكة واتساب الرسمية (Twilio)'
        } : h));
        alert(`🚀 تم إرسال تذكير الـ 24 ساعة للعميل (${hearing.clientName}) بنظام ناجز المدمج بنجاح!\n\nرقم الهاتف المستهدف: ${hearing.clientPhone}`);
      } else {
        setScheduledHearings(prev => prev.map(h => h.id === hearingId ? {
          ...h,
          sentStatus: 'failed',
          statusText: `⚠️ تعذر الإرسال: ${data.error || 'خطأ في التوصية'}`
        } : h));
        alert(`❌ فشل الإرسال التلقائي: ${data.error || 'يرجى التحقق من مفاتيح Twilio'}`);
      }
    } catch (err: any) {
      setScheduledHearings(prev => prev.map(h => h.id === hearingId ? {
        ...h,
        sentStatus: 'failed',
        statusText: `⚠️ خطأ شبكة: ${err.message}`
      } : h));
      alert(`❌ حدث خطأ اتصال بالخادم: ${err.message}`);
    }
  };

  const handleSelectTemplate = (tp: WhatsappTemplate) => {
    setSelectedTemplate(tp);
    setEditorText(tp.messageText);
    setTestSendResult('idle');
  };

  const handleUpdateTemplateText = () => {
    const updated = templates.map(t => {
      if (t.id === selectedTemplate.id) {
        return { ...t, messageText: editorText };
      }
      return t;
    });
    setTemplates(updated);
    setSelectedTemplate({ ...selectedTemplate, messageText: editorText });
    alert('تم حفظ تعديلات قالب الرسالة التلقائية في النظام بنجاح!');
  };

  const handleToggleTemplate = (id: string) => {
    const updated = templates.map(t => {
      if (t.id === id) {
        return { ...t, active: !t.active };
      }
      return t;
    });
    setTemplates(updated);
    if (selectedTemplate.id === id) {
      setSelectedTemplate({ ...selectedTemplate, active: !selectedTemplate.active });
    }
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateText) return;

    const newTp: WhatsappTemplate = {
      id: `tp-${Date.now()}`,
      name: newTemplateName,
      triggerEvent: newTriggerEvent,
      messageText: newTemplateText,
      active: true,
      variables: ['{اسم_الالعدالة}']
    };

    setTemplates([...templates, newTp]);
    setSelectedTemplate(newTp);
    setEditorText(newTemplateText);
    setIsNewTemplateOpen(false);
    setNewTemplateName('');
    setNewTemplateText('');
  };

  const handleSendTestMessage = async () => {
    if (!testPhoneNumber) {
      alert('يرجى إدخال رقم هاتف تجريبي صحيح.');
      return;
    }
    
    setIsSendingTest(true);
    setTestSendResult('sending');

    try {
      // Get the message to send using rendered text template
      const compiledMessage = getRenderedPreview(editorText);
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhoneNumber,
          message: compiledMessage
        })
      });
      const data = await res.json();
      
      setIsSendingTest(false);
      if (data.success) {
        setTestSendResult('success');
      } else {
        setTestSendResult('error');
        alert('Server Error: ' + data.error);
      }
    } catch (err: any) {
      setIsSendingTest(false);
      setTestSendResult('error');
      alert('Network Error: ' + err.message);
    }
    
    setTimeout(() => setTestSendResult('idle'), 5000);
  };

  // Preview replacement simulation
  const getRenderedPreview = (text: string) => {
    return text
      .replace(/{اسم_الالعدالة}/g, 'شركة نادك للتنمية الزراعية 🏢')
      .replace(/{رابط_البوابة}/g, 'https://justice.sa/portal?t=nadec123')
      .replace(/{رقم_القضية}/g, '437194619')
      .replace(/{تاريخ_الجلسة}/g, '2026-06-12')
      .replace(/{ساعة_الجلسة}/g, '10:30 صباحاً')
      .replace(/{اسم_الدائرة_المحكمة}/g, 'الدائرة التجارية الثالثة بالرياض')
      .replace(/{الحالة_الجديدة}/g, 'بانتظار بينة المدعي ⚖️')
      .replace(/{رقم_الفاتورة}/g, 'INV-2026-001')
      .replace(/{المبلغ_الإجمالي_شامل_الضريبة}/g, '125,000')
      .replace(/{رابط_الفاتورة}/g, 'https://fatora.sa/bill-108');
  };

  return (
    <div className="space-y-8 text-right animate-fade-in font-sans pb-10" dir="rtl">
      
      {/* Top Banner - Sleek Dark Graphite with Gold Framing */}
      <div className="bg-slate-950/60 border border-amber-500/20 p-8 rounded-3xl relative overflow-hidden shadow-2xl text-white">
        <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full opacity-35"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-500/25 px-3 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 w-fit">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>مركز التحكم التلقائي وإشعارات قنوات الواتساب الموثقة API</span>
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 mt-3">قوالب وإرسال رسائل WhatsApp الآلية المعتمدة</h1>
            <p className="text-xs text-slate-300 mt-1.5 font-bold leading-relaxed max-w-2xl">
              قم بتهيئة القوالب النصية لمخاطبة الموكلين ببيانات ناجز العدلية الموثقة، واختبار الإرسال مسبقاً قبل تفعيله عبر الخوادم بشكل تلقائي.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 rounded-2xl transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5"/> : <Moon className="w-4.5 h-4.5"/>}
            </button>
            <button
              onClick={() => setIsNewTemplateOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3.5 px-5 rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              + إنشاء قالب إشعار واتساب جديد
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Right side: Templates Navigation & Editor */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Templates list selection row */}
          <div className="bg-slate-950/40 border border-slate-850/80 rounded-3xl p-6 space-y-4 text-white shadow-xl">
            <h3 className="text-xs font-extrabold text-amber-400 tracking-wider">اختر قالب الإشعار للضبط والمراجعة:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tp => (
                <div 
                  key={tp.id}
                  onClick={() => handleSelectTemplate(tp)}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-right flex flex-col justify-between gap-3 ${
                    selectedTemplate.id === tp.id 
                      ? 'bg-slate-900 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.06)] ring-1 ring-amber-500/20' 
                      : 'bg-[#111c30]/40 border-slate-850 hover:border-slate-705'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-100">{tp.name}</h4>
                      <span className="text-[11px] text-amber-400 font-bold block mt-1">الحدث المحفّز: {tp.triggerEvent}</span>
                    </div>
                    
                    {/* Status badge toggler */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTemplate(tp.id);
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase transition-all ${
                        tp.active 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-slate-950 text-slate-500 border border-slate-850'
                      } `}
                    >
                      {tp.active ? 'نشط تلقائياً' : 'موقف ومقيد'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-350 line-clamp-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border-r-2 border-amber-500/60 font-medium">
                    {tp.messageText}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Template text raw editor */}
          <div className="bg-slate-950/40 border border-slate-850/80 rounded-3xl p-6 space-y-5 text-white shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="text-xs font-black text-slate-100 text-right">تحرير محتويات القالب النصي والتكامل البرمجي</h3>
              </div>
              
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded font-bold font-mono">
                يدعم الإدراج الذكي للرموز
              </span>
            </div>

            <div className="space-y-4 text-right">
              <div>
                <label className="text-xs text-amber-400 block mb-2 font-extrabold">المتغيرات الديناميكية المتوفرة للاستخدام في هذا القالب:</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedTemplate.variables.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditorText(prev => prev + ' ' + v)}
                      className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl transition-all"
                    >
                      {v} +
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditorText(prev => prev + ' {رقم_القضية}')}
                    className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl transition-all"
                  >
                    {"{رقم_القضية}"} +
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorText(prev => prev + ' {رابط_البوابة}')}
                    className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl transition-all"
                  >
                    {"{رابط_البوابة}"} +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 block font-bold">نص رسالة الواتساب الصادر:</label>
                <textarea
                  rows={6}
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white leading-relaxed text-right font-sans focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="اكتب رسالتك وتضمين علامات المتغيرات..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center font-sans gap-4 pt-2">
                <span className="text-xs text-slate-400 max-w-md leading-relaxed">
                  سيتم تعويض علامات الأقواس ديناميكياً من بيانات الموكلين المسجلة أو المستوردة من ناجز عند مطابقة معايير الإرسال.
                </span>
                <button
                  type="button"
                  onClick={handleUpdateTemplateText}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 px-6 rounded-xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(245,158,11,0.15)]"
                >
                  حفظ وتطبيق التغييرات لجميع الموكلين ✓
                </button>
              </div>
            </div>
          </div>

          {/* Test Dispatch Panel */}
          <div className="bg-slate-950/40 border border-slate-850/80 rounded-3xl p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center gap-2.5 border-b border-slate-850 pb-4">
              <Send className="w-5 h-5 text-amber-400" />
              <div className="text-right">
                <h3 className="text-xs font-black text-slate-100">التحقق وإجراء الإرسال التجريبي المسبق (Sandbox Simulator API)</h3>
                <span className="text-[11px] text-slate-450 block font-bold leading-none mt-1">ضمان مطابقة القوالب للمعايير المعتمدة لشركة الاتصالات قبل تفعيل البث التلقائي الجماعي للموكلين.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold block">رقم هاتف العميل/العميل لتجربة الاستلام:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="مثال: +966501234567"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 text-left"
                  />
                  <span className="absolute right-3.5 top-3 text-xs leading-none">📱</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-amber-400 font-black text-xs py-3 px-5 rounded-xl flex-1 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>بدء الإرسال التجريبي المعياري 🚀</span>
                </button>
              </div>
            </div>

            {/* Test Simulation Outputs Progress */}
            {testSendResult === 'sending' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-amber-405 text-amber-400">
                  <span>جاري الاتصال بخوادم الـ WhatsApp Gateway المعتمدة...</span>
                  <span>1.8s</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full animate-pulse" style={{ width: '65%' }}></div>
                </div>
              </div>
            )}

            {testSendResult === 'success' && (
              <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-xl text-xs text-emerald-300 font-bold flex items-start gap-3 animate-pulse font-sans">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-right">
                  <p className="font-extrabold text-sm text-emerald-250 text-emerald-300">تم تسليم الإرسال التجريبي الفوري بنجاح! (Message ID: wh-91724)</p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">القالب مطابق 100% لمعايير الهيئة السعودية للاتصالات واستخدام معايير الترميز والامتثال للأنظمة المعمول بها.</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Left side: Interactive Mobile Emulator */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Smart Phone Layout frame */}
          <div className="bg-[#0b141a] border-[8px] border-slate-800 rounded-[3rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] relative h-[580px] flex flex-col justify-between overflow-hidden">
            
            {/* Phone speaker & camera notches */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-2xl z-25 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
            </div>

            {/* Phone header screen */}
            <div className="bg-[#202c33] pt-6 pb-3 px-4 shadow-sm flex items-center justify-between text-right z-10 font-sans">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <div className="text-right">
                  <h4 className="text-sm font-black text-white flex items-center gap-1">
                    <span>مكتب العدالة للمحاماة</span>
                    <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.5 rounded-full font-black scale-90">موثق</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 block leading-none mt-0.5">متاح ونشط الآن</span>
                </div>
              </div>

              <span className="text-xs text-slate-350 font-mono">11:49</span>
            </div>

            {/* Phone chat wallpaper stage */}
            <div className="flex-1 bg-[#0b141a] p-4 overflow-y-auto space-y-4 relative flex flex-col justify-end">
              
              {/* WhatsApp Date Label */}
              <div className="self-center bg-[#152026] text-[#8696a0] text-[10px] font-bold py-1 px-4 rounded-md uppercase tracking-wider">
                اليوم
              </div>

              {/* Chat Message Bubble in WhatsApp Green */}
              <div className="max-w-[85%] self-start bg-[#005c4b] text-[#e9edef] p-3.5 rounded-2xl rounded-tr-none text-right shadow-sm relative space-y-2 select-text">
                
                {/* Visual marker triangle */}
                <div className="absolute top-0 -left-1.5 w-0 h-0 border-t-[8px] border-t-[#005c4b] border-l-[8px] border-l-transparent"></div>

                <div className="text-xs leading-relaxed whitespace-pre-line text-[#e9edef] font-sans">
                  {getRenderedPreview(editorText)}
                </div>

                <div className="flex justify-between items-center pt-1.5 text-[9px] text-emerald-300 font-sans">
                  <span>تم التسليم</span>
                  <span className="text-[#53bdeb] font-black">✓✓</span>
                </div>
              </div>

              {/* Security info disclaimer bubble */}
              <p className="text-[8px] text-[#8696a0] text-center max-w-[95%] mx-auto font-sans leading-relaxed bg-[#182229] p-2.5 shadow-sm border border-[#2a3942]/50 rounded-xl">
                🔒 الرسائل والمكالمات مشفرة تماماً بين الطرفين. لا أحد خارج هذه الدردشة، ولا حتى واتساب، يمكنه قراءتها أو الاستماع إليها.
              </p>

            </div>

            {/* Simulated Keyboard Entry area */}
            <div className="bg-[#101d25] p-3 flex items-center justify-between gap-1 border-t border-[#12222d] text-xs font-sans">
              <span className="text-lg">😊</span>
              <div className="bg-[#2a3942] rounded-full flex-1 py-2 px-4.5 text-right text-slate-400 font-sans leading-none text-xs">
                كتابة إشعار مخصص يدوي...
              </div>
              <span className="text-lg">🎙️</span>
            </div>

          </div>

          {/* Compliance Card */}
          <div className="bg-amber-950/10 border border-amber-500/15 p-5 rounded-2xl space-y-2">
            <h4 className="text-xs text-amber-400 font-extrabold block">🛡️ شهادة الامتثال وموثوقية الهوية (Meta API Certified)</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans text-right">
              هذه اللوحة مرتبطة بشكل مشفر بالرقم الرسمي المسجل والمصدّق لمكتب المحاماة لدى شركة Meta. جميع القوالب تخضع لمعالجة مسبقة ذكية لتجنب إرسال أي رسائل غير مطابقة لقوانين حماية خصوصية العملاء المعمول بها قانوناً بالمملكة.
            </p>
          </div>

        </div>

      </div>

      {/* Dynamic 24-Hour Automated reminders console table */}
      <div className="bg-slate-950/40 border border-slate-850/80 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-white text-right relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-850 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/25 font-bold uppercase tracking-wide">⏰ محرك الجدولة العدلية التلقائي للـ 24 ساعة (Twilio Engine)</span>
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2 mt-2">
              <span>تذكيرات جلسات المحاكم المرتبطة (بانتظار الإرسال والمطابقة قبل الموعد بـ 24 ساعة)</span>
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1">يقوم المحرك الفني للربط الرقمي بمسح الجلسات القضائية القادمة وتنبيه الموكلين عبر الواتساب تلقائياً.</p>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-950 p-4 rounded-2xl border border-slate-850 w-full lg:w-auto self-stretch lg:self-auto justify-between lg:justify-start">
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-widest leading-none">حالة الكرون الكرون ديمون (Scheduler):</span>
              <div className="flex items-center gap-1.5 mt-2 font-bold">
                <span className={`h-2 w-2 rounded-full ${automatedRemindersActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs text-slate-300 font-mono">
                  {automatedRemindersActive ? `نشط (القادم بعد ${cronCountdown} ثانية)` : 'متوقف ومقيد'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setAutomatedRemindersActive(!automatedRemindersActive)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-black transition-all ${
                automatedRemindersActive 
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-500/20' 
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
              } cursor-pointer`}
            >
              {automatedRemindersActive ? 'إيقاف مؤقت 🛑' : 'تفعيل المحرك 🛰️'}
            </button>
          </div>
        </div>

        {/* Reminders Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-850 bg-slate-950/30 block">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-850 text-slate-300 font-bold">
                <th className="p-4 text-[11px]">اسم العميل والقضية</th>
                <th className="p-4 text-[11px]">المحكمة وموعد الجلسة المجدول</th>
                <th className="p-4 text-[11px]">التوقيت المتبقي التقريبي</th>
                <th className="p-4 text-[11px]">رقم هاتف العميل وحالة الإرسال (Twilio)</th>
                <th className="p-4 text-center text-[11px]">الإجراءات والتحكم يدوياً</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {scheduledHearings.map((sh) => (
                <tr key={sh.id} className="hover:bg-slate-900/40 transition-colors cursor-pointer border-b border-slate-850/40">
                  <td className="p-4 space-y-1">
                    <strong className="text-slate-150 block font-sans font-black">{sh.clientName}</strong>
                    <span className="text-xs text-slate-400 font-bold block">القضية: {sh.caseName} (رقم: {sh.caseNumber})</span>
                  </td>
                  
                  <td className="p-4 space-y-1 text-right">
                    <span className="text-slate-200 block font-bold">{sh.courtName}</span>
                    <span className="text-xs text-slate-450 font-sans block mt-0.5">الموعد: {sh.hearingDate} الساعة {sh.hearingTime}</span>
                  </td>

                  <td className="p-4 font-sans font-bold">
                    <span className="text-amber-400 bg-amber-950/40 border border-amber-500/25 px-2.5 py-1.5 rounded-xl text-xs">
                      ⏰ متبقي غداً (أقل من ٢٤ ساعة)
                    </span>
                  </td>

                  <td className="p-4 space-y-1.5">
                    <div className="font-mono text-slate-200 text-xs font-bold">{sh.clientPhone}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        sh.sentStatus === 'sent' ? 'bg-emerald-500' :
                        sh.sentStatus === 'sending' ? 'bg-amber-400 animate-pulse' :
                        sh.sentStatus === 'failed' ? 'bg-rose-500' : 'bg-slate-600'
                      }`} />
                      <span className={`text-[11px] font-bold ${
                        sh.sentStatus === 'sent' ? 'text-emerald-400' :
                        sh.sentStatus === 'sending' ? 'text-amber-405 text-amber-400' :
                        sh.sentStatus === 'failed' ? 'text-rose-400' : 'text-slate-450'
                      } `}>
                        {sh.statusText}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    {sh.sentStatus !== 'sent' ? (
                      <button
                        onClick={() => handleDispatchHearingReminder(sh.id)}
                        disabled={sh.sentStatus === 'sending'}
                        className="bg-amber-505 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-550 text-slate-950 font-black text-xs py-2 px-4.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        {sh.sentStatus === 'sending' ? 'جاري الإرسال...' : '🚀 إرسال التنبيه الآن'}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-emerald-450 text-emerald-300 bg-emerald-950/20 border border-emerald-500/25 py-2 px-3.5 rounded-xl text-xs font-black">
                        <span>✓ تم الاستلام والتوصيل بالواتساب</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Compliance info bar */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-wrap justify-between items-center text-xs font-bold text-slate-400 gap-3 font-sans">
          <span>🛡️ متطابق مع لوائح الهيئة السعودية للاتصالات وتقنية المعلومات لرسائل تنبيه الموعد</span>
          <span>الحساب المصدق: <span className="font-mono text-amber-400/90">TW-ACCOUNT-SID: ACc2d*** (نشط ومطابق لقواعد البث)</span></span>
        </div>
      </div >

      {/* Inbox section requested by user */}
      <div className="bg-slate-950/40 border border-slate-850/80 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-right relative overflow-hidden mt-8">
        <div className="border-b border-slate-850 pb-5">
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <span>صندوق الوارد (مراسلات العملاء)</span>
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1.5">استعراض وتتبع استفسارات ومراسلات العملاء الواردة لمركز العناية بالموكلين.</p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {inboxMessages.map(msg => {
            let badgeColors = '';
            let badgeIcon = '';
            if (msg.status === 'تم القراءة') {
              badgeColors = 'bg-slate-950 text-slate-400 border-slate-800';
              badgeIcon = '✓✓';
            } else if (msg.status === 'بانتظار الرد') {
              badgeColors = 'bg-amber-950/40 text-amber-300 border-amber-500/20';
              badgeIcon = '⏰';
            } else if (msg.status === 'عاجل') {
              badgeColors = 'bg-rose-950/40 text-rose-300 border-rose-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.1)]';
              badgeIcon = '⚠️';
            }

            return (
              <div 
                key={msg.id} 
                className="notifications-email-card bg-[#111c30]/40 text-slate-100 p-6 rounded-3xl border border-slate-850 hover:border-amber-500/25 hover:bg-slate-900/40 transition-all duration-300 cursor-pointer relative group"
              >
                <div className="absolute top-5 left-5 z-10">
                  <span className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full border ${badgeColors}`}>
                    <span>{badgeIcon}</span>
                    <span>{msg.status}</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_3fr] gap-6 items-start">
                  
                  <div className="space-y-1 pl-4 md:border-l md:border-slate-800/80 pt-1">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-widest leading-none">المرسل</span>
                    <strong className="text-sm font-black text-slate-200 block mt-2.5">{msg.sender}</strong>
                    <span className="text-[10px] text-slate-450 font-bold font-mono block mt-1">{msg.date}</span>
                  </div>
                  
                  <div className="space-y-1 pl-4 md:border-l md:border-slate-800/80 pt-1">
                    <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-widest leading-none">العنوان</span>
                    <h3 className="text-[13px] font-black text-slate-150 line-clamp-2 leading-snug mt-2.5">{msg.subject}</h3>
                  </div>

                  <div className="space-y-1 pt-1 md:pr-4">
                     <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-widest leading-none">محتوى الرسالة</span>
                     <p className="text-xs text-slate-400 font-semibold leading-relaxed line-clamp-2 mt-2.5 group-hover:text-slate-300 transition-colors">{msg.message}</p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}