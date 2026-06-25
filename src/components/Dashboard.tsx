import React from 'react';
import { 
  Briefcase, Scale, Users, FileText, CheckCircle2, Clock, 
  ChevronLeft, AlertCircle, Plus, Calendar as CalendarIcon, Wallet
} from 'lucide-react';
import { Case, Client, Invoice, Task, Hearing } from '@/types';
import moment from 'moment-hijri';

interface DashboardProps {
  cases?: Case[];
  clients?: Client[];
  invoices?: Invoice[];
  tasks?: Task[];
  hearings?: Hearing[];
  onNavigate?: (tab: string) => void;
  currentUser?: any;
}

export default function Dashboard({
  cases = [],
  clients = [],
  invoices = [],
  tasks = [],
  hearings = [],
  onNavigate,
  currentUser
}: DashboardProps) {

  // حساب الإحصائيات
  const activeCasesCount = cases.filter(c => c.status === 'active' || c.status === 'pending').length;
  const hearingsCount = hearings.length;
  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  const overdueTasksCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6" dir="rtl">
      
      {/* البانر الترحيبي العريض */}
      <div className="w-full bg-gradient-to-l from-[#1e3461] to-[#162040] rounded-2xl p-6 mb-6 relative overflow-hidden shadow-sm border border-[#243460]">
        <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-white text-xl font-black mb-1">
              مرحباً بعودتك، {currentUser?.name || 'الأستاذ الكريم'}
            </h2>
            <p className="text-[#8899bb] text-xs font-bold">
              لديك اليوم <span className="text-[#c9a84c]">{hearingsCount} جلسات</span> مجدولة، و <span className="text-[#c9a84c]">{overdueTasksCount} مهام</span> تتطلب إجراء.
            </p>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('cases')}
            className="bg-[#c9a84c] hover:bg-[#a67c30] text-[#1a2744] text-xs font-black px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            إضافة قضية جديدة
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات العلوية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#ffffff] rounded-2xl p-4 border border-[#e5e7eb] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 bg-[#f3f4f6] rounded-2xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#c9a84c]" />
            </div>
            <span className="text-[#10b981] bg-[#d1fae5] px-2 py-0.5 rounded-full text-[10px] font-bold">+12%</span>
          </div>
          <h3 className="text-[#94a3b8]0 text-xs font-bold mb-1">إجمالي القضايا النشطة</h3>
          <p className="text-[#1a2744] text-2xl font-black">{activeCasesCount} <span className="text-sm font-bold text-[#94a3b8]">قضية</span></p>
        </div>

        <div className="bg-[#ffffff] rounded-2xl p-4 border border-[#e5e7eb] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 bg-[#f3f4f6] rounded-2xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#c9a84c]" />
            </div>
            <span className="text-[#10b981] bg-[#d1fae5] px-2 py-0.5 rounded-full text-[10px] font-bold">+5%</span>
          </div>
          <h3 className="text-[#94a3b8]0 text-xs font-bold mb-1">الجلسات المجدولة هذا الأسبوع</h3>
          <p className="text-[#1a2744] text-2xl font-black">{hearingsCount} <span className="text-sm font-bold text-[#94a3b8]">جلسة</span></p>
        </div>

        <div className="bg-[#ffffff] rounded-2xl p-4 border border-[#e5e7eb] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 bg-[#f3f4f6] rounded-2xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#c9a84c]" />
            </div>
          </div>
          <h3 className="text-[#94a3b8]0 text-xs font-bold mb-1">العملاء النشطون</h3>
          <p className="text-[#1a2744] text-2xl font-black">{activeClientsCount} <span className="text-sm font-bold text-[#94a3b8]">عميل</span></p>
        </div>

        <div className="bg-[#ffffff] rounded-2xl p-4 border border-[#e5e7eb] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 bg-[#f3f4f6] rounded-2xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#c9a84c]" />
            </div>
          </div>
          <h3 className="text-[#94a3b8]0 text-xs font-bold mb-1">الفواتير المستحقة</h3>
          <p className="text-[#1a2744] text-2xl font-black">{invoices.filter(i => i.status === 'unpaid').length} <span className="text-sm font-bold text-[#94a3b8]">فاتورة</span></p>
        </div>
      </div>

      {/* القسم السفلي: المهام العاجلة والجلسات القادمة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* المهام العاجلة */}
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
            <h3 className="text-[#1a2744] text-sm font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              المهام العاجلة والمتأخرة
            </h3>
            <button onClick={() => onNavigate && onNavigate('tasks')} className="text-[#c9a84c] text-[11px] font-bold hover:underline">
              عرض الكل
            </button>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto max-h-[300px]">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 hover:bg-[#f3f4f6] rounded-2xl transition-colors border border-transparent hover:border-[#e5e7eb]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1a2744] mb-0.5">{task.title}</h4>
                    <p className="text-[10px] text-[#94a3b8]0 font-medium">مربوطة بقضية رقم: {task.caseId?.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    متأخرة
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-[#94a3b8]0 text-sm">لا توجد مهام عاجلة حالياً</div>
            )}
          </div>
        </div>

        {/* الجلسات القادمة */}
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
            <h3 className="text-[#1a2744] text-sm font-black flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c9a84c]" />
              الجلسات القادمة
            </h3>
            <button onClick={() => onNavigate && onNavigate('calendar')} className="text-[#c9a84c] text-[11px] font-bold hover:underline">
              عرض التقويم
            </button>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto max-h-[300px]">
            {hearings.slice(0, 5).map(hearing => (
              <div key={hearing.id} className="flex items-center justify-between p-3 hover:bg-[#f3f4f6] rounded-2xl transition-colors border border-transparent hover:border-[#e5e7eb]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-blue-600 text-[10px] font-black uppercase">
                      {moment(hearing.date).format('MMM')}
                    </span>
                    <span className="text-blue-700 text-sm font-black leading-none mt-0.5">
                      {moment(hearing.date).format('DD')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1a2744] mb-0.5 line-clamp-1">{hearing.title || 'جلسة مرافعة'}</h4>
                    <p className="text-[10px] text-[#94a3b8]0 font-medium">المحكمة: {hearing.court || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-[11px] font-bold text-[#94a3b8] bg-[#0a1628] px-2 py-1 rounded-2xl">
                    {hearing.time || '09:00 ص'}
                  </span>
                </div>
              </div>
            ))}
            {hearings.length === 0 && (
              <div className="text-center py-8 text-[#94a3b8]0 text-sm">لا توجد جلسات قادمة</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
