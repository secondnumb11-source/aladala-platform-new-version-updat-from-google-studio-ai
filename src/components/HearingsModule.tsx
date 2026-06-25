import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Pencil, Trash2, X, CheckCircle2, 
  Calendar as CalendarIcon, Loader2, Clock, MapPin, 
  Search, ShieldAlert, Sparkles, Filter, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';

interface HearingsModuleProps {
  onUpdateState?: (type: string, data: any) => void;
}

export default function HearingsModule({ onUpdateState }: HearingsModuleProps) {
  // === States في بداية المكوّن ===
  const [hearings, setHearings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editingHearing, setEditingHearing] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // حقول التعديل
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCourt, setEditCourt] = useState('');
  const [editHall, setEditHall] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // تحميل مواعيد الجلسات من Supabase
  const loadHearings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hearings')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data) {
        setHearings(data.map((h: any) => ({
          id: h.id,
          date: h.date || h.session_date || '',
          time: h.time || h.session_time || '09:00',
          courtName: h.court_name || h.courtName || '',
          court_name: h.court_name || h.courtName || '',
          hall: h.hall || h.hall_number || h.hallNumber || '',
          status: h.status || 'upcoming',
          notes: h.notes || '',
          caseNumber: h.case_number || h.caseNumber || '',
          caseName: h.case_name || h.caseName || 'جلسة قضائية',
          fromDashboard: h.from_dashboard || h.fromDashboard || false,
          source: h.source || '',
          title: h.title || h.case_name || h.caseName || '',
          raw: h.raw || null
        })));
      }
    } catch (err) {
      console.error('[HearingsModule load errors]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHearings();
  }, []);

  // ===== دالة فتح نافذة التعديل =====
  const handleOpenEdit = (hearing: any) => {
    setEditingHearing(hearing);
    setEditDate(
      hearing.date || hearing.sessionDate || ''
    );
    setEditTime(
      hearing.time || hearing.sessionTime || '09:00'
    );
    setEditCourt(
      hearing.courtName || hearing.court_name || ''
    );
    setEditHall(
      hearing.hall || hearing.hallNumber || ''
    );
    setEditStatus(
      hearing.status || 'upcoming'
    );
    setEditNotes(hearing.notes || '');
    setIsEditModalOpen(true);
  };

  // ===== دالة حفظ التعديل =====
  const handleSaveEdit = async () => {
    if (!editingHearing?.id || !editDate) {
      alert('يرجى تحديد التاريخ');
      return;
    }

    try {
      const { error } = await supabase
        .from('hearings')
        .update({
          date: editDate,
          time: editTime || '09:00',
          court_name: editCourt || null,
          hall: editHall || null,
          status: editStatus || 'upcoming',
          notes: editNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingHearing.id);

      if (error) throw error;

      // تحديث State
      setHearings((prev: any[]) => prev.map(h =>
        h.id === editingHearing.id
          ? {
              ...h,
              date: editDate,
              time: editTime,
              courtName: editCourt,
              court_name: editCourt,
              hall: editHall,
              status: editStatus,
              notes: editNotes
            }
          : h
      ));

      // تزامن و إشعار الـ state العابرة إذا لزم الأمر
      if (onUpdateState) {
        onUpdateState('hearings_reload', true);
      }

      setIsEditModalOpen(false);
      setEditingHearing(null);
      alert('✅ تم تعديل الموعد بنجاح');

    } catch(err: any) {
      alert('فشل التعديل: ' + err.message);
    }
  };

  // ===== دالة الحذف =====
  const handleDeleteHearing = async (hearing: any) => {
    const confirmed = confirm(
      `⚠️ حذف هذا الموعد نهائياً؟\n\n` +
      `📅 ${hearing.date || hearing.sessionDate}\n` +
      `⏰ ${hearing.time || hearing.sessionTime || ''}\n` +
      `🏛️ ${hearing.courtName || hearing.court_name || ''}\n` +
      `القضية: ${hearing.caseNumber || hearing.case_number || ''}`
    );

    if (!confirmed) return;

    setIsDeleting(hearing.id);

    try {
      const { error } = await supabase
        .from('hearings')
        .delete()
        .eq('id', hearing.id);

      if (error) throw error;

      setHearings((prev: any[]) =>
        prev.filter(h => h.id !== hearing.id)
      );

      if (onUpdateState) {
        onUpdateState('hearings_reload', true);
      }

      setDeleteSuccess(
        `تم حذف موعد ${hearing.date || ''}`
      );
      setTimeout(() => setDeleteSuccess(''), 3000);

    } catch(err: any) {
      alert('فشل الحذف: ' + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  // تفريغ وتصفية لمواعيد الجلسات بناء على البحث والفلتر
  const filteredHearings = hearings.filter(h => {
    const matchesSearch = 
      (h.caseName || '').includes(searchTerm) || 
      (h.caseNumber || '').includes(searchTerm) || 
      (h.courtName || '').includes(searchTerm) || 
      (h.notes || '').includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && h.status === statusFilter;
  });

  // توليد أيام أجندة شهر يونيو 2026 بشكل ديناميكي متفاعل
  const juneDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-06-${dayNum.toString().padStart(2, '0')}`;
    const dayHearings = filteredHearings.filter(h => h.date === dateStr);
    return { dayNum, dateStr, hearings: dayHearings };
  });

  return (
    <div className="space-y-6 text-right relative" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e293b] border border-slate-850 p-6 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              منصة العدالة القضائية الذكية
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white mt-1">
              إدارة مواعيد الجلسات والدوائر القضائية
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-bold leading-relaxed">
              شاشة متكاملة تتيح مراقبة الجلسات وتعديل التفاصيل، الغرف القضائية، الحالة، وحذف المواعيد وإلغائها آلياً من قاعدة البيانات.
            </p>
          </div>
          
          <div className="flex bg-[#0a1220] p-1 border border-slate-800 rounded-2xl shrink-0">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'list' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              عرض القائمة ومحكم السجلات
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'calendar' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              عرض التقويم الجدولي لـ 2026
            </button>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            className="w-full bg-[#050e1e] border border-slate-700/60 rounded-xl pr-10 pl-4 py-2 text-xs font-black text-white outline-none focus:border-amber-500 transition-colors"
            placeholder="البحث برقم القضية، المحكمة، أو الموضوع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto py-1">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'upcoming', 'postponed', 'done', 'cancelled'].map((status) => {
            const labels: Record<string, string> = {
              all: 'جميع الحالات',
              upcoming: 'قادمة',
              postponed: 'مؤجلة',
              done: 'منتهية',
              cancelled: 'ملغاة'
            };
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === status 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-extrabold' 
                    : 'bg-[#050e1e] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Render */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 text-sm font-black">جاري مـزامنة وجلب سجلات مواعيد الجلسات فورياً...</p>
        </div>
      ) : activeTab === 'list' ? (
        // ================= عرض قائمة المواعيد (List View) =================
        <div className="space-y-4">
          {filteredHearings.length === 0 ? (
            <div className="bg-[#0f172a] border border-slate-800 p-12 text-center rounded-3xl space-y-4">
              <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-white text-lg font-black">لا توجد مواعيد جلسات تطابق خيارات التصفية</h3>
              <p className="text-slate-500 text-xs font-bold">يرجى تعديل محددات الفوترة والبحث أو إضافة قضايا ومواعيد جلسات جديدة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHearings.map(hearing => {
                const h = hearing;
                const fromDashboard = h.fromDashboard ||
                  h.source === 'najiz_dashboard_calendar' ||
                  /التقويم العدلي|المواعيد المستقبلية/.test(h.title || h.raw?.text || h.notes || h.caseName || '');

                const sessionTitle = h.title || h.caseName ||
                  (fromDashboard ? 'موعد من التقويم العدلي' : '');

                return (
                  <div key={hearing.id}
                    className={`flex items-start justify-between p-4 border rounded-2xl transition-all group
                      ${fromDashboard 
                        ? 'bg-[#0f2441] border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                        : 'bg-[#0a1628] border-slate-700/50 hover:border-amber-500/30'
                      }`}>

                    {/* بيانات الموعد */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-amber-400 font-bold text-sm">
                          {hearing.date}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {hearing.time || '09:00'}
                        </span>
                        {fromDashboard && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-black">
                            التقويم العدلي
                          </span>
                        )}
                      </div>
                      <p className="text-white font-bold text-sm line-clamp-1 mb-1">
                        {sessionTitle || 'جلسة قضائية'}
                      </p>
                    <p className="text-amber-500 font-bold text-xs">
                      #{hearing.caseNumber || '—'}
                    </p>
                    {hearing.courtName && (
                      <p className="text-slate-400 text-xs mt-0.5">
                        🏛️ {hearing.courtName}
                        {hearing.hall ? ` — القاعة أو الدائرة: ${hearing.hall}` : ''}
                      </p>
                    )}
                    {hearing.notes && (
                      <p className="text-slate-500 text-xs mt-1 italic line-clamp-1 border-r border-slate-700 pr-2">
                        {hearing.notes}
                      </p>
                    )}
                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5
                      rounded-lg font-bold border ${
                      hearing.status === 'upcoming' || hearing.status === 'قادمة'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : hearing.status === 'postponed' || hearing.status === 'مؤجلة'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {hearing.status === 'upcoming' ? 'قادمة' :
                       hearing.status === 'postponed' ? 'مؤجلة' :
                       hearing.status === 'done' ? 'منتهية' :
                       hearing.status === 'cancelled' ? 'ملغاة' :
                       hearing.status || 'قادمة'}
                    </span>
                  </div>

                  {/* أزرار الإجراءات — دائمة الظهور */}
                  <div className="flex flex-col items-end gap-2 shrink-0 mr-3">
                    <button
                      onClick={() => handleOpenEdit(hearing)}
                      className="flex items-center gap-1.5 px-3 py-1.5
                        bg-blue-500/15 hover:bg-blue-500/30
                        text-blue-400 hover:text-blue-300
                        border border-blue-500/20 hover:border-blue-400/40
                        rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="تعديل الموعد"
                    >
                      <Pencil className="w-3 h-3" />
                      تعديل
                    </button>

                    <button
                      onClick={() => handleDeleteHearing(hearing)}
                      disabled={isDeleting === hearing.id}
                      className="flex items-center gap-1.5 px-3 py-1.5
                        bg-red-500/15 hover:bg-red-500/30
                        text-red-400 hover:text-red-300
                        border border-red-500/20 hover:border-red-400/40
                        rounded-xl text-xs font-bold transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="حذف الموعد"
                    >
                      {isDeleting === hearing.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />}
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      ) : (
        // ================= عرض التقويم الجدولي (Calendar View) =================
        <div className="bg-[#07132c] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-black text-white">التقويم الذكي لشهر يونيو 2026</h2>
            </div>
            <span className="text-xs bg-slate-800 text-amber-400 border border-slate-700 px-3 py-1 rounded-xl font-bold">
              مجموع الأحداث المصفاة: {filteredHearings.length}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-amber-500 bg-[#050e1e] py-3 rounded-2xl">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
            <div>السبت</div>
          </div>

          <div className="grid grid-cols-7 gap-2 font-mono">
            {/* Pad with white space is not needed as Jun 1st 2026 is Monday. Monday is column 2. Let's pad 1 day for Sunday before */}
            <div className="bg-slate-900/30 border border-slate-800/40 rounded-xl p-2 h-20 opacity-20 text-[10px] flex items-start justify-end text-slate-500">31 مايو</div>
            
            {juneDays.map((day) => {
              return (
                <div
                  key={day.dateStr}
                  className="bg-[#0c1830] border border-slate-800/80 rounded-2xl p-2 min-h-[140px] flex flex-col justify-between"
                >
                  <span className="text-xs font-extrabold text-white/50 block mb-2">{day.dayNum}</span>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[100px] scrollbar-none">
                    {day.hearings.map(hearing => {
                      const h = hearing;
                      const fromDashboard = h.fromDashboard ||
                        h.source === 'najiz_dashboard_calendar' ||
                        /التقويم العدلي|المواعيد المستقبلية/.test(h.title || h.raw?.text || h.notes || h.caseName || '');

                      const sessionTitle = h.title || h.caseName ||
                        (fromDashboard ? 'موعد من التقويم العدلي' : '');

                      return (
                        <div
                          key={hearing.id}
                          className={`relative group border rounded-lg p-2 mb-1 cursor-pointer transition-all text-right
                            ${fromDashboard 
                              ? 'bg-blue-600/20 border-blue-400 hover:bg-blue-600/30' 
                              : 'bg-amber-600/20 border-amber-500/40 hover:bg-amber-600/30'
                            }`}
                        >
                          {/* محتوى الموعد */}
                          <p className="text-amber-300 text-[10px] font-bold truncate">
                            {hearing.time || '09:00'} — {hearing.caseNumber || ''} {fromDashboard && '📅'}
                          </p>
                          <p className="text-white text-[10px] font-bold truncate">
                            {sessionTitle || ''}
                          </p>
                          <p className="text-slate-300 text-[9px] truncate">
                            {hearing.courtName || ''}
                          </p>

                        {/* أزرار التعديل والحذف — تظهر عند hover */}
                        <div className="absolute top-1 left-1 flex gap-1
                          opacity-0 group-hover:opacity-100 transition-opacity">

                          {/* زر التعديل */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(hearing);
                            }}
                            className="p-1 bg-blue-500/30 hover:bg-blue-500/60
                              rounded-md transition-colors cursor-pointer"
                            title="تعديل الموعد"
                          >
                            <Pencil className="w-3 h-3 text-blue-300" />
                          </button>

                          {/* زر الحذف */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHearing(hearing);
                            }}
                            disabled={isDeleting === hearing.id}
                            className="p-1 bg-red-500/30 hover:bg-red-500/60
                              rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                            title="حذف الموعد"
                          >
                            {isDeleting === hearing.id
                              ? <Loader2 className="w-3 h-3 text-red-300 animate-spin" />
                              : <Trash2 className="w-3 h-3 text-red-300" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== نافذة التعديل ===== */}
      {isEditModalOpen && editingHearing && (
        <div className="fixed inset-0 z-[9999] flex items-center
          justify-center p-4 bg-black/70 backdrop-blur-sm"
          dir="rtl">
          <div className="bg-[#0a1628] border border-slate-700
            rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans">

            {/* رأس النافذة */}
            <div className="flex items-center justify-between
              p-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl
                  border border-blue-500/20">
                  <Pencil className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-base">
                    تعديل الموعد
                  </h2>
                  <p className="text-amber-400 text-xs mt-0.5 font-bold">
                    #{editingHearing.caseNumber ||
                      editingHearing.case_number || '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingHearing(null);
                }}
                className="p-2 text-slate-400 hover:text-white
                  hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* حقول التعديل */}
            <div className="p-5 space-y-4">

              {/* التاريخ والوقت */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs
                    font-bold mb-1.5">
                    📅 تاريخ الجلسة *
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-[#050e21] border border-slate-700
                      text-white rounded-xl px-3 py-2.5 text-sm
                      focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs
                    font-bold mb-1.5">
                    ⏰ وقت الجلسة
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    className="w-full bg-[#050e21] border border-slate-700
                      text-white rounded-xl px-3 py-2.5 text-sm
                      focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* المحكمة والقاعة */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs
                    font-bold mb-1.5">
                    🏛️ المحكمة
                  </label>
                  <input
                    type="text"
                    value={editCourt}
                    onChange={e => setEditCourt(e.target.value)}
                    placeholder="اسم المحكمة"
                    className="w-full bg-[#050e21] border border-slate-700
                      text-white rounded-xl px-3 py-2.5 text-sm
                      placeholder-slate-655 font-bold
                      focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs
                    font-bold mb-1.5">
                    🚪 القاعة / الدائرة
                  </label>
                  <input
                    type="text"
                    value={editHall}
                    onChange={e => setEditHall(e.target.value)}
                    placeholder="رقم القاعة"
                    className="w-full bg-[#050e21] border border-slate-700
                      text-white rounded-xl px-3 py-2.5 text-sm
                      placeholder-slate-655 font-bold
                      focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* الحالة */}
              <div>
                <label className="block text-slate-400 text-xs
                  font-bold mb-1.5">
                  📊 حالة الجلسة
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full bg-[#050e21] border border-slate-700
                    text-white rounded-xl px-3 py-2.5 text-sm font-bold
                    focus:outline-none focus:border-amber-500"
                >
                  <option value="upcoming">قادمة</option>
                  <option value="postponed">مؤجلة</option>
                  <option value="done">منتهية</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-slate-400 text-xs
                  font-bold mb-1.5">
                  📝 ملاحظات
                </label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="ملاحظات إضافية..."
                  className="w-full bg-[#050e21] border border-slate-700
                    text-white rounded-xl px-3 py-2.5 text-sm
                    resize-none placeholder-slate-655 font-bold
                    focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* أزرار */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 flex items-center justify-center
                    gap-2 bg-blue-600 hover:bg-blue-500 text-white
                    font-black py-3 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingHearing(null);
                  }}
                  className="px-5 py-3 border border-slate-600
                    text-slate-400 hover:text-white
                    hover:border-slate-500 rounded-xl transition-colors cursor-pointer text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* رسالة نجاح الحذف */}
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 z-[100]
          flex items-center gap-3 px-5 py-3
          bg-emerald-700 border border-emerald-500
          rounded-2xl shadow-2xl animate-in
          slide-in-from-bottom-4 duration-300 pointer-events-none">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <p className="text-white font-bold text-sm">
            {deleteSuccess}
          </p>
        </div>
      )}

    </div>
  );
}
