document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const resultsEl = document.getElementById('results');
  const progressEl = document.getElementById('progress');

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

  const [tab] = await chrome.tabs.query({
    active: true, currentWindow: true
  });

  const isNajiz = tab?.url?.includes('najiz.sa');

  if (!isNajiz) {
    setStatus('❌ افتح موقع ناجز أولاً', 'error');
    if (extractBtn) extractBtn.disabled = true;
    return;
  }

  setStatus('✅ أنت على ناجز — اذهب لصفحة قضاياي ثم اضغط سحب', 'success');

  extractBtn?.addEventListener('click', async () => {
    setStatus('⏳ جارٍ الانتظار لتحميل البيانات...', 'info');
    setProgress(true, '🔄 يقرأ الصفحة...');
    extractBtn.disabled = true;

    try {
      // inject script إذا لم يكن موجوداً
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {}

      setProgress(true, '⏳ ينتظر تحميل البيانات...');

      const response = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { action: 'extractData' }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 20000)
        )
      ]);

      setProgress(false);

      if (response?.success && response.data) {
        const d = response.data;
        const s = d.summary;

        setStatus(
          `✅ تم: ${s.totalCases} قضية | ${s.totalHearings} جلسة | ${s.totalPOAs} وكالة`,
          'success'
        );

        if (resultsEl) {
          resultsEl.innerHTML = `
            <div style="direction:rtl;font-family:Arial;font-size:12px;
              padding:10px;background:#0a1628;border-radius:8px;margin-top:8px;">
              <p style="color:#f59e0b;font-weight:bold;margin:0 0 8px">📊 نتائج السحب</p>
              <p style="color:#fff;margin:3px 0">📁 القضايا: <strong>${s.totalCases}</strong></p>
              <p style="color:#fff;margin:3px 0">📅 الجلسات: <strong>${s.totalHearings}</strong></p>
              <p style="color:#fff;margin:3px 0">📜 الوكالات: <strong>${s.totalPOAs}</strong></p>
              <p style="color:#fff;margin:3px 0">⚡ التنفيذ: <strong>${s.totalExecutions}</strong></p>
              ${s.hasUser ? '<p style="color:#22c55e;margin:3px 0">👤 تم التعرف على المستخدم</p>' : ''}
              <p style="color:#22c55e;margin:8px 0 0;font-weight:bold">✅ جارٍ المزامنة مع النظام...</p>
            </div>
          `;
        }

        // إرسال للخادم
        const serverUrl = await getServerUrl();
        try {
          const syncRes = await fetch(`${serverUrl}/api/najiz-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scrapedData: d,
              source: 'chrome_extension',
              timestamp: new Date().toISOString()
            })
          });

          if (syncRes.ok) {
            setStatus('✅ تمت المزامنة مع النظام بنجاح', 'success');
          }
        } catch (syncErr) {
          console.warn('Sync failed:', syncErr.message);
        }

      } else {
        setStatus(
          response?.message || '⚠️ اذهب لصفحة "قضاياي" على ناجز أولاً',
          'warning'
        );
      }

    } catch (err) {
      setProgress(false);
      if (err.message === 'timeout') {
        setStatus('⚠️ انتهت المهلة — انتظر تحميل الصفحة وأعد المحاولة', 'warning');
      } else if (err.message?.includes('connection')) {
        setStatus('⚠️ أعد تحميل صفحة ناجز ثم حاول', 'warning');
      } else {
        setStatus('❌ خطأ: ' + err.message, 'error');
      }
    } finally {
      extractBtn.disabled = false;
    }
  });
});

async function getServerUrl() {
  return new Promise(resolve => {
    chrome.storage.local.get('serverUrl', data => {
      resolve(data.serverUrl || 'https://aladala-platform-rnuz.onrender.com');
    });
  });
}
