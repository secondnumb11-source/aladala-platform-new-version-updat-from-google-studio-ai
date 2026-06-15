import { SyncService } from './services/syncEngine';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_SYNC') {
        const type = request.payload?.type || 'ALL';
        
        // Process sync asynchronously
        SyncService.handleSyncRequest(type).then(result => {
             // For extension background scripts returning an async result
             // You must return true from the event listener, and call sendResponse later
             sendResponse(result);
        });
        
        return true; // Keeps the message channel open
    }
});
