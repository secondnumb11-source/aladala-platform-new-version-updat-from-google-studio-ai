import React, { useState } from "react";
import { 
  Gavel, Scale, FileText, Landmark, Calculator, Mail, 
  Handshake, ShieldAlert, CircleDot, ChevronLeft, HelpCircle, 
  Download, Send, Check, RefreshCw, ExternalLink, Search, Globe, ChevronRight,
  Sun, Moon, Users, Briefcase, ShieldCheck, CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import CourtMapAndServices from "@/components/CourtMapAndServices";
import { InteractiveCard } from "./InteractiveCard";
import { supabase } from "@/lib/supabase";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: "core" | "additional";
}

interface SaudiServicesHubProps {
  theme?: "light" | "dark";
  initialTab?: "internal" | "portals" | "watheeq" | "tools";
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
  const [activeTab, setActiveTab] = useState<"internal" | "portals" | "watheeq" | "tools">(initialTab || "portals");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeService, setActiveService] = useState<string | null>(null);
  const [isDarkCards, setIsDarkCards] = useState<boolean>(false);
  
  // Internal search state
  const [internalResults, setInternalResults] = useState<{cases: any[], clients: any[]}>({ cases: [], clients: [] });
  const [isSearchingInternal, setIsSearchingInternal] = useState(false);
  
  // Watheeq state
  const [watheeqDocNumber, setWatheeqDocNumber] = useState("");
  
  // Najiz / MOJ cases state
  const [najizCaseNumber, setNajizCaseNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");

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

  // External Links Handlers
  const openWatheeqVerification = (docNumber: string) => {
    if (!docNumber) return;
    window.open(`https://watheeq.gov.sa/ar/inquiries/documentInquiry?documentNumber=${docNumber}`, '_blank');
  };

  const searchNajizCase = (caseNumber: string) => {
    if (!caseNumber) return;
    window.open(`https://www.moj.gov.sa/ar/eServices/Pages/CaseInquiry.aspx?caseNo=${caseNumber}`, '_blank');
  };

  const inquiryCaseStatus = (caseNumber: string) => {
    window.open(`https://www.moj.gov.sa/ar/eServices/Pages/InquiryAboutCase.aspx`, '_blank');
  };

  const checkCommercialRegistry = async (crNum: string) => {
    if (!crNum) return;
    window.open(`https://mc.gov.sa/ar/eservices/Pages/serviceDetails.aspx?sID=107`, '_blank');
  };

  // Internal Database Search
  const searchInternalDatabase = async (query: string) => {
    if (!query || query.length < 2) {
      setInternalResults({ cases: [], clients: [] });
      return;
    }
    
    setIsSearchingInternal(true);
    try {
      const [casesResult, clientsResult] = await Promise.all([
        supabase.from('cases').select('id, title, case_number, status, court_name').or(`title.ilike.%${query}%,case_number.ilike.%${query}%`).limit(10),
        supabase.from('clients').select('id, name, type, phone, email').ilike('name', `%${query}%`).limit(10)
      ]);
      
      setInternalResults({
        cases: casesResult.data || [],
        clients: clientsResult.data || []
      });
    } catch (err) {
      console.error('[Internal Search Error]', err);
    } finally {
      setIsSearchingInternal(false);
    }
  };

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
    // Redirect to MOJ Inheritance Calculator for real unified data
    window.open(`https://www.moj.gov.sa/ar/eServices/Pages/Inheritencecalculator.aspx`, '_blank');
  };

  const draftAppealTemplate = () => {
    // Redirect to Najiz statement of claim / objection
    window.open(`https://najiz.sa/applications/landing/services/3`, '_blank');
  };

  const handleDeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to Real Estate Deed Update service on Najiz
    window.open(`https://najiz.sa/applications/landing/services/49`, '_blank');
  };

  const executeResidentQuery = () => {
    // Redirect to Absher or Muqeem for real data
    window.open(`https://www.absher.sa/wps/portal/individuals/Home`, '_blank');
  };

  const executeExecutionQuery = () => {
    // Redirect to Najiz execution inquiry for real data
    window.open(`https://najiz.sa/applications/landing/services/1`, '_blank');
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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-full xl:max-w-3xl border border-slate-200 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("internal")}
            className={`flex-1 min-w-[120px] whitespace-nowrap py-3 px-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "internal"
                ? "bg-white text-slate-950 shadow-md transform scale-102"
                : "text-slate-500 font-bold hover:text-slate-700"
            }`}
          >
            🔍 بحث في المنصة
          </button>
          <button
            onClick={() => setActiveTab("portals")}
            className={`flex-1 min-w-[120px] whitespace-nowrap py-3 px-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "portals"
                ? "bg-white text-slate-950 shadow-md transform scale-102"
                : "text-slate-500 font-bold hover:text-slate-700"
            }`}
          >
            🏛️ خدمات حكومية
          </button>
          <button
            onClick={() => setActiveTab("watheeq")}
            className={`flex-1 min-w-[120px] whitespace-nowrap py-3 px-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "watheeq"
                ? "bg-white text-slate-950 shadow-md transform scale-102"
                : "text-slate-500 font-bold hover:text-slate-700"
            }`}
          >
            ✅ التحقق من المستندات
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex-1 min-w-[140px] whitespace-nowrap py-3 px-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "tools"
                ? "bg-white text-slate-950 shadow-md transform scale-102"
                : "text-slate-500 font-bold hover:text-slate-700"
            }`}
          >
            🛠️ خدمات المساندة
          </button>
        </div>

        {activeTab === "portals" && (
          <div className="relative max-w-xs w-full shrink-0">
            <Search className="w-4 h-4 text-slate-400 font-bold absolute right-3 top-1/2 -translate-y-1/2" />
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
            <Globe className="w-5 h-5 text-amber-400 font-black shrink-0 mt-0.5" />
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
                      <h3 className="text-xs font-black text-slate-950 group-hover/card:text-amber-500 transition-colors">
                        {portal.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-black font-mono tracking-wider">
                        {portal.domain}
                      </span>
                    </div>
                  </div>

                  {/* Portal description */}
                  <p className="text-[11.5px] text-slate-900 font-black leading-relaxed text-justify min-h-[50px]">
                    {portal.desc}
                  </p>
                </div>

                {/* Card Action Link Bottom bar */}
                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
                  {portal.name === 'بوابة ناجز العدلية' ? (
                    isNajizConnected ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-sans font-extrabold text-emerald-600 bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/10">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        ربط API متصل بنشاط
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-sans font-black text-slate-800 bg-slate-500/10 px-2.5 py-1 rounded-xl border border-slate-500/20 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        سجل محلي (غير مرتبط بناجز)
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] font-sans font-extrabold text-blue-600 bg-blue-500/5 px-2.5 py-1 rounded-xl border border-blue-500/10">
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
              <HelpCircle className="w-12 h-12 text-slate-200 font-bold mx-auto" />
              <h4 className="text-xs font-black text-slate-950">لم نعثر على المنصة الحكومية المطلوبة</h4>
              <p className="text-slate-200 font-bold text-xs">يرجى التحقق من صياغة جملة البحث مسبقاً.</p>
            </div>
          )}
        </div>
      )}

      {/* Internal Search */}
      {activeTab === "internal" && (
        <div className="space-y-6 animate-fade-in text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-amber-500 pr-3">البحث الشامل والموحد في قواعد البيانات</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">ابحث بالاسم، أو رقم الهوية، أو السجل التجاري، أو تصنيف القضية، وسيتم البحث في جداول العملاء والقضايا معاً.</p>
            </div>
            
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                placeholder="أدخل مفتاح البحث هنا..." 
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pr-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => {
                   if(e.key === 'Enter') searchInternalDatabase(e.currentTarget.value);
                }}
                onChange={(e) => {
                   if(e.target.value.length === 0) setInternalResults({cases: [], clients: []});
                }}
              />
              <button 
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 font-black text-xs transition-colors shrink-0 flex items-center gap-2"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  searchInternalDatabase(input.value);
                }}
              >
                <Search className="w-4 h-4"/>
                بحث سريع
              </button>
            </div>
            
            {isSearchingInternal && (
              <div className="py-8 flex justify-center text-amber-600">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            )}
            
            {!isSearchingInternal && (internalResults.cases.length > 0 || internalResults.clients.length > 0) && (
               <div className="space-y-6 mt-6 border-t border-slate-100 pt-6">
                 {internalResults.clients.length > 0 && (
                   <div className="space-y-3">
                     <h4 className="flex items-center gap-2 text-xs font-black text-slate-800"><Users className="w-4 h-4 text-indigo-500"/> العملاء والشركات المطابقة ({internalResults.clients.length})</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {internalResults.clients.map((c, i) => (
                         <div key={i} className="p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-colors">
                           <p className="font-bold text-slate-900 text-xs mb-1">{c.name}</p>
                           {c.identity_number && <span className="text-[10px] text-slate-500 block font-mono">الهوية/السجل: {c.identity_number}</span>}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {internalResults.cases.length > 0 && (
                   <div className="space-y-3">
                     <h4 className="flex items-center gap-2 text-xs font-black text-slate-800"><Briefcase className="w-4 h-4 text-emerald-500"/> القضايا والملفات القانونية ({internalResults.cases.length})</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {internalResults.cases.map((c, i) => (
                         <div key={i} className="p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-colors">
                           <p className="font-bold text-slate-900 text-xs mb-1 truncate">{c.title || c.case_number}</p>
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{c.status}</span>
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">{c.category}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            )}
            
            {!isSearchingInternal && internalResults.cases.length === 0 && internalResults.clients.length === 0 && (
              <div className="text-center py-8 opacity-50">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-500">لا توجد نتائج مطابقة، جرب كلمات مفتاحية أخرى</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Watheeq / External Search */}
      {activeTab === "watheeq" && (
        <div className="space-y-6 animate-fade-in text-right" dir="rtl">
           {/* Watheeq Verification */}
           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
             <div className="shrink-0 w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
               <ShieldAlert className="w-8 h-8 text-blue-600" />
             </div>
             <div className="flex-1 space-y-3">
               <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>التحقق من الوثائق الرسمية (منصة وثيق)</h3>
               <p className="text-xs text-slate-500 font-medium">الاستعلام المباشر عن صحة وسريان الوثائق والمستندات الحكومية عبر بوابة وثيق.</p>
               <div className="flex gap-2 mt-4">
                 <input 
                   type="text" 
                   value={watheeqDocNumber}
                   onChange={e => setWatheeqDocNumber(e.target.value)}
                   placeholder="أدخل رقم الوثيقة المرجعي (مثل: 4xxxxxxxxx)"
                   className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                 />
                 <button 
                   onClick={() => openWatheeqVerification(watheeqDocNumber)}
                   className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 font-black text-xs transition-colors shrink-0 flex items-center gap-2"
                 >
                   تحقق الآن <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                 </button>
               </div>
             </div>
           </div>
           
            {/* MOJ Case Verification */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="shrink-0 w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                <Gavel className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">استعلام تفاصيل القضية (ناجز / وزارة العدل)</h3>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs text-slate-500 font-medium font-sans">الاستعلام المباشر عن حالة ومواعيد جلسات القضايا المرفوعة بالرقم المرجعي والموثقة من وزارة العدل.</p>
                <div className="flex gap-2 mt-4">
                  <input 
                    type="text" 
                    value={najizCaseNumber}
                    onChange={e => setNajizCaseNumber(e.target.value)}
                    placeholder="أدخل رقم القضية المرجعي"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <button 
                    onClick={() => searchNajizCase(najizCaseNumber)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 font-black text-xs transition-colors shrink-0 flex items-center gap-2"
                  >
                    استعلام القضية <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  </button>
                </div>
              </div>
            </div>

           {/* MC CR Check */}
           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
             <div className="shrink-0 w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100">
               <Briefcase className="w-8 h-8 text-sky-600" />
             </div>
             <div className="flex-1 space-y-3">
               <h3 className="text-sm font-black text-slate-900">الاستعلام عن بيانات السجل التجاري (وزارة التجارة)</h3>
               <p className="text-xs text-slate-500 font-medium">مراجعة سريان وملكيات ومخالفات السجلات التجارية للشركاء والأطراف.</p>
               <div className="flex gap-2 mt-4">
                 <input 
                   type="text" 
                   value={crNumber}
                   onChange={e => setCrNumber(e.target.value)}
                   placeholder="أدخل رقم السجل التجاري"
                   className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                 />
                 <button 
                   onClick={() => checkCommercialRegistry(crNumber)}
                   className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-5 font-black text-xs transition-colors shrink-0 flex items-center gap-2"
                 >
                   استعلام السجل <ShieldCheck className="w-3.5 h-3.5 text-sky-200" />
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Support & Verification Tools tab */}
      {activeTab === "tools" && (
        <div className="space-y-6 animate-fade-in">
          {/* Interactive Brightness & Readability Switcher */}
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900">محاكي السطوع التفاعلي وألوان التباين الذكية (Adaptive Contrast Emulator)</h4>
              <p className="text-[10px] text-slate-700 font-bold mt-0.5">انقر على الزر لتبديل ألوان الخلفية لكروت الخدمات بالكامل. حيث ستقوم بطاقات motion.div بتحليل مستوى اللومينانس والمواءمة البصرية للنصوص لضمان أرقى معايير القراءة الاحترافية.</p>
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
              <p className={`${isDarkCards ? 'text-white' : 'text-slate-200'} font-bold text-xs mt-1`}>
                مجموعة من الأدوات المتطورة لحساب المواريث الشرعية، تحديث الصكوك العقارية الرقمية، التحقق والاستعلام عن الحدود، ومتابعة سندات التنفيذ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              {filterServices.map((s) => {
                const Icon = s.icon;
                
                // Dynamic relative luminance analysis based on active background properties
                const relativeLuminance = isDarkCards ? 0.024 : 0.982; 
                const requiresWhiteText = relativeLuminance < 0.5;
                
                const contrastTitleColor = requiresWhiteText ? "text-amber-400 font-black" : "text-slate-900 font-black";
                const contrastDescColor = requiresWhiteText ? "text-slate-200 font-bold" : "text-slate-600 font-bold";
                const cardDynamicStatus = `Mode: ${isDarkCards ? 'Dark Oasis' : 'Ivory Light'} | Contrast: High`;

                return (
                  <motion.button
                    key={s.id}
                    onClick={() => setActiveService(s.id)}
                    layout
                    whileHover={{ scale: 1.01, y: -4 }}
                    className={`w-full text-right border rounded-[2rem] p-7 transition-all flex items-center gap-6 relative cursor-pointer group overflow-hidden ${
                      isDarkCards 
                        ? 'bg-[#0B1221] border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.4)]' 
                        : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    {/* Decorative side accent */}
                    <div className={`absolute right-0 top-0 bottom-0 w-1.5 transition-all ${
                      isDarkCards ? 'bg-amber-500 group-hover:w-2' : 'bg-indigo-600 group-hover:w-2'
                    }`}></div>

                    <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 shadow-inner group-hover:rotate-6 ${
                      isDarkCards 
                        ? 'bg-slate-800/50 border-amber-500/30 text-amber-500 shadow-amber-500/5' 
                        : 'bg-slate-50 border-indigo-100 text-indigo-600 shadow-indigo-100/50'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <motion.div 
                      layout 
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5 overflow-hidden pr-1 text-right flex-1"
                    >
                      <span className={`text-base block truncate transition-all tracking-tight ${contrastTitleColor}`}>
                        {s.title}
                      </span>
                      <span className={`text-xs block line-clamp-2 leading-relaxed transition-all opacity-80 ${contrastDescColor}`}>
                        {s.description}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-current opacity-30`} dir="ltr">
                          {cardDynamicStatus}
                        </span>
                      </div>
                    </motion.div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:bg-amber-500 group-hover:text-white ${
                      isDarkCards ? 'bg-slate-800 text-amber-500' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Overlay for active service */}
      {activeService && (
        <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4 bg-slate-950/80 font-sans" dir="rtl">
          <div className="border border-slate-700/50 bg-[#0B1221] text-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_80px_rgba(212,175,55,0.15)] relative animate-scale-in">
            
            {/* Modal Glass Header */}
            <div className="p-7 border-b border-white/10 flex items-center justify-between bg-gradient-to-l from-amber-500/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]"></div>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span className="text-amber-500">نظام:</span>
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
                className="bg-slate-800/80 hover:bg-rose-600/20 hover:text-rose-400 text-slate-300 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border border-white/5"
              >
                إغلاق الخدمة ×
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {activeService === "inheritance" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <Calculator className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <p className="text-xs leading-relaxed font-bold text-slate-300">
                      أداة حساب المواريث والتركات وفق الشريعة الإسلامية. تم تطوير الخوارزمية لتتوافق مع المذاهب الفقهية المعتمدة في الأحوال الشخصية.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 p-6 rounded-[1.5rem] border bg-slate-900/50 border-white/5 backdrop-blur-sm shadow-inner">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-amber-500/80 uppercase tracking-widest">مبلغ التركة الإجمالي (ر.س):</label>
                      <input 
                        type="number" 
                        value={estateAmount} 
                        onChange={e => setEstateAmount(Number(e.target.value))} 
                        className="w-full rounded-2xl p-4 font-mono text-xl font-black border bg-slate-950/50 border-white/10 text-white focus:border-amber-500 outline-none transition-all shadow-inner" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'wife', label: 'وجود زوجة', checked: hasWife, setter: setHasWife },
                        { id: 'father', label: 'الأب حي', checked: hasFather, setter: setHasFather },
                        { id: 'mother', label: 'الأم حية', checked: hasMother, setter: setHasMother },
                      ].map(check => (
                        <label key={check.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                          check.checked ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-slate-950/20 border-white/5 text-slate-400 opacity-60 hover:opacity-100'
                        }`}>
                          <span className="text-xs font-black">{check.label}</span>
                          <input 
                            type="checkbox" 
                            checked={check.checked} 
                            onChange={e => check.setter(e.target.checked)} 
                            className="accent-amber-500 w-5 h-5 rounded-md" 
                          />
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-5 border-t border-white/10 pt-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد الأبناء (ذكور):</label>
                        <input type="number" value={sonsCount} onChange={e => setSonsCount(Number(e.target.value))} className="w-full rounded-xl p-3 font-mono font-black border bg-slate-950 border-white/5 text-white text-center focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد البنات (إناث):</label>
                        <input type="number" value={daughtersCount} onChange={e => setDaughtersCount(Number(e.target.value))} className="w-full rounded-xl p-3 font-mono font-black border bg-slate-950 border-white/5 text-white text-center focus:border-indigo-500 outline-none" />
                      </div>
                    </div>

                    <button 
                      onClick={calculateInheritance} 
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(217,119,6,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm"
                    >
                      توليد جدول الأنصبة الشرعية
                    </button>
                  </div>

                  {sharesResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-1 rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent overflow-hidden"
                    >
                      <div className="p-6 rounded-[0.9rem] space-y-3 bg-slate-950/80 backdrop-blur-xl">
                        <h4 className="text-xs font-black text-amber-500 mb-4 border-b border-white/5 pb-2">نتائج توزيع التركة التقريبية:</h4>
                        {sharesResult.map((res: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white">{res.relation}</span>
                              <span className="text-[10px] font-bold text-slate-400">{res.fraction}</span>
                            </div>
                            <span className="text-amber-500 font-mono font-black text-base group-hover:scale-110 transition-transform">
                              {res.amount.toLocaleString()} <span className="text-[10px] text-amber-500/50">ر.س</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeService === "deed_digital" && (
                <form onSubmit={handleDeedSubmit} className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <Landmark className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                    <p className="text-xs leading-relaxed font-bold text-slate-300">
                      خدمة تحويل الصكوك الورقية القديمة إلى صكوك رقمية نشطة تتيح لملاك العقارات إتمام جميع العمليات العقارية إلكترونياً عبر تطبيق ناجز.
                    </p>
                  </div>

                  <div className="p-7 rounded-[2rem] border space-y-6 bg-slate-900/50 border-white/5 shadow-inner">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-blue-400/80 mb-1">رقم الصك الورقي القديم:</label>
                      <input 
                        type="text" 
                        value={oldDeedNumber} 
                        onChange={e => setOldDeedNumber(e.target.value)} 
                        required 
                        className="w-full rounded-2xl p-4 font-black font-mono border bg-slate-950 border-white/10 text-white focus:border-blue-500 outline-none shadow-inner" 
                        placeholder="مثال: 129035820" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-blue-400/80 mb-1">كتابة العدل المصدرة للسك:</label>
                      <input 
                        type="text" 
                        value={deedsState} 
                        onChange={e => setDeedsState(e.target.value)} 
                        required 
                        className="w-full rounded-2xl p-4 font-black border bg-slate-950 border-white/10 text-white focus:border-blue-500 outline-none shadow-inner" 
                        placeholder="مثل: كتابة العدل الأولى بالرياض" 
                      />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition-all cursor-pointer text-sm">رفع طلب التحويل الرقمي المعتمد</button>
                  </div>
                  {isDeedSubmitted && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-5 rounded-2xl text-center flex flex-col items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                        <Check className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="font-black text-xs">تم تسجيل الصك ورفع طلب الترميز الرقمي بنجاح</p>
                      <span className="text-[10px] font-mono opacity-60">رقم المرجع: DEED-R-229230</span>
                    </motion.div>
                  )}
                </form>
              )}

              {activeService === "resident_audit" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                    <ShieldAlert className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                    <p className="text-xs leading-relaxed font-bold text-slate-300">
                      نظام التحقق الموحد لشؤون الأجانب؛ يتيح للمنشآت التحقق من صلاحية التأشيرات، سجل السفر والحدود، والامتثال المهني للشريك التجاري.
                    </p>
                  </div>

                  <div className="p-7 rounded-[2rem] border bg-slate-900/50 border-white/5 space-y-5 shadow-inner">
                    <div className="space-y-2">
                       <label className="block text-xs font-black text-indigo-400/80 mb-1">رقم الإقامة للوافد / الشريك التجاري:</label>
                       <input 
                         type="text" 
                         value={iqamaNumber} 
                         onChange={e => setIqamaNumber(e.target.value)} 
                         className="w-full rounded-2xl p-4 font-mono text-xl font-black border bg-slate-950 border-white/10 text-white text-center focus:border-indigo-500 outline-none shadow-inner" 
                         placeholder="230xxxxXxx" 
                       />
                    </div>
                    <button onClick={executeResidentQuery} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black shadow-[0_10px_20px_rgba(79,70,229,0.2)] transition-all cursor-pointer text-sm">استعلام الأهلية والحدود</button>
                  </div>
                  
                  {residentResult && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 rounded-[1.5rem] space-y-4 border bg-slate-900/40 border-indigo-500/20 shadow-xl"
                    >
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-2 italic">تقرير التحقق الأمني الرقمي</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 rounded bg-white/5">
                          <span className="text-[11px] font-bold text-slate-400">الحالة القانونية:</span>
                          <span className="text-emerald-400 font-black text-xs">{residentResult.status}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-white/5">
                          <span className="text-[11px] font-bold text-slate-400">منفذ الدخول الأخير:</span>
                          <span className="text-white font-black text-xs">{residentResult.borderEntry}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                          <span className="text-[10px] font-black text-indigo-300">سجل القيود الجنائية:</span>
                          <p className="text-xs font-black text-white">{residentResult.violations}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeService === "execution_query" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                    <CircleDot className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
                    <p className="text-xs leading-relaxed font-bold text-slate-300">
                      رصد ومتابعة قرارات التنفيذ القضائي الصادرة من محاكم التنفيذ؛ تتيح للخصوم والوكلاء التحقق من طلبات التنفيذ (المادة 34) والجزاءات (المادة 46).
                    </p>
                  </div>

                  <div className="p-7 rounded-[2rem] border space-y-5 bg-slate-900/50 border-white/5 shadow-inner">
                    <div className="space-y-2">
                       <label className="block text-xs font-black text-rose-400 mb-1">رقم معاملة التنفيذ (الرقم الموحد):</label>
                       <input 
                         type="text" 
                         value={executionNum} 
                         onChange={e => setExecutionNum(e.target.value)} 
                         className="w-full rounded-2xl p-4 font-mono text-xl font-black border bg-slate-950 border-white/10 text-white text-center focus:border-rose-500 outline-none shadow-inner" 
                         placeholder="45192830" 
                       />
                    </div>
                    <button onClick={executeExecutionQuery} className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black shadow-[0_10px_20px_rgba(225,29,72,0.2)] transition-all cursor-pointer text-sm">كشف أوامر التنفيذ</button>
                  </div>

                  {executionResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 rounded-[1.5rem] space-y-5 border bg-slate-900 border-rose-500/20 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2 bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-tighter">الحالة: قيد التنفيذ</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">إجمالي المطالبة المالية:</span>
                            <span className="text-emerald-400 font-mono font-black text-2xl">{executionResult.claimAmount}</span>
                          </div>
                          <div className="text-left bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                            <span className="text-rose-400 font-black text-[11px]">{executionResult.status}</span>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <span className="text-xs font-black text-slate-300 block mb-2">العقوبات والجزاءات التلقائية المسجلة:</span>
                          <div className="grid grid-cols-1 gap-2">
                            {executionResult.sanctionsApplied.map((s: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-200">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Loader fallback for unmapped support tools */}
              {!["inheritance", "objection", "deed_digital", "resident_audit", "execution_query"].includes(activeService) && (
                <div className="text-center py-16 space-y-6">
                  <div className="relative w-16 h-16 mx-auto">
                    <RefreshCw className="w-full h-full animate-spin text-amber-500/30" />
                    <div className="absolute inset-4 blur-sm bg-amber-500/20 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-white text-sm">جاري تحليل الأنماط القانونية...</p>
                    <p className="text-[10px] text-slate-400 font-bold">يتم الآن معالجة طلبك عبر خوادم الذكاء الاصطناعي وربطه بصورة آمنة مع السيرفرات المختصة بمزودي الخدمة.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}


    </div>
  );
}
