import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function TaskCountdown({ dueDate, status }: { dueDate: string, status?: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
    isNear: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false, isNear: false });

  useEffect(() => {
    const calculateTime = () => {
      if (!dueDate) return;
      const targetTime = new Date(dueDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true, isNear: false });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // "Near" if less than 2 hours remaining
      const totalMinutes = days * 1440 + hours * 60 + minutes;
      const isNear = totalMinutes < 120 && totalMinutes > 0;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isOverdue: false,
        isNear
      });
    };

    calculateTime();
    if (status === 'completed' || status === 'done') return; 

    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [dueDate, status]);

  if (!dueDate || status === 'completed' || status === 'done') return null;

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-300 ${
      timeLeft.isOverdue 
        ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' 
        : timeLeft.isNear
          ? 'bg-amber-500 border-amber-400 text-white animate-pulse shadow-lg shadow-amber-500/20'
          : 'bg-slate-900 border-slate-800 text-amber-400'
    }`}>
      <Clock className={`w-3.5 h-3.5 shrink-0 ${timeLeft.isNear ? 'animate-spin' : ''}`} />
      <div className="flex bg-transparent items-center gap-1 text-[11px] font-black tracking-tighter" dir="ltr">
        {timeLeft.isOverdue ? (
          <span className="font-sans">منتهي</span>
        ) : (
          <div className="flex gap-1 items-center font-mono">
            {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
            <span>{timeLeft.hours.toString().padStart(2, '0')}:</span>
            <span>{timeLeft.minutes.toString().padStart(2, '0')}:</span>
            <span className="opacity-70">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
