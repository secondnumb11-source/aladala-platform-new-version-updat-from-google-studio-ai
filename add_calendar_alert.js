import fs from 'fs';
let content = fs.readFileSync('src/components/CalendarModule.tsx', 'utf-8');

if (!content.includes('NotificationAlerts:')) {
  // We need to inject the alert logic into the module.
  const injectionStr = `
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [selectedHearingAlert, setSelectedHearingAlert] = useState(null);
  
  // Custom audio alert config
  const toggleAlertPanel = (hearing) => {
    setSelectedHearingAlert(hearing);
    setShowNotificationSettings(true);
  };
  `;
  content = content.replace('const [viewMode', injectionStr + 'const [viewMode');
  
  const uiInjection = `
  {showNotificationSettings && selectedHearingAlert && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <div className="bg-[#0b1329] border border-[#D4AF37]/40 rounded-[2.5rem] p-8 shadow-2xl max-w-sm w-full">
        <h3 className="text-xl font-black text-[#FFFFFF] mb-2">إعدادات التنبيه المسبق</h3>
        <p className="text-[#FACC15] text-sm mb-6 font-bold">تنبيه لـ: {selectedHearingAlert.title}</p>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-white/10 rounded-xl hover:bg-white/5 cursor-pointer">
            <span className="text-white font-bold text-sm">تنبيه صوتي (Audio) 24h</span>
            <input type="checkbox" className="w-5 h-5 accent-[#D4AF37]" defaultChecked />
          </label>
          <label className="flex items-center justify-between p-4 border border-white/10 rounded-xl hover:bg-white/5 cursor-pointer">
            <span className="text-white font-bold text-sm">تنبيه مرئي (Visual) 24h</span>
            <input type="checkbox" className="w-5 h-5 accent-[#D4AF37]" defaultChecked />
          </label>
          <label className="flex items-center justify-between p-4 border border-white/10 rounded-xl hover:bg-white/5 cursor-pointer">
            <span className="text-white font-bold text-sm">تفعيل الغفوة (Snooze) 😴</span>
            <input type="checkbox" className="w-5 h-5 accent-[#D4AF37]" defaultChecked />
          </label>
        </div>
        
        <div className="mt-8 flex gap-3">
          <button onClick={() => setShowNotificationSettings(false)} className="flex-1 bg-[#D4AF37] text-[#0b1329] font-black py-3 rounded-xl hover:bg-[#FACC15] transition-all">حفظ الإعدادات</button>
          <button onClick={() => setShowNotificationSettings(false)} className="flex-1 border border-white/20 text-white font-black py-3 rounded-xl hover:bg-white/5 transition-all">إلغاء</button>
        </div>
      </div>
    </div>
  )}
  `;
  // Add rendering to return
  content = content.replace('{showEventModal && (', uiInjection + '\n      {showEventModal && (');
  
  // Add a button in the UI for the alert
  content = content.replace('onClick={() => setSelectedEvent(event)}', 'onClick={() => setSelectedEvent(event)} onContextMenu={(e) => { e.preventDefault(); toggleAlertPanel(event); }} title="كليك يمين لضبط التنبيه المسبق"');
  
  fs.writeFileSync('src/components/CalendarModule.tsx', content, 'utf-8');
  console.log('injected calendar alerts');
} else {
  console.log('calendar alerts already injected');
}
