/**
 * Copyright 2026 Al-Adalah Tech Solutions.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Scale, Shield, Zap, FileText, Calendar, 
  CreditCard, Users, Globe, ArrowLeft, CheckCircle2,
  ChevronLeft, ArrowDown, Star, MessageSquare, Trophy, Bot, Sparkles, Building2,
  Clock, ShieldAlert, Award, ArrowUpRight, Check, HelpCircle, Laptop, Lock, Smartphone,
  Sun, Moon, RefreshCw, ClipboardList, Layers, Layout, Hourglass, ShieldCheck, Download
} from 'lucide-react';

import FeaturesInteractiveSection from '@/components/FeaturesInteractiveSection';
import ContactSection from '@/components/ContactSection';

// A custom motion.div wrapper that analyzes background class/color and enforces a perfectly contrasting text color.
interface ContrastMotionDivProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  bgClass?: string; // e.g. "bg-indigo-900", "bg-[#0c2461]"
}

export function ContrastMotionDiv({ bgClass = "", className = "", style = {}, children, ...props }: ContrastMotionDivProps) {
  const isDarkBg = React.useMemo(() => {
    const bgLower = bgClass.toLowerCase();
    
    // Check for explicit dark theme classes
    if (
      bgLower.includes("950") || bgLower.includes("900") || bgLower.includes("850") || bgLower.includes("800") ||
      bgLower.includes("700") || bgLower.includes("600") || bgLower.includes("500") ||
      bgLower.includes("slate-9") || bgLower.includes("slate-8") ||
      bgLower.includes("indigo") || bgLower.includes("emerald") || bgLower.includes("rose") ||
      bgLower.includes("bg-[#0c2461]") || bgLower.includes("bg-[#020813]") || 
      bgLower.includes("bg-[#07132c]") || bgLower.includes("bg-[#0b2414]")
    ) {
      return true;
    }
    
    // Improved Hex brightness analysis
    const hexMatch = bgLower.match(/bg-\[#([0-9a-f]{3,6})\]/);
    if (hexMatch && hexMatch[1]) {
      let hex = hexMatch[1];
      if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // Rec 601 luma formula
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
    return false;
  }, [bgClass]);

  // Enforce dynamic contrast: Dark Background -> Bright Silver/White Text; Light Background -> Deep Slate Text
  const textColorClass = isDarkBg ? "text-slate-50 font-medium" : "text-slate-950 font-medium";

  return (
    <motion.div
      className={`${bgClass} ${textColorClass} ${className} transition-colors duration-500`}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MainLandingPageProps {
  onSignInSelect: () => void;
  onTrialSelect: () => void;
}

export default function MainLandingPage({ onSignInSelect, onTrialSelect }: MainLandingPageProps) {
  const isNajizConnected = localStorage.getItem("najiz_api_connected") === "true";
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  
  // Interactive Feature Explorer State
  const [activeTab, setActiveTab] = useState<string>('ai-drafting');
  
  // Interactive ROI Savings Calculator States
  const [casesCount, setCasesCount] = useState<number>(30);
  const [lawyersCount, setLawyersCount] = useState<number>(5);

  // Live Demo Simulator State
  const [demoState, setDemoState] = useState<'idle' | 'syncing' | 'completed'>('idle');
  const [demoLogs, setDemoLogs] = useState<string[]>([]);

  const isEn = lang === 'en';

  const handleRunDemo = () => {
    if (demoState !== 'idle') return;
    setDemoState('syncing');
    setDemoLogs([isEn ? "Initiating secure connection with Najiz portal..." : "جاري إنشاء اتصال آمن وفك تشفير البيانات من بوابة ناجز..."]);
    
    setTimeout(() => {
      setDemoLogs(prev => [...prev, isEn ? "Extracting case #437194619 from Judicial Circuits..." : "تم بنجاح سحب الدعوى التجارية رقم 437194619 ومستنداتها..."]);
    }, 1000);

    setTimeout(() => {
      setDemoLogs(prev => [...prev, isEn ? "Gemini AI processing legal text & drafting answer..." : "مساعد الذكاء الاصطناعي يستخلص الدفوع ويقترح مذكرة جوابية..."]);
    }, 2000);

    setTimeout(() => {
      setDemoLogs(prev => [...prev, isEn ? "Success! WhatsApp broadcast routed to client +966 507..." : "اكتمل التزامن! تم تحديث الأجندة، وإشعار العميل تلقائياً عبر WhatsApp!"]);
      setDemoState('completed');
    }, 3500);
  };

  const handleResetDemo = () => {
    setDemoState('idle');
    setDemoLogs([]);
  };

  // ROI Calculations
  const calculatedSavingsHours = Math.round(casesCount * 1.5 + lawyersCount * 8);
  const calculatedSavesSAR = calculatedSavingsHours * 350;

  // Features List details (matching moustashar.net/features structural modules)
  const featuresList = [
    {
      id: 'ai-drafting',
      icon: Bot,
      title: isEn ? "Supreme Generative Legal AI Assistant" : "مساعد الصياغة والتحليل الفوري بالذكاء الاصطناعي",
      subtitle: isEn ? "Draft judicial pleaders & objection logs in 10 seconds" : "أتمتة كتابة اللوائح ومذكرات الدفاع بدقة متناهية مطابقة للأنظمة التجارية والعمالية",
      descr: isEn 
        ? "Powered by customized generative legal models trained on Saudi Supreme Court precedents. Automatically analyzes pleadings, extracts legal loopholes, and drafts watertight administrative objection letters in seconds."
        : "محرك صياغة مدمج يغنيك عن البدء من الصفر. يقوم بتحليل وثائق الدعاوى تلقائياً، واستخراج الثغرات النظامية، وصياغة مذكرات الرد والاعتراض واللوائح الاستئنافية بلغة رصينة مطابقة لمعايير المحاكم التجارية والعامة بموجب الأنظمة السعودية السارية.",
      advAdalah: isEn ? "Adapts dynamically to the custom details of Saudi court cases with zero errors." : "توليد فوري ذكي يعتمد على وقائع ملف الدعوى مباشرة ويربطها بالمواد القانونية المحددة.",
      advCompetitors: isEn ? "Provides generic static word document links without case relevancy." : "يوفرون قوالب جامدة معدة مسبقاً غير متزامنة مع ملابسات وظروف قضيتك الحقيقية.",
      benefitsAr: [
        "توفير 90% من الوقت المستهلك في البحث القضائي وصياغة الدفوع وصحف الدعاوى.",
        "دقة لغوية ونظامية فائقة مصممة على أساس المبادئ القضائية المقررة بالمملكة.",
        "استخراج ذكي لملخصات ملفات الدعوى الضخمة (آلاف الصفحات في دقيقة واحدة)."
      ],
      benefitsEn: [
        "Earns 90% of time spent on manual research and drafting legal memos.",
        "Extreme linguistic and legislative precision rooted in KSA judicial trends.",
        "Instant summarization of thousands of documents in less than a minute."
      ],
      workflowBeforeAr: "البدء يدوياً من الصفر مع هدر ساعات طوال في مراجعة الكتب والأنظمة والنسخ واللصق.",
      workflowBeforeEn: "Starting from scratch, wasting billable hours analyzing systems and hand-copying documents.",
      workflowAfterAr: "صياغة المذكرة الجوابية والبحث القضائي الفوري بضغطة زر وبسرعة خارقة من مكان واحد آمن.",
      workflowAfterEn: "Pleading draft and judicial reference ready in 10 seconds with single click."
    },
    {
      id: 'whatsapp-alerts',
      icon: MessageSquare,
      title: isEn ? "Official WhatsApp Multi-Channel Automation" : "بث إشعارات وتحديثات الواتساب التلقائية",
      subtitle: isEn ? "Real-time automated narratives dispatched on target triggers" : "إشعار العملاء بقرارات الدوائر وتواريخ الجلسات ومواعيد سداد الأتعاب تلقائياً",
      descr: isEn
        ? "Keep your clients perfectly aligned and reduce physical callback support volume by 85%. Employs intelligent event triggers to automatically compose and dispatch custom updates directly to your clients' WhatsApp chats."
        : "بوابة بث ذكية تربط مكتبك بهواتف العملاء مباشرة. بفضل محرك الأتمتة المدمج، يتم بث رسائل تذكير تلقائية ومخصصة باسم العميل قبل الجلسات بـ 24 ساعة، وإشعاره بصدور الأحكام وتأكيد استلام الدفعات المالية بسندات الـ QR.",
      advAdalah: isEn ? "Automated server-side Twilio templates fully certified by regulatory bodies." : "ربط متكامل حقيقي مع نظام تذكير دوري ذكي يعمل في الخلفية على مدار الساعة.",
      advCompetitors: isEn ? "Only relies on expensive SMS alerts without dynamic customizable interactive variables." : "يرسلون رسائل نصية قصيرة (SMS) باهظة ومحدودة الحروف تفتقر للجاذبية والمهنية ومسار سداد الأتعاب.",
      benefitsAr: [
        "توطيد الثقة مع العملاء عبر إمدادهم بكل جديد فورا على تطبيقهم المفضل.",
        "تخفيض اتصالات العملاء ومراجعاتهم اليدوية بنسبة تتجاوز 85%.",
        "تنبيه آلي للعميل الشرعي وفريق العمل بالجلسات لمنع فوات أي مدد نظامية أو غيابات."
      ],
      benefitsEn: [
        "Cultivates client trust with instantaneous legal feedback on the channels they use.",
        "Saves 85%+ of inbound status inquiry calls, liberating customer support times.",
        "Warns internal lawyers about target court sessions automatically before deadlines."
      ],
      workflowBeforeAr: "الاتصال اليدوي المتردد بالعميل وتكرار السؤال أو إرسال تنبيهات SMS ناقصة وجافة.",
      workflowBeforeEn: "Chasing clients with repeated manual phone calls or incomplete text messages.",
      workflowAfterAr: "متابعة آلية على مدار الساعة، العميل يعلم بكل تحديث قضائي وسداد أتعاب فورا بـ WhatsApp.",
      workflowAfterEn: "Autonomous 360-degree tracking; clients receive prompt alerts without any human friction."
    },
    {
      id: 'najiz-sync',
      icon: RefreshCw,
      title: isEn ? "Autonomous Moj Najiz & Portal Sync" : "مزامنة وسحب بيانات ناجز والوكالات آلياً",
      subtitle: isEn ? "Zero manual pasting - direct cryptographic session monitoring" : "مزامنة بضغطة زر لسحب قضايا القانون التجاري والعام ومواعيد الجلسات بالمتغيرات",
      descr: isEn
        ? "Eliminate manual file checks. Instantly aggregates execution requests, appellate cases, and original lawsuits. Keeps your office calendar automated, error-free, and perfectly compliant with Saudi Ministry of Justice timelines."
        : "وداعاً للدخول اليدوي اليومي لبوابات ناجز. تقوم العدالة بسحب كافة تفاصيل القضايا والوكالات وجدول السجلات والقرارات فور صدورها، لتنظيمها وعرضها في لوحة معلومات موحدة متوافقة كلياً مع متطلبات وزارة العدل.",
      advAdalah: isEn ? "Syncs in seconds with detailed system logs and zero performance overhead." : "مزامنة مشفرة وآمنة بنسبة 100% تسحب أطراف الدعوى وملخصاتها ومواعيدها في ثوانٍ معدودة.",
      advCompetitors: isEn ? "Requires manual daily portal sign-ins and error-prone copying." : "يقوم العميل الشرعي بفتح موقع ناجز مئات المرات وتحديث الملفات بالنسخ واللصق المعرض للخطأ البشري.",
      benefitsAr: [
        "رصد وتحديث بيانات القضايا في أقل من 3 ثوان وتفادي ضياع الجلسات أو انتهاء المهل.",
        "تحديث ذاتي ومجاني يعزز دقة وسلامة الأجندة القضائية للمستشارين بأمان.",
        "جدولة ومزامنة تواريخ القضايا بشكل مستمر مع تذكيرات التقويم التفاعلية بالفروع."
      ],
      benefitsEn: [
        "Aggregate status logs instantly in 3 seconds to preserve critical timelines.",
        "Completely automatic calendar updating that avoids human typing errors.",
        "Dynamic syncing of court agendas across multiple active practicing attorneys."
      ],
      workflowBeforeAr: "تعاطي يدوي مرهق ويومي مع بوابات العدالة المتعددة مع احتمالية عالية لفوات موعد جلسة.",
      workflowBeforeEn: "Stated manual checking of many credentials, risking missing court deadlines.",
      workflowAfterAr: "تزامن رقمي آمن وحافظة واحدة موحدة تُظهر مواعيد الجلسات والدوائر آلياً وبلحظتها.",
      workflowAfterEn: "Encrypted background sync that organizes all sessions on one screen automatically."
    },
    {
      id: 'task-management',
      icon: ClipboardList,
      title: isEn ? "Visual Kanban Board & Staff Management" : "إسناد وحوكمة المهام بالسحب والإفلات التفاعلي",
      subtitle: isEn ? "Establish airtight operational transparency among consulting attorneys" : "توزيع ملفات القضايا، ومتابعة مذكرات الردود، والتحكم بالإنتاجية",
      descr: isEn
        ? "A high-performance visual dashboard modeled on elite agile practices. Allocate casework, set hard dates, track advisor workloads, and move visual cards across customizable stages and statuses smoothly."
        : "لوحة تخطيط تفاعلية تتيح حوكمة وإنتاجية مكاتب الاستشارات. تمكنك من توزيع صياغة المذكرات، ومراجعة العقود، وحضور الجلسات بين المستشارين، ومتابعة سير الإجراءات بالسحب والإفلات بكل سلاسة.",
      advAdalah: isEn ? "Includes direct case links and automatic activity audit trackers." : "ارتباط مباشر وبنيوي بين بطاقة المهمة وملف الدعوى وسندات قبض ورصيد أتعاب العميل.",
      advCompetitors: isEn ? "Uses complex Excel spreadsheets that lack contextual database connections." : "تطبيقات مهام منفصلة معقدة تزيد من تشتت المستشارين والمحاميين والمستشاريين القانونيين ولا ترتبط بالمالية أو الدعاوى.",
      benefitsAr: [
        "رقابة فورية على إنتاجية المستشارين القانونيين بالفروع وبمخطط زمني واضح لجميع المعاملات.",
        "تسريع وتيرة إنجاز الملفات بنسبة 60% عبر تحديد المسؤوليات والأهداف بدقة للمساعدين.",
        "حفظ تاريخ العمل والتعليقات والملفات المتبادلة لكل دعوى بمكان واحد آمن وقابل للجرد."
      ],
      benefitsEn: [
        "Instant oversight on staff performance across all city branches.",
        "Boost draft completion rates by 60% with explicit deadlines and owners.",
        "Centralized conversation threads, feedback logs, and revisions for every files."
      ],
      workflowBeforeAr: "متابعة شفهية أو رسائل مبعثرة ومهام تائهة بين محادثات ومجموعات الواتساب والتطبيقات.",
      workflowBeforeEn: "Oral sync-ups and messy messages, missing follow-ups between advisors.",
      workflowAfterAr: "عوالم إلكترونية مرئية وشاملة تُظهر المكلَّف والتاريخ الفعلي ومستند الدعوى المتصل بجلاء.",
      workflowAfterEn: "Digital visual boards indicating assigned attorney, absolute status, and links."
    },
    {
      id: 'finance-zatca',
      icon: CreditCard,
      title: isEn ? "Advanced Billing / ZATCA Phase II compliant Ledger" : "نظام الإثبات المالي المعتمد للزكاة ٢",
      subtitle: isEn ? "Generate certified QR-Code invoices, secure downpayments and settlement cycles" : "حساب أتعاب المرافعة، والمصاريف، وسندات الصرف والقبض وفق المعايير السعودية",
      descr: isEn
        ? "Comprehensive professional accounting system designed specifically for legal entities. Supports retainer models, hourly tracking, complex trust accounts, and generates ZATCA Phase II compliant QR bills instantly."
        : "منظومة محاسبة وعلاقات مالية شاملة. تتيح لك حساب عقود الأتعاب على شكل دفعات ميسرة أو ساعات عمل استشارية للشركات، وتحصيل الضرائب والرسوم، مع توليد فوري لفواتير الضريبة المشفرة المتوافقة كلياً مع نظام الفوترة الإلكتروني (المرحلة الثانية نفوذ).",
      advAdalah: isEn ? "Calculated, safe cryptographic keys tailored perfectly to KSA financial regulations." : "توليد تلقائي وسهل للفواتير المشفرة مع إمكانية تحصيل الأتعاب بروابط دفع ذكية.",
      advCompetitors: isEn ? "Basic accounting models that do not support official encrypted QR standards." : "برامج فوترة عامة ومستوردة مجهدة في الإعفاء الضريبي والمدد وغير مرتبطة بنظام القضايا وعرقلة العمل.",
      benefitsAr: [
        "تفادي أي مخالفات محاسبية أو ضريبية مع امتثال كامل وموثوق 100% مع هيئة الزكاة.",
        "تسريع عمليات تحصيل الأتعاب المتبقية بمعدل الضعف عبر فواتير مريحة ترسل للعميل بـ WhatsApp.",
        "تقارير أرباح وخسائر وصرف مصاريف المحاكم مفصلة لكل دعوى وعميل ونسب الشركاء."
      ],
      benefitsEn: [
        "Avoid regulatory tax Penalties with 100% bulletproof ZATCA compliant ledger.",
        "Accelerate payment collections on client balances with instant online pay links.",
        "Comprehensive profit-loss and disbursements reports customized for law entities."
      ],
      workflowBeforeAr: "حسابات يدوية مبعثرة وإصدار فواتير وورد لا تحوي تشفير الـ QR الضريبي المعتمد من الهيئة.",
      workflowBeforeEn: "Unstructured billing formats using Word sheets lacking KSA mandated tax codes.",
      workflowAfterAr: "دورة فوترة وقيود مالية آلية ترسل سندات القبض المتوافقة فوراً للعميل بضغطة زر.",
      workflowAfterEn: "Auto generation of fully compliant tax invoices instantly transmitted and cataloged."
    },
    {
      id: 'vault-security',
      icon: ShieldCheck,
      title: isEn ? "Secure Cyber-Vault & File Watermarking" : "خزنة الوثائق الحصينة والعلامات المائية الرقمية",
      subtitle: isEn ? "Absolute sovereign defense against document metadata leakage or breaches" : "حفظ المذكرات وصور التعميلات ومستندات الخصوم وتتبع هوية المحمّل آلياً",
      descr: isEn
        ? "Safeguard client privilege with state-of-the-art military encryption. Automatically watermarks confidential legal PDFs with downloading staff metadata, ensuring full security loop protection."
        : "حماية مطلقة لأسرار وعقود منشأتك وعملائك. توفر العدالة منصة سحابية مشفرة بـ AES-256 لحفظ وصيانة ملفات القضايا، مع تطبيق ذكي للعلامات المائية الرقمية التي تطبع اسم وهوية وتوقيت الموظف الذي قام بتحميل أي مستند تتبعاً لأي تسريب.",
      advAdalah: isEn ? "Provides detailed audit logs of who opened, edited, or printed each document." : "خزانة مشفرة تتبع سياسات الهيئة الوطنية للأمن السيبراني لحفظ الخصوصية وصحائف الدعاوى.",
      advCompetitors: isEn ? "Upload files to shared foreign clouds lacking specific confidentiality protections." : "تخزين بسيط بملفات خارجية مكشوفة تعرض خصوصية أسرار الخصوم للخطر وبدون علامة مائية للمسؤولية.",
      benefitsAr: [
        "حماية أسرار العملاء بختم مائي يحمل تفاصيل مشغل الملف واسمه ورقمه الفريد لمنع التسريب.",
        "تشغيل سجل تتبع أعمى لكل إجراء (من فتح الملف؟ ومن عدّله؟ ومن قام بتنزيله وفي أي توقيت؟).",
        "تشفير فائق للملفات يضمن عدم الوصول إليها إلا للمستشارين المصرح لهم بملف الدعوى فقط."
      ],
      benefitsEn: [
        "Protect client confidential assets with dynamic watermarks bearing staff identity tags.",
        "Total immutable audit logs of files (who opened, edit, download, and when).",
        "Airtight encryption making sure only authorized lawyers can visually scan documents."
      ],
      workflowBeforeAr: "ملفات المكتب مخزنة بأجهزة متعددة أو خوادم خارجية عامة غير خاضعة لأي حماية أو ختم مائي لحجب الأسرار.",
      workflowBeforeEn: "Storing files on multiple computers or common cloud accounts without security seals.",
      workflowAfterAr: "أرشيف مركزي مشفر ومحمي، وصلاحيات صارمة توضح جرد ونشاط الفريق والملفات القضائية بدقة بنكية.",
      workflowAfterEn: "Central secure vault with strict permissions and watermarking that protects assets."
    }
  ];

  return (
    <div 
      className="min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-300 selection:bg-amber-500 overflow-x-hidden" 
      dir={isEn ? "ltr" : "rtl"}
    >
      
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-800 backdrop-blur-md h-20 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Brand Logo Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#0c2461] to-amber-500 p-0.5 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(184,134,11,0.25)]">
              <img src="/logo.svg" alt="منصة العدالة" className="w-full h-full object-contain bg-[#020813] rounded-2xl" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5 font-display">
                <span className="text-[#0c2461]">{isEn ? "Al-Adalah" : "منصة العدالة لأدارة مكاتب المحاماة"}</span>
                <span className="text-xs bg-gradient-to-r from-amber-500 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-mono font-black">PRO</span>
              </h1>
              <p className="text-xs text-slate-900  font-black">
                {isEn ? "Saudi Judicial AI Ecosystem" : "أذكى منظومة لإدارة القضايا ومكاتب المحاماة بالمملكة"}
              </p>
            </div>
          </div>

          {/* Quick-Nav Links & Global Actions */}
          <div className="flex items-center gap-4">
            
            <nav className="hidden lg:flex items-center gap-6 text-xs font-black text-slate-900">
              <a href="#about-platform" className="hover:text-amber-400 font-black transition-colors">{isEn ? "About Us" : "من نحن"}</a>
              <a href="#features-tabs" className="hover:text-amber-400 font-black transition-colors">{isEn ? "Interactive Features" : "تصفح الميزات بالتفصيل"}</a>
              <a href="#roi-calculator" className="hover:text-amber-400 font-black transition-colors">{isEn ? "Value Calculator" : "حاسبة الوفورات المالية"}</a>
              <a href="#system-simulator" className="hover:text-amber-400 font-black transition-colors">{isEn ? "Live Sandbox" : "محاكي المزامنة الرقمية"}</a>
            </nav>

            <span className="hidden lg:block h-6 w-px bg-slate-200"></span>

            {/* Language Toggle */}
            <button 
              onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
              className="text-sm font-black px-3 py-1.5 rounded-xl border transition-all bg-white border-slate-800 text-slate-900"
              id="lang-toggle-btn"
            >
              🌎 {isEn ? "العربية" : "English"}
            </button>

            {/* Sign-In Action */}
            <button 
              onClick={onSignInSelect}
              className="hidden md:inline-block text-xs font-black px-4 py-2 rounded-xl text-[#0c2461] transition-opacity cursor-pointer"
              id="header-signin-btn"
            >
              {isEn ? "Portal Login" : "تسجيل دخول البوابة"}
            </button>

            {/* Trial Version Quick Activation CTA */}
            <button 
              onClick={onTrialSelect}
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              id="header-trial-btn"
            >
              {isEn ? "Try Free Trial Version ⚡" : "تفعيل النسخة التجريبية ⚡"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Presentation Banner */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 overflow-hidden">
        
        {/* Glow ambient lights under the hero block */}
        <div className="absolute top-0 left-0 w-full h-[850px] pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-250px] right-[-100px] w-[650px] h-[650px] rounded-full bg-[#0c2461]/10 blur-[140px]  animate-pulse"></div>
          <div className="absolute top-[280px] left-[-220px] w-[550px] h-[550px] rounded-full bg-blue-650 blur-[130px] "></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Title, pitch and main trial incentive */}
            <div className="lg:col-span-7 space-y-8 text-right">
              
              <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full border border-amber-600/30 bg-amber-600/5 text-amber-400 font-black text-sm font-black uppercase tracking-wide">
                <Trophy className="w-4 h-4 animate-bounce" />
                <span>⭐ {isEn ? "The Supreme #1 Integrated Legal Workspace Platform in Saudi Arabia" : "المنظومة القانونية المتكاملة والذكاء القضائي الأعلى اعتماداً بالسعودية"}</span>
              </div>

              <h2 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight text-slate-950 font-display">
                {isEn ? (
                  <>
                    <span className="text-[#020617]">Judicial Digital Ecosystem</span>
                    <br />
                    Engineered for <span className="bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">Elite KSA Law Firms</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#020617]">العدالة الشاملة والمصممة</span>
                    <br />
                    خصيصاً لتمكين <span className="text-amber-400 font-black font-display">مكاتب المستشارين والمحاميين والمستشاريين القانونيين</span> بالمملكة
                  </>
                )}
              </h2>

              <p className="text-base md:text-lg font-bold leading-relaxed text-slate-900">
                {isEn 
                  ? "Simplify daily legal defense workflows, automate client engagement, and maximize productivity. Al-Adalah bridges MOJ Najiz portals, Generative Legal Chat assistants (Gemini), official WhatsApp notification engines, and ZATCA Phase II compliance into a beautifully integrated, ultra-confidential Arabic cloud platform."
                  : "توفر منصة العدالة أسهل نظام تقني لإدارة مكاتب المحاماة في المملكة. نربطك مباشرة بـ بوابة ناجز لمزامنة الجلسات، ونوفر لك صياغة اللوائح بالذكاء الاصطناعي، إصدار الفواتير الضريبية (هيئة الزكاة والضريبة والجمارك)، ونظام إشعارات واتساب متكامل، لتسهيل عملك وإنجاز القضايا بضغطة زر."}
              </p>

              {/* Instant benefits highlight list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                <div className="p-4.5 rounded-2xl bg-white border border-slate-150 transition-colors shadow-sm flex items-center gap-3 animate-fade-in">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 font-black" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-950 block">{isEn ? "Direct Najiz.sa Live Match" : "مزامنة لحظية مباشرة مع ناجز"}</span>
                    <span className="text-xs text-slate-800 block leading-relaxed">{isEn ? "No manual typing or oversight mistakes" : "رصد تلقائي للدوائر ومستجدات القضايا"}</span>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-150 transition-colors shadow-sm flex items-center gap-3 animate-fade-in">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 font-black" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-950 block">{isEn ? "Generative Court AI Memo Drafts" : "الذكاء الاصطناعي التبادلي القضائي"}</span>
                    <span className="text-xs text-slate-800 block leading-relaxed">{isEn ? "Formulate defenses in less than 10 seconds" : "ابتكار وصياغة ردود الدفوع والاعتراضات"}</span>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-150 transition-colors shadow-sm flex items-center gap-3 animate-fade-in">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 font-black" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-950 block">{isEn ? "Client Server-Side WhatsApp" : "أتمتة بث وإشعارات الواتساب (24H)"}</span>
                    <span className="text-xs text-slate-800 block leading-relaxed">{isEn ? "Auto notify clients on hearing status changes" : "تحديثات العملاء التنبيهية بدون تدخل بشري"}</span>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-150 transition-colors shadow-sm flex items-center gap-3 animate-fade-in">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 font-black" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-950 block">{isEn ? "ZATCA compliant E-invoices" : "محاسبة وفوترة متطابقة للزكاة ٢"}</span>
                    <span className="text-xs text-slate-800 block leading-relaxed">{isEn ? "Includes encrypted QR code stamps" : "سير الدفعات وضمان حركات التسوية المالية"}</span>
                  </div>
                </div>
              </div>

              {/* Conversion Actions urging "Trial Version" */}
              <div className="bg-amber-500/[0.06] border-2 border-amber-500/40 p-6 rounded-3xl mt-6 space-y-4 shadow-md relative">
                <div className="absolute top-3 left-3 flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <span>🔥</span>
                    <span>{isEn ? "Try Al-Adalah Free Trial Version (No Payment Needed)" : "احصل مجاناً على النسخة التجريبية الشاملة لكافة الخصائص"}</span>
                  </h4>
                  <p className="text-xs text-slate-950 font-bold leading-relaxed mt-1.5">
                    {isEn 
                      ? "Get full unconstrained 48-Hour premium access to the Lawyers suite, WhatsApp mock dispatch parameters, Najiz simulation logs, and customized legal AI draft generators to witness the massive lift in firm coordination."
                      : "امنح مكتبك فرصة تجربة التزامن الذاتي، إسناد المهام، صياغة المذكرات بالـ AI، ومراسلة عملائك بنسخة تجريبية مبسطة وسهلة الاستخدام بالكامل وبشاشات تفاعلية."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                             {demoState === 'completed' && (
                    <div className="space-y-2.5 py-1 font-mono text-right text-[10.5px] text-emerald-500 font-bold">
                      {demoLogs.map((log, index) => (
                        <p key={index}>✓ {log}</p>
                      ))}
                      <div className="mt-3 p-3 bg-emerald-50  border border-emerald-500 text-emerald-600 rounded-xl leading-relaxed text-[9.5px]">
                        {isEn 
                          ? "Simulation Complete! Active case parsed. Notifications automatically delivered. Start free trials to integrate genuine files."
                          : "اكتمل الاختبار بنجاح تام! تم رصد مستند الدعوى بالـ AI، وجدولتها، ومراسلة العميل بـ WhatsApp. تتيح لك النسخة التجريبية دمج دعاوى حقيقية."}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Trust Numbers Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center font-sans">
                  <div className="p-3 bg-slate-50  rounded-xl border border-slate-800  shadow-sm">
                    <p className="text-xs text-amber-400 font-black font-bold">{isEn ? "ZATCA Compliance" : "فوترة الزكاة"}</p>
                    <p className="text-sm font-black text-slate-900  mt-0.5">100%</p>
                  </div>
                  <div className="p-3 bg-slate-50  rounded-xl border border-slate-800  shadow-sm">
                    <p className="text-xs text-emerald-500 font-bold">{isEn ? "WhatsApp Rate" : "تسليم الواتساب"}</p>
                    <p className="text-sm font-black text-emerald-550 mt-0.5">99.9%</p>
                  </div>
                  <div className="p-3 bg-slate-50  rounded-xl border border-slate-800  shadow-sm">
                    <p className="text-xs text-slate-900  font-bold">{isEn ? "AI Precision" : "دقة الصياغة"}</p>
                    <p className="text-sm font-black text-slate-900  mt-0.5">98.4%</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Structured Interactive Features Detailed Tab Explorer */}
      {/* Inspired directly by moustashar.net/features showing custom descriptive modules */}
      <section id="features-tabs" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right font-sans relative z-10 transition-all">
        
        <div className="text-center mb-16 space-y-4">
          <span className="text-sm font-black text-amber-400 font-black bg-amber-600/15 px-4 py-1.5 rounded-full uppercase tracking-widest inline-block">
            🛠️ {isEn ? "THE POWER OF AL-ADALAH DIGITAL ARCHITECTURE" : "العرض التفصيلي الشامل لكافة خدمات وميزات العدالة لشركات ومكاتب المحاماة"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight animate-fade-in">
            {isEn ? "A Legal System in Saudi Arabia Built Natively for Unified Client Workflows" : "المنظومة القانونية الأقوى بالمملكة بمميزات تفاعلية ذكية وسهلة"}
          </h2>
          <p className="text-sm md:text-lg max-w-4xl mx-auto text-slate-900  font-bold leading-relaxed">
            {isEn 
              ? "Forget fractured legacy setups. Explore the complete modules of our ecosystem tailored to local MoJ regulations. Click other options below to examine the specific advantages Al-Adalah brings to your firm."
              : "لماذا تشتت أعمال مكتبك بين تطبيقات منفصلة؟ صُممت منصة العدالة بدقة لتشمل كافة الاحتياجات اليومية وتفاصيل القضايا تحت سقف واجهة واحدة فائقة البساطة والأناقة. انقر على التبويبات الفنية أدناه لاستكشاف المزايا والفرق الشاسع بيننا وبين الأنظمة التقليدية المتهالكة:"}
          </p>
        </div>

        {/* Feature selection tabs list - fully responsive */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-slate-800  pb-5 mb-10 overflow-x-auto">
          {featuresList.map((f) => {
            const IconComp = f.icon;
            const isTabActive = activeTab === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveTab(f.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  isTabActive
                    ? 'bg-[#0c2461] text-white   shadow-md scale-105'
                    : 'bg-white  text-slate-900   border border-slate-800 '
                }`}
              >
                <IconComp className={`w-4 h-4 ${isTabActive ? 'animate-pulse' : ''}`} />
                <span>{f.title.includes('.') ? f.title.split('.')[1].trim() : f.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Feature Content Display Card */}
        {featuresList.find(f => f.id === activeTab) && (() => {
          const matchingF = featuresList.find(f => f.id === activeTab)!;
          const ActiveIcon = matchingF.icon;
          
          // Generate a dynamic bg based on the active tab to test the ContrastMotionDiv logic
          const dynamicBgClass = 
            activeTab === 'ai-drafting' ? 'bg-[#0c2461]' :
            activeTab === 'whatsapp-alerts' ? 'bg-emerald-500' :
            activeTab === 'najiz-sync' ? 'bg-slate-950' :
            activeTab === 'finance-zatca' ? 'bg-white' :
            activeTab === 'vault-security' ? 'bg-slate-900' :
            'bg-white';

          return (
            <ContrastMotionDiv 
              bgClass={dynamicBgClass}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl transition-all duration-500 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
            >
              
              {/* Feature Text and Advatages */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center">
                    <ActiveIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-xl md:text-2xl font-black ${activeTab === 'ai-drafting' ? 'text-[#0c2461]' : ''}`}>{matchingF.title}</h3>
                    <p className={`text-xs font-black ${activeTab === 'ai-drafting' ? 'text-[#0c2461]' : 'text-amber-500'}`}>{matchingF.subtitle}</p>
                  </div>
                </div>

                <p className={`text-xs md:text-sm leading-relaxed font-bold opacity-90 ${activeTab === 'ai-drafting' ? 'text-[#0c2461]' : ''}`}>
                  {matchingF.descr}
                </p>

                {/* Dynamically List More Rich Benefits / strategic metrics (from and like moustashar.net/features) */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-[#0c2461] uppercase tracking-wider flex items-center gap-1.5 justify-end">
                    <span>{isEn ? "Strategic Benefits & Quantifiable Outcomes" : "الفوائد والمكاسب الإستراتيجية للمكتب"}</span>
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {((isEn ? matchingF.benefitsEn : matchingF.benefitsAr) || []).map((benefit: string, bIdx: number) => (
                      <div 
                        key={bIdx} 
                        className={`flex flex-col p-3 rounded-xl border border-amber-600/20 text-right justify-between ${
                          activeTab === 'ai-drafting' 
                            ? (bIdx === 0 ? 'bg-[#8c6d12]' : bIdx === 1 ? 'bg-[#0f3d1b]' : 'bg-[#320a3d]') 
                            : 'bg-slate-50'
                        }`}
                      >
                        <div className="p-1 bg-emerald-500 text-emerald-100 rounded-lg shrink-0 w-fit mb-2">
                          <Check className="w-3.5 h-3.5 font-extrabold" />
                        </div>
                        <p className={`text-[11.5px] font-black leading-relaxed ${activeTab === 'ai-drafting' ? 'text-[#0c2461]' : 'text-slate-900'}`}>
                          {benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workflow Transformation Comparison */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-[#0c2461] uppercase tracking-wider flex items-center gap-1.5 justify-end">
                    <span>{isEn ? "Pioneering Operational Workflow Shift" : "تحليل النقلة والتحول في طبيعة العمل اليومية"}</span>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Before Method */}
                    <div className={`p-6 border rounded-[2rem] text-right relative overflow-hidden shadow-md transition-all duration-300 ${
                      activeTab === 'ai-drafting' 
                        ? 'bg-rose-950/40 border-rose-500/30' 
                        : 'bg-rose-50 border-rose-200'
                    }`}>
                      <div className="absolute top-0 left-0 w-24 h-24 bg-rose-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg w-fit block mb-4 uppercase tracking-wider ${
                        activeTab === 'ai-drafting' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                      }`}>
                        🔴 {isEn ? "Traditional Method" : "العمل بالطرق التقليدية اليدوية"}
                      </span>
                      <p className={`text-sm leading-relaxed font-bold ${activeTab === 'ai-drafting' ? 'text-rose-50' : 'text-slate-900'}`}>
                        {isEn ? matchingF.workflowBeforeEn : matchingF.workflowBeforeAr}
                      </p>
                    </div>

                    {/* After Method */}
                    <div className={`p-6 border rounded-[2rem] text-right relative overflow-hidden shadow-md transition-all duration-300 ${
                      activeTab === 'ai-drafting' 
                        ? 'bg-emerald-950/40 border-emerald-500/30' 
                        : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg w-fit block mb-4 uppercase tracking-wider ${
                        activeTab === 'ai-drafting' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        🟢 {isEn ? "After Al-Adalah Platform" : "بينما مع حلول منصة العدالة"}
                      </span>
                      <p className={`text-sm leading-relaxed font-extrabold ${activeTab === 'ai-drafting' ? 'text-emerald-50' : 'text-slate-900'}`}>
                        {isEn ? matchingF.workflowAfterEn : matchingF.workflowAfterAr}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Comparison inside the feature explorer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8 border-t border-slate-100/10">
                  
                  {/* MoAdalah Card */}
                  <div className={`p-6 border rounded-[2.5rem] space-y-4 text-right flex flex-col justify-between shadow-xl transition-all duration-500  ${
                    activeTab === 'ai-drafting' 
                      ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20' 
                      : 'bg-emerald-50/50 border-emerald-100 shadow-emerald-500/5'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-black px-4 py-2 rounded-xl w-fit block mb-4 uppercase tracking-[0.1em] shadow-sm ${
                        activeTab === 'ai-drafting' ? 'bg-amber-500 text-white' : 'bg-white text-emerald-700 border border-emerald-100'
                      }`}>
                        ⚖️ {isEn ? "Al-Adalah Advantage" : "منفعة منصة العدالة الحصرية"}
                      </span>
                      <p className={`text-[13px] leading-relaxed font-black ${activeTab === 'ai-drafting' ? 'text-amber-50' : 'text-slate-900'}`}>
                        {matchingF.advAdalah}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2.5 text-[10px] font-black mt-4 pt-4 border-t ${activeTab === 'ai-drafting' ? 'border-amber-500/10 text-amber-400' : 'border-emerald-200/50 text-emerald-600'}`}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{isEn ? "Included in Trial Version" : "مفعَّل بالنسخة التجريبية"}</span>
                    </div>
                  </div>

                  {/* Competitor Card */}
                  <div className={`p-6 border rounded-[2.5rem] space-y-4 text-right flex flex-col justify-between shadow-lg transition-all duration-500  ${
                    activeTab === 'ai-drafting' 
                      ? 'bg-rose-500/5 border-rose-500/20' 
                      : 'bg-rose-50/30 border-rose-100 shadow-rose-500/5'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-black px-4 py-2 rounded-xl w-fit block mb-4 uppercase tracking-[0.1em] shadow-sm ${
                        activeTab === 'ai-drafting' ? 'bg-rose-500 text-white' : 'bg-white text-rose-700 border border-rose-100'
                      }`}>
                        ✘ {isEn ? "Standard Competitor Systems" : "العيوب بالبرامج الأخرى"}
                      </span>
                      <p className={`text-[13px] leading-relaxed font-bold ${activeTab === 'ai-drafting' ? 'text-rose-100/80' : 'text-slate-200 font-bold'}`}>
                        {matchingF.advCompetitors}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2.5 text-[10px] font-black mt-4 pt-4 border-t ${activeTab === 'ai-drafting' ? 'border-rose-500/10 text-rose-400' : 'border-rose-200/50 text-rose-400'}`}>
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>{isEn ? "High operational risk & missing sync" : "يهدر الساعات ويؤخر الأداء"}</span>
                    </div>
                  </div>

                </div>

                <div className="pt-2">
                  <button 
                    onClick={onTrialSelect}
                    className="px-6 py-3 bg-gradient-to-l from-slate-900 to-[#0c2461][#1a365d] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow border border-slate-700"
                  >
                    <span>{isEn ? "Test This Module Natively (Trial Version) ⚡" : "جرِّب مخرجات وإعدادات هذا القسم مجاناً ⚡"}</span>
                  </button>
                </div>

              </div>

              {/* Feature Visual representation mockup */}
              <div className={`lg:col-span-5 rounded-2xl p-6 border border-amber-600/25 relative overflow-hidden space-y-4 shadow-inner ${
                activeTab === 'ai-drafting' ? 'bg-[#320a3d]' : 'bg-sky-100'
              }`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5 text-slate-900 ">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span className="text-xs text-amber-400 font-black font-mono tracking-widest uppercase font-black">
                    {matchingF.id.toUpperCase()}-STATION-SECURE
                  </span>
                </div>

                {/* Specific mockups matching active tabs */}
                {activeTab === 'ai-drafting' && (
                  <div className="space-y-3.5 text-right text-xs font-mono leading-relaxed text-[#0c2461]">
                    <div className="p-2.5 bg-[#5c0d12] border border-amber-500/20 rounded-xl space-y-1.5 shadow-md">
                      <p className="text-[#0c2461] font-black">🤖 {isEn ? "AI Court Assistant:" : "مساعد الذكاء الاصطناعي العدلي:"}</p>
                      <p className="text-[#0c2461] font-bold italic shadow-emerald-500/10">
                        {isEn ? '"Draft an appeal for a commercial supply dispute judgment..."' : '"قم بصياغة لائحة اعتراضية على حكم قضائي صادر في نزاع توريد تجاري..."'}
                      </p>
                    </div>
                    
                    <div className="space-y-1.5 text-[#0c2461] font-bold border-r-2 border-emerald-600 pr-2.5 bg-[#0f3d1b] p-3 rounded-xl shadow-md">
                      <p className="text-[#0c2461] font-extrabold">✓ {isEn ? "Extracted Judgment details matched with Commercial Court codes." : "تم تشخيص مستند الحكم ومطابقته بمواد نظام المحاكم التجارية السعودي."}</p>
                      <p className="text-[#0c2461] font-black">🚀 {isEn ? "Suggested core defense:" : "الدفع المقترح: عدم مطابقة الخدمة المصدرة للمادة السابعة من العقد والانتفاع المالي."}</p>
                      <p className="text-[#0c2461]">
                        {isEn ? 'Plea: "First, we plead nullity of the debt due to failure of delivery..."' : 'الدفوع: "أولاً: ندفع ببطلان المديونية لثبوت عدم تسليم البضائع..."'}
                      </p>
                    </div>
                    <p className="text-[#0c2461] text-xs text-center font-extrabold">
                      {isEn ? "✓ Deep Saudi judicial laws AI agent is active." : "✓ نموذج AI ذكي لتدقيق وصياغة الدفوع النظامية مفعَّل فورا بالنسخ التجريبية"}
                    </p>
                  </div>
                )}

                {activeTab === 'whatsapp-alerts' && (
                  <div className="space-y-3.5 text-right text-xs font-mono text-slate-900">
                    <div className="bg-[#0b2414] border-2 border-emerald-400/30 p-3 rounded-xl space-y-1.5 shadow-md">
                      <div className="flex justify-between text-emerald-300 font-black">
                        <span>💬 {isEn ? "WhatsApp Message (Auto dispatched)" : "رسالة واتساب (مرسلة آلياً)"}</span>
                        <span className="text-emerald-400 font-bold">10:30 ص</span>
                      </div>
                      <p className="text-emerald-100 font-medium leading-relaxed">
                        {isEn ? '"Hearing Remind: Dear Ahmed, we notify you that your hearing #43194 is tomorrow morning..."' : '"تذكير قضائي عاجل: المحترم أحمد بكر، نحيط سعادتكم علماً باقتراب تاريخ جلسة المرافعة المجدولة لقضيتكم رقم 43194 صبيحة يوم غدٍ أي بعد أقل من 24 ساعة..."'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs text-slate-900 font-bold shadow-sm">
                      <span className="text-slate-200 font-bold">{isEn ? "Carrier: Official WhatsApp API" : "الناقل: Twilio Official WhatsApp"}</span>
                      <span className="text-emerald-700 font-black">✓ {isEn ? "Delivered" : "تم التوصيل (تحقق آلي)"}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'najiz-sync' && (
                  <div className="space-y-3 text-right text-xs font-mono text-slate-950">
                    <div className="p-3 bg-white border border-slate-205 rounded-xl space-y-2 shadow-sm">
                      <div className="flex justify-between items-center text-xs text-amber-900 border-b border-slate-100 pb-1.5 font-black">
                        <span>{isEn ? "Najiz Portal - MoJ" : "بوابة ناجز - وزارة العدل"}</span>
                        <span className={isNajizConnected ? "animate-pulse text-emerald-700 font-bold" : "text-slate-700 font-bold"}>
                          {isNajizConnected ? "● متصل آمن (API)" : "● اتصال محلي مفعَّل"}
                        </span>
                      </div>
                      <p className="text-[#0c2461] font-black">🔍 {isEn ? "Discovered Commercial Lawsuit #437194619" : "رصد دعوى تجارية جديدة (الرقم: 437194619)"}</p>
                      <p className="text-slate-850 font-bold">{isEn ? "Plaintiff: Public Beverages Co." : "المدعي: شركة المشروبات العامة"}</p>
                      <p className="text-slate-800 font-bold">{isEn ? "Hearing Date: June 15, 2026, 10:00 AM" : "تاريخ الجلسة القادمة: 15 يونيو 2026 الساعة 10:00 ص"}</p>
                    </div>
                    <p className="text-slate-800 text-[10px] text-center font-bold">
                      {isEn ? "✓ Continuous background synchronization is live." : "✓ مزامنة مستمرة تضمن سلامة الأجندة لمديري المكاتب والمستشارين"}
                    </p>
                  </div>
                )}

                {activeTab === 'task-management' && (
                  <div className="space-y-3 text-right text-[10.5px] font-mono text-slate-950">
                    <p className="text-amber-900 font-black">📋 {isEn ? "Kanban Frame & Case Milestones:" : "لوحة التحكم وسير المهام (Kanban Frame):"}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                        <span className="text-[11px] text-amber-850 block font-extrabold">⏳ {isEn ? "Working" : "قيد العمل"}</span>
                        <strong className="text-slate-950 block mt-1">{isEn ? "Reviewing EPC Contract" : "دراسة عقد المقاولة"}</strong>
                        <span className="text-slate-700 block mt-1">{isEn ? "Assigned: Eng. Saleh" : "مكلَّف: م. صالح"}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 border-2 border-emerald-350 rounded-xl relative shadow-sm">
                        <span className="text-[11px] text-emerald-800 block font-black">✓ {isEn ? "Completed" : "مكتملة"}</span>
                        <strong className="text-slate-800 block mt-1 line-through">{isEn ? "Edit Appeal Memo" : "تعديل مذكرة الاستئناف"}</strong>
                        <span className="text-emerald-700 font-black block mt-1">✓ {isEn ? "Drag & Drop Done" : "سحب وإفلات ناجح ⚡"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'finance-zatca' && (
                  <div className="space-y-3 text-right text-xs font-mono text-slate-950">
                    <div className="p-3 bg-white border-r-3 border-amber-600 border-y border-l border-slate-205 rounded-xl space-y-2 shadow-sm">
                      <div className="flex justify-between font-black">
                        <span className="text-[#0c2461]">{isEn ? "Tax Invoice (Simplified)" : "سند قبض ضريبي (فاتورة مبسطة)"}</span>
                        <span className="text-amber-800">#FT-1029</span>
                      </div>
                      <p className="text-slate-800 font-bold">{isEn ? "Client Name: Sadafco Corp" : "اسم العميل: شركة سدافكو للتنمية"}</p>
                      <div className="flex justify-between text-emerald-850 font-black text-xs pt-1.5 border-t border-slate-100">
                        <span>{isEn ? "Total Amount (with 15% VAT):" : "المبلغ الإجمالي (شامل القيمة المضافة):"}</span>
                        <span>42,000 {isEn ? "SAR" : "ر.س"}</span>
                      </div>
                    </div>
                    <div className="flex justify-center p-2 bg-white rounded-xl w-20 h-20 mx-auto border border-slate-100 shadow-inner">
                      {/* Fake QR representation */}
                      <div className="grid grid-cols-5 gap-0.5 w-full h-full bg-slate-950 p-1 rounded">
                        <div className="bg-white col-span-2 row-span-2"></div>
                        <div className="bg-slate-950"></div>
                        <div className="bg-white col-span-2"></div>
                        <div className="bg-white"></div>
                        <div className="bg-slate-950"></div>
                        <div className="bg-white col-span-3"></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vault-security' && (
                  <div className="space-y-3 text-right text-[10.5px] font-mono text-slate-950">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="text-slate-950 block font-bold">📄 {isEn ? "Confidential_Defense_Plea_v2.pdf" : "وثيقة_تعميل_سري_للغاية.pdf"}</span>
                        <span className="text-[9.5px] text-slate-700 block font-black">{isEn ? "Size: 4.2 MB • AES-256 Encrypted" : "الحجم: 4.2 MB • تشفير AES-256"}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                        <Shield className="w-5 h-5 font-black" />
                      </div>
                    </div>
                    <div className="text-red-950 text-[10px] font-extrabold text-center bg-red-50 p-2.5 rounded-xl border border-red-200 leading-normal shadow-sm">
                      ⚠️ {isEn ? "Protected by smart forensic watermark with active logger." : "محمي بعلامة مائية رقمية تمنع تسريب تفاصيل التعميل والمرافعات خارج مكاتب المستشارين والمحاميين والمستشاريين القانونيين القانونيين المعتمدين."}
                    </div>
                  </div>
                )}

              </div>

            </ContrastMotionDiv>
          );
        })()}

      </section>

      {/* Enhancing User Experience (UX Ease-of-Use & Value Savings Calculator Section) */}
      <section id="roi-calculator" className="py-24 border-t border-b bg-slate-50 border-slate-800 relative z-10 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Value description of Ease of Use */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black text-amber-400 font-black tracking-widest block uppercase">
                🚀 {isEn ? "EASY TO USE & HIGHLY INTUITIVE USER EXPERIENCE" : "تجربة مستخدم سهلة، بساطة مطلقة، وتوفير هائل للموارد"}
              </span>
              <h3 className="text-3xl md:text-5xl font-black text-[#0c2461] leading-tight">
                {isEn ? "Simplify KSA Legal Workspace Logistics Seamlessly" : "لا نعقد المسائل القانونية؛ بل نبسط التشغيل الإداري اليومي لمكتبك"}
              </h3>
              
              <p className="text-sm md:text-base text-slate-650 font-bold leading-relaxed">
                {isEn 
                  ? "We put immense craftsmanship into designing Al-Adalah. Our screens do not contain terrifying administrative bloat or cryptic configurations. Every control is clearly explained in friendly Arab court dialects. Easily onboard your assistants or corporate partners to work concurrently from the same database board."
                  : "ندرك تمامًا أن المستشارين والمحاميين والمستشاريين القانونيين والمستشارين القانونيين لا يملكون الوقت الكافي للتدريب الطويل أو مواجهة شاشات المحاسبة وتفاصيل الدعاوى الجامدة والمعقدة. لذا، ترتكز منصة العدالة على تقديم تجربة مستخدم مبسطة وخالية من الهدر؛ شاشات واضحة بعبارات قضائية مفهومة، مع توفير أقصى درجات حماية البيانات والتحقق بخطوتين لضمان ريادتكم التقنية."}
              </p>

              {/* SAVINGS CALCULATOR METRICS */}
              <div className="p-6 bg-white  rounded-3xl border border-slate-800  shadow-lg space-y-5">
                <span className="text-sm font-black text-amber-400 font-black bg-amber-600/10 px-3 py-1 rounded-full uppercase">
                  📊 {isEn ? "Interactive ROI Savings Calculator" : "حاسبة تقدير الوفورات الشهرية والمالية مع منصة العدالة"}
                </span>

                <div className="space-y-4 pt-2">
                  {/* Slider 1: Case volume */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900 ">
                      <span>{isEn ? "Number of active lawsuits/cases:" : "عدد القضايا النشطة حالياً بالمكتب:"}</span>
                      <span className="font-sans font-black text-[#0c2461]">{casesCount}</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="200" 
                      value={casesCount} 
                      onChange={(e) => setCasesCount(parseInt(e.target.value))} 
                      className="w-full accent-amber-500 bg-slate-200  h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider 2: Lawyer count */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900 ">
                      <span>{isEn ? "Number of practicing legal consultants:" : "عدد المستشارين والمرافعين بفريقك:"}</span>
                      <span className="font-sans font-black text-[#0c2461]">{lawyersCount}</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="30" 
                      value={lawyersCount} 
                      onChange={(e) => setLawyersCount(parseInt(e.target.value))} 
                      className="w-full accent-amber-500 bg-slate-200  h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* Left box displays target calculated values dynamically */}
            <div className="lg:col-span-6 bg-sky-50 p-8 rounded-[2.5rem] border-2 border-amber-600/40 text-slate-950 relative overflow-hidden flex flex-col justify-between h-[360px] shadow-2xl">
              <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 blur-3xl rounded-full"></div>
              
              <div className="space-y-4">
                <span className="text-xs bg-amber-500/10 text-amber-800 border border-amber-600/30 px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block">
                  🎯 {isEn ? "Value Unleashed Monthly" : "الوفورات التشغيلية الحقيقية لمكتبك شهرياً"}
                </span>
                
                <h4 className="text-xl font-black text-slate-900">
                  {isEn 
                    ? "Through Al-Adalah automation, your legal firm achieves:" 
                    : "بتفعيلك لمنظومة العدالة الذكية، يستعيد مكتبك الأرقام التالية:"}
                </h4>

                <div className="grid grid-cols-2 gap-5 pt-3">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <span className="text-xs text-slate-800 font-bold block">{isEn ? "Saved Billable Hours" : "ساعات العمل المهدورة المستعادة:"}</span>
                    <span className="text-3xl font-black text-emerald-700 block mt-1 font-sans">{calculatedSavingsHours} {isEn ? "Hrs" : "ساعة"}</span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <span className="text-xs text-slate-800 font-bold block">{isEn ? "Equivalent Business Value" : "القيمة المقابلة المحققة للمكتب:"}</span>
                    <span className="text-3xl font-black text-amber-400 font-black block mt-1 font-sans">{calculatedSavesSAR.toLocaleString()} {isEn ? "SAR" : "ر.س"}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-900 font-bold shrink-0">
                  {isEn 
                    ? "Cuts administrative support cost, protects important dates, and doubles profits."
                    : "احم مكتبك من خطأ مدد الجلسات وسرّع من تحصيل الأتعاب فورياً."}
                </p>
                <button 
                  onClick={onTrialSelect}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 active:scale-95 transition-all text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  <span>{isEn ? "Instantly Onboard Trial Version 🚀" : "ابدأ استعراض التجربة الفورية 🚀"}</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Interactive Framer Motion Section */}
      <FeaturesInteractiveSection isEn={isEn} />

      {/* Competitive Matrix Section */}
      <section id="competitive-matrix" className="py-4 md:py-24 bg-[#f1f5f9] border-t border-b border-slate-800  relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right font-sans">
          
          <div className="text-center mb-16 space-y-4">
            <span className="text-sm font-black text-amber-800 tracking-widest block uppercase">
              {isEn ? "THE ABSOLUTE BEST IN SAUDI ARABIA" : "منصة العدالة: مقارنة القوة والسيادة التقنية المباشرة بمنافسيها"}
            </span>
            <h2 className="text-2xl md:text-5xl font-black text-[#0c2461] leading-tight">
              {isEn ? "Why Al-Adalah Easily Outclasses Traditional Legal Software" : "لماذا نتفوق على الأنظمة والخيارات التقليدية المطروحة بالسوق؟"}
            </h2>
            <p className="text-sm md:text-lg max-w-3xl mx-auto text-slate-900  font-bold leading-normal">
              {isEn 
                ? "Outdated competitor databases restrict you with endless manual typing, zero intelligent AI models, and lack server-side WhatsApp capabilities. Al-Adalah was optimized to reflect modern KSA judicial decrees."
                : "معظم مكاتب الاستشارات بالمملكة تشتكي من الأنظمة التقنية المستوردة أو البرمجيات القديمة التي تفتقر للمرونة والفهم العميق للأنظمة واللوائح القضائية السعودية. إليك ما يجعلنا الخيار الأول والاحترافي للنخبة:"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-white shadow-xl animate-fade-in" data-contrast-ignore="true">
            <table className="w-full text-right border-collapse text-xs md:text-sm landing-matrix-table" data-contrast-ignore="true">
              <thead>
                <tr className="bg-slate-100 text-[#0c2461] border-b border-slate-800" data-contrast-ignore="true">
                  <th className="p-5 font-black text-right text-xs md:text-sm text-slate-900 col-feature-title" data-contrast-ignore="true">{isEn ? "Core Technology Feature" : "الميزة والخدمة التقنية الحيوية"}</th>
                  <th className="p-5 font-black text-center text-white text-xs md:text-sm col-header-adalah" data-contrast-ignore="true">{isEn ? "Al-Adalah Supreme" : "⚖️ منصة العدالة (المنظومة المحترفة)"}</th>
                  <th className="p-5 font-black text-center text-slate-900 text-xs md:text-sm col-feature-title" data-contrast-ignore="true">{isEn ? "Standard Competitor Systems" : "الأنظمة المنافسة والتقليدية"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-900 font-bold" data-contrast-ignore="true">
                
                <tr className="hover:bg-slate-50" data-contrast-ignore="true">
                  <td className="p-5" data-contrast-ignore="true">
                    <p className="text-sm font-black col-feature-title text-[#0c2461]" data-contrast-ignore="true">{isEn ? "Auto Najiz.sa Real-Time Sync" : "مزامنة وسحب تفاصيل وأوراق قضايا ناجز آلياً"}</p>
                    <p className="text-xs leading-normal mt-1 col-feature-desc text-[#1e293b]" data-contrast-ignore="true">{isEn ? "Fetches lawsuits, sessions, and judicial outcomes silently with zero manual typing." : "رصد تلقائي للدوائر ومستجدات القضايا بالتحقق من وكالات وخطوات ناجز ووزارة العدل."}</p>
                  </td>
                  <td className="p-5 text-center font-extrabold col-cell-adalah" data-contrast-ignore="true">
                    <p className="badge-adalah py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">✅ {isEn ? "Autonomous, Real-time" : "لحظي وتلقائي بالكامل"}</p>
                  </td>
                  <td className="p-5 text-center font-bold bg-red-50/20" data-contrast-ignore="true">
                    <span className="badge-competitor py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">❌ {isEn ? "Manual Inputs Only" : "إدخال ومتابعة يدوية مرهقة جداً"}</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50" data-contrast-ignore="true">
                  <td className="p-5" data-contrast-ignore="true">
                    <p className="text-sm font-black col-feature-title text-[#0c2461]" data-contrast-ignore="true">{isEn ? "Saudi Native Generative Legal AI" : "مساعد الذكاء الاصطناعي القانوني للأنظمة السعودية"}</p>
                    <p className="text-xs leading-normal mt-1 col-feature-desc text-[#1e293b]" data-contrast-ignore="true">{isEn ? "Specifically trained on civil codes and labor pleading in KSA in seconds." : "صياغة المذكرات الجوابية، اللوائح الاعتراضية، وتوليد نصوص الدفوع المستوحاة من الشريعة في ثوان."}</p>
                  </td>
                  <td className="p-5 text-center font-extrabold col-cell-adalah" data-contrast-ignore="true">
                    <p className="badge-adalah py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">✅ {isEn ? "Integrated (Gemini)" : "خفير قضائي مدمج بالعدالة"}</p>
                  </td>
                  <td className="p-5 text-center font-bold bg-red-50/20" data-contrast-ignore="true">
                    <span className="badge-competitor py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">❌ {isEn ? "No AI or Mock Templates" : "ملفات نصية مفرغة تفتقر للفطنة القانونية"}</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50" data-contrast-ignore="true">
                  <td className="p-5" data-contrast-ignore="true">
                    <p className="text-sm font-black col-feature-title text-[#0c2461]" data-contrast-ignore="true">{isEn ? "Interactive 24-Hour WhatsApp Alerting" : "أتمتة اتصالات الواتساب وتنبيه الجلسة قبلها بـ 24 ساعة"}</p>
                    <p className="text-xs leading-normal mt-1 col-feature-desc text-[#1e293b]" data-contrast-ignore="true">{isEn ? "Auto notifies corporate clients and partners regarding important milestones." : "إشعار العميل آلياً عبر جواله لجلسات المحاكمة، الفواتير، ومستجدات ملف قضاياه."}</p>
                  </td>
                  <td className="p-5 text-center font-extrabold col-cell-adalah" data-contrast-ignore="true">
                    <p className="badge-adalah py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">✅ {isEn ? "Native Twilio Gateway" : "موصل واتساب مدمج ورسمي"}</p>
                  </td>
                  <td className="p-5 text-center font-bold bg-red-50/20" data-contrast-ignore="true">
                    <span className="badge-competitor py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">❌ {isEn ? "Requires Manual Text" : "رسائل أو اتصالات يدوية تكلف فريقك وقتاً"}</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50" data-contrast-ignore="true">
                  <td className="p-5" data-contrast-ignore="true">
                    <p className="text-sm font-black col-feature-title text-[#0c2461]" data-contrast-ignore="true">{isEn ? "ZATCA compliant E-invoicing Stage II" : "محاسبة قانونية وفواتير الزكاة مرحلة ٢"}</p>
                    <p className="text-xs leading-normal mt-1 col-feature-desc text-[#1e293b]" data-contrast-ignore="true">{isEn ? "Encrypts QR codes conforming specifically to KSA tax guidelines." : "إثبات الأتعاب وضريبة القيمة المضافة وإصدار فواتير QR مشفرة تلقائياً."}</p>
                  </td>
                  <td className="p-5 text-center font-extrabold col-cell-adalah" data-contrast-ignore="true">
                    <p className="badge-adalah py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">✅ {isEn ? "Certified & Approved" : "مدمج متطابق تماماً %100"}</p>
                  </td>
                  <td className="p-5 text-center font-bold bg-red-50/20" data-contrast-ignore="true">
                    <span className="badge-competitor py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">❌ {isEn ? "Basic Templates" : "أنظمة فوترة وإكسيل غير نظامية"}</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50" data-contrast-ignore="true">
                  <td className="p-5" data-contrast-ignore="true">
                    <p className="text-sm font-black col-feature-title text-[#0c2461]" data-contrast-ignore="true">{isEn ? "Watermarked Files & Safe Data" : "السيادة الكاملة على البيانات وأختام لمنع التسريب"}</p>
                    <p className="text-xs leading-normal mt-1 col-feature-desc text-[#1e293b]" data-contrast-ignore="true">{isEn ? "Detailed security logs, watermarks on downloads, secure local vaults." : "تسجيل تدقيق، حماية المستندات بعلامات مائية رقمية باسم الموظف الحامل للملف سدا لأي تسريب."}</p>
                  </td>
                  <td className="p-5 text-center font-extrabold col-cell-adalah" data-contrast-ignore="true">
                    <p className="badge-adalah py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">✅ {isEn ? "Bank-Grade Encryption" : "خزن بنكية مشفرة وحفظ أرشيف وطني"}</p>
                  </td>
                  <td className="p-5 text-center font-bold bg-red-50/20" data-contrast-ignore="true">
                    <span className="badge-competitor py-1.5 px-3 rounded-xl inline-block font-black text-xs" data-contrast-ignore="true">❌ {isEn ? "Shared Storage" : "مستودعات مكشوفة دون أختام مائية للحماية"}</span>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-[#0c2461]/5  border border-slate-800  text-center">
            <p className="text-xs md:text-sm text-[#0c2461] font-black">
              💡 {isEn 
                ? "Al-Adalah achieves S-Tier efficiency. Optimize operating costs and win cases securely. Activate the Trial version on any device instantly."
                : "الانتقال إلى منصة العدالة يضمن لك الكفاءة الكاملة وحلولا متفوقة خالية من التعقيد لإدارة مئات المكاتب وتفاصيل القضايا بكل سرية وتنظيم احترافي."}
            </p>
          </div>

        </div>
      </section>

      {/* Cloud Sovereignty and Saudi Vision 2030 Compliance */}
      <section className="py-20 border-t bg-[#f8fafc] border-b border-slate-800  text-right font-sans relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-8 space-y-5">
              <span className="text-xs font-black text-amber-400 font-black tracking-widest block uppercase">
                🇸🇦 {isEn ? "SAUDI VISION 2030 DIGITAL JUSTICE" : "السيادة الرقمية وتثبيت الخصوصية التامة للمستندات القضائية"}
              </span>
              <h3 className="text-2xl md:text-4xl font-black text-[#0c2461] leading-tight">
                {isEn ? "National Data Sovereignty & Secure KSA Hosted Cloud Backup" : "استضافات محلية في الرياض مطابقة لشروط الهيئة الوطنية للأمن السيبراني"}
              </h3>
              <p className="text-sm text-slate-900  leading-relaxed font-black">
                {isEn 
                  ? "We take absolute care of safety. All databases, financial records, client credentials, and court portfolios are safely hosted in Saudi Arabia clouds, conforming cleanly to MoJ and CyberSecurity rules. Safeguard your secrets and leverage advanced audit logs."
                  : "صممت منصة العدالة بأعلى معايير الأمان لحماية بيانات عملاء ومحامين المملكة. جميع ملفات وكالاتك وعملائك مشفرة ومحفوظة في خوادم سعودية معتمدة ومتوافقة مع وزارة العدل والأمن السيبراني لحماية خصوصية عملائك بشكل كامل."
                }
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs text-slate-900  font-bold">
                <p>✔ {isEn ? "Compliance with all MoJ regulations and guidelines" : "تزامن وإطار حماية يمنع فقدان أي مواقيت قضائية"}</p>
                <p>✔ {isEn ? "AES-256 standard encryption keys for attachments" : "خوادم سحابية مطابقة وموثقة NCA بالشبكة"}</p>
                <p>✔ {isEn ? "Comprehensive, immutable audit logs for lawyer actions" : "سجل تتبع تدبيغ غير قابل للتلاعب لعمليات الموظفين"}</p>
                <p>✔ {isEn ? "Arabic native support with immediate assistance 24/7" : "تدريب وشروح سهلة الاستخدام لكل مستشاري مكتبك"}</p>
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              <div className="bg-white  border border-slate-800  p-6 rounded-2xl text-center shadow-md">
                <p className="text-2xl sm:text-3xl font-black text-amber-400 font-black font-sans">100%</p>
                <p className="text-xs text-slate-900  font-bold mt-1">{isEn ? "Saudi Sovereignty" : "سيادة رقمية وطنية"}</p>
              </div>
              <div className="bg-white  border border-slate-800  p-6 rounded-2xl text-center shadow-md">
                <p className="text-2xl sm:text-3xl font-black text-amber-400 font-black font-sans">AES-256</p>
                <p className="text-xs text-slate-900  font-bold mt-1">{isEn ? "Vault Encryption" : "تشفيرات بنكية متينة"}</p>
              </div>
              <div className="bg-white  border border-slate-800  p-6 rounded-2xl text-center shadow">
                <p className="text-2xl sm:text-3xl font-black text-emerald-500 font-sans">0%</p>
                <p className="text-xs text-slate-900  font-bold mt-1">{isEn ? "Data shared outside" : "أية ثغرات أو تسريبات"}</p>
              </div>
              <div className="bg-white  border border-slate-800  p-6 rounded-2xl text-center shadow">
                <p className="text-2xl sm:text-3xl font-black text-emerald-555 font-sans">24/7</p>
                <p className="text-xs text-slate-900  font-bold mt-1">{isEn ? "Constant Support" : "مراقبة مسار نشط"}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing / Trial Version Main Landing Call to Action */}
      <section className="py-24 max-w-5xl mx-auto px-4 text-center font-sans relative z-10 transition-all">
        <ContrastMotionDiv 
          bgClass="bg-[#0c2461]"
          className="p-8 md:p-14 rounded-[3rem] border-4 border-amber-500/50 shadow-[0_0_50px_rgba(12,36,97,0.3)] space-y-6"
        >
          <span className="px-4 py-1.5 bg-amber-600 text-slate-950 rounded-full text-xs font-black uppercase tracking-widest inline-block mb-3 shadow-md">
            {isEn ? "ACTIVATE EXTREMELY LIMITED FREE ACCESS" : "تنشيط النسخة التجريبية الفورية الخالية من الرسوم"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight font-display">
            {isEn ? "Experience the Future of Legal Workspace Today" : "حوِّل تجربة مستشاري مكتبك لقمة السهولة والكفاءة"}
          </h2>
          <p className={`text-sm md:text-lg font-black leading-relaxed max-w-3xl mx-auto ${!isEn ? 'text-[#b8860b]' : 'text-white font-bold'}`}>
            {isEn 
              ? "Join hundreds of practicing legal groups in Riyadh, Jeddah, Khobar, and across Saudi Arabia who took supreme digital control. Onboard the unconstrained FREE Trial Version immediately." 
              : "لا حاجة لتقديم أية بيانات بنكية أو الدخول في تعقيد مع مئات الموظفين والمستشارين. انضم إلى مكاتب النخبة في الرياض وجدة وكافة أنحاء المملكة التي حققت السيطرة الكاملة على قضاياها مع منصة العدالة."
            }
          </p>
          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onTrialSelect}
              className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-2xl text-base shadow-2xl active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              id="cta-activate-trial-unlocked"
            >
              <Zap className="w-5 h-5 text-slate-950" />
              <span>{isEn ? "Activate Unlocked Free Trial Version Only ⚡" : "ابدأ استعراض النسخة التجريبية فورا (بدون التزام) ⚡"}</span>
            </button>
            <button 
              onClick={onSignInSelect}
              className="px-8 py-5 bg-white text-slate-900 font-black rounded-2xl text-xs border border-slate-300 active:scale-95 transition-all text-center"
              id="cta-login-direct"
            >
              {isEn ? "Member Area Login Area" : "تسجيل الدخول للمستشارين المعتمدين 🔐"}
            </button>
          </div>
        </ContrastMotionDiv>
      </section>

      {/* Contact Form Integrated Section */}
      <ContactSection isEn={isEn} />

      {/* FAQs Section */}
      <section id="faqs" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-right relative z-10 font-sans border-t border-slate-800 ">
        
        <div className="text-center mb-16">
          <h3 className="text-2xl md:text-4xl font-black text-[#0c2461] font-display">{isEn ? "Elite Legal Transformation: FAQ" : "مكتبة المعرفة والربط: الأسئلة الشائعة"}</h3>
          <p className="text-xs text-slate-900  mt-2 font-bold">{isEn ? "Find answers regarding Najiz safe credentials, security, and ZATCA compliance" : "كل ما ترغب بمعرفته حول طرق المزامنة وموثوقية منصة العدالة وإشعارات الواتساب"}</p>
        </div>

        <div className="space-y-4">
          
          <div className="bg-white  border border-slate-800  rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
            <button 
              onClick={() => setFaqOpen(faqOpen === 0 ? null : 0)}
              className="w-full p-5 text-right flex items-center justify-between text-[#0c2461] outline-none cursor-pointer"
            >
              <span className="text-sm sm:text-base font-extrabold text-right leading-snug">{isEn ? "Is the platform officially authorized to sync with Najiz?" : "كيف يتم تأمين الربط والمزامنة التلقائية مع حسابات ناجز ووكالات وزارة العدل؟"}</span>
              <HelpCircle className={`w-5 h-5 text-amber-500 shrink-0 transition-transform ${faqOpen === 0 ? 'rotate-180' : ''}`} />
            </button>
            {faqOpen === 0 && (
              <div className="p-5 pt-0 border-t border-slate-150  text-xs sm:text-sm text-slate-900  font-bold leading-relaxed text-right">
                {isEn 
                  ? "Absolutely. We utilize advanced localized chrome extension tokens and authorized API workflows. We never save raw credentials on our database servers. Everything runs with direct visual checkouts matching standard MoJ constraints perfectly."
                  : "تم التطوير وفق دراسات متقدمة تضمن تمام الأمان؛ حيث يتم إرسال واستلام البيانات عبر رموز تعريفية مؤمنة ومشفرة بالكامل. لا نقوم بحفظ تفاصيل كلمات المرور الخاصة بك في خوادمنا، وكل التحديثات والجدولة تتم تحت إشراف تصفحك الآمن وبمرونة عالية."}
              </div>
            )}
          </div>

          <div className="bg-white  border border-slate-800  rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
            <button 
              onClick={() => setFaqOpen(faqOpen === 1 ? null : 1)}
              className="w-full p-5 text-right flex items-center justify-between text-[#0c2461] outline-none cursor-pointer"
            >
              <span className="text-sm sm:text-base font-extrabold text-right leading-snug">{isEn ? "Does the system comply with ZATCA Phase II invoicing?" : "هل يدعم النظام ضريبة القيمة المضافة وفواتير هيئة الزكاة والضريبة؟"}</span>
              <HelpCircle className={`w-5 h-5 text-amber-500 shrink-0 transition-transform ${faqOpen === 1 ? 'rotate-180' : ''}`} />
            </button>
            {faqOpen === 1 && (
              <div className="p-5 pt-0 border-t border-slate-150  text-xs sm:text-sm text-slate-900  font-bold leading-relaxed text-right">
                {isEn 
                  ? "Yes, the local financial accounting module generated is fully compliant with phase II guidelines of the ZATCA authorities, enabling dynamic QR codes and printing compliant vouchers."
                  : "نعم، النظام المالي للمنصة مهيأ ومتوافق بالكامل مع متطلبات المرحلة الثانية للفوترة الإلكترونية الصادرة عن هيئة الزكاة والضريبة والجمارك (ZATCA)، مع توليد تلقائي للرموز المشفرة (QR Code) على كافة الفواتير وبنود العقود المالية لتفادي المخالفات."}
              </div>
            )}
          </div>

          <div className="bg-white  border border-slate-800  rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
            <button 
              onClick={() => setFaqOpen(faqOpen === 2 ? null : 2)}
              className="w-full p-5 text-right flex items-center justify-between text-[#0c2461] outline-none cursor-pointer"
            >
              <span className="text-sm sm:text-base font-extrabold text-right leading-snug">{isEn ? "How does the automatic WhatsApp dispatcher work?" : "كيف تعمل ميزة الإشعار بالواتساب وهل تحتاج لرسائل إضافية مأجورة؟"}</span>
              <HelpCircle className={`w-5 h-5 text-amber-500 shrink-0 transition-transform ${faqOpen === 2 ? 'rotate-180' : ''}`} />
            </button>
            {faqOpen === 2 && (
              <div className="p-5 pt-0 border-t border-slate-150  text-xs sm:text-sm text-slate-900  font-bold leading-relaxed text-right">
                {isEn 
                  ? "When a new hearing is imported or client financial payment is recorded, our background server instantly routes a customized narrative notification via WhatsApp API, directly to the client's registered mobile."
                  : "بمجرد تعديل حالة دعوى ما إلى 'صادر فيها حكم لموكلك' أو 'مغلقة' أو عند اقتراب مواعيد الجلسات بـ 24 ساعة، يقوم السيرفر التلقائي بتنفيذ تذكير فوري باسم العميل بالواتساب عبر قنواتنا المدمجة دون فرض رسوم خارجية، مما يعزز العلاقات العامة لمكتبك."}
              </div>
            )}
          </div>

        </div>

      </section>

      {/* Footer Block */}
      <footer className="py-16 text-right border-t bg-white border-slate-800 font-sans relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800 ">
            
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2 justify-start">
                <div className="w-8 h-8 bg-amber-600/10 rounded-lg flex items-center justify-center text-amber-400 font-black">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-lg text-[#0c2461]">{isEn ? "Al-Adalah Platform" : "منصة العدالة لإدارة مكاتب المحاماة"}</span>
              </div>
              <p className="text-xs text-slate-900  leading-relaxed max-w-sm font-bold">
                {isEn 
                  ? "Leading the legal tech paradigm shift inside the Kingdom. Delivering secure, sovereign, and intelligent judicial operating workflows for elite Saudi law firms."
                  : "العدالة القانونية والشرعية الرقمية الأكثر تفصيلاً وسهولة لمكاتب المستشارين والمحاميين والمستشاريين القانونيين في الرياض، وباقي مدن المملكة. نوفر واجهات مبسطة تجمع كل المزايا المالية والتقنية وندعم تجربة العميل الشرعي العربي المحترف."
                }
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 font-bold">
              <div className="space-y-3">
                <h5 className="text-xs text-[#0c2461]">{isEn ? "Core Modules" : "ميزات العدالة"}</h5>
                <ul className="space-y-2 text-sm text-slate-900  font-semibold font-sans">
                  <li>{isEn ? "MOJ Najiz Sync" : "مزامنة ناجز والوكالات"}</li>
                  <li>{isEn ? "Saudi Legal AI Helper" : "مستشار الذكاء الاصطناعي (AI)"}</li>
                  <li>{isEn ? "ZATCA compliant Invoices" : "فواتير وسندات الزكاة (مرحلة ٢)"}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs text-[#0c2461]">{isEn ? "Security & Hosting" : "أمان الأرشيف"}</h5>
                <ul className="space-y-2 text-sm text-slate-900  font-semibold font-sans">
                  <li>{isEn ? "KSA Cloud Hostings" : "خوادم وطنية آمنة بالرياض"}</li>
                  <li>{isEn ? "AES-256 Encryption Vaults" : "تشفير الملفات والتعميلات الفائق"}</li>
                  <li>{isEn ? "Lawyer Audit Logs" : "سجلات مراقبة جرد الموظفين"}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs text-[#0c2461]">{isEn ? "Trial & Assist" : "أرقام الدعم"}</h5>
                <p className="text-xs text-amber-400 font-black font-mono">support@al-adalah.sa</p>
                <p className="text-xs text-slate-900  font-sans">{isEn ? "Dedicated assist team 24/7" : "فريق فني ومساندة متخصص ٢٤ ساعة بالرياض"}</p>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-sm font-bold text-slate-900  font-sans">
            <span>
              © {new Date().getFullYear()} {isEn ? "Al-Adalah Intelligent Solutions Co. All rights reserved." : "جميع الحقوق محفوظة لمنصة العدالة لإدارة مكاتب المحاماة."}
            </span>
            <div className="flex gap-4">
              <span>{isEn ? "Privacy Shield Document" : "وثيقة السرية وحماية بيانات الفروع"}</span>
              <span>•</span>
              <span>{isEn ? "Terms & Disclaimers" : "شروط الاستخدام وتأمين الأسرار"}</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
