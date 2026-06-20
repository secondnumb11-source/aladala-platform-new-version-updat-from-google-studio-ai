document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const resultsEl = document.getElementById('results');
  const progressEl = document.getElementById('progress');
  const pageBtnsEl = document.getElementById('pageButtons');

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  const PAGES = [
    { label: '📁 القضايا', url: 'https://najiz.sa/applications/lawsuit', type: 'cases', section: 'إدارة القضايا' },
    { label: '📅 الجلسات', url: 'https://najiz.sa/applications/appointment-requests/', type: 'hearings', section: 'مواعيد الجلسات' },
    { label: '📜 الوكالات', url: 'https://najiz.sa/applications/wekalat/procurations-query', type: 'poa', section: 'الوكالات' },
    { label: '⚡ التنفيذ', url: 'https://najiz.sa/applications/iexecution', type: 'executions', section: 'طلبات التنفيذ' }
  ];

  const setStatus = (msg, type = 'info') => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = {
      error: '#ef4444', success: '#22c55e',
      warning: '#f59e0b', info: '#94a3b8'
    }[type] || '#94a3b8';
  };

  const setProgress = (show, msg = '') => {
    if (progressEl) {
      progressEl.style.display = show ? 'block' : 'none';
      if (msg) progressEl.textContent = msg;
    }
  };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isNajiz = tab?.url?.includes('najiz.sa');

  if (!isNajiz) {
    setStatus('❌ افتح موقع ناجز أولاً', 'error');
    if (extractBtn) extractBtn.disabled = true;

    if (pageBtnsEl) {
      pageBtnsEl.innerHTML = PAGES.map(p => `
        <a href="${p.url}" target="_blank" style="display:block;
          background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;
          padding:8px 12px;color:#94a3b8;text-decoration:none;
          font-size:11px;margin-bottom:4px;direction:rtl">
          ${p.label} → ${p.section}
        </a>
      `).join('');
    }
    return;
  }

  setStatus('✅ على ناجز — اضغط سحب البيانات', 'success');

  // عرض أزرار الصفحات
  if (pageBtnsEl) {
    pageBtnsEl.innerHTML = PAGES.map(p => {
      const isActive = tab.url?.includes(
        p.url.replace('https://najiz.sa', '')
      );
      return `
        <a href="${p.url}" target="_blank" style="display:block;
          background:${isActive ? '#1e3a5f' : '#0a1628'};
          border:1px solid ${isActive ? '#f59e0b' : '#1e3a5f'};
          border-radius:8px;padding:6px 10px;color:${isActive ? '#f59e0b' : '#94a3b8'};
          text-decoration:none;font-size:11px;margin-bottom:4px;direction:rtl">
          ${isActive ? '● ' : ''}${p.label} → ${p.section}
        </a>
      `;
    }).join('');
  }

  extractBtn?.addEventListener('click', async () => {
    setStatus('⏳ جارٍ انتظار تحميل الصفحة...', 'info');
    setProgress(true, '⌛ انتظر...');
    extractBtn.disabled = true;

    try {
      // حقن content.js
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await new Promise(r => setTimeout(r, 1500));
      } catch(e) {}

      // محاولات متعددة
      let response = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        setProgress(true, `🔄 محاولة ${attempt}/3...`);
        try {
          response = await Promise.race([
            chrome.tabs.sendMessage(tab.id, { action: 'extractData' }),
            new Promise((_, rej) =>
              setTimeout(() => rej(new Error('timeout')), 25000)
            )
          ]);

          if (response?.success && response?.data?.summary?.hasData) {
            break;
          }

          if (attempt < 3) {
            setProgress(true, `⏳ لم تُوجد بيانات — إعادة المحاولة بعد 3 ثوانٍ...`);
            await new Promise(r => setTimeout(r, 3000));
          }
        } catch(err) {
          if (attempt === 3) throw err;
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      setProgress(false);

      if (response?.success && response?.data?.summary?.hasData) {
        const d = response.data;
        const s = d.summary;

        setStatus(
          `✅ تم سحب ${s.totalFound} سجل حقيقي`,
          'success'
        );

        if (resultsEl) {
          resultsEl.innerHTML = `
            <div style="background:#0a1628;border-radius:8px;padding:10px;
              margin-top:8px;direction:rtl;font-size:12px;
              border:1px solid #1e3a5f">
              <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px">
                📊 نتائج السحب الحقيقي
              </p>
              ${s.totalCases > 0 ? `<p style="color:#fff;margin:3px 0">📁 القضايا: <strong>${s.totalCases}</strong></p>` : ''}
              ${s.totalHearings > 0 ? `<p style="color:#fff;margin:3px 0">📅 الجلسات: <strong>${s.totalHearings}</strong></p>` : ''}
              ${s.totalPOAs > 0 ? `<p style="color:#fff;margin:3px 0">📜 الوكالات: <strong>${s.totalPOAs}</strong></p>` : ''}
              ${s.totalExecutions > 0 ? `<p style="color:#fff;margin:3px 0">⚡ التنفيذ: <strong>${s.totalExecutions}</strong></p>` : ''}
              ${response.syncResult?.totalSynced > 0
                ? `<p style="color:#22c55e;margin:8px 0 0;font-weight:bold">✅ تمت المزامنة: ${response.syncResult.totalSynced} سجل جديد</p>`
                : `<p style="color:#f59e0b;margin:8px 0 0">⚠️ البيانات موجودة مسبقاً في النظام</p>`
              }
            </div>
          `;
        }

      } else {
        const msg = response?.message || 'انتقل للصفحة الصحيحة وانتظر التحميل';
        setStatus(`⚠️ ${msg}`, 'warning');

        if (resultsEl) {
          resultsEl.innerHTML = `
            <div style="background:#0a1628;border-radius:8px;padding:10px;
              margin-top:8px;direction:rtl;font-size:11px;
              border:1px solid #f59e0b33">
              <p style="color:#f59e0b;margin:0 0 8px">⚠️ لم تُوجد بيانات</p>
              <p style="color:#94a3b8;margin:0">
                انتظر تحميل الصفحة كاملاً ثم اضغط سحب مرة أخرى
              </p>
            </div>
          `;
        }
      }

    } catch(err) {
      setProgress(false);
      const msg = err.message === 'timeout'
        ? 'انتهت المهلة — الصفحة بطيئة، أعد المحاولة'
        : err.message;
      setStatus(`❌ ${msg}`, 'error');
    } finally {
      extractBtn.disabled = false;
    }
  });
});
