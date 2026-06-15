import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { CheckCircle, Clock, AlertTriangle, Timer } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickTasksProps {
  tasks: Task[];
}

function CountdownTimer({ targetDate, taskTitle, status }: { targetDate: string, taskTitle: string, status?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0 || status === 'done' || status === 'completed') {
        setTimeLeft(null);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ d, h, m, s });

      // Notify if less than 60 minutes and not notified yet
      if (d === 0 && h === 0 && m < 60 && !hasNotified) {
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('⚠️ تنبيه: اقتراب انتهاء المهمة', {
              body: `المهمة "${taskTitle}" لم تنتهِ والموعد النهائي يقترب جداً (أقل من ساعة)!`,
              dir: 'rtl',
              icon: '/favicon.ico',
              tag: `task-deadline-${taskTitle}`
            });
            setHasNotified(true);
          } catch (e) {
            console.warn("Notification error", e);
          }
        }
      }
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate, taskTitle, hasNotified, status]);

  if (status === 'done' || status === 'completed') {
    return <span className="text-emerald-500 font-black flex items-center gap-1"><CheckCircle className="w-3 h-3" /> منجزة</span>;
  }

  if (!timeLeft) return <span className="text-rose-500 font-black animate-pulse flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> انتهى الوقت!</span>;

  const isLowTime = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m < 60;
  const isUrgent = timeLeft.d === 0 && timeLeft.h < 3;

  return (
    <div className={`flex items-center gap-1 font-mono text-[10px] font-black transition-all ${isLowTime ? 'scale-110 bg-rose-500/10 px-2 py-0.5 rounded-lg' : ''}`}>
      {timeLeft.d > 0 && <span className="text-slate-200 font-bold">{timeLeft.d}ي</span>}
      <span className={isUrgent ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}>
        {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
      </span>
      {isLowTime && (
        <div className="absolute inset-0 bg-rose-500/5 animate-pulse rounded-full -z-10" />
      )}
    </div>
  );
}

export default function QuickTasks({ tasks }: QuickTasksProps) {
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'completed').slice(0, 10);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Timer className="w-32 h-32 text-white" />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-black text-white flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl text-primary">
            <CheckCircle className="w-5 h-5" />
          </div>
          المهام المجدولة (المتابعة الزمنية)
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-200 font-bold px-3 py-1 rounded-full font-black uppercase tracking-widest">
          المتبقي / الأولوية
        </span>
      </div>

      <div className="space-y-3 relative z-10">
        {pendingTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-700 font-bold">
            لا توجد مهام نشطة حالياً. استمتع بيومك!
          </div>
        ) : (
          pendingTasks.map(task => {
            const isUrgent = task.priority === 'high';
            return (
              <motion.div 
                key={task.id} 
                className={`group/item bg-slate-950/50 backdrop-blur-sm border p-4 rounded-2xl flex items-center justify-between transition-all ${isUrgent ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-800'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-primary'}`} />
                  <div>
                    <p className={`text-xs font-black transition-colors ${isUrgent ? 'text-rose-200' : 'text-white font-bold group-hover/item:text-white'}`}>
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-700 font-bold mt-1 line-clamp-1">{task.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <CountdownTimer targetDate={task.dueDate} taskTitle={task.title} status={task.status} />
                  <div className="flex items-center gap-2">
                    {isUrgent && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                    <span className={`text-[11px] px-2 py-0.5 rounded-lg font-black uppercase ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-700'}`}>
                      {task.priority === 'high' ? 'عاجل' : 'عادي'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
