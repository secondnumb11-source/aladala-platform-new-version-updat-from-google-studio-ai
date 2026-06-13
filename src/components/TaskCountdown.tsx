import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function TaskCountdown({ dueDate, status }: { dueDate: string, status?: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });

  useEffect(() => {
    const calculateTime = () => {
      if (!dueDate) return;
      const targetTime = new Date(dueDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isOverdue: false
      });
    };

    calculateTime();
    if (status === 'completed' || status === 'done') return; // Pause timer if task is done

    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [dueDate, status]);

  if (!dueDate || status === 'completed' || status === 'done') return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
      timeLeft.isOverdue 
        ? 'bg-rose-50 border-rose-200 text-rose-600' 
        : timeLeft.days === 0 && timeLeft.hours < 24 
          ? 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse'
          : 'bg-slate-50 border-slate-200 text-slate-500'
    }`}>
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <div className="flex bg-transparent items-center gap-1.5 text-[10px] font-black tracking-widest font-mono" dir="ltr">
        {timeLeft.isOverdue ? (
          <span className="text-rose-600 font-sans">متأخر</span>
        ) : (
          <div className="flex gap-1.5 items-center">
            {timeLeft.days > 0 && <span title="أيام">{timeLeft.days}d</span>}
            <span title="ساعات">{timeLeft.hours.toString().padStart(2, '0')}h</span>
            <span title="دقائق" className="opacity-80">{timeLeft.minutes.toString().padStart(2, '0')}m</span>
          </div>
        )}
      </div>
    </div>
  );
}
