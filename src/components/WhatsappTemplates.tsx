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
  ChevronDown,
  Archive,
  MailOpen
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

  const [inboxMessages, setInboxMessages] = useState([
    {
      id: 'msg-1',
      sender: 'شركة المراعي',
      subject: 'استفسار بخصوص موعد جلسة الاستئناف',
      message: 'نأمل منكم إفادتنا بخصوص الموعد الجديد لجلسة الاستئناف، حيث لم يصلنا تبليغ ناجز حتى الآن. يرجى المتابعة العاجلة.',
      status: 'عاجل',
      type: 'قانوني',
      date: 'منذ ١٠ دقائق'
    },
    {
      id: 'msg-2',
      sender: 'إسماعيل بن فيصل الحربي',
      subject: 'إرسال مستندات إضافية - قضية مقاولات',
      message: 'مرفق لكم الملاحق والفواتير الخاصة بعقد المقاولة كما طلبتم. بانتظار تأكيد استلامكم والمضي قدماً.',
      status: 'بانتظار الرد',
      type: 'إداري',
      date: 'منذ ساعتين'
    },
    {
      id: 'msg-3',
      sender: 'عاصم بن طلال العقاد',
      subject: 'طلب استشارة هاتفية',
      message: 'أحتاج لترتيب مكالمة قصيرة مع المستشار غداً لمراجعة بعض البنود قبل توقيع المخالصة النهائية. يرجى إعلامي بالوقت المناسب لتنسيق الموعد نظرا لارتباطي بعدة التزامات.',
      status: 'مقروء',
      type: 'مالي',
      date: 'امس'
    }
  ]);

  const [upcomingReminders] = useState([
    {
      id: 'rem-1',
      client: 'شركة تبوك للتنمية الزراعية',
      caseNumber: '420391823 - نزاع عقاري',
      scheduledDate: '2023-11-05 08:00',
      templateName: 'تذكير آلي بالجلسة (24 ساعة)',
      status: 'آلي',
      type: 'تذكير جلسة'
    },
    {
      id: 'rem-2',
      client: 'مؤسسة الشايع الطبية',
      caseNumber: '419284711 - تصفية شراكة',
      scheduledDate: '2023-11-10 10:30',
      templateName: 'مطالبة بسداد دفعة أتعاب',
      status: 'مجدول',
      type: 'إشعار مالي'
    }
  ]);

  const [expandedMsgIds, setExpandedMsgIds] = useState<string[]>([]);
  const [sentSearchTerm, setSentSearchTerm] = useState('');
  const [sentMessages, setSentMessages] = useState([
    { id: 1, client: 'شركة نادك للتنمية', caseName: 'نزاع تجاري', date: '2026-06-12', msg: 'تذكير بموعد الجلسة غداً...', status: 'success', read: true },
    { id: 2, client: 'مؤسسة الشايع الطبية', caseName: 'تصفية شراكة', date: '2026-06-10', msg: 'مرفق لكم فاتورة أتعاب...', status: 'success', read: true },
    { id: 3, client: 'فيصل الحربي', caseName: 'قضية عمالية', date: '2026-06-08', msg: 'نعتذر، تم تأجيل الجلسة...', status: 'failed', read: false },
    { id: 4, client: 'عاصم العقاد', caseName: 'مخالصة نهائية', date: '2026-06-05', msg: 'عاجل: نأمل حضوركم للتوقيع على...', status: 'urgent', read: false }
  ]);

  const filteredSentMessages = sentMessages.filter(row => 
    row.client.includes(sentSearchTerm) || 
    row.caseName.includes(sentSearchTerm) || 
    row.msg.includes(sentSearchTerm)
  );

  const filteredInboxMessages = inboxMessages.filter(msg =>
    msg.sender.includes(sentSearchTerm) ||
    msg.subject.includes(sentSearchTerm) ||
    msg.message.includes(sentSearchTerm)
  );

  const toggleMsgExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMsgIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const executeMsgAction = (id: string, actionName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simulate action
    setInboxMessages(prev => prev.map(msg => msg.id === id ? { ...msg, status: actionName === 'archive' ? 'مؤرشف' : (actionName === 'unread' ? 'بانتظار الرد' : msg.status) } : msg));
  };

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

  const [activeTab, setActiveTab] = useState<'new_notification' | 'outbox' | 'templates' | 'drafts'>('new_notification');
  const [drafts, setDrafts] = useState([
    { id: 'd-1', recipient: 'فهد العتيبي', subject: 'تنبيه موعد خبير', date: '2026-06-13', content: 'نحيطكم علما بأن الدائرة قررت ندب خبير...' },
    { id: 'd-2', recipient: 'منى السليمان', subject: 'طلب تزويدنا بالعقود', date: '2026-06-11', content: 'نأمل تزويدنا بأصول العقود الموقعة...' }
  ]);
  const [requestSignature, setRequestSignature] = useState(false);

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
            <h1 className="text-xl md:text-2xl font-black text-slate-100 mt-3">إشعارات ومراسلة العملاء المعتمدة</h1>
            <p className="text-xs text-slate-300 mt-1.5 font-bold leading-relaxed max-w-2xl">
              إدارة الإشعارات النصية ورسائل الواتساب، إنشاء قوالب جاهزة، ومتابعة سجل المراسلات الصادرة للعملاء بكل سهولة.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 rounded-2xl transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5"/> : <Moon className="w-4.5 h-4.5"/>}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#0b1325] border border-slate-800 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-lg">
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
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all ${
                isActive 
                  ? 'bg-amber-500 text-slate-900 shadow-md transform scale-100 -translate-y-0.5' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Body */}
      {activeTab === 'templates' && (
        <>
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
          <div className="bg-[#0b1325] border border-amber-500/20 rounded-3xl p-6 space-y-5 text-white shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-black text-slate-100 text-right">تحرير محتويات القالب النصي والتكامل البرمجي</h3>
              </div>
              
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded font-bold font-mono">
                يدعم الإدراج الذكي للرموز
              </span>
            </div>

            <div className="space-y-4 text-right">
              <div>
                <label className="text-xs text-amber-400 block mb-2 font-extrabold pb-0.5">المتغيرات الديناميكية المتوفرة للاستخدام في هذا القالب:</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedTemplate.variables.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditorText(prev => prev + ' ' + v)}
                      className="text-xs bg-[#111c30] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/35 text-slate-100 hover:text-amber-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-sm"
                    >
                      {v} +
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditorText(prev => prev + ' {رقم_القضية}')}
                    className="text-xs bg-[#111c30] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/35 text-slate-100 hover:text-amber-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-sm"
                  >
                    {"{رقم_القضية}"} +
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorText(prev => prev + ' {رابط_البوابة}')}
                    className="text-xs bg-[#111c30] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/35 text-slate-100 hover:text-amber-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-sm"
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
                  className="w-full bg-[#050b16] border border-slate-800 rounded-2xl p-4 text-xs text-slate-100 leading-relaxed text-right font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
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
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3.5 px-6 rounded-2xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(245,158,11,0.25)] cursor-pointer"
                >
                  حفظ وتطبيق التغييرات لجميع الموكلين ✓
                </button>
              </div>
            </div>
          </div>

          {/* Test Dispatch Panel */}
          <div className="bg-[#0b1325] border border-amber-500/10 rounded-3xl p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <Send className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-right">
                <h3 className="text-sm font-black text-slate-100">التحقق وإجراء الإرسال التجريبي المسبق (Sandbox Simulator API)</h3>
                <span className="text-xs text-slate-400 block font-medium leading-normal mt-1">ضمان مطابقة القوالب للمعايير المعتمدة لشركة الاتصالات قبل تفعيل البث التلقائي الجماعي للموكلين.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-2">
              <div className="space-y-1.5 text-right font-sans">
                <label className="text-xs text-slate-300 font-bold block">رقم هاتف العميل/العميل لتجربة الاستلام:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="مثال: +966501234567"
                    className="w-full bg-[#050b16] border border-slate-800 text-slate-100 font-mono text-xs rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 text-left"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs leading-none">📱</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3.5 px-5 rounded-2xl flex-1 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>بدء الإرسال التجريبي المعياري 🚀</span>
                </button>
              </div>
            </div>

            {/* Test Simulation Outputs Progress */}
            {testSendResult === 'sending' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-bold text-amber-400">
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
                  <p className="font-extrabold text-sm text-emerald-300 animate-pulse">تم تسليم الإرسال التجريبي الفوري بنجاح! (Message ID: wh-91724)</p>
                  <p className="text-xs text-slate-450 mt-1 font-semibold leading-relaxed">القالب مطابق 100% لمعايير الهيئة السعودية للاتصالات واستخدام معايير الترميز والامتثال للأنظمة المعمول بها.</p>
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
          <div className="bg-[#0b1325] border border-amber-500/20 p-5 rounded-2xl space-y-2">
            <h4 className="text-xs text-amber-400 font-black">🛡️ شهادة الامتثال وموائمة الهوية (Meta API Certified)</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans text-right">
              هذه اللوحة مرتبطة بشكل مشفر بالرقم الرسمي المسجل والمصدّق لمكتب المحاماة لدى شركة Meta. جميع القوالب تخضع لمعالجة مسبقة ذكية لتجنب إرسال أي رسائل غير مطابقة لقوانين حماية خصوصية العملاء المعمول بها قانوناً بالمملكة.
            </p>
          </div>

        </div>

      </div>

      {/* Dynamic 24-Hour Automated reminders console section */}
      <div className="bg-[#0b1325] border border-amber-500/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-white text-right relative overflow-hidden mt-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/25 font-bold uppercase tracking-wide font-sans">⏰ محرك الجدولة العدلية التلقائي للـ 24 ساعة (Twilio Engine)</span>
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2 mt-2 font-sans">
              <span>تذكيرات جلسات المحاكم المرتبطة (بانتظار الإرسال والمطابقة قبل الموعد بـ 24 ساعة)</span>
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1 font-sans">يقوم المحرك الفني للربط الرقمي بمسح الجلسات القضائية القادمة وتنبيه الموكلين عبر الواتساب تلقائياً.</p>
          </div>

          <div className="flex items-center gap-3.5 bg-[#050b16] p-4 rounded-2xl border border-slate-800 w-full lg:w-auto self-stretch lg:self-auto justify-between lg:justify-start">
            <div className="text-right">
              <span className="text-[9px] text-[#8696a0] block font-bold uppercase tracking-widest leading-none font-sans">حالة الجدولة (Scheduler):</span>
              <div className="flex items-center gap-1.5 mt-2 font-bold font-sans">
                <span className={`h-2.5 w-2.5 rounded-full ${automatedRemindersActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs text-slate-300">
                  {automatedRemindersActive ? `نشط (القادم بعد ${cronCountdown} ثانية)` : 'متوقف ومقيد'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setAutomatedRemindersActive(!automatedRemindersActive)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-black transition-all ${
                automatedRemindersActive 
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-500/20 hover:bg-rose-900/40' 
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-905/40'
              } cursor-pointer font-sans`}
            >
              {automatedRemindersActive ? 'إيقاف مؤقت 🛑' : 'تفعيل المحرك 🛰️'}
            </button>
          </div>
        </div>

        {/* Reminders Grid Card Layout */}
        <div className="space-y-4 pt-2">
          {/* Header row for large screens */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3.5 bg-[#050b16] border border-slate-850 rounded-2xl text-[#c5a880] font-black text-xs font-sans">
            <div className="col-span-3">اسم العميل والقضية</div>
            <div className="col-span-3">المحكمة وموعد الجلسة المجدول</div>
            <div className="col-span-2">التوقيت المتبقي التقريبي</div>
            <div className="col-span-2">الهاتف وحالة الإرسال (Twilio)</div>
            <div className="col-span-2 text-center">الإجراءات والتحكم يدوياً</div>
          </div>

          {/* List of custom card rows */}
          <div className="space-y-3">
            {scheduledHearings.map((sh) => (
              <div 
                key={sh.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-6 bg-[#0c1424] hover:bg-[#111c30] border border-slate-800 hover:border-amber-500/35 rounded-3xl transition-all duration-300 shadow-md text-right text-xs"
              >
                {/* 1. Client Name & Case Details */}
                <div className="col-span-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block lg:hidden pb-1 font-sans">اسم العميل والقضية:</span>
                  <strong className="text-slate-100 text-[14px] font-black block leading-snug">{sh.clientName}</strong>
                  <span className="text-xs text-amber-400 font-bold block">القضية: {sh.caseName} (رقم: {sh.caseNumber})</span>
                </div>

                {/* 2. Court and Scheduled Hearing Date */}
                <div className="col-span-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block lg:hidden pb-1 font-sans">المحكمة وموعد الجلسة المجدول:</span>
                  <strong className="text-slate-200 block font-extrabold text-[13px]">{sh.courtName}</strong>
                  <span className="text-xs text-slate-300 block font-medium">الموعد: {sh.hearingDate} <span className="text-[#c5a880] font-bold">الساعة {sh.hearingTime}</span></span>
                </div>

                {/* 3. Approx Time Remaining */}
                <div className="col-span-2 flex items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block lg:hidden ml-2 pb-1 font-sans">التوقيت المتبقي:</span>
                  <span className="text-amber-300 bg-amber-950/50 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm font-sans">
                    ⏰ متبقي غداً (أقل من ٢٤ ساعة)
                  </span>
                </div>

                {/* 4. Client phone & Twilio Status */}
                <div className="col-span-2 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block lg:hidden pb-1 font-sans">رقم هاتف العميل وحالة الإرسال:</span>
                  <div className="font-mono text-slate-200 text-xs font-bold leading-none tracking-wide">{sh.clientPhone}</div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      sh.sentStatus === 'sent' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                      sh.sentStatus === 'sending' ? 'bg-amber-400 animate-pulse' :
                      sh.sentStatus === 'failed' ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'
                    }`} />
                    <span className={`text-[11px] font-black font-sans ${
                      sh.sentStatus === 'sent' ? 'text-emerald-400' :
                      sh.sentStatus === 'sending' ? 'text-amber-400' :
                      sh.sentStatus === 'failed' ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {sh.statusText}
                    </span>
                  </div>
                </div>

                {/* 5. Dispatch Action Button */}
                <div className="col-span-2 flex items-center justify-start lg:justify-center">
                  {sh.sentStatus !== 'sent' ? (
                    <button
                      onClick={() => handleDispatchHearingReminder(sh.id)}
                      disabled={sh.sentStatus === 'sending'}
                      className="w-full lg:w-auto bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs py-2.5 px-5 rounded-2xl shadow-md transition-all cursor-pointer active:scale-95 font-sans"
                    >
                      {sh.sentStatus === 'sending' ? 'جاري الإرسال...' : '🚀 إرسال التنبيه الآن'}
                    </button>
                  ) : (
                    <div className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 py-2.5 px-4 rounded-xl text-xs font-black shadow-sm font-sans">
                      <span>✓ تم الاستلام والتوصيل بالواتساب</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Compliance info bar */}
        <div className="bg-[#050b16] p-4 rounded-2xl border border-slate-800 flex flex-wrap justify-between items-center text-xs font-bold text-slate-400 gap-3 font-sans">
          <span>🛡️ متطابق مع لوائح الهيئة السعودية للاتصالات وتقنية المعلومات لرسائل تنبيه الموعد</span>
          <span>الحساب المصدق: <span className="font-mono text-amber-400/90">TW-ACCOUNT-SID: ACc2d*** (نشط ومطابق لقواعد البث)</span></span>
        </div>
      </div>
      </>
      )}

      {/* Manual Notification Dispatch Section */}
      {activeTab === 'new_notification' && (
      <div className="bg-[#0b1325] border border-amber-500/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-right relative overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5">
           <div className="space-y-1">
             <span className="text-[10px] bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full border border-sky-500/25 font-bold uppercase tracking-wide font-sans">📤 إرسال إشعار فوري وتذكير</span>
             <h2 className="text-lg font-black text-slate-100 flex items-center gap-2 mt-2 font-sans">
               <span>إرسال إشعار مخصص للعملاء (مراسلة سريعة)</span>
             </h2>
             <p className="text-xs text-slate-400 font-bold mt-1 font-sans">قم بتحديد العميل والقضية واختر قالباً جاهزاً أو اكتب رسالتك ليتم إرسالها فوراً.</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] text-slate-300 font-bold">العميل المستفيد:</label>
            <select id="clientSelect" className="w-full bg-[#050b16] border border-slate-800 text-slate-100 font-sans text-xs rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500">
              <option value="">-- اختر العميل --</option>
              <option value="شركة نادك للتنمية الزراعية">شركة نادك للتنمية الزراعية</option>
              <option value="إسماعيل بن فيصل الحربي">إسماعيل بن فيصل الحربي</option>
              <option value="عاصم بن طلال العقاد">عاصم بن طلال العقاد</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] text-slate-300 font-bold">القضية / الملف:</label>
            <select id="caseSelect" className="w-full bg-[#050b16] border border-slate-800 text-slate-100 font-sans text-xs rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500">
              <option value="">-- اختر القضية --</option>
              <option value="437194619">437194619 - نزاع عقد توريد</option>
              <option value="419284711">419284711 - استخلاص مبالغ مقاولة</option>
              <option value="420391823">420391823 - نزاع حول ملكية عقارية</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-[11px] text-slate-300 font-bold">اختر من القوالب الجاهزة (اختياري):</label>
            <select 
               className="w-full bg-[#050b16] border border-slate-800 text-amber-100 font-sans text-xs rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500"
               onChange={(e) => {
                 const t = templates.find(t => t.id === e.target.value);
                 if(t) {
                   const clientEl = document.getElementById('clientSelect') as HTMLSelectElement;
                   const caseEl = document.getElementById('caseSelect') as HTMLSelectElement;
                   const clientName = clientEl?.value || '{اسم_الالعدالة}';
                   const caseNumber = caseEl?.value || '{رقم_القضية}';
                   // Auto-fill template with selected dropdown values if present
                   const filledText = t.messageText
                      .replace(/{اسم_الالعدالة}/g, clientName)
                      .replace(/{رقم_القضية}/g, caseNumber);
                   setEditorText(filledText);
                 }
               }}
            >
              <option value="">-- قوالب جاهزة --</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
           <label className="text-[11px] text-slate-300 font-bold">نص الإشعار:</label>
           <textarea
              rows={4}
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              className="w-full bg-[#050b16] border border-slate-800 rounded-xl p-4 text-xs text-slate-100 leading-relaxed text-right font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
              placeholder="اكتب رسالة الإشعار هنا..."
           />
        </div>
        <div className="flex items-center gap-4 pt-2">
           <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={requestSignature}
                onChange={(e) => setRequestSignature(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded border-slate-700 bg-slate-900"
              />
              <span className="text-xs font-bold text-slate-300 group-hover:text-amber-500 transition-colors">طلب توقيع العميل (رابط تفعيل رقمي آمن)</span>
           </label>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
           <button
              type="button"
              onClick={() => alert('تم حفظ المسودة بنجاح!')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 px-6 rounded-xl transition-all"
           >
              حفظ كمسودة
           </button>
           <button
              type="button"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 px-8 rounded-xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(245,158,11,0.25)] cursor-pointer flex items-center gap-2"
           >
              <Send className="w-4 h-4" />
              <span>إرسال الإشعار الآن</span>
           </button>
        </div>
      </div>
      )}

      {/* Outbox & Inbox Tab Content */}
      {activeTab === 'outbox' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Sent Messages Data Table section */}
          <div className="bg-[#0b1325] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-right relative overflow-hidden mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-500" />
                  <span>المراسلات الصادرة (Sent)</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1.5 font-sans">جدول عرض بيانات الإشعارات السابقة المرسلة للعملاء.</p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={sentSearchTerm}
                  onChange={(e) => setSentSearchTerm(e.target.value)}
                  placeholder="بحث في المراسلات..." 
                  className="bg-[#050b16] border border-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl focus:border-amber-500 outline-none w-64"
                />
                <button className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700">تصفية</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right font-sans border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    <th className="pb-3 px-4 w-1/4">العميل</th>
                    <th className="pb-3 px-4 w-1/5">القضية</th>
                    <th className="pb-3 px-4 w-1/3">نص الرسالة المختصر</th>
                    <th className="pb-3 px-4">تاريخ الإرسال</th>
                    <th className="pb-3 px-4 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSentMessages.map(row => (
                    <tr key={row.id} className={`bg-[#111c30]/50 hover:bg-[#111c30] transition-colors border-l-2 border-transparent hover:border-amber-500 group ${row.status === 'urgent' ? 'shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/10' : ''}`}>
                      <td className="p-4 rounded-r-xl border-y border-r border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${row.read ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500 opacity-40'}`} title={row.read ? 'تمت القراءة' : 'لم يقرأ بعد'} />
                          <strong className="text-xs text-slate-200">{row.client}</strong>
                        </div>
                      </td>
                      <td className="p-4 border-y border-slate-800/50 text-xs text-slate-300 font-bold">{row.caseName}</td>
                      <td className="p-4 border-y border-slate-800/50 text-[11px] text-slate-400 truncate max-w-[200px]">{row.msg}</td>
                      <td className="p-4 border-y border-slate-800/50 text-xs text-slate-400 font-mono" dir="ltr">{row.date}</td>
                      <td className="p-4 rounded-l-xl border-y border-l border-slate-800/50 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-black w-20 ${
                          row.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {row.status === 'success' ? 'مستلمة' : 'فشلت'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

      {/* Inbox section requested by user */}
      <div className="bg-[#0b1325] border border-amber-500/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-right relative overflow-hidden mt-8">
        <div className="border-b border-slate-800 pb-5">
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <span>بيانات الإشعارات السابقة (صندوق الوارد)</span>
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1.5 font-sans">سجل تاريخي بمراسلات واسفسارات العملاء الواردة وتتبع حالتها.</p>
        </div>

        <style>{`
          .notifications-email-card {
            border-radius: 16px !important;
            overflow: hidden !important;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            display: grid;
            padding: 1.5rem;
            grid-template-areas: 
              "badge badge"
              "sender sender"
              "title category"
              "content content"
              "actions actions";
            grid-template-columns: 1fr auto;
            gap: 1rem; /* gap-4 (16px) */
            align-items: start;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            cursor: pointer;
            direction: rtl;
            position: relative;
          }
          
          .notifications-email-card:hover {
            border-color: #f59e0b;
            box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.15);
            transform: translateY(-2px);
          }

          .area-badge {
            grid-area: badge;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 0.5rem;
            margin-bottom: 0.25rem;
          }
          .area-sender {
            grid-area: sender;
            color: #0f172a !important; /* Slate-900 */
            font-weight: 700 !important; /* font-bold */
            font-size: 1.05rem; /* Slightly larger */
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .area-title {
            grid-area: title;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .area-category {
            grid-area: category;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            justify-content: flex-end;
          }
          .area-content {
            grid-area: content;
            color: #334155 !important; /* Slate-700 */
            font-size: 0.875rem;
            line-height: 1.5rem;
          }
          .area-actions {
            grid-area: actions;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 0.5rem;
            padding: 0.75rem 1rem;
            background-color: #f8fafc !important; /* Custom Contrast Toolbar */
            border-top: 1px solid #e2e8f0;
            border-radius: 8px;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
          }
          .notifications-email-card:hover .area-actions,
          .notifications-email-card:focus-within .area-actions {
            opacity: 1;
            pointer-events: auto;
          }

          .category-tag {
            font-size: 10px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 6px;
            text-transform: uppercase;
            width: fit-content;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
          }
          
          .tag-legal {
            background-color: #64748b !important; /* Slate-500 */
            color: #ffffff !important;
          }
          .tag-financial {
            background-color: #3b82f6 !important; /* Blue-500 */
            color: #ffffff !important;
          }
          .tag-administrative {
            background-color: #10b981 !important; /* Emerald-500 */
            color: #ffffff !important;
          }
          
          .custom-badge-emerald { background-color: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
          .custom-badge-amber { background-color: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2); }
          .custom-badge-rose { background-color: rgba(243, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(243, 68, 68, 0.2); }
          .custom-badge-slate { background-color: rgba(148, 163, 184, 0.1); color: #475569; border: 1px solid rgba(148, 163, 184, 0.2); }
        `}</style>

        <div className="grid grid-cols-1 gap-5">
          {filteredInboxMessages.map(msg => {
            let badgeClass = 'custom-badge-slate';
            if (msg.status === 'تم القراءة' || msg.status === 'مقروء') badgeClass = 'custom-badge-emerald';
            else if (msg.status === 'بانتظار الرد' || msg.status === 'معلق') badgeClass = 'custom-badge-amber';
            else if (msg.status === 'عاجل') badgeClass = 'custom-badge-rose';

            const isExpanded = expandedMsgIds.includes(msg.id);

            // Determine tag styling based on Arabic or English category
            let categoryLabelAr = 'قانوني';
            let categoryLabelEn = 'Legal';
            let tagBgClass = 'bg-slate-500 text-white';

            const normType = (msg.type || '').trim();
            if (normType === 'إداري' || normType === 'Administrative') {
              categoryLabelAr = 'إداري';
              categoryLabelEn = 'Administrative';
              tagBgClass = 'bg-emerald-500 text-white';
            } else if (normType === 'مالي' || normType === 'Financial') {
              categoryLabelAr = 'مالي';
              categoryLabelEn = 'Financial';
              tagBgClass = 'bg-blue-500 text-white';
            }

            return (
              <div 
                key={msg.id} 
                id={`notification-card-${msg.id}`}
                className="notifications-email-card group relative overflow-hidden"
                tabIndex={0}
                onClick={(e) => toggleMsgExpand(msg.id, e)}
              >
                {/* Visual Accent - Vertical Bar */}
                <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-200 group-hover:bg-amber-500 transition-colors" />
                
                {/* Area: Badge */}
                <div className="area-badge">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">فئة الإشعار</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${badgeClass}`}>
                      <span>{msg.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    <span>{msg.date}</span>
                  </div>
                </div>

                {/* Area: Sender */}
                <div className="area-sender flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-black text-sm shrink-0 font-mono">
                    {msg.sender.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">المرسل</span>
                    <strong className="text-[15px] font-bold text-slate-900">{msg.sender}</strong>
                  </div>
                </div>

                {/* Area: Title */}
                <div className="area-title mt-1.5 flex flex-col gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none opacity-60 text-slate-400">الموضوع</span>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug mt-1">{msg.subject}</h3>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded shadow-sm ${tagBgClass}`}>
                      <span>{categoryLabelAr}</span>
                    </span>
                  </div>
                </div>

                {/* Area: Category (Tags) */}
                <div className="area-category mt-1.5 flex items-center justify-end gap-3">
                  {/* Visual Hover Arrow Indicator */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 ml-1">
                    <ChevronDown className={`w-5 h-5 text-amber-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Area: Content (Smooth Transition with max-h logic) */}
                <div className={`area-content overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-[60px] opacity-90'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none opacity-40 block mb-1">المحتوى التفصيلي</span>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {msg.message}
                  </p>
                </div>

                {/* Area: Actions (Hidden toolbar custom container) */}
                <div className={`area-actions ${isExpanded ? 'opacity-100 pointer-events-auto' : ''}`}>
                  <button 
                    onClick={(e) => executeMsgAction(msg.id, 'unread', e)}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <MailOpen className="w-3.5 h-3.5" />
                    <span>علامة غير مقروء</span>
                  </button>
                  <button 
                    onClick={(e) => executeMsgAction(msg.id, 'archive', e)}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>أرشفة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      )}

      {/* Drafts Tab Content */}
      {activeTab === 'drafts' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-[#0b1325] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-right">
              <div className="border-b border-slate-800 pb-5">
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  <span>مسودات الرسائل (Drafts)</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1.5 ">قائمة بالرسائل التي تم حفظها ولم يتم إرسالها بعد.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {drafts.map(draft => (
                    <div key={draft.id} className="bg-[#050b16] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 group hover:border-amber-500/50 transition-all">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] text-amber-500 font-black uppercase">مسودة</span>
                          <span className="text-[10px] text-slate-400 font-mono">{draft.date}</span>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-100">{draft.recipient}</h4>
                          <p className="text-xs text-amber-400 border-b border-slate-800 pb-2">{draft.subject}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-1">{draft.content}</p>
                       </div>
                       <div className="flex gap-2 pt-3">
                          <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-2 rounded-lg transition-colors">تعديل المسودة</button>
                          <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black px-4 py-2 rounded-lg transition-colors">إرسال الآن</button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
      
      {/* Upcoming Reminders Section */}
      <div className="bg-[#0b1325] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-right relative overflow-hidden mt-8">
        <div className="border-b border-slate-800 pb-5">
           <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
             <span>تنبيه بالإشعارات القادمة (مجدولة)</span>
           </h2>
           <p className="text-xs text-slate-400 font-bold mt-1.5 font-sans">تتبع الإشعارات والتنبيهات المجدولة بانتظار الإرسال الألي.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {upcomingReminders.map(rem => (
              <div key={rem.id} className="bg-[#050b16] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 group hover:border-amber-500/50 transition-colors">
                  <div className="flex justify-between items-start">
                     <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-1 rounded-md">{rem.type}</span>
                     <span className={`text-[10px] font-black px-2 py-1 rounded-md ${rem.status === 'آلي' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'}`}>
                        {rem.status}
                     </span>
                  </div>
                  <div className="space-y-1">
                     <h4 className="text-sm font-black text-slate-100">{rem.client}</h4>
                     <p className="text-xs text-slate-400 font-sans">{rem.caseNumber}</p>
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-800 flex justify-between items-center">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">القالب المستخدم</span>
                       <span className="text-[11px] text-amber-500 font-bold">{rem.templateName}</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px] text-slate-300 font-black" dir="ltr">{rem.scheduledDate}</span>
                     </div>
                  </div>
              </div>
           ))}
        </div>
      </div>

    </div>
  );
}
