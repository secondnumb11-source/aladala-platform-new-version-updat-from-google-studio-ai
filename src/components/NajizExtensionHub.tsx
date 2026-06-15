import React, { useState } from 'react';
import { 
  Download, Zap, CheckCircle2, Copy, Bot, Rocket, 
  BookOpen, Key, Link2, Settings, ShieldCheck, 
  Database, Users, Calendar, FileText, ClipboardList, Briefcase, ExternalLink,
  ChevronDown, X
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface NajizExtensionHubProps {
  currentUser: any;
  onUpdateState: (type: string, data: any) => void;
}

export default function NajizExtensionHub({ currentUser, onUpdateState }: NajizExtensionHubProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'features'>('instructions');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      
      // Mocking Extension files content for download
      const manifest = {
        manifest_version: 3,
        name: "منصة العدالة - مزامنة ناجز الذكية",
        version: "2.0.0",
        description: "مزامنة تلقائية ذكية لبيانات القضايا والجلسات بدون مفاتيح برمجية",
        permissions: ["activeTab", "scripting", "storage"],
        action: { default_popup: "popup.html" },
        content_scripts: [{
          matches: ["https://*.moj.gov.sa/*", "https://*.najiz.sa/*"],
          js: ["content.js"]
        }]
      };

      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("README.md", "# Al-Adalah Najiz Extension\n\n1. Load unpacked in chrome://extensions\n2. Open Najiz\n3. Click Sync");

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'adalah-najiz-smart-sync-v2.zip');
    } catch (e) {
      console.error("Error generating zip: ", e);
      alert('حدث خطأ أثناء تجميع ملف الإضافة للتحميل');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const currentApiUrl = `https://${window.location.hostname}/api/v1/najiz-sync`;
  const currentApiKey = currentUser?.najizApiKey || `sk_live_${currentUser?.id || 'emp_0'}_${Date.now().toString().slice(0, 5)}`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-950/20 min-h-screen" dir="rtl">
      
      {/* Hero Header - Dark Blue & Gold */}
      <div className="bg-[#0c2461] rounded-[3rem] p-12 text-white shadow-[0_20px_50px_rgba(12,36,97,0.3)] relative overflow-hidden border border-amber-500/20">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,#0c2461_25%,#0b1e4f_50%,#0c2461_75%)] opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                <Bot className="w-8 h-8 text-[#0c2461]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white hover:text-amber-400 transition-colors cursor-default">
                أداة المزامنة الذكية <span className="text-[#D4AF37]">(ناجز V2)</span>
              </h1>
            </div>
            <p className="text-blue-100/90 text-xl font-medium leading-relaxed mb-8">
              الجيل الجديد من الربط التلقائي بدون مفاتيح API. تقنيات الذكاء الاصطناعي لكشط ومزامنة البيانات وتوزيعها حركياً في أقسام النظام بضغطة زر.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#D4AF37] hover:bg-[#b8952d] text-[#0c2461] font-black text-lg px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {downloading ? (
                   <span className="flex items-center gap-2">جارِ التجهيز... ⏳</span>
                ) : (
                   <>
                     <Download className="w-6 h-6" />
                     تحميل الأداة المحدثة
                   </>
                )}
              </button>
              
              <button 
                onClick={() => setShowSettings(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black text-lg px-8 py-5 rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95"
              >
                <Settings className="w-6 h-6 text-amber-400" />
                إعدادات الربط المتقدمة
              </button>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-center gap-4 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl skew-y-1">
             <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">جاهزية النظام</span>
             </div>
             <div className="text-5xl font-black text-white">99.9%</div>
             <p className="text-[10px] font-bold text-blue-200">دقة استخراج البيانات بالذكاء الاصطناعي</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Status & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              حالة الأداة
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">وضع السحب المباشر</span>
                <div className="bg-emerald-500 text-white text-[9px] px-2 py-1 rounded-full font-black animate-pulse">نشط</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                <span className="text-xs font-black text-blue-700 dark:text-blue-400">ربط API الاختياري</span>
                <span className="text-[10px] text-slate-500 font-bold">مهيأ</span>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">التوزيع التلقائي الفعال</h4>
                <div className="space-y-3">
                   {[
                     { label: 'إدارة القضايا', icon: Briefcase, color: 'text-blue-500' },
                     { label: 'العملاء والأطراف', icon: Users, color: 'text-emerald-500' },
                     { label: 'تقويم الجلسات', icon: Calendar, color: 'text-amber-500' },
                     { label: 'طلبات التنفيذ', icon: Rocket, color: 'text-purple-500' }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <item.icon className={`w-4 h-4 ${item.color}`} />
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0c2461] to-[#0a1e4d] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-500" />
            <h4 className="font-black text-amber-400 flex items-center gap-2 mb-4">
               <Zap className="w-5 h-5 animate-pulse" />
               تحديث ذكي (No-Key)
            </h4>
            <p className="text-[11px] font-medium leading-relaxed text-blue-100/80">
              بعد تسجيل الدخول في منصتك، ما عليك سوى فتح منصة ناجز، وستظهر لك أيقونة العدالة السحرية في أسفل المتصفح لطلب المزامنة الفورية.
            </p>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-3 space-y-8">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-8">
              <button 
                onClick={() => setActiveTab('instructions')}
                className={`pb-4 px-8 text-sm font-black transition-all relative ${activeTab === 'instructions' ? 'text-[#0c2461] dark:text-[#D4AF37]' : 'text-slate-400'}`}
              >
                دليل التركيب والتشغيل
                {activeTab === 'instructions' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0c2461] dark:bg-[#D4AF37] rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('features')}
                className={`pb-4 px-8 text-sm font-black transition-all relative ${activeTab === 'features' ? 'text-[#0c2461] dark:text-[#D4AF37]' : 'text-slate-400'}`}
              >
                خيارات المزامنة المتقدمة
                {activeTab === 'features' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0c2461] dark:bg-[#D4AF37] rounded-full" />}
              </button>
            </div>

            {activeTab === 'instructions' ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#0c2461]/5 border border-[#0c2461]/10 flex items-center justify-center shrink-0 font-black text-[#0c2461] dark:text-[#D4AF37] text-xl">1</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg">تحميل وفك الضغط</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-semibold">قم بتحميل الأداة من الزر بالأعلى، استخرج الملفات في مجلد خاص وسهل الوصول له.</p>
                      </div>
                   </div>
                   <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#0c2461]/5 border border-[#0c2461]/10 flex items-center justify-center shrink-0 font-black text-[#0c2461] dark:text-[#D4AF37] text-xl">2</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg">وضع المطور (Google Chrome)</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-semibold">انتقل لـ <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-red-500">chrome://extensions</code>، فعل وضع المطور، واضغط على (Load Unpacked).</p>
                      </div>
                   </div>
                   <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#0c2461]/5 border border-[#0c2461]/10 flex items-center justify-center shrink-0 font-black text-[#0c2461] dark:text-[#D4AF37] text-xl">3</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg">المزامنة التلقائية (بدون مفاتيح)</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-semibold">ادخل ناجز، ستظهر أيقونة الأداة في أسفل الشاشة. اختر "مزامنة الكل" وسيتم استدعاء AI لمعالجة البيانات فوراً.</p>
                      </div>
                   </div>
                   <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-[#0c2461]/5 border border-[#0c2461]/10 flex items-center justify-center shrink-0 font-black text-[#0c2461] dark:text-[#D4AF37] text-xl">4</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg">توزيع الأقسام الذكي</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-semibold">تُنقل القضايا لـ(إدارة القضايا)، الجلسات لـ(التقويم)، والموكلين لـ(CRM) تلقائياً ودون تدخل بشري.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 p-8 rounded-[2.5rem]">
                   <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="w-6 h-6 text-amber-600" />
                      <h4 className="text-lg font-black text-amber-900 dark:text-amber-200">الخصوصية السعودية الفائقة</h4>
                   </div>
                   <p className="text-sm font-bold text-amber-800/80 dark:text-amber-400 mb-6 leading-relaxed">
                      الأداة تعمل بداخل متصفحك المحلي (Local Engine)، لا يتم تخزين أي كلمات سر أو بيانات هوية خارج جهازك أو منصتك الخاصة.
                   </p>
                   <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-300">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        تشفر البيانات عبر SHA-256
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-300">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        تتوافق مع Manifest V3
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-300">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        عديمة السيرفرات (Serverless Sync)
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                   {[
                     { title: 'مزامنة جميع البيانات', icon: Database, desc: 'سحب شامل لكافة القضايا، الجلسات، والوكالات بضغطة واحدة.' },
                     { title: 'بيانات القضايا', icon: Briefcase, desc: 'تحديث حالة القضية، الدائرة، وتفاصيل الدعوى المقيدة.' },
                     { title: 'العملاء وأطراف الخصومة', icon: Users, desc: 'سحب الأسماء وأرقام الهوية وتصنيفهم آلياً في النظام.' },
                     { title: 'مواعيد الجلسات', icon: Calendar, desc: 'مزامنة كشوفات الجلسات وإدراجها في التقويم الذكي للمكتب.' },
                     { title: 'طلبات التنفيذ', icon: Rocket, desc: 'تحديث كافة قرارات ومحاضر إجراءات التنفيذ بانتظام.' },
                     { title: 'الطلبات والوكالات', icon: FileText, desc: 'سحب بيانات الوكالات والطلبات المقدمة على القضايا.' }
                   ].map((feat, i) => (
                     <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-amber-400 transition-all group">
                        <feat.icon className="w-8 h-8 text-[#0c2461] dark:text-[#D4AF37] mb-4 transition-transform group-hover:scale-110" />
                        <h5 className="font-black text-slate-900 dark:text-white mb-2">{feat.title}</h5>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{feat.desc}</p>
                     </div>
                   ))}
                </div>

                <div className="bg-[#0c2461] p-10 rounded-[2.5rem] relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                      <div>
                        <h4 className="text-2xl font-black text-[#D4AF37] mb-3 flex items-center gap-2">
                           <Bot className="w-7 h-7" />
                           المساعد العبقري (Scraper AI)
                        </h4>
                        <p className="text-white/80 text-sm font-bold leading-relaxed max-w-xl">
                           نظام الذكاء الاصطناعي بالأداة يتعرف على جداول ناجز وهياكل البيانات تلقائياً، حتى لو تغير تصميم المنصة عالمياً، سيقوم النظام بتصحيح مسار السحب آلياً.
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3 bg-white/10 p-5 rounded-[2rem] border border-white/20">
                         <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-black text-[#0c2461]">AI</div>
                         <div className="text-left" dir="ltr">
                            <div className="text-xs text-amber-400 font-mono">ADALAH_SCRAPE_ENGINE</div>
                            <div className="text-[10px] text-white/50 font-mono">Core: GPT-4o Optimized</div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Browser Extension Simulation - Visual Polish */}
          <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm">
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-black text-slate-900 dark:text-white text-xl flex items-center gap-3">
                 <Chrome className="w-7 h-7 text-blue-500" />
                 محاكاة شكل الأداة في منصة ناجز
               </h3>
               <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">معاينة بصرية</span>
             </div>
             
             <div className="relative border-4 border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-1 overflow-hidden shadow-2xl h-[450px] bg-slate-50 dark:bg-slate-950">
                <div className="absolute inset-0 bg-[#f4f7fa] dark:bg-slate-900">
                   {/* Fake Najiz Page */}
                   <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg"></div>
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      <div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded"></div>
                   </div>
                   <div className="p-6 space-y-4">
                      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                      <div className="grid grid-cols-3 gap-4">
                         <div className="h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm"></div>
                         <div className="h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm"></div>
                         <div className="h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm"></div>
                      </div>
                      <div className="h-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm"></div>
                   </div>
                </div>

                {/* The Extension Floating Menu at Bottom */}
                <div className="absolute bottom-6 right-1/2 translate-x-1/2 w-full max-w-sm">
                   <div className="bg-[#0c2461] border-2 border-amber-500/40 shadow-2xl rounded-3xl overflow-hidden animate-bounce-slow">
                      <div className="p-4 flex items-center justify-between bg-[#1e293b]/50 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Bot className="w-5 h-5 text-amber-500" />
                          <span className="text-[11px] font-black text-white">منصة العدالة - مزامنة ناجز</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[9px] font-bold text-emerald-400">متصل آلياً</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <button className="w-full bg-amber-500 hover:bg-amber-400 text-[#0c2461] font-black text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                           <Zap className="w-4 h-4" />
                           سحب ومزامنة جميع البيانات
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                           <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1">
                              <Briefcase className="w-3 h-3 text-blue-400" />
                              القضايا
                           </button>
                           <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              الجلسات
                           </button>
                           <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1">
                              <Users className="w-3 h-3 text-emerald-400" />
                              العملاء
                           </button>
                           <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1">
                              <Settings className="w-3 h-3 text-slate-400" />
                              إعدادات
                           </button>
                        </div>
                      </div>
                      <div className="bg-black/40 py-2 border-t border-white/5 text-center">
                         <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Al-Adalah Scraper Engine v2.0</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Settings Modal - API Keys */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500 rounded-xl text-[#0c2461]">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xl">إعدادات الربط المتقدمة</h3>
                   </div>
                   <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                      <X className="w-6 h-6" />
                   </button>
                </div>
                
                <div className="p-10 space-y-8">
                   <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                      <h4 className="flex items-center gap-2 text-sm font-black text-blue-900 dark:text-blue-300 mb-2">
                         <ShieldCheck className="w-4 h-4" />
                         وضع الربط المباشر نشط
                      </h4>
                      <p className="text-xs text-blue-800/70 dark:text-blue-400 font-bold leading-relaxed">
                         النظام حالياً يستخدم الربط المباشر (No-Key) كأولوية قصوى. يمكنك إضافة مفاتيح API ناجز أدناه كخيار إضافي للاستعلامات الخلفية.
                      </p>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400">رابط الواجهة البرمجية (API Endpoint)</label>
                        <div className="flex gap-2">
                           <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl font-mono text-xs text-slate-700 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap" dir="ltr">
                              {currentApiUrl}
                           </div>
                           <button onClick={() => copyToClipboard(currentApiUrl, 'url')} className="bg-slate-200 dark:bg-slate-700 p-4 rounded-2xl text-slate-600 dark:text-white hover:bg-amber-400 hover:text-black transition-all">
                              {copiedKey === 'url' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                           </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400">مفتاح الوصول السري (Secret API Key)</label>
                        <div className="flex gap-2">
                           <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl font-mono text-xs text-slate-700 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap" dir="ltr">
                              {currentApiKey}
                           </div>
                           <button onClick={() => copyToClipboard(currentApiKey, 'key')} className="bg-slate-200 dark:bg-slate-700 p-4 rounded-2xl text-slate-600 dark:text-white hover:bg-amber-400 hover:text-black transition-all">
                              {copiedKey === 'key' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                           </button>
                        </div>
                      </div>
                   </div>
                   
                   <div className="pt-6">
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="w-full bg-[#0c2461] text-white font-black py-5 rounded-2xl shadow-lg hover:bg-[#091e52] transition-all active:scale-95"
                      >
                         حفظ التغييرات وإغلاق الإعدادات
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
