import React from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Calendar, ArrowRight, User, PlusCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Hearing, Task } from '@/types';

interface TaskSuggestionsProps {
  hearings: Hearing[];
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => void;
}

export const TaskSuggestions: React.FC<TaskSuggestionsProps> = ({ hearings, tasks, onAddTask }) => {
  // Logic to suggest tasks
  const suggestions = hearings
    .filter(h => {
      const hearingDate = new Date(h.date);
      const diffDays = Math.ceil((hearingDate.getTime() - Date.now()) / (1000 * 3600 * 24));
      return diffDays > 0 && diffDays <= 7;
    })
    .map(h => {
      const existingTask = tasks.find(t => t.caseNumber === h.caseNumber && t.title.includes('تحضير مذكرة'));
      if (existingTask) return null;

      return {
        id: `suggest-${h.id}`,
        title: `تحضير مذكرة الدفاع والمستندات - جلسة ${h.caseNumber}`,
        caseNumber: h.caseNumber,
        assignedTo: 'المحامي المسؤول',
        deadline: new Date(new Date(h.date).getTime() - (24 * 3600 * 1000)).toISOString().split('T')[0], // 1 day before hearing
        priority: 'high' as const,
        description: `بناءً على الجلسة المجدولة بتاريخ ${h.date}، يتطلب النظام تحضير مذكرة الدفاع والمرفقات القانونية اللازمة.`
      };
    })
    .filter(Boolean) as any[];

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-black text-white">اقتراحات المهام الذكية</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {suggestions.map((s, idx) => (
          <motion.div 
            key={s.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#050e21] border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full pointer-events-none"></div>
            
            <div className="flex-1 space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider">اقتراح آلي</span>
                <h4 className="text-xs font-black text-white leading-relaxed">{s.title}</h4>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-200 font-bold font-bold">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-amber-500" />
                  <span>الموعد المقترح: {s.deadline}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-primary" />
                  <span>المسؤول: {s.assignedTo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>أولوية قصوى</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onAddTask(s)}
              className="relative z-10 bg-amber-500 text-slate-950 px-6 py-3 rounded-xl font-black text-[11px] flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/20 shrink-0"
            >
              <span>اعتماد المهمة</span>
              <PlusCircle className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TaskSuggestions;
