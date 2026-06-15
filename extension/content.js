chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncData') {
    // 1. Scraping Najiz elements
    const rawDataObjects = [];
    
    // Naively extract chunks of data from DOM that look like our targets
    // Example CSS selectors for structural blocks (Najiz specific or generic placeholders)
    const blocks = document.querySelectorAll('div, table, tr, li, .card, .row');
    
    blocks.forEach(block => {
      // Basic text extraction
      const text = block.textContent || '';
      if (text.length > 20 && text.length < 500) {
        // Look for numbers like case numbers, IDs
        const numbers = text.match(/\d{8,14}/g) || [];
        if (text.includes('قضية') || text.includes('جلسة') || text.includes('وكالة') || text.includes('تنفيذ')) {
          rawDataObjects.push({
            type: 'unknown',
            payload: {
              rawText: text,
              number: numbers[0] || 'غير متوفر',
              date: new Date().toISOString()
            }
          });
        }
      }
    });

    // We can also extract structured data from window variables if available
    // e.g. window.__INITIAL_STATE__ etc.
    
    const scripts = document.querySelectorAll('script');
    scripts.forEach(s => {
      if (s.textContent?.includes('window.__INITIAL_STATE__')) {
        try {
          const match = s.textContent.match(/window\.__INITIAL_STATE__\s*=\s*(.*?);/);
          if (match && match[1]) {
             const json = JSON.parse(match[1]);
             if (json.cases) rawDataObjects.push({ type: 'cases', payload: json.cases });
             if (json.sessions) rawDataObjects.push({ type: 'sessions', payload: json.sessions });
          }
        } catch(e) {}
      }
    });

    // 2. Classify Data
    const classified = typeof AIClassifier !== 'undefined' 
       ? AIClassifier.classifyNajizData(rawDataObjects) 
       : { cases: [], hearings: [], agencies: [], enforcement_requests: [], documents: [] };

    // 3. Post to SaaS Backend
    fetch(request.apiUrl + '/api/sync-najiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + request.apiKey
      },
      body: JSON.stringify({
        source_url: window.location.href,
        data: classified
      })
    })
    .then(r => r.json())
    .then(data => {
      sendResponse({ success: true, count: rawDataObjects.length, classified });
    }).catch(err => {
      sendResponse({ success: false, error: err.toString() });
    });
      
    return true; // async response
  }
});
