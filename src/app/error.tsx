"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Demo: el error solo se registra en la consola del navegador
    console.error("[D'CAROL App Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#F8FAFD] flex flex-col items-center justify-center p-4 selection:bg-[#0552AC] selection:text-white">
      {/* Decorative Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#0552AC]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl border border-[#0552AC]/15 shadow-2xl p-6 sm:p-8 text-center relative z-10 overflow-hidden">
        {/* Heraldic Corner Flourishes */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />

        {/* Crown Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#001F54] to-[#0552AC] text-[#D4AF37] flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-[#D4AF37]/30">
          <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
        </div>

        <span className="font-cinzel text-[11px] uppercase tracking-[0.2em] text-[#0552AC] font-bold block mb-1">
          D'CAROL • MIS XV AÑOS
        </span>

        <h2 className="font-headline text-2xl font-bold text-[#001F54] mb-2 leading-tight">
          Pausa Momentánea de Gala
        </h2>

        <p className="text-xs sm:text-sm text-[#4B5B76] leading-relaxed mb-6">
          Hemos detectado un breve contratiempo de conexión al cargar la experiencia. Tus datos de invitación y pases están completamente seguros.
        </p>

        {error.digest && (
          <div className="mb-6 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500">
            Código de seguimiento: <span className="font-bold text-slate-700">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold uppercase tracking-wider font-cinzel transition shadow-md shadow-[#0552AC]/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Reintentar</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#0552AC]/20 text-[#001F54] hover:bg-[#E8F0FE] text-xs font-bold uppercase tracking-wider font-cinzel transition text-center"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
