import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DevFlow Events · Video Oficial",
  description: "Presentación cinematográfica de la plataforma integral para eventos de gala.",
};

const WHATSAPP_COTIZAR_URL =
  "https://wa.me/50576922528?text=Hola%2C%20estuve%20explorando%20la%20plataforma%20de%20DevFlow%20Events%20y%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n%20para%20cotizar%20la%20tecnolog%C3%ADa%20de%20un%20evento.";

export default function VideoPlayerPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans">
      {/* Glows ambientales */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#0552AC]/20 via-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition group"
        >
          <span className="material-symbols-outlined text-[20px] text-[#D4AF37] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          <span>Volver a la Demo</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
            Video Reel 9:16
          </span>
        </div>
      </header>

      {/* Main Container */}
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

        {/* Action CTAs */}
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <a
            href="/videos/promo-reels.mp4"
            download="DevFlow_Events_Promo_Reels.mp4"
            className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c29d2b] text-[#001F54] font-bold text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 transition hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Descargar Video MP4 (21.2 MB)</span>
          </a>

          <a
            href={WHATSAPP_COTIZAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#25D366]/25 flex items-center gap-2 transition hover:scale-105"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Cotizar por WhatsApp</span>
          </a>

          <a
            href="https://api.whatsapp.com/send?text=Mira%20el%20video%20oficial%20de%20DevFlow%20Events%3A%20https%3A%2F%2Fdevflow-events-showcase.vercel.app%2Fvideo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/15 font-semibold text-xs sm:text-sm flex items-center gap-2 transition hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Compartir</span>
          </a>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-4xl py-4 border-t border-white/5 text-center text-xs text-slate-500 relative z-10">
        <span>© 2026 DevFlow Events · Calidad Ultra HD 1080x1920 · 70s Reel</span>
      </footer>
    </div>
  );
}
