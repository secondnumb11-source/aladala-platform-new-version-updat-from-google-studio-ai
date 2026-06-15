// content.js
// This script runs in the context of najiz.sa pages

console.log("Najiz Smart Sync Extension - Content Script Loaded.", new Date().toLocaleString());

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "extract") {
    console.log("Extraction requested for:", request.action);
    const data = extractDataFromDOM(request.action);
    sendResponse({ success: true, data: data });
  }
  return true; // Keep message channel open
});

function extractDataFromDOM(action) {
  // Extract all textual content dynamically from the DOM so the AI parser can process it seamlessly
  // without relying on brittle class selectors.
  
  const extracted = {};
  
  try {
    extracted.rawText = document.body.innerText || "";
  } catch(e) {
    extracted.rawText = "";
  }

  // Adding generic metadata
  extracted.extractionDate = new Date().toISOString();
  extracted.url = window.location.href;
  
  return extracted;
}

