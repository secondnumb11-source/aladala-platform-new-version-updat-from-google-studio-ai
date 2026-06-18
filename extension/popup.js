document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('syncBtn');
  const statusEl = document.getElementById('statusMessage');
  const tabBrowser = document.getElementById('tab-browser');
  const tabApikey = document.getElementById('tab-apikey');
  const browserMode = document.getElementById('browser-mode');
  const apikeyMode = document.getElementById('apikey-mode');
  const allOpt = document.getElementById('opt-all');
  const otherOpts = document.querySelectorAll('.sync-opt input:not(#opt-all)');
  
  // تبديل الوضع
  tabBrowser.addEventListener('click', () => {
    tabBrowser.classList.add('active'); tabApikey.classList.remove('active');
    browserMode.style.display = ''; apikeyMode.style.display = 'none';
  });
  
  tabApikey.addEventListener('click', () => {
    tabApikey.classList.add('active'); tabBrowser.classList.remove('active');
    apikeyMode.style.display = ''; browserMode.style.display = 'none';
  });
  
  // تحميل الإعدادات
  chrome.storage.local.get(['adalah_api_url', 'adalah_api_key'], (result) => {
    if (result.adalah_api_url) document.getElementById('apiUrl').value = result.adalah_api_url;
    if (result.adalah_api_key) document.getElementById('apiKey').value = result.adalah_api_key;
  });
  
  // منطق "جميع البيانات"
  allOpt.addEventListener('change', () => {
    otherOpts.forEach(cb => cb.checked = allOpt.checked);
  });
  
  // زر المزامنة
  syncBtn.addEventListener('click', async () => {
    const apiUrl = document.getElementById('apiUrl')?.value || 'http://localhost:5000';
    const apiKey = document.getElementById('apiKey')?.value || '';
    
    // حفظ الإعدادات
    chrome.storage.local.set({ adalah_api_url: apiUrl, adalah_api_key: apiKey });
    
    // جمع أنواع المزامنة
    const selectedTypes = [];
    document.querySelectorAll('.sync-opt input:checked').forEach(cb => {
      if (cb.value !== 'all') selectedTypes.push(cb.value);
    });
    
    if (selectedTypes.length === 0) {
      statusEl.textContent = '⚠️ اختر نوعاً واحداً على الأقل';
      statusEl.className = 'status error';
      return;
    }
    
    syncBtn.disabled = true;
    syncBtn.textContent = '⏳ جاري المزامنة...';
    statusEl.textContent = 'يتم الاتصال بالصفحة...';
    statusEl.className = 'status';
    
    try {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url?.includes('najiz.sa')) {
        statusEl.textContent = '⚠️ يرجى فتح موقع najiz.sa أولاً';
        statusEl.className = 'status error';
        return;
      }
      
      // حقن المحتوى أولاً
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).catch(() => {}); // تجاهل الخطأ إذا كان محقوناً مسبقاً
      
      // إرسال الرسالة
      chrome.tabs.sendMessage(tab.id, {
        action: 'syncData',
        selectedTypes,
        apiUrl,
        apiKey
      }, (response) => {
        if (chrome.runtime.lastError) {
          statusEl.textContent = '❌ تعذر الاتصال بالصفحة. أعد تحميل ناجز وحاول مرة أخرى.';
          statusEl.className = 'status error';
        } else if (response?.success) {
          const summary = response.result?.summary || {};
          statusEl.innerHTML = \`✅ نجحت المزامنة! \${Object.entries(summary).map(([k,v]) => \`\${v} \${k}\`).join(' | ')}\`;
          statusEl.className = 'status success';
        } else {
          statusEl.textContent = '❌ ' + (response?.error || 'خطأ في المزامنة');
          statusEl.className = 'status error';
        }
        
        syncBtn.disabled = false;
        syncBtn.textContent = '🚀 مزامنة الصفحة الحالية';
      });
      
    } catch (err) {
      statusEl.textContent = '❌ ' + err.message;
      statusEl.className = 'status error';
      syncBtn.disabled = false;
      syncBtn.textContent = '🚀 مزامنة الصفحة الحالية';
    }
  });
});
