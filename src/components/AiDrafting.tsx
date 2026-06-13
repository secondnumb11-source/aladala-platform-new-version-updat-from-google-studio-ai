import { useState, useEffect } from "react";
import { 
  Sparkles, FileText, CheckCircle, RefreshCw, AlertTriangle, 
  Scale, Copy, Eye, EyeOff, ZoomIn, ZoomOut, Type 
} from "lucide-react";
import { persistenceLayer } from "@/lib/DataPersistenceLayer";

export default function AiDrafting() {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("memo");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Focus Mode internal states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingFont, setReadingFont] = useState<"sans" | "amiri" | "playfair">("amiri");
  const [readingFontSize, setReadingFontSize] = useState<"sm" | "md" | "lg" | "xl">("lg");
  const [readingTheme, setReadingTheme] = useState<"cream" | "paper" | "dark-onyx">("cream");

  // Sync Focus Mode body class for sidebar masking
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add("focus-mode-active");
    } else {
      document.body.classList.remove("focus-mode-active");
    }
    return () => {
      document.body.classList.remove("focus-mode-active");
    };
  }, [isFocusMode]);

  useEffect(() => {
    const handleQuickSave = () => {
      if (output && isFocusMode) {
        persistenceLayer.saveDraft(`draft_${Date.now()}`, output).then(() => {
          setSuccessMsg("تم الحفظ في المحفظة المحلية بنجاح للطوارئ!");
          setTimeout(() => setSuccessMsg(""), 2000);
        }).catch(err => console.error("Error saving draft", err));
      }
    };
    window.addEventListener('adalah-focus-quick-save', handleQuickSave);
    return () => window.removeEventListener('adalah-focus-quick-save', handleQuickSave);
  }, [output, isFocusMode]);

  const handleTriggerDraft = async () => {
    if (!prompt) {
      setErrorMsg("الرجاء إدخال توجيهات الصياغة أولاً.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setOutput("");
    
    try {
      const resp = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          // Fallback to data.text if data.output doesn't exist
          setOutput(data.output || data.text || "");
        } else {
          setErrorMsg(data.error || "حدث خطأ غير معروف في الصياغة.");
        }
      } else {
        setErrorMsg("فشل الاتصال بخادم صياغة الأنظمة العدلية بالذكاء الاصطناعي.");
      }
    } catch (err: any) {
      setErrorMsg("خطأ بروتوكول: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(err => console.error(err));
    setSuccessMsg("تم نسخ اللائحة بالكامل للحافظة لتصديرها لناجز!");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const applyTemplate = (tpl: string) => {
    if (tpl === "memo") {
      setPrompt("صياغة مذكرة رد جوابية في دعوى مطالبة بتسليم مستحقات مقاولة عقارية بقيمة 2.4 مليون ريال. الدفع بالتأخير في توريد المخططات الهندسية من طرف المدعي.");
      setType("memo");
    } else if (tpl === "contract") {
      setPrompt("صياغة عقد تقديم خدمات استشارية قانونية مع شركة حلول الذكاء للاتصالات. يلتزم الطرف الثاني بالحضور، والسرية، وتحديد الدفعات شهرياً، والشرط الجزائي وفق نظام المعاملات المدنية السعودي الجديد.");
      setType("contract");
    } else if (tpl === "lawsuit") {
      setPrompt("لائحة دعوى تصفية تركة مالية وقسمة أراضي زراعية بمحافظة الأحوال الشخصية بالدمام وتفويض المصفي المعتمد.");
      setType("lawsuit");
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      <div>
        <h2 className="text-xl font-bold text-[#c5a880] flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span>مركز صياغة الصحائف والأوراق القانونية بذكاء جيميناي (AI)</span>
        </h2>
        <p className="text-xs text-slate-900 mt-1">إنشاء أوراق الدفوع، وصحائف الدعاوى التجارية، مسودات العقود الممتثلة لنظام المعاملات المدنية السعودي الجديد.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Input parameters panel */}
        {!isFocusMode && (
          <div className="bg-[#0b1e33] border border-[#c5a880]/20 rounded-xl p-5 space-y-5 lg:col-span-5 text-xs">
            <h3 className="text-slate-200 font-bold border-b border-[#c5a880]/10 pb-2">تفاصيل الصياغة والمدخلات</h3>
            
            <div className="space-y-1.5">
              <label className="block text-slate-900">نوع الصك / اللائحة المراد تشكيلها:</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setType("memo")}
                  className={`py-2 px-3 rounded text-center border font-bold transition-all ${
                    type === "memo" ? "bg-[#c5a880]/15 text-[#c5a880] border-[#c5a880]" : "bg-[#11243f] border-slate-700 text-slate-900"
                  } `}
                >
                  مذكرة جوابية / اعتراض
                </button>
                <button
                  type="button"
                  onClick={() => setType("lawsuit")}
                  className={`py-2 px-3 rounded text-center border font-bold transition-all ${
                    type === "lawsuit" ? "bg-[#c5a880]/15 text-[#c5a880] border-[#c5a880]" : "bg-[#11243f] border-slate-700 text-slate-900"
                  } `}
                >
                  صحيفة دعوى جديدة
                </button>
                <button
                  type="button"
                  onClick={() => setType("contract")}
                  className={`py-2 px-3 rounded text-center border font-bold transition-all ${
                    type === "contract" ? "bg-[#c5a880]/15 text-[#c5a880] border-[#c5a880]" : "bg-[#11243f] border-slate-700 text-slate-900"
                  } `}
                >
                  مسودة عقد نظامي
                </button>
                <button
                  type="button"
                  onClick={() => setType("summarize")}
                  className={`py-2 px-3 rounded text-center border font-bold transition-all ${
                    type === "summarize" ? "bg-[#c5a880]/15 text-[#c5a880] border-[#c5a880]" : "bg-[#11243f] border-slate-700 text-slate-900"
                  } `}
                >
                  تلخيص حكم قضائي
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="block text-slate-900 font-bold">موجهات الطلب وصاحب الوقائع:</label>
              <textarea
                rows={6}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="اكتب تفاصيل النزاع، وأطراف التعاقد، والأسانيد المستند عليها هنا لإنشاء نص متكامل فائق الصياغة..."
                className="w-full bg-[#11243f] border border-[#c5a880]/30 rounded p-2.5 text-slate-100 placeholder-slate-500 font-sans leading-relaxed focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            {/* Quick legal templates */}
            <div className="space-y-1.5">
              <span className="block text-slate-900 font-bold">قوالب جاهزة مسهلة للتجريب (أنظمة سعودية):</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => applyTemplate("memo")}
                  className="bg-sky-50 border border-slate-800 text-slate-900 px-2 py-1 rounded[#c5a880]"
                >
                  📝 مذكرة جوابية (عقاري)
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("contract")}
                  className="bg-sky-50 border border-slate-800 text-slate-900 px-2 py-1 rounded[#c5a880]"
                >
                  📜 عقد خدمات (استشارات)
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("lawsuit")}
                  className="bg-sky-50 border border-slate-800 text-slate-900 px-2 py-1 rounded[#c5a880]"
                >
                  ⚖️ صحيفة حكم إرث وحصر
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#c5a880]/10">
              <button
                type="button"
                onClick={handleTriggerDraft}
                disabled={loading}
                className="w-full bg-[#c5a880] text-[#061224] text-xs font-bold py-3 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? "جاري تسبيب وصياغة اللائحة..." : "بدء الصياغة الذكية المحكمة"}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500 border border-red-500 text-rose-400 p-2.5 rounded text-center font-bold">
                {errorMsg}
              </div>
            )}

          </div>
        )}

        {/* Output section / Focus Mode layout */}
        <div className={`bg-[#0b1e33] border border-[#c5a880]/20 rounded-xl p-5 flex flex-col justify-between transition-all ${
          isFocusMode ? "lg:col-span-12 w-full max-w-4xl mx-auto min-h-[580px]" : "lg:col-span-7 min-h-[440px]"
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#c5a880]/15 pb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#c5a880]" />
                <strong className="text-slate-200 text-sm">المخرجات والنص القانوني المصوغ</strong>
              </div>
              
              <div className="flex items-center gap-2">
                {output && (
                  <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`px-3 py-1.5 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isFocusMode 
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-bold" 
                        : "bg-[#11243f] border-[#c5a880]/30 text-slate-300[#c5a880]/10"
                    }`}
                    title="تفعيل وضع القراءة والتركيز والتحكم في الخط واللون"
                  >
                    {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isFocusMode ? "خروج من وضع التركيز" : "وضع التركيز والقراءة"}</span>
                  </button>
                )}

                {output && (
                  <button
                    onClick={handleCopy}
                    className="bg-[#11243f] border border-[#c5a880]/30 text-amber-500 px-3 py-1.5 rounded text-xs[#c5a880]/10 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ اللائحة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Custom Focus Mode Readers Controls */}
            {isFocusMode && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 mb-2">
                {/* Font Families */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">الخط المفضل:</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setReadingFont("amiri")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${readingFont === "amiri" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}
                    >
                      خط أميري (شرعي)
                    </button>
                    <button 
                      onClick={() => setReadingFont("playfair")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${readingFont === "playfair" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}
                    >
                      ميريفاذر (سيريف)
                    </button>
                    <button 
                      onClick={() => setReadingFont("sans")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${readingFont === "sans" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}
                    >
                      خط عادي
                    </button>
                  </div>
                </div>

                {/* Sizing Controls */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">حجم الخط:</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setReadingFontSize("sm")}
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${readingFontSize === "sm" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300"}`}
                    >
                      A
                    </button>
                    <button 
                      onClick={() => setReadingFontSize("md")}
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${readingFontSize === "md" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300"}`}
                    >
                      A
                    </button>
                    <button 
                      onClick={() => setReadingFontSize("lg")}
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-base transition-all ${readingFontSize === "lg" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300"}`}
                    >
                      A
                    </button>
                    <button 
                      onClick={() => setReadingFontSize("xl")}
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-lg transition-all ${readingFontSize === "xl" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300"}`}
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Themes */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">سمة الصفحة:</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setReadingTheme("cream")}
                      className={`px-2.5 py-1 rounded-md transition-all border font-bold ${readingTheme === "cream" ? "bg-[#fdfaf2] text-[#2b2211] border-amber-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                    >
                      دقيق حليبي
                    </button>
                    <button 
                      onClick={() => setReadingTheme("paper")}
                      className={`px-2.5 py-1 rounded-md transition-all border font-bold ${readingTheme === "paper" ? "bg-[#fafafa] text-[#171717] border-amber-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                    >
                      ورق طبيعي
                    </button>
                    <button 
                      onClick={() => setReadingTheme("dark-onyx")}
                      className={`px-2.5 py-1 rounded-md transition-all border font-bold ${readingTheme === "dark-onyx" ? "bg-[#0b1329] text-[#f8fafc] border-amber-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                    >
                      سماء الليل
                    </button>
                  </div>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500 border border-emerald-500 text-emerald-400 p-2.5 rounded text-xs text-center font-bold">
                {successMsg}
              </div>
            )}

            {!output && !loading && (
              <div className="text-center py-24 text-slate-900 text-xs flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-slate-900" />
                <p>لم يتم صياغة أي لائحة بعد. حدد نوع الصحيفة من اليمين واضغط على زر الصياغة.</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-20 text-slate-900 space-y-4 flex flex-col items-center justify-center">
                <RefreshCw className="w-10 h-10 text-[#c5a880] animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">جاري مراجعة الأقضية والأسانيد في ديوان المظالم والأحكام السابقة...</p>
                  <p className="text-xs text-slate-900">تمثيل نصوص نظام المعاملات المدنية ولائحة المرافعات الشرعية السعودية.</p>
                </div>
              </div>
            )}

            {output && !loading && (
              <div className={`p-6 rounded-2xl leading-relaxed whitespace-pre-line text-justify select-all max-h-[500px] overflow-y-auto border-2 transition-all ${
                isFocusMode
                  ? `shadow-xl ${
                      readingTheme === "cream" ? "theme-cream" :
                      readingTheme === "paper" ? "theme-paper" : "theme-dark-onyx"
                    } ${
                      readingFont === "amiri" ? "font-amiri" :
                      readingFont === "playfair" ? "font-playfair" : "font-sans"
                    } ${
                      readingFontSize === "sm" ? "text-xs" :
                      readingFontSize === "md" ? "text-sm" :
                      readingFontSize === "lg" ? "text-base md:text-lg" : "text-lg md:text-2xl"
                    }`
                  : "bg-slate-950/40 border-[#c5a880]/20 text-xs text-slate-100 font-sans"
              }`}>
                {output}
              </div>
            )}

          </div>

          {!isFocusMode && (
            <div className="bg-amber-500 border border-amber-500 p-3 rounded-lg flex gap-2.5 mt-4 text-xs text-slate-900 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="leading-relaxed">
                <strong>تنويه نظامي:</strong> النص المتولد يمثل مسودة تمهيدية مسبكة بالذكاء الاصطناعي معتمدة على توجيه المحامي. ننصح بمراجعتها والتصديق عليها نظامياً وتعديل الأرقام والأسماء قبل ترحيلها لمنصة ناجز الرسمية.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
