(function () {
  'use strict';

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  // تحديد نوع الصفحة الحالية
  function getPageType() {
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const full = url + path + hash;
  
    // قضايا — كل الروابط الممكنة
    if (
      full.includes('/lawsuit') ||
      full.includes('/cases') ||
      full.includes('/qadaya') ||
      full.includes('/القضايا') ||
      full.includes('lawsuit') ||
      document.title.includes('قضاي') ||
      document.title.includes('دعاو') ||
      document.querySelector('[class*="lawsuit"]') ||
      document.querySelector('[class*="LawSuit"]')
    ) return 'cases';
  
    // مواعيد الجلسات
    if (
      full.includes('/appointment') ||
      full.includes('/jalsat') ||
      full.includes('/جلسات') ||
      full.includes('appointment-request') ||
      full.includes('hearing') ||
      document.title.includes('جلس') ||
      document.title.includes('موعد') ||
      document.querySelector('[class*="appointment"]') ||
      document.querySelector('[class*="Appointment"]')
    ) return 'hearings';
  
    // الوكالات
    if (
      full.includes('/wekalat') ||
      full.includes('/wakala') ||
      full.includes('/وكالات') ||
      full.includes('procuration') ||
      full.includes('attorney') ||
      document.title.includes('وكال') ||
      document.querySelector('[class*="wekalat"]') ||
      document.querySelector('[class*="Wekalat"]') ||
      document.querySelector('[class*="procuration"]')
    ) return 'poa';
  
    // التنفيذ
    if (
      full.includes('/iexecution') ||
      full.includes('/execution') ||
      full.includes('/tanfiz') ||
      full.includes('/تنفيذ') ||
      document.title.includes('تنفيذ') ||
      document.querySelector('[class*="execution"]') ||
      document.querySelector('[class*="Execution"]')
    ) return 'executions';
  
    // محاولة الكشف من محتوى الصفحة
    const bodyText = document.body?.innerText || '';
    if (bodyText.includes('رقم الدعوى') ||
        bodyText.includes('الدعاوى القضائية')) return 'cases';
    if (bodyText.includes('تاريخ الجلسة') ||
        bodyText.includes('مواعيد الجلسات')) return 'hearings';
    if (bodyText.includes('رقم الوكالة') ||
        bodyText.includes('الوكالات القضائية')) return 'poa';
    if (bodyText.includes('طلب التنفيذ') ||
        bodyText.includes('طلبات التنفيذ')) return 'executions';
  
    return 'unknown';
  }

  // انتظار تحميل البيانات الديناميكية
  function waitForPageData(timeout = 15000) {
    return new Promise((resolve) => {
      let elapsed = 0;
      const check = setInterval(() => {
        elapsed += 500;
        const text = document.body?.innerText || '';
        const tables = document.querySelectorAll('table tr').length;
        const cards = document.querySelectorAll(
          '[class*="card"],[class*="Card"],[class*="item"],[class*="Item"]'
        ).length;
        const hasData = tables > 2 || cards > 2 ||
          /\d{4}\/\d+/.test(text) || /\d{9,}/.test(text);
        if (hasData || elapsed >= timeout) {
          clearInterval(check);
          resolve(hasData);
        }
      }, 500);
    });
  }

  // ===== استخراج بيانات القضايا =====
  function extractCases() {
    const cases = [];
    const seen = new Set();
  
    // === استخراج من كل نص في الصفحة ===
    const allText = document.body?.innerText || '';
  
    // استخراج جميع أرقام القضايا الممكنة
    const patterns = [
      /\d{4}\/\d{1,2}\/\d{4,}/g,   // 1446/ق/12345
      /\d{4}\/\d{5,}/g,              // 2024/12345
      /(?<!\d)\d{10}(?!\d)/g,        // 10 أرقام
      /(?<!\d)\d{9}(?!\d)/g,         // 9 أرقام
    ];
  
    patterns.forEach(pattern => {
      const matches = allText.match(pattern) || [];
      matches.forEach(num => {
        if (!seen.has(num)) {
          seen.add(num);
          // البحث عن السياق حول الرقم
          const idx = allText.indexOf(num);
          const context = allText.substring(
            Math.max(0, idx - 200),
            Math.min(allText.length, idx + 400)
          );
          const lines = context.split('\n')
            .map(l => l.trim()).filter(Boolean);
  
          cases.push({
            caseNumber: num,
            najizCaseNumber: num,
            caseName: lines.find(l =>
              l.length > 10 &&
              !/^\d+[\/\-]?\d*$/.test(l) &&
              !l.includes('ريال') &&
              !l.includes('هجري')
            ) || 'قضية من ناجز',
            status: lines.find(l =>
              ['قيد','منتهي','نشط','مقيد','محكوم',
               'مؤجل','مشطوب','موقوف','صدر','جديد',
               'مباشرة','بانتظار'].some(k => l.includes(k))
            ) || 'قيد النظر',
            court: lines.find(l => l.includes('محكمة')) || '',
            category: detectCategory(context),
            nextHearing: extractDate(context) || '',
            isNajizSync: true,
            source: 'najiz_content_script'
          });
        }
      });
    });
  
    // === من الجداول ===
    document.querySelectorAll('table, [class*="Table"]')
      .forEach(table => {
      const rows = table.querySelectorAll(
        'tr, [class*="Row"], [class*="row"]'
      );
      rows.forEach((row, i) => {
        if (i === 0) return;
        const cells = Array.from(
          row.querySelectorAll('td, [class*="Cell"]')
        ).map(c => c.innerText?.trim() || '');
        if (cells.length < 2) return;
  
        const rowText = cells.join(' ');
        const caseNum = rowText.match(
          /\d{4}\/\d+|\d{10,}|\d{9}/
        )?.[0];
  
        if (caseNum && !seen.has(caseNum)) {
          seen.add(caseNum);
          const dateMatch = extractDate(rowText);
          cases.push({
            caseNumber: caseNum,
            najizCaseNumber: caseNum,
            caseName: cells.find(c =>
              c.length > 5 &&
              !/^\d+[\/\-]?\d*$/.test(c) &&
              !c.includes('محكمة')
            ) || 'قضية من ناجز',
            status: cells.find(c =>
              ['قيد','منتهي','نشط','مقيد','محكوم',
               'مؤجل','مشطوب','موقوف'].some(k => c.includes(k))
            ) || 'قيد النظر',
            court: cells.find(c => c.includes('محكمة')) || '',
            category: detectCategory(rowText),
            nextHearing: dateMatch || '',
            isNajizSync: true,
            source: 'najiz_table'
          });
        }
      });
    });
  
    // === من البطاقات والعناصر الديناميكية ===
    const allElements = document.querySelectorAll(
      '[class*="Card"],[class*="card"],[class*="Item"],' +
      '[class*="Row"],[class*="List"],[class*="Case"],' +
      '[data-testid],[aria-label],.MuiCard-root,' +
      '.MuiPaper-root,.MuiListItem-root'
    );
  
    allElements.forEach(el => {
      const text = el.innerText?.trim() || '';
      if (text.length < 5 || text.length > 2000) return;
      const caseNum = text.match(
        /\d{4}\/\d+|\d{10,}|\d{9}/
      )?.[0];
      if (!caseNum || seen.has(caseNum)) return;
      seen.add(caseNum);
  
      const lines = text.split('\n')
        .map(l => l.trim()).filter(Boolean);
      cases.push({
        caseNumber: caseNum,
        najizCaseNumber: caseNum,
        caseName: lines.find(l =>
          l.length > 5 && !/^\d+[\/\-]?\d*$/.test(l)
        ) || 'قضية من ناجز',
        status: lines.find(l =>
          ['قيد','منتهي','نشط','محكوم',
           'مؤجل','مشطوب'].some(k => l.includes(k))
        ) || 'قيد النظر',
        nextHearing: extractDate(text) || '',
        isNajizSync: true,
        source: 'najiz_dynamic'
      });
    });
  
    return cases;
  }
  
  // دوال مساعدة
  function extractDate(text) {
    const m = text.match(
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|' +
      '\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/
    );
    return m?.[0] || '';
  }
  
  function detectCategory(text) {
    if (text.includes('تجاري')) return 'commercial';
    if (text.includes('عمالي') || text.includes('عمل')) return 'labor';
    if (text.includes('جزائي') || text.includes('جنائي')) return 'criminal';
    if (text.includes('أحوال') || text.includes('أسرة')) return 'personal_status';
    if (text.includes('إداري') || text.includes('مظالم')) return 'administrative';
    if (text.includes('تنفيذ')) return 'execution';
    return 'civil';
  }

  // ===== استخراج بيانات الوكالات =====
  function extractPOA() {
    const poas = [];
    const seen = new Set();

    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');
        const poaNum = rowText.match(/\d{6,}/)?.[0];
        if (!poaNum || seen.has(poaNum)) return;
        seen.add(poaNum);

        const dateMatch = rowText.match(
          /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g
        );

        poas.push({
          poaNumber: poaNum,
          type: cells.find(c =>
            ['عامة','خاصة','قضائية','خاص','عام'].some(k => c.includes(k))
          ) || 'عامة',
          status: cells.find(c =>
            ['سارية','منتهية','موقوفة','فعال','غير فعال']
              .some(k => c.includes(k))
          ) || 'سارية',
          issueDate: dateMatch?.[0] || '',
          expiryDate: dateMatch?.[1] || dateMatch?.[0] || '',
          principalName: cells.find(c =>
            c.length > 3 && !/^\d+$/.test(c) &&
            !['سارية','منتهية','عامة','خاصة'].includes(c)
          ) || '',
          isNajizSync: true,
          source: 'najiz_extension',
          rawCells: cells
        });
      });
    });

    // من البطاقات
    document.querySelectorAll(
      '[class*="Card"],[class*="card"],[class*="Item"],[class*="item"]'
    ).forEach(card => {
      const text = card.innerText?.trim() || '';
      if (!text.includes('وكالة') && !text.includes('وكيل')) return;
      const poaNum = text.match(/\d{6,}/)?.[0];
      if (!poaNum || seen.has(poaNum)) return;
      seen.add(poaNum);

      const dateMatch = text.match(
        /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g
      );

      poas.push({
        poaNumber: poaNum,
        type: 'عامة',
        status: text.includes('منتهية') ? 'منتهية' : 'سارية',
        expiryDate: dateMatch?.[0] || '',
        isNajizSync: true,
        source: 'najiz_extension'
      });
    });

    return poas;
  }

  // ===== استخراج طلبات التنفيذ =====
  function extractExecutions() {
    const executions = [];
    const seen = new Set();

    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');
        const execNum = rowText.match(/\d{4}\/\d+|\d{9,}/)?.[0];
        if (!execNum || seen.has(execNum)) return;
        seen.add(execNum);

        const dateMatch = rowText.match(
          /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/
        );

        executions.push({
          executionNumber: execNum,
          status: cells.find(c =>
            ['منتهي','قيد','جديد','مكتمل','معلق','نشط']
              .some(k => c.includes(k))
          ) || 'قيد التنفيذ',
          amount: cells.find(c => /[\d,]+(\.\d+)?\s*(ريال|ر\.س|SAR)/.test(c)) || '',
          court: cells.find(c => c.includes('محكمة')) || '',
          requesterName: cells.find(c =>
            c.length > 3 && !/^\d+$/.test(c) &&
            !c.includes('محكمة') && !c.includes('ريال')
          ) || '',
          issueDate: dateMatch?.[0] || '',
          isNajizSync: true,
          source: 'najiz_extension',
          rawCells: cells
        });
      });
    });

    // من البطاقات
    document.querySelectorAll(
      '[class*="Card"],[class*="card"],[class*="Item"]'
    ).forEach(card => {
      const text = card.innerText?.trim() || '';
      if (!text.includes('تنفيذ')) return;
      const execNum = text.match(/\d{4}\/\d+|\d{9,}/)?.[0];
      if (!execNum || seen.has(execNum)) return;
      seen.add(execNum);

      executions.push({
        executionNumber: execNum,
        status: text.includes('منتهي') ? 'منتهي' : 'قيد التنفيذ',
        isNajizSync: true,
        source: 'najiz_extension'
      });
    });

    return executions;
  }

  // ===== استخراج مواعيد الجلسات =====
  function extractHearings() {
    const hearings = [];
    const seen = new Set();

    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');

        const dateMatch = rowText.match(
          /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/
        );
        const timeMatch = rowText.match(/\d{1,2}:\d{2}/);
        const caseNum = rowText.match(/\d{4}\/\d+|\d{9,}/)?.[0];

        const key = `${caseNum}-${dateMatch?.[0]}`;
        if (!dateMatch || seen.has(key)) return;
        seen.add(key);

        hearings.push({
          caseNumber: caseNum || '',
          date: dateMatch[0],
          time: timeMatch?.[0] || '09:00',
          court: cells.find(c => c.includes('محكمة')) || '',
          hall: cells.find(c =>
            c.includes('قاعة') || c.includes('دائرة')
          ) || '',
          status: cells.find(c =>
            ['قادمة','منتهية','مؤجلة','ملغاة','جديد']
              .some(k => c.includes(k))
          ) || 'قادمة',
          type: cells.find(c =>
            ['ترافع','نطق','تدقيق','إيداع'].some(k => c.includes(k))
          ) || '',
          isNajizSync: true,
          source: 'najiz_extension',
          rawCells: cells
        });
      });
    });

    // من البطاقات
    document.querySelectorAll(
      '[class*="Appointment"],[class*="appointment"],' +
      '[class*="Hearing"],[class*="hearing"],' +
      '[class*="Session"],[class*="session"],' +
      '[class*="Card"],[class*="card"]'
    ).forEach(card => {
      const text = card.innerText?.trim() || '';
      if (text.length < 10) return;
      const dateMatch = text.match(
        /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/
      );
      const timeMatch = text.match(/\d{1,2}:\d{2}/);
      const caseNum = text.match(/\d{4}\/\d+|\d{9,}/)?.[0];

      if (!dateMatch) return;
      const key = `${caseNum}-${dateMatch[0]}`;
      if (seen.has(key)) return;
      seen.add(key);

      hearings.push({
        caseNumber: caseNum || '',
        date: dateMatch[0],
        time: timeMatch?.[0] || '09:00',
        court: text.match(/محكمة[^\n،,]*/)?.[0] || '',
        status: text.includes('مؤجل') ? 'مؤجلة' :
                text.includes('منتهي') ? 'منتهية' : 'قادمة',
        isNajizSync: true,
        source: 'najiz_extension'
      });
    });

    return hearings;
  }

  // ===== الدالة الرئيسية =====
  async function extractByPageType() {
    await waitForPageData(12000);
    await new Promise(r => setTimeout(r, 2000));

    const pageType = getPageType();
    const url = window.location.href;
    const result = {
      pageType,
      pageUrl: url,
      cases: [],
      hearings: [],
      powers_of_attorney: [],
      executions: [],
      scrapedAt: new Date().toISOString()
    };

    switch (pageType) {
      case 'cases':
        result.cases = extractCases();
        break;
      case 'poa':
        result.powers_of_attorney = extractPOA();
        break;
      case 'executions':
        result.executions = extractExecutions();
        break;
      case 'hearings':
        result.hearings = extractHearings();
        break;
      default:
        // سحب شامل إذا لم تُعرف الصفحة
        result.cases = extractCases();
        result.hearings = extractHearings();
        result.powers_of_attorney = extractPOA();
        result.executions = extractExecutions();
    }

    result.summary = {
      pageType,
      totalCases: result.cases.length,
      totalHearings: result.hearings.length,
      totalPOAs: result.powers_of_attorney.length,
      totalExecutions: result.executions.length,
      hasData: (
        result.cases.length +
        result.hearings.length +
        result.powers_of_attorney.length +
        result.executions.length
      ) > 0
    };

    return result;
  }

  // ===== الاستماع للأوامر =====
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (['extractData','scrape','getData','sync'].includes(request.action)) {
      (async () => {
        try {
          const data = await extractByPageType();

          if (data.summary.hasData) {
            // إرسال للخادم لمزامنة الأقسام الصحيحة
            try {
              await fetch(`${SERVER}/api/najiz-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  scrapedData: data,
                  pageType: data.pageType,
                  source: 'chrome_extension',
                  timestamp: new Date().toISOString()
                })
              });
            } catch(syncErr) {
              console.warn('[العدالة] Sync failed:', syncErr.message);
            }

            sendResponse({ success: true, data });
          } else {
            sendResponse({
              success: false,
              data,
              message: getPageGuide(data.pageType)
            });
          }
        } catch(err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }

    if (request.action === 'ping') {
      const pt = getPageType();
      sendResponse({
        success: true,
        url: window.location.href,
        pageType: pt,
        isNajiz: window.location.href.includes('najiz.sa'),
        isTargetPage: pt !== 'unknown'
      });
      return true;
    }

    if (request.action === 'getPageType') {
      sendResponse({ pageType: getPageType() });
      return true;
    }
  });

  function getPageGuide(pageType) {
    const guides = {
      cases: 'انتظر تحميل القضايا ثم اضغط سحب مرة أخرى',
      poa: 'انتظر تحميل الوكالات ثم اضغط سحب مرة أخرى',
      executions: 'انتظر تحميل طلبات التنفيذ ثم اضغط سحب',
      hearings: 'انتظر تحميل المواعيد ثم اضغط سحب مرة أخرى',
      unknown: 'اذهب لإحدى الصفحات المحددة في ناجز ثم اضغط سحب'
    };
    return guides[pageType] || guides.unknown;
  }

  console.log('[العدالة] ✅ جاهز | نوع الصفحة:', getPageType());

  try {
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      url: window.location.href,
      pageType: getPageType(),
      isNajiz: window.location.href.includes('najiz.sa')
    });
  } catch(e) {}

})();

// =============================================
// مربع المزامنة العائم
// =============================================
function createFloatingWidget() {
  // تجنب إنشاء أكثر من مربع
  if (document.getElementById('adala-widget')) return;

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  // ===== أنماط CSS =====
  const style = document.createElement('style');
  style.textContent = `
    #adala-widget {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 999999;
      font-family: 'Arial', sans-serif;
      direction: rtl;
    }

    #adala-toggle-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(245,158,11,0.5);
      transition: all 0.3s ease;
      font-size: 24px;
      color: #000;
    }

    #adala-toggle-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(245,158,11,0.7);
    }

    #adala-toggle-btn.active {
      background: linear-gradient(135deg, #1e3a5f, #0a1628);
      color: #f59e0b;
    }

    #adala-panel {
      display: none;
      position: absolute;
      bottom: 70px;
      left: 0;
      width: 280px;
      background: #050e21;
      border: 1px solid #1e3a5f;
      border-radius: 16px;
      padding: 0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    #adala-panel.open { display: block; }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .adala-header {
      background: linear-gradient(135deg, #0a1628, #1e3a5f);
      padding: 14px 16px;
      border-bottom: 1px solid #1e3a5f;
    }

    .adala-header-title {
      color: #f59e0b;
      font-weight: bold;
      font-size: 14px;
      margin: 0 0 2px;
    }

    .adala-header-sub {
      color: #475569;
      font-size: 10px;
      margin: 0;
    }

    .adala-status-bar {
      padding: 8px 16px;
      background: #0a1628;
      border-bottom: 1px solid #1e3a5f;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      min-height: 32px;
    }

    .adala-buttons {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .adala-btn {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #1e3a5f;
      border-radius: 10px;
      background: #0a1628;
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      text-align: right;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .adala-btn:hover {
      background: #1e3a5f;
      border-color: #f59e0b;
      transform: translateX(-2px);
    }

    .adala-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .adala-btn.primary {
      background: linear-gradient(135deg, #f59e0b22, #d97706);
      border-color: #f59e0b;
      color: #f59e0b;
      font-size: 13px;
      padding: 12px 14px;
    }

    .adala-btn.primary:hover {
      background: linear-gradient(135deg, #f59e0b44, #d97706);
    }

    .adala-btn .btn-icon { font-size: 16px; }
    .adala-btn .btn-arrow {
      margin-right: auto;
      color: #475569;
      font-size: 10px;
    }

    .adala-divider {
      height: 1px;
      background: #1e3a5f;
      margin: 2px 10px;
    }

    .adala-progress {
      display: none;
      padding: 6px 16px;
      font-size: 11px;
      color: #f59e0b;
      text-align: center;
      animation: pulse 1.5s infinite;
    }

    .adala-progress.show { display: block; }

    @keyframes pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.4; }
    }

    .adala-result {
      display: none;
      padding: 10px 14px;
      margin: 0 10px 10px;
      background: #0f2744;
      border: 1px solid #1e3a5f;
      border-radius: 8px;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.7;
    }

    .adala-result.show { display: block; }

    .adala-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      background: #22c55e;
      border-radius: 50%;
      font-size: 10px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid #050e21;
    }

    .adala-footer {
      padding: 8px 16px;
      border-top: 1px solid #1e3a5f;
      background: #0a1628;
      font-size: 10px;
      color: #1e3a5f;
      text-align: center;
    }
  `;
  document.head.appendChild(style);

  // ===== HTML المربع =====
  const widget = document.createElement('div');
  widget.id = 'adala-widget';
  widget.innerHTML = `
    <div id="adala-panel">
      <div class="adala-header">
        <p class="adala-header-title">⚖️ منصة العدالة</p>
        <p class="adala-header-sub">مزامنة بيانات ناجز — بدون API Key</p>
      </div>

      <div class="adala-status-bar" id="adala-status">
        جارٍ التحقق من الصفحة...
      </div>

      <div class="adala-progress" id="adala-progress">
        🔄 جارٍ سحب البيانات...
      </div>

      <div class="adala-buttons">
        <!-- الزر الرئيسي -->
        <button class="adala-btn primary" data-action="all">
          <span class="btn-icon">🔄</span>
          <span>مزامنة جميع البيانات الآن</span>
          <span class="btn-arrow">◀</span>
        </button>

        <div class="adala-divider"></div>

        <!-- أزرار المزامنة الفردية -->
        <button class="adala-btn"
          data-action="cases"
          data-url="/applications/lawsuit">
          <span class="btn-icon">📁</span>
          <span>مزامنة القضايا</span>
          <span class="btn-arrow">◀</span>
        </button>

        <button class="adala-btn"
          data-action="hearings"
          data-url="/applications/appointment-requests/">
          <span class="btn-icon">📅</span>
          <span>مزامنة مواعيد الجلسات</span>
          <span class="btn-arrow">◀</span>
        </button>

        <button class="adala-btn"
          data-action="poa"
          data-url="/applications/wekalat/procurations-query">
          <span class="btn-icon">📜</span>
          <span>مزامنة الوكالات</span>
          <span class="btn-arrow">◀</span>
        </button>

        <button class="adala-btn"
          data-action="executions"
          data-url="/applications/iexecution">
          <span class="btn-icon">⚡</span>
          <span>مزامنة طلبات التنفيذ</span>
          <span class="btn-arrow">◀</span>
        </button>
      </div>

      <div class="adala-result" id="adala-result"></div>

      <div class="adala-footer">
        منصة العدالة لإدارة مكاتب المحاماة
      </div>
    </div>

    <!-- زر التبديل -->
    <div style="position:relative;display:inline-block">
      <button id="adala-toggle-btn" title="منصة العدالة — مزامنة ناجز">
        ⚖️
      </button>
      <div class="adala-badge" id="adala-badge" style="display:none">✓</div>
    </div>
  `;
  document.body.appendChild(widget);

  // ===== المتغيرات =====
  const panel = document.getElementById('adala-panel');
  const toggleBtn = document.getElementById('adala-toggle-btn');
  const statusEl = document.getElementById('adala-status');
  const progressEl = document.getElementById('adala-progress');
  const resultEl = document.getElementById('adala-result');
  const badge = document.getElementById('adala-badge');
  const buttons = widget.querySelectorAll('.adala-btn');

  let isOpen = false;
  let isSyncing = false;

  // ===== تحديد الصفحة الحالية =====
  const url = window.location.href;
  const pageTypeMap = {
    cases: url.includes('/lawsuit'),
    hearings: url.includes('/appointment-requests'),
    poa: url.includes('/wekalat') || url.includes('/procurations'),
    executions: url.includes('/iexecution')
  };

  const currentType = Object.entries(pageTypeMap)
    .find(([, v]) => v)?.[0] || 'unknown';

  const sectionNames = {
    cases: 'إدارة القضايا',
    hearings: 'مواعيد الجلسات',
    poa: 'الوكالات',
    executions: 'طلبات التنفيذ',
    unknown: 'ناجز'
  };

  // تحديث حالة الصفحة
  const setStatus = (msg, color = '#94a3b8') => {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = color;
    }
  };

  const showProgress = (show, msg = '🔄 جارٍ السحب...') => {
    if (progressEl) {
      progressEl.textContent = msg;
      progressEl.className = 'adala-progress' + (show ? ' show' : '');
    }
  };

  const showResult = (html) => {
    if (resultEl) {
      resultEl.innerHTML = html;
      resultEl.className = 'adala-result show';
    }
  };

  const hideResult = () => {
    if (resultEl) resultEl.className = 'adala-result';
  };

  // حالة الصفحة
  if (currentType !== 'unknown') {
    setStatus(
      `✅ صفحة ${sectionNames[currentType]} — جاهز`,
      '#22c55e'
    );
  } else {
    setStatus('اختر نوع المزامنة أدناه', '#94a3b8');
  }

  // ===== فتح/إغلاق المربع =====
  toggleBtn?.addEventListener('click', () => {
    isOpen = !isOpen;
    panel?.classList.toggle('open', isOpen);
    toggleBtn.classList.toggle('active', isOpen);
    toggleBtn.textContent = isOpen ? '✕' : '⚖️';
  });

  // إغلاق عند الضغط خارج المربع
  document.addEventListener('click', (e) => {
    const w = document.getElementById('adala-widget');
    if (isOpen && w && !w.contains(e.target)) {
      isOpen = false;
      panel?.classList.remove('open');
      toggleBtn?.classList.remove('active');
      if (toggleBtn) toggleBtn.textContent = '⚖️';
    }
  });

  // ===== دالة السحب والمزامنة =====
  async function syncData(action) {
    if (isSyncing) return;
    isSyncing = true;

    // تعطيل الأزرار
    buttons.forEach(btn => btn.disabled = true);
    hideResult();

    const actionNames = {
      all: 'جميع البيانات',
      cases: 'القضايا',
      hearings: 'مواعيد الجلسات',
      poa: 'الوكالات',
      executions: 'طلبات التنفيذ'
    };

    showProgress(true, `🔄 جارٍ سحب ${actionNames[action]}...`);
    setStatus(`⏳ جارٍ مزامنة ${actionNames[action]}...`, '#f59e0b');

    try {
      // إذا الصفحة الحالية مطابقة للطلب أو طلب "الكل"
      const targetUrls = {
        cases: 'https://najiz.sa/applications/lawsuit',
        hearings: 'https://najiz.sa/applications/appointment-requests/',
        poa: 'https://najiz.sa/applications/wekalat/procurations-query',
        executions: 'https://najiz.sa/applications/iexecution'
      };

      let data = null;

      // إذا الصفحة الحالية مطابقة
      if (action === 'all' || pageTypeMap[action]) {
        // انتظر تحميل البيانات
        await new Promise(r => setTimeout(r, 2000));

        // استخراج البيانات من الصفحة الحالية
        const extracted = await extractByPageType();

        if (extracted.summary.hasData) {
          data = extracted;
        }
      }

      // إذا لم توجد بيانات في الصفحة الحالية
      if (!data || !data.summary?.hasData) {
        // فتح الصفحة المطلوبة في tab جديد
        const targetUrl = action === 'all'
          ? targetUrls.cases
          : targetUrls[action];

        if (targetUrl && !window.location.href.includes(
          targetUrl.replace('https://najiz.sa', '')
        )) {
          showProgress(
            true,
            `⏳ انتقل إلى صفحة ${actionNames[action]} على ناجز`
          );
          setStatus(
            `⚠️ اذهب لصفحة ${actionNames[action]} ثم اضغط مرة أخرى`,
            '#f59e0b'
          );

          showResult(`
            <div style="color:#f59e0b;font-weight:bold;margin-bottom:6px">
              ⚠️ الصفحة الحالية لا تحتوي على ${actionNames[action]}
            </div>
            <div style="color:#94a3b8;font-size:10px;margin-bottom:8px">
              اضغط الزر أدناه للانتقال للصفحة الصحيحة:
            </div>
            <a href="${targetUrl}"
              style="display:block;background:#1e3a5f;color:#f59e0b;
              padding:8px;border-radius:8px;text-align:center;
              text-decoration:none;font-size:12px;font-weight:bold;">
              🔗 انتقل إلى صفحة ${actionNames[action]}
            </a>
          `);

          isSyncing = false;
          buttons.forEach(btn => btn.disabled = false);
          showProgress(false);
          return;
        }

        // إعادة المحاولة
        await new Promise(r => setTimeout(r, 3000));
        const retryData = await extractByPageType();
        if (retryData.summary.hasData) {
          data = retryData;
        }
      }

      if (!data || !data.summary?.hasData) {
        setStatus('⚠️ لم تُوجد بيانات — انتظر التحميل', '#f59e0b');
        showResult(`
          <div style="color:#f59e0b">
            ⚠️ لم يتم العثور على بيانات في الصفحة الحالية
          </div>
          <div style="color:#94a3b8;font-size:10px;margin-top:6px">
            انتظر تحميل الصفحة بالكامل ثم حاول مرة أخرى
          </div>
        `);
        return;
      }

      // إرسال للخادم
      showProgress(true, '📡 جارٍ المزامنة مع النظام...');

      const syncRes = await fetch(`${SERVER}/api/najiz-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedData: data,
          pageType: action,
          source: 'floating_widget',
          timestamp: new Date().toISOString()
        })
      });

      const syncResult = syncRes.ok ? await syncRes.json() : null;
      const r = syncResult?.results || {};

      const totalSynced = (r.cases?.added || 0) +
        (r.cases?.updated || 0) +
        (r.hearings?.added || 0) +
        (r.poa?.added || 0) +
        (r.executions?.added || 0);

      // عرض النتائج
      setStatus(
        `✅ تمت المزامنة — ${totalSynced} سجل`,
        '#22c55e'
      );

      showResult(`
        <div style="color:#22c55e;font-weight:bold;margin-bottom:8px">
          ✅ تمت المزامنة بنجاح
        </div>
        ${data.summary.totalCases > 0 ?
          `<div style="color:#fff;margin:2px 0">
            📁 القضايا: <strong>${data.summary.totalCases}</strong>
            ${r.cases ? `(${r.cases.added} جديد، ${r.cases.updated} محدّث)` : ''}
          </div>` : ''}
        ${data.summary.totalHearings > 0 ?
          `<div style="color:#fff;margin:2px 0">
            📅 الجلسات: <strong>${data.summary.totalHearings}</strong>
          </div>` : ''}
        ${data.summary.totalPOAs > 0 ?
          `<div style="color:#fff;margin:2px 0">
            📜 الوكالات: <strong>${data.summary.totalPOAs}</strong>
          </div>` : ''}
        ${data.summary.totalExecutions > 0 ?
          `<div style="color:#fff;margin:2px 0">
            ⚡ التنفيذ: <strong>${data.summary.totalExecutions}</strong>
          </div>` : ''}
        <div style="color:#475569;font-size:10px;margin-top:6px">
          ${new Date().toLocaleString('ar-SA')}
        </div>
      `);

      // إظهار شارة النجاح
      if (badge) badge.style.display = 'flex';

    } catch (err) {
      setStatus('❌ خطأ: ' + err.message, '#ef4444');
      showResult(`
        <div style="color:#ef4444">❌ ${err.message}</div>
      `);
    } finally {
      isSyncing = false;
      buttons.forEach(btn => btn.disabled = false);
      showProgress(false);
    }
  }

  // ===== ربط الأزرار =====
  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action) await syncData(action);
    });
  });

  // مزامنة تلقائية عند تحميل الصفحة
  if (currentType !== 'unknown') {
    setTimeout(() => {
      setStatus(
        `✅ صفحة ${sectionNames[currentType]} — اضغط للمزامنة`,
        '#22c55e'
      );
    }, 3000);
  }
}

// تشغيل المربع بعد تحميل الصفحة
if (document.readyState === 'complete') {
  setTimeout(createFloatingWidget, 1500);
} else {
  window.addEventListener('load', () => {
    setTimeout(createFloatingWidget, 1500);
  });
}

// مراقبة التغييرات في الـ URL (SPA)
let lastUrl = window.location.href;
new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const old = document.getElementById('adala-widget');
    if (old) old.remove();
    setTimeout(createFloatingWidget, 2000);
  }
}).observe(document.body, { childList: true, subtree: true });
