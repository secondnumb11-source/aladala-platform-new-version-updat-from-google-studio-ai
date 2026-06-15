// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Najiz Sync Extension Installed.");
    // Setup scheduled background sync
    chrome.alarms.create("dailySync", { periodInMinutes: 1440 });
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailySync") {
      console.log("Triggering scheduled background sync...");
      // Logic for background headless sync if applicable
    }
  });
