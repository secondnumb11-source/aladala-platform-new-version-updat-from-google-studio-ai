// popup.js — بدون API Key — يرسل البيانات للخادم فقط
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const resultsEl = document.getElementById('results');

  const setStatus = (msg, type = 'info') => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color =
      type === 'error' ? '#ef4444' :
      type === 'success' ? '#22c55e' :
      type === 'warning' ? '#f59e0b' : '#94a3b8';
  };

  // فحص الصفحة الحالية
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isNajiz = tab?.url?.includes('najiz.sa');

  if (!isNajiz) {
    setStatus('❌ يرجى فتح موقع ناجز أولاً', 'error');
    if (extractBtn) extractBtn.disabled = true;
    return;
  }

  setStatus('✅ أنت على موقع ناجز — جاهز للسحب', 'success');

  // زر السحب
  extractBtn?.addEventListener('click', async () => {
    setStatus('⏳ جارٍ قراءة بياناتك من الصفحة...', 'info');
    if (extractBtn) extractBtn.disabled = true;

    try {
      // إرسال أمر السحب لـ content.js
      const response = await chrome.tabs.sendMessage(
        tab.id,
        { action: 'extractData' }
      );

      if (response?.success && response.data) {
        const d = response.data;
        const summary = d.summary;

        setStatus(
          `✅ تم: ${summary.totalCases} قضية | ${summary.totalHearings} جلسة | ${summary.totalPOAs} وكالة`,
          'success'
        );

        // إرسال البيانات للخادم
        // لا يوجد API Key — البيانات تأتي من جلسة المستخدم مباشرة
        const serverUrl = await getServerUrl();
        if (serverUrl) {
          await fetch(`${serverUrl}/api/najiz-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scrapedData: d,
              source: 'chrome_extension_user_session',
              noApiKeyNeeded: true
            })
          });
        }

        // عرض ملخص النتائج
        if (resultsEl) {
          resultsEl.innerHTML = `
            <div style="direction:rtl; font-family:Arial; font-size:12px; padding:8px;">
              <p>📁 القضايا: <strong>${summary.totalCases}</strong></p>
              <p>📅 الجلسات: <strong>${summary.totalHearings}</strong></p>
              <p>📜 الوكالات: <strong>${summary.totalPOAs}</strong></p>
              <p>⚡ التنفيذ: <strong>${summary.totalExecutions}</strong></p>
              <p style="color:#22c55e; margin-top:8px;">✅ تمت المزامنة مع النظام</p>
            </div>
          `;
        }

      } else {
        setStatus(
          response?.message || '⚠️ انتقل إلى صفحة "قضاياي" ثم اضغط السحب',
          'warning'
        );
      }
    } catch (err) {
      if (err.message?.includes('Could not establish connection')) {
        setStatus('⚠️ أعد تحميل صفحة ناجز ثم حاول مرة أخرى', 'warning');
      } else {
        setStatus('❌ خطأ: ' + err.message, 'error');
      }
    } finally {
      if (extractBtn) extractBtn.disabled = false;
    }
  });
});

// رابط الخادم من الإعدادات
async function getServerUrl() {
  return new Promise(resolve => {
    chrome.storage.local.get('serverUrl', data => {
      resolve(data.serverUrl || window.location.origin || 'https://your-app.vercel.app');
    });
  });
}
