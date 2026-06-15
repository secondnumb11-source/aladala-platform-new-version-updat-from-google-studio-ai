document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    
    tabs.forEach(tab => {
       tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          
          tab.classList.add('active');
          document.getElementById(tab.dataset.target).classList.add('active');
       });
    });

    chrome.storage.local.get(['apiUrl', 'apiKey'], (data) => {
       if(data.apiUrl) document.getElementById('apiUrl').value = data.apiUrl;
       if(data.apiKey) document.getElementById('apiKey').value = data.apiKey;
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
       const apiUrl = document.getElementById('apiUrl').value;
       const apiKey = document.getElementById('apiKey').value;
       const btn = document.getElementById('saveBtn');
       
       btn.innerText = 'جاري الحفظ...';
       
       chrome.storage.local.set({ apiUrl, apiKey }, () => {
          setTimeout(() => {
             btn.innerText = 'تم الحفظ ✔️';
             setTimeout(() => { btn.innerText = 'حفظ البيانات والتأمين'; }, 2000);
          }, 500);
       });
    });
});