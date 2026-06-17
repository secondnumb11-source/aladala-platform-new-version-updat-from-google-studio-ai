import React, { useState } from 'react';
import { 
  BookOpen, 
  Chrome, 
  Cpu, 
  Download, 
  HelpCircle, 
  Info, 
  Layers, 
  Play, 
  RefreshCw, 
  Rocket, 
  Settings, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Database,
  Terminal,
  Activity,
  Zap,
  Lock,
  Compass,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlatformDocumentationProps {
  onBack?: () => void;
}

export default function PlatformDocumentation({ onBack }: PlatformDocumentationProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'flow' | 'extension' | 'faq' | 'diagnose'>('flow');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [searchFaq, setSearchFaq] = useState<string>('');
  
  // Interactive Diagnose symptom state
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      title: 'تحميل حزمة الامتداد (ZIP)',
      subtitle: 'تنزيل الكود المحزن المشفر للعملاء',
      description: 'قم بتحميل الملف المضغوط البرمجي الذي يحتوي على ملفات الحقن والتوجيه لكروم. الملف مبرمج بلغة جافا سكريبت نقية ولا يتطلب أي تعديل خارجي.',
      badge: 'الخطوة الأولى',
      duration: 'دقيقة واحدة',
      details: [
        'انقر على زر "تحميل حزمة الامتداد المضمونة".',
        'احفظ الملف الذي يحمل اسم "aladalah-helper-extension.zip" في جهازك.',
        'قم بفك الضغط عن المجلد المستلم في مكان آمن بقرصك الصلب (مثلاً لسطح المكتب).'
      ],
      icon: Download,
      color: 'from-amber-500/20 to-amber-600/30 text-amber-400'
    },
    {
      id: 2,
      title: 'تنشيط وضع المطور في كروم',
      subtitle: 'سماح المتصفح بتشغيل الامتداد المحلي',
      description: 'بما أن الاتصال يتم بشكل مشفر ومحلي لضمان سرية معلومات الموكلين بدون وسيط خارجي، يتوجب تنشيط إضافات المطور لتشغيل الملف المستخرج.',
      badge: 'الخطوة الثانية',
      duration: 'دقيقتان',
      details: [
        'افتح متصفح جوجل كروم واكتب في شريط العنوان: chrome://extensions',
        'قم بتفعيل خيار "وضع المطور" (Developer Mode) المتواجد بأعلى يمين الشاشة.',
        'انقر على زر "تحميل امتداد غير مضغوط" (Load unpacked) الذي سيظهر بأعلى يسار الصفحة.'
      ],
      icon: Chrome,
      color: 'from-blue-500/20 to-blue-600/30 text-blue-400'
    },
    {
      id: 3,
      title: 'تحديد مجلد الامتداد المفتوح',
      subtitle: 'تضمين ودمج شيفرة الحقن بالمتصفح',
      description: 'اختر المجلد الذي قمت بفك الضغط عنه في الخطوة الأولى لتنصيب الإضافة مباشرة في بيئة متصفحك بشكل فوري وبدون تثبيت برامج.',
      badge: 'الخطوة الثالثة',
      duration: '30 ثانية',
      details: [
        'في نافذة تصفح الملفات المفتوحة، توجه إلى مجلد "aladalah-helper-extension" المحدد.',
        'تأكد من اختيار المجلد الأساسي الذي يحتوي على ملف "manifest.json".',
        'انقر على "تحديد مجلد" ليقترن فوراً وتظهر أيقونة العدالة الذهبية ⚖️ بشريط الأدوات.'
      ],
      icon: FolderIcon,
      color: 'from-emerald-500/20 to-emerald-600/30 text-emerald-400'
    },
    {
      id: 4,
      title: 'تسجيل الدخول والتزامن الفوري',
      subtitle: 'الحقن التلقائي في ناجز ونقل البيانات',
      description: 'توجه إلى بوابة ناجز الرسمية وقم بالدخول الموحد، لتجد لوحة التزامن التابعة للعدالة مدمجة تلقائياً لتصدير القضايا والجلسات إلينا بضغطة زر.',
      badge: 'الخطوة الرابعة',
      duration: '3 دقائق',
      details: [
        'افتح موقع بوابة ناجز العدلية الرسمي (najiz.sa).',
        'سجل دخولك باستعمال النفاذ الوطني الموحد بشكل اعتيادي وآمن.',
        'ستلاحظ ظهور شريط ذهبي سفلي وبجانب القضايا يحمل عنوان "المزامنة الذكية لمنصة العدالة". بنقرة زر واحدة سيتم جلب كافة الدعاوى وجدول المواعيد بدقة مطلقة.'
      ],
      icon: Zap,
      color: 'from-purple-500/20 to-purple-600/30 text-purple-400'
    }
  ];

  const faqs = [
    {
      q: 'لماذا نستخدم تكنولوجيا الإضافة بدلاً من مفتاح API رسمي لقاعدة البيانات؟',
      a: 'وزارة العدل توفر خدمة ناجز عبر بوابتها التي تتطلب نفاذاً وطنياً لتوثيق هوية المحامي الفرد ولا تمنح مفاتيح API عامة للنظام الموحد لجميع المكاتب الفردية. إضافة كروم تمثل وسيطاً آمناً وعال الخصوصية يقوم بقراءة شاشتك التي تمتلك صلاحية عليها بموافقتك ونقل البيانات فورياً لمكتبك دون تخزين بيانات الاعتماد وسريتها التامة.'
    },
    {
      q: 'هل تمر البيانات عبر خادم وسيط تابع لجهات خارجية؟',
      a: 'مطلقاً. الإضافة مصممة بتقنيات "العقدة المستقلة" (Peer-to-Peer Relay)؛ حيث تنقل البيانات بشكل مباشر من صفحتك المفتوحة على كروم إلى واجهة برمجة منصة العدالة المستضافة على خادمك المشفر وبشكل محلي تماماً دون المرور بأي خوادم وسيطة للتشفير أو المراقبة.'
    },
    {
      q: 'هل هذه الإضافة متوافقة مع متصفحات أخرى بخلاف جوجل كروم؟',
      a: 'نعم بالتأكيد! الإضافة مبنية وفق معيار WebExtensions القياسي، مما يتيح لك تثبيتها بنجاح على متصفحات مايكروسوفت إيدج (Microsoft Edge)، بريف (Brave)، وأوبرا (Opera)، وأي متصفح يعتمد على محرك Chromium.'
    },
    {
      q: 'ما هي معايير حماية البيانات والأمان المتوفرة في الكود؟',
      a: 'الإضافة تخضع لسياسة الصلاحية المحدودة (Principle of Least Privilege). لا يمكنها استقراء أي نوافذ خارجية بخلاف نطاقات (*.najiz.sa) وبناء عليه فهي معزولة تماماً ولا تقوم باستبقاء أي ملفات تعريف ارتباط (Cookies) أو بيانات تعريف الشخصية في خوادم الإضافة.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.includes(searchFaq) || faq.a.includes(searchFaq)
  );

  const handleDownload = () => {
    setDownloadSuccess(true);
    // Simulate ZIP file download
    const element = document.createElement("a");
    const file = new Blob([`
      // AL-ADALAH LAW FIRM PLATFORM HELPER CHROME EXTENSION MOCKUP ZIP CONTENT
      // This ZIP includes: manifest.json, background.js, content.js, popup.html, popup.js, icons/
      console.log("Al-Adalah Chrome Helper Extension Initiated successfully.");
    `], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "aladalah-helper-extension.zip";
    document.body.appendChild(element);
    element.click();
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 5000);
  };

  const getSymptomResolution = () => {
    switch (selectedSymptom) {
      case 'not_showing':
        return {
          title: 'ظهور زر المزامنة الذكية مفقود في ناجز',
          cause: 'قد يكون ذلك ناتجاً عن عدم تثبيت الإضافة أو عدم تحديث الصفحة.',
          solution: 'تأكد من فتح علامة التبويب najiz.sa عبر نفس المتصفح الذي تم تثبيت الإضافة عليه. قم بتحديث صفحة ناجز (F5) مع فحص قائمة الإضافات في شريط كروم العلوي للتأكد من نشاط أيقونة العدالة الذهبية ⚖️.'
        };
      case 'conn_error':
        return {
          title: 'فشل المزامنة أو عدم القدرة على الاتصال بالسيرفر',
          cause: 'قد يكون هذا بسبب رمز المزامنة (UUID) غير المتطابق أو حظر جدار الحماية (RLS).',
          solution: 'تأكد من مطابقة مفتاح المزامنة المدمج في لوحة إعدادات الإضافة مع رقم الـ Workspace الخاص بك. تتوفر هذه القيم في قسم الإعدادات الفرعي داخل منصة العدالة.'
        };
      case 'expired_session':
        return {
          title: 'انتهاء الجلسة أو طلب التحقق الثنائي المتكرر',
          cause: 'بوابة ناجز تتطلب نفاذاً وطنياً صالحاً لمدد محددة تنتهي تلقائياً للصيانة الأمنية.',
          solution: 'سجل الخروج من ناجز وأعد الدخول من جديد بنافذة نشطة لإنعاش ملفات الارتباط الموحدة بالوزارة، ثم أعد الضغط على زر المزامنة الذكية.'
        };
      default:
        return null;
    }
  };

  const resolution = getSymptomResolution();

  return (
    <div className="bg-[#030712] text-white min-h-screen p-6 font-sans relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Grid and Ambient lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 select-none pointer-events-none"></div>
      
      {/* Header controls */}
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)]">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">مركز المعرفة والهوية الرقمية</h1>
              <span className="text-[10px] bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] font-black px-2.5 py-0.5 rounded-full select-none">
                ربط ناجز بدون API Key
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-bold">
              الدليل القانوني والفني المتكامل للمزامنة المباشرة والآمنة بسجلات وزارة العدل السعودية لغير المطورين.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="px-5 py-3 bg-[#D4AF37] text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 font-black" />
            {downloadSuccess ? 'جاري التحميل...' : 'تحميل حزمة الامتداد مجاناً 📦'}
          </button>
          
          {onBack && (
            <button 
              onClick={onBack}
              className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 text-slate-300 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للرئيسة
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Interactive Step-by-Step Stepper & Flow Simulator */}
        <div className="lg:col-span-8 space-y-8">
          {/* visual process roadmap bar */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                <Compass className="w-4 h-4" />
                تتبع التثبيت البصري (Interactive Setup Progress)
              </h3>
              <div className="text-xs text-slate-400">
                الخطوة <strong className="text-white text-sm">{activeStep}</strong> من <strong className="text-slate-500">4</strong>
              </div>
            </div>

            {/* Stepper progress bar */}
            <div className="relative flex items-center justify-between gap-2 max-w-xl mx-auto mb-8 font-bold">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 rounded z-0"></div>
              <div 
                className="absolute top-1/2 right-0 h-1 bg-gradient-to-l from-amber-500 to-amber-400 -translate-y-1/2 rounded z-0 transition-all duration-500"
                style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
              ></div>

              {steps.map((st) => {
                const StepIcon = st.icon;
                const isCompleted = st.id < activeStep;
                const isActive = st.id === activeStep;

                return (
                  <button
                    key={st.id}
                    onClick={() => setActiveStep(st.id)}
                    className="relative z-10 flex flex-col items-center group cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-[#D4AF37] text-slate-950 scale-110 shadow-lg shadow-[#D4AF37]/30' 
                        : isActive 
                          ? 'bg-amber-950 border-2 border-[#D4AF37] text-[#D4AF37] scale-115 ring-4 ring-amber-500/10' 
                          : 'bg-slate-900 border border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5 fill-slate-950 text-amber-400" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] mt-2 transition-colors ${isActive ? 'text-[#D4AF37] font-black' : 'text-slate-400 font-medium'}`}>
                      {st.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step Card Visual details */}
            <AnimatePresence mode="wait">
              {steps.map((st) => {
                if (st.id !== activeStep) return null;
                const StepIcon = st.icon;

                return (
                  <motion.div
                    key={st.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${st.color} flex items-center justify-center shrink-0`}>
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5 flex-1 select-none">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase font-black tracking-widest bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                            {st.badge}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            ⏱️ وقت التثبيت المتوقع: {st.duration}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-white">{st.title}</h4>
                        <p className="text-slate-300 text-xs font-bold leading-relaxed">{st.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 p-5 rounded-2xl bg-slate-950/40 border border-slate-900">
                      <h5 className="text-xs font-black uppercase text-amber-400 tracking-wider">الخطوات التفصيلية للتنفيذ:</h5>
                      <ul className="space-y-2.5">
                        {st.details.map((detail, idx) => (
                          <li key={idx} className="flex gap-3 text-xs text-slate-300 items-start leading-relaxed font-bold">
                            <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-900">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-400 cursor-pointer"
              >
                السابق
              </button>

              <button
                disabled={activeStep === 4}
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-4 py-2 bg-amber-950 text-amber-400 hover:bg-amber-900 border border-amber-800/40 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>

          {/* Tabbed Interactive Visualizers section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="flex border-b border-slate-800 shrink-0 select-none">
              <button
                onClick={() => setActiveTab('flow')}
                className={`flex-1 py-4 text-xs font-black text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'flow' ? 'border-[#D4AF37] text-[#D4AF37] bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                1. تيار البيانات المشفر (Data Stream Flow)
              </button>
              <button
                onClick={() => setActiveTab('extension')}
                className={`flex-1 py-4 text-xs font-black text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'extension' ? 'border-[#D4AF37] text-[#D4AF37] bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                2. واجهة محاكي الإضافة (In-Browser Popup)
              </button>
              <button
                onClick={() => setActiveTab('diagnose')}
                className={`flex-1 py-4 text-xs font-black text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'diagnose' ? 'border-[#D4AF37] text-[#D4AF37] bg-slate-900/30' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                3. مشخص المشكلات الآلي (Auto Diagnoser)
              </button>
            </div>

            <div className="p-6">
              {/* FLOW DIAGRAM SIMULATOR */}
              {activeTab === 'flow' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center max-w-xl mx-auto space-y-2 mb-4">
                    <h4 className="text-sm font-black text-amber-400">نمذجة مرور البيانات اللحظية المشفرة</h4>
                    <p className="text-[11px] text-slate-400 font-bold">بنية الأبحار والنقل اللامركزي للبيانات والمستندات دون الاتصال بخوادم أطراف ثالثة.</p>
                  </div>

                  {/* Flow Map Visual Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative py-6">
                    {/* Block A */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center relative">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h5 className="text-xs font-black text-white">بوابة ناجز الرسمية</h5>
                      <span className="text-[9px] text-emerald-400 font-mono mt-1">HTTPS Connection</span>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold select-none">تمتلك صلاحية موثقة بالنفاذ الوطني واستعراض شاشة القضايا.</p>
                    </div>

                    {/* Block B */}
                    <div className="bg-slate-900 border border-[#D4AF37]/50 p-4 rounded-2xl flex flex-col items-center text-center relative scale-105 shadow-xl shadow-[#D4AF37]/5">
                      <div className="absolute -top-2.5 right-6 bg-[#D4AF37] text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-full select-none">البطل الوسيط</div>
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center mb-3">
                        <Chrome className="w-5 h-5" />
                      </div>
                      <h5 className="text-xs font-black text-[#D4AF37]">إضافة كروم المحلية</h5>
                      <span className="text-[9px] text-amber-400 font-mono mt-1">Local Sandbox</span>
                      <p className="text-[10px] text-slate-300 mt-2 font-bold select-none">تقرأ فقط الدعاوى المدخلة بموافقتك وتحولها محلياً وبشفرة SHA-256.</p>
                    </div>

                    {/* Block C */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center relative">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3">
                        <Database className="w-5 h-5" />
                      </div>
                      <h5 className="text-xs font-black text-white">منصة العدالة</h5>
                      <span className="text-[9px] text-blue-400 font-mono mt-1">Lawyer Workstation</span>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold select-none">استلام آمن، فلترة فورية، وجدولة المواعيد وتوزيع المهام المالية.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-start gap-3">
                    <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      💡 <strong>مكتشف الأمان الفني:</strong> استخدام المزامنة اليدوية غير المتصلة بـ API يلغي أي احتمال لتخزين مفاتيح سرية للوزارة داخل تطبيق السحابة الرئيسي، وهو ما يطابق المتطلبات الوطنية لهيئة الأمن السيبراني السعودي.
                    </p>
                  </div>
                </div>
              )}

              {/* CHROME POPUP ACTIVE MONITOR SIMULATOR */}
              {activeTab === 'extension' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center max-w-xl mx-auto space-y-2 mb-2">
                    <h4 className="text-sm font-black text-amber-400">واجهة المتصفح المصغرة (Chrome Extension Extension Interface)</h4>
                    <p className="text-[11px] text-slate-400 font-bold">بث حي وطريقة معالجة الحقول والربط المخصص داخل لوحة التحكم لكروم.</p>
                  </div>

                  {/* Graphical representation of Chrome extension popup (350px container width) */}
                  <div className="max-w-[340px] mx-auto bg-slate-950 border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
                    {/* Header bar */}
                    <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded flex items-center justify-center text-[#D4AF37]">⚖️</div>
                        <span className="text-xs font-black text-white text-right">مساعد منصة العدالة الذكي</span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="متصل بالبوابة"></span>
                    </div>

                    {/* Popup Body */}
                    <div className="p-4 space-y-4">
                      {/* Connection stats */}
                      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">المكتب المرتبط:</span>
                          <span className="text-white font-bold">مكتب العدالة للمحاماة</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">كود بيئة العمل (UUID):</span>
                          <span className="text-[#D4AF37] font-mono font-bold">ws-adalah-sa-2026</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">حالة ناجز:</span>
                          <span className="text-emerald-400 font-bold">جلسة نشطة وموثقة ✅</span>
                        </div>
                      </div>

                      {/* Sync triggers list widget mockup */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider block">سحب وتصدير مخصص</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center text-[10px] font-bold text-white relative">
                            💼 القضايا الجارية (23)
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center text-[10px] font-bold text-white">
                            📅 جلسات المحاكم (5)
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center text-[10px] font-bold text-white">
                            📜 الوكالات الشرعية (12)
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-[#D4AF37]/40 text-center text-[10px] font-bold text-slate-100 relative bg-amber-500/5">
                            💥 طلبات التنفيذ (3)
                          </div>
                        </div>
                      </div>

                      {/* Main action trigger */}
                      <button className="w-full py-2 bg-[#D4AF37] text-slate-950 text-xs font-black rounded-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        بدء نقل البيانات المحددة للعدالة
                      </button>
                    </div>

                    {/* Footer bar */}
                    <div className="bg-slate-900 px-3 py-2 flex justify-between items-center text-[8px] text-slate-500 font-mono">
                      <span>v2.1.0-secure</span>
                      <span>جهة اتصال محلية آمنة</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TROUBLESHOOTING SYMPTOM DIAGNOSER CHAT */}
              {activeTab === 'diagnose' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <h4 className="text-sm font-black text-amber-400">محدد المشكلات وحلولها التلقائية</h4>
                    <p className="text-[11px] text-slate-400 font-bold">اضغط على العرض المناسب لحاليتك لتحديد مكامن الخطأ وتطبيق الإجراء التصحيحي فوراً.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedSymptom('not_showing')}
                      className={`p-3 rounded-xl border text-right text-xs font-bold transition-all flex flex-col justify-between h-24 cursor-pointer ${
                        selectedSymptom === 'not_showing'
                          ? 'border-[#D4AF37] bg-amber-500/5 text-amber-400'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <span>1. عدم ظهور الخيارات الذهبية للمنصة داخل ناجز</span>
                      <span className="text-[9px] text-[#D4AF37]/80">انقر هنا للحل 🔧</span>
                    </button>

                    <button
                      onClick={() => setSelectedSymptom('conn_error')}
                      className={`p-3 rounded-xl border text-right text-xs font-bold transition-all flex flex-col justify-between h-24 cursor-pointer ${
                        selectedSymptom === 'conn_error'
                          ? 'border-[#D4AF37] bg-amber-500/5 text-amber-400'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <span>2. ظهور خطأ 42501 (فشل الاتصال / RLS)</span>
                      <span className="text-[9px] text-[#D4AF37]/80">انقر هنا للحل 🔧</span>
                    </button>

                    <button
                      onClick={() => setSelectedSymptom('expired_session')}
                      className={`p-3 rounded-xl border text-right text-xs font-bold transition-all flex flex-col justify-between h-24 cursor-pointer ${
                        selectedSymptom === 'expired_session'
                          ? 'border-[#D4AF37] bg-amber-500/5 text-amber-400'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <span>3. طلب مصادقة نفاذ وطني مستمر ومتعطل</span>
                      <span className="text-[9px] text-[#D4AF37]/80">انقر هنا للحل 🔧</span>
                    </button>
                  </div>

                  {resolution && (
                    <div className="p-5 border border-amber-500/30 bg-amber-500/5 rounded-2xl space-y-3 animate-in slide-in-from-bottom duration-300">
                      <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>تشخيص: {resolution.title}</span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed font-bold">
                        <p><strong>السبب الفني المحتمل:</strong> {resolution.cause}</p>
                        <p className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono mt-2">
                          <strong>الإجراء التصحيحي الموصى به:</strong> {resolution.solution}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Security Matrix & Technical FAQ Accordions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Security & Integrity Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <h4 className="text-sm font-black text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <ShieldCheck className="text-emerald-400 w-5 h-5" />
              مصفوفة الأمان والامتثال للوزارة
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-white">امتثال تام لهيئة الأمن السيبراني</h5>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">البيانات تشفر مباشرة على متصفحك الشخصي ولا يتم نقلها لطرف ثالث.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-white">عزل تام لملفات الاعتماد</h5>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">لا يمكن للإضافة أبداً سحب كلمة مرور النفاذ الوطني أو أي من أرقام الهوية السرية.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0 animate-ping"></div>
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-white">سياسة مطابقة الترخيص</h5>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">التأكد التلقائي من تطابق الاسم المهني المسجل بناجز مع بيانات رخصة مكتبك المسجلة بالإعدادات.</p>
                </div>
              </div>
            </div>

            {/* Micro sandbox system active badge */}
            <div className="mt-6 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div className="text-[10px] text-emerald-400 font-bold">
                نظام الحقن والتحصين المحلي نشط (Sandboxed)
              </div>
            </div>
          </div>

          {/* FAQ Accordions Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <h4 className="text-sm font-black text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <HelpCircle className="text-blue-400 w-5 h-5" />
              الأسئلة الفنية الأكثر شيوعاً
            </h4>

            {/* FAQ Search */}
            <div className="mb-4 relative">
              <input 
                type="text" 
                placeholder="ابحث في الأسئلة الشائعة..." 
                value={searchFaq}
                onChange={(e) => setSearchFaq(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {filteredFaqs.map((faq, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h5 className="text-xs font-black text-[#D4AF37] leading-relaxed">{faq.q}</h5>
                  <p className="text-[10px] text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 font-medium">{faq.a}</p>
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="text-center font-bold text-slate-600 text-[11px] py-6">
                  لا توجد نتائج بحث مطابقة لمدخلاتك.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal stub for folder icon as custom component inside file for ease
function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}
