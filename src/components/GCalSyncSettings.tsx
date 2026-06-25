import React, { useState } from 'react';
import { CalendarDays, Link2, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export default function GCalSyncSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState('lawyer_primary');
  const [isLinking, setIsLinking] = useState(false);

  const handleConnect = () => {
    setIsLinking(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsLinking(false);
    }, 2000); // Simulate OAuth connection
  };

  const handleDisconnect = () => {
    if (confirm("هل أنت متأكد من رغبتك في إلغاء ربط تقويم جوجل؟ ستتوقف المزامنة التلقائية للجلسات.")) {
      setIsConnected(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 md:p-10 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#9A7D2C]/10 border border-[#9A7D2C]/30 rounded-2xl mb-4">
            <CalendarDays className="w-5 h-5 text-[#9A7D2C]" />
            <span className="text-sm font-bold text-slate-900 tracking-wide">التقويم الذكي والجدولة</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">إعدادات ربط تقويم جوجل</h1>
          <p className="text-slate-700 font-bold">مزامنة الجلسات القضائية آلياً مع تقويم عموم ومستشاري المكتب (Google Calendar)</p>
        </div>

        {/* Integration Card (Dark Box: Gold & Light Blue Gradient) */}
        <div className="bg-gradient-to-br from-[#9A7D2C] via-[#1E3A8A] to-[#0284C7] border-2 border-[#9A7D2C] rounded-3xl p-8 relative overflow-hidden shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 blur-3xl rounded-full opacity-30"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-white/20 pb-6">
                <div className="bg-[#0a1628] p-3 rounded-2xl shadow-lg">
                  <svg className="w-10 h-10" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M21.53 12.082c0-.833-.075-1.636-.214-2.418H12v4.576h5.342c-.23 1.482-.89 2.738-1.928 3.593v2.983h3.125c1.83-1.685 2.991-4.168 2.991-7.14Z"/>
                    <path fill="#34A853" d="M12 21.782c2.682 0 4.93-.89 6.574-2.417l-3.125-2.983c-.89.597-2.03.95-3.449.95-2.651 0-4.895-1.79-5.698-4.198H3.067v3.082c1.644 3.266 5.067 5.566 8.933 5.566Z"/>
                    <path fill="#FBBC05" d="M6.302 13.134a5.71 5.71 0 0 1-.303-1.834c0-.638.11-1.259.303-1.834v-3.082H3.067A9.458 9.458 0 0 0 2 11.3c0 1.512.358 2.946.996 4.228l3.306-2.394Z"/>
                    <path fill="#EA4335" d="M12 5.01c1.46 0 2.772.502 3.803 1.486l2.853-2.854C16.925 1.956 14.678 1.01 12 1.01 8.134 1.01 4.711 3.31 3.067 6.576L6.302 9.66c.803-2.408 3.047-4.198 5.698-4.198Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-yellow-200 mb-1">Google Calendar</h3>
                  <p className="text-sm text-emerald-300 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-yellow-250 animate-pulse" />
                    آمن ومعتمد ومحمي بالكامل
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-yellow-350 shrink-0 mt-0.5" />
                  <p className="text-sm text-white leading-relaxed font-bold">مزامنة فورية لكافة جلسات المحكمة مع التقويم الخاص بك بمجرد ورودها من ناجز.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-yellow-350 shrink-0 mt-0.5" />
                  <p className="text-sm text-white leading-relaxed font-bold">إضافة رابط البوابة ورقم القضية كمرجع ذكي ووصف داخل الحدث المجدول في التقويم.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-350 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-250 leading-relaxed font-bold">إرسال تذكيرات مسبقة قبل 24 ساعة من انعقاد الجلسة على هاتفك.</p>
                </div>
              </div>

            </div>

            {/* Inner Dark Box inside parent gradient */}
            <div className="bg-slate-950/75 backdrop-blur-md border border-white/20 rounded-2xl p-6 lg:p-8 space-y-6 text-white shadow-2xl">
              {!isConnected ? (
                <div className="text-center space-y-5 py-6">
                  <div className="w-16 h-16 bg-[#0a1628]/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-yellow-350" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white mb-2">التقويم غير متصل</h4>
                    <p className="text-xs text-yellow-100 font-bold leading-relaxed">قم بتسجيل الدخول بحساب جوجل المعتمد للمحامي لربط الجلسات وتفعيل التنبيهات.</p>
                  </div>
                  <button 
                    onClick={handleConnect}
                    disabled={isLinking}
                    className="w-full bg-[#9A7D2C][#b5953c] text-white font-extrabold py-3 px-4 rounded-xl shadow-lg border border-transparent transition-all flex items-center justify-center gap-2"
                  >
                    {isLinking ? (
                      <span className="animate-pulse text-yellow-350 font-black">جاري الاتصال بـ Google...</span>
                    ) : (
                      <>
                        <Link2 className="w-5 h-5 text-yellow-350" />
                        <span>منح صلاحية الربط والمزامنة</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-right">
                  <div className="flex items-center gap-3 p-3 bg-emerald-950/60 border border-emerald-500 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-sm font-black text-emerald-405">متصل بنجاح</p>
                      <p className="text-xs text-yellow-350 font-mono mt-0.5">lawyer.adalah@gmail.com</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-yellow-350 block">حدد التقويم الافتراضي لإدراج الجلسات:</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-white/10 rounded-xl cursor-pointer bg-slate-900/60 transition-colors">
                        <input 
                          type="radio" 
                          name="calendar" 
                          value="lawyer_primary"
                          checked={selectedCalendar === 'lawyer_primary'}
                          onChange={() => setSelectedCalendar('lawyer_primary')}
                          className="w-4 h-4 text-emerald-400 accent-emerald-400" 
                        />
                        <span className="text-sm text-white font-bold">التقويم الأساسي (Primary)</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-white/10 rounded-xl cursor-pointer bg-slate-900/60 transition-colors">
                        <input 
                          type="radio" 
                          name="calendar" 
                          value="lawyer_court_only"
                          checked={selectedCalendar === 'lawyer_court_only'}
                          onChange={() => setSelectedCalendar('lawyer_court_only')}
                          className="w-4 h-4 text-emerald-400 accent-emerald-400" 
                        />
                        <span className="text-sm text-white font-bold">إنشاء تقويم جديد "جلسات المحكمة"</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <button 
                      onClick={handleDisconnect}
                      className="text-xs text-rose-300 font-extrabold transition-colors px-3 py-2"
                    >
                      إلغاء الربط بـ Google
                    </button>
                    <button className="bg-gradient-to-r from-[#9A7D2C] to-[#0284C7] text-white font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-black/30">
                      حفظ إعدادات المزامنة
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
