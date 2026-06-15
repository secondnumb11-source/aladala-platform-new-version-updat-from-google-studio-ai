import { AIClassificationEngine } from './ai/classification';
import { SyncService } from './services/syncEngine';

document.addEventListener('DOMContentLoaded', () => {
    // Tabs logic
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    
    tabs.forEach(tab => {
       tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          tab.classList.add('active');
          const target = document.getElementById((tab as HTMLElement).dataset.target || '');
          if (target) target.classList.add('active');
       });
    });

    // Load Data
    chrome.storage.local.get(['apiUrl', 'apiKey', 'lastSync'], (data) => {
       const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
       const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
       if(data.apiUrl && apiUrlInput) apiUrlInput.value = data.apiUrl;
       if(data.apiKey && apiKeyInput) apiKeyInput.value = data.apiKey;
       
       if (data.lastSync) {
          const lastSyncEl = document.getElementById('last-sync-time');
          if (lastSyncEl) lastSyncEl.innerText = 'آخر مزامنة: ' + new Date(data.lastSync).toLocaleString('ar-SA');
       }
    });

    // Save Data
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
       saveBtn.addEventListener('click', () => {
          const apiUrl = (document.getElementById('apiUrl') as HTMLInputElement).value;
          const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
          
          saveBtn.innerText = 'جاري الحفظ...';
          
          chrome.storage.local.set({ apiUrl, apiKey }, () => {
             setTimeout(() => {
                saveBtn.innerText = 'تم الحفظ ✔️';
                setTimeout(() => { saveBtn.innerText = 'حفظ البيانات والتأمين'; }, 2000);
             }, 500);
          });
       });
    }

    // Sync Triggers
    const syncButtons = [
        { id: 'btn-sync-all', type: 'ALL' },
        { id: 'btn-sync-cases', type: 'CASES' },
        { id: 'btn-sync-clients', type: 'CLIENTS' },
        { id: 'btn-sync-hearings', type: 'HEARINGS' },
        { id: 'btn-sync-executions', type: 'EXECUTIONS' },
        { id: 'btn-sync-agencies', type: 'AGENCIES' }
    ];

    syncButtons.forEach(btn => {
        const el = document.getElementById(btn.id);
        if (el) {
            el.addEventListener('click', () => {
                const originalText = el.innerText;
                el.innerText = 'جارِ המزامنة...';
                el.setAttribute('disabled', 'true');
                
                chrome.runtime.sendMessage({ action: 'START_SYNC', payload: { type: btn.type } }, (response) => {
                    if (response && response.success) {
                        el.innerText = 'تمت المزامنة بنجاح ✔️';
                        chrome.storage.local.set({ lastSync: Date.now() });
                    } else {
                        el.innerText = 'فشل المزامنة';
                    }
                    setTimeout(() => {
                        el.innerText = originalText;
                        el.removeAttribute('disabled');
                    }, 3000);
                });
            });
        }
    });
});
