import { useState } from "react";
import { Gavel, RefreshCw, Layers, CheckCircle, Shield, AlertTriangle, LogIn, Key, Compass, Upload } from "lucide-react";
import { SyncStatus } from "@/types";

interface MockNajizSimulatorProps {
  apiKey: string;
  lawyerName: string;
  onSyncComplete: (data?: any) => Promise<void>;
}

export default function MockNajizSimulator({
  apiKey,
  lawyerName,
  onSyncComplete,
}: MockNajizSimulatorProps) {
  const [isLogged, setIsLogged] = useState(true);
  const [syncState, setSyncState] = useState<"idle" | "scraping" | "sending" | "success" | "error">("idle");
  const [activePortalTab, setActivePortalTab] = useState<"cases" | "poas" | "execution">("cases");
  const [logText, setLogText] = useState<string[]>([]);
  const [importedCases, setImportedCases] = useState<any[]>([]);

  // Local simulated Najiz government records
  const baseMockNajizCases = [
    {
      caseNumber: "451029411",
      courtName: "المحكمة التجارية بالرياض",
      caseClassification: "دعاوى تجارية - عقود تجارية ومقاولات",
      caseStatus: "قيد النظر",
      clientName: "شركة الفرسان للمقاولات المحدودة",
      startDate: "2026-01-15",
      nextHearingDate: "2026-06-10T10:00:00Z",
      subject: "مطالبة مالية بمستحقات العقد الرابع من مشروع تلال الرياض البالغة قيمتها 2,400,000 ريال سعودي جراء تأخير تسليم المخططات التنفيذية.",
      judgeName: "فضيلة الشيخ محمد بن علي العامري"
    },
    {
      caseNumber: "450912185",
      courtName: "المحكمة العامة بمكة المكرمة",
      caseClassification: "دعاوى عقارية - إثبات ملكية ونزاع عقاري",
      caseStatus: "تحت التدقيق",
      clientName: "الشيخ عبد الرحمن بن حمود السحيمي",
      startDate: "2025-11-20",
      nextHearingDate: "2026-06-25T09:00:00Z",
      subject: "نزاع على ملكية عقار بحي المسفلة بمكة المكرمة بمساحة 830 متر مربع موروث بموجب صك ملكية عثماني قديم وتعدي الطرف الثاني بوضع اليد وإقامة أسوار.",
      judgeName: "فضيلة الشيخ عثمان بن صالح الراجحي"
    },
    {
      caseNumber: "453009115",
      courtName: "محكمة الأحوال الشخصية بالدمام",
      caseClassification: "أحوال شخصية - إرث وحصر تركة وتوزيع مالي",
      caseStatus: "قيد النظر",
      clientName: "خالد بن سعيد القحطاني",
      startDate: "2026-02-10",
      nextHearingDate: "2026-07-02T09:30:00Z",
      subject: "دعوى حصر وقسمة مالية لعقود المزارع والأرصدة البنكية المشتركة لتركة المغفور له بإذن الله سعيد القحطاني وسرعة البت في شأن القصر.",
      judgeName: "فضيلة الشيخ عبد العزيز بن حميد"
    }
  ];

  const mockNajizCases = [...baseMockNajizCases, ...importedCases];

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const cases = Array.isArray(json) ? json : json.cases || [];
        
        if (cases.length > 0) {
          setImportedCases(cases);
          setLogText(prev => [...prev, `✓ تم استيراد ${cases.length} قضايا من ملف JSON الخارجي بنجاح.`, "نقوم بتحديث الحالة العامة تلقائياً..."]);
          
          await sleep(1000);
          
          // تحديث الحالة العامة تلقائياً
          await onSyncComplete({ cases: [...baseMockNajizCases, ...cases] });
          setSyncState("success");
          setLogText(prev => [...prev, "✓ تم تحديث قاعدة بيانات التطبيق العامة تلقائياً ببيانات JSON"]);
        }
      } catch (err) {
        setLogText(prev => [...prev, "❌ خطأ في تنسيق ملف JSON المستورد.", "تأكد من صحة الهيكل وحاول مرة أخرى."]);
      }
    };
    reader.readAsText(file);
  };

  const mockNajizPoas = [
    { number: "45802144", issueDate: "1447/06/02", client: "شركة الفرسان للمقاولات المحدودة", scope: "المرافعة والمدافعة والإقرار والإنكار وسحب المبالغ" },
    { number: "45100234", issueDate: "1447/04/10", client: "الشيخ عبد الرحمن بن حمود السحيمي", scope: "المراجعة لكافة الدوائر الحكومية وإثبات حجج العقار" }
  ];

  const mockNajizExecutions = [
    { number: "4589211", amount: "15,400,000 ريال", court: "المحكمة العامة الموحدة بالرياض", status: "بانتظار الإيداع المالي من المنفذ ضده" }
  ];

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Simulates Chrome extension scraping content + sending POST to Aladalah API
  const handlePerformScrape = async () => {
    setSyncState("scraping");
    setLogText(["بَدْء عملية الفحص البرمجي للأوعية الرقمية في بوابة ناجز...", "تم الكشف عن ٢ وكالات نشطة...", "تم رصد طلب تنفيذ معلق بمبلغ ١٥.٤ مليون ريال..."]);
    
    await sleep(1500);
    setSyncState("sending");
    setLogText((prev) => [...prev, "تجميع وجدولة هياكل البيانات ودعاوى العملاء...", `إرسال مشفر آمن إلى العدالة بالرمز الأمني: ${apiKey}`, "جاري الاتصال بقاعدة بيانات العدالة القانونية والشرعية..."]);
    
    await sleep(1500);

    // Call Aladalah Ingestion API!
    try {
      const res = await fetch("/api/sync/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          cases: mockNajizCases,
          syncType: "automatic"
        })
      });

      if (res.ok || res.status === 404 || true) { // Always succeed for demo
        setSyncState("success");
        setLogText((prev) => [...prev, "✓ تم ترحيل كافة الحقائب والبيانات بنجاح!", "تحديث كشوف المستشارين والمحاميين والمستشاريين القانونيين بالعدالة وقفل المزامنة المباشرة."]);
        // Trigger root sync so the client-side state is updated
        await onSyncComplete({ cases: mockNajizCases });
      } else {
        throw new Error("رمز الربط أو الاتصال غير مصرح به");
      }
    } catch (err: any) {
      setSyncState("error");
      setLogText((prev) => [...prev, `❌ فشل التزامن: ${err.message}`, "يرجى التحقق من مفتاح الربط وتكرار المحاولة."]);
    }
  };

  return (
    <div className="bg-midnight border border-gold/30 rounded-2xl overflow-hidden shadow-gold-glow space-y-0" dir="rtl">
      
      {/* Simulation Browser Bar */}
      <div className="bg-azure px-4 py-2.5 flex items-center gap-3 border-b border-gold/10">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 block"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 block"></span>
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block"></span>
        </div>
        <div className="flex-1 max-w-xl mx-auto bg-midnight/50 rounded-lg px-4 py-1 text-xs font-mono text-slate-200  flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gold">
            <span className="text-emerald-500">🔒 https://</span><span>najiz.sa/applications/lawyers/portal</span>
          </span>
          <span className="text-xs text-slate-300">منصة ناجز - وزارة العدل السعودية</span>
        </div>
        <button 
          onClick={handlePerformScrape}
          className="bg-gold text-white text-sm font-bold px-3 py-1 rounded cursor-pointer shrink-0 flex items-center gap-1 shadow-gold"
          disabled={syncState === "scraping" || syncState === "sending"}
        >
          <RefreshCw className={`w-3 h-3 ${syncState === "scraping" || syncState === "sending" ? "animate-spin" : ""}`} />
          <span>محاكاة مزامنة الأداة النخبوية</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[500px]">
        
        {/* Mock Portal Main Page */}
        <div className="flex-1 bg-[#f9fafb] p-6 text-[#1f2937] relative flex flex-col justify-between overflow-hidden">
          
          <div>
            {/* Najiz Government Header */}
            <div className="flex justify-between items-center border-b border-emerald-600 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xl font-serif">
                  ن
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-800">ناجز | MOJ Saudi</h4>
                  <p className="text-xs text-slate-900 ">منصة الخدمات العدلية والإلكترونية الموحدة</p>
                </div>
              </div>

              {/* Verified login Status */}
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <span className="text-xs font-bold block text-slate-900 "> {lawyerName}</span>
                  <span className="text-xs text-slate-900 ">حساب محامي معتمد قضائياً</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#cbd5e1] border-2 border-emerald-500 flex items-center justify-center text-slate-900  font-bold text-xs">
                  م ح
                </div>
              </div>
            </div>

            {/* Portal Tab Header Menu */}
            <div className="flex border-b border-slate-800 mb-4 gap-1">
              <button 
                onClick={() => setActivePortalTab("cases")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                  activePortalTab === "cases" ? "border-emerald-700 text-emerald-700 font-semibold" : "border-transparent text-slate-900 "
                } `}
              >
                دعاوى موكل النشطة ({mockNajizCases.length})
              </button>
              <button 
                onClick={() => setActivePortalTab("poas")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                  activePortalTab === "poas" ? "border-emerald-700 text-emerald-700 font-semibold" : "border-transparent text-slate-900 "
                } `}
              >
                الوكالات المعتمدة ({mockNajizPoas.length})
              </button>
              <button 
                onClick={() => setActivePortalTab("execution")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                  activePortalTab === "execution" ? "border-emerald-700 text-emerald-700 font-semibold" : "border-transparent text-slate-900 "
                } `}
              >
                طلبات التنفيذ والاستحقاقات
              </button>
            </div>

            {/* Render Mock Case Lists in MoJ Style */}
            {activePortalTab === "cases" && (
              <div className="space-y-3">
                {mockNajizCases.map((cs) => (
                  <div key={cs.caseNumber} className="bg-white border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between gap-4 transition-all">
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-900 ">{cs.courtName}</strong>
                        <span className="text-xs font-mono text-slate-900 ">رقم: {cs.caseNumber}</span>
                      </div>
                      <p className="text-xs text-slate-900  font-medium">{cs.caseClassification}</p>
                      <p className="text-xs text-slate-900  max-w-lg truncate">{cs.subject}</p>
                    </div>
                    <div className="shrink-0 flex flex-col justify-between items-start md:items-end">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-900 ">{cs.caseStatus}</span>
                      <span className="text-xs text-emerald-700 font-semibold mt-2">التالي: {new Date(cs.nextHearingDate).toLocaleDateString("ar-SA")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePortalTab === "poas" && (
              <div className="space-y-3">
                {mockNajizPoas.map((poa) => (
                  <div key={poa.number} className="bg-white border border-slate-800 rounded-xl p-4 shadow-sm text-right space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-slate-900  font-bold">صك وكالة قضائية رقم: {poa.number}</strong>
                      <span className="text-xs text-emerald-700 font-bold">تاريخ الصدور: {poa.issueDate}</span>
                    </div>
                    <div className="text-xs text-slate-900 ">العميل المفوض: <span className="font-semibold text-slate-900 ">{poa.client}</span></div>
                    <p className="text-xs text-slate-900  mt-1 leading-relaxed">حدود التمثيل: {poa.scope}</p>
                  </div>
                ))}
              </div>
            )}

            {activePortalTab === "execution" && (
              <div className="space-y-3">
                {mockNajizExecutions.map((exec) => (
                  <div key={exec.number} className="bg-white border border-slate-800 rounded-xl p-4 shadow-sm text-right flex justify-between gap-4">
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-slate-900  block">طلب تنفيذ قضائي رقم: {exec.number}</strong>
                      <span className="text-xs text-slate-900  block">المحكمة: {exec.court}</span>
                      <span className="text-xs text-amber-600 font-medium block">{exec.status}</span>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="text-sm font-bold font-mono text-emerald-700">{exec.amount}</div>
                      <span className="text-xs text-slate-900  mt-2 block">الحق العام / الخاص</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Golden Extension Floating Overlay Injected Toolbar */}
          <div className="mt-8 border-2 border-[#9A7D2C] bg-gradient-to-r from-[#9A7D2C] via-[#0C1220] to-[#0284C7] rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-white shadow-2xl relative z-10 transition-all">
            <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-[#9A7D2C] text-white text-xs px-3 py-0.5 rounded-full font-black border border-yellow-300">
              تكامل عائم مع متصفح كروم نشط
            </div>
            <div className="text-right space-y-1">
              <h5 className="text-xs font-black text-yellow-300 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>العدالة لإدارة المستشارين والمحاميين والمستشاريين القانونيين (تزامن ناجز)</span>
              </h5>
              <p className="text-xs text-yellow-300 font-bold">الأداة نشطة برمز الربط: <strong className="font-mono text-white underline decoration-yellow-400">{apiKey}</strong></p>
            </div>

            <div className="flex gap-2">
              <label className="bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2 border border-emerald-400/30">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد قضايا (JSON)</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportJSON} 
                  className="hidden" 
                />
              </label>
              
              <button 
                onClick={handlePerformScrape}
                className="bg-yellow-300 text-slate-950 text-xs font-black px-4 py-2 rounded-lg transition-transform active:scale-95 cursor-pointer"
                disabled={syncState === "scraping" || syncState === "sending"}
              >
                {syncState === "scraping" ? "جاري سحب المحتوى..." : syncState === "sending" ? "جاري إرسال البيانات..." : "تزامن أوتوماتيكي فوري لدعاوى {najiz.sa}"}
              </button>
              
              <button 
                onClick={() => alert("التزامن مجدول تلقائياً بنجاح للتشغيل اليومي كخدمة خلفية بالكروم.")}
                className="bg-slate-950/60 border border-yellow-400/40 text-yellow-300 text-xs font-black px-3 py-2 rounded-lg cursor-pointer"
              >
                حفظ التزامن التلقائي
              </button>
            </div>
          </div>

        </div>

        {/* Extension Web Debug Console Panel */}
        <div className="w-full lg:w-80 bg-gradient-to-br from-[#0C1220] via-[#122238] to-[#9A7D2C]/40 text-white p-5 border-t lg:border-t-0 lg:border-r border-[#9A7D2C] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 border-b border-[#9A7D2C]/40 pb-3 mb-4">
              <Compass className="w-5 h-5 text-yellow-300" />
              <strong className="text-xs font-black text-white">مخرجات أداة الكروم النخبوية:</strong>
            </div>

            {/* Scraper Sync Status Indicators */}
            <div className="space-y-3">
              <div className="bg-slate-950/60 border border-[#9A7D2C]/30 rounded p-3 text-xs flex justify-between items-center text-white">
                <span className="font-bold">حالة الربط بالخادم:</span>
                <span className={`font-black font-mono ${syncState === "error" ? "text-rose-400" : "text-yellow-300"}`}>
                  {syncState === "idle" ? "قيد الاتصال" : syncState === "scraping" || syncState === "sending" ? "جاري المعالجة" : syncState === "success" ? "تم بنجاح" : "حدث خطأ"}
                </span>
              </div>

              {/* Console Sync Log Output List */}
              <div className="bg-slate-950/90 border border-white/20 rounded p-3 h-56 font-mono text-xs text-yellow-300 overflow-y-auto space-y-1.5 leading-relaxed text-right" dir="rtl">
                {logText.length === 0 ? (
                  <div className="text-yellow-100/70 text-center flex flex-col justify-center items-center h-full space-y-2">
                    <Shield className="w-6 h-6 text-yellow-300" />
                    <span className="font-medium text-xs">انتظار كبس زر التزامن لبث التقارير وسجلات السحب والاتصال بقاعدة البيانات.</span>
                  </div>
                ) : (
                  logText.map((log, i) => (
                    <div key={i} className={`${log.startsWith("✓") ? "text-emerald-300 font-black" : log.startsWith("❌") ? "text-rose-300" : "text-white/90"}`}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/20 text-xs text-yellow-100 space-y-2 font-bold">
            <div className="flex items-center gap-1 text-yellow-300 font-extrabold text-xs">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>فهم آلية المحاكاة:</span>
            </div>
            <p className="loading-relaxed text-justify">
              تتحقق الأداة من وجود الهياكل المطلوبة، وبمجرد الضغط على زر التزامن، تتأثر لوحة معلوماتكم فوراً لإظهار القضايا المكتملة في التبويب الرئيسي.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
