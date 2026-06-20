document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const resultsEl = document.getElementById('results');
  const progressEl = document.getElementById('progress');
  const pageGuideEl = document.getElementById('pageGuide');
  const pageBtnsEl = document.getElementById('pageButtons');

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  const PAGES = [
    {
      label: '📁 القضايا',
      url: 'https://najiz.sa/applications/lawsuit',
      type: 'cases',
      section: 'إدارة القضايا'
    },
    {
      label: '📜 الوكالات',
      url: 'https://najiz.sa/applications/wekalat/procurations-query',
      type: 'poa',
      section: 'الوكالات'
    },
    {
      label: '⚡ التنفيذ',
      url: 'https://najiz.sa/applications/iexecution',
      type: 'executions',
      section: 'طلبات التنفيذ'
    },
    {
      label: '📅 الجلسات',
      url: 'https://najiz.sa/applications/appointment-requests/',
      type: 'hearings',
      section: 'مواعيد الجلسات'
    }
  ];

  const setStatus = (msg, type = 'info') => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color =
      type === 'error' ? '#ef4444' :
      type === 'success' ? '#22c55e' :
      type === 'warning' ? '#f59e0b' : '#94a3b8';
  };

  const setProgress = (show, msg = '') => {
    if (progressEl) {
      progressEl.style.display = show ? 'block' : 'none';
      if (msg) progressEl.textContent = msg;
    }
  };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || '';
  const isNajiz = currentUrl.includes('najiz.sa');

  // تحديد نوع الصفحة الحالية
  let currentPage = null;
  if (isNajiz) {
    currentPage = PAGES.find(p => currentUrl.includes(
      p.url.replace('https://najiz.sa', '')
    ));
  }

  if (!isNajiz) {
    setStatus('❌ افتح موقع ناجز أولاً', 'error');
    if (extractBtn) extractBtn.disabled = true;

    // أضف أزرار الانتقال السريع
    if (pageBtnsEl) {
      pageBtnsEl.innerHTML = `
        <p style="color:#f59e0b;font-size:11px;margin:0 0 6px;font-weight:bold">
          🔗 انتقل مباشرة إلى:
        </p>
        ${PAGES.map(p => `
          <a href="${p.url}" target="_blank"
            style="display:block;background:#0a1628;border:1px solid #1e3a5f;
            border-radius:8px;padding:6px 10px;color:#94a3b8;
            text-decoration:none;font-size:11px;margin-bottom:4px;
            cursor:pointer;">
            ${p.label} ← ${p.section}
          </a>
        `).join('')}
      `;
    }
    return;
  }

  // عرض الصفحة الحالية
  if (currentPage) {
    setStatus(
      `✅ صفحة ${currentPage.section} — جاهز للسحب`,
      'success'
    );
    if (pageGuideEl) {
      pageGuideEl.innerHTML = `
        <span style="color:#22c55e">●</span>
        سيتم إضافة البيانات إلى قسم
        <strong style="color:#f59e0b">${currentPage.section}</strong>
      `;
    }
  } else {
    setStatus('⚠️ اذهب لإحدى الصفحات أدناه للسحب', 'warning');
  }

  // أزرار الانتقال السريع
  if (pageBtnsEl) {
    pageBtnsEl.innerHTML = PAGES.map(p => {
      const isActive = currentUrl.includes(
        p.url.replace('https://najiz.sa', '')
      );
      return `
        <a href="${p.url}" target="_blank"
          style="display:block;background:${isActive ? '#1e3a5f' : '#0a1628'};
          border:1px solid ${isActive ? '#f59e0b' : '#1e3a5f'};
          border-radius:8px;padding:6px 10px;color:#fff;
          text-decoration:none;font-size:11px;margin-bottom:4px;">
          ${isActive ? '● ' : ''}${p.label}
          <span style="color:#475569;float:left;font-size:10px">
            → ${p.section}
          </span>
        </a>
      `;
    }).join('');
  }

  // زر السحب
  extractBtn?.addEventListener('click', async () => {
    setStatus('⏳ جارٍ الانتظار لتحميل الصفحة...', 'info');
    setProgress(true, '⌛ انتظر...');
    extractBtn.disabled = true;
  
    try {
      // حقن content.js أولاً
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch(e) {
        console.log('Content script already injected');
      }
  
      // انتظار 3 ثوانٍ لتحميل البيانات الديناميكية
      setProgress(true, '⏳ انتظر تحميل البيانات (3 ثوانٍ)...');
      await new Promise(r => setTimeout(r, 3000));
  
      // طلب السحب مع retry
      let response = null;
      let attempts = 0;
  
      while (attempts < 3) {
        attempts++;
        setProgress(true, `🔄 محاولة ${attempts}/3...`);
  
        try {
          response = await Promise.race([
            chrome.tabs.sendMessage(
              tab.id, { action: 'extractData' }
            ),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('timeout')), 15000
              )
            )
          ]);
  
          // إذا وجدنا بيانات توقف
          if (response?.success && response?.data?.summary?.hasData) {
            break;
          }
  
          // انتظر ثانيتين وأعد المحاولة
          if (attempts < 3) {
            setProgress(true, `⏳ لم تُوجد بيانات — إعادة المحاولة...`);
            await new Promise(r => setTimeout(r, 2000));
          }
  
        } catch(err) {
          if (attempts === 3) throw err;
          await new Promise(r => setTimeout(r, 2000));
        }
      }
  
      setProgress(false);
  
      if (response?.data) {
        const d = response.data;
        const s = d.summary;
        const total = (s.totalCases || 0) +
          (s.totalHearings || 0) +
          (s.totalPOAs || 0) +
          (s.totalExecutions || 0);
  
        if (total > 0) {
          setStatus(`✅ تم سحب ${total} سجل`, 'success');
  
          // عرض النتائج
          if (resultsEl) {
            resultsEl.innerHTML = buildResultHTML(d);
          }
  
          // إرسال للخادم
          const serverUrl = await getServerUrl();
          setProgress(true, '📡 جارٍ المزامنة مع النظام...');
  
          try {
            const syncRes = await fetch(
              `${serverUrl}/api/najiz-sync`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  scrapedData: d,
                  pageType: d.pageType || 'unknown',
                  source: 'chrome_extension',
                  timestamp: new Date().toISOString()
                })
              }
            );
  
            if (syncRes.ok) {
              const syncResult = await syncRes.json();
              setProgress(false);
              setStatus(
                `✅ تمت المزامنة — ${syncResult.results ? JSON.stringify(syncResult.results) : 'نجح'}`,
                'success'
              );
            } else {
              setProgress(false);
              setStatus('⚠️ السحب نجح لكن المزامنة فشلت', 'warning');
            }
          } catch(syncErr) {
            setProgress(false);
            setStatus('⚠️ السحب نجح — تعذر الاتصال بالخادم', 'warning');
          }
  
        } else {
          setProgress(false);
          setStatus(
            '⚠️ لم تُوجد بيانات — تأكد أن الصفحة محملة بالكامل',
            'warning'
          );
  
          if (resultsEl) {
            resultsEl.innerHTML = buildNoDataHTML(d.pageType, tab.url);
          }
        }
      }
  
    } catch(err) {
      setProgress(false);
      if (err.message === 'timeout') {
        setStatus('⚠️ انتهت المهلة — الصفحة تحمّل ببطء، أعد المحاولة', 'warning');
      } else {
        setStatus('❌ ' + err.message, 'error');
      }
    } finally {
      extractBtn.disabled = false;
    }
  });

  function buildResultHTML(d) {
    const s = d.summary;
    const sections = [
      s.totalCases > 0 && `<p>📁 القضايا: <strong>${s.totalCases}</strong> → إدارة القضايا</p>`,
      s.totalHearings > 0 && `<p>📅 الجلسات: <strong>${s.totalHearings}</strong> → مواعيد الجلسات</p>`,
      s.totalPOAs > 0 && `<p>📜 الوكالات: <strong>${s.totalPOAs}</strong> → قسم الوكالات</p>`,
      s.totalExecutions > 0 && `<p>⚡ التنفيذ: <strong>${s.totalExecutions}</strong> → طلبات التنفيذ</p>`,
    ].filter(Boolean).join('');
  
    return `
      <div style="background:#0a1628;border-radius:8px;
        padding:10px;margin-top:8px;direction:rtl;font-size:12px">
        <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px">
          📊 نتائج السحب
        </p>
        <div style="color:#fff;line-height:1.8">${sections}</div>
        <p style="color:#22c55e;margin:8px 0 0;font-weight:bold">
          ✅ جارٍ المزامنة مع الأقسام...
        </p>
      </div>`;
  }
  
  function buildNoDataHTML(pageType, url) {
    const guides = {
      cases: 'https://najiz.sa/applications/lawsuit',
      hearings: 'https://najiz.sa/applications/appointment-requests/',
      poa: 'https://najiz.sa/applications/wekalat/procurations-query',
      executions: 'https://najiz.sa/applications/iexecution',
      unknown: 'https://najiz.sa'
    };
  
    const targetUrl = guides[pageType] || guides.unknown;
  
    return `
      <div style="background:#0a1628;border-radius:8px;
        padding:10px;margin-top:8px;direction:rtl;font-size:11px">
        <p style="color:#f59e0b;margin:0 0 6px">⚠️ لم تُوجد بيانات</p>
        <p style="color:#94a3b8;margin:0 0 8px">
          الصفحة الحالية: ${url?.substring(0,50)}...
        </p>
        <p style="color:#94a3b8;margin:0 0 8px">
          تأكد أن الصفحة محملة بالكامل ثم أعد المحاولة
        </p>
        <a href="${targetUrl}" target="_blank"
          style="display:block;background:#1e3a5f;color:#f59e0b;
          padding:6px;border-radius:6px;text-align:center;
          text-decoration:none;font-weight:bold;">
          🔗 اذهب للصفحة الصحيحة
        </a>
      </div>`;
  }
});
