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
    if (!currentPage) {
      setStatus('⚠️ اذهب لإحدى صفحات ناجز أولاً', 'warning');
      return;
    }

    setStatus(`⏳ جارٍ سحب ${currentPage.section}...`, 'info');
    setProgress(true, '🔄 ينتظر تحميل البيانات...');
    extractBtn.disabled = true;

    try {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await new Promise(r => setTimeout(r, 1500));
      } catch(e) {}

      setProgress(true, `⏳ يقرأ ${currentPage.section}...`);

      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { action: 'extractData' }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 25000)
        )
      ]);

      setProgress(false);

      if (response?.success && response.data) {
        const d = response.data;
        const s = d.summary;

        const counts = {
          cases: s.totalCases,
          poa: s.totalPOAs,
          executions: s.totalExecutions,
          hearings: s.totalHearings
        };

        const total = counts[s.pageType] || 0;

        setStatus(
          `✅ تم سحب ${total} سجل من ${currentPage.section}`,
          'success'
        );

        if (resultsEl) {
          resultsEl.innerHTML = `
            <div style="direction:rtl;font-size:12px;padding:10px;
              background:#0a1628;border-radius:8px;margin-top:8px;">
              <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px">
                📊 نتائج سحب ${currentPage.section}
              </p>
              ${s.totalCases > 0 ?
                `<p style="color:#fff;margin:3px 0">
                  📁 القضايا: <strong>${s.totalCases}</strong>
                  <span style="color:#22c55e;font-size:10px">
                    ← إدارة القضايا
                  </span>
                </p>` : ''}
              ${s.totalHearings > 0 ?
                `<p style="color:#fff;margin:3px 0">
                  📅 الجلسات: <strong>${s.totalHearings}</strong>
                  <span style="color:#22c55e;font-size:10px">
                    ← مواعيد الجلسات
                  </span>
                </p>` : ''}
              ${s.totalPOAs > 0 ?
                `<p style="color:#fff;margin:3px 0">
                  📜 الوكالات: <strong>${s.totalPOAs}</strong>
                  <span style="color:#22c55e;font-size:10px">
                    ← قسم الوكالات
                  </span>
                </p>` : ''}
              ${s.totalExecutions > 0 ?
                `<p style="color:#fff;margin:3px 0">
                  ⚡ التنفيذ: <strong>${s.totalExecutions}</strong>
                  <span style="color:#22c55e;font-size:10px">
                    ← طلبات التنفيذ
                  </span>
                </p>` : ''}
              <p style="color:#22c55e;margin:8px 0 0;font-weight:bold">
                ✅ تمت المزامنة مع النظام
              </p>
            </div>
          `;
        }

      } else {
        setStatus(
          response?.message ||
          `⚠️ لم تُوجد بيانات — انتظر تحميل ${currentPage.section} كاملاً`,
          'warning'
        );
      }
    } catch(err) {
      setProgress(false);
      setStatus(
        err.message === 'timeout'
          ? '⚠️ انتهت المهلة — انتظر تحميل الصفحة وأعد المحاولة'
          : '❌ خطأ: ' + err.message,
        'error'
      );
    } finally {
      extractBtn.disabled = false;
    }
  });
});
