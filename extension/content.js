(function () {
  'use strict';

  // ===== دالة استخراج البيانات حسب نوع الصفحة =====
  async function extractByPageType() {
    const url = window.location.href;
    const data = {
      cases: [],
      hearings: [],
      powers_of_attorney: [],
      executions: [],
      clients: [],
      pageUrl: url,
      scrapedAt: new Date().toISOString()
    };

    // انتظر قليلاً لتحميل المحتوى الديناميكي
    await new Promise(r => setTimeout(r, 1000));

    const bodyText = document.body?.innerText || '';

    // 1. القضايا
    if (url.includes('/lawsuit')) {
      const rows = document.querySelectorAll('table tbody tr');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
        if (cells.length >= 3) {
          data.cases.push({
            caseNumber: cells.find(c => /\d{4}\//.test(c)) || cells[0],
            caseName: cells[1] || '',
            status: cells.find(c => ['قيد', 'منتهي', 'نشط', 'محكوم'].some(k => c.includes(k))) || '',
            court: cells.find(c => c.includes('محكمة')) || '',
            category: 'civil'
          });
        }
      });
    }

    // 2. الجلسات
    if (url.includes('/appointment-requests')) {
      const cards = document.querySelectorAll('.card, [class*="Card"]');
      cards.forEach(card => {
        const text = card.innerText;
        const dateMatch = text.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/);
        const caseMatch = text.match(/\d{4}\/\d+/);
        if (dateMatch) {
          data.hearings.push({
            date: dateMatch[0],
            caseNumber: caseMatch ? caseMatch[0] : '',
            court: text.includes('محكمة') ? 'محكمة' : '',
            status: 'upcoming'
          });
        }
      });
    }

    // 3. الوكالات
    if (url.includes('/wekalat')) {
      const items = document.querySelectorAll('.list-item, tr');
      items.forEach(item => {
        const text = item.innerText;
        const poaNum = text.match(/\d{9,}/);
        if (poaNum) {
          data.powers_of_attorney.push({
            poaNumber: poaNum[0],
            expiryDate: text.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/)?.[0] || ''
          });
        }
      });
    }

    // 4. التنفيذ
    if (url.includes('/iexecution')) {
      const rows = document.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.innerText;
        const execNum = text.match(/\d{10,}/);
        if (execNum) {
          data.executions.push({
            executionNumber: execNum[0],
            text: text.substring(0, 100)
          });
        }
      });
    }

    // استخراج اسم المستخدم
    const nameEl = document.querySelector('.user-name, [class*="userName"]');
    if (nameEl) {
      data.clients.push({ name: nameEl.innerText.trim() });
    }

    data.summary = {
      totalCases: data.cases.length,
      totalHearings: data.hearings.length,
      totalPOAs: data.powers_of_attorney.length,
      totalExecutions: data.executions.length,
      hasData: (data.cases.length + data.hearings.length + data.powers_of_attorney.length + data.executions.length) > 0
    };

    return data;
  }

  // ===== الاستماع للرسائل =====
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
      extractByPageType().then(data => sendResponse({ success: true, data }));
      return true;
    }
  });

  console.log('[العدالة] ✅ Content Script v4.0 جاهز');

  // =============================================
  // مربع المزامنة العائم
  // =============================================
  function createFloatingWidget() {
    if (document.getElementById('adala-widget')) return;

    const SERVER = 'https://aladala-platform-rnuz.onrender.com';

    const style = document.createElement('style');
    style.textContent = `
      #adala-widget { position: fixed; bottom: 24px; left: 24px; z-index: 999999; font-family: 'Arial', sans-serif; direction: rtl; }
      #adala-toggle-btn { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(245,158,11,0.5); transition: all 0.3s ease; font-size: 24px; color: #000; }
      #adala-panel { display: none; position: absolute; bottom: 70px; left: 0; width: 280px; background: #050e21; border: 1px solid #1e3a5f; border-radius: 16px; padding: 0; box-shadow: 0 8px 32px rgba(0,0,0,0.6); overflow: hidden; animation: slideUp 0.3s ease; }
      #adala-panel.open { display: block; }
      @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .adala-header { background: linear-gradient(135deg, #0a1628, #1e3a5f); padding: 14px 16px; border-bottom: 1px solid #1e3a5f; }
      .adala-header-title { color: #f59e0b; font-weight: bold; font-size: 14px; margin: 0; }
      .adala-status-bar { padding: 8px 16px; background: #0a1628; border-bottom: 1px solid #1e3a5f; font-size: 11px; color: #94a3b8; text-align: center; }
      .adala-buttons { padding: 10px; display: flex; flex-direction: column; gap: 6px; }
      .adala-btn { width: 100%; padding: 10px 14px; border: 1px solid #1e3a5f; border-radius: 10px; background: #0a1628; color: #fff; font-size: 12px; font-weight: bold; cursor: pointer; text-align: right; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
      .adala-btn:hover { background: #1e3a5f; border-color: #f59e0b; }
      .adala-btn.primary { background: linear-gradient(135deg, #f59e0b22, #d97706); border-color: #f59e0b; color: #f59e0b; }
      .adala-progress { display: none; padding: 6px 16px; font-size: 11px; color: #f59e0b; text-align: center; }
      .adala-progress.show { display: block; }
      .adala-result { display: none; padding: 10px 14px; margin: 0 10px 10px; background: #0f2744; border: 1px solid #1e3a5f; border-radius: 8px; font-size: 11px; color: #94a3b8; }
    `;
    document.head.appendChild(style);

    const widget = document.createElement('div');
    widget.id = 'adala-widget';
    widget.innerHTML = `
      <div id="adala-panel">
        <div class="adala-header"><p class="adala-header-title">⚖️ منصة العدالة</p></div>
        <div class="adala-status-bar" id="adala-status">اختر نوع المزامنة أدناه</div>
        <div class="adala-progress" id="adala-progress">🔄 جارٍ سحب البيانات...</div>
        <div class="adala-buttons">
          <button class="adala-btn primary" data-action="all"><span>🔄</span><span>مزامنة جميع البيانات الآن</span></button>
          <button class="adala-btn" data-action="cases"><span>📁</span><span>مزامنة القضايا</span></button>
          <button class="adala-btn" data-action="hearings"><span>📅</span><span>مزامنة مواعيد الجلسات</span></button>
          <button class="adala-btn" data-action="poa"><span>📜</span><span>مزامنة الوكالات</span></button>
          <button class="adala-btn" data-action="executions"><span>⚡</span><span>مزامنة طلبات التنفيذ</span></button>
        </div>
        <div class="adala-result" id="adala-result"></div>
      </div>
      <button id="adala-toggle-btn">⚖️</button>
    `;
    document.body.appendChild(widget);

    const panel = document.getElementById('adala-panel');
    const toggleBtn = document.getElementById('adala-toggle-btn');
    const statusEl = document.getElementById('adala-status');
    const progressEl = document.getElementById('adala-progress');
    const resultEl = document.getElementById('adala-result');
    const buttons = widget.querySelectorAll('.adala-btn');

    toggleBtn.onclick = () => {
      panel.classList.toggle('open');
      toggleBtn.textContent = panel.classList.contains('open') ? '✕' : '⚖️';
    };

    async function syncData(action) {
      buttons.forEach(b => b.disabled = true);
      progressEl.classList.add('show');
      statusEl.textContent = '⏳ جارٍ المزامنة...';

      try {
        const data = await extractByPageType();
        if (!data.summary.hasData && action !== 'all') {
          statusEl.textContent = '⚠️ لا توجد بيانات في هذه الصفحة';
        } else {
          const res = await fetch(`${SERVER}/api/najiz-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scrapedData: data, pageType: action, source: 'widget_v4' })
          });
          statusEl.textContent = res.ok ? '✅ تمت المزامنة بنجاح' : '❌ فشلت المزامنة';
        }
      } catch (err) {
        statusEl.textContent = '❌ خطأ في النظام';
      } finally {
        buttons.forEach(b => b.disabled = false);
        progressEl.classList.remove('show');
      }
    }

    buttons.forEach(btn => {
      btn.onclick = () => syncData(btn.dataset.action);
    });
  }

  if (document.readyState === 'complete') {
    setTimeout(createFloatingWidget, 1500);
  } else {
    window.addEventListener('load', () => setTimeout(createFloatingWidget, 1500));
  }
})();
