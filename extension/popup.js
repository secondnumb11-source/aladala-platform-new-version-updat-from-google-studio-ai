document.addEventListener('DOMContentLoaded', () => {
  const systemUrlInput = document.getElementById('systemUrl');
  const btnSync = document.getElementById('btnSync');
  const statusMsg = document.getElementById('statusMsg');
  
  const counts = {
    cases: document.getElementById('count-cases'),
    hearings: document.getElementById('count-hearings'),
    agencies: document.getElementById('count-agencies'),
    executions: document.getElementById('count-executions'),
    judgments: document.getElementById('count-judgments')
  };

  // Load saved System URL
  chrome.storage.local.get(['adalahSystemUrl'], (result) => {
    if (result.adalahSystemUrl) {
      systemUrlInput.value = result.adalahSystemUrl;
    }
  });

  // Save System URL on change
  systemUrlInput.addEventListener('input', () => {
    chrome.storage.local.set({ adalahSystemUrl: systemUrlInput.value.trim() });
  });

  function showStatus(msg, isError = false) {
    statusMsg.textContent = msg;
    statusMsg.style.display = 'block';
    if (isError) {
      statusMsg.classList.add('error-msg');
    } else {
      statusMsg.classList.remove('error-msg');
    }
  }

  // Ask content.js for current stats
  function updateStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('najiz.sa')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Not a Najiz page or script not loaded yet.");
            return;
          }
          if (response && response.stats) {
            counts.cases.textContent = response.stats.cases || 0;
            counts.hearings.textContent = response.stats.hearings || 0;
            counts.agencies.textContent = response.stats.agencies || 0;
            counts.executions.textContent = response.stats.executions || 0;
            counts.judgments.textContent = response.stats.judgments || 0;
            
            const total = Object.values(response.stats).reduce((a, b) => a + b, 0);
            if (total === 0) {
              btnSync.disabled = true;
            } else {
              btnSync.disabled = false;
            }
          }
        });
      } else {
        showStatus('يرجى فتح صفحة ناجز لاستخراج البيانات', true);
        btnSync.disabled = true;
      }
    });
  }

  updateStats();
  
  // Listen for realtime updates from content.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'statsUpdated') {
      updateStats();
    }
  });

  btnSync.addEventListener('click', () => {
    const sysUrl = systemUrlInput.value.trim();
    if (!sysUrl) {
      showStatus('يرجى إدخال رابط النظام أولاً', true);
      return;
    }

    btnSync.disabled = true;
    showStatus('جاري المزامنة...');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'extractData' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.data) {
          showStatus('حدث خطأ أثناء الاتصال بصفحة ناجز', true);
          btnSync.disabled = false;
          return;
        }

        // Send extracted data to background for POSTing
        chrome.runtime.sendMessage({
          action: 'syncData',
          url: sysUrl,
          payload: response.data
        }, (bgResponse) => {
          btnSync.disabled = false;
          if (bgResponse && bgResponse.success) {
            showStatus('تمت المزامنة بنجاح!');
          } else {
            const err = bgResponse ? bgResponse.error : 'خطأ غير معروف';
            showStatus('فشل: ' + err, true);
          }
        });
      });
    });
  });
});
