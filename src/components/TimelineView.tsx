import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  History, 
  TrendingUp,
  MapPin,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, Hearing, Task } from '@/types';

interface TimelineViewProps {
  cases: Case[];
  hearings: Hearing[];
  tasks: Task[];
}

export default function TimelineView({ cases, hearings, tasks }: TimelineViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | 'all'>('all');

  // Filter and sort events
  const getTimelineEvents = () => {
    let events: any[] = [];

    // Add Hearings
    hearings.forEach(h => {
      events.push({
        id: `h-${h.id}`,
        type: 'hearing',
        date: new Date(h.date),
        title: `جلسة: ${h.courtName}`,
        subtitle: h.caseName,
        status: h.status,
        caseNumber: h.caseNumber,
        icon: <Scale className="w-4 h-4" />,
        color: h.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
      });
    });

    // Add Tasks
    tasks.forEach(t => {
      events.push({
        id: `t-${t.id}`,
        type: 'task',
        date: new Date(t.dueDate),
        title: `مهمة: ${t.title}`,
        subtitle: t.description,
        status: t.status,
        caseNumber: t.caseNumber,
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: t.status === 'completed' ? 'bg-blue-500' : 'bg-slate-400'
      });
    });

    // Filter by case if selected
    if (selectedCaseId !== 'all') {
      const selectedCase = cases.find(c => c.id === selectedCaseId);
      if (selectedCase) {
        events = events.filter(e => e.caseNumber === selectedCase.caseNumber);
      }
    }

    // Sort by date descending (most recent/future first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const events = getTimelineEvents();

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-xl tracking-tight">التسلسل الزمني الإستراتيجي</h3>
            <p className="text-slate-200 font-bold text-xs font-bold font-sans">عرض مرئي لمسار القضايا والمواعيد القضائية السابقة والقادمة.</p>
          </div>
        </div>

        <select 
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
        >
          <option value="all">جميع القضايا</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.caseNumber} - {c.clientName}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        {/* Timeline center line */}
        <div className="absolute top-0 bottom-0 right-[23px] w-0.5 bg-slate-100 hidden md:block" />

        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {events.length > 0 ? (
              events.map((event, idx) => {
                const isFuture = event.date > new Date();
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative flex items-start gap-8 group"
                  >
                    {/* Timeline dot */}
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg z-10 transition-transform ${event.color} ${isFuture ? 'ring-4 ring-amber-500/10' : 'opacity-80'}`}>
                      {isFuture ? <Clock className="w-5 h-5 animate-pulse" /> : event.icon}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${isFuture ? 'bg-amber-100 text-amber-400 font-black' : 'bg-slate-100 text-slate-700'}`}>
                            {isFuture ? 'قادم قريباً' : 'حدث مكتمل'}
                          </span>
                          <span className="text-[10px] text-slate-200 font-bold font-mono font-bold tracking-wider">{event.caseNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-200 font-bold font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.date.toLocaleDateString('ar-SA')}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl transition-all">
                        <h4 className="font-black text-slate-900 text-sm leading-tight uppercase transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-[11px] text-slate-700 font-bold mt-2 leading-relaxed font-sans">
                          {event.subtitle}
                        </p>
                        
                        {event.type === 'hearing' && (
                          <div className="mt-4 flex items-center gap-4 text-[10px] font-black text-slate-200 font-bold uppercase">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-500" />
                              الموقع: المرافعة الرسمية
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 space-y-4">
                <History className="w-12 h-12 text-white font-bold mx-auto" />
                <p className="text-slate-200 font-bold text-sm font-bold font-sans">لا توجد أحداث لعرضها في التسلسل الزمني حالياً.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
