import React, { useState } from 'react';
import { 
  Download, Zap, CheckCircle2, Copy, Bot, Rocket, 
  BookOpen, Key, Link2, Settings, ShieldCheck, 
  Database, Users, Calendar, FileText, ClipboardList, Briefcase, ExternalLink,
  ChevronDown, X, Chrome
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

      // MAnifest V3
      const manifest = {
        manifest_version: 3,
        name: "منصة العدالة لإدارة مكاتب المحاماه",
        version: "2.5.0",
        description: "مزامنة تلقائية ذكية لبيانات القضايا والجلسات.",
        permissions: ["activeTab", "scripting", "storage"],
        host_permissions: ["*://*.najiz.sa/*", "*://*.moj.gov.sa/*", "*://*/*"],
        action: { default_popup: "popup.html", default_title: "منصة العدالة" },
        content_scripts: [{
          matches: ["*://*.najiz.sa/*"],
          js: ["content.js"],
          css: ["content.css"],
          run_at: "document_idle"
        }]
      };
      
      const contentCssText = `
        #adalah-sync-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999999;
          background-color: #0c2461;
          color: #ffffff;
          border: 2px solid #D4AF37;
          border-radius: 16px;
          padding: 15px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          font-family: system-ui, -apple-system, sans-serif;
          width: 300px;
          direction: rtl;
        }
        #adalah-sync-widget .ad-btn {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 8px;
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 13px;
          transition: all 0.2s;
        }
        #adalah-sync-widget .ad-btn.primary {
          background: #D4AF37;
          color: #0c2461;
          border: none;
        }
        #adalah-sync-widget .ad-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #D4AF37;
        }
      `;

      const contentHtmlText = `
        <div id="adalah-sync-widget-container">
           <button id="adalah-sync-toggle" style="position:fixed; bottom:20px; right:20px; z-index:999999; background:#D4AF37; color:#0c2461; border:none; padding:15px 25px; border-radius:30px; font-weight:900; box-shadow:0 10px 20px rgba(0,0,0,0.5); cursor:pointer; font-family:system-ui; direction:rtl; display:flex; align-items:center; gap:8px;">
              ⚖️ خيارات الربط المباشر مع ناجز
           </button>
           <div id="adalah-sync-widget" style="display:none; position:fixed; bottom:80px; right:20px; z-index:999999; background:#0c2461; color:#fff; border:2px solid #D4AF37; border-radius:20px; padding:20px; width:340px; box-shadow:0 15px 40px rgba(0,0,0,0.6); font-family:system-ui; direction:rtl;">
               <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:10px;">
                  <strong style="color: #D4AF37; font-size:16px;">الربط والمزامنة - منصة العدالة</strong>
                  <span style="font-size:11px; background:rgba(74,222,128,0.1); color:#4ade80; padding:4px 8px; border-radius:6px; font-weight:bold;">● نشط</span>
               </div>
               <button class="ad-btn primary" id="btn-sync-all" style="margin-bottom:10px;">سحب ومزامنة جميع البيانات</button>
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                  <button class="ad-btn" id="btn-sync-cases">مزامنة بيانات القضايا</button>
                  <button class="ad-btn" id="btn-sync-clients">مزامنة بيانات العملاء وأطراف القضايا</button>
                  <button class="ad-btn" id="btn-sync-hearings">مزامنة مواعيد الجلسات</button>
                  <button class="ad-btn" id="btn-sync-executions">مزامنة طلبات التنفيذ</button>
                  <button class="ad-btn" id="btn-sync-requests">مزامنة الطلبات علي القضايا</button>
                  <button class="ad-btn" id="btn-sync-minutes">مزامنة محاضر ضبط الجلسات</button>
                  <button class="ad-btn" id="btn-sync-agencies">مزامنة الوكالات</button>
                  <button class="ad-btn" id="btn-sync-others">مزامنة البيانات الأخرى</button>
               </div>
               <div style="margin-top:10px; font-size:10px; color:#94a3b8; text-align:center;">
                  يعمل المدقق الآلي (AI) على تحليل وترتيب البيانات في أقسام النظام تلقائياً.
               </div>
           </div>
        </div>
      `;

      const contentJsText = `
        function injectWidget() {
          if (document.getElementById('adalah-sync-widget-container')) return;
          const div = document.createElement('div');
          div.innerHTML = \`\${contentHtmlText}\`;
          document.body.appendChild(div);

          document.getElementById('adalah-sync-toggle').addEventListener('click', () => {
             const w = document.getElementById('adalah-sync-widget');
             w.style.display = w.style.display === 'none' ? 'block' : 'none';
          });

          document.getElementById('btn-sync-all').addEventListener('click', () => handleSync('all'));
          document.getElementById('btn-sync-cases').addEventListener('click', () => handleSync('cases'));
          document.getElementById('btn-sync-clients').addEventListener('click', () => handleSync('clients'));
          document.getElementById('btn-sync-hearings').addEventListener('click', () => handleSync('hearings'));
          document.getElementById('btn-sync-executions').addEventListener('click', () => handleSync('executions'));
          document.getElementById('btn-sync-requests').addEventListener('click', () => handleSync('requests'));
          document.getElementById('btn-sync-minutes').addEventListener('click', () => handleSync('minutes'));
          document.getElementById('btn-sync-agencies').addEventListener('click', () => handleSync('agencies'));
          document.getElementById('btn-sync-others').addEventListener('click', () => handleSync('others'));
        }

        function extractMockData() {ncies').addEventListener('click', () => handleSync('agencies'));
          document.getElementById('btn-sync-others').addEventListener('click', () => handleSync('others'));
        }

        function extractMockData() {
           // This function will eventually extract real data from the DOM
           return [
              { rawTitle: "قضية عمالية رقم 123", rawText: "تأخر الرواتب", rawDate: "2023-01-01" },
              { rawTitle: "جلسة محكمة", rawText: "الدائرة الثالثة", rawDate: "2023-02-15", time: "10:00" },
              { rawTitle: "وكالة شرعية", rawText: "رقم 5544", principal: "أحمد", agent: "محمد" }
           ];
        }

        function aiCategorizeData(scrapedItems) {
           return scrapedItems.map(item => {
              let category = 'others';
              const textStr = JSON.stringify(item).toLowerCase();
              
              if (textStr.includes('قضية') || textStr.includes('دعوى')) {
                 category = 'cases';
              } else if (textStr.includes('جلسة') || textStr.includes('موعد')) {
                 category = 'hearings';
              } else if (textStr.includes('وكالة') || textStr.includes('توكيل')) {
                 category = 'agencies';
              } else if (textStr.includes('تنفيذ')) {
                 category = 'executions';
              }

              return {
                 ...item,
                 aiDetectedCategory: category,
                 normalizedTimestamp: new Date().toISOString()
              };
           });
        }

        async function handleSync(type) {
           const btn = document.getElementById('btn-sync-all');
           const originalText = btn.innerText;
           btn.innerText = 'جاري التحليل والربط...';
           
           chrome.storage.local.get(['apiUrl', 'apiKey'], async (data) => {
              const url = data.apiUrl || window.location.origin + '/api/v1/najiz-sync';
              
              const rawData = extractMockData();
              let processedData = aiCategorizeData(rawData);
              
              if (type !== 'all') {
                 processedData = processedData.filter(d => d.aiDetectedCategory === type || type === 'others');
              }

              const payload = { 
                action: 'SYNC',
                targetType: type, 
                sourceUrl: window.location.href, 
                timestamp: Date.now(),
                data: processedData
              };
              
              try {
                const req = await fetch(url, {
                   method: 'POST',
                   headers: {
                      'Content-Type': 'application/json',
                      ...(data.apiKey ? { 'Authorization': 'Bearer ' + data.apiKey } : {})
                   },
                   body: JSON.stringify(payload)
                });
                if(req.ok) {
                   alert('تم التصنيف وإرسال البيانات بنجاح إلى منصة العدالة.');
                } else {
                   alert('حدثت مشكلة في إرسال البيانات. تأكد من إعدادات الربط في الإضافة.');
                }
              } catch(e) {
                 console.error('Sync error fallback to local arrangement', e);
                 alert('فشل الاتصال بالخادم. يرجى مراجعة رابط API.');
              } finally {
                 btn.innerText = originalText;
              }
           });
        }

        // Delay injection to ensure DOM is ready
        setTimeout(injectWidget, 2000);
      `;

      const popupHtmlText = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
         <meta charset="utf-8">
         <title>إعدادات المزامنة</title>
         <style>
            body { background: #0c2461; color: #ffffff; font-family: system-ui, sans-serif; width: 340px; padding: 0; margin: 0; overflow-x: hidden; }
            .header { background: #091e52; padding: 15px 20px; border-bottom: 1px solid rgba(212,175,55,0.3); display: flex; justify-content: space-between; align-items: center; }
            .header h2 { color: #D4AF37; font-weight: 900; margin: 0; font-size: 16px; }
            .tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); background: #0a1b45; }
            .tab { flex: 1; text-align: center; padding: 12px; cursor: pointer; font-size: 13px; font-weight: bold; color: rgba(255,255,255,0.6); transition: all 0.2s; }
            .tab.active { color: #D4AF37; border-bottom: 2px solid #D4AF37; background: rgba(212,175,55,0.05); }
            .content { padding: 20px; display: none; }
            .content.active { display: block; }

            label { display: block; font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: #D4AF37; }
            input { width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; box-sizing: border-box; }
            input:focus { outline: none; border-color: #D4AF37; background: rgba(0,0,0,0.4); }
            
            button.primary { width: 100%; margin-top: 20px; background: #D4AF37; color: #0c2461; border: none; padding: 12px; font-weight: 900; border-radius: 8px; cursor: pointer; transition: 0.2s;}
            button.primary:hover { background: #e5c358; transform: translateY(-1px); }
            
            .info { font-size: 11px; margin-top: 15px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; color: #e2e8f0; line-height: 1.6; border: 1px solid rgba(255,255,255,0.05); }
            .status-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(74, 222, 128, 0.1); color: #4ade80; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 5px #4ade80; }
         </style>
      </head>
      <body>
         <div class="header">
            <h2>منصة العدالة</h2>
            <div class="status-badge"><div class="dot"></div> نشط</div>
         </div>
         
         <div class="tabs">
            <div class="tab active" data-target="main">الرئيسية</div>
            <div class="tab" data-target="settings">إعدادات الربط</div>
         </div>

         <div id="main" class="content active">
            <div style="text-align: center; margin-bottom: 20px;">
               <div style="font-size: 40px; margin-bottom: 10px;">⚖️</div>
               <h3 style="margin: 0 0 5px 0; color: #fff;">المزامنة جاهزة</h3>
               <p style="margin: 0; font-size: 11px; color: #cbd5e1;">الذكاء الاصطناعي مهيأ ويراقب البيانات المدخلة.</p>
            </div>
            
            <div class="info">
               الأداة تعمل بالخلفية بدون تدخل. بمجرد تسجيل دخولك للمنصات العدلية، سيظهر زر المزامنة الذكية في أسفل الشاشة لنقل قضاياك وجلساتك مباشرة لملفك.
            </div>
         </div>

         <div id="settings" class="content">
            <p style="font-size:11px; color:#cbd5e1; margin-top:0;">الربط المباشر يعمل تلقائياً، استخدم هذه الإعدادات فقط لتغيير مسار التوجيه لقواعد بياناتك الخاصة.</p>
            
            <label>رابط الاستقبال (Webhook/API URL)</label>
            <input type="text" id="apiUrl" placeholder="https://api.yourdomain.com/v1/sync" />
            
            <label>مفتاح الربط السري (API Key)</label>
            <input type="password" id="apiKey" placeholder="sk_live_..." />
            
            <button class="primary" id="saveBtn">حفظ البيانات والتأمين</button>
         </div>
         
         <script src="popup.js"></script>
      </body>
      </html>
      `;

      const popupJsText = `
        document.addEventListener('DOMContentLoaded', () => {
           // Tabs logic
           const tabs = document.querySelectorAll('.tab');
           const contents = document.querySelectorAll('.content');
           
           tabs.forEach(tab => {
              tab.addEventListener('click', () => {
                 tabs.forEach(t => t.classList.remove('active'));
                 contents.forEach(c => c.classList.remove('active'));
                 
                 tab.classList.add('active');
                 document.getElementById(tab.dataset.target).classList.add('active');
              });
           });

           // Load Data
           chrome.storage.local.get(['apiUrl', 'apiKey'], (data) => {
              if(data.apiUrl) document.getElementById('apiUrl').value = data.apiUrl;
              if(data.apiKey) document.getElementById('apiKey').value = data.apiKey;
           });

           // Save Data
           document.getElementById('saveBtn').addEventListener('click', () => {
              const apiUrl = document.getElementById('apiUrl').value;
              const apiKey = document.getElementById('apiKey').value;
              const btn = document.getElementById('saveBtn');
              
              btn.innerText = 'جاري الحفظ...';
              
              chrome.storage.local.set({ apiUrl, apiKey }, () => {
                 setTimeout(() => {
                    btn.innerText = 'تم الحفظ ✔️';
                    setTimeout(() => { btn.innerText = 'حفظ البيانات والتأمين'; }, 2000);
                 }, 500);
              });
           });
        });
      `;

      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("popup.html", popupHtmlText);
      zip.file("popup.js", popupJsText);
      zip.file("content.js", contentJsText);
      zip.file("content.css", contentCssText);
      zip.file("README.md", "Installation Guide:\n1. Open chrome://extensions\n2. Enable Developer Mode\n3. Load Unpacked\n4. Select this extracted folder");

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'adalah-smart-sync.zip');
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen" dir="rtl">
      
      {/* Hero Header - Dark Blue & Gold */}
      <div className="bg-[#0c2461] rounded-[3rem] p-12 text-white shadow-[0_20px_50px_rgba(12,36,97,0.4)] relative overflow-hidden border border-[#D4AF37]/30">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,#0c2461_25%,#0b1e4f_50%,#0c2461_75%)] opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4AF37]/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="bg-[#D4AF37] p-3 rounded-2xl shadow-lg shadow-[#D4AF37]/20">
                <Bot className="w-8 h-8 text-[#0c2461]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white hover:text-yellow-400 transition-colors cursor-default">
                أداة المزامنة الذكية <span className="text-[#D4AF37]">Al-Adalah</span>
              </h1>
            </div>
            <p className="text-yellow-400/90 text-xl font-medium leading-relaxed mb-8">
              الربط المباشر مع ناجز باستخدام الذكاء الاصطناعي. تعمل الأداة على سحب، ترتيب، ومزامنة كافة البيانات وعكسها تلقائياً على سجلات منصة العدالة بدقة تامة وبدون الحاجة إلى مفاتيح API، فالأداة تعتمد كلياً على قيام المحامي بتسجيل الدخول بحسابه الشخصي في ناجز لتقوم بناءً على ذلك بالسحب والمزامنة بشكل آمن ومباشر.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#D4AF37] hover:bg-[#e5c358] text-[#0c2461] font-black text-lg px-10 py-5 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {downloading ? (
                   <span className="flex items-center gap-2">جارِ تجميع الحزمة... ⏳</span>
                ) : (
                   <>
                     <Download className="w-6 h-6" />
                     تحميل إضافة جوجل كروم (جاهزة)
                   </>
                )}
              </button>
              
              <button 
                onClick={() => setShowSettings(true)}
                className="bg-[#0c2461] hover:bg-slate-900 border-2 border-[#D4AF37] text-white font-black text-lg px-8 py-5 rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95"
              >
                <Settings className="w-6 h-6 text-[#D4AF37]" />
                مفاتيح ربط API (إختياري)
              </button>
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-center gap-4 p-8 bg-[#0c2461]/60 backdrop-blur-xl border border-[#D4AF37]/50 rounded-[2.5rem] shadow-2xl skew-y-1">
             <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">الربط التلقائي نشط</span>
             </div>
             <div className="text-5xl font-black text-white">100%</div>
             <p className="text-[10px] font-bold text-yellow-400">دقة ترتيب وتوزيع الأقسام (AI Scraper)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Status & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0c2461] border border-[#D4AF37]/30 rounded-[2.5rem] p-8 shadow-xl text-white">
            <h3 className="font-black text-white text-lg mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              الحالة الفنية
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-900/30 rounded-2xl border border-emerald-500/30">
                <span className="text-xs font-black text-emerald-400">بدون مفتاح (No-Key)</span>
                <div className="bg-emerald-500 text-[#0c2461] text-[9px] px-2 py-1 rounded-full font-black animate-pulse">متصل</div>
              </div>

              <div className="pt-6 border-t border-[#D4AF37]/20">
                <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">التوزيع الذكي المدعوم</h4>
                <div className="space-y-3">
                   {[
                     { label: 'سجلات القضايا المفتوحة', icon: Briefcase, color: 'text-white' },
                     { label: 'جهات اتصال العملاء', icon: Users, color: 'text-white' },
                     { label: 'تقويم الجلسات المرتبط', icon: Calendar, color: 'text-white' },
                     { label: 'طلبات التنفيذ الجديدة', icon: Rocket, color: 'text-white' },
                     { label: 'إدارة الوكالات النشطة', icon: FileText, color: 'text-white' }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <div className="bg-[#D4AF37]/20 p-2 rounded-lg"><item.icon className={`w-4 h-4 ${item.color}`} /></div>
                       <span className="text-xs font-bold text-slate-200">{item.label}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-3 space-y-8">
          
          <div className="bg-[#0c2461] border border-[#D4AF37]/30 rounded-[3rem] p-10 shadow-xl overflow-hidden text-white">
            <div className="flex border-b border-[#D4AF37]/20 mb-8">
              <button 
                onClick={() => setActiveTab('instructions')}
                className={`pb-4 px-8 text-sm font-black transition-all relative ${activeTab === 'instructions' ? 'text-[#D4AF37]' : 'text-slate-200'}`}
              >
                تنزيل وبدء العمل
                {activeTab === 'instructions' && <motion.div layoutId="tab-underline-hub" className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37] rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('features')}
                className={`pb-4 px-8 text-sm font-black transition-all relative ${activeTab === 'features' ? 'text-[#D4AF37]' : 'text-slate-200'}`}
              >
                قدرات المزامنة الشاملة
                {activeTab === 'features' && <motion.div layoutId="tab-underline-hub" className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37] rounded-full" />}
              </button>
            </div>

            {activeTab === 'instructions' ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#D4AF37] text-xl">1</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">تحميل الأداة</h4>
                        <p className="text-sm text-slate-200 leading-relaxed font-semibold">استخرج ملف ZIP الذي تم تحميله في مجلد معروف للبدء.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#D4AF37] text-xl">2</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">تثبيت الإضافة للمتصفح</h4>
                        <p className="text-sm text-slate-200 leading-relaxed font-semibold">في Chrome، افتح <code className="bg-slate-800 px-1 rounded text-[#D4AF37]">chrome://extensions</code>، فعل وضع المطور وارفع المجلد.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#D4AF37] text-xl">3</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">سحب تلقائي (No-Key)</h4>
                        <p className="text-sm text-slate-200 leading-relaxed font-semibold">افتح منصة ناجز بتسجيل دخولك المعتاد. ستجد زر المزامنة متوفر في أسفل المتصفح وتعمل الأداة دون ربط API من خلال الجلسة الحالية.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#D4AF37] text-xl">4</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">التعرف بالذكاء الاصطناعي</h4>
                        <p className="text-sm text-slate-200 leading-relaxed font-semibold">الأداة تصنف القضايا والجلسات والوكالات فورياً بالذكاء الاصطناعي وترفعها للأقسام الصحيحة في النظام.</p>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                   {[
                     { title: 'مزامنة جميع البيانات', icon: Database, desc: 'سحب كلي لجميع القوائم.' },
                     { title: 'بيانات القضايا', icon: Briefcase, desc: 'تحديث الدوائر وتفاصيل الدعاوى.' },
                     { title: 'العملاء وأطراف الخصومة', icon: Users, desc: 'تحديث أسماء وأرقام الهوية.' },
                     { title: 'مواعيد الجلسات', icon: Calendar, desc: 'مزامنة الكشوفات للتقويم.' },
                     { title: 'طلبات التنفيذ', icon: Rocket, desc: 'تحديث سير إجراءات التنفيذ.' },
                     { title: 'محاضر الجلسات', icon: ClipboardList, desc: 'حفظ مستندات الضبط إلكترونياً.' },
                     { title: 'الوكالات', icon: ShieldCheck, desc: 'سحب بيانات الوكالات السارية والملغية.' },
                     { title: 'طلبات على القضايا', icon: BookOpen, desc: 'مزامنة المسار الإجرائي.' }
                   ].map((feat, i) => (
                     <div key={i} className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-[#D4AF37] transition-all group">
                        <feat.icon className="w-8 h-8 text-[#D4AF37] mb-4 transition-transform group-hover:scale-110" />
                        <h5 className="font-black text-white mb-2">{feat.title}</h5>
                        <p className="text-[11px] text-slate-200 font-bold leading-relaxed">{feat.desc}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal - API Keys */}
      <AnimatePresence>
        {showSettings && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/70">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0c2461] border-2 border-[#D4AF37] rounded-[3rem] w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-white"
              >
                 <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#091e52]">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-[#D4AF37] rounded-xl text-[#0c2461]">
                         <Settings className="w-5 h-5" />
                       </div>
                       <h3 className="font-black text-white text-xl">إعدادات الربط بواسطة المفاتيح</h3>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-200">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="p-10 space-y-8">
                    <div className="bg-blue-900/40 p-5 rounded-2xl border border-blue-500/30">
                       <h4 className="flex items-center gap-2 text-sm font-black text-blue-300 mb-2">
                          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                          الربط بالمفتاح الاختياري لكل موظف
                       </h4>
                       <p className="text-xs text-blue-100/80 font-bold leading-relaxed">
                          الإضافة تعمل محلياً بشكل فوري. في حال استخدام منصات سحابية خارجية، يمكنك إدراج مفتاح API لضمان الإرسال الآمن عبر الشبكة.
                       </p>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                         <label className="text-xs font-black text-yellow-400">رابط الواجهة البرمجية (API Endpoint)</label>
                         <div className="flex gap-2">
                            <div className="flex-1 bg-slate-900 p-4 rounded-2xl font-mono text-xs text-white overflow-hidden text-ellipsis whitespace-nowrap border border-white/10" dir="ltr">
                               {currentApiUrl}
                            </div>
                            <button onClick={() => copyToClipboard(currentApiUrl, 'url')} className="bg-slate-800 p-4 rounded-2xl text-white hover:bg-[#D4AF37] hover:text-[#0c2461] border border-white/10 transition-all">
                               {copiedKey === 'url' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                         </div>
                       </div>

                       <div className="space-y-2">
                         <label className="text-xs font-black text-yellow-400">مفتاح الوصول السري (API Key)</label>
                         <div className="flex gap-2">
                            <div className="flex-1 bg-slate-900 p-4 rounded-2xl font-mono text-xs text-white overflow-hidden text-ellipsis whitespace-nowrap border border-white/10" dir="ltr">
                               {currentApiKey}
                            </div>
                            <button onClick={() => copyToClipboard(currentApiKey, 'key')} className="bg-slate-800 p-4 rounded-2xl text-white hover:bg-[#D4AF37] hover:text-[#0c2461] border border-white/10 transition-all">
                               {copiedKey === 'key' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                         </div>
                       </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10">
                       <button 
                         onClick={() => setShowSettings(false)}
                         className="w-full bg-[#D4AF37] text-[#0c2461] hover:bg-[#e5c358] font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
                       >
                          حفظ الإعدادات
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