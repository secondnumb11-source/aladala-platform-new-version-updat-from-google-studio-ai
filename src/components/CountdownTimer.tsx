import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeftObj = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };

      if (difference > 0) {
        timeLeftObj = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return timeLeftObj;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] font-black">
      <div className="flex flex-col items-center bg-rose-100 text-rose-700 px-2 py-1 rounded shadow-sm border border-rose-200">
        <span>{timeLeft.days}</span>
        <span className="text-[7px] opacity-70">يوم</span>
      </div>
      <span className="text-rose-400">:</span>
      <div className="flex flex-col items-center bg-rose-50 text-rose-600 px-2 py-1 rounded shadow-sm border border-rose-100">
        <span>{timeLeft.hours}</span>
        <span className="text-[7px] opacity-70">س</span>
      </div>
      <span className="text-rose-300">:</span>
      <div className="flex flex-col items-center bg-rose-50 text-rose-600 px-2 py-1 rounded shadow-sm border border-rose-100">
        <span>{timeLeft.minutes}</span>
        <span className="text-[7px] opacity-70">ق</span>
      </div>
      <span className="text-rose-200">:</span>
      <div className="flex flex-col items-center bg-rose-50 text-rose-600 px-2 py-1 rounded shadow-sm border border-rose-100">
        <span>{timeLeft.seconds}</span>
        <span className="text-[7px] opacity-70">ث</span>
      </div>
      <Clock className="w-3 h-3 text-rose-500 mr-1 animate-pulse" />
    </div>
  );
}
