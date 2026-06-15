function injectWidget() {
  if (document.getElementById('adalah-sync-widget-container')) return;
  const div = document.createElement('div');
  div.innerHTML = `<div id="adalah-sync-widget-container">
   <button id="adalah-sync-toggle" style="position:fixed; bottom:20px; right:20px; z-index:999999; background:#D4AF37; color:#0c2461; border:none; padding:15px 25px; border-radius:30px; font-weight:900; box-shadow:0 10px 20px rgba(0,0,0,0.5); cursor:pointer; font-family:system-ui; direction:rtl; display:flex; align-items:center; gap:8px;">
      ⚖️ خيارات الربط المباشر مع ناجز
   </button>
   <div id="adalah-sync-widget" style="display:none; position:fixed; bottom:80px; right:20px; z-index:999999; background:#0c2461; color:#fff; border:2px solid #D4AF37; border-radius:20px; padding:20px; width:340px; box-shadow:0 15px 40px rgba(0,0,0,0.6); font-family:system-ui; direction:rtl;">
       <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:10px;">
          <strong style="color: #D4AF37; font-size:16px;">الربط والمزامنة - منصة العدالة</strong>
          <span style="font-size:11px; background:rgba(74,222,128,0.1); color:#4ade80; padding:4px 8px; border-radius:6px; font-weight:bold;">● نشط</span>
       </div>
       <button class="ad-btn primary" id="btn-sync-all" style="margin-bottom:10px; width: 100%; padding: 8px; background: #D4AF37; color: #0c2461; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">سحب ومزامنة جميع البيانات</button>
       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button class="ad-btn" id="btn-sync-cases" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">مزامنة القضايا</button>
          <button class="ad-btn" id="btn-sync-clients" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">مزامنة العملاء</button>
          <button class="ad-btn" id="btn-sync-hearings" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">مواعيد الجلسات</button>
          <button class="ad-btn" id="btn-sync-executions" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">طلبات التنفيذ</button>
          <button class="ad-btn" id="btn-sync-requests" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">الطلبات</button>
          <button class="ad-btn" id="btn-sync-minutes" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">محاضر الجلسات</button>
          <button class="ad-btn" id="btn-sync-agencies" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">الوكالات</button>
          <button class="ad-btn" id="btn-sync-others" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; cursor: pointer;">بيانات أخرى</button>
       </div>
       <div style="margin-top:10px; font-size:10px; color:#94a3b8; text-align:center;">
          يعمل المدقق الآلي (AI) على تحليل وترتيب البيانات في أقسام النظام تلقائياً.
       </div>
   </div>
</div>`;
  document.body.appendChild(div);

  document.getElementById('adalah-sync-toggle').addEventListener('click', () => {
     const w = document.getElementById('adalah-sync-widget');
     w.style.display = w.style.display === 'none' ? 'block' : 'none';
  });

  const buttons = ['all', 'cases', 'clients', 'hearings', 'executions', 'requests', 'minutes', 'agencies', 'others'];
  buttons.forEach(id => {
      document.getElementById('btn-sync-' + id).addEventListener('click', () => handleSync(id));
  });
}

function extractMockData() {
   return [
      { rawTitle: "قضية عمالية رقم 123", rawText: "تأخر الرواتب", rawDate: "2023-01-01" },
      { rawTitle: "جلسة محكمة", rawText: "الدائرة الثالثة", rawDate: "2023-02-15", time: "10:00" },
      { rawTitle: "وكالة شرعية", rawText: "رقم 5544", principal: "أحمد", agent: "محمد" }
   ];
}

function aiCategorizeData(scrapedItems) {
   return scrapedItems.map(item => {
      let category = 'others';
      const textStr = JSON.stringify(item).toLowerCase();
      
      if (textStr.includes('قضية') || textStr.includes('دعوى')) {
         category = 'cases';
      } else if (textStr.includes('جلسة') || textStr.includes('موعد')) {
         category = 'hearings';
      } else if (textStr.includes('وكالة') || textStr.includes('توكيل')) {
         category = 'agencies';
      } else if (textStr.includes('تنفيذ')) {
         category = 'executions';
      }

      return {
         ...item,
         aiDetectedCategory: category,
         normalizedTimestamp: new Date().toISOString()
      };
   });
}

async function handleSync(type) {
   const btn = document.getElementById('btn-sync-all');
   const originalText = btn.innerText;
   btn.innerText = 'جاري التحليل والربط...';
   
   chrome.storage.local.get(['apiUrl', 'apiKey'], async (data) => {
      const url = data.apiUrl || window.location.origin + '/api/v1/najiz-sync';
      
      const rawData = extractMockData();
      let processedData = aiCategorizeData(rawData);
      
      if (type !== 'all') {
         processedData = processedData.filter(d => d.aiDetectedCategory === type || type === 'others');
      }

      const payload = { 
        action: 'SYNC',
        targetType: type, 
        sourceUrl: window.location.href, 
        timestamp: Date.now(),
        data: processedData
      };
      
      try {
        const req = await fetch(url, {
           method: 'POST',
           headers: {
              'Content-Type': 'application/json',
              ...(data.apiKey ? { 'Authorization': 'Bearer ' + data.apiKey } : {})
           },
           body: JSON.stringify(payload)
        });
        if(req.ok) {
           alert('تم التصنيف وإرسال البيانات بنجاح إلى منصة العدالة.');
        } else {
           alert('حدثت مشكلة في إرسال البيانات. تأكد من إعدادات الربط في الإضافة.');
        }
      } catch(e) {
         console.error('Sync error fallback to local arrangement', e);
         alert('فشل الاتصال بالخادم. يرجى مراجعة رابط API.');
      } finally {
         btn.innerText = originalText;
      }
   });
}

setTimeout(injectWidget, 2000);
