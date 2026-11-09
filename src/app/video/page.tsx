import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevFlow Events · Video Oficial",
  description: "Presentación cinematográfica de la plataforma integral para eventos de gala.",
};

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-[#020813] text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-[#D4AF37]/30">
      {/* Glows ambientales */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-[#0552AC]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-10 w-[400px] h-[300px] bg-gradient-to-t from-[#8B5CF6]/15 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 relative z-10 border-b border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white/80 hover:text-white transition group"
        >
          <span className="material-symbols-outlined text-[20px] text-[#D4AF37] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          <span className="text-sm font-semibold tracking-wide">Volver al Evento</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            Video Reel 9:16
          </span>
        </div>
      </header>

      {/* Main Video Presentation */}
      <main className="w-full max-w-4xl flex flex-col items-center text-center my-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#D4AF37] font-semibold mb-3">
          <span className="material-symbols-outlined text-[15px]">movie</span>
          <span>DevFlow Events · Commercial Reel</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white max-w-2xl">
          La Evolución de los Grandes Eventos
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md">
          Locución oficial sincronizada con invitaciones dinámicas, pases QR, escáner en puerta y pantallas LED.
        </p>

        {/* Video Player Card */}
        <div className="mt-6 w-full max-w-[360px] sm:max-w-[390px] rounded-3xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/15 bg-black/60 relative aspect-[9/16]">
          <video
            src="/videos/promo-reels.mp4"
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          >
            Tu navegador no soporta la reproducción de video HTML5.
          </video>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <a
            href="/videos/promo-reels.mp4"
            download="DevFlow_Events_Promo_Reels.mp4"
            className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c29d2b] text-[#001F54] font-bold text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 transition hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Descargar Video MP4 (18.7 MB)</span>
          </a>

          <a
            href="https://api.whatsapp.com/send?text=Mira%20el%20video%20oficial%20de%20DevFlow%20Events%3A%20https%3A%2F%2Fdevflow-events-showcase.vercel.app%2Fvideo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Compartir por WhatsApp</span>
          </a>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-4xl py-4 border-t border-white/5 text-center text-xs text-slate-500 relative z-10">
        <span>© 2026 DevFlow Events · Calidad Ultra HD 1080x1920 · 60s Reel</span>
      </footer>
    </div>
  );
}
