
import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Download, 
  Building2, AlertCircle 
} from 'lucide-react';
import { Hearing } from '@/types';
import { getDynamicTextColor, getContrastText } from '@/utils/contrastUtils';

interface HearingsModalProps {
  hearings: Hearing[];
  onClose: () => void;
}

export const HearingsModal: React.FC<HearingsModalProps> = ({ hearings = [], onClose }) => {
  // Guard against non-array hearings and filter out nulls
  const safeHearings = React.useMemo(() => {
    try {
      return Array.isArray(hearings) ? hearings.filter(h => h && typeof h === 'object') : [];
    } catch (e) {
      console.error('[HearingsModal] Error processing hearings array:', e);
      return [];
    }
  }, [hearings]);
  
  const formatSafeDate = (dateStr: any): string => {
    try {
      if (!dateStr) return 'غير محدد';
      const date = typeof dateStr === 'string' ? dateStr : String(dateStr);
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return date; 
      }
      return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' });
    } catch (err) {
      console.warn('[Date Formatting Safe Catch]', err);
      return String(dateStr || 'غير محدد');
    }
  };

  const addToCalendar = (hearing: Hearing) => {
    try {
      if (!hearing) return;
      const hearingDate = hearing.date || new Date().toISOString().split('T')[0];
      
      const timeStr = hearing.time ? String(hearing.time) : '09:00';
      const cleanTime = timeStr.includes('صباحاً') 
        ? timeStr.replace('صباحاً', '').trim() 
        : timeStr.includes('مساءً') 
          ? timeStr.replace('مساءً', '').trim() 
          : timeStr.includes('ص')
            ? timeStr.replace('ص', '').trim()
            : timeStr.includes('م')
              ? timeStr.replace('م', '').trim()
              : timeStr.trim();

      let start: Date;
      try {
        // Basic pattern matching for HH:mm
        const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hours = timeMatch[1].padStart(2, '0');
          const minutes = timeMatch[2];
          start = new Date(`${hearingDate}T${hours}:${minutes}:00`);
        } else {
          start = new Date(hearingDate);
        }
        
        if (isNaN(start.getTime())) {
          start = new Date();
        }
      } catch (parseErr) {
        start = new Date();
      }
      
      const end = new Date(start.getTime() + 60 * 60 * 1000); 
    
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:جلسة قضائية: ${hearing.caseName || 'بدون مسمى'}`,
        `DTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `LOCATION:${hearing.courtName || 'المحكمة'}`,
        `DESCRIPTION:موعد جلسة قضائية آلية - نظام المحامي الذكي`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mohamy_hearing_${hearing.id || Date.now()}.ics`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error generating ICS:", e);
      alert('حدث خطأ أثناء إضافة الموعد للتقويم');
    }
  };

  const modalBg = 'bg-[#0f172a]';
  const textColor = getContrastText(modalBg);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 font-sans" dir="rtl">
      <div className={`${modalBg} rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(30,58,138,0.4)] animate-in zoom-in-95 duration-300`}>
        <div className="flex justify-between items-center p-8 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className={`font-black text-xl ${textColor}`}>مراقب الجلسات الذكي</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Trial Monitoring System</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all active:scale-95"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar text-right">
          {!Array.isArray(hearings) || safeHearings.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/5">
                <AlertCircle size={40} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-black text-lg">لا توجد جلسات عاجلة حالياً</p>
              <p className="text-slate-600 text-xs px-10 leading-relaxed">سيتم إخطارك آلياً عند جدولة أي مواعيد جديدة في نظام المحاكم.</p>
            </div>
          ) : (
            safeHearings.map(hearing => (
              <div 
                key={hearing.id} 
                className="bg-white/5 p-6 rounded-[1.5rem] border border-white/5 hover:border-amber-500/40 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -z-10" />
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-white text-lg line-clamp-1 flex-1 ml-4 leading-tight">
                    {hearing.caseName || 'جلسة قضائية غير محددة'}
                  </h3>
                  <div className="flex items-center gap-2 bg-amber-500/20 text-amber-500 px-3 py-1 rounded-xl text-[11px] font-black border border-amber-500/20">
                    <Clock size={14} />
                    {hearing.time || '09:00 ص'}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className={`flex items-center gap-3 text-xs ${getDynamicTextColor(modalBg)} font-bold opacity-80`}>
                    <div className="p-1.5 bg-slate-800 rounded-lg"><Building2 size={14} className="text-slate-500" /></div>
                    <span className="truncate">{hearing.courtName || 'المحكمة المختصة'}</span>
                  </div>
                  <div className={`flex items-center gap-3 text-xs ${getDynamicTextColor(modalBg)} font-bold opacity-80`}>
                    <div className="p-1.5 bg-slate-800 rounded-lg"><Calendar size={14} className="text-slate-500" /></div>
                    <span className="font-mono tracking-tight">{formatSafeDate(hearing.date)}</span>
                  </div>
                </div>

                <button
                  onClick={() => addToCalendar(hearing)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 group"
                >
                  <Download size={18} className="group-hover:bounce" />
                  <span>تثبيت في تقويم الجهاز</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-black/60 border-t border-white/5 flex justify-center items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-[11px] text-slate-500 font-black tracking-widest uppercase">Smart Justice AI Integration System</p>
        </div>
      </div>
    </div>
  );
};
