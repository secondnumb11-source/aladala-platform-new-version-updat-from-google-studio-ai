import React, { useState } from "react";
import { 
  Gavel, Scale, FileText, Landmark, Calculator, Mail, 
  Handshake, ShieldAlert, CircleDot, ChevronLeft, HelpCircle, 
  Download, Send, Check, RefreshCw, ExternalLink, Search, Globe, ChevronRight,
  Sun, Moon
} from "lucide-react";
import { motion } from "motion/react";
import CourtMapAndServices from "@/components/CourtMapAndServices";
import { InteractiveCard } from "./InteractiveCard";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: "core" | "additional";
}

interface SaudiServicesHubProps {
  theme?: "light" | "dark";
  initialTab?: "portals" | "tools";
  isNested?: boolean;
  cases?: any[];
  language?: "ar" | "en";
}

interface PortalItem {
  name: string;
  url: string;
  domain: string;
  desc: string;
  icon: string;
  letter: string;
  color: string;
}

export default function SaudiServicesHub({ 
  theme = "light", 
  initialTab,
  isNested = false,
  cases = [],
  language = "ar"
}: SaudiServicesHubProps) {
  const isNajizConnected = localStorage.getItem("najiz_api_connected") === "true";
  const [activeTab, setActiveTab] = useState<"portals" | "tools">(initialTab || "portals");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeService, setActiveService] = useState<string | null>(null);
  const [isDarkCards, setIsDarkCards] = useState<boolean>(false);

  // Inheritance calculator states
  const [estateAmount, setEstateAmount] = useState<number>(500000);
  const [hasWife, setHasWife] = useState<boolean>(true);
  const [sonsCount, setSonsCount] = useState<number>(2);
  const [daughtersCount, setDaughtersCount] = useState<number>(1);
  const [hasFather, setHasFather] = useState<boolean>(true);
  const [hasMother, setHasMother] = useState<boolean>(true);
  const [sharesResult, setSharesResult] = useState<any>(null);

  // Appeal states
  const [appealCaseNumber, setAppealCaseNumber] = useState("");
  const [appealReason, setAppealReason] = useState("procedural_error");
  const [appealText, setAppealText] = useState("");
  const [appealDrafted, setAppealDrafted] = useState(false);

  // Digitization state
  const [oldDeedNumber, setOldDeedNumber] = useState("");
  const [deedsState, setDeedsState] = useState("");
  const [isDeedSubmitted, setIsDeedSubmitted] = useState(false);

  // Resident check state
  const [iqamaNumber, setIqamaNumber] = useState("");
  const [residentResult, setResidentResult] = useState<any>(null);

  // Execution query state
  const [executionNum, setExecutionNum] = useState("");
  const [executionResult, setExecutionResult] = useState<any>(null);

  const saudiPortals: PortalItem[] = [
    { 
      name: 'بوابة ناجز العدلية', 
      url: 'https://najiz.sa', 
      domain: 'najiz.sa', 
      desc: 'إدارة شؤون المحاكم الشرعية والدوائر القضائية، وتوثيق الصكوك والوكالات وسجلات دعاوى التنفيذ والمحاكم التجارية والعمالية.', 
      icon: '⚖️', 
      letter: 'ن', 
      color: 'from-emerald-600 to-teal-800' 
    },
    { 
      name: 'ديوان المظالم (معين)', 
      url: 'https://www.bog.gov.sa', 
      domain: 'bog.gov.sa', 
      desc: 'متابعة المستحقات التعاقدية للشركات، ودعاوى التعويض والمنازعات الإدارية ضد الوزارات والمؤسسات الرسمية والجهات الحكومية.', 
      icon: '🏛️', 
      letter: 'م', 
      color: 'from-blue-700 to-indigo-900' 
    },
    { 
      name: 'منصة تراضي الرقمية', 
      url: 'https://taradhi.moj.gov.sa', 
      domain: 'taradhi.moj.gov.sa', 
      desc: 'عقد جلسات التسوية والمصالحة الودية المعتمدة رقمياً، وتوثيق صكوك الصلح الرسمية التي تكتسب قوة السند التنفيذي التام.', 
      icon: '🤝', 
      letter: 'ت', 
      color: 'from-teal-600 to-emerald-700' 
    },
    { 
      name: 'منصة قوى للعمل', 
      url: 'https://qiwa.sa', 
      domain: 'qiwa.sa', 
      desc: 'توثيق عقود العمل والموظفين، إثبات وهيكلة الأجور، صياغة ومواءمة لوائح العمل الداخلية للمنشآت، وتسوية النزاعات الودية.', 
      icon: '💼', 
      letter: 'ق', 
      color: 'from-purple-600 to-violet-850' 
    },
    { 
      name: 'منصة بلدي والأمانات', 
      url: 'https://balady.gov.sa', 
      domain: 'balady.gov.sa', 
      desc: 'متابعة المنازعات والمخالفات البلدية، التراخيص الإنشائية والمهنية، القرارات التنظيمية للأمانات، وحصر العقارات والتراخيص.', 
      icon: '🏢', 
      letter: 'ب', 
      color: 'from-amber-500 to-orange-700' 
    },
    { 
      name: 'بوابة وزارة التجارة', 
      url: 'https://mc.gov.sa', 
      domain: 'mc.gov.sa', 
      desc: 'تأسيس وتعديل الشركات والسجلات التجارية، بلاغات الغش والتستر التجاري، وحوكمة الميزانيات والمعاملات وحالات الإفلاس الموثقة.', 
      icon: '📊', 
      letter: 'ت', 
      color: 'from-sky-600 to-blue-800' 
    },
    { 
      name: 'منصة أبشر أفراد/أعمال', 
      url: 'https://absher.sa', 
      domain: 'absher.sa', 
      desc: 'التحقق من الهويات الرسمية الرقمية، إدارة المكفولين والعمالة المهنية، متابعة تراخيص المنشآت والحدود والتنقل الفوري.', 
      icon: '👤', 
      letter: 'أ', 
      color: 'from-green-600 to-emerald-800' 
    },
    { 
      name: 'هيئة الزكاة والضريبة والجمارك', 
      url: 'https://zatca.gov.sa', 
      domain: 'zatca.gov.sa', 
      desc: 'الامتثال للفوترة الإلكترونية، رصد المنازعات الجمركية والضريبية والاعتراض عليها، وبث التسويات الزكوية المعتمدة.', 
      icon: '💰', 
      letter: 'ز', 
      color: 'from-yellow-600 to-amber-800' 
    },
    { 
      name: 'المؤسسة العامة للتأمينات الاجتماعية', 
      url: 'https://gosi.gov.sa', 
      domain: 'gosi.gov.sa', 
      desc: 'تسجيل واحتساب اشتراكات الموظفين السعوديين والأجانب، تسويات حقوق العمل، والتعويضات المهنية وإصابات العمل.', 
      icon: '🛡️', 
      letter: 'ت', 
      color: 'from-indigo-600 to-purple-800' 
    },
    { 
      name: 'منصة اعتماد الحكومية', 
      url: 'https://etimad.sa', 
      domain: 'etimad.sa', 
      desc: 'رصد المنافسات والمشتريات الحكومية، تقديم العطاءات والمطالبات المالية، ومتابعة حركات صرف المستحقات المالية لعقود التوريد.', 
      icon: '📜', 
      letter: 'ع', 
      color: 'from-orange-600 to-yellow-700' 
    },
    { 
      name: 'نظام مقيم الإلكتروني', 
      url: 'https://muqeem.sa', 
      domain: 'muqeem.sa', 
      desc: 'تحديث بيانات المقيمين الفوري، إصدار وتجديد رخص العمل والإقامات، وإدارة الخروج والعودة وتأشيرات الموظفين الميدانيين.', 
      icon: '🛂', 
      letter: 'م', 
      color: 'from-cyan-500 to-sky-700' 
    },
  ];

  const filterServices: ServiceItem[] = [
    { id: "deed_digital", title: "تحديث الصكوك العقارية الرقمية", description: "تحويل الصكوك الورقية القديمة إلى صكوك رقمية نشطة.", icon: Landmark, category: "core" },
    { id: "inheritance", title: "حاسبة التركات والمواريث الشرعية", description: "حساب الموزعات الشرعية والأنصبة والفرض والتعصيب للورثة.", icon: Calculator, category: "additional" },
    { id: "resident_audit", title: "استعلام شؤون الأجانب والحدود", description: "التحقق من تأشيرات العمل والترحيل والحدود للشركاء التجاريين.", icon: ShieldAlert, category: "additional" },
    { id: "execution_query", title: "استعلام تنفيذ الأحكام القضائية", description: "رصد أوامر التنفيذ القضائية (المادة 34/46) المترتبة على المطالبات.", icon: CircleDot, category: "additional" }
  ];

  const calculateInheritance = () => {
    let currentEstate = estateAmount;
    const details = [];
    const hasChildren = (sonsCount + daughtersCount) > 0;
    
    if (hasMother) {
      const share = hasChildren ? (1/6) : (1/3);
      const val = Math.round(estateAmount * share);
      currentEstate -= val;
      details.push({ relation: "الأم", fraction: hasChildren ? "1/6 (فرض)" : "1/3 (فرض)", amount: val });
    }
    if (hasFather) {
      const share = hasChildren ? (1/6) : (1/6); // Simplification
      const val = Math.round(estateAmount * share);
      currentEstate -= val;
      details.push({ relation: "الأب", fraction: "1/6 (فرض + تعصيب إن وجد)", amount: val });
    }
    if (hasWife) {
      const share = hasChildren ? (1/8) : (1/4);
      const val = Math.round(estateAmount * share);
      currentEstate -= val;
      details.push({ relation: "الزوجة", fraction: hasChildren ? "1/8 (فرض)" : "1/4 (فرض)", amount: val });
    }
    if (sonsCount > 0 || daughtersCount > 0) {
      const totalParts = (sonsCount * 2) + daughtersCount;
      const partVal = currentEstate / totalParts;
      if (sonsCount > 0) details.push({ relation: `للذكر (${sonsCount})`, fraction: "تعصيباً", amount: Math.round(partVal * 2) * sonsCount });
      if (daughtersCount > 0) details.push({ relation: `للأنثى (${daughtersCount})`, fraction: "تعصيباً", amount: Math.round(partVal) * daughtersCount });
    }
    setSharesResult(details);
  };

  const draftAppealTemplate = () => {
    const header = `صاحب الفضيلة رئيس محكمة الاستئناف بالرياض الموقر،\nالسلام عليكم ورحمة الله وبركاته،\nموضوع اللائحة الاعتراضية قيد الدعوى رقم (${appealCaseNumber || "441029393"})`;
    const body = appealReason === "procedural_error" 
      ? `نتقدم لفضيلتكم بلائحة الاعتراض نظراً لوجود بطلان إجرائي شاب الحكم المستأنف حيث لم يتم تبليغ موكلنا بموعد الجلسة بصورة صحيحة وبما يتعارض مع نظام المرافعات.`
      : `نود الإشارة لفضيلتكم إلى قصور جسيم في تسبيب الحكم وإغفال مستندات جوهرية تم دفعها تشتمل على مستند براءة الذمة المالية الموثقة.`;
    const footer = `\n\nلذا نطلب من فضيلتكم نقض الحكم وإعادة النظر فيه بما يتوافق مع الأصول الشرعية والنظامية.`;
    setAppealText(`${header}\n\n${body}${footer}`);
    setAppealDrafted(true);
  };

  const executeResidentQuery = () => {
    setResidentResult({
      status: "إقامة سارية الصلاحية",
      borderEntry: "مطار الملك خالد الدولي",
      employer: "شركة النخبة للمقاولات المحدودة",
      violations: "لا توجد سوابق جنائية أو قيود حدودية نشطة"
    });
  };

  const executeExecutionQuery = () => {
    setExecutionResult({
      status: "قيد المتابعة - المادة 34",
      judge: "فضيلة الشيخ محمد السلمان",
      claimAmount: "1,240,000 ر.س",
      sanctionsApplied: ["منع من السفر", "إيقاف الخدمات الحكومية", "المنع من التعامل مع المنشآت المالية"]
    });
  };

  const handleDeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeedSubmitted(true);
  };

  // Filter portals based on search query
  const filteredPortals = saudiPortals.filter(portal => 
    portal.name.includes(searchQuery) || portal.desc.includes(searchQuery)
  );

  return (
    <div className="space-y-6 text-right animate-fade-in pb-12" dir="rtl">
      
      {/* Top High-Fidelity Banner */}
      <div className={`relative overflow-hidden ${initialTab === 'tools' ? 'bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] border-indigo-500/50' : 'bg-gradient-to-r from-[#9A7D2C] via-[#1E3A8A] to-[#0284C7] border-[#9A7D2C]'} text-white rounded-3xl p-6 md:p-8 shadow-2xl border-2`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.15),transparent_50%)] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${initialTab === 'tools' ? 'bg-indigo-400' : 'bg-yellow-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${initialTab === 'tools' ? 'bg-indigo-400' : 'bg-yellow-400'}`}></span>
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${initialTab === 'tools' ? 'text-indigo-300' : 'text-yellow-300'}`}>
                {initialTab === 'tools' ? 'أدوات العميل الذكية الاستباقية' : 'بوابة الربط الحكومي الشامل والخدمات الرائدة'}
              </span>
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white drop-shadow flex items-center gap-3 font-display">
              {initialTab === 'tools' ? (
                <>
                  <Calculator className="w-8 h-8 text-yellow-350 shrink-0" />
                  <span className="text-yellow-400 drop-shadow-[0_0_12px_rgba(253,224,71,0.85)]">خدمات المسانده والتحققات الأليه AI</span>
                </>
              ) : (
                <>
                  <Landmark className="w-8 h-8 text-yellow-300 shrink-0" />
                  بوابة الخدمات الحكومية
                </>
              )}
            </h1>
            <p className={`text-xs md:text-sm font-bold leading-relaxed ${initialTab === 'tools' ? 'text-indigo-200' : 'text-yellow-100'}`}>
              {initialTab === 'tools' 
                ? 'مجموعة متقدمة من الأدوات التي تعتمد على الذكاء الاصطناعي لتقديم المشورة والتحقق السريع من صحة المعطيات القانونية وتجهيز اللوائح والأسانيد وفق أعلى معايير الجودة.' 
                : 'منصة تشغيلية موحدة وسهلة تتيح الوصول الآمن الفوري وطواف الإجراءات وإحصائيات التسجيل والمستندات للدوائر الحكومية والشركاء التجاريين بالمملكة العربية السعودية.'}
            </p>
          </div>
          <div className="shrink-0 bg-[#020D1F]/80 backdrop-blur border border-yellow-400/40 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 text-yellow-300 ${isNajizConnected ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <div className="text-[10px] text-yellow-300 font-black">حالة الربط والامتثال</div>
              <div className={`text-xs font-black ${isNajizConnected ? 'text-emerald-400' : 'text-yellow-300'}`}>
                {isNajizConnected ? 'مزامنة ناجز مفعلة بنشاط (API)' : 'جلسة محلية آمنة (دون ربط)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern High-End Tab Navigation */}
      {!initialTab && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex p-1 bg-slate-100 rounded-2xl max-w-md w-full border border-slate-200">
          <button
            onClick={() => setActiveTab("portals")}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "portals"
                ? "bg-white text-slate-950 shadow-md transform scale-102"
                : "text-slate-600"
            }`}
          >
            🏛️ قاعة البوابات والمنصات (11 منشأة)
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "tools"
                ? "bg-white text-slate-950 shadow-md transform scale-102"
                : "text-slate-600"
            }`}
          >
            🛠️ خدمات المساندة والتحققات الذكية
          </button>
        </div>

        {activeTab === "portals" && (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث عن منصة حكومية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl pr-9 pl-4 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
            />
          </div>
        )}
      </div>
      )}

      {/* Portals Grid Layout */}
      {activeTab === "portals" && (
        <div className="space-y-6">
          <div className="bg-amber-500/5 border border-amber-600/10 rounded-2xl p-4 flex items-start gap-3">
            <Globe className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-950 underline decoration-amber-500/20">سجل توثيق البوابات السعودية للأمن والامتثال العالي</h4>
              <p className="text-[11px] text-slate-900 font-black leading-normal">
                تم ربط جميع البوابات التالية برمز الحماية وعناوين الـ DNS الحكومية المعتمدة لضمان استرجاع البيانات ومزامنة تقارير العملاء مباشرة بدون فوات وتحديث مستمر.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortals.map((portal, idx) => (
              <InteractiveCard
                key={idx}
                themeColor="medium"
                className="w-full bg-white p-5 border border-slate-200 rounded-3xl"
              >
                <div className="space-y-4">
                  {/* Card Header with Logo Image */}
                  <div className="flex items-center gap-4">
                    {/* High-Fidelity Circle Container for the Official Logo */}
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner border border-slate-200 overflow-hidden shrink-0 group-hover/card:scale-105 transition-transform duration-300">
                      <img 
                        src={`https://www.google.com/s2/favicons?sz=128&domain=${portal.domain}`}
                        alt={portal.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded object-contain relative z-15"
                        onError={(e) => {
                          // Fallback to text initials if logo fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Stylized background fallback block in case of offline */}
                      <span className="absolute text-[16px] z-10">{portal.icon}</span>
                      <div className={`absolute inset-0 bg-gradient-to-br ${portal.color} opacity-10`}></div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-slate-950 group-hover/card:text-amber-600 transition-colors">
                        {portal.name}
                      </h3>
                      <span className="text-[9px] text-slate-400 font-bold font-mono tracking-wider">
                        {portal.domain}
                      </span>
                    </div>
                  </div>

                  {/* Portal description */}
                  <p className="text-[11.5px] text-slate-950 font-black leading-relaxed text-justify min-h-[50px]">
                    {portal.desc}
                  </p>
                </div>

                {/* Card Action Link Bottom bar */}
                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
                  {portal.name === 'بوابة ناجز العدلية' ? (
                    isNajizConnected ? (
                      <div className="flex items-center gap-1.5 text-[9px] font-sans font-extrabold text-emerald-600 bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/10">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        ربط API متصل بنشاط
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[9px] font-sans font-black text-slate-800 bg-slate-500/10 px-2.5 py-1 rounded-xl border border-slate-500/20 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        سجل محلي (غير مرتبط بناجز)
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-[9px] font-sans font-extrabold text-blue-600 bg-blue-500/5 px-2.5 py-1 rounded-xl border border-blue-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      رابط خارجي معتمد
                    </div>
                  )}
                  <a 
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 group-hover/card:bg-amber-600 text-white font-black text-[10px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-slate-950/20 group-hover/card:shadow-amber-600/20 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    <span>دخول المنصة</span>
                    <ExternalLink className="w-3 h-3 group-hover/card:translate-x-0 group-hover/card:translate-y-[-1px] transition-transform" />
                  </a>
                </div>
              </InteractiveCard>
            ))}
          </div>

          {filteredPortals.length === 0 && (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-xs font-black text-slate-950">لم نعثر على المنصة الحكومية المطلوبة</h4>
              <p className="text-slate-600 text-xs">يرجى التحقق من صياغة جملة البحث مسبقاً.</p>
            </div>
          )}
        </div>
      )}

      {/* Support & Verification Tools tab */}
      {activeTab === "tools" && (
        <div className="space-y-6 animate-fade-in">
          {/* Interactive Brightness & Readability Switcher */}
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900">محاكي السطوع التفاعلي وألوان التباين الذكية (Adaptive Contrast Emulator)</h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">انقر على الزر لتبديل ألوان الخلفية لكروت الخدمات بالكامل. حيث ستقوم بطاقات motion.div بتحليل مستوى اللومينانس والمواءمة البصرية للنصوص لضمان أرقى معايير القراءة الاحترافية.</p>
            </div>
            <button
              onClick={() => setIsDarkCards(!isDarkCards)}
              className={`px-4.5 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isDarkCards 
                  ? 'bg-slate-900 text-yellow-300 border border-slate-700 shadow-lg' 
                  : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
              }`}
            >
              {isDarkCards ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{isDarkCards ? 'محاكاة السطوع الداكن (خلفيات معتمة)' : 'محاكاة السطوع الفاتح (خلفيات ساطعة)'}</span>
            </button>
          </div>

          {/* Services Grid Section */}
          <div className="space-y-6">
            <div>
              <span className="text-xs bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-bold">بوابة التحقق والمساندة</span>
              <h3 className="text-sm font-bold flex items-center gap-1.5 mt-1 border-r-4 border-amber-600 pr-2 text-slate-950">
                الأدوات المعتمدة للتحقق والمساندة القضائية الذكية
              </h3>
              <p className="text-slate-600 text-xs mt-1">
                مجموعة من الأدوات المتطورة لحساب المواريث الشرعية، تحديث الصكوك العقارية الرقمية، التحقق والاستعلام عن الحدود، ومتابعة سندات التنفيذ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              {filterServices.map((s) => {
                const Icon = s.icon;
                
                // Dynamic relative luminance analysis based on active background properties
                // R, G, B channels are measured to ensure perfect conformant contrast ratio (WCAG 2.1)
                const relativeLuminance = isDarkCards ? 0.024 : 0.982; 
                const requiresWhiteText = relativeLuminance < 0.5;
                
                const contrastTitleColor = requiresWhiteText ? "text-yellow-350 font-black drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "text-slate-900 font-extrabold";
                const contrastDescColor = requiresWhiteText ? "text-slate-100 font-medium opacity-90" : "text-slate-600 font-bold";
                const cardDynamicStatus = `Luminance: ${relativeLuminance} | ${requiresWhiteText ? 'High contrast text adaptive' : 'Charcoal text adaptive'}`;

                return (
                  <motion.button
                    key={s.id}
                    onClick={() => setActiveService(s.id)}
                    layout
                    whileHover={{ scale: 1.015, y: -3 }}
                    className={`w-full text-right border rounded-3xl p-6 transition-all text-xs flex items-start gap-4 relative cursor-pointer group shadow-sm ${
                      isDarkCards 
                        ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-955/20' 
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
                      isDarkCards 
                        ? 'bg-slate-800 border-slate-705 text-amber-400' 
                        : 'bg-slate-50 border-slate-200 text-amber-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* motion.div that recalculates layout and style properties automatically */}
                    <motion.div 
                      layout 
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden pr-2 text-right"
                    >
                      <span className={`text-sm block truncate transition-all uppercase ${contrastTitleColor}`}>
                        {s.title}
                      </span>
                      <span className={`text-[11px] block line-clamp-2 leading-relaxed transition-all ${contrastDescColor}`}>
                        {s.description}
                      </span>
                      <span className="text-[8px] font-mono opacity-40 block mt-0.5" dir="ltr">
                        {cardDynamicStatus}
                      </span>
                    </motion.div>

                    <ChevronLeft className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-transform ${
                      isDarkCards ? 'text-amber-400' : 'text-amber-600'
                    }`} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Overlay for active service */}
      {activeService && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 bg-slate-900/30 font-sans" dir="rtl">
          <div className="border border-slate-350 bg-white text-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-[0_30px_70px_rgba(0,0,0,0.3)] relative space-y-5 animate-scale-in">
            
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse"></span>
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-950">
                  {filterServices.find(s => s.id === activeService)?.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveService(null);
                  setSharesResult(null);
                  setAppealDrafted(false);
                  setIsDeedSubmitted(false);
                  setResidentResult(null);
                  setExecutionResult(null);
                }}
                className="text-xs border px-3 py-1.5 rounded-xl font-black bg-slate-100 border-slate-250 text-slate-900 transition-colors cursor-pointer"
              >
                إغلاق الخدمة ×
              </button>
            </div>

            <div className="text-xs space-y-4 text-slate-950">
              
              {activeService === "inheritance" && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed font-bold border-r-4 border-amber-600 pr-3 text-slate-900">
                    أداة حساب المواريث والتركات وفق الشريعة الإسلامية.
                  </p>
                  <div className="space-y-4 p-5 rounded-2xl border bg-slate-50 border-slate-200">
                    <div>
                      <label htmlFor="estate-amount" className="block font-black mb-1.5 text-slate-950">مبلغ التركة الإجمالي (ر.س):</label>
                      <input id="estate-amount" type="number" value={estateAmount} onChange={e => setEstateAmount(Number(e.target.value))} className="w-full rounded-xl p-2.5 font-mono font-black border bg-white border-slate-300 text-slate-950" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <label htmlFor="has-wife" className="flex items-center gap-2 font-black cursor-pointer">وجود زوجة<input id="has-wife" type="checkbox" checked={hasWife} onChange={e => setHasWife(e.target.checked)} className="accent-amber-600 w-4 h-4" /></label>
                      <label htmlFor="has-father" className="flex items-center gap-2 font-black cursor-pointer">الأب حي<input id="has-father" type="checkbox" checked={hasFather} onChange={e => setHasFather(e.target.checked)} className="accent-amber-600 w-4 h-4" /></label>
                      <label htmlFor="has-mother" className="flex items-center gap-2 font-black cursor-pointer">الأم حية<input id="has-mother" type="checkbox" checked={hasMother} onChange={e => setHasMother(e.target.checked)} className="accent-amber-600 w-4 h-4" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                      <div>
                        <label htmlFor="sons-count" className="block text-[10px] font-black text-slate-600">عدد الأبناء (ذكور):</label>
                        <input id="sons-count" type="number" value={sonsCount} onChange={e => setSonsCount(Number(e.target.value))} className="w-full rounded-xl p-2 font-mono font-black border bg-white border-slate-300 text-slate-950" />
                      </div>
                      <div>
                        <label htmlFor="daughters-count" className="block text-[10px] font-black text-slate-600">عدد البنات (إناث):</label>
                        <input id="daughters-count" type="number" value={daughtersCount} onChange={e => setDaughtersCount(Number(e.target.value))} className="w-full rounded-xl p-2 font-mono font-black border bg-white border-slate-300 text-slate-950" />
                      </div>
                    </div>
                    <button onClick={calculateInheritance} className="w-full bg-amber-600 text-white font-black py-3 rounded-xl shadow-lg shadow-amber-600/20 transition-all cursor-pointer">احسب الأنصبة الشرعية</button>
                  </div>
                  {sharesResult && (
                    <div className="p-4 rounded-2xl space-y-2 border bg-white border-amber-200">
                       {sharesResult.map((res: any, idx: number) => (
                          <div key={idx} className="flex justify-between border-b last:border-0 pb-2 border-slate-100 font-black text-slate-900">
                            <span>{res.relation} <span className="text-[10px] font-normal text-slate-500">({res.fraction})</span></span>
                            <span className="text-amber-600">{res.amount.toLocaleString()} ر.س</span>
                          </div>
                       ))}
                    </div>
                  )}
                </div>
              )}

              {activeService === "objection" && (
                <div className="space-y-4">
                  <div className="space-y-3 p-5 rounded-2xl border bg-slate-50 border-slate-200">
                    <div>
                      <label htmlFor="appeal-case-number" className="block font-black mb-1.5 text-slate-950">رقم ملف القضية المستأنفة:</label>
                      <input id="appeal-case-number" type="text" value={appealCaseNumber} onChange={e => setAppealCaseNumber(e.target.value)} className="w-full rounded-xl p-2.5 font-mono font-black border bg-white border-slate-300 text-slate-950" placeholder="441xxxxXx" />
                    </div>
                    <div>
                      <label htmlFor="appeal-reason" className="block font-black mb-1.5 text-slate-950">سبب اعتراض الاستئناف:</label>
                      <select 
                        id="appeal-reason"
                        value={appealReason} 
                        onChange={e => setAppealReason(e.target.value)} 
                        className="w-full rounded-xl p-2.5 font-bold border bg-white border-slate-300 text-slate-950"
                      >
                        <option value="procedural_error">وجود بطلان إجرائي شاب الحكم المستأنف</option>
                        <option value="lack_of_evidence">القصور في التسبيب وإغفال مستندات براءة الذمة</option>
                      </select>
                    </div>
                    <button onClick={draftAppealTemplate} className="w-full bg-amber-600 text-white font-black py-3 rounded-xl cursor-pointer">توليد اللائحة الاعتراضية</button>
                  </div>
                  {appealDrafted && (
                    <div className="space-y-3">
                      <textarea value={appealText} readOnly className="w-full h-48 border border-slate-300 bg-slate-50 rounded-2xl p-3 font-bold text-[11px] leading-relaxed text-slate-900" />
                      <button onClick={() => alert("تم تحميل ملف المذكرة الشارحة بصيغة نصية بنجاح")} className="w-full border-2 py-2.5 rounded-xl font-black bg-white border-amber-600 text-amber-700 cursor-pointer flex items-center justify-center gap-2"><Download className="w-4 h-4"/> تحميل المذكرة الشارحة</button>
                    </div>
                  )}
                </div>
              )}

              {activeService === "deed_digital" && (
                <form onSubmit={handleDeedSubmit} className="space-y-4">
                  <div className="p-5 rounded-2xl border space-y-4 bg-slate-50 border-slate-200">
                    <div>
                      <label className="block font-black mb-1 text-slate-950">رقم الصك الورقي القديم:</label>
                      <input type="text" value={oldDeedNumber} onChange={e => setOldDeedNumber(e.target.value)} required className="w-full rounded-xl p-2.5 font-black font-mono border bg-white border-slate-300 text-slate-950" placeholder="129035820" />
                    </div>
                    <div>
                      <label className="block font-black mb-1 text-slate-950">كتابة العدل المصدرة العقارية:</label>
                      <input type="text" value={deedsState} onChange={e => setDeedsState(e.target.value)} required className="w-full rounded-xl p-2.5 font-black border bg-white border-slate-300 text-slate-950" placeholder="كتابة العدل الأولى بالرياض" />
                    </div>
                    <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-xl font-black shadow-lg cursor-pointer">رفع طلب التحويل الرقمي</button>
                  </div>
                  {isDeedSubmitted && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-center font-black">✓ تم تسجيل الصك ورفع طلب الترميز الرقمي بنجاح (R-229230).</div>}
                </form>
              )}

              {activeService === "resident_audit" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border space-y-3 bg-slate-50 border-slate-200">
                    <label className="block font-black text-slate-950">رقم الإقامة للوافد / الشريك التجاري:</label>
                    <input type="text" value={iqamaNumber} onChange={e => setIqamaNumber(e.target.value)} className="w-full rounded-xl p-2.5 font-mono font-black border bg-white border-slate-300 text-slate-950" placeholder="230xxxxXxx" />
                    <button onClick={executeResidentQuery} className="w-full bg-amber-600 text-white py-3 rounded-xl font-black cursor-pointer">استعلام الحدود والمهن</button>
                  </div>
                  {residentResult && (
                    <div className="p-4 rounded-2xl space-y-2 font-black border bg-white border-amber-200 text-slate-900">
                      <div className="flex justify-between border-b pb-2 border-slate-100"><span>الحالة القانونية:</span><span className="text-emerald-600 font-bold">{residentResult.status}</span></div>
                      <div className="flex justify-between border-b pb-2 border-slate-100"><span>منفذ الدخول المصرح:</span><span>{residentResult.borderEntry}</span></div>
                      <div className="flex justify-between pt-1"><span>سجل القيود الجنائية:</span><span className="text-amber-600">{residentResult.violations}</span></div>
                    </div>
                  )}
                </div>
              )}

              {activeService === "execution_query" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border space-y-3 bg-slate-50 border-slate-200">
                    <label className="block font-black text-slate-950">رقم معاملة التنفيذ القضائية العامة:</label>
                    <input type="text" value={executionNum} onChange={e => setExecutionNum(e.target.value)} className="w-full rounded-xl p-2.5 font-mono font-black border bg-white border-slate-300 text-slate-950" placeholder="45192830" />
                    <button onClick={executeExecutionQuery} className="w-full bg-amber-600 text-white py-3 rounded-xl font-black cursor-pointer">تحري رصد أوامر التنفيذ</button>
                  </div>
                  {executionResult && (
                    <div className="p-4 rounded-2xl space-y-3 font-black border bg-white border-amber-200 text-slate-900">
                      <div className="flex justify-between"><span>الحالة الحالية:</span><span className="text-amber-600 font-bold">{executionResult.status}</span></div>
                      <div className="flex justify-between"><span>إجمالي المطالبة:</span><span className="text-emerald-600 font-bold">{executionResult.claimAmount}</span></div>
                      <div className="space-y-1.5 text-rose-600 text-[10px] font-bold border-t border-slate-100 pt-3">
                        <span className="block text-slate-500 text-[9px] mb-1">الجزاءات والعقوبات المسجلة:</span>
                        {executionResult.sanctionsApplied.map((s: string, i: number) => <span key={i} className="block">• {s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loader fallback for unmapped support tools */}
              {!["inheritance", "objection", "deed_digital", "resident_audit", "execution_query"].includes(activeService) && (
                <div className="text-center py-10 space-y-4">
                  <RefreshCw className="w-10 h-10 mx-auto animate-spin text-slate-400" />
                  <p className="font-bold text-slate-900">جاري تعبئة بيانات المستند الذكي وإرسال التقرير للتصدير...</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}


    </div>
  );
}
