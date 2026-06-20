
import React from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Hearing } from '@/types';

interface HearingsModalProps {
  hearings: Hearing[];
  onClose: () => void;
}

export const HearingsModal: React.FC<HearingsModalProps> = ({ hearings, onClose }) => {
  const addToCalendar = (hearing: Hearing) => {
    const start = new Date(`${hearing.date}T${hearing.time || '09:00:00'}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // Assume 1 hour
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:جلسة قضائية: ${hearing.caseName}`,
      `DTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DESCRIPTION:موعد جلسة قضائية في ${hearing.courtName}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hearing_${hearing.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#0f172a] rounded-2xl w-full max-w-lg p-6 border border-[#1e3a8a] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-amber-500">تنبيه: جلسات قضائية قريبة</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {hearings.map(hearing => (
            <div key={hearing.id} className="bg-[#020617] p-4 rounded-xl border border-[#1e3a8a]">
              <h3 className="font-bold text-white mb-2">{hearing.caseName}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{hearing.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{hearing.time}</span>
                </div>
              </div>
              <button
                onClick={() => addToCalendar(hearing)}
                className="w-full py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-600 transition"
              >
                إضافة إلى التقويم
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
