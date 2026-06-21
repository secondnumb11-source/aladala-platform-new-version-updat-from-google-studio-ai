(function () {
  'use strict';

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  // =============================================
  // تحديد الصفحة الحالية
  // =============================================
  function getPageType() {
    const url = window.location.href;
    if (url.includes('/lawsuit')) return 'cases';
    if (url.includes('/iexecution')) return 'executions';
    if (url.includes('/wekalat') || url.includes('/procuration')) return 'poa';
    if (url.includes('/appointment-requests')) return 'hearings';
    return 'unknown';
  }

  // =============================================
  // انتظار ظهور البيانات على الشاشة
  // =============================================
  function waitForVisibleContent(timeoutMs = 15000) {
    return new Promise((resolve) => {
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 500;

        const body = document.body?.innerText || '';

        // علامات وجود بيانات مرئية
        const hasTable = document.querySelectorAll('table tr').length > 1;
        const hasCards = document.querySelectorAll(
          '[class*="card" i], [class*="item" i], [class*="row" i], [class*="list" i]'
        ).length > 2;
        const hasNumbers = /\\d{4}\\/\\d+|\\d{9,}/.test(body);
        const hasArabicContent = /[\\u0600-\\u06FF]{5,}/.test(body) && body.length > 500;

        if (hasTable || hasCards || hasNumbers || hasArabicContent) {
          clearInterval(interval);
          resolve(true);
          return;
        }

        if (elapsed >= timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      }, 500);
    });
  }

  // =============================================
  // قراءة كل النص المرئي على الشاشة
  // =============================================
  function getVisibleText() {
    // احصل على النص من العناصر المرئية فعلاً
    const visibleElements = [];

    function isVisible(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0' &&
             el.offsetParent !== null;
    }

    // اجمع كل النصوص من العناصر المرئية
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeValue?.trim() &&
              isVisible(node.parentElement)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue?.trim();
      if (text && text.length > 1) {
        visibleElements.push(text);
      }
    }

    return visibleElements.join('\\n');
  }

  // =============================================
  // استخراج القضايا من الصفحة المرئية
  // =============================================
  function extractCasesFromScreen() {
    const cases = [];
    const seen = new Set();

    // أولاً: من الجداول المرئية
    document.querySelectorAll('table').forEach(table => {
      if (!table.offsetParent) return; // تجاهل غير المرئي

      // استخراج رؤوس الجدول
      const headers = Array.from(
        table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td')
      ).map(h => h.innerText?.trim() || '');

      // استخراج الصفوف
      const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rows.forEach(row => {
        if (!row.offsetParent) return;
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;

        const rowText = cells.join(' | ');

        // البحث عن رقم القضية
        const caseNumMatch = rowText.match(
          /\\d{4}\\/\\d{1,2}\\/\\d+|\\d{4}\\/\\d{4,}|\\b\\d{9,10}\\b/
        );
        if (!caseNumMatch || seen.has(caseNumMatch[0])) return;
        seen.add(caseNumMatch[0]);

        // البحث عن التاريخ
        const dateMatch = rowText.match(
          /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
        );

        // بناء كائن القضية
        const caseObj = {
          caseNumber: caseNumMatch[0],
          najizCaseNumber: caseNumMatch[0],
          caseName: '',
          status: '',
          court: '',
          category: '',
          nextHearing: dateMatch?.[0] || '',
          stage: 'litigation',
          isNajizSync: true,
          source: 'screen_table',
          rawCells: cells
        };

        // ربط الخلايا بالرؤوس
        headers.forEach((header, i) => {
          const cell = cells[i] || '';
          const h = header.toLowerCase();

          if (h.includes('رقم') || h.includes('number')) {
            if (!caseObj.caseNumber) caseObj.caseNumber = cell;
          }
          if (h.includes('اسم') || h.includes('عنوان') || h.includes('موضوع')) {
            caseObj.caseName = cell;
          }
          if (h.includes('حالة') || h.includes('الحالة') || h.includes('status')) {
            caseObj.status = cell;
          }
          if (h.includes('محكمة') || h.includes('court')) {
            caseObj.court = cell;
          }
          if (h.includes('تصنيف') || h.includes('نوع') || h.includes('type')) {
            caseObj.category = mapCategory(cell);
          }
          if (h.includes('جلسة') || h.includes('موعد') || h.includes('تاريخ')) {
            if (cell.match(/\\d{1,2}[\\/\\-]\\d/)) caseObj.nextHearing = cell;
          }
        });

        // استكمال البيانات من النص
        if (!caseObj.status) {
          caseObj.status = cells.find(c =>
            ['قيد','منتهي','نشط','مقيد','محكوم','مؤجل',
             'مشطوب','موقوف','صدر','جديد','مباشرة']
              .some(k => c.includes(k))
          ) || 'قيد النظر';
        }

        if (!caseObj.court) {
          caseObj.court = cells.find(c => c.includes('محكمة')) || '';
        }

        if (!caseObj.caseName) {
          caseObj.caseName = cells.find(c =>
            c.length > 5 &&
            !/^\\d+[\\/\\-]?\\d*$/.test(c) &&
            !c.includes('محكمة') &&
            !c.includes('ريال') &&
            !/^\\d{4}\\//.test(c)
          ) || 'قضية من ناجز';
        }

        if (!caseObj.category) {
          caseObj.category = mapCategory(rowText);
        }

        cases.push(caseObj);
      });
    });

    // ثانياً: من البطاقات والقوائم المرئية
    const cardSelectors = [
      '[class*="card" i]', '[class*="Card"]',
      '[class*="item" i]', '[class*="Item"]',
      '[class*="row" i]', '[class*="Row"]',
      '[class*="case" i]', '[class*="lawsuit" i]',
      '[class*="request" i]', '[class*="list-item" i]',
      'li[class]', '[role="row"]', '[role="listitem"]'
    ];

    cardSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (!el.offsetParent) return; // غير مرئي
          const text = el.innerText?.trim() || '';
          if (text.length < 10 || text.length > 3000) return;

          const numMatch = text.match(
            /\\d{4}\\/\\d{1,2}\\/\\d+|\\d{4}\\/\\d{4,}|\\b\\d{9,10}\\b/
          );
          if (!numMatch || seen.has(numMatch[0])) return;
          seen.add(numMatch[0]);

          const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
          const dateMatch = text.match(
            /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
          );

          cases.push({
            caseNumber: numMatch[0],
            najizCaseNumber: numMatch[0],
            caseName: lines.find(l =>
              l.length > 5 &&
              !/^\\d+[\\/\\-]?\\d*$/.test(l) &&
              !l.includes('محكمة') &&
              l !== numMatch[0]
            ) || 'قضية من ناجز',
            status: lines.find(l =>
              ['قيد','منتهي','نشط','مقيد','محكوم',
               'مؤجل','مشطوب','موقوف'].some(k => l.includes(k))
            ) || 'قيد النظر',
            court: lines.find(l => l.includes('محكمة')) || '',
            category: mapCategory(text),
            nextHearing: dateMatch?.[0] || '',
            stage: 'litigation',
            isNajizSync: true,
            source: 'screen_card',
            rawText: text.substring(0, 500)
          });
        });
      } catch(e) {}
    });

    // ثالثاً: Fallback من النص الكامل المرئي
    if (cases.length === 0) {
      const visibleText = getVisibleText();
      const allNums = [...new Set(
        visibleText.match(/\\d{4}\\/\\d{1,2}\\/\\d+|\\d{4}\\/\\d{4,}/g) || []
      )];

      allNums.forEach(num => {
        if (!seen.has(num)) {
          seen.add(num);
          // البحث عن سياق الرقم
          const idx = visibleText.indexOf(num);
          const context = visibleText.substring(
            Math.max(0, idx - 300),
            Math.min(visibleText.length, idx + 400)
          );
          cases.push({
            caseNumber: num,
            najizCaseNumber: num,
            caseName: 'قضية من ناجز',
            status: context.includes('منتهي') ? 'منتهي' : 'قيد النظر',
            court: (context.match(/محكمة[^\\n،,]{2,30}/)?.[0] || ''),
            category: mapCategory(context),
            nextHearing: context.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/)?.[0] || '',
            isNajizSync: true,
            source: 'screen_text_fallback'
          });
        }
      });
    }

    return cases;
  }

  // =============================================
  // استخراج مواعيد الجلسات
  // =============================================
  function extractHearingsFromScreen() {
    const hearings = [];
    const seen = new Set();

    document.querySelectorAll('table, [class*="card" i], [class*="item" i], [role="row"]')
      .forEach(el => {
        if (!el.offsetParent) return;
        const text = el.innerText?.trim() || '';
        if (text.length < 10) return;

        const dateMatch = text.match(
          /\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}|\\d{4}[\\/\\-]\\d{1,2}[\\/\\-]\\d{1,2}/
        );
        const timeMatch = text.match(/\\d{1,2}:\\d{2}/);
        const caseNum = text.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];

        if (!dateMatch) return;
        const key = \`\${caseNum}-\${dateMatch[0]}\`;
        if (seen.has(key)) return;
        seen.add(key);

        // استخراج من جدول
        if (el.tagName === 'TABLE') {
          const rows = el.querySelectorAll('tbody tr, tr:not(:first-child)');
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'))
              .map(td => td.innerText?.trim() || '');
            const rText = cells.join(' ');
            const rDate = rText.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/);
            const rTime = rText.match(/\\d{1,2}:\\d{2}/);
            const rCase = rText.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];
            const rKey = \`\${rCase}-\${rDate?.[0]}\`;
            if (rDate && !seen.has(rKey)) {
              seen.add(rKey);
              hearings.push({
                caseNumber: rCase || '',
                date: rDate[0],
                time: rTime?.[0] || '09:00',
                court: cells.find(c => c.includes('محكمة')) || '',
                hall: cells.find(c =>
                  c.includes('قاعة') || c.includes('دائرة')
                ) || '',
                status: cells.find(c =>
                  ['قادمة','منتهية','مؤجلة','ملغاة'].some(k => c.includes(k))
                ) || 'قادمة',
                isNajizSync: true,
                source: 'screen_table'
              });
            }
          });
          return;
        }

        hearings.push({
          caseNumber: caseNum || '',
          date: dateMatch[0],
          time: timeMatch?.[0] || '09:00',
          court: text.match(/محكمة[^\\n،,]{2,30}/)?.[0] || '',
          hall: text.match(/(?:قاعة|دائرة)[^\\n،,]{1,20}/)?.[0] || '',
          status: text.includes('مؤجل') ? 'مؤجلة' :
                  text.includes('منتهي') ? 'منتهية' : 'قادمة',
          isNajizSync: true,
          source: 'screen_card'
        });
      });

    return hearings;
  }

  // =============================================
  // استخراج الوكالات
  // =============================================
  function extractPOAFromScreen() {
    const poas = [];
    const seen = new Set();
    const visibleText = getVisibleText();

    // من الجداول
    document.querySelectorAll('table').forEach(table => {
      if (!table.offsetParent) return;
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');
        const num = rowText.match(/\\d{6,}/)?.[0];
        if (!num || seen.has(num)) return;
        seen.add(num);

        const dates = rowText.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/g);
        poas.push({
          poaNumber: num,
          type: cells.find(c =>
            ['عامة','خاصة','قضائية','عام','خاص'].some(k => c.includes(k))
          ) || 'عامة',
          status: cells.find(c =>
            ['سارية','منتهية','موقوفة','فعال'].some(k => c.includes(k))
          ) || 'سارية',
          issueDate: dates?.[0] || '',
          expiryDate: dates?.[1] || dates?.[0] || '',
          principalName: cells.find(c =>
            c.length > 3 &&
            !/^\\d+$/.test(c) &&
            !['سارية','منتهية','عامة','خاصة'].some(k => c === k)
          ) || '',
          isNajizSync: true,
          source: 'screen_table'
        });
      });
    });

    // Fallback من النص
    if (poas.length === 0) {
      const nums = [...new Set(visibleText.match(/\\b\\d{7,12}\\b/g) || [])];
      nums.slice(0, 20).forEach(num => {
        if (!seen.has(num)) {
          seen.add(num);
          poas.push({
            poaNumber: num,
            type: 'عامة',
            status: 'سارية',
            isNajizSync: true,
            source: 'screen_text'
          });
        }
      });
    }

    return poas;
  }

  // =============================================
  // استخراج طلبات التنفيذ
  // =============================================
  function extractExecutionsFromScreen() {
    const executions = [];
    const seen = new Set();

    document.querySelectorAll('table').forEach(table => {
      if (!table.offsetParent) return;
      table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
          .map(td => td.innerText?.trim() || '');
        if (cells.length < 2) return;
        const rowText = cells.join(' ');
        const num = rowText.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];
        if (!num || seen.has(num)) return;
        seen.add(num);

        const dateMatch = rowText.match(/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4}/);
        const amountMatch = rowText.match(/([\\d,]+(?:\\.\\d+)?)\\s*(?:ريال|ر\\.س|SAR)/);

        executions.push({
          executionNumber: num,
          status: cells.find(c =>
            ['منتهي','قيد','جديد','مكتمل','معلق','نشط']
              .some(k => c.includes(k))
          ) || 'قيد التنفيذ',
          amount: amountMatch?.[1]?.replace(/,/g, '') || '0',
          court: cells.find(c => c.includes('محكمة')) || '',
          requesterName: cells.find(c =>
            c.length > 3 &&
            !/^\\d+$/.test(c) &&
            !c.includes('محكمة') &&
            !c.includes('ريال')
          ) || '',
          issueDate: dateMatch?.[0] || '',
          isNajizSync: true,
          source: 'screen_table'
        });
      });
    });

    // من البطاقات
    document.querySelectorAll('[class*="card" i], [class*="item" i], [role="listitem"]')
      .forEach(el => {
        if (!el.offsetParent) return;
        const text = el.innerText?.trim() || '';
        if (!text.includes('تنفيذ') && !text.includes('execution')) return;
        const num = text.match(/\\d{4}\\/\\d+|\\d{9,}/)?.[0];
        if (!num || seen.has(num)) return;
        seen.add(num);
        executions.push({
          executionNumber: num,
          status: text.includes('منتهي') ? 'منتهي' : 'قيد التنفيذ',
          amount: text.match(/([\\d,]+)\\s*ريال/)?.[1] || '0',
          isNajizSync: true,
          source: 'screen_card'
        });
      });

    return executions;
  }

  // =============================================
  // دوال مساعدة
  // =============================================
  function mapCategory(text) {
    if (!text) return 'civil';
    const t = text.toString();
    if (t.includes('تجاري')) return 'commercial';
    if (t.includes('عمالي') || t.includes('عمل')) return 'labor';
    if (t.includes('جزائي') || t.includes('جنائي')) return 'criminal';
    if (t.includes('أحوال') || t.includes('أسرة')) return 'personal_status';
    if (t.includes('إداري') || t.includes('مظالم')) return 'administrative';
    if (t.includes('تنفيذ')) return 'execution';
    return 'civil';
  }

  // =============================================
  // الدالة الرئيسية للسحب
  // =============================================
  async function extractFromCurrentPage() {
    const pageType = getPageType();

    // انتظر ظهور البيانات
    await waitForVisibleContent(15000);

    // انتظر إضافي
    await new Promise(r => setTimeout(r, 2000));

    const result = {
      pageType,
      pageUrl: window.location.href,
      pageTitle: document.title,
      cases: [],
      hearings: [],
      powers_of_attorney: [],
      executions: [],
      scrapedAt: new Date().toISOString()
    };

    switch (pageType) {
      case 'cases':
        result.cases = extractCasesFromScreen();
        // صفحة القضايا قد تحتوي على جلسات أيضاً
        const hearings = extractHearingsFromScreen();
        if (hearings.length > 0) result.hearings = hearings;
        break;
      case 'hearings':
        result.hearings = extractHearingsFromScreen();
        break;
      case 'poa':
        result.powers_of_attorney = extractPOAFromScreen();
        break;
      case 'executions':
        result.executions = extractExecutionsFromScreen();
        break;
      default:
        // سحب شامل
        result.cases = extractCasesFromScreen();
        result.hearings = extractHearingsFromScreen();
        result.powers_of_attorney = extractPOAFromScreen();
        result.executions = extractExecutionsFromScreen();
    }

    const totalFound =
      result.cases.length +
      result.hearings.length +
      result.powers_of_attorney.length +
      result.executions.length;

    result.summary = {
      pageType,
      totalCases: result.cases.length,
      totalHearings: result.hearings.length,
      totalPOAs: result.powers_of_attorney.length,
      totalExecutions: result.executions.length,
      totalFound,
      hasData: totalFound > 0
    };

    return result;
  }

  // =============================================
  // إرسال للخادم
  // =============================================
  async function syncToServer(data) {
    try {
      const response = await fetch(\`\${SERVER}/api/najiz-sync\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrapedData: data,
          pageType: data.pageType,
          source: 'najiz_screen_reader_v7',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(\`HTTP \${response.status}: \${err}\`);
      }

      const result = await response.json();
      console.log('[العدالة] ✅ Sync:', result);

      if (result.success && result.totalSynced > 0) {
        window.dispatchEvent(new CustomEvent('najiz_sync_complete', {
          detail: {
            cases: result.savedCounts ? result.savedCounts.cases : 0,
            hearings: result.savedCounts ? result.savedCounts.hearings : 0,
            poa: result.savedCounts ? result.savedCounts.poa : 0,
            executions: result.savedCounts ? result.savedCounts.executions : 0,
            total: result.totalSynced
          }
        }));
      }

      return result;

    } catch (err) {
      console.error('[العدالة] Sync Error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // =============================================
  // Listener للأوامر
  // =============================================
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

    if (['extractData','scrape','getData','sync'].includes(req.action)) {
      (async () => {
        try {
          const pageType = getPageType();

          if (pageType === 'unknown') {
            sendResponse({
              success: false,
              message: 'هذه الصفحة غير مدعومة. اذهب لإحدى الصفحات المحددة في ناجز'
            });
            return;
          }

          const data = await extractFromCurrentPage();

          if (!data.summary.hasData) {
            // إعادة المحاولة بعد 5 ثوانٍ
            await new Promise(r => setTimeout(r, 5000));
            const retryData = await extractFromCurrentPage();

            if (!retryData.summary.hasData) {
              sendResponse({
                success: false,
                data: retryData,
                message: 'لم تُوجد بيانات مرئية. تأكد أن الصفحة محملة بالكامل ثم أعد المحاولة'
              });
              return;
            }

            const syncResult = await syncToServer(retryData);
            sendResponse({ success: true, data: retryData, syncResult });
            return;
          }

          const syncResult = await syncToServer(data);
          sendResponse({
            success: true,
            data,
            syncResult,
            message: \`تم سحب \${data.summary.totalFound} سجل من الشاشة\`
          });

        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }

    if (req.action === 'ping') {
      sendResponse({
        success: true,
        url: window.location.href,
        pageType: getPageType(),
        isNajiz: window.location.href.includes('najiz.sa'),
        title: document.title
      });
      return true;
    }

    if (req.action === 'getPageInfo') {
      const pt = getPageType();
      const body = document.body?.innerText || '';
      sendResponse({
        pageType: pt,
        isSupported: pt !== 'unknown',
        hasNumbers: /\\d{4}\\/\\d+|\\d{9,}/.test(body),
        tableCount: document.querySelectorAll('table').length,
        visibleRows: document.querySelectorAll('table tr:not(:first-child)').length,
        cardCount: document.querySelectorAll('[class*="card" i], [class*="item" i]').length,
        bodyLength: body.length,
        title: document.title
      });
      return true;
    }
  });

  // =============================================
  // المربع العائم على الشاشة
  // =============================================
  function createWidget() {
    if (document.getElementById('adala-v7')) return;
    if (!window.location.href.includes('najiz.sa')) return;

    const pageType = getPageType();
    const pageInfo = {
      cases: { label: 'القضايا', section: 'إدارة القضايا', color: '#f59e0b' },
      hearings: { label: 'الجلسات', section: 'مواعيد الجلسات', color: '#3b82f6' },
      poa: { label: 'الوكالات', section: 'قسم الوكالات', color: '#8b5cf6' },
      executions: { label: 'التنفيذ', section: 'طلبات التنفيذ', color: '#10b981' },
      unknown: { label: 'غير محدد', section: '—', color: '#64748b' }
    }[pageType] || { label: 'غير محدد', section: '—', color: '#64748b' };

    const widget = document.createElement('div');
    widget.id = 'adala-v7';
    widget.style.cssText = \`
      position: fixed; bottom: 20px; left: 20px; z-index: 2147483647;
      font-family: Arial, sans-serif; direction: rtl;
    \`;

    widget.innerHTML = \`
      <style>
        #adala-v7-fab {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: 2px solid rgba(255,255,255,0.3);
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 22px;
          box-shadow: 0 4px 20px rgba(245,158,11,0.5);
          transition: all 0.3s; user-select: none;
        }
        #adala-v7-fab:hover { transform: scale(1.08); }
        #adala-v7-panel {
          display: none; position: absolute; bottom: 68px; left: 0;
          width: 290px; background: #050e21;
          border: 1px solid #1e3a5f; border-radius: 16px;
          overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.7);
        }
        #adala-v7-panel.open { display: block; }
        .av7-header {
          background: #0a1628; padding: 12px 14px;
          border-bottom: 1px solid #1e3a5f;
        }
        .av7-title { color: #f59e0b; font-weight: bold; font-size: 14px; }
        .av7-sub { color: #475569; font-size: 10px; margin-top: 2px; }
        .av7-page {
          padding: 10px 14px; border-bottom: 1px solid #1e3a5f;
          background: #0f172a;
        }
        .av7-page-label { color: #64748b; font-size: 10px; margin-bottom: 4px; }
        .av7-page-type {
          font-size: 12px; font-weight: bold; color: \${pageInfo.color};
        }
        .av7-page-section { color: #94a3b8; font-size: 10px; margin-top: 2px; }
        .av7-status {
          padding: 8px 14px; font-size: 11px; color: #94a3b8;
          text-align: center; border-bottom: 1px solid #1e3a5f;
          min-height: 32px; display: flex; align-items: center;
          justify-content: center;
        }
        .av7-btn {
          display: block; width: calc(100% - 24px); margin: 10px 12px;
          padding: 11px; background: #f59e0b; color: #000;
          border: none; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: bold; transition: opacity 0.2s;
        }
        .av7-btn:hover:not(:disabled) { opacity: 0.9; }
        .av7-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .av7-progress {
          display: none; padding: 4px 14px; text-align: center;
          font-size: 10px; color: #f59e0b;
          animation: pulse 1.5s infinite;
        }
        .av7-progress.show { display: block; }
        .av7-links { padding: 6px 12px 10px; }
        .av7-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 5px 8px; border-radius: 7px; font-size: 10px;
          color: #64748b; text-decoration: none; margin-bottom: 2px;
          border: 1px solid transparent; transition: all 0.2s;
        }
        .av7-link:hover { background: #0a1628; color: #94a3b8; }
        .av7-link.active {
          background: #1e3a5f; color: #f59e0b;
          border-color: #f59e0b44;
        }
        .av7-result {
          margin: 0 12px 10px; padding: 8px 10px;
          background: #0a1628; border-radius: 8px;
          border: 1px solid #1e3a5f; font-size: 11px;
          color: #94a3b8; line-height: 1.7; display: none;
        }
        .av7-result.show { display: block; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      </style>

      <div id="adala-v7-panel">
        <div class="av7-header">
          <div class="av7-title">⚖️ منصة العدالة</div>
          <div class="av7-sub">سحب البيانات المرئية v7.0</div>
        </div>

        <div class="av7-page">
          <div class="av7-page-label">📍 الصفحة الحالية:</div>
          <div class="av7-page-type">
            \${pageType === 'unknown' ? '⚠️ صفحة غير مدعومة' : '✅ ' + pageInfo.label}
          </div>
          \${pageType !== 'unknown'
            ? \`<div class="av7-page-section">→ ستُضاف في: \${pageInfo.section}</div>\`
            : '<div class="av7-page-section">اذهب لإحدى الصفحات أدناه</div>'
          }
        </div>

        <div class="av7-status" id="av7-status">
          \${pageType === 'unknown'
            ? 'اختر صفحة من القائمة أدناه'
            : 'جاهز — اضغط سحب البيانات'}
        </div>

        <button class="av7-btn" id="av7-sync"
          \${pageType === 'unknown' ? 'disabled' : ''}>
          📥 سحب البيانات من الشاشة
        </button>

        <div class="av7-progress" id="av7-progress">
          🔄 جارٍ قراءة البيانات المرئية...
        </div>

        <div class="av7-result" id="av7-result"></div>

        <div class="av7-links">
          \${[
            { label: '📁 قضاياي', path: '/applications/lawsuit', type: 'cases' },
            { label: '📅 جلساتي', path: '/applications/appointment-requests/', type: 'hearings' },
            { label: '📜 وكالاتي', path: '/applications/wekalat/procurations-query', type: 'poa' },
            { label: '⚡ تنفيذي', path: '/applications/iexecution', type: 'executions' }
          ].map(p => \`
            <a href="https://najiz.sa\${p.path}" target="_blank"
              class="av7-link \${window.location.pathname.includes(p.path.replace(/\\/$/, '')) ? 'active' : ''}">
              <span>\${p.label}</span>
              <span style="color:#1e3a5f">←</span>
            </a>
          \`).join('')}
        </div>
      </div>

      <div id="adala-v7-fab">⚖️</div>
    \`;

    document.body.appendChild(widget);

    const fab = document.getElementById('adala-v7-fab');
    const panel = document.getElementById('adala-v7-panel');
    const statusEl = document.getElementById('av7-status');
    const progressEl = document.getElementById('av7-progress');
    const resultEl = document.getElementById('av7-result');
    const syncBtn = document.getElementById('av7-sync');

    let isOpen = false;

    const setStatus = (msg, color = '#94a3b8') => {
      statusEl.textContent = msg;
      statusEl.style.color = color;
    };

    fab.onclick = () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      fab.textContent = isOpen ? '✕' : '⚖️';
    };

    document.addEventListener('click', e => {
      if (isOpen && !widget.contains(e.target)) {
        isOpen = false;
        panel.classList.remove('open');
        fab.textContent = '⚖️';
      }
    });

    syncBtn.onclick = async () => {
      syncBtn.disabled = true;
      progressEl.className = 'av7-progress show';
      progressEl.textContent = '⏳ انتظر تحميل البيانات...';
      resultEl.className = 'av7-result';
      setStatus('⏳ جارٍ القراءة...', '#f59e0b');

      try {
        progressEl.textContent = '🔍 يقرأ البيانات المرئية على الشاشة...';
        const data = await extractFromCurrentPage();

        if (!data.summary.hasData) {
          // انتظر وأعد
          progressEl.textContent = '⏳ انتظر 5 ثوانٍ وإعادة المحاولة...';
          await new Promise(r => setTimeout(r, 5000));
          const retry = await extractFromCurrentPage();

          if (!retry.summary.hasData) {
            progressEl.className = 'av7-progress';
            setStatus('⚠️ لم تُوجد بيانات', '#f59e0b');
            resultEl.innerHTML = \`
              <div style="color:#f59e0b;font-weight:bold;margin-bottom:6px">
                ⚠️ لم تُوجد بيانات مرئية
              </div>
              <div style="color:#64748b;font-size:10px">
                تأكد أن البيانات تظهر على الشاشة كاملاً ثم اضغط سحب مرة أخرى
              </div>
            \`;
            resultEl.className = 'av7-result show';
            syncBtn.disabled = false;
            return;
          }

          Object.assign(data, retry);
        }

        progressEl.textContent = '📡 جارٍ المزامنة مع النظام...';
        const syncResult = await syncToServer(data);
        const synced = syncResult?.totalSynced || 0;
        const total = data.summary.totalFound;

        progressEl.className = 'av7-progress';

        setStatus(
          synced > 0
            ? \`✅ تمت المزامنة: \${synced} سجل جديد\`
            : \`✅ \${total} سجل (موجود مسبقاً)\`,
          synced > 0 ? '#22c55e' : '#f59e0b'
        );

        fab.textContent = '✅';
        fab.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        setTimeout(() => {
          fab.textContent = '⚖️';
          fab.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        }, 5000);

        resultEl.innerHTML = \`
          <div style="color:#22c55e;font-weight:bold;margin-bottom:8px">
            ✅ تمت المزامنة
          </div>
          \${data.summary.totalCases > 0
            ? \`<div style="color:#fff;margin:2px 0">📁 القضايا: <strong>\${data.summary.totalCases}</strong> → إدارة القضايا</div>\` : ''}
          \${data.summary.totalHearings > 0
            ? \`<div style="color:#fff;margin:2px 0">📅 الجلسات: <strong>\${data.summary.totalHearings}</strong> → مواعيد الجلسات</div>\` : ''}
          \${data.summary.totalPOAs > 0
            ? \`<div style="color:#fff;margin:2px 0">📜 الوكالات: <strong>\${data.summary.totalPOAs}</strong> → قسم الوكالات</div>\` : ''}
          \${data.summary.totalExecutions > 0
            ? \`<div style="color:#fff;margin:2px 0">⚡ التنفيذ: <strong>\${data.summary.totalExecutions}</strong> → طلبات التنفيذ</div>\` : ''}
          \${synced > 0
            ? \`<div style="color:#22c55e;margin-top:6px;font-weight:bold">✅ \${synced} سجل جديد أُضيف للنظام</div>\`
            : \`<div style="color:#f59e0b;margin-top:6px">البيانات كانت موجودة مسبقاً</div>\`}
        \`;
        resultEl.className = 'av7-result show';

      } catch (err) {
        progressEl.className = 'av7-progress';
        setStatus('❌ ' + err.message, '#ef4444');
      } finally {
        syncBtn.disabled = false;
      }
    };
  }

  // التهيئة
  if (document.readyState === 'complete') {
    setTimeout(createWidget, 2000);
  } else {
    window.addEventListener('load', () => setTimeout(createWidget, 2000));
  }

  // مراقبة SPA
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      document.getElementById('adala-v7')?.remove();
      setTimeout(createWidget, 2500);
    }
  }).observe(document.body, { childList: true, subtree: true });

  console.log('[العدالة v7.0] Screen Reader Active ✅ | Page:', getPageType());

})();
