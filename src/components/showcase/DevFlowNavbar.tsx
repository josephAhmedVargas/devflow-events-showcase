"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollSpy } from "@/components/guest/useScrollSpy";
import { DigitalPassModal } from "@/components/guest/DigitalPassModal";
import { resetDb, setAdminSession } from "@/demo/db";

const WHATSAPP_URL =
  "https://wa.me/50576922528?text=Hola%2C%20estuve%20explorando%20la%20plataforma%20de%20DevFlow%20Events%20y%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n%20para%20cotizar%20la%20tecnolog%C3%ADa%20de%20un%20evento.";

const DEVFLOW_LOGO_URL =
  "https://res.cloudinary.com/dzezhxhd2/image/upload/v1776909102/dental_flow_logo_mini_plcbg8.png";

const ECOSYSTEM_MODULES = [
  {
    href: "/",
    label: "Invitación",
    icon: "mark_email_read",
    desc: "Experiencia interactiva del invitado",
  },
  {
    href: "/live",
    label: "Muro en Vivo",
    icon: "live_tv",
    badge: "LIVE",
    desc: "Proyección en pantallas LED del salón",
  },
  {
    href: "/admin",
    label: "Centro de Mando",
    icon: "dashboard_customize",
    desc: "Control de acceso QR, mesas y KPIs",
  },
  {
    href: "/recuerdos",
    label: "Recuerdos",
    icon: "auto_stories",
    desc: "Libro eterno con dedicatorias y fotos",
  },
];

const INVITATION_SECTIONS = [
  { id: "inicio", label: "Inicio", href: "#inicio" },
  { id: "itinerario-section", label: "Itinerario", href: "#itinerario-section" },
  { id: "historia-section", label: "Historia", href: "#historia-section" },
  { id: "carta-section", label: "Carta", href: "#carta-section" },
  { id: "etiqueta-section", label: "Etiqueta", href: "#etiqueta-section" },
  { id: "rsvp-section", label: "RSVP", href: "#rsvp-section" },
  { id: "deseos-section", label: "Deseos", href: "#deseos-section" },
];

const SECTION_IDS = INVITATION_SECTIONS.map((s) => s.id);

interface DevFlowNavbarProps {
  identifiedGuest?: any;
  showSectionNav?: boolean;
}

export function DevFlowNavbar({
  identifiedGuest,
  showSectionNav = true,
}: DevFlowNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetToast, setResetToast] = useState(false);
  const activeSectionId = useScrollSpy(SECTION_IDS, 160);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";

  // Cerrar el drawer al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Cerrar drawer con tecla ESC o clic fuera
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileMenuOpen(false);
    const onDown = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -110;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", href);
      }
    }
  };

  const handleResetData = () => {
    resetDb();
    setResetToast(true);
    setTimeout(() => setResetToast(false), 2400);
  };

  return (
    <>
      {/* ── HEADER PRINCIPAL DE DEVFLOW EVENTS ── */}
      <header className="fixed top-0 left-0 right-0 z-50 material-bar border-b border-slate-200/80 transition-all duration-300">
        <div className="w-full max-w-[1440px] mx-auto h-16 md:h-[72px] px-3.5 sm:px-5 lg:px-8 flex items-center justify-between gap-3">
          
          {/* 1. BRAND IDENTITY — Limpio, nítido y en una sola línea */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none"
            aria-label="DevFlow Events - Inicio"
          >
            {/* Logo oficial sobre cápsula blanca nítida */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1.5 shadow-xs border border-slate-200/90 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
              <img
                src={DEVFLOW_LOGO_URL}
                alt="DevFlow Events Logo Oficial"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Nombre de Marca y Badge de Estatus */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[16px] sm:text-[18px] tracking-tight text-[#001F54] font-body leading-none flex items-center">
                DevFlow<span className="text-[#0552AC] font-semibold ml-1">Events</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 text-[10px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Demo
              </span>
            </div>
          </Link>

          {/* 2. CENTRAL SEGMENTED MODULE SWITCHER (Desktop) */}
          <nav
            aria-label="Ecosistema DevFlow Events"
            className="hidden md:flex items-center p-1 rounded-full bg-slate-100/90 backdrop-blur-md border border-slate-200/80 shadow-xs"
          >
            {ECOSYSTEM_MODULES.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.href.startsWith("/admin")) setAdminSession(true);
                  }}
                  className={`relative flex items-center gap-1.5 px-3 lg:px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? "bg-[#001F54] text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:text-[#001F54] hover:bg-white/80 font-medium"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[15px] ${
                      isActive ? "text-[#D4AF37]" : "text-slate-400"
                    }`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. RIGHT ACTION CLUSTER */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Pase VIP Modal Trigger — Visible en Desktop (en móvil ya está en la barra inferior) */}
            <div className="hidden md:block">
              <DigitalPassModal
                initialCode={identifiedGuest?.invitationCode || "VIP-DC-001"}
                initialGuest={identifiedGuest}
              />
            </div>
            {/* Hidden hook para que MobileBottomNav pueda disparar el modal con .click() */}
            <div className="md:hidden">
              <span className="sr-only">
                <DigitalPassModal
                  initialCode={identifiedGuest?.invitationCode || "VIP-DC-001"}
                  initialGuest={identifiedGuest}
                />
              </span>
            </div>

            {/* Cotizar por WhatsApp CTA (Desktop) */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#001F54] hover:bg-[#0552AC] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 border border-[#D4AF37]/30 select-none"
            >
              <svg
                className="w-3.5 h-3.5 fill-emerald-400"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.836.814 2.791.814 3.181 0 5.767-2.587 5.767-5.766 0-3.18-2.586-5.766-5.767-5.766zm9.969 5.766c0 5.503-4.477 9.98-9.97 9.98-1.748 0-3.385-.45-4.819-1.236l-5.211 1.366 1.391-5.085c-.888-1.488-1.391-3.228-1.391-5.087 0-5.504 4.477-9.98 9.97-9.98 5.492 0 9.97 4.476 9.97 9.98z" />
              </svg>
              <span>Cotizar</span>
            </a>

            {/* Botón WhatsApp compacto para Móvil */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Cotizar por WhatsApp"
              className="sm:hidden w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 flex items-center justify-center transition active:scale-95 shrink-0"
            >
              <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.836.814 2.791.814 3.181 0 5.767-2.587 5.767-5.766 0-3.18-2.586-5.766-5.767-5.766zm9.969 5.766c0 5.503-4.477 9.98-9.97 9.98-1.748 0-3.385-.45-4.819-1.236l-5.211 1.366 1.391-5.085c-.888-1.488-1.391-3.228-1.391-5.087 0-5.504 4.477-9.98 9.97-9.98 5.492 0 9.97 4.476 9.97 9.98z" />
              </svg>
            </a>

            {/* Discrete Reset Demo Button (Desktop) */}
            <button
              type="button"
              onClick={handleResetData}
              title="Restaurar base de datos local al estado original"
              className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-slate-500 hover:text-[#001F54] hover:bg-slate-100 transition text-[11px] font-medium"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span>Reset</span>
            </button>

            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
              className="md:hidden w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-[#001F54] flex items-center justify-center transition active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* ── SUB-BAR DE SECCIONES (Desktop únicamente, en vista Invitación) ── */}
        {isHome && showSectionNav && (
          <div className="hidden lg:block border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
            <div className="max-w-[1440px] mx-auto px-8 h-9 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-[#4B5B76]">
                <span className="font-cinzel text-[#001F54] font-bold">Invitación Oficial</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">4 de Diciembre de 2026</span>
              </div>

              <nav aria-label="Secciones de la Invitación" className="flex items-center gap-1">
                {INVITATION_SECTIONS.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={sec.href}
                      onClick={(e) => handleNavClick(e, sec.href)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                        isActive
                          ? "bg-[#0552AC] text-white font-semibold shadow-xs"
                          : "text-[#4B5B76] hover:text-[#001F54] hover:bg-slate-100/80 font-medium"
                      }`}
                    >
                      {sec.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* ── MOBILE DRAWER / SHEET ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            ref={drawerRef}
            className="fixed top-16 left-0 right-0 max-h-[calc(100dvh-64px)] overflow-y-auto bg-white/95 backdrop-blur-2xl border-b border-slate-200 shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300"
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#001F54]">DevFlow Events OS</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Showcase Gala
              </span>
            </div>

            {/* Modules list */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                Módulos de la Plataforma
              </span>
              {ECOSYSTEM_MODULES.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (item.href.startsWith("/admin")) setAdminSession(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl transition ${
                      isActive
                        ? "bg-[#001F54] text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isActive ? "text-[#D4AF37]" : "text-[#0552AC]"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">{item.label}</span>
                        <span
                          className={`text-[11px] leading-tight ${
                            isActive ? "text-white/70" : "text-slate-500"
                          }`}
                        >
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    {item.badge && !isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Invitation Section jumps (only if on Home) */}
            {isHome && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                  Secciones de la Invitación
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {INVITATION_SECTIONS.map((sec) => (
                    <a
                      key={sec.id}
                      href={sec.href}
                      onClick={(e) => {
                        handleNavClick(e, sec.href);
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
                    >
                      {sec.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#001F54] hover:bg-[#0552AC] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <svg className="w-4 h-4 fill-emerald-400" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.836.814 2.791.814 3.181 0 5.767-2.587 5.767-5.766 0-3.18-2.586-5.766-5.767-5.766zm9.969 5.766c0 5.503-4.477 9.98-9.97 9.98-1.748 0-3.385-.45-4.819-1.236l-5.211 1.366 1.391-5.085c-.888-1.488-1.391-3.228-1.391-5.087 0-5.504 4.477-9.98 9.97-9.98 5.492 0 9.97 4.476 9.97 9.98z" />
                </svg>
                <span>Cotizar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleResetData();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#001F54] hover:bg-slate-50 font-medium text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Restaurar datos de la demo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST DE RESTAURACIÓN ── */}
      {resetToast && (
        <div className="fixed bottom-6 right-6 z-[99999] px-4 py-2.5 rounded-2xl bg-[#001F54] text-white shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 border border-[#D4AF37]/40">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>Datos de la demo restaurados exitosamente</span>
        </div>
      )}
    </>
  );
}
