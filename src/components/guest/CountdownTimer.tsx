"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // ISO string
}

export function CountdownTimer({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div id="countdown" className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      <div className="p-5 md:p-6 rounded-2xl bg-white border-2 border-[#0552AC]/20 hover:border-[#0552AC] shadow-md shadow-[#0552AC]/5 flex flex-col items-center justify-center text-center transition group hover:-translate-y-0.5">
        <span className="font-headline text-4xl md:text-5xl text-[#0552AC] font-bold tracking-tight tabular-nums">
          {pad(timeLeft.days)}
        </span>
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#4B5B76] mt-2 font-bold font-cinzel">
          Días
        </span>
      </div>

      <div className="p-5 md:p-6 rounded-2xl bg-white border-2 border-[#0552AC]/20 hover:border-[#0552AC] shadow-md shadow-[#0552AC]/5 flex flex-col items-center justify-center text-center transition group hover:-translate-y-0.5">
        <span className="font-headline text-4xl md:text-5xl text-[#0552AC] font-bold tracking-tight tabular-nums">
          {pad(timeLeft.hours)}
        </span>
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#4B5B76] mt-2 font-bold font-cinzel">
          Horas
        </span>
      </div>

      <div className="p-5 md:p-6 rounded-2xl bg-white border-2 border-[#0552AC]/20 hover:border-[#0552AC] shadow-md shadow-[#0552AC]/5 flex flex-col items-center justify-center text-center transition group hover:-translate-y-0.5">
        <span className="font-headline text-4xl md:text-5xl text-[#0552AC] font-bold tracking-tight tabular-nums">
          {pad(timeLeft.minutes)}
        </span>
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#4B5B76] mt-2 font-bold font-cinzel">
          Minutos
        </span>
      </div>

      <div className="p-5 md:p-6 rounded-2xl bg-white border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-md shadow-[#D4AF37]/10 flex flex-col items-center justify-center text-center transition group hover:-translate-y-0.5 bg-gradient-to-b from-white to-[#FDF7E7]/30">
        <span className="font-headline text-4xl md:text-5xl text-[#D4AF37] font-bold tracking-tight tabular-nums">
          {pad(timeLeft.seconds)}
        </span>
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] mt-2 font-bold font-cinzel">
          Segundos
        </span>
      </div>
    </div>
  );
}
