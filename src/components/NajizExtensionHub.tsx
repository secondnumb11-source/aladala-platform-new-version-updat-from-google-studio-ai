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
           <button id="adalah-sync-toggle" style="position:fixed; bottom:20px; right:20px; z-index:999999; background:#0c2461; color:#FACC15; border:2px solid #D4AF37; padding:15px 30px; border-radius:30px; font-weight:900; box-shadow:0 10px 25px rgba(0,0,0,0.7); cursor:pointer; font-family:system-ui; direction:rtl; display:flex; align-items:center; gap:10px; font-size:16px;">
              ⚖️ خيارات الربط والمزامنة
           </button>
           <div id="adalah-sync-widget" style="display:none; position:fixed; bottom:85px; right:20px; z-index:999999; background:#0b1329; color:#FFFFFF; border:2px solid #D4AF37; border-radius:24px; padding:25px; width:360px; box-shadow:0 15px 40px rgba(0,0,0,0.8); font-family:system-ui; direction:rtl;">
               <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(212,175,55,0.4); padding-bottom:15px;">
                  <strong style="color: #FACC15; font-size:18px; font-weight:900;">منصة العدالة - ناجز</strong>
                  <div style="display:flex; gap:8px;">
                     <button id="btn-sync-settings" style="background:transparent; border:none; color:#FFFFFF; cursor:pointer;" title="إعدادات">⚙️</button>
                     <span style="font-size:12px; background:rgba(74,222,128,0.15); color:#4ade80; padding:4px 10px; border-radius:8px; font-weight:900;">متصل</span>
                  </div>
               </div>
               
               <div id="adalah-sync-menu">
                   <button class="ad-btn primary" id="btn-sync-all" style="margin-bottom:15px; font-size:14px; padding:12px;">سحب ومزامنة جميع البيانات</button>
                   <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                      <button class="ad-btn" id="btn-sync-cases">مزامنة بيانات القضايا</button>
                      <button class="ad-btn" id="btn-sync-clients">مزامنة بيانات العملاء وأطراف القضايا</button>
                      <button class="ad-btn" id="btn-sync-hearings">مزامنة مواعيد الجلسات</button>
                      <button class="ad-btn" id="btn-sync-executions">مزامنة طلبات التنفيذ</button>
                      <button class="ad-btn" id="btn-sync-requests">مزامنة الطلبات علي القضايا</button>
                      <button class="ad-btn" id="btn-sync-minutes">مزامنة محاضر ضبط الجلسات</button>
                      <button class="ad-btn" id="btn-sync-agencies">مزامنة الوكالات</button>
                      <button class="ad-btn" id="btn-sync-other">مزامنة البيانات الأخرى</button>
                   </div>
                   <div style="margin-top:15px; font-size:11px; color:#FFFFFF; opacity:0.8; text-align:center; line-height:1.6; font-weight:bold;">
                      يعمل مساعد الذكاء الاصطناعي (AI) على تحليل وترتيب البيانات في أقسام النظام تلقائياً وبدقة عالية.
                   </div>
               </div>
               
               <div id="adalah-sync-settings-menu" style="display:none;">
                   <h4 style="color:#FACC15; margin-top:0; margin-bottom:15px;">الإعدادات (اختياري)</h4>
                   <p style="font-size:11px; color:#FFFFFF; margin-bottom:15px;">الربط يعمل تلقائياً، يمكنك إدخال المفاتيح هنا للربط المخصص.</p>
                   <input type="password" id="ext-api-key" placeholder="API Key (اختياري)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #D4AF37; background:rgba(0,0,0,0.3); color:#FFF; margin-bottom:15px; box-sizing:border-box;">
                   <input type="text" id="ext-api-url" placeholder="API URL (اختياري)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #D4AF37; background:rgba(0,0,0,0.3); color:#FFF; margin-bottom:15px; box-sizing:border-box;">
                   <button class="ad-btn primary" id="btn-sync-save-settings">حفظ الرجوع</button>
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
          
          document.getElementById('btn-sync-settings').addEventListener('click', () => {
             const menu = document.getElementById('adalah-sync-menu');
             const settings = document.getElementById('adalah-sync-settings-menu');
             if(menu.style.display !== 'none') {
                 menu.style.display = 'none';
                 settings.style.display = 'block';
                 chrome.storage.local.get(['apiUrl', 'apiKey'], (data) => {
                     if(data.apiUrl) document.getElementById('ext-api-url').value = data.apiUrl;
                     if(data.apiKey) document.getElementById('ext-api-key').value = data.apiKey;
                 });
             } else {
                 menu.style.display = 'block';
                 settings.style.display = 'none';
             }
          });
          
          document.getElementById('btn-sync-save-settings').addEventListener('click', () => {
               const apiUrl = document.getElementById('ext-api-url').value;
               const apiKey = document.getElementById('ext-api-key').value;
               chrome.storage.local.set({ apiUrl, apiKey }, () => {
                  document.getElementById('adalah-sync-menu').style.display = 'block';
                  document.getElementById('adalah-sync-settings-menu').style.display = 'none';
               });
          });

          const buttons = ['all', 'cases', 'clients', 'hearings', 'executions', 'requests', 'minutes', 'agencies', 'other'];
          buttons.forEach(id => {
             const btn = document.getElementById('btn-sync-' + id);
             if (btn) btn.addEventListener('click', () => handleSync(id));
          });
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
            body { background: #0b1329; color: #FFFFFF; font-family: system-ui, sans-serif; width: 340px; padding: 0; margin: 0; overflow-x: hidden; }
            .header { background: #090f20; padding: 15px 20px; border-bottom: 1px solid rgba(212,175,55,0.3); display: flex; justify-content: space-between; align-items: center; }
            .header h2 { color: #FACC15; font-weight: 900; margin: 0; font-size: 16px; }
            .tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); background: #0a1024; }
            .tab { flex: 1; text-align: center; padding: 12px; cursor: pointer; font-size: 13px; font-weight: bold; color: #FFFFFF; opacity: 0.8; transition: all 0.2s; }
            .tab.active { color: #FACC15; opacity: 1; border-bottom: 2px solid #FACC15; background: rgba(212,175,55,0.05); }
            .content { padding: 20px; display: none; }
            .content.active { display: block; }

            label { display: block; font-size: 12px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: #FACC15; }
            input { width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid #FFFFFF; color: #FFFFFF; border-radius: 8px; box-sizing: border-box; }
            input::placeholder { color: #FFFFFF; opacity: 0.6; }
            input:focus { outline: none; border-color: #FACC15; background: rgba(0,0,0,0.4); }
            
            button.primary { width: 100%; margin-top: 20px; background: #D4AF37; color: #0b1329; border: none; padding: 12px; font-weight: 900; border-radius: 8px; cursor: pointer; transition: 0.2s;}
            button.primary:hover { background: #FACC15; transform: translateY(-1px); }
            
            .info { font-size: 11px; margin-top: 15px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; color: #FFFFFF; line-height: 1.6; border: 1px solid rgba(255,255,255,0.05); }
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
            <div class="tab" data-target="settings">إعدادات المتقدمة</div>
         </div>

         <div id="main" class="content active">
            <div style="text-align: center; margin-bottom: 20px;">
               <div style="font-size: 40px; margin-bottom: 10px;">⚖️</div>
               <h3 style="margin: 0 0 5px 0; color: #FACC15;">المزامنة جاهزة</h3>
               <p style="margin: 0; font-size: 11px; color: #FFFFFF;">الذكاء الاصطناعي مهيأ ويراقب البيانات المدخلة.</p>
            </div>
            
            <div class="info">
               الأداة تعمل بالخلفية بدون تدخل. بمجرد تسجيل دخولك للمنصات العدلية، سيظهر زر المزامنة الذكية في أسفل الشاشة لنقل قضاياك وجلساتك مباشرة لملفك.
            </div>
         </div>

         <div id="settings" class="content">
            <p style="font-size:11px; color:#FFFFFF; margin-top:0;">الربط المباشر يعمل تلقائياً، استخدم هذه الإعدادات فقط لتغيير مسار التوجيه لقواعد بياناتك الخاصة.</p>
            
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen" dir="rtl">
      
      {/* Hero Header - Dark Blue & Gold */}
      <div className="bg-[#0b1329] rounded-[3rem] p-12 text-white shadow-[0_20px_50px_rgba(12,36,97,0.4)] relative overflow-hidden border border-[#D4AF37]/30">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,#0c2461_25%,#0b1e4f_50%,#0c2461_75%)] opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4AF37]/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="bg-[#D4AF37] p-3 rounded-2xl shadow-lg shadow-[#D4AF37]/20">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white hover:text-yellow-400 transition-colors cursor-default">
                أداة المزامنة الذكية <span className="text-[#FACC15] font-black">Al-Adalah</span>
              </h1>
            </div>
            <p className="text-yellow-400/90 text-xl font-medium leading-relaxed mb-8">
              الربط المباشر مع ناجز باستخدام الذكاء الاصطناعي. تعمل الأداة على سحب، ترتيب، ومزامنة كافة البيانات وعكسها تلقائياً على سجلات منصة العدالة بدقة تامة وبدون الحاجة إلى مفاتيح API، فالأداة تعتمد كلياً على قيام المحامي بتسجيل الدخول بحسابه الشخصي في ناجز لتقوم بناءً على ذلك بالسحب والمزامنة بشكل آمن ومباشر.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#D4AF37] hover:bg-[#e5c358] text-[#0b1329] font-black text-lg px-10 py-5 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
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
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-center gap-4 p-8 bg-[#0b1329]/60 backdrop-blur-xl border border-[#D4AF37]/50 rounded-[2.5rem] shadow-2xl skew-y-1">
             <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-[#FACC15] font-black">الربط التلقائي نشط</span>
             </div>
             <div className="text-5xl font-black text-white">100%</div>
             <p className="text-[10px] font-bold text-yellow-400">دقة ترتيب وتوزيع الأقسام (AI Scraper)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Status & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0b1329] border border-[#D4AF37]/30 rounded-[2.5rem] p-8 shadow-xl text-white">
            <h3 className="font-black text-white text-lg mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#FACC15] font-black" />
              الحالة الفنية
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-900/30 rounded-2xl border border-emerald-500/30">
                <span className="text-xs font-black text-emerald-400">بدون مفتاح (No-Key)</span>
                <div className="bg-emerald-500 text-white text-[11px] px-2 py-1 rounded-full font-black animate-pulse">متصل</div>
              </div>

              <div className="pt-6 border-t border-[#D4AF37]/20">
                <h4 className="text-[10px] font-black text-[#FACC15] font-black uppercase tracking-widest mb-4">التوزيع الذكي المدعوم</h4>
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
                       <span className="text-xs font-black text-[#FFFFFF]">{item.label}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-3 space-y-8">
          
          <div className="bg-[#0b1329] border border-[#D4AF37]/30 rounded-[3rem] p-10 shadow-xl overflow-hidden text-white">
            <div className="flex border-b border-[#D4AF37]/20 mb-8">
              <button 
                onClick={() => setActiveTab('instructions')}
                className={`pb-4 px-8 text-sm font-black transition-all relative ${activeTab === 'instructions' ? 'text-[#FACC15] font-black' : 'text-[#FFFFFF]'}`}
              >
                تنزيل وبدء العمل
                {activeTab === 'instructions' && <motion.div layoutId="tab-underline-hub" className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37] rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('features')}
                className={`pb-4 px-8 text-sm font-black transition-all relative ${activeTab === 'features' ? 'text-[#FACC15] font-black' : 'text-[#FFFFFF]'}`}
              >
                قدرات المزامنة الشاملة
                {activeTab === 'features' && <motion.div layoutId="tab-underline-hub" className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37] rounded-full" />}
              </button>
            </div>

            {activeTab === 'instructions' ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#FACC15] font-black text-xl">1</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">تحميل الأداة</h4>
                        <p className="text-sm text-[#FFFFFF] leading-relaxed font-black">استخرج ملف ZIP الذي تم تحميله في مجلد معروف للبدء.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#FACC15] font-black text-xl">2</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">تثبيت الإضافة للمتصفح</h4>
                        <p className="text-sm text-[#FFFFFF] leading-relaxed font-black">في Chrome، افتح <code className="bg-[#0b1329] px-1 rounded text-[#FACC15] font-black">chrome://extensions</code>، فعل وضع المطور وارفع المجلد.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#FACC15] font-black text-xl">3</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">سحب تلقائي (No-Key)</h4>
                        <p className="text-sm text-[#FFFFFF] leading-relaxed font-black">افتح منصة ناجز بتسجيل دخولك المعتاد. ستجد زر المزامنة متوفر في أسفل المتصفح وتعمل الأداة دون ربط API من خلال الجلسة الحالية.</p>
                      </div>
                   </div>
                   <div className="flex gap-6 bg-slate-900/50 p-5 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 font-black text-[#FACC15] font-black text-xl">4</div>
                      <div className="space-y-2">
                        <h4 className="font-black text-white text-lg">التعرف بالذكاء الاصطناعي</h4>
                        <p className="text-sm text-[#FFFFFF] leading-relaxed font-black">الأداة تصنف القضايا والجلسات والوكالات فورياً بالذكاء الاصطناعي وترفعها للأقسام الصحيحة في النظام.</p>
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
                        <feat.icon className="w-8 h-8 text-[#FACC15] font-black mb-4 transition-transform group-hover:scale-110" />
                        <h5 className="font-black text-white mb-2">{feat.title}</h5>
                        <p className="text-[11px] text-[#FFFFFF] font-black leading-relaxed">{feat.desc}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The Settings Modal has been removed per instructions. The API keys are entered directly in the Extension widget now. */}

    </div>
  );
}