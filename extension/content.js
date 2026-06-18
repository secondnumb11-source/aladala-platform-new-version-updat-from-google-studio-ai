let extractedData = {
  cases: [],
  hearings: [],
  agencies: [],
  executions: [],
  judgments: []
};

function notifyPopup() {
  chrome.runtime.sendMessage({ action: 'statsUpdated' }).catch(() => {});
}

// Function to extract data based on specific patterns
function scanNajizDOM() {
  let newDataFound = false;
  
  // Cases Extraction
  const caseRows = document.querySelectorAll('tr, .case-card, .row');
  caseRows.forEach(row => {
    const text = row.textContent || '';
    if (text.includes('قضية') || text.includes('رقم القضية') || text.includes('حالة الدعوى')) {
      const numberMatch = text.match(/\d{8,15}/);
      if (numberMatch && !extractedData.cases.some(c => c.caseNumber === numberMatch[0])) {
        extractedData.cases.push({
          rawText: text,
          caseNumber: numberMatch[0],
          rawTitle: text.substring(0, 50).replace(/\s+/g, ' ').trim()
        });
        newDataFound = true;
      }
    }
  });

  // Hearings Extraction
  const hearingRows = document.querySelectorAll('tr, .hearing-card, .session-card');
  hearingRows.forEach(row => {
    const text = row.textContent || '';
    if (text.includes('جلسة') || text.includes('موعد') || text.includes('تداول')) {
      const dateMatch = text.match(/\d{4}[\-\/]\d{2}[\-\/]\d{2}/) || text.match(/\d{2}[\-\/]\d{2}[\-\/]\d{4}/);
      const timeMatch = text.match(/\d{1,2}:\d{2}/);
      if (dateMatch && !extractedData.hearings.some(h => h.rawText === text)) {
        extractedData.hearings.push({
          rawText: text,
          rawDate: dateMatch[0],
          time: timeMatch ? timeMatch[0] : '09:00',
          rawTitle: text.substring(0, 50).replace(/\s+/g, ' ').trim()
        });
        newDataFound = true;
      }
    }
  });

  // Agencies Extraction
  const agencyRows = document.querySelectorAll('tr, .agency-card, .poa-card');
  agencyRows.forEach(row => {
    const text = row.textContent || '';
    if (text.includes('وكالة') || text.includes('تفويض')) {
      const numberMatch = text.match(/\d{8,15}/);
      if (numberMatch && !extractedData.agencies.some(a => a.poa_number === numberMatch[0])) {
        extractedData.agencies.push({
          rawText: text,
          poa_number: numberMatch[0],
          rawTitle: text.substring(0, 50).replace(/\s+/g, ' ').trim()
        });
        newDataFound = true;
      }
    }
  });

  // Executions Extraction
  const execRows = document.querySelectorAll('tr, .execution-card');
  execRows.forEach(row => {
    const text = row.textContent || '';
    if (text.includes('تنفيذ') || text.includes('طلب تنفيذ')) {
      const numberMatch = text.match(/\d{8,15}/);
      if (numberMatch && !extractedData.executions.some(e => e.exec_number === numberMatch[0])) {
        extractedData.executions.push({
          rawText: text,
          exec_number: numberMatch[0],
          rawTitle: text.substring(0, 50).replace(/\s+/g, ' ').trim()
        });
        newDataFound = true;
      }
    }
  });

  // Judgments Extraction
  const judgmentRows = document.querySelectorAll('tr, .judgment-card');
  judgmentRows.forEach(row => {
    const text = row.textContent || '';
    if (text.includes('صك') || text.includes('حكم') || text.includes('قرار')) {
      const numberMatch = text.match(/\d{8,15}/);
      if (numberMatch && !extractedData.judgments.some(j => j.judgment_number === numberMatch[0])) {
        extractedData.judgments.push({
          rawText: text,
          judgment_number: numberMatch[0],
          rawTitle: text.substring(0, 50).replace(/\s+/g, ' ').trim()
        });
        newDataFound = true;
      }
    }
  });

  if (newDataFound) {
    notifyPopup();
  }
}

// Observe DOM mutations to catch AJAX-loaded data
const observer = new MutationObserver((mutations) => {
  let shouldScan = false;
  for (let mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldScan = true;
      break;
    }
  }
  if (shouldScan) {
    scanNajizDOM();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial scan
setTimeout(scanNajizDOM, 1000);

// Listen to requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    sendResponse({
      stats: {
        cases: extractedData.cases.length,
        hearings: extractedData.hearings.length,
        agencies: extractedData.agencies.length,
        executions: extractedData.executions.length,
        judgments: extractedData.judgments.length
      }
    });
  } else if (request.action === 'extractData') {
    // Force a fresh scan before returning
    scanNajizDOM();
    sendResponse({ data: extractedData });
  }
  return true;
});
