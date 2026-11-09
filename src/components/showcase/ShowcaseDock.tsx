"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { resetDb, setAdminSession, useIsAdmin } from "@/demo/db";

const WHATSAPP_URL =
  "https://wa.me/50576922528?text=Hola%2C%20estuve%20explorando%20la%20plataforma%20de%20DevFlow%20Events%20y%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n%20para%20cotizar%20la%20tecnolog%C3%ADa%20de%20un%20evento.";

const MODULES = [
  { href: "/", label: "Invitación", hint: "Lo que recibe cada invitado", icon: "mail" },
  { href: "/?code=VIP-DC-001", label: "Invitación personalizada", hint: "Enlace mágico con su mesa y pase", icon: "auto_awesome" },
  { href: "/live", label: "En Vivo", hint: "Muro de fotos y dedicatorias", icon: "live_tv" },
  { href: "/admin", label: "Centro de Mando", hint: "KPIs, mesas, check-in QR", icon: "dashboard" },
  { href: "/recuerdos", label: "Recuerdos", hint: "Archivo post-evento", icon: "auto_stories" },
];

/**
 * Superficie única de DevFlow sobre la demo: identifica quién está detrás,
 * permite saltar entre módulos y reiniciar los datos locales. Flota como
 * material translúcido para no desplazar los encabezados fijos de la app.
 */
export function ShowcaseDock() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [justReset, setJustReset] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // En la invitación móvil hay un dock inferior propio; nos ubicamos encima.
  const hasGuestDock = pathname === "/";

  return (
    <div
      ref={panelRef}
      className={`fixed z-[60] right-3 sm:right-5 ${hasGuestDock ? "bottom-[calc(env(safe-area-inset-bottom)+96px)] lg:bottom-5" : "bottom-[calc(env(safe-area-inset-bottom)+16px)]"}`}
    >
      {open && (
        <div
          role="dialog"
          aria-label="Demo DevFlow Events"
          className="absolute bottom-[calc(100%+10px)] right-0 w-[min(340px,calc(100vw-24px))] max-h-[calc(100dvh-130px)] sm:max-h-[calc(100dvh-120px)] flex flex-col origin-bottom-right animate-in fade-in zoom-in-95 duration-300 rounded-3xl bg-[#0B1220]/92 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/10 overflow-y-auto overscroll-contain no-scrollbar"
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Demo interactiva
              </span>
            </div>
            <p className="mt-2.5 text-[15px] font-semibold leading-snug tracking-[-0.01em]">
              Esto es <span className="text-[#D4AF37]">DevFlow Events</span>: la plataforma completa de una gala real.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              Todo lo que hagas aquí se guarda solo en este navegador. Prueba confirmar asistencia, subir fotos o escanear pases.
            </p>
          </div>

          <nav className="px-2 pb-2" aria-label="Módulos de la demo">
            {MODULES.map((m) => {
              const active = m.href === pathname || (m.href !== "/" && pathname.startsWith(m.href.split("?")[0]));
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => {
                    if (m.href.startsWith("/admin")) setAdminSession(true);
                  }}
                  className={`pressable flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${active ? "bg-white/12" : "hover:bg-white/8"}`}
                >
                  <span className="material-symbols-outlined grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[20px] text-[#D4AF37]">
                    {m.icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[13px] font-semibold">{m.label}</span>
                    <span className="truncate text-[11px] text-white/55">{m.hint}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                resetDb();
                setJustReset(true);
                setTimeout(() => setJustReset(false), 1800);
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/8 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">{justReset ? "check" : "restart_alt"}</span>
              {justReset ? "Datos restaurados" : "Reiniciar datos"}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminSession(false)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/8 hover:text-white"
                title="Ver la invitación como la ve un invitado"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Vista invitado
              </button>
            )}
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable mx-3 mb-3 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-[13px] font-semibold text-[#06260F] hover:brightness-105"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Quiero esto para mi evento
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Abrir menú de la demo DevFlow Events"
        className="flex items-center gap-2 rounded-full bg-[#0B1220]/85 py-2 pl-2 pr-3.5 text-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150 hover:bg-[#0B1220]/95"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8912A] text-[11px] font-black tracking-tight text-[#0B1220]">
          DF
        </span>
        <span className="flex flex-col items-start leading-none">
          <span className="text-[12px] font-semibold tracking-[-0.01em]">DevFlow Events</span>
          <span className="mt-0.5 text-[10px] text-white/60">Demo · toca para explorar</span>
        </span>
        <span
          className={`material-symbols-outlined text-[18px] text-white/70 transition-transform duration-300 ease-[var(--ease-spring-ui)] ${open ? "rotate-180" : ""}`}
        >
          expand_less
        </span>
      </button>
    </div>
  );
}
