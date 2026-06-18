chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncData') {
    const { url, payload } = request;
    
    // Normalize url ensuring no trailing slash
    const targetUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    // Send payload to the Adalah Platform backend via POST
    fetch(targetUrl + '/api/najiz-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'najiz-extension'
      },
      body: JSON.stringify({
        data: payload,
        timestamp: Date.now()
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Save last sync time
      chrome.storage.local.set({ lastSyncTime: Date.now() });
      
      // Notify user via Chrome notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png', // Fallback, no actual icon file present in req, but expected
        title: 'مزامنة منصة العدالة',
        message: 'تمت مزامنة البيانات المكتشفة بنجاح مع النظام!'
      });

      sendResponse({ success: true, data });
    })
    .catch(error => {
      console.error("Sync Error:", error);
      sendResponse({ success: false, error: error.message });
    });

    return true; // Keep the message channel open for async fetch
  }
});