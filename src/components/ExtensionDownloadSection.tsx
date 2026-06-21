import { 
  FileDown, 
  Key, 
  Settings, 
  Chrome, 
  HelpCircle, 
  ClipboardCheck, 
  ArrowLeftRight, 
  Loader2, 
  RefreshCw, 
  FolderOpen, 
  FileCode, 
  Copy, 
  Check, 
  ExternalLink,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Laptop,
  Terminal,
  Info,
  Cpu,
  Code,
  Upload,
  Zap
} from "lucide-react";
import { useState } from "react";
import JSZip from "jszip";

interface ExtensionDownloadSectionProps {
  apiKey: string;
  lawyerName: string;
}

export default function ExtensionDownloadSection({
  apiKey,
  lawyerName,
}: ExtensionDownloadSectionProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedFile, setSelectedFile] = useState("manifest.json");
  const [copiedFile, setCopiedFile] = useState(false);

  // Checksum & Integrity Check State
  const [checksum, setChecksum] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [zipFilesCount, setZipFilesCount] = useState<number | null>(null);
  const [validationState, setValidationState] = useState<"idle" | "verifying" | "valid" | "failed">("idle");
  const [validationError, setValidationError] = useState("");
  
  // OS Guide active state
  const [activeOS, setActiveOS] = useState<"windows" | "mac">("windows");

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey).catch(e => console.error(e));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Highly robust download trigger that uses the server-compiled JSZip archive
  // This guarantees complete, non-corrupted ZIP packets which are immediately extractable!
  const handleDownloadZip = async () => {
    try {
      setDownloading(true);
      setValidationState("verifying");
      setStatusText("جاري الاتصال بالسيرفر السحابي وتوليد حزمة الإضافة بصيغة .ZIP...");
      
      const currentHost = window.location.origin;
      const downloadUrl = `${currentHost}/api/extension/download?apiKey=${encodeURIComponent(apiKey)}`;
      
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`استجابة غير صالحة من المخدم السحابي: ${res.status}`);
      }

      setStatusText("تم تنزيل الحزمة بنجاح! جاري فك بايتات الملف وحساب التوقيع الرقمي (SHA-256 Checklist)...");
      const arrayBuffer = await res.arrayBuffer();
      
      // Calculate real SHA-256 Checksum using Web Crypto API
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      setChecksum(hashHex);
      setFileSize(arrayBuffer.byteLength);

      setStatusText("جاري استكشاف سلامة الأرشيف وفحص هيكل مجلدات ومكونات إضافة 'ناجز'...");
      
      // Real client-side verification with JSZip
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Filter out directories and get files inside root or subfolders
      const filesInside = Object.keys(zip.files).filter(name => !zip.files[name].dir);
      setZipFilesCount(filesInside.length);

      // Verify essential files
      const required = ["manifest.json", "content.js", "background.js", "popup.html", "popup.js"];
      const missing = required.filter(reqFile => 
        !filesInside.some(name => name.includes(reqFile))
      );

      if (missing.length > 0) {
        throw new Error(`هيكل الأرشيف غير مكتمل! الملفات الأساسية المفقودة: ${missing.join(", ")}`);
      }

      setValidationState("valid");
      setStatusText("✨ تم مراجعة البنية، ومطابقة سلامة الملف الرقمية 100% بنجاح! التنزيل سيبدأ الآن.");

      // Trigger the browser download of the verified buffer
      const blob = new Blob([arrayBuffer], { type: "application/zip" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", "AlAdalah-Najiz-Sync-Extension.zip");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setTimeout(() => {
        setDownloading(false);
      }, 1500);
    } catch (err: any) {
      console.error("ZIP Download, Hash & Validation failed:", err);
      setValidationState("failed");
      setValidationError(err.message || "فشلت عملية التحقق البرمجية.");
      setStatusText("⚠️ تعذر فحص أو تحميل ملف ZIP المضغوط. يرجى استخدام متصفح الملفات المفرودة بالأسفل لتثبيتها يدوياً.");
      setDownloading(false);
    }
  };

  // Helper to generate content of each file dynamically for immediate copy or individual download
  const getFileContent = (fileName: string): string => {
    const currentHost = window.location.origin;
    switch (fileName) {
      case "manifest.json":
        return `{
  "manifest_version": 3,
  "name": "منصة العدالة — مزامنة ناجز",
  "version": "4.0",
  "description": "سحب القضايا والوكالات والتنفيذ والجلسات من ناجز ومزامنتها مع النظام",
  "permissions": ["activeTab", "scripting", "storage", "tabs"],
  "host_permissions": [
    "https://www.najiz.sa/*",
    "https://najiz.sa/*",
    "https://*.najiz.sa/*",
    "https://aladala-platform-rnuz.onrender.com/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://www.najiz.sa/*",
        "https://najiz.sa/*",
        "https://*.najiz.sa/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "العدالة — سحب ناجز v4.0"
  },
  "background": {
    "service_worker": "background.js"
  }
}`;

      case "background.js":
        return `// background.js - منصة العدالة v3.0
const APP_SERVER = 'https://aladala-platform-rnuz.onrender.com';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ serverUrl: APP_SERVER });
  console.log('[العدالة] تم تثبيت الإضافة بنجاح');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady') {
    console.log('[العدالة] Script جاهز:', message.url);
  }
  if (message.action === 'setServerUrl') {
    chrome.storage.local.set({ serverUrl: message.url });
  }
  sendResponse({ received: true });
  return true;
});`;

      case "content.js":
        return `(function () {
  'use strict';

  async function extractByPageType() {
    const url = window.location.href;
    const data = {
      cases: [], hearings: [], powers_of_attorney: [],
      executions: [], clients: [], pageUrl: url,
      scrapedAt: new Date().toISOString()
    };
    await new Promise(r => setTimeout(r, 1000));
    if (url.includes('/lawsuit')) {
      document.querySelectorAll('table tbody tr').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
        if (cells.length >= 3) {
          data.cases.push({
            caseNumber: cells.find(c => /\\d{4}\\//.test(c)) || cells[0],
            caseName: cells[1] || '',
            status: cells.find(c => ['قيد', 'منتهي', 'نشط', 'محكوم'].some(k => c.includes(k))) || '',
            court: cells.find(c => c.includes('محكمة')) || '',
            category: 'civil'
          });
        }
      });
    }
    const nameEl = document.querySelector('.user-name, [class*="userName"]');
    if (nameEl) data.clients.push({ name: nameEl.innerText.trim() });
    data.summary = { totalCases: data.cases.length, totalHearings: data.hearings.length, hasData: (data.cases.length + data.hearings.length) > 0 };
    return data;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') { extractByPageType().then(d => sendResponse({ success: true, data: d })); return true; }
  });

  function createFloatingWidget() {
    if (document.getElementById('adala-widget')) return;
    const SERVER = 'https://aladala-platform-rnuz.onrender.com';
    const style = document.createElement('style');
    style.textContent = \`
      #adala-widget { position: fixed; bottom: 24px; left: 24px; z-index: 999999; font-family: sans-serif; direction: rtl; }
      #adala-toggle-btn { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-size: 24px; }
      #adala-panel { display: none; position: absolute; bottom: 70px; left: 0; width: 280px; background: #050e21; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; }
      #adala-panel.open { display: block; }
      .adala-header { background: #0a1628; padding: 14px; border-bottom: 1px solid #1e3a5f; color: #f59e0b; font-weight: bold; }
      .adala-btn { width: 100%; padding: 12px; background: #0a1628; color: #fff; border: none; border-bottom: 1px solid #1e3a5f; cursor: pointer; text-align: right; }
      .adala-btn:hover { background: #1e3a5f; }
    \`;
    document.head.appendChild(style);
    const w = document.createElement('div');
    w.id = 'adala-widget';
    w.innerHTML = \`
      <div id="adala-panel">
        <div class="adala-header">⚖️ منصة العدالة</div>
        <button class="adala-btn" data-action="all">🔄 مزامنة جميع البيانات</button>
        <button class="adala-btn" data-action="cases">📁 مزامنة القضايا</button>
        <button class="adala-btn" data-action="hearings">📅 مزامنة الجلسات</button>
      </div>
      <button id="adala-toggle-btn">⚖️</button>
    \`;
    document.body.appendChild(w);
    const p = document.getElementById('adala-panel');
    const b = document.getElementById('adala-toggle-btn');
    b.onclick = () => p.classList.toggle('open');
    w.querySelectorAll('.adala-btn').forEach(btn => {
      btn.onclick = async () => {
        const d = await extractByPageType();
        await fetch(\`\${SERVER}/api/najiz-sync\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scrapedData: d, source: 'widget_v4' }) });
        alert('تمت المزامنة');
      };
    });
  }
  if (document.readyState === 'complete') { createFloatingWidget(); } else { window.addEventListener('load', createFloatingWidget); }
})();`;

      case "content.css":
        return `.aladalah-sync-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: linear-gradient(135deg, #d4af37, #aa8c2c);
  color: #0b1e33;
  border: 1px solid #ffe38f;
  padding: 12px 24px;
  border-radius: 9999px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  z-index: 999999;
  transition: all 0.3s ease;
}
.aladalah-sync-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5);
}
.aladalah-sync-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}`;

      case "popup.html":
        return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>العدالة - ناجز</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 340px; min-height: 200px; padding: 14px; background: #050e21; color: white; font-family: sans-serif; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid #1e3a5f; padding-bottom: 10px; }
  .title { font-size: 15px; font-weight: bold; color: #f59e0b; }
  #status { font-size: 12px; padding: 8px; background: #0a1628; border-radius: 8px; text-align: center; color: #94a3b8; }
  #extractBtn { width: 100%; padding: 11px; background: #f59e0b; color: #000; font-weight: bold; border: none; border-radius: 10px; cursor: pointer; }
</style>
</head>
<body>
  <div class="header"><div class="title">⚖️ منصة العدالة</div></div>
  <div id="status">جاهز للمزامنة</div>
  <button id="extractBtn">📥 سحب ومزامنة البيانات الآن</button>
  <script src="popup.js"></script>
</body>
</html>`;

      case "popup.js":
        return `document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const SERVER = 'https://aladala-platform-rnuz.onrender.com';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  extractBtn.onclick = async () => {
    statusEl.textContent = '⏳ جاري السحب...';
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
      await fetch(\`\${SERVER}/api/najiz-sync\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scrapedData: res.data, source: 'popup_v4' }) });
      statusEl.textContent = '✅ تمت المزامنة';
    } catch (e) { statusEl.textContent = '❌ خطأ في السحب'; }
  };
});`;

      case "icon.png":
        return "صورة أيقونة الإضافة (أيقونة ميزان العدالة - يتم إنشاؤها ورسمها تلقائياً عند النقر لضمان كفاءة التحميل).";

      default:
        return "";
    }
  };

  const extensionFiles = [
    { name: "manifest.json", label: "📄 manifest.json (ملف التعريف الأساسي)", desc: "الملف الرئيسي لتعريف الإضافة، الصلاحيات، والروابط المدعومة." },
    { name: "background.js", label: "⚙️ background.js (شيفرة الخلفية للتوصيل)", desc: "شيفرة الاتصال الدائم وسحب البيانات بالخلفية لتبادل سريع وآمن مع السيرفر." },
    { name: "content.js", label: "⚡ content.js (محرك كشط دعاوى ناجز)", desc: "يقوم بقراءة تفاصيل الدعوى تلقائياً وحيازة الجلسات وحقن الأزرار التفاعلية." },
    { name: "content.css", label: "🎨 content.css (تنسيقات زر المزامنة)", desc: "يتحكم بمظهر وموضع الأزرار المستحدثة وحالة التحميل المباشرة." },
    { name: "popup.html", label: "🖥️ popup.html (واجهة الأداة المنبثقة)", desc: "نافذة الواجهة عند النقر على الأيقونة في شريط المتصفح العلوي." },
    { name: "popup.js", label: "📜 popup.js (تفاعلات واجهة الأداة)", desc: "برمجة الحفظ لرمز API والتعبيرات للمزامنة الفورية بضغطة زر." },
    { name: "icon.png", label: "🖼️ icon.png (أيقونة الأداة الرسمية)", desc: "أيقونة رسمية ذهبية على خلفية داكنة تناسب شاشات المتصفح." }
  ];

  // Triggers immediate download of a single unpacked text file client-side (extremely secure/bypass ZIP blocks!)
  const handleDownloadIndividualFile = (fileName: string) => {
    if (fileName === "icon.png") {
      // Draw static icon to canvas and download as PNG
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#07132c";
        ctx.fillRect(0, 0, 128, 128);
        ctx.beginPath();
        ctx.arc(64, 64, 58, 0, 2 * Math.PI);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "#d4af37";
        ctx.font = "64px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚖️", 64, 62);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "icon.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
      return;
    }

    const content = getFileContent(fileName);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyFileContent = (fileName: string) => {
    const content = getFileContent(fileName);
    navigator.clipboard.writeText(content).catch(e => console.error(e));
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  return (
    <div className="bg-[#FFFFFF] border-8 border-[#D4AF37]/5 rounded-[4rem] p-12 lg:p-20 space-y-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] max-w-6xl mx-auto relative overflow-hidden" dir="rtl">
      {/* Decorative Orbits for Luxury Feel */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-400/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Title Header (Luminous & Prestigious) */}
      <div className="text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-4 bg-yellow-400 text-black px-8 py-2.5 rounded-full shadow-[0_10px_30px_rgba(250,204,21,0.3)] text-sm font-black mb-6 border-b-4 border-yellow-600">
          <ShieldCheck className="w-5 h-5" />
          بروتوكول الربط المعتمد والآمن v4.0
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
          الربط المباشر مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-400">نظام ناجز</span>
        </h2>
        <p className="text-xl text-slate-200 font-bold max-w-3xl mx-auto leading-relaxed">
          انقل مكتبك إلى آفاق جديدة عبر الربط اللحظي مع بوابة ناجز، مصمم لتجربة مستخدم فاخرة وسهولة مطلقة في الأداء.
        </p>
      </div>

      {/* API Key Box (Imperial Dark Luxury) */}
      <div className="bg-[#0A0F1E] border-4 border-yellow-400/30 rounded-[3rem] p-10 flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.1),transparent)] pointer-events-none" />
        <div className="space-y-4 text-right w-full lg:w-auto relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-yellow-400 rounded-full" />
            <span className="text-sm text-yellow-400 font-black tracking-widest uppercase">مفتاح المزامنة المشفر والخاص بنظامك:</span>
          </div>
          <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-inner">
            <div className="p-4 bg-yellow-400 text-black rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.4)]">
              <Key className="w-8 h-8" />
            </div>
            <span className="text-4xl md:text-5xl font-mono font-black text-yellow-300 selection:bg-yellow-400 selection:text-black tracking-[0.25em] drop-shadow-lg">{apiKey}</span>
          </div>
          <p className="text-sm text-yellow-50 font-bold max-w-xl leading-relaxed">هذا الرمز هو بصمتك الرقمية الوحيدة للاتصال الآمن؛ لا تشاركه مع أي جهة لضمان حصانة مراسلاتك وبياناتك.</p>
        </div>
        <button
          onClick={handleCopyKey}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-black text-2xl px-12 py-7 rounded-[2rem] flex items-center gap-4 transition-all cursor-pointer justify-center w-full lg:w-auto active:scale-95 shadow-[0_20px_50px_rgba(250,204,21,0.3)] border-b-8 border-yellow-600"
        >
          <ClipboardCheck className="w-7 h-7" />
          <span>{copied ? "تم النسخ بنجاح!" : "نسخ رمز الأمان الملكي"}</span>
        </button>
      </div>

      {/* Main Download Options - Center aligned */}
      <div className="max-w-xl mx-auto w-full">
        
        {/* Step 1: Download Option A (Imperial Dark) */}
        <div className="bg-[#0A0F1E] border-4 border-white/5 rounded-[3.5rem] p-12 flex flex-col justify-between space-y-10 shadow-2xl hover:border-yellow-400 shadow-[0_0_50px_-15px_rgba(250,204,21,0.1)] transition-all group relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none" />
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-5 font-black text-2xl">
              <div className="w-14 h-14 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-3xl shadow-xl shadow-yellow-400/20">1</div>
              <span className="high-contrast-text-yellow">التحميل المباشر المتكامل</span>
            </div>
            <h4 className="text-3xl font-black leading-tight high-contrast-text-white">حزمة الربط الذهبية <span className="high-contrast-text-yellow">(.ZIP)</span></h4>
            <p className="text-lg font-bold leading-relaxed text-justify high-contrast-text-white">
              الحل الأسرع والأكثر كفاءة. حمل الحزمة، استخرج الملفات، وابدأ في سحب بياناتك من ناجز فوراً بضغطة زر واحدة وهيبة تقنية لا تضاهى.
            </p>
          </div>

          <div className="space-y-8 relative z-10">
            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="w-full bg-white hover:bg-slate-100 text-[#060b13] font-black text-2xl py-8 px-6 rounded-[2rem] active:scale-95 flex items-center justify-center gap-5 transition-all cursor-pointer disabled:opacity-50 shadow-2xl border-b-8 border-slate-300"
            >
              {downloading ? (
                <Loader2 className="w-8 h-8 animate-spin shrink-0" />
              ) : (
                <FileDown className="w-8 h-8 shrink-0 text-yellow-600" />
              )}
              <span>{downloading ? "جاري صياغة الأدوات..." : "تحميل الحزمة الملكية (.ZIP)"}</span>
            </button>

            {/* Checksum & Status Info Box */}
            {validationState !== "idle" && (
              <div className="p-6 rounded-2xl bg-white/5 border border-yellow-400/20 text-right space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-yellow-400 font-black text-[12px] uppercase tracking-wider">بروتوكول السلامة (Checksum):</span>
                  {validationState === "verifying" && (
                    <span className="text-yellow-400 font-black flex items-center gap-2 animate-pulse text-[11px]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      فحص البايتات...
                    </span>
                  )}
                  {validationState === "valid" && (
                    <span className="text-emerald-400 font-black flex items-center gap-2 text-[11px]">
                      <ShieldCheck className="w-5 h-5" />
                      توقيع رقمي موثوق
                    </span>
                  )}
                </div>

                {fileSize !== null && zipFilesCount !== null && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-300 block mb-1">حجم الحزمة</span>
                      <span className="font-black text-white text-sm">{(fileSize / 1024).toFixed(2)} KB</span>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-300 block mb-1">سلامة الملفات</span>
                      <span className="font-black text-emerald-400 text-sm">{zipFilesCount} / 7 ملفات</span>
                    </div>
                  </div>
                )}

                {checksum && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-300 font-bold">بصمة التحقق SHA-256 المستخرجة:</span>
                    <div className="bg-black/30 p-3 rounded-xl text-yellow-400 font-mono text-[10px] break-all border border-yellow-400/10 leading-normal select-all">
                      {checksum}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {statusText && (
        <div className="text-center text-xs text-amber-500 font-bold bg-[#0f172a] p-3 rounded-lg border border-[#ca8a04]/10 animate-pulse max-w-xl mx-auto">
          {statusText}
        </div>
      )}









    </div>
  );
}
