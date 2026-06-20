document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const extractBtn = document.getElementById('extractBtn');
  const resultsEl = document.getElementById('results');
  const progressEl = document.getElementById('progress');
  const pageButtons = document.getElementById('pageButtons');
  const pageGuide = document.getElementById('pageGuide');

  const SERVER = 'https://aladala-platform-rnuz.onrender.com';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';

  if (!url.includes('najiz.sa')) {
    statusEl.textContent = '❌ يرجى فتح موقع ناجز';
    extractBtn.disabled = true;
    return;
  }

  statusEl.textContent = '✅ أنت على ناجز — جاهز للمزامنة';

  extractBtn.onclick = async () => {
    progressEl.style.display = 'block';
    extractBtn.disabled = true;

    try {
      const res = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
      if (res?.success && res.data) {
        statusEl.textContent = '📡 جارٍ الإرسال للنظام...';
        const syncRes = await fetch(`${SERVER}/api/najiz-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scrapedData: res.data, source: 'popup_v4' })
        });
        statusEl.textContent = syncRes.ok ? '✅ تمت المزامنة بنجاح' : '❌ فشلت المزامنة';
      } else {
        statusEl.textContent = '⚠️ لم يتم العثور على بيانات';
      }
    } catch (e) {
      statusEl.textContent = '❌ خطأ: ' + e.message;
    } finally {
      progressEl.style.display = 'none';
      extractBtn.disabled = false;
    }
  };
});
