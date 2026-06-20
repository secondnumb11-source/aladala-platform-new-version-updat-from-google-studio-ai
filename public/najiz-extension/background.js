// background.js - منصة العدالة v4.0
const APP_SERVER = 'https://aladala-platform-rnuz.onrender.com';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ serverUrl: APP_SERVER });
  console.log('[العدالة] تم تثبيت الإضافة بنجاح');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady') {
    console.log('[العدالة] Script جاهز:', message.url);
  }
  if (message.action === 'setServerUrl') {
    chrome.storage.local.set({ serverUrl: message.url });
  }
  sendResponse({ received: true });
  return true;
});
