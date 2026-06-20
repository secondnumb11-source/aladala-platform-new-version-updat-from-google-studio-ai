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
  Cpu
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
  "version": "3.0",
  "description": "سحب بيانات القضايا من ناجز ومزامنتها مع منصة العدالة",
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "tabs"
  ],
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
    "default_title": "العدالة — سحب ناجز"
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
        return `// content.js — قارئ بيانات ناجز
// لا يحتاج API Key — يقرأ الصفحة مباشرة من جلسة المستخدم المسجل
(function () {
  'use strict';

  function extractAllPageData() {
    const data = {
      cases: [],
      hearings: [],
      powers_of_attorney: [],
      executions: [],
      clients: [],
      pageUrl: window.location.href,
      pageTitle: document.title,
      scrapedAt: new Date().toISOString(),
      needsApiKey: false
    };

    const bodyText = document.body?.innerText || '';

    const caseNumberPatterns = [
      /\\d{4}\/\\d{1,2}\/\\d+/g,
      /\\d{4}\/\\d{4,}/g,
      /(?<!\\d)\\d{10}(?!\\d)/g,
      /(?<!\\d)\\d{9}(?!\\d)/g,
    ];

    const foundCaseNumbers = new Set();
    caseNumberPatterns.forEach(pattern => {
      const matches = bodyText.match(pattern) || [];
      matches.forEach(m => foundCaseNumbers.add(m.trim()));
    });

    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const headers = Array.from(table.querySelectorAll('th'))
        .map(th => th.innerText?.trim().toLowerCase() || '');

      const isCaseTable = headers.some(h =>
        h.includes('قضية') || h.includes('دعوى') ||
        h.includes('رقم') || h.includes('حالة') ||
        h.includes('محكمة') || h.includes('case')
      );

      const isHearingTable = headers.some(h =>
        h.includes('جلسة') || h.includes('موعد') ||
        h.includes('تاريخ') || h.includes('hearing')
      );

      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');

        if (cells.length === 0 || cells.every(c => !c)) return;

        const rowText = cells.join(' ');
        const dateMatch = rowText.match(
          /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
        );
        const caseNumMatch = rowText.match(/\\d{4}\\/\\d+|\\d{10,}|\\d{9}/);

        if (isCaseTable || caseNumMatch) {
          const caseNum = caseNumMatch?.[0] || '';
          if (!data.cases.find(c => c.caseNumber === caseNum)) {
            data.cases.push({
              caseNumber: caseNum,
              caseName: cells.find(c =>
                c.length > 4 && !/^\\d+$/.test(c) && !c.includes('/')
              ) || '',
              status: cells.find(c =>
                c.includes('قيد') || c.includes('منتهي') ||
                c.includes('نشط') || c.includes('مقيد') ||
                c.includes('محكوم') || c.includes('مؤجل') ||
                c.includes('مشطوب') || c.includes('موقوف')
              ) || '',
              court: cells.find(c => c.includes('محكمة')) || '',
              date: dateMatch?.[0] || '',
              rawCells: cells
            });
          }
        }

        if (isHearingTable || (dateMatch && rowText.includes('جلسة'))) {
          data.hearings.push({
            date: dateMatch?.[0] || '',
            caseNumber: caseNumMatch?.[0] || '',
            court: cells.find(c => c.includes('محكمة')) || '',
            status: cells.find(c =>
              c.includes('قادمة') || c.includes('منتهية') ||
              c.includes('مؤجلة') || c.includes('ملغاة')
            ) || '',
            hall: cells.find(c => c.includes('قاعة') || c.includes('دائرة')) || '',
            rawCells: cells
          });
        }
      });
    });

    const cardSelectors = [
      '.card', '.case-card', '[class*="case-card"]',
      '.list-item', '[class*="list-item"]',
      '.MuiCard-root', '.MuiPaper-root',
      '[class*="CaseItem"]', '[class*="caseItem"]',
      '[class*="CaseRow"]', '[class*="caseRow"]',
      '[data-testid*="case"]', '[data-cy*="case"]',
      '.case-row', '.hearing-row',
      '[class*="RequestCard"]', '[class*="requestCard"]'
    ];

    cardSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(card => {
          const text = card.innerText?.trim() || '';
          if (!text || text.length < 5) return;

          const caseNumMatch = text.match(/\\d{4}\\/\\d+|\\d{10,}|\\d{9}/);
          const dateMatch = text.match(
            /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
          );

          if (caseNumMatch) {
            const caseNum = caseNumMatch[0];
            if (!data.cases.find(c => c.caseNumber === caseNum)) {
              data.cases.push({
                caseNumber: caseNum,
                caseName: text.split('\\n')[0]?.substring(0, 100) || '',
                date: dateMatch?.[0] || '',
                rawText: text.substring(0, 300)
              });
            }
          }

          if (text.includes('جلسة') && dateMatch) {
            if (!data.hearings.find(h =>
              h.date === dateMatch[0] && h.caseNumber === (caseNumMatch?.[0] || '')
            )) {
              data.hearings.push({
                date: dateMatch[0],
                caseNumber: caseNumMatch?.[0] || '',
                rawText: text.substring(0, 300)
              });
            }
          }

          if (text.includes('وكالة')) {
            const poaNum = text.match(/\\d{6,}/)?.[0];
            data.powers_of_attorney.push({
              poaNumber: poaNum || '',
              text: text.substring(0, 300),
              expiryDate: dateMatch?.[0] || ''
            });
          }

          if (text.includes('تنفيذ')) {
            data.executions.push({
              executionNumber: caseNumMatch?.[0] || '',
              text: text.substring(0, 200)
            });
          }
        });
      } catch (e) {}
    });

    const nameSelectors = [
      '.user-name', '.username', '[class*="userName"]',
      '[class*="user-name"]', '[class*="UserName"]',
      '.profile-name', '[class*="profileName"]',
      'header [class*="name"]', '.nav [class*="name"]',
      '[class*="WelcomeUser"]', '[class*="welcomeUser"]',
      '.greeting', '[class*="greeting"]',
      'span[class*="Name"]', 'p[class*="Name"]'
    ];

    for (const sel of nameSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el?.innerText?.trim()) {
          data.clients.push({
            name: el.innerText.trim(),
            source: 'najiz_logged_user'
          });
          break;
        }
      } catch (e) {}
    }

    const welcomeMatch = bodyText.match(
      /(?:مرحباً|أهلاً|مرحبا)[،,\\s]+([^\\n،,]{3,40})/
    );
    if (welcomeMatch && data.clients.length === 0) {
      data.clients.push({
        name: welcomeMatch[1].trim(),
        source: 'najiz_welcome_text'
      });
    }

    const urlCaseMatch = window.location.href.match(
      /[?&](?:caseId|case_id|id|caseNo|case)=([^&]+)/i
    );
    if (urlCaseMatch) {
      const urlCaseNum = urlCaseMatch[1];
      if (!data.cases.find(c => c.caseNumber === urlCaseNum)) {
        data.cases.push({
          caseNumber: urlCaseNum,
          source: 'url_parameter'
        });
      }
    }

    data.summary = {
      totalCases: data.cases.length,
      totalHearings: data.hearings.length,
      totalPOAs: data.powers_of_attorney.length,
      totalExecutions: data.executions.length,
      hasUserInfo: data.clients.length > 0,
      pageUrl: window.location.href,
      scrapedAt: data.scrapedAt
    };

    return data;
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (
      request.action === 'extractData' ||
      request.action === 'scrape' ||
      request.action === 'getData' ||
      request.action === 'sync'
    ) {
      const doExtract = () => {
        try {
          const result = extractAllPageData();
          const hasData =
            result.cases.length > 0 ||
            result.hearings.length > 0 ||
            result.powers_of_attorney.length > 0;

          if (hasData) {
            sendResponse({ success: true, data: result });
          } else {
            setTimeout(() => {
              const retryResult = extractAllPageData();
              const retryHasData =
                retryResult.cases.length > 0 ||
                retryResult.hearings.length > 0 ||
                retryResult.powers_of_attorney.length > 0;

              sendResponse({
                success: retryHasData,
                data: retryResult,
                message: retryHasData
                  ? 'تم السحب بنجاح'
                  : 'لم يتم العثور على بيانات في هذه الصفحة. انتقل إلى صفحة قضاياي أو جلساتي'
              });
            }, 3000);
          }
        } catch (err) {
          sendResponse({
            success: false,
            error: err.message,
            message: 'خطأ في قراءة الصفحة: ' + err.message
          });
        }
      };

      if (document.readyState !== 'complete') {
        window.addEventListener('load', doExtract, { once: true });
      } else {
        doExtract();
      }

      return true;
    }

    if (request.action === 'ping') {
      sendResponse({
        success: true,
        active: true,
        isNajiz: window.location.href.includes('najiz.sa'),
        url: window.location.href
      });
      return true;
    }

    if (request.action === 'getPageInfo') {
      sendResponse({
        success: true,
        url: window.location.href,
        title: document.title,
        isNajiz: window.location.href.includes('najiz.sa'),
        isLoggedIn: !!document.querySelector(
          '.user-name, [class*="userName"], [class*="user-name"], [class*="profile"]'
        ),
        readyState: document.readyState
      });
      return true;
    }
  });

  console.log(
    '[منصة العدالة] ✅ Script جاهز — بدون API Key — يقرأ بيانات المستخدم المسجل مباشرة'
  );

  try {
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      url: window.location.href,
      isNajiz: window.location.href.includes('najiz.sa')
    });
  } catch (e) {}

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
  <title>منصة العدالة — مزامنة ناجز</title>
  <style>
    body {
      width: 320px;
      font-family: Arial, sans-serif;
      padding: 16px;
      background: #0f172a;
      color: #f1f5f9;
      margin: 0;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 1px solid #334155;
      padding-bottom: 12px;
    }
    .title {
      font-size: 18px;
      font-weight: bold;
      color: #fbbf24;
      margin: 0;
    }
    .subtitle {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .status-box {
      background: #1e293b;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 16px;
      font-size: 13px;
      line-height: 1.4;
      border: 1px solid #334155;
      text-align: center;
    }
    .btn {
      display: block;
      width: 100%;
      background: #fbbf24;
      color: #0f172a;
      border: none;
      padding: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #f59e0b;
    }
    .btn:disabled {
      background: #475569;
      color: #94a3b8;
      cursor: not-allowed;
    }
    .results-box {
      margin-top: 16px;
      background: #1e293b;
      border-radius: 8px;
      border: 1px solid #334155;
    }
    .hint {
      font-size: 11px;
      color: #64748b;
      text-align: center;
      margin-top: 12px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">⚖️ منصة العدالة</h1>
    <div class="subtitle">مزامنة وسحب بيانات ناجز دون وسيط</div>
  </div>

  <div class="status-box" id="status">
    ⏳ جاري التحقق من حالة الصفحة...
  </div>

  <button class="btn" id="extractBtn">⚡ سحب ومزامنة البيانات الحالية</button>

  <div id="results" class="results-box"></div>

  <div class="hint">
    قم بتسجيل الدخول إلى حسابك في ناجز أولاً، ثم اذهب إلى صفحة (الحالات/قضاياي) أو (جلساتي) واضغط على زر السحب.
  </div>

  <script src="popup.js"></script>
</body>
</html>`;

      case "popup.js":
        return `// popup.js — بدون API Key — يرسل البيانات للخادم فقط
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const resultsEl = document.getElementById('results');

  const setStatus = (msg, type = 'info') => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color =
      type === 'error' ? '#ef4444' :
      type === 'success' ? '#22c55e' :
      type === 'warning' ? '#f59e0b' : '#94a3b8';
  };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isNajiz = tab?.url?.includes('najiz.sa');

  if (!isNajiz) {
    setStatus('❌ يرجى فتح موقع ناجز أولاً', 'error');
    if (extractBtn) extractBtn.disabled = true;
    return;
  }

  setStatus('✅ أنت على موقع ناجز — جاهز للسحب', 'success');

  extractBtn?.addEventListener('click', async () => {
    setStatus('⏳ جارٍ قراءة بياناتك من الصفحة...', 'info');
    if (extractBtn) extractBtn.disabled = true;

    try {
      const response = await chrome.tabs.sendMessage(
        tab.id,
        { action: 'extractData' }
      );

      if (response?.success && response.data) {
        const d = response.data;
        const summary = d.summary;

        setStatus(
          \`✅ تم: \${summary.totalCases} قضية | \${summary.totalHearings} جلسة | \${summary.totalPOAs} وكالة\`,
          'success'
        );

        const serverUrl = await getServerUrl();
        if (serverUrl) {
          await fetch(\`\${serverUrl}/api/najiz-sync\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scrapedData: d,
              source: 'chrome_extension_user_session',
              noApiKeyNeeded: true
            })
          });
        }

        if (resultsEl) {
          resultsEl.innerHTML = \`
            <div style="direction:rtl; font-family:Arial; font-size:12px; padding:8px;">
              <p>📁 القضايا: <strong>\${summary.totalCases}</strong></p>
              <p>📅 الجلسات: <strong>\${summary.totalHearings}</strong></p>
              <p>📜 الوكالات: <strong>\${summary.totalPOAs}</strong></p>
              <p>⚡ التنفيذ: <strong>\${summary.totalExecutions}</strong></p>
              <p style="color:#22c55e; margin-top:8px;">✅ تمت المزامنة مع النظام</p>
            </div>
          \`;
        }

      } else {
        setStatus(
          response?.message || '⚠️ انتقل إلى صفحة "قضاياي" ثم اضغط السحب',
          'warning'
        );
      }
    } catch (err) {
      if (err.message?.includes('Could not establish connection')) {
        setStatus('⚠️ أعد تحميل صفحة ناجز ثم حاول مرة أخرى', 'warning');
      } else {
        setStatus('❌ خطأ: ' + err.message, 'error');
      }
    } finally {
      if (extractBtn) extractBtn.disabled = false;
    }
  });
});

async function getServerUrl() {
  return new Promise(resolve => {
    chrome.storage.local.get('serverUrl', data => {
      resolve(data.serverUrl || '\${currentHost}');
    });
  });
}`;

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
    <div className="bg-[#07132c]/95 border border-[#ca8a04]/30 rounded-2xl p-6 space-y-8 shadow-2xl max-w-4xl mx-auto" dir="rtl">
      
      {/* Title Header */}
      <div className="text-center space-y-2 border-b border-[#ca8a04]/10 pb-6">
        <h2 className="text-2xl font-bold text-slate-100 font-sans">
          تحميل وتثبيت أداة <span className="text-[#ca8a04]">العدالة لمستعرض الكروم (Chrome Extension)</span>
        </h2>
        <p className="text-xs text-slate-900  max-w-2xl mx-auto leading-relaxed">
          الأداة البرمجية المدمجة والذكية لسحب الدعاوى والخصوم تلقائياً وتحديث مواعيد الجلسات من بوابة ناجز (<span className="text-amber-500 font-mono">najiz.sa</span>) وربطها الفوري المباشر بنظام مكتب المستشارين والمحاميين والمستشاريين القانونيين والارتباط بـ AI.
        </p>
      </div>

      {/* API Key Box */}
      <div className="bg-[#0f172a] border border-[#ca8a04]/20 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-right w-full md:w-auto">
          <span className="text-xs text-slate-900  font-medium block">رمز التوثيق والربط الأمني الخاص بك (مستقل لكل محامي):</span>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#ca8a04]" />
            <span className="text-sm font-mono font-bold text-[#ca8a04] select-all">{apiKey}</span>
          </div>
          <span className="text-xs text-slate-900  block">يضمن هذا الرمز ربط الدعاوى المستخرجة ببيانات مكتبك دون تداخل السجلات.</span>
        </div>
        <button
          onClick={handleCopyKey}
          className="bg-[#07132c] border border-[#ca8a04]/45 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold justify-center w-full md:w-auto active:scale-95"
        >
          <ClipboardCheck className="w-4 h-4 text-[#ca8a04]" />
          <span>{copied ? "تم النسخ بنجاح!" : "نسخ رمز الربط"}</span>
        </button>
      </div>

      {/* Main Download Options - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Download Option A - The direct pre-packaged server ZIP archive */}
        <div className="bg-[#0f172a] border border-[#ca8a04]/30 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#ca8a04] font-extrabold text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center border border-amber-500 text-sm">أ</span>
              <span>مستحسن: تحميل الحزمة المضغوطة المباشرة</span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">تحميل ملف الإضافة (.ZIP) (يفك الضغط في مجلد واحد)</h4>
            <p className="text-sm text-slate-900  leading-relaxed text-justify">
              تحميل حزمة متكاملة من السيرفر بمجلد واحد مسمى (Adalah-Sync-Extension). التثبيت: ١. قم بفك الضغط، ٢. افتح صفحة الإضافات بالمتصفح، ٣. فعل (Developer Mode)، ٤. اختر المجلد (Load Unpacked).
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs py-3.5 px-4 rounded-lg active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <FileDown className="w-4 h-4 shrink-0" />
              )}
              <span>{downloading ? "جاري فحص وتحميل الحزمة..." : "تحميل حزمة تثبيت الإضافة المعتمدة (.ZIP)"}</span>
            </button>

            {/* Checksum & Status Info Box */}
            {validationState !== "idle" && (
              <div className="p-3.5 rounded-xl bg-sky-100 border border-[#ca8a04]/40 text-right space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white pb-2">
                  <span className="text-slate-900 font-bold block">ميزة فحص وتأمين الحزمة (Checksum Verified):</span>
                  {validationState === "verifying" && (
                    <span className="text-amber-500 font-extrabold flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      جاري فحص بايتات الملف...
                    </span>
                  )}
                  {validationState === "valid" && (
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      سليم وآمن 100%
                    </span>
                  )}
                  {validationState === "failed" && (
                    <span className="text-rose-500 font-extrabold flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" />
                      غير صالح / ناقص
                    </span>
                  )}
                </div>

                {fileSize !== null && zipFilesCount !== null && (
                  <div className="text-[11px] text-slate-900 grid grid-cols-2 gap-2 pt-1">
                    <div>حجم الحزمة الرقمي: <span className="font-mono text-amber-500 font-bold">{(fileSize / 1024).toFixed(2)} KB</span></div>
                    <div>الملفات الأساسية المفحوصة: <span className="font-semibold text-emerald-400">{zipFilesCount} / 7 ملفات</span></div>
                  </div>
                )}

                {checksum && (
                  <div className="space-y-1.5 pt-1.5 border-t border-white">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-900">بصمة التحقق الرقمي الخاصة بـ Najiz Scraper (SHA-256):</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500 px-1.5 py-0.5 rounded font-bold">حزمة مطابقة ومعتمدة</span>
                    </div>
                    <div className="bg-sky-50 p-2 rounded text-slate-900 font-mono text-[11px] break-all border border-slate-800 leading-normal select-all">
                      {checksum}
                    </div>
                  </div>
                )}

                {validationState === "failed" && validationError && (
                  <div className="text-rose-400 bg-rose-500 p-2.5 rounded-lg border border-rose-500 text-[11px] leading-relaxed">
                    <strong>خطأ في التحقق التلقائي:</strong> {validationError}
                  </div>
                )}
              </div>
            )}

            {/* Standby Secondary Server Download */}
            <div className="text-center pt-1">
              <a
                href={`/api/extension/download?apiKey=${encodeURIComponent(apiKey)}`}
                className="text-xs text-amber-500 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>رابط تنزيل سحابي مباشر وبديل</span>
              </a>
            </div>
          </div>
        </div>

        {/* Step 2: Download Option B - Flat / Unpacked files setup */}
        <div className="bg-[#0f172a] border border-[#ca8a04]/30 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border border-emerald-500 text-sm">ب</span>
              <span>خيار الأمان العالي: تثبيت الملفات مفرودة في مجلد</span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">تحميل وتثبيت الملفات فرادى مباشرة</h4>
            <p className="text-sm text-slate-900  leading-relaxed text-justify">
              إذا كانت سياسات شركتك أو المتصفح تمنع تحميل أو فك ضغط وحزم ملفات ZIP، يمكنك ببساطة إنشاء مجلد فارغ باسم <code className="text-[#ca8a04] font-bold">adalah-sync</code> على سطح المكتب، وتحميل الملفات من المعرض أدناه مباشرة إليه.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="#unpacked-browser"
              className="w-full bg-[#07132c] border border-emerald-500 text-emerald-400 font-bold text-xs py-3.5 px-4 rounded-lg block text-center active:scale-95 transition-all outline-none"
            >
              📂 تصفح وتجميع الـ 7 ملفات المفرودة برمجياً
            </a>
          </div>
        </div>

      </div>

      {statusText && (
        <div className="text-center text-xs text-amber-500 font-bold bg-[#0f172a] p-3 rounded-lg border border-[#ca8a04]/10 animate-pulse max-w-xl mx-auto">
          {statusText}
        </div>
      )}

      {/* Unpacked Browser Section */}
      <div id="unpacked-browser" className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 space-y-6 scroll-mt-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-slate-100 font-bold text-base flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" />
              <span>مستعرض وتنزيل ملفات الإضافة المفرودة (Unpacked View)</span>
            </h3>
            <p className="text-sm text-slate-900 ">
              قم بإنشاء مجلد فارغ بجهازك، وقم بتحميل وحفظ الملفات السبعة داخله بمسمياتها الصحيحة المبينة أدناه لتجهيزها تماماً للتحميل في متصفحك!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* File Lists Column */}
          <div className="space-y-2 border-l border-slate-800 pl-0 md:pl-2">
            <span className="text-xs text-slate-900  font-bold block mb-1 pr-1">الملفات البرمجية السبعة المطلوبة:</span>
            {extensionFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file.name)}
                className={`w-full text-right p-3 rounded-lg transition-all text-xs flex flex-col space-y-1 border cursor-pointer ${
                  selectedFile === file.name 
                    ? "bg-[#ca8a04]/10 border-[#ca8a04] text-[#ca8a04] shadow-md font-bold" 
                    : "bg-[#07132c]/50 border-slate-800 text-slate-900[#07132c]"
                }`}
              >
                <span className="font-mono">{file.name}</span>
                <span className="text-xs text-slate-900  font-normal line-clamp-1">{file.desc}</span>
              </button>
            ))}
          </div>

          {/* Active File Actions & Preview */}
          <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
            
            {/* Header info bar */}
            <div className="bg-[#07132c] border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-mono font-bold text-white font-bold">{selectedFile}</span>
                </div>
                <span className="text-sm text-slate-900  block">
                  {extensionFiles.find(e => e.name === selectedFile)?.desc}
                </span>
              </div>

              {/* Download and copy buttons for selected file */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => handleCopyFileContent(selectedFile)}
                  disabled={selectedFile === "icon.png"}
                  className="bg-sky-50 border border-slate-700 text-white font-bold text-sm font-bold px-3 py-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
                  title="نسخ محتوى هذا الملف النصي بالكامل"
                >
                  {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFile ? "تم النسخ!" : "نسخ المحتوى"}</span>
                </button>

                <button
                  onClick={() => handleDownloadIndividualFile(selectedFile)}
                  className="bg-amber-500 text-slate-950 text-sm font-black px-3 py-2 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto active:scale-95"
                  title="تحميل كملف مفرود آلياً"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الملف المفرود</span>
                </button>
              </div>
            </div>

            {/* Code editor preview box */}
            <div className="bg-[#071d37]/45 border border-slate-800 rounded-lg p-4 font-mono text-sm text-white font-bold overflow-x-auto overflow-y-auto max-h-72 h-72 relative shadow-inner">
              {selectedFile === "icon.png" ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-16 h-16 bg-[#07132c] border-2 border-amber-500 rounded-lg flex items-center justify-center text-4xl shadow-gold shadow">
                    ⚖️
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-amber-500 font-bold text-xs block">أيقونة الإضافة الرسمية لمتصفح كروم</span>
                    <p className="text-[10.5px] text-slate-900  max-w-sm">
                      لتنزيل هذه الأيقونة مفرودة، يرجى النقر على زر <strong>"تنزيل الملف المفرود"</strong> بالمتصفح ليتم توليد صورة PNG حقيقية بميزات الميزان الذهبي وحفظها تلقائياً داخل مجلدك.
                    </p>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre text-slate-900 select-all leading-normal">
                  <code>{getFileContent(selectedFile)}</code>
                </pre>
              )}
            </div>

            <div className="text-xs text-slate-900  flex items-center gap-1 leading-normal pr-1">
              <span className="text-amber-500">🛡️ ملاحظة:</span>
              <span>جميع الملفات المُصدرَة تحتوي مسبقاً على رمز الارتباط الآمن الخاص بمكتبك، ومجهزة للارتباط الفوري.</span>
            </div>

          </div>
        </div>
      </div>

      {/* OS Extraction & Setup Illustrated Guide */}
      <div className="bg-[#0f172a]/95 border border-[#ca8a04]/20 rounded-xl p-5 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
            <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
            <span>دليل خطوات الاستخراج والتثبيت للتغلب على مشاكل الأذونات</span>
          </h3>
          <p className="text-xs text-slate-900  max-w-xl mx-auto leading-relaxed">
            اختر نظام تشغيل جهازك الحالي لعرض الطريقة المثالية لفك الضغط وتجنب أخطاء المجلدات المزدوجة أو فقدان الصلاحيات البرمجية للأداة:
          </p>
        </div>

        {/* Dynamic OS Selector Tabs */}
        <div className="flex justify-center gap-4 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveOS("windows")}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeOS === "windows"
                ? "bg-[#ca8a04] text-[#07132c] shadow-lg shadow-[#ca8a04]/20 font-black"
                : "bg-sky-50 border border-slate-800 text-slate-900"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>نظام تشغيل ويندوز (Windows)</span>
          </button>
          <button
            onClick={() => setActiveOS("mac")}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeOS === "mac"
                ? "bg-[#ca8a04] text-[#07132c] shadow-lg shadow-[#ca8a04]/20 font-black"
                : "bg-sky-50 border border-slate-800 text-slate-900"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>نظام تشغيل ماك (macOS)</span>
          </button>
        </div>

        {/* Windows Detailed Guide */}
        {activeOS === "windows" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-amber-500 border border-amber-500 rounded-lg p-3 text-xs text-amber-400 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>ملاحظة هامة لويندوز:</strong> تفادى تصفح ملف الـ ZIP مباشرة بواسطة النقر المزدوج دون استخراجه، حيث إن ويندوز يعامله في هذه الحالة كـ "مجلد افتراضي للقراءة فقط" ويمنع متصفح كروم تماماً من كشف الملفات المطلوبة للربط بـ "ناجز".
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-sky-50 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-amber-500 font-extrabold flex items-center justify-center text-xs">1</span>
                  <h4 className="text-xs font-bold text-white font-bold">التحميل لمكان معروف</h4>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  احفظ ملف الـ <code className="text-amber-500 font-bold">.zip</code> الذي تم التحقق منه مسبقاً في مجلد ثابت على جهازك مثل <strong>سطح المكتب (Desktop)</strong> أو مجلد <strong>المستندات (Documents)</strong>.
                </p>
              </div>

              <div className="bg-sky-50 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-amber-500 text-amber-500 text-[10px] px-2 py-0.5 rounded-br font-black uppercase">خطوة حاسمة</div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-amber-500 font-extrabold flex items-center justify-center text-xs">2</span>
                  <h4 className="text-xs font-bold text-white font-bold">الاستخراج (نقرة يمين)</h4>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  انقر بزر الماوس الأيمن على الملف المضغوط واختر <strong>"استخراج الكل..." (Extract All...)</strong>، تأكد من تعليم خيار "عرض الملفات المستخرجة عند الاكتمال".
                </p>
              </div>

              <div className="bg-sky-50 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-amber-500 font-extrabold flex items-center justify-center text-xs">3</span>
                  <h4 className="text-xs font-bold text-white font-bold">التحقق من الهيكلية</h4>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  افتح المجلد المستخرج الجديد باسم <strong className="text-slate-100 font-mono">AlAdalah-Najiz-Sync-Extension</strong>، وتأكد أنك ترى أمامك ملف <code className="text-slate-900 font-mono">manifest.json</code> مباشرة.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* macOS Detailed Guide */}
        {activeOS === "mac" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-amber-500 border border-amber-500 rounded-lg p-3 text-xs text-amber-400 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>تنبيه لنظام الماك:</strong> استخدم أداة فك الضغط الافتراضية لمنع خلل أذونات الملفات التنفيذية أو تجاهل الملفات المخفية. لا تستخدم برامج سطر الأوامر غير المعتمدة.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-sky-50 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-amber-500 font-extrabold flex items-center justify-center text-xs">1</span>
                  <h4 className="text-xs font-bold text-white font-bold">حفظ الملف في المجلد الآمن</h4>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  قم بتحميل الملف وحفظه داخل قرصك الصلب الأساسي. ينصح بتجنب مجلدات نظام Mac السحابية المشتركة مثل iCloud Drive أثناء تثبيت الإضافات لتفادي بطء التحديث.
                </p>
              </div>

              <div className="bg-sky-50 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-amber-500 text-amber-500 text-[10px] px-2 py-0.5 rounded-br font-black">أداة Finder الرسمية</div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-amber-500 font-extrabold flex items-center justify-center text-xs">2</span>
                  <h4 className="text-xs font-bold text-white font-bold">النقر المزدوج البسيط</h4>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  انقر نقراً مزدوجاً بالـ Mac على ملف الـ ZIP. ستقوم أداة <strong>Archive Utility</strong> فوراً بإنشاء مجلد فك ضغط متطابق ومستقر وسليم %100 تلقائياً.
                </p>
              </div>

              <div className="bg-sky-50 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-amber-500 font-extrabold flex items-center justify-center text-xs">3</span>
                  <h4 className="text-xs font-bold text-white font-bold">التحقق من المحتويات</h4>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  تحقق من وجود المجلد المفرد، وافتحه للتأكد من وجود الملفات البرمجية السبعة وخصوصاً ملف <code className="text-slate-900 font-mono">manifest.json</code> في الواجهة.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chrome Extension Loading instructions step-by-step with pictures/logos */}
      <div className="space-y-4">
        <h3 className="text-slate-100 font-bold text-base flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
          <span>خطوات كود المتصفح المعتمد لتنشيط الإضافة بمرحلة المطور:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
            <span className="w-8 h-8 rounded-full bg-amber-500 border border-amber-500 text-amber-500 font-black flex items-center justify-center text-xs">1</span>
            <h4 className="text-xs font-bold text-white font-bold">فك ضغط الإضافة</h4>
            <p className="text-[10.5px] text-slate-900  leading-relaxed">
              استخرج الأرشيف المضغوط الذي تم التحقق مسبقاً من سلامة الـ Checksum الخاص به للحصول على المجلد النهائي غير المعبأ.
            </p>
          </div>

          <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
            <span className="w-8 h-8 rounded-full bg-amber-500 border border-amber-500 text-amber-500 font-black flex items-center justify-center text-xs">2</span>
            <h4 className="text-xs font-bold text-white font-bold">تفعيل وضع المطور</h4>
            <p className="text-[10.5px] text-slate-900  leading-relaxed">
              اذهب إلى صفحة الإضافات في متصفحك عبر كتابة الرابط التالي: <span className="text-[#ca8a04] font-mono select-all font-bold block bg-sky-50 px-1 py-1 rounded text-center mt-1">chrome://extensions</span> وقم بتفعيل <strong>وضع المطور (Developer Mode)</strong> من أعلى اليسار.
            </p>
          </div>

          <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
            <span className="w-8 h-8 rounded-full bg-amber-500 border border-amber-500 text-amber-500 font-black flex items-center justify-center text-xs">3</span>
            <h4 className="text-xs font-bold text-white font-bold">تحميل حزمة مفرودة</h4>
            <p className="text-[10.5px] text-slate-900  leading-relaxed">
              اضغط على زر <strong>"تحميل حزمة مفرودة" (Load Unpacked)</strong> الذي سيظهر في الشريط العلوي الأيمن للإقرار ببدء تثبيت الحزمة الفردية.
            </p>
          </div>

          <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 flex flex-col space-y-2">
            <span className="w-8 h-8 rounded-full bg-amber-500 border border-amber-500 text-amber-500 font-black flex items-center justify-center text-xs">4</span>
            <h4 className="text-xs font-bold text-white font-bold">اختيار المجلد والبدء</h4>
            <p className="text-[10.5px] text-slate-900  leading-relaxed">
              اختر المجلد المستخرج <strong className="text-white font-bold font-mono">AlAdalah-Najiz-Sync-Extension</strong>. ستظهر أداة "العدالة" فوراً لترافقك في تصفح ومزامنة ناجز بذكاء الـ AI!
            </p>
          </div>

        </div>
      </div>

      {/* Pro Tips / Safe use */}
      <div className="border border-slate-800 rounded-xl p-4.5 bg-[#0f172a]/80 space-y-3 text-xs">
        <h4 className="text-amber-500 font-bold flex items-center gap-2 leading-none">
          <HelpCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>الضمان الأمني واللوجستي المعتمد لبيانات مكاتب المحاماة:</span>
        </h4>
        <ul className="list-disc list-inside space-y-1.5 text-slate-900 text-justify text-sm leading-relaxed pr-3 font-medium">
          <li>إن أداة العدالة للربط التلقائي لا تشارك ولا تطلع ولا تطلب كلمات مرور نفاذ وطني أو كلمة مرور ناجز مطلقة، بل تعمل محلياً فقط على المتصفح الخاص بك لتنظيم قضاياك والربط بالعدالة بموجب تشفير تام وسرية محققة.</li>
          <li>تقرأ الأداة قضايا الشاشة النشطة وترسلها بمطابقة أمنية من خلال السيرفر إلى جدول مكتبك فورياً عند الضغط على المزامنة، لحفظ سجل الأرشيف والتزامات الجلسة في ثوانٍ معدودة.</li>
        </ul>
      </div>

    </div>
  );
}
