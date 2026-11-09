"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface LiveLockedNoticeProps {
  eventDate?: Date | string;
}

export function LiveLockedNotice({ eventDate = "2026-12-04T18:00:00-06:00" }: LiveLockedNoticeProps) {
  const targetDate = new Date(eventDate).getTime();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0D1829] flex flex-col justify-between selection:bg-[#0552AC] selection:text-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#0552AC]/10 via-[#D4AF37]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 py-5 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0552AC] to-[#001F54] flex items-center justify-center text-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-xs group-hover:scale-105 transition-transform">
            <span className="font-cinzel text-base font-bold tracking-wider">DC</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-base text-[#001F54] tracking-tight">
              D&apos;CAROL
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Mis XV Años • 2026
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0552AC] hover:border-[#0552AC]/30 hover:bg-[#E8F0FE]/40 text-xs font-bold transition shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Volver a la Invitación</span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 text-center flex flex-col items-center gap-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F0FE] text-[#0552AC] border border-[#0552AC]/20 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest font-cinzel">
              Modo En Vivo • Disponible el 4 de Diciembre
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="font-headline text-2xl sm:text-4xl font-bold text-[#001F54] tracking-tight leading-tight mb-2">
              La Experiencia En Vivo se Activará en la Recepción
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Durante la noche de gala en el <strong>Hotel Holiday Inn Managua</strong>, este espacio se abrirá automáticamente para que disfrutes de todas las dinámicas interactivas del evento.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="w-full bg-[#F8FAFD] rounded-2xl border border-slate-200/60 p-4 sm:p-5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-cinzel block mb-3">
              Cuenta Regresiva para la Noche de Gala
            </span>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
              {[
                { value: timeLeft.days, label: "Días" },
                { value: timeLeft.hours, label: "Horas" },
                { value: timeLeft.minutes, label: "Minutos" },
                { value: timeLeft.seconds, label: "Segundos" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/70 shadow-2xs">
                  <span className="block text-xl sm:text-3xl font-black text-[#0552AC] font-mono leading-none">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-1 block">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col gap-1.5">
              <span className="material-symbols-outlined text-[#0552AC] text-[22px]">photo_camera</span>
              <strong className="text-xs text-slate-800">Muro de Fotos en Pantalla</strong>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tus selfies se proyectarán en las pantallas gigantes del salón en tiempo real.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col gap-1.5">
              <span className="material-symbols-outlined text-[#D4AF37] text-[22px]">favorite</span>
              <strong className="text-xs text-slate-800">Dedicatorias en Vivo</strong>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Comparte palabras emotivas que Dannia y su familia leerán durante la celebración.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">schedule</span>
              <strong className="text-xs text-slate-800">Itinerario en Vivo</strong>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Acompaña cada momento especial minuto a minuto: entrada, vals, banquete y baile.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <Link
              href="/"
              className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#0552AC] to-[#001F54] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0552AC]/25 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
              <span>Ver mi Invitación Oficial y Confirmar Asistencia</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer link for admin */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 relative z-10">
        <span>¿Eres parte del equipo de coordinación o staff? </span>
        <Link
          href="/login?callbackUrl=/live"
          className="text-[#0552AC] font-bold hover:underline transition"
        >
          Iniciar Sesión como Administrador
        </Link>
      </footer>
    </div>
  );
}
