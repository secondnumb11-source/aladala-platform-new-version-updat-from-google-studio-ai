document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('syncBtn');
  const statusEl = document.getElementById('statusMessage');
  
  chrome.storage.local.get(['apiUrl', 'apiKey'], (result) => {
    if (result.apiUrl) document.getElementById('apiUrl').value = result.apiUrl;
    if (result.apiKey) document.getElementById('apiKey').value = result.apiKey;
  });
  
  syncBtn.addEventListener('click', async () => {
    const apiUrl = document.getElementById('apiUrl').value;
    const apiKey = document.getElementById('apiKey').value;
    
    chrome.storage.local.set({ apiUrl, apiKey });
    statusEl.textContent = 'جاري المزامنة...';
    
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      chrome.tabs.sendMessage(tab.id, { action: 'syncData', apiUrl, apiKey }, (response) => {
        if (response && response.success) {
          statusEl.textContent = 'تمت المزامنة بنجاح.';
        } else {
          statusEl.textContent = 'خطأ في المزامنة.';
          statusEl.style.color = '#ff4d4f';
        }
      });
    });
  });
});
