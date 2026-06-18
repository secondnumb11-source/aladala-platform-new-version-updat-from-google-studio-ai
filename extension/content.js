// ===== منصة العدالة - محتوى مزامنة ناجز =====
(function() {
  'use strict';
  
  // منع التشغيل المتكرر
  if (window.__adalahSyncInjected) return;
  window.__adalahSyncInjected = true;
  
  // ===== إعدادات =====
  let settings = { apiUrl: '', apiKey: '', autoSync: false };
  
  chrome.storage.local.get(['adalah_api_url', 'adalah_api_key', 'adalah_auto_sync'], (result) => {
    settings.apiUrl = result.adalah_api_url || 'http://localhost:5000';
    settings.apiKey = result.adalah_api_key || '';
    settings.autoSync = result.adalah_auto_sync || false;
  });
  
  // ===== سحب البيانات الذكي من الصفحة =====
  function extractPageData() {
    const allText = document.body.innerText || '';
    const pageHTML = document.body.innerHTML || '';
    const url = window.location.href;
    
    // استخراج البيانات المنظمة من الجداول
    const tables = [];
    document.querySelectorAll('table').forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('td, th').forEach(td => cells.push(td.innerText.trim()));
        if (cells.some(c => c.length > 0)) rows.push(cells);
      });
      if (rows.length > 0) tables.push(rows);
    });
    
    // استخراج البطاقات والعناصر المرئية
    const cards = [];
    document.querySelectorAll('[class*="card"], [class*="case"], [class*="item"], [class*="row"]').forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 10 && text.length < 2000) {
        cards.push(text);
      }
    });
    
    return {
      url,
      pageTitle: document.title,
      rawText: allText.substring(0, 50000), // أول 50,000 حرف
      tables,
      cards: cards.slice(0, 100), // أول 100 بطاقة
      timestamp: new Date().toISOString()
    };
  }
  
  // ===== إرسال البيانات للمنصة =====
  async function syncToAdalah(pageData, selectedTypes) {
    const apiUrl = settings.apiUrl || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${apiUrl}/api/najiz-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': settings.apiKey || 'no-key-browser-mode',
          'X-Sync-Types': selectedTypes.join(','),
          'X-Source': 'chrome-extension-v2'
        },
        body: JSON.stringify({
          ...pageData,
          selectedTypes,
          mode: settings.apiKey ? 'apikey' : 'browser'
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('[العدالة] خطأ في الاتصال:', err);
      throw err;
    }
  }
  
  // ===== إنشاء الزر العائم =====
  function createFloatingButton() {
    // إزالة الزر القديم إذا وجد
    const old = document.getElementById('adalah-sync-btn');
    if (old) old.remove();
    
    const btn = document.createElement('div');
    btn.id = 'adalah-sync-btn';
    btn.innerHTML = `
      <div id="adalah-fab" style="
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 999999;
        background: linear-gradient(135deg, #D4AF37, #F59E0B);
        color: #0b1329;
        border-radius: 50px;
        padding: 12px 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Cairo', Arial, sans-serif;
        font-weight: 900;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(212,175,55,0.4);
        transition: all 0.3s ease;
        user-select: none;
        direction: rtl;
      ">
        <span style="font-size:18px">⚖️</span>
        <span>منصة العدالة</span>
        <span id="adalah-arrow" style="transition:transform 0.3s">▲</span>
      </div>
      
      <div id="adalah-menu" style="
        position: fixed;
        bottom: 80px;
        left: 24px;
        z-index: 999998;
        background: #0b1329;
        border: 1px solid #D4AF37;
        border-radius: 16px;
        padding: 16px;
        min-width: 260px;
        display: none;
        direction: rtl;
        font-family: 'Cairo', Arial, sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      ">
        <div style="color:#D4AF37;font-weight:900;font-size:15px;margin-bottom:12px;border-bottom:1px solid #D4AF3740;padding-bottom:8px">
          🔄 اختر نوع المزامنة
        </div>
        
        <div id="adalah-sync-options" style="display:flex;flex-direction:column;gap:6px">
          <label class="adalah-opt" data-type="all" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px;background:#1a2540">
            <input type="checkbox" value="all" checked style="accent-color:#D4AF37">
            <span>📦 مزامنة جميع البيانات</span>
          </label>
          <label class="adalah-opt" data-type="cases" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px">
            <input type="checkbox" value="cases" checked style="accent-color:#D4AF37">
            <span>⚖️ بيانات القضايا</span>
          </label>
          <label class="adalah-opt" data-type="clients" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px">
            <input type="checkbox" value="clients" checked style="accent-color:#D4AF37">
            <span>👥 بيانات العملاء وأطراف القضايا</span>
          </label>
          <label class="adalah-opt" data-type="hearings" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px">
            <input type="checkbox" value="hearings" checked style="accent-color:#D4AF37">
            <span>📅 مواعيد الجلسات</span>
          </label>
          <label class="adalah-opt" data-type="executions" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px">
            <input type="checkbox" value="executions" checked style="accent-color:#D4AF37">
            <span>💰 طلبات التنفيذ</span>
          </label>
          <label class="adalah-opt" data-type="case_requests" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px">
            <input type="checkbox" value="case_requests" checked style="accent-color:#D4AF37">
            <span>📋 الطلبات على القضايا</span>
          </label>
          <label class="adalah-opt" data-type="minutes" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px">
            <input type="checkbox" value="minutes" checked style="accent-color:#D4AF37">
            <span>📝 محاضر ضبط الجلسات</span>
          </label>
          <label class="adalah-opt" data-type="agencies" style="display:flex;align-items:center;gap:8px;color:white;cursor:pointer;padding:6px 8px;border-radius:8px">
            <input type="checkbox" value="agencies" checked style="accent-color:#D4AF37">
            <span>📜 الوكالات</span>
          </label>
        </div>
        
        <button id="adalah-sync-now" style="
          width:100%;
          margin-top:12px;
          background:linear-gradient(135deg,#D4AF37,#F59E0B);
          color:#0b1329;
          border:none;
          border-radius:10px;
          padding:10px;
          font-weight:900;
          font-size:14px;
          cursor:pointer;
          font-family:'Cairo',Arial,sans-serif;
        ">
          🚀 بدء المزامنة الآن
        </button>
        
        <div id="adalah-sync-status" style="
          margin-top:8px;
          font-size:12px;
          color:#94a3b8;
          text-align:center;
          min-height:16px;
        "></div>
      </div>
    `;
    
    document.body.appendChild(btn);
    
    const fab = document.getElementById('adalah-fab');
    const menu = document.getElementById('adalah-menu');
    const arrow = document.getElementById('adalah-arrow');
    const syncBtn = document.getElementById('adalah-sync-now');
    const status = document.getElementById('adalah-sync-status');
    
    let isOpen = false;
    
    // تبديل القائمة
    fab.addEventListener('click', () => {
      isOpen = !isOpen;
      menu.style.display = isOpen ? 'block' : 'none';
      arrow.style.transform = isOpen ? 'rotate(180deg)' : '';
    });
    
    // منطق "مزامنة الكل"
    const allCheckbox = document.querySelector('[data-type="all"] input');
    const otherCheckboxes = document.querySelectorAll('.adalah-opt:not([data-type="all"]) input');
    
    allCheckbox.addEventListener('change', () => {
      otherCheckboxes.forEach(cb => cb.checked = allCheckbox.checked);
    });
    
    // زر المزامنة
    syncBtn.addEventListener('click', async () => {
      const selectedTypes = [];
      document.querySelectorAll('.adalah-opt input:checked').forEach(cb => {
        if (cb.value !== 'all') selectedTypes.push(cb.value);
      });
      
      if (selectedTypes.length === 0) {
        status.textContent = '⚠️ يرجى اختيار نوع المزامنة';
        status.style.color = '#F59E0B';
        return;
      }
      
      syncBtn.textContent = '⏳ جاري المزامنة...';
      syncBtn.disabled = true;
      status.textContent = '📡 يتم قراءة البيانات من الصفحة...';
      status.style.color = '#94a3b8';
      
      try {
        const pageData = extractPageData();
        status.textContent = '🔄 يتم إرسال البيانات للمنصة...';
        
        const result = await syncToAdalah(pageData, selectedTypes);
        
        if (result.success) {
          const summary = result.summary || {};
          status.innerHTML = \`✅ نجحت المزامنة!<br>
            \${summary.cases ? \`⚖️ قضايا: \${summary.cases}\` : ''}
            \${summary.clients ? \` | 👥 عملاء: \${summary.clients}\` : ''}
            \${summary.hearings ? \` | 📅 جلسات: \${summary.hearings}\` : ''}
          \`;
          status.style.color = '#10b981';
        } else {
          status.textContent = '❌ ' + (result.message || 'خطأ في المزامنة');
          status.style.color = '#ef4444';
        }
      } catch (err) {
        status.textContent = '❌ خطأ في الاتصال بالمنصة';
        status.style.color = '#ef4444';
      } finally {
        syncBtn.textContent = '🚀 بدء المزامنة الآن';
        syncBtn.disabled = false;
      }
    });
    
    // إغلاق القائمة عند الضغط خارجها
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && isOpen) {
        isOpen = false;
        menu.style.display = 'none';
        arrow.style.transform = '';
      }
    });
  }
  
  // تشغيل الزر
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }
  
  // الاستماع للرسائل من popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'syncData') {
      const pageData = extractPageData();
      syncToAdalah(pageData, request.selectedTypes || ['cases', 'hearings', 'clients', 'agencies', 'executions', 'case_requests', 'minutes'])
        .then(result => sendResponse({ success: true, result }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // استجابة غير متزامنة
    }
    
    if (request.action === 'updateSettings') {
      settings = { ...settings, ...request.settings };
      chrome.storage.local.set({
        'adalah_api_url': settings.apiUrl,
        'adalah_api_key': settings.apiKey,
        'adalah_auto_sync': settings.autoSync
      });
      sendResponse({ success: true });
    }
  });

})();
