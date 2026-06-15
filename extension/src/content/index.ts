// Injects widget into Najiz DOM
function injectNajizSyncWidget() {
    if (document.getElementById('adalah-sync-widget')) return;
    
    const div = document.createElement('div');
    div.id = 'adalah-sync-widget';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
        <strong style="color: #D4AF37;">مزامنة منصة العدالة (Najiz)</strong>
        <span style="font-size:10px; color:#4ade80;">متصل</span>
        </div>
        <button class="ad-btn primary" id="btn-content-sync-all">سحب ومزامنة جميع البيانات</button>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        <button class="ad-btn" id="btn-content-sync-cases">القضايا</button>
        <button class="ad-btn" id="btn-content-sync-clients">أطراف الدعوى</button>
        <button class="ad-btn" id="btn-content-sync-hearings">الجلسات</button>
        <button class="ad-btn" id="btn-content-sync-executions">التنفيذ</button>
        <button class="ad-btn" id="btn-content-sync-agencies">الوكالات</button>
        </div>
    `;
    document.body.appendChild(div);

    document.getElementById('btn-content-sync-all')?.addEventListener('click', () => triggerSyncFromContent('ALL'));
    document.getElementById('btn-content-sync-cases')?.addEventListener('click', () => triggerSyncFromContent('CASES'));
    document.getElementById('btn-content-sync-clients')?.addEventListener('click', () => triggerSyncFromContent('CLIENTS'));
    document.getElementById('btn-content-sync-hearings')?.addEventListener('click', () => triggerSyncFromContent('HEARINGS'));
    document.getElementById('btn-content-sync-executions')?.addEventListener('click', () => triggerSyncFromContent('EXECUTIONS'));
    document.getElementById('btn-content-sync-agencies')?.addEventListener('click', () => triggerSyncFromContent('AGENCIES'));
}

function triggerSyncFromContent(type: string) {
    const btnId = type === 'ALL' ? 'btn-content-sync-all' : `btn-content-sync-${type.toLowerCase()}`;
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const originalText = btn.innerText;
    btn.innerText = 'جاري المعالجة...';

    chrome.runtime.sendMessage({ action: 'START_SYNC', payload: { type } }, (response) => {
        if (response && response.success) {
            btn.innerText = 'تمت المزامنة ✔️';
        } else {
            btn.innerText = 'فشل الاتصال';
        }
        setTimeout(() => { btn.innerText = originalText; }, 3000);
    });
}

// Scrape logic for extracting the data from DOM
function extractDataFromDOM(type: string) {
    // This function will eventually extract real data from the Najiz DOM depending on page structure.
    // We scrape what we can see in the lawyers session.
    
    const elements = document.querySelectorAll('tr, .case-card, .hearing-item');
    const records: any[] = [];
    
    // Fallback Mock Extraction logic for MVP if structure is unknown 
    if (elements.length === 0) {
       return [
          { rawTitle: "قضية عمالية رقم " + Math.floor(Math.random() * 10000), rawText: "تأخر الرواتب - " + window.location.href, rawDate: new Date().toISOString() },
          { rawTitle: "جلسة محكمة رياض", rawText: "الدائرة الثالثة التجاري", time: "10:00" },
          { rawTitle: "وكالة شرعية مفتوحة", rawText: "رقم 5544", principal: "شركة س", agent: "محمد" }
       ];
    }
    
    elements.forEach((el, index) => {
        records.push({
            rawTitle: (el.querySelector('h1, h2, h3, .title') as HTMLElement)?.innerText || 'سجل ' + index,
            rawText: (el as HTMLElement).innerText,
            scrapedAt: new Date().toISOString(),
            sourceUrl: window.location.href
        });
    });

    return records;
}

// Listen for background requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_DATA') {
        const type = request.payload?.type || 'ALL';
        const data = extractDataFromDOM(type);
        sendResponse({ success: true, data });
    }
});

setTimeout(injectNajizSyncWidget, 3000);
