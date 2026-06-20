// background.js — لا يحتاج API Key
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady') {
    console.log('[العدالة] Script جاهز على:', message.url);
  }
  sendResponse({ received: true });
  return true;
});
