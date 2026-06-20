// content.js — قارئ بيانات ناجز
// لا يحتاج API Key — يقرأ الصفحة مباشرة من جلسة المستخدم المسجل
(function () {
  'use strict';

  // =============================================
  // الدالة الرئيسية — تقرأ ما يراه المستخدم في صفحته
  // =============================================
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
      needsApiKey: false  // تأكيد: لا يحتاج API Key
    };

    // =============================================
    // الطريقة 1: قراءة النصوص الخام من الصفحة
    // =============================================
    const bodyText = document.body?.innerText || '';

    // استخراج أرقام القضايا بكل الصيغ الممكنة
    const caseNumberPatterns = [
      /\d{4}\/\d{1,2}\/\d+/g,     // 1446/ق/12345
      /\d{4}\/\d{4,}/g,            // 2024/12345
      /(?<!\d)\d{10}(?!\d)/g,      // 10 أرقام متتالية
      /(?<!\d)\d{9}(?!\d)/g,       // 9 أرقام
    ];

    const foundCaseNumbers = new Set();
    caseNumberPatterns.forEach(pattern => {
      const matches = bodyText.match(pattern) || [];
      matches.forEach(m => foundCaseNumbers.add(m.trim()));
    });

    // =============================================
    // الطريقة 2: قراءة الجداول
    // =============================================
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
          /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/
        );
        const caseNumMatch = rowText.match(/\d{4}\/\d+|\d{10,}|\d{9}/);

        if (isCaseTable || caseNumMatch) {
          const caseNum = caseNumMatch?.[0] || '';
          if (!data.cases.find(c => c.caseNumber === caseNum)) {
            data.cases.push({
              caseNumber: caseNum,
              caseName: cells.find(c =>
                c.length > 4 && !/^\d+$/.test(c) && !c.includes('/')
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

    // =============================================
    // الطريقة 3: قراءة البطاقات والعناصر الديناميكية
    // =============================================
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

          const caseNumMatch = text.match(/\d{4}\/\d+|\d{10,}|\d{9}/);
          const dateMatch = text.match(
            /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/
          );

          if (caseNumMatch) {
            const caseNum = caseNumMatch[0];
            if (!data.cases.find(c => c.caseNumber === caseNum)) {
              data.cases.push({
                caseNumber: caseNum,
                caseName: text.split('\n')[0]?.substring(0, 100) || '',
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
            const poaNum = text.match(/\d{6,}/)?.[0];
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

    // =============================================
    // الطريقة 4: قراءة اسم المستخدم المسجل
    // =============================================
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

    // البحث عن "مرحباً" في الصفحة
    const welcomeMatch = bodyText.match(
      /(?:مرحباً|أهلاً|مرحبا)[،,\s]+([^\n،,]{3,40})/
    );
    if (welcomeMatch && data.clients.length === 0) {
      data.clients.push({
        name: welcomeMatch[1].trim(),
        source: 'najiz_welcome_text'
      });
    }

    // =============================================
    // الطريقة 5: أرقام القضايا من الـ URL
    // =============================================
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

    // =============================================
    // ملخص النتائج
    // =============================================
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

  // =============================================
  // الاستماع لأوامر الـ Extension
  // =============================================
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    // أمر السحب الرئيسي
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
            // انتظر 3 ثوانٍ للصفحات الديناميكية ثم حاول مرة أخرى
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

      // إذا الصفحة لم تكتمل، انتظر
      if (document.readyState !== 'complete') {
        window.addEventListener('load', doExtract, { once: true });
      } else {
        doExtract();
      }

      return true; // مطلوب للـ async
    }

    // فحص الاتصال
    if (request.action === 'ping') {
      sendResponse({
        success: true,
        active: true,
        isNajiz: window.location.href.includes('najiz.sa'),
        url: window.location.href
      });
      return true;
    }

    // معلومات الصفحة
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

  // تأكيد تشغيل الـ Script
  console.log(
    '[منصة العدالة] ✅ Script جاهز — بدون API Key — يقرأ بيانات المستخدم المسجل مباشرة'
  );

  // إشعار background بالجاهزية
  try {
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      url: window.location.href,
      isNajiz: window.location.href.includes('najiz.sa')
    });
  } catch (e) {}

})();
