(function () {
  'use strict';

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  // =============================================
  // الخطوة 1: اعتراض Fetch و XHR
  // =============================================
  const interceptedData = {
    cases: [],
    hearings: [],
    poa: [],
    executions: [],
    raw: []
  };

  // اعتراض fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    if (url.includes('najiz') || url.includes('moj.gov') ||
        url.includes('api') || url.includes('lawsuit') ||
        url.includes('appointment') || url.includes('procuration') ||
        url.includes('execution')) {

      try {
        const cloned = response.clone();
        const text = await cloned.text();

        if (text && text.length > 50) {
          try {
            const json = JSON.parse(text);
            processApiResponse(url, json);
          } catch {
            processTextResponse(url, text);
          }
        }
      } catch(e) {}
    }

    return response;
  };

  // اعتراض XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;
  function InterceptedXHR() {
    const xhr = new OriginalXHR();
    let xhrUrl = '';

    const originalOpen = xhr.open.bind(xhr);
    xhr.open = function(method, url, ...rest) {
      xhrUrl = url;
      return originalOpen(method, url, ...rest);
    };

    xhr.addEventListener('load', function() {
      if (!xhrUrl) return;
      try {
        const text = xhr.responseText;
        if (!text || text.length < 50) return;
        try {
          const json = JSON.parse(text);
          processApiResponse(xhrUrl, json);
        } catch {
          processTextResponse(xhrUrl, text);
        }
      } catch(e) {}
    });

    return xhr;
  }
  InterceptedXHR.prototype = OriginalXHR.prototype;
  window.XMLHttpRequest = InterceptedXHR;

  // =============================================
  // الخطوة 2: معالجة بيانات API
  // =============================================
  function processApiResponse(url, json) {
    if (!json) return;

    interceptedData.raw.push({ url, data: json, ts: Date.now() });

    const urlLower = url.toLowerCase();

    // البحث في كل المستويات من JSON
    const allItems = flattenJson(json);

    allItems.forEach(item => {
      if (!item || typeof item !== 'object') return;

      // اكتشاف القضايا
      if (isCase(item, urlLower)) {
        const caseNum = extractCaseNumber(item);
        if (caseNum && !interceptedData.cases.find(c => c.caseNumber === caseNum)) {
          interceptedData.cases.push(mapCase(item, caseNum));
        }
      }

      // اكتشاف الجلسات
      if (isHearing(item, urlLower)) {
        const hearing = mapHearing(item);
        if (hearing.date && !interceptedData.hearings.find(
          h => h.date === hearing.date && h.caseNumber === hearing.caseNumber
        )) {
          interceptedData.hearings.push(hearing);
        }
      }

      // اكتشاف الوكالات
      if (isPOA(item, urlLower)) {
        const poa = mapPOA(item);
        if (poa.poaNumber && !interceptedData.poa.find(
          p => p.poaNumber === poa.poaNumber
        )) {
          interceptedData.poa.push(poa);
        }
      }

      // اكتشاف التنفيذ
      if (isExecution(item, urlLower)) {
        const exec = mapExecution(item);
        if (exec.executionNumber && !interceptedData.executions.find(
          e => e.executionNumber === exec.executionNumber
        )) {
          interceptedData.executions.push(exec);
        }
      }
    });

    notifyDataUpdated();
  }

  function processTextResponse(url, text) {
    // استخراج أرقام القضايا من النص الخام
    const caseNums = [...new Set(
      text.match(/\d{4}\/\d{1,2}\/\d+|\d{4}\/\d{4,}/g) || []
    )];
    caseNums.forEach(num => {
      if (!interceptedData.cases.find(c => c.caseNumber === num)) {
        interceptedData.cases.push({
          caseNumber: num,
          najizCaseNumber: num,
          caseName: 'قضية من ناجز',
          status: 'قيد النظر',
          category: 'civil',
          isNajizSync: true,
          source: 'network_text'
        });
      }
    });
  }

  // =============================================
  // الخطوة 3: تسطيح JSON للبحث
  // =============================================
  function flattenJson(obj, depth = 0) {
    if (depth > 8) return [];
    const items = [];
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        items.push(item);
        items.push(...flattenJson(item, depth + 1));
      });
    } else if (obj && typeof obj === 'object') {
      items.push(obj);
      Object.values(obj).forEach(val => {
        if (val && typeof val === 'object') {
          items.push(...flattenJson(val, depth + 1));
        }
      });
    }
    return items;
  }

  // =============================================
  // الخطوة 4: دوال التعرف على نوع البيانات
  // =============================================
  function isCase(item, url) {
    if (!item || typeof item !== 'object') return false;
    const keys = Object.keys(item).map(k => k.toLowerCase());
    const text = JSON.stringify(item).toLowerCase();
    return (
      url.includes('lawsuit') || url.includes('case') ||
      keys.some(k => ['casenumber','case_number','casenum','رقم','lawsuit','دعوى','قضية'].some(p => k.includes(p))) ||
      text.includes('casenumber') || text.includes('case_number') ||
      text.includes('رقم الدعوى') || text.includes('رقم القضية') ||
      (text.includes('محكمة') && text.match(/\d{4}\/\d+/))
    );
  }

  function isHearing(item, url) {
    if (!item || typeof item !== 'object') return false;
    const text = JSON.stringify(item).toLowerCase();
    return (
      url.includes('appointment') || url.includes('hearing') ||
      url.includes('session') || url.includes('جلسة') ||
      text.includes('hearing') || text.includes('جلسة') ||
      text.includes('appointmentdate') || text.includes('sessiondate') ||
      text.includes('hearingdate') || text.includes('موعد')
    );
  }

  function isPOA(item, url) {
    if (!item || typeof item !== 'object') return false;
    const text = JSON.stringify(item).toLowerCase();
    return (
      url.includes('wekalat') || url.includes('procuration') ||
      url.includes('attorney') ||
      text.includes('wekalat') || text.includes('وكالة') ||
      text.includes('poanumber') || text.includes('procuration') ||
      text.includes('wakala')
    );
  }

  function isExecution(item, url) {
    if (!item || typeof item !== 'object') return false;
    const text = JSON.stringify(item).toLowerCase();
    return (
      url.includes('execution') || url.includes('iexecution') ||
      text.includes('execution') || text.includes('تنفيذ') ||
      text.includes('executionnumber')
    );
  }

  // =============================================
  // الخطوة 5: تحويل البيانات للتنسيق الموحد
  // =============================================
  function extractCaseNumber(item) {
    const fields = [
      'caseNumber','case_number','caseNum','case_num',
      'caseNo','case_no','lawsuitNumber','lawsuit_number',
      'caseId','case_id','requestNumber','request_number',
      'CaseNumber','CaseNo','LawsuitNo','رقم الدعوى',
      'رقم القضية','caseIdentifier','caseReference'
    ];
    for (const f of fields) {
      if (item[f]) return String(item[f]).trim();
    }
    // بحث بالأنماط
    const str = JSON.stringify(item);
    const match = str.match(/"(?:caseNumber|case_number|caseNo|CaseNo|LawsuitNo)":"?([^",}]+)"?/i);
    return match?.[1]?.trim() || null;
  }

  function mapCase(item, caseNum) {
    const str = JSON.stringify(item);
    return {
      caseNumber: caseNum,
      najizCaseNumber: caseNum,
      caseName: item.caseName || item.case_name || item.caseTitle ||
                item.title || item.name || item.lawsuitName ||
                item.CaseName || item.CaseTitle || 'قضية من ناجز',
      status: item.status || item.caseStatus || item.case_status ||
              item.statusName || item.Status || 'قيد النظر',
      court: item.court || item.courtName || item.court_name ||
             item.CourtName || item.tribunal || '',
      category: mapCategory(
        item.category || item.caseType || item.case_type ||
        item.type || item.caseCategory || ''
      ),
      stage: item.stage || item.caseStage || item.phase || 'litigation',
      opponentName: item.opponent || item.opponentName ||
                   item.opponent_name || item.defendantName || '',
      nextHearing: item.nextSession || item.next_session ||
                  item.nextHearing || item.next_hearing ||
                  item.appointmentDate || item.nextAppointment || '',
      judgeNumber: item.judgeNumber || item.circuitNumber ||
                  item.circuit_number || '',
      isNajizSync: true,
      source: 'network_interception',
      rawData: item
    };
  }

  function mapHearing(item) {
    return {
      caseNumber: item.caseNumber || item.case_number ||
                 item.caseNo || item.CaseNo || '',
      date: item.hearingDate || item.hearing_date ||
            item.appointmentDate || item.appointment_date ||
            item.sessionDate || item.date || item.Date || '',
      time: item.hearingTime || item.time || item.sessionTime || '09:00',
      court: item.courtName || item.court_name || item.court || '',
      hall: item.hall || item.circuitNumber || item.deptNumber || '',
      status: item.status || item.hearingStatus || 'قادمة',
      type: item.type || item.hearingType || item.sessionType || '',
      isNajizSync: true,
      source: 'network_interception'
    };
  }

  function mapPOA(item) {
    return {
      poaNumber: item.poaNumber || item.poa_number ||
                item.wekalatNumber || item.wakalaNumber ||
                item.number || item.id || '',
      type: item.type || item.poaType || 'general',
      status: item.status || 'active',
      issueDate: item.issueDate || item.issue_date ||
                item.startDate || item.createdAt || '',
      expiryDate: item.expiryDate || item.expiry_date ||
                 item.endDate || item.expiryDateHijri || '',
      principalName: item.grantor || item.principal ||
                    item.principalName || item.موكل || '',
      isNajizSync: true,
      source: 'network_interception'
    };
  }

  function mapExecution(item) {
    return {
      executionNumber: item.executionNumber || item.execution_number ||
                      item.requestNumber || item.id || '',
      status: item.status || 'pending',
      amount: item.amount || item.claimAmount || 0,
      court: item.courtName || item.court || '',
      isNajizSync: true,
      source: 'network_interception'
    };
  }

  function mapCategory(cat) {
    if (!cat) return 'civil';
    const c = String(cat).toLowerCase();
    if (c.includes('تجاري') || c.includes('commercial')) return 'commercial';
    if (c.includes('عمالي') || c.includes('labor')) return 'labor';
    if (c.includes('جزائي') || c.includes('criminal')) return 'criminal';
    if (c.includes('أحوال') || c.includes('personal')) return 'personal_status';
    if (c.includes('إداري') || c.includes('admin')) return 'administrative';
    return 'civil';
  }

  // =============================================
  // الخطوة 6: إشعار الـ Extension بالبيانات
  // =============================================
  function notifyDataUpdated() {
    window.dispatchEvent(new CustomEvent('adala_data_update', {
      detail: {
        cases: interceptedData.cases.length,
        hearings: interceptedData.hearings.length,
        poa: interceptedData.poa.length,
        executions: interceptedData.executions.length
      }
    }));
  }

  // =============================================
  // الخطوة 7: استخراج DOM كـ Fallback
  // =============================================
  function extractFromDOM() {
    const domData = {
      cases: [],
      hearings: [],
      poa: [],
      executions: []
    };

    const seen = new Set();
    const text = document.body?.innerText || '';

    // أرقام القضايا من الصفحة
    const patterns = [
      /\d{4}\/\d{1,2}\/\d+/g,
      /\d{4}\/\d{4,}/g,
      /(?<!\d)\d{10}(?!\d)/g
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(num => {
        if (seen.has(num)) return;
        seen.add(num);
        domData.cases.push({
          caseNumber: num,
          najizCaseNumber: num,
          caseName: 'قضية من ناجز',
          status: 'قيد النظر',
          category: 'civil',
          isNajizSync: true,
          source: 'dom_fallback'
        });
      });
    });

    // الجداول
    document.querySelectorAll('table tbody tr').forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'))
        .map(td => td.innerText?.trim() || '');
      if (cells.length < 2) return;
      const rowText = cells.join(' ');
      const numMatch = rowText.match(/\d{4}\/\d+|\d{10,}/)?.[0];
      if (!numMatch || seen.has(numMatch)) return;
      seen.add(numMatch);
      const dateMatch = rowText.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/);
      domData.cases.push({
        caseNumber: numMatch,
        najizCaseNumber: numMatch,
        caseName: cells.find(c => c.length > 5 && !/^\d+/.test(c)) || 'قضية من ناجز',
        status: cells.find(c => ['قيد','منتهي','نشط','مؤجل'].some(k => c.includes(k))) || 'قيد النظر',
        nextHearing: dateMatch?.[0] || '',
        isNajizSync: true,
        source: 'dom_table'
      });
    });

    // البطاقات الديناميكية
    document.querySelectorAll('*').forEach(el => {
      const t = el.childNodes.length === 0 ||
        Array.from(el.childNodes).every(n => n.nodeType === 3)
          ? el.innerText?.trim() || ''
          : '';
      if (!t) return;
      const m = t.match(/^\d{4}\/\d+$|^\d{10}$/);
      if (m && !seen.has(m[0])) {
        seen.add(m[0]);
        const parent = el.closest('[class]');
        const context = parent?.innerText?.substring(0, 300) || t;
        domData.cases.push({
          caseNumber: m[0],
          najizCaseNumber: m[0],
          caseName: 'قضية من ناجز',
          status: 'قيد النظر',
          isNajizSync: true,
          source: 'dom_element'
        });
      }
    });

    return domData;
  }

  // =============================================
  // الخطوة 8: الدالة الرئيسية للسحب
  // =============================================
  async function extractAll() {
    // انتظر 3 ثوانٍ للـ network requests
    await new Promise(r => setTimeout(r, 3000));

    // دمج بيانات الشبكة مع DOM
    const domData = extractFromDOM();

    const merged = {
      cases: mergeArrays(interceptedData.cases, domData.cases, 'caseNumber'),
      hearings: mergeArrays(interceptedData.hearings, domData.hearings, 'date'),
      powers_of_attorney: interceptedData.poa,
      executions: interceptedData.executions,
      pageUrl: window.location.href,
      pageTitle: document.title,
      scrapedAt: new Date().toISOString(),
      method: interceptedData.cases.length > 0 ? 'network_interception' : 'dom_fallback'
    };

    const totalFound =
      merged.cases.length +
      merged.hearings.length +
      merged.powers_of_attorney.length +
      merged.executions.length;

    merged.summary = {
      totalCases: merged.cases.length,
      totalHearings: merged.hearings.length,
      totalPOAs: merged.powers_of_attorney.length,
      totalExecutions: merged.executions.length,
      totalFound,
      hasData: totalFound > 0,
      method: merged.method,
      networkIntercepted: interceptedData.cases.length,
      domFallback: domData.cases.length
    };

    return merged;
  }

  function mergeArrays(arr1, arr2, key) {
    const merged = [...arr1];
    const existing = new Set(arr1.map(i => i[key]));
    arr2.forEach(item => {
      if (item[key] && !existing.has(item[key])) {
        merged.push(item);
        existing.add(item[key]);
      }
    });
    return merged;
  }

  // =============================================
  // الخطوة 9: مزامنة مع الخادم
  // =============================================
  async function syncToServer(data) {
    try {
      const response = await fetch(`${SERVER}/api/najiz-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedData: {
            ...data,
            cases: data.cases.map(c => ({ ...c, rawData: undefined }))
          },
          pageType: detectPageType(),
          source: 'najiz_extension_v6_network_interception',
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch(err) {
      console.error('[العدالة] Sync error:', err.message);
      return { success: false, error: err.message };
    }
  }

  function detectPageType() {
    const url = window.location.href.toLowerCase();
    if (url.includes('/lawsuit') || url.includes('/cases')) return 'cases';
    if (url.includes('/appointment') || url.includes('/hearing')) return 'hearings';
    if (url.includes('/wekalat') || url.includes('/procuration')) return 'poa';
    if (url.includes('/execution')) return 'executions';
    return 'unknown';
  }

  // =============================================
  // الخطوة 10: استقبال أوامر الـ Extension
  // =============================================
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (['extractData','scrape','getData','sync'].includes(req.action)) {
      (async () => {
        try {
          const data = await extractAll();

          if (data.summary.hasData) {
            const syncResult = await syncToServer(data);
            sendResponse({
              success: true,
              data,
              syncResult,
              message: `تم سحب ${data.summary.totalFound} سجل عبر ${data.summary.method}`
            });
          } else {
            // محاولة إضافية — انتظر 5 ثوانٍ
            await new Promise(r => setTimeout(r, 5000));
            const retryData = await extractAll();
            if (retryData.summary.hasData) {
              const syncResult = await syncToServer(retryData);
              sendResponse({ success: true, data: retryData, syncResult });
            } else {
              sendResponse({
                success: false,
                data: retryData,
                message: 'لم تُوجد بيانات — تأكد أن الصفحة محملة بالكامل'
              });
            }
          }
        } catch(err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }

    if (req.action === 'getInterceptedData') {
      sendResponse({
        success: true,
        data: interceptedData,
        total: interceptedData.cases.length +
               interceptedData.hearings.length +
               interceptedData.poa.length +
               interceptedData.executions.length
      });
      return true;
    }

    if (req.action === 'ping') {
      sendResponse({
        success: true,
        url: window.location.href,
        pageType: detectPageType(),
        intercepted: {
          cases: interceptedData.cases.length,
          hearings: interceptedData.hearings.length,
          poa: interceptedData.poa.length,
          executions: interceptedData.executions.length
        }
      });
      return true;
    }
  });

  // =============================================
  // الخطوة 11: واجهة المربع العائم
  // =============================================
  function createWidget() {
    if (document.getElementById('adala-widget-v6')) return;

    const style = document.createElement('style');
    style.textContent = `
      #adala-widget-v6 {
        position: fixed; bottom: 20px; left: 20px;
        z-index: 2147483647; font-family: Arial, sans-serif;
        direction: rtl;
      }
      #adala-fab {
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border: 3px solid rgba(255,255,255,0.2);
        cursor: pointer; display: flex; align-items: center;
        justify-content: center; font-size: 24px;
        box-shadow: 0 4px 24px rgba(245,158,11,0.5);
        transition: all 0.3s; position: relative;
      }
      #adala-fab:hover { transform: scale(1.1); }
      #adala-counter {
        position: absolute; top: -4px; right: -4px;
        background: #22c55e; color: white; font-size: 10px;
        font-weight: bold; border-radius: 50%;
        width: 18px; height: 18px; display: none;
        align-items: center; justify-content: center;
        border: 2px solid white;
      }
      #adala-panel {
        display: none; position: absolute; bottom: 68px;
        left: 0; width: 300px; background: #050e21;
        border: 1px solid #1e3a5f; border-radius: 16px;
        overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.7);
      }
      #adala-panel.open { display: block; }
      .adala-header {
        background: linear-gradient(135deg, #0a1628, #1e3a5f);
        padding: 12px 16px; border-bottom: 1px solid #1e3a5f;
      }
      .adala-title { color: #f59e0b; font-weight: bold; font-size: 14px; }
      .adala-sub { color: #64748b; font-size: 10px; margin-top: 2px; }
      .adala-status {
        padding: 8px 16px; background: #0a1628;
        border-bottom: 1px solid #1e3a5f;
        font-size: 11px; color: #94a3b8; text-align: center;
        min-height: 34px; display: flex; align-items: center;
        justify-content: center;
      }
      .adala-live {
        padding: 8px 16px; background: #0f172a;
        border-bottom: 1px solid #1e3a5f; font-size: 11px;
      }
      .adala-live-title { color: #64748b; margin-bottom: 4px; font-size: 10px; }
      .adala-live-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
      .adala-live-item {
        background: #1e3a5f; border-radius: 6px; padding: 4px 8px;
        color: white; font-size: 11px; text-align: center;
      }
      .adala-live-num { color: #f59e0b; font-weight: bold; font-size: 16px; }
      .adala-btns { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
      .adala-btn {
        width: 100%; padding: 10px 14px; border: none;
        border-radius: 10px; cursor: pointer; font-size: 12px;
        font-weight: bold; text-align: right; transition: all 0.2s;
        display: flex; align-items: center; gap: 8px;
      }
      .adala-btn-primary {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #000;
      }
      .adala-btn-primary:hover { opacity: 0.9; transform: translateX(-2px); }
      .adala-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .adala-links { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 4px; }
      .adala-link {
        display: flex; align-items: center; gap-6px; padding: 6px 10px;
        background: #0a1628; border: 1px solid #1e3a5f;
        border-radius: 8px; color: #94a3b8; font-size: 11px;
        text-decoration: none; transition: all 0.2s;
      }
      .adala-link:hover { border-color: #f59e0b; color: #f59e0b; }
      .adala-link.active { border-color: #f59e0b; color: #f59e0b; background: #1e3a5f; }
      .adala-progress {
        display: none; padding: 6px 16px; font-size: 11px;
        color: #f59e0b; text-align: center; border-top: 1px solid #1e3a5f;
        animation: pulse 1.5s infinite;
      }
      .adala-progress.show { display: block; }
      @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      .adala-footer {
        padding: 6px 16px; border-top: 1px solid #0f172a;
        background: #0a1628; font-size: 9px; color: #1e3a5f;
        text-align: center;
      }
    `;
    document.head.appendChild(style);

    const widget = document.createElement('div');
    widget.id = 'adala-widget-v6';

    const PAGES = [
      { label: '📁 قضاياي', path: '/applications/lawsuit', type: 'cases' },
      { label: '📅 جلساتي', path: '/applications/appointment-requests/', type: 'hearings' },
      { label: '📜 وكالاتي', path: '/applications/wekalat/procurations-query', type: 'poa' },
      { label: '⚡ تنفيذي', path: '/applications/iexecution', type: 'executions' }
    ];

    const currentPath = window.location.pathname;

    widget.innerHTML = `
      <div id="adala-panel">
        <div class="adala-header">
          <div class="adala-title">⚖️ منصة العدالة</div>
          <div class="adala-sub">مزامنة ناجز v6.0 — Network Interception</div>
        </div>

        <div class="adala-status" id="adala-status">
          جارٍ مراقبة طلبات الشبكة...
        </div>

        <div class="adala-live">
          <div class="adala-live-title">📡 بيانات معترضة من الشبكة:</div>
          <div class="adala-live-grid">
            <div class="adala-live-item">
              <div class="adala-live-num" id="live-cases">0</div>
              <div>قضية</div>
            </div>
            <div class="adala-live-item">
              <div class="adala-live-num" id="live-hearings">0</div>
              <div>جلسة</div>
            </div>
            <div class="adala-live-item">
              <div class="adala-live-num" id="live-poa">0</div>
              <div>وكالة</div>
            </div>
            <div class="adala-live-item">
              <div class="adala-live-num" id="live-exec">0</div>
              <div>تنفيذ</div>
            </div>
          </div>
        </div>

        <div class="adala-btns">
          <button class="adala-btn adala-btn-primary" id="adala-sync-btn">
            📥 مزامنة البيانات مع النظام
          </button>
        </div>

        <div class="adala-progress" id="adala-progress">
          🔄 جارٍ المعالجة...
        </div>

        <div class="adala-links">
          ${PAGES.map(p => `
            <a href="https://najiz.sa${p.path}" target="_blank"
              class="adala-link ${currentPath.includes(p.path.slice(0,-1)) ? 'active' : ''}">
              ${p.label}
            </a>
          `).join('')}
        </div>

        <div class="adala-footer">
          منصة العدالة لإدارة مكاتب المحاماة
        </div>
      </div>

      <div id="adala-fab" title="منصة العدالة — مزامنة ناجز">
        ⚖️
        <div id="adala-counter"></div>
      </div>
    `;

    document.body.appendChild(widget);

    const fab = document.getElementById('adala-fab');
    const panel = document.getElementById('adala-panel');
    const status = document.getElementById('adala-status');
    const progress = document.getElementById('adala-progress');
    const syncBtn = document.getElementById('adala-sync-btn');
    const counter = document.getElementById('adala-counter');

    let isOpen = false;

    // تحديث العداد
    window.addEventListener('adala_data_update', (e) => {
      const d = e.detail;
      const total = d.cases + d.hearings + d.poa + d.executions;
      document.getElementById('live-cases').textContent = d.cases;
      document.getElementById('live-hearings').textContent = d.hearings;
      document.getElementById('live-poa').textContent = d.poa;
      document.getElementById('live-exec').textContent = d.executions;
      if (total > 0 && counter) {
        counter.textContent = total;
        counter.style.display = 'flex';
        status.textContent = `✅ تم اعتراض ${total} سجل — جاهز للمزامنة`;
        status.style.color = '#22c55e';
      }
    });

    // فتح/إغلاق
    fab.onclick = () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      fab.textContent = isOpen ? '✕' : '⚖️';
      if (counter) counter.style.display = counter.textContent ? 'flex' : 'none';
    };

    document.addEventListener('click', (e) => {
      if (isOpen && !widget.contains(e.target)) {
        isOpen = false;
        panel.classList.remove('open');
        fab.textContent = '⚖️';
      }
    });

    // زر المزامنة
    syncBtn.onclick = async () => {
      syncBtn.disabled = true;
      progress.className = 'adala-progress show';
      progress.textContent = '⏳ جارٍ السحب والمزامنة...';

      try {
        const data = await extractAll();

        if (data.summary.hasData) {
          progress.textContent = '📡 جارٍ الإرسال للخادم...';
          const syncResult = await syncToServer(data);

          const synced = syncResult?.totalSynced || 0;
          const total = data.summary.totalFound;

          status.textContent = synced > 0
            ? `✅ تمت المزامنة: ${synced} سجل جديد في النظام`
            : `⚠️ ${total} سجل موجود مسبقاً`;
          status.style.color = synced > 0 ? '#22c55e' : '#f59e0b';

          fab.textContent = '✅';
          fab.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
          setTimeout(() => {
            fab.textContent = '⚖️';
            fab.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
          }, 5000);
        } else {
          status.textContent = '⚠️ لم تُوجد بيانات — افتح صفحة قضاياي أولاً';
          status.style.color = '#f59e0b';
        }
      } catch(err) {
        status.textContent = '❌ خطأ: ' + err.message;
        status.style.color = '#ef4444';
      } finally {
        syncBtn.disabled = false;
        progress.className = 'adala-progress';
      }
    };
  }

  // التهيئة
  const init = () => {
    if (!window.location.href.includes('najiz.sa')) return;
    setTimeout(createWidget, 1500);
  };

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);

  // مراقبة SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      document.getElementById('adala-widget-v6')?.remove();
      setTimeout(createWidget, 2000);
    }
  }).observe(document.body, { childList: true, subtree: true });

  console.log('[العدالة v6.0] Network Interception Active ✅');

})();
