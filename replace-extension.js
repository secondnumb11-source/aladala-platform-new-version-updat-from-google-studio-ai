const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/NajizExtensionHub.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The new extension chunks
const newExtensionCode = `
      // ===== manifest.json =====
      folder.file('manifest.json', JSON.stringify({
        manifest_version: 3,
        name: "منصة العدالة لإدارة مكاتب المحاماة",
        short_name: "منصة العدالة",
        version: "2.0.0",
        description: "أداة سحب ومزامنة بيانات القضايا والموكلين والجلسات والوكالات وطلبات التنفيذ من منصة ناجز إلى منصة العدالة.",
        default_locale: "ar",
        permissions: ["storage", "activeTab", "scripting", "alarms", "notifications", "tabs"],
        host_permissions: [
          "https://najiz.sa/*",
          "https://www.najiz.sa/*",
          "https://*.najiz.sa/*",
          "https://*.lovable.app/*",
          "https://*.lovableproject.com/*",
          "http://localhost/*",
          "https://aladala-platform-rnuz.onrender.com/*"
        ],
        action: {
          default_popup: "popup.html",
          default_title: "منصة العدالة - مزامنة ناجز"
        },
        background: {
          service_worker: "background.js",
          type: "module"
        },
        options_page: "options.html",
        content_scripts: [
          {
            matches: ["https://najiz.sa/*", "https://www.najiz.sa/*", "https://*.najiz.sa/*"],
            js: ["content.js"],
            css: ["content.css"],
            run_at: "document_idle",
            all_frames: false
          }
        ],
        web_accessible_resources: [
          {
            resources: ["injected.js"],
            matches: ["https://*.najiz.sa/*", "https://najiz.sa/*"]
          }
        ]
      }, null, 2));

      // ===== background.js =====
      folder.file('background.js', \`
const ALARM = "adala-auto-sync";

chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.local.get("settings");
  const deviceId = (await chrome.storage.local.get("deviceId")).deviceId || crypto.randomUUID();
  if (!settings) await chrome.storage.local.set({ settings: { interval: 60, autoSync: false }, deviceId });
  else await chrome.storage.local.set({ deviceId });
  schedule();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.action === "RESCHEDULE") { await schedule(); return sendResponse({ ok: true }); }
      if (msg.action === "PUSH") {
        const r = await push(msg.type, msg.payload, msg.pageUrl);
        return sendResponse(r);
      }
      if (msg.action === "SYNC") {
        const r = await syncFromTab(msg.type, msg.tabId);
        return sendResponse(r);
      }
    } catch (e) { sendResponse({ ok: false, error: e.message }); }
  })();
  return true;
});

async function syncFromTab(type, tabId) {
  let scraped = await chrome.tabs.sendMessage(tabId, { action: "SCRAPE", type }).catch(() => null);
  if (!scraped?.ok) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }).catch(() => null);
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] }).catch(() => null);
    await new Promise((resolve) => setTimeout(resolve, 500));
    scraped = await chrome.tabs.sendMessage(tabId, { action: "SCRAPE", type }).catch(() => null);
  }
  if (!scraped?.ok) return { ok: false, error: "تعذّر سحب البيانات من الصفحة. افتح صفحة بيانات داخل ناجز بعد تسجيل الدخول ثم أعد المحاولة." };
  const r = await push(type, scraped.payload);
  return { ...r, count: scraped.payload?.summary?.totalItems ?? scraped.payload?.items?.length ?? 0 };
}

async function push(type, payload, pageUrl) {
  const { settings = {}, deviceId } = await chrome.storage.local.get(["settings", "deviceId"]);
  if (!settings.apiUrl) {
    return { ok: false, error: "أضف رابط الواجهة (API URL) من صفحة الإعدادات" };
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (settings.apiKey) {
      headers["X-API-Key"] = settings.apiKey;
      headers["Authorization"] = \\\`Bearer \\\${settings.apiKey}\\\`;
    }
    const res = await fetch(settings.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "najiz-extension",
        type, payload, pageUrl: pageUrl || payload?.url,
        extension: { version: chrome.runtime.getManifest().version, deviceId },
        sentAt: new Date().toISOString(),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: data?.error ? \\\`HTTP \\\${res.status}: \\\${data.error}\\\` : \\\`HTTP \\\${res.status}\\\` };
    }
    await chrome.storage.local.set({ lastSync: Date.now(), lastSyncResult: data });
    notify("تمت المزامنة بنجاح", \\\`تم إرسال \\\${data?.itemCount ?? payload?.summary?.totalItems ?? 0} عنصر إلى المنصة.\\\`);
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function schedule() {
  await chrome.alarms.clear(ALARM);
  const { settings = {} } = await chrome.storage.local.get("settings");
  if (settings.autoSync && settings.interval) {
    chrome.alarms.create(ALARM, { periodInMinutes: settings.interval });
  }
}

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== ALARM) return;
  const tabs = await chrome.tabs.query({ url: ["*://*.najiz.sa/*", "*://najiz.sa/*"] });
  if (!tabs.length) return; 
  await syncFromTab("all", tabs[0].id);
});

function notify(title, message) {
  try {
    chrome.notifications.create({
      type: "basic", iconUrl: "icon128.png", title, message, priority: 1,
    });
  } catch {}
}
\`.trim());

      // ===== content.css =====
      folder.file('content.css', \`
#adala-fab {
  position: fixed; bottom: 24px; left: 24px; z-index: 2147483646;
  background: linear-gradient(135deg,#C9A24B,#E6C167); color:#1a1303;
  border: 0; border-radius: 50px; padding: 12px 18px; font-weight: 800;
  font-family: "Segoe UI","Cairo",sans-serif; font-size: 14px; cursor: pointer;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,.5), 0 0 0 2px #0B1A33;
  display: flex; align-items: center; gap: 8px; direction: rtl;
}
#adala-fab:hover { filter: brightness(1.05); }
#adala-panel {
  position: fixed; bottom: 80px; left: 24px; z-index: 2147483647;
  width: 320px; background: linear-gradient(160deg,#0B1A33,#11264a);
  color: #fff; border: 1px solid rgba(201,162,75,.45); border-radius: 14px;
  box-shadow: 0 20px 50px -10px rgba(0,0,0,.6); padding: 14px; direction: rtl;
  font-family: "Segoe UI","Cairo",sans-serif;
}
#adala-panel h3 { color:#FFE27A; font-size:14px; margin:0 0 10px; }
#adala-panel .adala-consent { color:#BFC9DA; font-size:11px; line-height:1.6; margin:0 0 10px; }
#adala-panel .adala-all { width:100%; background:linear-gradient(135deg,#C9A24B,#E6C167); color:#1a1303;
  border:0;padding:10px;border-radius:8px;font-weight:800;cursor:pointer;margin-bottom:10px;font-size:13px;}
#adala-panel .adala-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
#adala-panel .adala-grid button {
  background: rgba(201,162,75,.1); border:1px solid rgba(201,162,75,.4);
  color:#FFE27A; padding:8px; border-radius:7px; cursor:pointer; font-size:12px; font-family:inherit;
}
#adala-panel .adala-grid button:hover { background: rgba(201,162,75,.22); }
#adala-panel .adala-status { margin-top:10px; font-size:12px; color:#BFC9DA; min-height:16px; }
#adala-panel .adala-status.ok { color:#4ade80; }
#adala-panel .adala-status.err { color:#ff8a8a; }
#adala-panel .adala-close { position:absolute; top:8px; left:10px; background:none; border:0; color:#FFE27A; cursor:pointer; font-size:18px;}
\`.trim());

      // ===== content.js =====
      folder.file('content.js', \`
(function () {
  if (window.__adalaNajizContentInjected) return;
  window.__adalaNajizContentInjected = true;

  const CAPTURE_KEY = "adalaNajizNetworkCaptures";
  const MAX_CAPTURED_RESPONSES = 80;
  const MAX_RAW_TEXT = 1600;
  const TYPES = [
    ["all", "مزامنة جميع البيانات"],
    ["cases", "القضايا"],
    ["clients", "الموكلون والأطراف"],
    ["sessions", "مواعيد الجلسات"],
    ["executions", "طلبات التنفيذ"],
    ["requests", "الطلبات على القضايا"],
    ["minutes", "محاضر ضبط الجلسات"],
    ["agencies", "الوكالات"],
    ["judgments", "الأحكام والاستئناف"],
    ["notices", "الإشعارات"],
    ["documents", "المستندات والمرفقات"],
  ];

  const captured = [];
  injectNetworkBridge();
  createFloatingPanel();

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "ADALA_NAJIZ_BRIDGE") return;
    rememberNetworkPayload(event.data.payload);
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.action !== "SCRAPE") return false;
    scrape(msg.type || "all")
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
    return true;
  });

  async function rememberNetworkPayload(payload) {
    if (!payload?.url || payload.status >= 400) return;
    if (!isNajizBusinessUrl(payload.url) && !containsNajizBusinessWords(payload.body)) return;
    const entry = {
      url: payload.url,
      method: payload.method || "GET",
      status: payload.status,
      ts: payload.ts || Date.now(),
      body: trimPayload(payload.body),
    };
    captured.unshift(entry);
    if (captured.length > MAX_CAPTURED_RESPONSES) captured.length = MAX_CAPTURED_RESPONSES;
    try {
      const stored = await chrome.storage.local.get(CAPTURE_KEY);
      const merged = [entry, ...(stored[CAPTURE_KEY] || [])].slice(0, MAX_CAPTURED_RESPONSES);
      await chrome.storage.local.set({ [CAPTURE_KEY]: dedupeBy(merged, (x) => \\\`\\\${x.url}|\\\${JSON.stringify(x.body).slice(0, 240)}\\\`) });
    } catch {
    }
  }

  function injectNetworkBridge() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected.js");
    script.async = false;
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  function createFloatingPanel() {
    const fab = document.createElement("button");
    fab.id = "adala-fab";
    fab.type = "button";
    fab.textContent = "⚖ منصة العدالة — مزامنة";
    document.documentElement.appendChild(fab);

    let panel;
    fab.addEventListener("click", () => {
      if (panel) {
        panel.remove();
        panel = null;
        return;
      }
      panel = document.createElement("div");
      panel.id = "adala-panel";
      panel.innerHTML = \\\`
        <button class="adala-close" type="button" aria-label="إغلاق">×</button>
        <h3>مزامنة بيانات ناجز إلى منصة العدالة</h3>
        <p class="adala-consent">بالضغط على المزامنة أنت توافق على إرسال البيانات الظاهرة والمحمّلة في هذه الصفحة إلى نظامك.</p>
        <button class="adala-all" type="button" data-t="all">⇅ مزامنة كل ما تم العثور عليه</button>
        <div class="adala-grid">
          \\\${TYPES.slice(1).map(([key, label]) => \\\`<button type="button" data-t="\\\${key}">\\\${label}</button>\\\`).join("")}
        </div>
        <div class="adala-status" id="adalaStatus">جاهز — افتح صفحة بيانات داخل ناجز بعد تسجيل الدخول</div>
      \\\`;
      document.documentElement.appendChild(panel);
      panel.querySelector(".adala-close").onclick = () => {
        panel.remove();
        panel = null;
      };
      panel.querySelectorAll("button[data-t]").forEach((button) => {
        button.addEventListener("click", () => doSync(button.dataset.t));
      });
    });
  }

  async function doSync(type) {
    const status = document.getElementById("adalaStatus");
    if (!status) return;
    status.className = "adala-status";
    status.textContent = "جارٍ قراءة بيانات الصفحة وإرسالها…";
    try {
      const payload = await scrape(type);
      const result = await chrome.runtime.sendMessage({ action: "PUSH", type, payload, pageUrl: location.href });
      if (result?.ok) {
        status.className = "adala-status ok";
        status.textContent = \\\`✓ وصلت للمنصة: \\\${payload.summary.totalItems} عنصر (\\\${payload.summary.networkResponses} استجابة شبكة)\\\`;
      } else {
        status.className = "adala-status err";
        status.textContent = \\\`✗ \\\${result?.error || "فشل الإرسال"}\\\`;
      }
    } catch (error) {
      status.className = "adala-status err";
      status.textContent = \\\`✗ \\\${error?.message || String(error)}\\\`;
    }
  }

  async function scrape(type) {
    await waitForPageQuiet();
    const network = await getStoredCaptures(type);
    const domItems = collectDomItems();
    const networkItems = collectNetworkItems(network, type);
    const items = dedupeObjects([...domItems, ...networkItems]);
    const normalized = normalizeItems(items, type);
    const summary = makeSummary(normalized, items, network);

    return {
      type,
      url: location.href,
      title: document.title,
      capturedAt: new Date().toISOString(),
      source: "najiz-content-v2",
      summary,
      normalized,
      items: filterItemsForType(items, type).slice(0, 500),
      network: network.map((entry) => ({ url: entry.url, method: entry.method, status: entry.status, ts: entry.ts })).slice(0, 40),
    };
  }

  async function getStoredCaptures(type) {
    const stored = await chrome.storage.local.get(CAPTURE_KEY).catch(() => ({}));
    const list = dedupeBy([...(captured || []), ...((stored && stored[CAPTURE_KEY]) || [])], (x) => \\\`\\\${x.url}|\\\${JSON.stringify(x.body).slice(0, 240)}\\\`);
    return list.filter((entry) => type === "all" || isCaptureRelevantToType(entry, type)).slice(0, MAX_CAPTURED_RESPONSES);
  }

  function collectDomItems() {
    const items = [];
    document.querySelectorAll("table").forEach((table, tableIndex) => {
      const headers = [...table.querySelectorAll("thead th, thead td")].map((cell) => clean(cell.innerText || cell.textContent));
      const rows = table.querySelectorAll("tbody tr").length ? table.querySelectorAll("tbody tr") : table.querySelectorAll("tr");
      rows.forEach((row, rowIndex) => {
        const cells = [...row.querySelectorAll("td, th")].map((cell) => clean(cell.innerText || cell.textContent));
        if (cells.length < 2 || cells.join(" ").length < 4) return;
        const fields = {};
        cells.forEach((value, index) => {
          fields[headers[index] || \\\`column_\\\${index + 1}\\\`] = value;
        });
        items.push({ _source: "dom_table", _kind: inferKindFromText(cells.join(" ")), tableIndex, rowIndex, fields, text: cells.join(" | ") });
      });
    });

    const selector = [
      "[role='row']",
      "[class*='card' i]",
      "[class*='item' i]",
      "[class*='list' i] > *",
      "[class*='result' i]",
      "[class*='request' i]",
    ].join(",");
    document.querySelectorAll(selector).forEach((element, index) => {
      if (element.closest("#adala-panel") || element.id === "adala-fab") return;
      const text = clean(element.innerText || element.textContent);
      if (text.length < 25 || text.length > MAX_RAW_TEXT) return;
      items.push({ _source: "dom_block", _kind: inferKindFromText(text), index, text, fields: extractFieldsFromText(text) });
    });

    return items;
  }

  function collectNetworkItems(network, type) {
    const items = [];
    network.forEach((entry) => {
      const objects = flattenObjects(entry.body).slice(0, 300);
      objects.forEach((object, index) => {
        const text = objectToText(object);
        if (text.length < 8 || !isBusinessObject(object, text)) return;
        const kind = inferKindFromText(\\\`\\\${entry.url} \\\${text}\\\`);
        if (type !== "all" && !kindMatchesType(kind, type) && !isTextRelevantToType(\\\`\\\${entry.url} \\\${text}\\\`, type)) return;
        items.push({ _source: "network", _kind: kind, url: entry.url, index, fields: compactObject(object), text: text.slice(0, MAX_RAW_TEXT) });
      });
    });
    return items;
  }

  function normalizeItems(items, type) {
    const filtered = filterItemsForType(items, type);
    return {
      cases: normalizeCollection(filtered, "case", normalizeCase),
      clients: normalizeCollection(filtered, "client", normalizeClient),
      sessions: normalizeCollection(filtered, "session", normalizeSession),
      agencies: normalizeCollection(filtered, "agency", normalizeAgency),
      executions: normalizeCollection(filtered, "execution", normalizeExecution),
      requests: normalizeCollection(filtered, "request", normalizeRequest),
      minutes: normalizeCollection(filtered, "minute", normalizeMinute),
      judgments: normalizeCollection(filtered, "judgment", normalizeJudgment),
      notices: normalizeCollection(filtered, "notice", normalizeNotice),
      documents: normalizeCollection(filtered, "document", normalizeDocument),
    };
  }

  function normalizeCollection(items, kind, mapper) {
    const relevant = items.filter((item) => item._kind === kind || (kind === "client" && /مدعي|مدعى|موكل|وكيل|طرف/.test(item.text || "")));
    return dedupeObjects(relevant.map(mapper).filter(Boolean)).slice(0, 200);
  }

  function normalizeCase(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const caseNumber = valueByKeys(fields, /case.*(no|num|id)|lawsuit.*(no|num|id)|رقم.*(قض|دعوى)|قضية/i) || match(text, /\\b\\d{4}\\s*\\/\\s*\\d{3,}\\b|\\b\\d{9,}\\b/);
    if (!caseNumber && !/قضية|دعوى|محكمة/.test(text)) return null;
    return {
      caseNumber: caseNumber || "",
      caseName: valueByKeys(fields, /name|title|subject|اسم|موضوع|وصف/i) || firstLine(text),
      court: valueByKeys(fields, /court|محكمة|دائرة/i) || match(text, /[^\\n|،]{0,30}محكمة[^\\n|،]{0,40}/),
      status: valueByKeys(fields, /status|state|حالة/i) || match(text, /قيد النظر|منتهية|منتهي|محكوم|مؤجلة|نشطة|مغلقة/),
      raw: item,
    };
  }

  function normalizeClient(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const name = valueByKeys(fields, /client|party|person|plaintiff|defendant|name|موكل|طرف|مدعي|مدعى|اسم/i) || match(text, /(المدعي|المدعى عليه|الموكل|الوكيل|صاحب الطلب)\\s*[:：]?\\s*([^|\\n،]{3,80})/, 2);
    if (!name) return null;
    return {
      name: clean(name),
      role: valueByKeys(fields, /role|صفة|دور/i) || match(text, /مدعي|مدعى عليه|موكل|وكيل|منفذ ضده|طالب التنفيذ/),
      identityNumber: valueByKeys(fields, /national|identity|idNumber|هوية|سجل/i) || match(text, /\\b[12]\\d{9}\\b/),
      raw: item,
    };
  }

  function normalizeSession(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const date = valueByKeys(fields, /date|sessionDate|hearingDate|تاريخ|موعد/i) || matchDate(text);
    if (!date && !/جلسة|موعد|تقاضي/.test(text)) return null;
    return {
      date: date || "",
      time: valueByKeys(fields, /time|وقت|ساعة/i) || match(text, /\\b\\d{1,2}:\\d{2}\\b/),
      caseNumber: valueByKeys(fields, /case.*(no|num)|رقم.*قض/i) || match(text, /\\b\\d{4}\\s*\\/\\s*\\d{3,}\\b|\\b\\d{9,}\\b/),
      court: valueByKeys(fields, /court|محكمة|دائرة/i) || match(text, /[^\\n|،]{0,30}محكمة[^\\n|،]{0,40}/),
      raw: item,
    };
  }

  function normalizeAgency(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const agencyNumber = valueByKeys(fields, /agency|poa|wakalah|وكال|رقم/i) || match(text, /\\b\\d{9,}\\b/);
    if (!agencyNumber && !/وكالة|وكالات|موكل|وكيل/.test(text)) return null;
    return {
      agencyNumber: agencyNumber || "",
      principal: valueByKeys(fields, /principal|موكل/i) || "",
      agent: valueByKeys(fields, /agent|وكيل/i) || "",
      expiryDate: valueByKeys(fields, /expiry|expire|endDate|انتهاء|نهاية/i) || matchDate(text),
      raw: item,
    };
  }

  function normalizeExecution(item) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    const executionNumber = valueByKeys(fields, /execution|enforcement|request.*(no|num)|تنفيذ|طلب/i) || match(text, /\\b\\d{9,}\\b/);
    if (!executionNumber && !/تنفيذ|منفذ|طالب التنفيذ/.test(text)) return null;
    return { executionNumber: executionNumber || "", status: valueByKeys(fields, /status|حالة/i) || "", raw: item };
  }

  function normalizeRequest(item) { return normalizeGeneric(item, /طلب|requests?/i, "requestNumber"); }
  function normalizeMinute(item) { return normalizeGeneric(item, /محضر|ضبط|minutes?/i, "minuteNumber"); }
  function normalizeJudgment(item) { return normalizeGeneric(item, /حكم|استئناف|judg|appeal/i, "judgmentNumber"); }
  function normalizeNotice(item) { return normalizeGeneric(item, /إشعار|اشعار|تنبيه|notification|notice/i, "noticeNumber"); }
  function normalizeDocument(item) { return normalizeGeneric(item, /مستند|مرفق|وثيقة|document|attachment/i, "documentNumber"); }

  function normalizeGeneric(item, keyword, idField) {
    const fields = item.fields || {};
    const text = item.text || objectToText(fields);
    if (!keyword.test(text) && !keyword.test(objectToText(fields))) return null;
    return {
      [idField]: valueByKeys(fields, /number|num|no|id|رقم/i) || match(text, /\\b\\d{6,}\\b/) || "",
      title: valueByKeys(fields, /title|name|subject|اسم|موضوع|نوع/i) || firstLine(text),
      date: valueByKeys(fields, /date|تاريخ/i) || matchDate(text),
      raw: item,
    };
  }

  function makeSummary(normalized, items, network) {
    return {
      totalItems: items.length,
      networkResponses: network.length,
      cases: normalized.cases.length,
      clients: normalized.clients.length,
      sessions: normalized.sessions.length,
      agencies: normalized.agencies.length,
      executions: normalized.executions.length,
      requests: normalized.requests.length,
      minutes: normalized.minutes.length,
      judgments: normalized.judgments.length,
      notices: normalized.notices.length,
      documents: normalized.documents.length,
    };
  }

  function filterItemsForType(items, type) {
    if (type === "all") return items;
    return items.filter((item) => kindMatchesType(item._kind, type) || isTextRelevantToType(\\\`\\\${item.url || ""} \\\${item.text || ""} \\\${objectToText(item.fields || {})}\\\`, type));
  }

  function inferKindFromText(text) {
    const value = clean(text);
    if (/(lawsuit|case|قضية|قضايا|دعوى|دعاوى|محكمة)/i.test(value)) return "case";
    if (/(hearing|session|appointment|جلسة|جلسات|موعد|مواعيد)/i.test(value)) return "session";
    if (/(agency|poa|wakalah|wekal|وكالة|وكالات|وكيل|موكل)/i.test(value)) return "agency";
    if (/(execution|enforcement|iexecution|تنفيذ|منفذ)/i.test(value)) return "execution";
    if (/(request|طلبات|طلب على القضية|طلب جديد)/i.test(value)) return "request";
    if (/(minute|minutes|محضر|ضبط)/i.test(value)) return "minute";
    if (/(judgment|appeal|حكم|أحكام|استئناف)/i.test(value)) return "judgment";
    if (/(notice|notification|إشعار|اشعار|تنبيه)/i.test(value)) return "notice";
    if (/(document|attachment|مستند|مرفق|وثيقة)/i.test(value)) return "document";
    if (/(client|party|person|مدعي|مدعى|طرف|أطراف)/i.test(value)) return "client";
    return "record";
  }

  function kindMatchesType(kind, type) {
    const map = { cases: "case", clients: "client", sessions: "session", executions: "execution", requests: "request", minutes: "minute", agencies: "agency", judgments: "judgment", notices: "notice", documents: "document" };
    return map[type] === kind;
  }

  function isCaptureRelevantToType(entry, type) { return isTextRelevantToType(\\\`\\\${entry.url} \\\${objectToText(entry.body)}\\\`, type); }
  function isTextRelevantToType(text, type) { return kindMatchesType(inferKindFromText(text), type); }
  function isNajizBusinessUrl(url) { return /(lawsuit|case|hearing|session|appointment|agency|wekal|poa|execution|notification|document|judgment|appeal|request)/i.test(url || ""); }
  function containsNajizBusinessWords(body) { return /(قضية|قضايا|دعوى|جلسة|وكالة|تنفيذ|محكمة|موكل|مدعي|إشعار|مستند|حكم)/.test(objectToText(body)); }
  function isBusinessObject(object, text) { return object && typeof object === "object" && (Object.keys(object).length >= 2 || /\\d{6,}|قضية|جلسة|وكالة|تنفيذ|محكمة/.test(text)); }

  function flattenObjects(value, output = [], depth = 0) {
    if (depth > 7 || output.length > 1000 || value == null) return output;
    if (Array.isArray(value)) {
      value.forEach((item) => flattenObjects(item, output, depth + 1));
      return output;
    }
    if (typeof value === "object") {
      output.push(value);
      Object.values(value).forEach((item) => {
        if (item && typeof item === "object") flattenObjects(item, output, depth + 1);
      });
    }
    return output;
  }

  function compactObject(object) {
    const result = {};
    Object.entries(object || {}).forEach(([key, value]) => {
      if (value == null) return;
      if (["string", "number", "boolean"].includes(typeof value)) result[key] = String(value).slice(0, 500);
    });
    return result;
  }

  function extractFieldsFromText(text) {
    const fields = {};
    text.split(/\\n|\\|/).forEach((line) => {
      const parts = line.split(/:|：/);
      if (parts.length >= 2) fields[clean(parts[0])] = clean(parts.slice(1).join(":"));
    });
    return fields;
  }

  function trimPayload(value) {
    if (value == null) return value;
    const json = JSON.stringify(value);
    if (json.length < 250000) return value;
    return { __truncated: true, preview: json.slice(0, 240000) };
  }

  function valueByKeys(fields, pattern) {
    const entries = Object.entries(fields || {});
    const direct = entries.find(([key]) => pattern.test(key));
    if (direct) return clean(String(direct[1]));
    const nestedText = objectToText(fields);
    return pattern.test(nestedText) ? "" : "";
  }

  function objectToText(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value !== "object") return String(value);
    try { return JSON.stringify(value, null, 1); } catch { return String(value); }
  }

  function dedupeObjects(items) { return dedupeBy(items, (item) => JSON.stringify(item).slice(0, 1200)); }
  function dedupeBy(items, keyFn) {
    const seen = new Set();
    return items.filter((item) => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function match(text, regex, group = 0) { const found = clean(text).match(regex); return found ? clean(found[group] || found[0]) : ""; }
  function matchDate(text) { return match(text, /\\b\\d{4}[\\/-]\\d{1,2}[\\/-]\\d{1,2}\\b|\\b\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{4}\\b|\\b\\d{1,2}\\s+[\\u0600-\\u06FF]+\\s+\\d{4}\\b/); }
  function firstLine(text) { return clean(text).split(/\\n|\\|/).find(Boolean)?.slice(0, 120) || ""; }
  function clean(value) { return (value || "").toString().replace(/\\s+/g, " ").trim(); }
  function waitForPageQuiet() { return new Promise((resolve) => setTimeout(resolve, 900)); }
})();
\`.trim());

      // ===== injected.js =====
      folder.file('injected.js', \`
(function () {
  if (window.__adalaNajizBridgeInjected) return;
  window.__adalaNajizBridgeInjected = true;

  const SOURCE = "ADALA_NAJIZ_BRIDGE";
  const MAX_BODY_CHARS = 240000;

  function shouldCapture(url, contentType, body) {
    const target = String(url || "");
    if (!/najiz\\.sa|moj\\.gov\\.sa|najiz/i.test(target) && !containsBusinessWords(body)) return false;
    return /json|text|javascript/i.test(contentType || "") || containsBusinessWords(body) || /(lawsuit|case|session|hearing|agency|wekal|poa|execution|request|judgment|notice|document)/i.test(target);
  }

  function containsBusinessWords(body) {
    const text = typeof body === "string" ? body : safeStringify(body);
    return /(قضية|قضايا|دعوى|جلسة|وكالة|وكالات|تنفيذ|محكمة|موكل|مدعي|مدعى|إشعار|اشعار|مستند|مرفق|حكم|استئناف|طلبات)/.test(text);
  }

  function parseBody(text) {
    const value = String(text || "").slice(0, MAX_BODY_CHARS);
    try { return JSON.parse(value); } catch { return value; }
  }

  function safeStringify(value) {
    try { return JSON.stringify(value); } catch { return String(value || ""); }
  }

  function post(payload) {
    try {
      window.postMessage({ source: SOURCE, payload }, window.location.origin);
    } catch {
      window.postMessage({ source: SOURCE, payload }, "*");
    }
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = async function adalaFetch(input, init) {
      const response = await originalFetch.apply(this, arguments);
      try {
        const url = typeof input === "string" ? input : input?.url;
        const clone = response.clone();
        const contentType = clone.headers.get("content-type") || "";
        if (shouldCapture(url, contentType, "")) {
          clone.text().then((text) => {
            if (!shouldCapture(url, contentType, text)) return;
            post({ url: String(url || ""), method: init?.method || input?.method || "GET", status: response.status, ts: Date.now(), body: parseBody(text) });
          }).catch(() => {});
        }
      } catch {}
      return response;
    };
  }

  const OriginalXHR = window.XMLHttpRequest;
  if (OriginalXHR) {
    const originalOpen = OriginalXHR.prototype.open;
    const originalSend = OriginalXHR.prototype.send;
    OriginalXHR.prototype.open = function adalaOpen(method, url) {
      this.__adalaMethod = method;
      this.__adalaUrl = url;
      return originalOpen.apply(this, arguments);
    };
    OriginalXHR.prototype.send = function adalaSend() {
      this.addEventListener("load", function () {
        try {
          const contentType = this.getResponseHeader("content-type") || "";
          const text = typeof this.responseText === "string" ? this.responseText : "";
          if (!shouldCapture(this.__adalaUrl, contentType, text)) return;
          post({ url: String(this.__adalaUrl || ""), method: this.__adalaMethod || "GET", status: this.status, ts: Date.now(), body: parseBody(text) });
        } catch {}
      });
      return originalSend.apply(this, arguments);
    };
  }
})();
\`.trim());

      // ===== popup.html =====
      folder.file('popup.html', \`<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>منصة العدالة</title>
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <header class="hdr">
      <div>
        <h1>منصة العدالة</h1>
        <p class="sub">المزامنة المباشرة مع ناجز</p>
      </div>
    </header>

    <section id="statusCard" class="card status">
      <div class="row">
        <span class="dot" id="connDot"></span>
        <span id="connText">جارٍ التحقق من الاتصال…</span>
      </div>
      <div class="row small">
        <span>آخر مزامنة:</span>
        <strong id="lastSync">—</strong>
      </div>
    </section>

    <section class="card">
      <h2 class="title">اختر البيانات المراد مزامنتها</h2>

      <button class="btn btn-gold full" id="syncAll">
        ⇅ مزامنة جميع البيانات الآن
      </button>

      <div class="grid">
        <button class="btn btn-ghost" data-type="cases">القضايا</button>
        <button class="btn btn-ghost" data-type="clients">الموكلون والأطراف</button>
        <button class="btn btn-ghost" data-type="sessions">مواعيد الجلسات</button>
        <button class="btn btn-ghost" data-type="executions">طلبات التنفيذ</button>
        <button class="btn btn-ghost" data-type="requests">الطلبات على القضايا</button>
        <button class="btn btn-ghost" data-type="minutes">محاضر ضبط الجلسات</button>
        <button class="btn btn-ghost" data-type="agencies">الوكالات</button>
        <button class="btn btn-ghost" data-type="judgments">الأحكام والاستئناف</button>
        <button class="btn btn-ghost" data-type="notices">الإشعارات والتنبيهات</button>
        <button class="btn btn-ghost" data-type="documents">المستندات والمرفقات</button>
      </div>
    </section>

    <section class="card log">
      <h2 class="title">سجل المزامنة</h2>
      <ul id="logList"><li class="muted">لا توجد عمليات بعد.</li></ul>
    </section>

    <footer class="ftr">
      <button id="openOptions" class="link">⚙ الإعدادات وربط المنصة</button>
      <span class="ver">v2.0.0</span>
    </footer>

    <script src="popup.js"></script>
  </body>
</html>\`.trim());

      // ===== popup.css =====
      folder.file('popup.css', \`
:root {
  --navy: #0B1A33;
  --navy-2: #11264a;
  --navy-3: #1a3563;
  --gold: #C9A24B;
  --gold-2: #E6C167;
  --yellow: #FFE27A;
  --white: #FFFFFF;
  --muted: #BFC9DA;
  --danger: #ff6b6b;
  --ok: #4ade80;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 380px;
  font-family: "Segoe UI", "Tahoma", "Cairo", sans-serif;
  background: linear-gradient(160deg, var(--navy) 0%, var(--navy-2) 100%);
  color: var(--white);
}
body { padding: 14px; }

.hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.logo { width: 40px; height: 40px; border-radius: 10px; background: var(--navy-3); padding: 4px; }
.hdr h1 { font-size: 16px; color: var(--yellow); letter-spacing: .2px; }
.sub { font-size: 11px; color: var(--gold-2); }

.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(201,162,75,0.25);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}
.title { font-size: 13px; color: var(--gold-2); margin-bottom: 10px; font-weight: 700; }

.row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--white); }
.row.small { margin-top: 6px; font-size: 12px; color: var(--muted); }
.row.small strong { color: var(--yellow); font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--muted); box-shadow: 0 0 8px rgba(0,0,0,.4); }
.dot.ok { background: var(--ok); }
.dot.warn { background: var(--gold); }
.dot.err { background: var(--danger); }

.btn {
  border: 0; cursor: pointer; font-family: inherit; font-weight: 700;
  padding: 10px 12px; border-radius: 10px; font-size: 13px;
  transition: transform .05s ease, filter .15s ease;
}
.btn:active { transform: scale(.98); }
.btn.full { width: 100%; margin-bottom: 10px; }
.btn-gold {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%);
  color: #1a1303;
  box-shadow: 0 6px 16px -8px rgba(201,162,75,.7);
}
.btn-gold:hover { filter: brightness(1.05); }
.btn-ghost {
  background: rgba(201,162,75,0.08);
  border: 1px solid rgba(201,162,75,0.45);
  color: var(--yellow);
}
.btn-ghost:hover { background: rgba(201,162,75,0.18); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.log ul { list-style: none; max-height: 120px; overflow-y: auto; }
.log li { font-size: 12px; padding: 5px 0; border-bottom: 1px dashed rgba(255,255,255,.06); color: var(--white); }
.log li.muted { color: var(--muted); text-align: center; border: 0; }
.log li.ok { color: var(--ok); }
.log li.err { color: var(--danger); }

.ftr { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.link { background: transparent; border: 0; color: var(--gold-2); cursor: pointer; font-size: 12px; }
.link:hover { color: var(--yellow); text-decoration: underline; }
.ver { color: var(--muted); font-size: 11px; }
\`.trim());

      // ===== popup.js =====
      folder.file('popup.js', \`
const $ = (s) => document.querySelector(s);

function addLog(msg, cls = "") {
  const ul = $("#logList");
  if (ul.querySelector(".muted")) ul.innerHTML = "";
  const li = document.createElement("li");
  li.className = cls;
  const t = new Date().toLocaleTimeString("ar-SA");
  li.textContent = \\\`[\\\${t}] \\\${msg}\\\`;
  ul.prepend(li);
}

async function refreshStatus() {
  const { settings = {}, lastSync } = await chrome.storage.local.get(["settings", "lastSync"]);
  const dot = $("#connDot");
  const txt = $("#connText");
  if (!settings.apiUrl) {
    dot.className = "dot warn";
    txt.textContent = "لم يتم ربط المنصة بعد — افتح الإعدادات";
  } else {
    dot.className = "dot ok";
    txt.textContent = \\\`مرتبط بـ: \\\${new URL(settings.apiUrl).host}\\\`;
  }
  $("#lastSync").textContent = lastSync
    ? new Date(lastSync).toLocaleString("ar-SA")
    : "لم تتم بعد";
}

async function ensureNajizTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && /najiz\\\\.sa/.test(tab.url || "")) return tab;
  // Try any najiz tab
  const tabs = await chrome.tabs.query({ url: ["*://*.najiz.sa/*", "*://najiz.sa/*"] });
  if (tabs.length) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    return tabs[0];
  }
  // Open it
  return await chrome.tabs.create({ url: "https://www.najiz.sa/applications/landing" });
}

async function runSync(type) {
  addLog(\\\`بدء مزامنة: \\\${labelFor(type)}…\\\`);
  const tab = await ensureNajizTab();
  try {
    const res = await chrome.runtime.sendMessage({ action: "SYNC", type, tabId: tab.id });
    if (res?.ok) {
      addLog(\\\`✓ تمت مزامنة \\\${labelFor(type)} (\\\${res.count ?? 0} عنصر)\\\`, "ok");
    } else {
      addLog(\\\`✗ فشل: \\\${res?.error || "خطأ غير معروف"}\\\`, "err");
    }
  } catch (e) {
    addLog(\\\`✗ \\\${e.message}\\\`, "err");
  }
  refreshStatus();
}

function labelFor(t) {
  return {
    all: "جميع البيانات", cases: "القضايا", clients: "الموكلين",
    sessions: "مواعيد الجلسات", executions: "طلبات التنفيذ",
    requests: "الطلبات", minutes: "محاضر الجلسات",
    agencies: "الوكالات", judgments: "الأحكام",
    notices: "الإشعارات", documents: "المستندات",
  }[t] || t;
}

document.addEventListener("DOMContentLoaded", () => {
  refreshStatus();
  $("#syncAll").addEventListener("click", () => runSync("all"));
  document.querySelectorAll("[data-type]").forEach((b) =>
    b.addEventListener("click", () => runSync(b.dataset.type))
  );
  $("#openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());
});
\`.trim());

      // ===== options.html =====
      folder.file('options.html', \`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>إعدادات منصة العدالة</title>
  <style>
    :root{--navy:#0B1A33;--navy2:#11264a;--gold:#C9A24B;--gold2:#E6C167;--yellow:#FFE27A;--white:#fff;--muted:#BFC9DA;}
    *{box-sizing:border-box;margin:0;padding:0;font-family:"Segoe UI","Cairo",sans-serif}
    body{background:linear-gradient(160deg,var(--navy),var(--navy2));min-height:100vh;color:var(--white);padding:40px 16px}
    .wrap{max-width:640px;margin:0 auto}
    h1{color:var(--yellow);font-size:24px;margin-bottom:6px}
    .sub{color:var(--gold2);margin-bottom:24px;font-size:14px}
    .card{background:rgba(255,255,255,.04);border:1px solid rgba(201,162,75,.3);border-radius:14px;padding:22px;margin-bottom:16px}
    label{display:block;color:var(--yellow);font-weight:700;margin-bottom:6px;font-size:14px}
    .hint{color:var(--muted);font-size:12px;margin-bottom:10px;line-height:1.7}
    input,select{width:100%;padding:11px 12px;background:rgba(0,0,0,.25);border:1px solid rgba(201,162,75,.4);border-radius:8px;color:var(--white);font-size:14px;direction:ltr;text-align:left}
    input:focus{outline:none;border-color:var(--gold)}
    .field{margin-bottom:16px}
    .row{display:flex;gap:10px;align-items:center;margin-top:8px}
    .btn{cursor:pointer;border:0;padding:11px 18px;border-radius:8px;font-weight:700;font-size:14px;font-family:inherit}
    .btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1303}
    .btn-ghost{background:transparent;border:1px solid var(--gold);color:var(--yellow)}
    .ok{color:#4ade80;font-size:13px}
    .err{color:#ff8a8a;font-size:13px}
    .opt{display:flex;align-items:center;gap:8px;margin:6px 0;color:var(--white);font-size:13px}
    .opt input{width:auto}
    code{background:rgba(0,0,0,.3);padding:2px 6px;border-radius:4px;color:var(--gold2)}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>إعدادات الربط — منصة العدالة</h1>
    <p class="sub">اربط الإضافة بحساب مكتبك في منصة العدالة لإرسال بيانات ناجز تلقائياً.</p>

    <div class="card">
      <div class="field">
        <label>رابط واجهة المنصة (API URL)</label>
        <p class="hint">من إعدادات حسابك في منصة العدالة، انسخ رابط نقطة النهاية. مثال: <code>https://app.example.com/api/v1/sync</code></p>
        <input id="apiUrl" type="url" placeholder="https://your-platform.com/api/v1/sync" />
      </div>

      <div class="field">
        <label>مفتاح الربط (API Key) — اختياري</label>
        <p class="hint">يمكن تركه فارغاً. عند استخدام نظام حسابات لاحقاً يمكن وضع مفتاح ربط داخلي لتوجيه البيانات لحساب موظف محدد.</p>
        <input id="apiKey" type="text" placeholder="اختياري — يمكن تركه فارغاً" />
      </div>

      <div class="field">
        <label>المزامنة التلقائية</label>
        <div class="opt"><input type="checkbox" id="autoSync" /> <span>تفعيل المزامنة التلقائية في الخلفية</span></div>
        <div class="row">
          <span style="color:var(--muted);font-size:13px">كل</span>
          <select id="interval" style="width:140px;direction:rtl;text-align:right">
            <option value="15">15 دقيقة</option>
            <option value="30">30 دقيقة</option>
            <option value="60" selected>ساعة</option>
            <option value="180">3 ساعات</option>
            <option value="360">6 ساعات</option>
          </select>
        </div>
      </div>

      <div class="row">
        <button class="btn btn-gold" id="save">حفظ الإعدادات</button>
        <button class="btn btn-ghost" id="test">اختبار الاتصال</button>
        <span id="msg"></span>
      </div>
    </div>

    <div class="card">
      <label>كيف تستخدم الأداة؟</label>
      <ol style="color:var(--white);padding-inline-start:18px;line-height:2;font-size:14px">
        <li>افتح <code>https://www.najiz.sa</code> وسجّل دخولك بحسابك الشخصي.</li>
        <li>ستظهر شارة الأداة في أسفل الصفحة — اضغطها لاختيار البيانات.</li>
        <li>أو اضغط أيقونة الإضافة في شريط المتصفح واختر ما تريد مزامنته.</li>
        <li>سيتم إرسال البيانات تلقائياً إلى منصة العدالة وترتيبها في الأقسام المناسبة (القضايا، الموكلون، الجلسات…).</li>
      </ol>
    </div>
  </div>
  <script src="options.js"></script>
</body>
</html>\`.trim());

      // ===== options.js =====
      folder.file('options.js', \`
const $ = (s) => document.querySelector(s);

async function load() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  $("#apiUrl").value = settings.apiUrl || "";
  $("#apiKey").value = settings.apiKey || "";
  $("#autoSync").checked = !!settings.autoSync;
  $("#interval").value = String(settings.interval || 60);
}

async function save() {
  const settings = {
    apiUrl: $("#apiUrl").value.trim(),
    apiKey: $("#apiKey").value.trim(),
    autoSync: $("#autoSync").checked,
    interval: parseInt($("#interval").value, 10) || 60,
  };
  await chrome.storage.local.set({ settings });
  await chrome.runtime.sendMessage({ action: "RESCHEDULE" });
  show("✓ تم حفظ الإعدادات بنجاح", "ok");
}

async function test() {
  const url = $("#apiUrl").value.trim();
  const key = $("#apiKey").value.trim();
  if (!url) return show("الرجاء إدخال رابط الواجهة أولاً (المفتاح اختياري)", "err");
  try {
    const headers = { "Content-Type": "application/json" };
    if (key) { headers["X-API-Key"] = key; headers["Authorization"] = \\\`Bearer \\\${key}\\\`; }
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "ping", source: "najiz-extension", ts: Date.now(), payload: { items: [] } }),
    });
    if (r.ok) show("✓ الاتصال ناجح — المنصة تستقبل البيانات", "ok");
    else show(\\\`✗ فشل الاتصال (\\\${r.status})\\\`, "err");
  } catch (e) { show(\\\`✗ \\\${e.message}\\\`, "err"); }
}

function show(t, cls) {
  const el = $("#msg"); el.textContent = t; el.className = cls;
  setTimeout(() => { el.textContent = ""; }, 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  $("#save").addEventListener("click", save);
  $("#test").addEventListener("click", test);
});
\`.trim());

      // ===== README.md =====
      folder.file('README.md', \`# منصة العدالة — أداة مزامنة ناجز الإصدار 2
      
## التثبيت
1. افتح متصفح Chrome ثم اذهب إلى الرابط: chrome://extensions
2. فعّل خيار Developer mode في أعلى اليمين
3. اضغط على Load unpacked
4. اختر المجلد الخاص بالإضافة najiz-extension الذي قمت بفك الضغط عنه

## الاستخدام
- اذهب إلى موقع ناجز https://www.najiz.sa وسجل الدخول باستخدام النفاذ الوطني
- اضغط على أيقونة الإضافة في شريط المتصفح أو أيقونة "منصة العدالة" في أسفل يسار الشاشة لفتح واجهة السحب
- انقر على القسم الذي تريد سحب بياناته
- احرص على وضع رابط التطبيق الخاص بك في صفحة الإعدادات لكي يتم توجيه البيانات بنجاح

\`.trim());
`;

const lines = content.split('\n');
let startIdx = lines.findIndex(l => l.includes("// ===== manifest.json =====") && l.includes("folder.file('manifest.json'"));
let endIdx = lines.findIndex(l => l.includes("// ===== README.md =====") && l.includes("folder.file('README.md'"));

if (startIdx !== -1 && endIdx !== -1) {
  // find the end of README block
  let readMeEndIdx = endIdx;
  while (!lines[readMeEndIdx].includes("`);")) {
    readMeEndIdx++;
  }
  
  const before = lines.slice(0, startIdx).join('\n');
  const after = lines.slice(readMeEndIdx + 1).join('\n');
  
  fs.writeFileSync(filePath, before + '\n' + newExtensionCode + '\n' + after);
  console.log("Successfully replaced extension files logic");
} else {
  console.log("Could not find start or end index", startIdx, endIdx);
}
