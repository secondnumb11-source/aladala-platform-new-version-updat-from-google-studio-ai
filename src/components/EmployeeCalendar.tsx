import React from 'react';
import { Task } from '@/types';
import { Calendar as CalendarIcon } from 'lucide-react';

interface EmployeeCalendarProps {
  tasks: Task[];
}

export default function EmployeeCalendar({ tasks }: EmployeeCalendarProps) {
  const upcomingTasks = tasks
    .filter(t => new Date(t.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="bg-slate-950 border border-[#D4AF37]/30 rounded-[24px] p-6 shadow-xl">
      <h3 className="text-sm font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5" />
        تقويم المواعيد القريبة
      </h3>
      <div className="space-y-3">
        {upcomingTasks.map(task => {
          const isNear = (new Date(task.dueDate).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;
          return (
            <div key={task.id} className={`p-3 rounded-xl border ${isNear ? 'bg-amber-500/10 border-amber-500' : 'bg-slate-900 border-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${isNear ? 'text-amber-400' : 'text-slate-200'}`}>{task.title}</span>
                <span className="text-[10px] text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
