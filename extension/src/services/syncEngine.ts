import { AIClassificationEngine } from '../ai/classification';

export class SyncService {
    static async handleSyncRequest(type: string) {
        try {
            // First we need to get data from the active tab content script
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tabs || tabs.length === 0 || !tabs[0].id) {
                return { success: false, message: 'No active tab found' };
            }

            const activeTabId = tabs[0].id;
            
            // Send message to content script to extract data 
            const extractedData = await new Promise((resolve) => {
                chrome.tabs.sendMessage(activeTabId, { action: 'EXTRACT_DATA', payload: { type } }, (response) => {
                    resolve(response?.data || []);
                });
            });

            if (!Array.isArray(extractedData) || extractedData.length === 0) {
                return { success: false, message: 'No data extracted from page' };
            }

            // Run through AI Classifier
            const processResult = AIClassificationEngine.processBatch(extractedData);
            
            // Filter by requested type if not ALL
            let finalDataToSend = processResult;
            if (type !== 'ALL') {
                finalDataToSend = {
                    [type]: processResult[type as keyof typeof processResult] || []
                } as any;
            }

            // Transmit to SaaS Backend
            const syncStatus = await this.transmitToSaaS(finalDataToSend, type, tabs[0].url || 'unknown-url');

            return syncStatus;

        } catch (error) {
            console.error('Sync failed', error);
            return { success: false, message: String(error) };
        }
    }

    private static async transmitToSaaS(payload: any, type: string, sourceUrl: string) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['apiUrl', 'apiKey'], async (data) => {
                const endpoint = data.apiUrl || 'http://localhost:3000/api/v1/najiz-sync';
                
                // NO CRITICAL API KEY REQUIRED FOR NAJIZ
                // It only uses the SaaS api key to talk to the Backend if configured. 
                // Extension purely relies on user browser session for Najiz.
                
                try {
                    const req = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(data.apiKey ? { 'Authorization': 'Bearer ' + data.apiKey } : {})
                        },
                        body: JSON.stringify({
                            action: 'BATCH_SYNC',
                            targetType: type,
                            sourceUrl,
                            timestamp: Date.now(),
                            records: payload
                        })
                    });
                    
                    if (req.ok) {
                        resolve({ success: true, message: 'Transmitted successfully' });
                    } else {
                        resolve({ success: false, message: 'Server rejected the payload' });
                    }
                } catch(e) {
                    resolve({ success: false, message: 'Connection to SaaS backend failed' });
                }
            });
        });
    }
}
