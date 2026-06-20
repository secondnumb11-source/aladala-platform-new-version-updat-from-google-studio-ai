(function () {
  'use strict';

  // انتظار ظهور عنصر في الصفحة
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Timeout: Element not found: ' + selector));
      }, timeout);
    });
  }

  // انتظار تحميل البيانات الديناميكية
  function waitForData(timeout = 15000) {
    return new Promise((resolve) => {
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 500;
        const text = document.body?.innerText || '';
        const hasData = (
          /\d{4}\/\d+/.test(text) ||
          /\d{10}/.test(text) ||
          document.querySelectorAll('table tr').length > 2 ||
          document.querySelectorAll('[class*="card"]').length > 0 ||
          document.querySelectorAll('[class*="Card"]').length > 0 ||
          document.querySelectorAll('[class*="item"]').length > 3
        );

        if (hasData || elapsed >= timeout) {
          clearInterval(interval);
          resolve(hasData);
        }
      }, 500);
    });
  }

  // الدالة الرئيسية لاستخراج البيانات
  async function extractNajizData() {
    // انتظر تحميل البيانات
    await waitForData(12000);

    // انتظر إضافي للصفحات البطيئة
    await new Promise(r => setTimeout(r, 2000));

    const result = {
      cases: [],
      hearings: [],
      powers_of_attorney: [],
      executions: [],
      clients: [],
      rawText: '',
      pageUrl: window.location.href,
      pageTitle: document.title,
      scrapedAt: new Date().toISOString()
    };

    const bodyText = document.body?.innerText || '';
    result.rawText = bodyText.substring(0, 5000);

    // ===== استخراج القضايا من الجداول =====
    const tables = document.querySelectorAll('table, [class*="Table"], [class*="table"]');
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      rows.forEach((row, i) => {
        if (i === 0) return; // تخطي الـ header
        const cells = Array.from(row.querySelectorAll('td, [class*="Cell"], [class*="cell"]'))
          .map(c => c.innerText?.trim() || '');

        if (cells.length < 2) return;

        const rowText = cells.join(' ');
        const caseNum = rowText.match(/\d{4}\/\d+|\d{10,}|\d{9}/)?.[0];
        const dateMatch = rowText.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/);

        if (caseNum && !result.cases.find(c => c.caseNumber === caseNum)) {
          result.cases.push({
            caseNumber: caseNum,
            caseName: cells.find(c =>
              c.length > 4 &&
              !/^\d+$/.test(c) &&
              !c.includes('/') &&
              !c.includes('-')
            ) || '',
            status: cells.find(c =>
              ['قيد', 'منتهي', 'نشط', 'مقيد', 'محكوم',
               'مؤجل', 'مشطوب', 'موقوف', 'صدر'].some(k => c.includes(k))
            ) || '',
            court: cells.find(c => c.includes('محكمة')) || '',
            nextHearing: dateMatch?.[0] || '',
            category: cells.find(c =>
              ['تجاري', 'عمالي', 'مدني', 'جزائي', 'أحوال'].some(k => c.includes(k))
            ) || '',
            rawCells: cells
          });
        }

        // استخراج الجلسات
        if (dateMatch && (
          rowText.includes('جلسة') ||
          rowText.includes('موعد') ||
          table.innerText?.includes('جلسة')
        )) {
          result.hearings.push({
            date: dateMatch[0],
            caseNumber: caseNum || '',
            court: cells.find(c => c.includes('محكمة')) || '',
            status: cells.find(c =>
              ['قادمة', 'منتهية', 'مؤجلة', 'ملغاة'].some(k => c.includes(k))
            ) || 'قادمة',
            hall: cells.find(c => c.includes('قاعة') || c.includes('دائرة')) || ''
          });
        }
      });
    });

    // ===== استخراج من البطاقات الديناميكية =====
    const cardSelectors = [
      '[class*="CaseCard"]', '[class*="case-card"]', '[class*="caseCard"]',
      '[class*="RequestCard"]', '[class*="requestCard"]',
      '[class*="CaseItem"]', '[class*="caseItem"]',
      '[class*="ListItem"]', '[class*="list-item"]',
      '[class*="CaseRow"]', '[class*="caseRow"]',
      '[class*="MuiCard"]', '[class*="MuiPaper"]',
      '[class*="ant-card"]', '[class*="el-card"]',
      '[data-testid*="case"]', '[data-cy*="case"]',
      '.case', '.case-item', '.case-card',
      '[class*="lawsuit"]', '[class*="claim"]'
    ];

    cardSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(card => {
          const text = card.innerText?.trim() || '';
          if (!text || text.length < 10) return;

          const caseNum = text.match(/\d{4}\/\d+|\d{10,}|\d{9}/)?.[0];
          const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/);

          if (caseNum && !result.cases.find(c => c.caseNumber === caseNum)) {
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            result.cases.push({
              caseNumber: caseNum,
              caseName: lines.find(l =>
                l.length > 5 && !/^\d+[\/\-]?\d*$/.test(l)
              ) || '',
              status: lines.find(l =>
                ['قيد', 'منتهي', 'نشط', 'مقيد', 'محكوم',
                 'مؤجل', 'مشطوب', 'موقوف'].some(k => l.includes(k))
              ) || '',
              nextHearing: dateMatch?.[0] || '',
              rawText: text.substring(0, 300)
            });
          }

          if (text.includes('وكالة')) {
            const poaNum = text.match(/\d{6,}/)?.[0];
            result.powers_of_attorney.push({
              poaNumber: poaNum || '',
              text: text.substring(0, 300),
              expiryDate: text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/)?.[0] || ''
            });
          }

          if (text.includes('تنفيذ')) {
            result.executions.push({
              number: caseNum || '',
              text: text.substring(0, 200)
            });
          }
        });
      } catch (e) {}
    });

    // ===== استخراج من النص الخام =====
    if (result.cases.length === 0) {
      const allCaseNums = bodyText.match(/\d{4}\/\d{1,2}\/\d+|\d{4}\/\d{4,}/g) || [];
      const uniqueNums = [...new Set(allCaseNums)];
      uniqueNums.forEach(num => {
        if (!result.cases.find(c => c.caseNumber === num)) {
          result.cases.push({
            caseNumber: num,
            caseName: '',
            status: '',
            source: 'text_extraction'
          });
        }
      });
    }

    // ===== استخراج اسم المستخدم =====
    const nameSelectors = [
      '[class*="userName"]', '[class*="user-name"]',
      '[class*="UserName"]', '[class*="profileName"]',
      '[class*="WelcomeUser"]', '[class*="welcomeUser"]',
      '[class*="greeting"]', '.user-name', '.profile-name',
      'header [class*="name"]', 'nav [class*="name"]'
    ];

    for (const sel of nameSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el?.innerText?.trim()) {
          result.clients.push({
            name: el.innerText.trim(),
            source: 'profile'
          });
          break;
        }
      } catch (e) {}
    }

    // البحث في النص عن "مرحباً"
    if (result.clients.length === 0) {
      const welcomeMatch = bodyText.match(
        /(?:مرحباً?|أهلاً?)[،,\s]+([^\n،,\d]{3,40})/
      );
      if (welcomeMatch) {
        result.clients.push({
          name: welcomeMatch[1].trim(),
          source: 'welcome_text'
        });
      }
    }

    result.summary = {
      totalCases: result.cases.length,
      totalHearings: result.hearings.length,
      totalPOAs: result.powers_of_attorney.length,
      totalExecutions: result.executions.length,
      hasUser: result.clients.length > 0,
      pageUrl: window.location.href
    };

    return result;
  }

  // ===== الاستماع للأوامر =====
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (['extractData', 'scrape', 'getData', 'sync'].includes(request.action)) {

      (async () => {
        try {
          const data = await extractNajizData();
          const hasData = data.cases.length > 0 ||
            data.hearings.length > 0 ||
            data.powers_of_attorney.length > 0;

          if (hasData) {
            sendResponse({ success: true, data });
          } else {
            // إرشاد المستخدم
            sendResponse({
              success: false,
              data,
              message: getHelpMessage()
            });
          }
        } catch (err) {
          sendResponse({
            success: false,
            error: err.message,
            message: 'خطأ في القراءة: ' + err.message
          });
        }
      })();

      return true;
    }

    if (request.action === 'ping') {
      sendResponse({
        success: true,
        url: window.location.href,
        isNajiz: window.location.href.includes('najiz.sa'),
        title: document.title
      });
      return true;
    }
  });

  function getHelpMessage() {
    const url = window.location.href;
    if (url.includes('najiz.sa')) {
      if (!url.includes('/Cases') && !url.includes('/Hearings') && !url.includes('/case')) {
        return 'يرجى الانتقال إلى صفحة "قضاياي" أو "جلساتي" على ناجز ثم اضغط سحب البيانات مرة أخرى';
      }
      return 'انتظر تحميل الصفحة كاملاً ثم اضغط سحب البيانات مرة أخرى';
    }
    return 'يرجى فتح موقع ناجز أولاً: www.najiz.sa';
  }

  console.log('[العدالة] ✅ Content Script جاهز على:', window.location.href);

  try {
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      url: window.location.href,
      isNajiz: window.location.href.includes('najiz.sa')
    });
  } catch (e) {}

})();
