"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CountdownTimer } from "@/components/guest/CountdownTimer";
import { TableLookup } from "@/components/guest/TableLookup";
import { RsvpForm } from "@/components/guest/RsvpForm";
import { DigitalPassModal } from "@/components/guest/DigitalPassModal";
import { GuestbookSection } from "@/components/guest/GuestbookSection";
import { TopExperienceNav } from "@/components/shared/TopExperienceNav";
import { MobileModeSwitcher } from "@/components/shared/MobileModeSwitcher";
import { MobileBottomNav } from "@/components/guest/MobileBottomNav";
import { PublicDesktopNav } from "@/components/guest/PublicDesktopNav";
import { LifeStagesCarousel } from "@/components/guest/LifeStagesCarousel";
import { CURATED_DEFAULT_STAGE_PHOTOS, StagePhoto } from "@/lib/stages-data";
import { formatTableDisplay } from "@/lib/pass-utils";
import { SpotifyPlaylistSection } from "@/components/guest/SpotifyPlaylistSection";
import { useDemoDb, useIsAdmin } from "@/demo/db";

export default function HomeView() {
  const searchParams = useSearchParams();
  const guestCode = searchParams.get("code") || searchParams.get("invitacion") || searchParams.get("pass") || undefined;
  const isAdmin = useIsAdmin();
  const db = useDemoDb();

  // Equivalente a `db.query.events.findFirst({ with: {...} })` de la app real
  const event: any = {
    ...db.event,
    timelineItems: [...db.timeline].sort((a, b) => a.sortOrder - b.sortOrder),
    tables: db.tables,
    playlists: [db.playlist],
    sections: db.event.sections.map((s: any) =>
      s.sectionKey === "etapas"
        ? { ...s, title: db.stages.title, subtitle: db.stages.subtitle, content: { photos: db.stages.photos } }
        : s
    ),
  };

  let identifiedGuest: any = null;
  if (guestCode) {
    const cleanCode = String(guestCode).trim().toUpperCase();
    const g = db.guests.find((x) => x.invitationCode === cleanCode);
    if (g) {
      const person = db.people.find((p) => p.id === g.personId);
      const assignment = db.assignments.find((a) => a.eventGuestId === g.id);
      const table = db.tables.find((t) => t.id === assignment?.tableId);
      const rsvp = db.rsvps.find((r) => r.eventGuestId === g.id);
      identifiedGuest = {
        guestId: g.id,
        invitationCode: g.invitationCode,
        firstName: person?.firstName || "",
        lastName: person?.lastName || "",
        fullName: `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "Invitado Distinguido",
        maxSeats: g.maxSeats,
        confirmedSeats: g.confirmedSeats,
        status: g.status,
        isVip: g.isVip,
        tableNumber: table?.tableNumber || null,
        tableName: table?.tableName || null,
        tableZone: table?.zone || null,
        rsvp: rsvp
          ? {
              response: rsvp.response,
              confirmedCount: rsvp.confirmedCount,
              attendingCeremony: rsvp.attendingCeremony,
              attendingReception: rsvp.attendingReception,
              guestMessage: rsvp.guestMessage,
              dietaryNotes: rsvp.dietaryNotes,
              songRequest: rsvp.songRequest,
            }
          : null,
      };
    }
  }

  const eventDateIso = event?.eventDate
    ? new Date(event.eventDate).toISOString()
    : "2026-12-04T18:00:00-06:00";

  const dressCode = event?.dressCodes?.[0];
  const etapasSection = event?.sections?.find((s: any) => s.sectionKey === "etapas");
  const stagePhotos: StagePhoto[] =
    etapasSection?.content && Array.isArray((etapasSection.content as any).photos) && (etapasSection.content as any).photos.length > 0
      ? (etapasSection.content as any).photos
      : CURATED_DEFAULT_STAGE_PHOTOS;
  const historiaSection = event?.sections?.find((s: any) => s.sectionKey === "historia");
  const cartaSection = event?.sections?.find((s: any) => s.sectionKey === "carta");
  const playlist = event?.playlists?.[0];

  return (
    <div className="w-full min-h-screen bg-[#F8FAFD] text-[#0D1829] font-body selection:bg-[#0552AC] selection:text-white flex flex-col">
      {/* 1. HEADER DE GALA */}
      <header className="fixed top-0 left-0 right-0 z-50 material-bar">
        {/* Mobile: compact 64px | Desktop: full 72px */}
        <div className="h-16 md:h-[72px] w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-5 lg:px-4 xl:px-6 flex items-center justify-between gap-1.5 xl:gap-3">

          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-white shadow-sm ring-1 ring-[#0552AC]/25 flex items-center justify-center overflow-hidden shrink-0">
              <img
                alt="D'CAROL Logo Oficial Dannia Carolina"
                className="w-full h-full object-contain"
                src={
                  event?.branding?.logoUrl ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBzkp1Gb79UXobRrLQGHnahgOFNMZTmpYE35WrdDdL5Nb06s7zYMlgfaDftGN95HDq4BYfEc3sQOolZoS2E6YmKyJQTSpzw6LZaCwdtqe9qTtO6GBVO_tT0t71WJUi0ZizCVNcBppY5Ji5mEH3s2_Hs4QHsFBsgeQWuKMTBhOZawr4B78VRtcvuMtaNVUXVDG-3oUtD-y47LQt5dWQ_9qcRnsGCFzXvXF1t7W_hL5tf7RMJD-1FtF3xAaV0wWP3Hic"
                }
              />
            </div>
            <div className="flex flex-col shrink-0">
              <span className="font-cinzel text-sm md:text-base tracking-wide text-[#001F54] font-bold leading-tight whitespace-nowrap">
                {event?.profile?.honoreeName || "Dannia Carolina"}
              </span>
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] text-[#4B5B76] font-medium leading-tight whitespace-nowrap">
                Mis XV Años <span className="hidden sm:inline">• Gala 2026</span>
              </span>
            </div>
          </div>

          {/* Desktop Section Nav (centered, hidden on mobile) */}
          <PublicDesktopNav />

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* App switcher: Invitación, En Vivo, Admin, Recuerdos (visible únicamente para el Administrador) */}
            {isAdmin && (
              <div className="hidden md:block">
                <TopExperienceNav isAdmin={true} />
              </div>
            )}

            {/* Pase Digital CTA — visible on all screens */}
            <DigitalPassModal
              initialCode={identifiedGuest?.invitationCode || "VIP-DC-001"}
              initialGuest={identifiedGuest}
            />
          </div>
        </div>
      </header>

      {/* Mode Switcher — mobile/tablet only (visible únicamente para Administrador) */}
      {isAdmin && <MobileModeSwitcher isAdmin={true} />}

      {/* 2. MAIN BODY */}
      {/* pt: 64px header (+ 36px mode bar solo si es admin en móvil) = 100px; 72px en desktop */}
      <main className={`w-full ${isAdmin ? "pt-[100px] md:pt-[72px]" : "pt-[68px] md:pt-[72px]"} flex-1 pb-20 lg:pb-0`} id="inicio">
        {/* Dynamic Event Phase Banner */}
        {event?.phase === "live" && (
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-4">
            <Link
              href="/live"
              className="group block p-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] text-[#001F54] shadow-lg border border-amber-300 hover:scale-[1.005] transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#001F54] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[22px] animate-pulse">live_tv</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] tracking-wider uppercase animate-pulse">
                        En Vivo Ahora
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#001F54]">
                        Modo Evento Activo
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#001F54] mt-0.5">
                      ¡Estamos celebrando los Quince Años de Dannia Carolina! Sube tus fotos y envía dedicatorias en vivo.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 font-bold text-xs bg-[#001F54] text-white px-4 py-2 rounded-full shadow-xs group-hover:bg-[#0552AC] transition-colors shrink-0">
                  <span>Ir al Modo En Vivo</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {event?.phase === "post_event" && (
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-4">
            <Link
              href="/recuerdos"
              className="group block p-4 rounded-2xl bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] text-white shadow-lg border border-[#D4AF37]/50 hover:scale-[1.005] transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#001F54] flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#001F54] font-bold text-[10px] tracking-wider uppercase font-cinzel">
                        Memoria Eterna
                      </span>
                      <span className="text-xs font-semibold text-white/90">
                        Celebración Concluida
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">
                      ¡Gracias por ser parte de una noche soñada! Revive las fotos curadas y dedicatorias en el Libro de Oro.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 font-bold text-xs bg-[#D4AF37] text-[#001F54] px-4 py-2 rounded-full shadow-xs group-hover:bg-amber-300 transition-colors shrink-0 font-cinzel">
                  <span>Abrir Libro de Recuerdos</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Banner de Invitado Identificado por Enlace Personalizado */}
        {identifiedGuest && (
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-4">
            <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border-2 border-[#D4AF37]/50 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-[#001F54] flex items-center justify-center font-bold font-cinzel text-base shadow-md shrink-0">
                  DC
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold font-cinzel">
                      Invitación Oficial de Honor
                    </span>
                    <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded-md text-white font-bold">
                      {identifiedGuest.invitationCode}
                    </span>
                  </div>
                  <p className="text-base md:text-lg font-headline font-bold text-white mt-0.5">
                    ¡Bienvenida, Familia{" "}
                    <span className="text-[#D4AF37]">{identifiedGuest.fullName}</span>!
                  </p>
                  <p className="text-xs text-white/80">
                    Tienes asignados{" "}
                    <strong className="text-white">
                      {identifiedGuest.maxSeats}{" "}
                      {identifiedGuest.maxSeats === 1 ? "lugar de honor" : "lugares de honor"}
                    </strong>{" "}
                    en la{" "}
                    <strong className="text-[#D4AF37]">
                      {formatTableDisplay(identifiedGuest.tableNumber, identifiedGuest.tableName)}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                <a
                  href="#rsvp-section"
                  className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#001F54] hover:bg-white font-bold text-xs uppercase tracking-wider transition font-cinzel shadow-md shadow-[#D4AF37]/20"
                >
                  {identifiedGuest.rsvp ? "Ver / Modificar RSVP" : "Confirmar Mi Lugar"}
                </a>
                <a
                  href="#pase-digital-modal"
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/30 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-white/20"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
                  <span>Descargar Pase</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Decorative Aura Background */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[360px] bg-[#0552AC]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-44 right-10 w-[450px] h-[450px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

          {/* MONOGRAMA INTEGRADO */}
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-8 pb-5 flex flex-col items-center text-center">
            {/* Círculo Heráldico de Gala */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full p-1.5 bg-gradient-to-b from-[#E8F0FE] to-white shadow-xl ring-4 ring-[#0552AC]/20 border-2 border-[#D4AF37]/50 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-inner">
                <img
                  alt="D'CAROL Mis XV 2026 - Dannia Carolina Monograma Oficial"
                  className="w-full h-full object-contain mix-blend-multiply scale-95"
                  src={
                    event?.branding?.monogramUrl ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuD8CTNUTYb-s4cDf4JnXI9USG9RzZJJn5gx9g4_erq0GyQRr8NeA_xutCw7tKZymdM0BhIIDbBqZ8bN3sxc1LwWCYb_nVv4wSxQY0QT0yY8PjAHS2cOrtDc5ofzhhVdYE4BcRxFtsKP6i-OlSZi27vMoI71bHtqEa5C-75egsF1HgiIIebsMprIUF-Kj0KHfukzHOP-RhsX0c_souhk2tTEw2MUNrkSh_rl78ljHu_fb5W2Lcwvb-56xLZp5p6eUKY"
                  }
                />
              </div>
            </div>

            {/* Divider Dorado */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="h-px w-8 md:w-14 bg-[#D4AF37]" />
              <span className="font-cinzel text-[10px] md:text-xs uppercase text-[#0552AC] font-bold tracking-[0.25em]">
                Mis Quince Años
              </span>
              <span className="h-px w-8 md:w-14 bg-[#D4AF37]" />
            </div>

            <h1 className="font-headline text-3xl sm:text-5xl md:text-7xl text-[#001F54] tracking-tight font-bold uppercase mb-2 leading-none">
              {event?.profile?.honoreeName || "Dannia Carolina"}
            </h1>

            <p className="font-cinzel text-xs md:text-sm text-[#D4AF37] tracking-widest font-semibold mt-1">
              MIS XV • 2026
            </p>
            <p className="font-serif italic text-sm text-[#001F54] mt-1.5 max-w-[360px] md:max-w-none font-medium">
              &ldquo;Jehov&aacute; cumplir&aacute; su prop&oacute;sito en m&iacute;; Tu misericordia, oh Jehov&aacute;, es para siempre.&rdquo; &mdash; Salmos 138:8
            </p>
          </div>

          {/* 3. HERO CINEMATOGRÁFICO DE ALTA COSTURA */}
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-[#0552AC]/15 shadow-2xl p-6 md:p-10 relative overflow-hidden">
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#0552AC]/40 pointer-events-none"></div>
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#0552AC]/40 pointer-events-none"></div>
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#0552AC]/40 pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#0552AC]/40 pointer-events-none"></div>

              {/* Columna Izquierda: Retrato */}
              <div className="lg:col-span-6 relative flex flex-col items-center">
                <div className="relative w-full max-w-[360px] lg:max-w-[460px] aspect-[3/4] max-h-[55vw] sm:max-h-none rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[#0552AC]/20 bg-[#E8F0FE]/40 group">
                  <img
                    alt="Dannia Carolina - Retrato Editorial Haute Couture Mis XV Años"
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                    src={
                      event?.profile?.profilePhotoUrl ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8CTNUTYb-s4cDf4JnXI9USG9RzZJJn5gx9g4_erq0GyQRr8NeA_xutCw7tKZymdM0BhIIDbBqZ8bN3sxc1LwWCYb_nVv4wSxQY0QT0yY8PjAHS2cOrtDc5ofzhhVdYE4BcRxFtsKP6i-OlSZi27vMoI71bHtqEa5C-75egsF1HgiIIebsMprIUF-Kj0KHfukzHOP-RhsX0c_souhk2tTEw2MUNrkSh_rl78ljHu_fb5W2Lcwvb-56xLZp5p6eUKY"
                    }
                  />
                  <div className="absolute inset-4 pointer-events-none rounded-xl border border-white/60">
                    <div className="w-full h-full flex flex-col justify-between p-3">
                      <div className="flex justify-between items-center text-white text-[10px] uppercase tracking-widest bg-[#001F54]/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                        <span className="font-cinzel">D'CAROL REAL</span>
                        <span className="font-cinzel">EDICIÓN 2026</span>
                      </div>
                      <div className="text-center pb-1">
                        <span className="font-serif italic text-white drop-shadow-md text-sm tracking-wide">
                          Dannia Carolina — Mis XV Años
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#001F54]/80 via-[#001F54]/40 to-transparent flex items-end p-5">
                    <div className="flex items-center gap-2 text-white">
                      <span className="material-symbols-outlined text-[#D4AF37] text-[22px]">auto_awesome</span>
                      <span className="text-xs tracking-wider uppercase font-semibold">
                        Vestido Principal en Azul Zafiro
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Título, Invitación Oficial y Accesos */}
              <div className="lg:col-span-6 flex flex-col justify-center gap-4 pl-0 lg:pl-4">
                <div className="inline-flex items-center gap-2 self-start px-3.5 py-1 rounded-full bg-[#E8F0FE] text-[#0552AC] border border-[#0552AC]/20 shadow-2xs">
                  <span className="material-symbols-outlined text-[#D4AF37] text-[15px]">auto_awesome</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest font-cinzel">
                    Invitaci&oacute;n Oficial de Gala
                  </span>
                </div>

                <h2 className="font-headline text-lg sm:text-2xl md:text-3xl text-[#001F54] leading-snug font-bold">
                  Hay momentos en la vida que se vuelven inolvidables cuando los compartimos con las personas que queremos.
                </h2>

                <div className="space-y-2.5 text-sm md:text-base text-[#4B5B76] leading-relaxed">
                  <p>
                    Con mucha alegr&iacute;a y emoci&oacute;n, quiero invitarte a celebrar conmigo la llegada de mis 15 a&ntilde;os, una etapa llena de sue&ntilde;os, ilusiones y nuevos comienzos.
                  </p>
                  <p>
                    Ser&aacute; un d&iacute;a muy especial para m&iacute;, y me encantar&iacute;a contar con tu presencia para hacerlo a&uacute;n m&aacute;s inolvidable.
                  </p>
                  <p className="font-serif italic font-semibold text-[#001F54] text-base pt-0.5">
                    &iexcl;Espero verte y compartir juntos esta noche tan especial! 💕✨
                  </p>
                </div>

                {/* Tarjetas de Ceremonia y Recepción */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#FCFDFE] border border-[#0552AC]/20 flex items-start gap-2.5 shadow-sm hover:border-[#0552AC] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#0552AC] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">local_bar</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#4B5B76]">Recepción</span>
                      <span className="text-xs font-semibold text-[#001F54] mt-0.5">6:00 PM</span>
                      <span className="text-[10px] text-[#4B5B76]">Holiday Inn</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FCFDFE] border border-[#D4AF37]/40 flex items-start gap-2.5 shadow-sm hover:border-[#D4AF37] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[#FDF7E7] text-[#D4AF37] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">villa</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] font-cinzel">Lugar del Evento</span>
                      <span className="text-xs font-semibold text-[#001F54] mt-0.5">7:00 PM</span>
                      <span className="text-[10px] text-[#4B5B76]">Hotel Holiday Inn</span>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <a
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] text-xs uppercase tracking-wider font-bold transition shadow-md shadow-[#0552AC]/25 active:scale-95 cursor-pointer"
                    href="#rsvp-section"
                  >
                    <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span>Confirmar Asistencia</span>
                  </a>

                  <a
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#0552AC]/25 text-[#001F54] hover:bg-[#E8F0FE] text-xs uppercase tracking-wider font-bold transition active:scale-95"
                    href="#historia-section"
                  >
                    <span className="material-symbols-outlined text-[17px] text-[#0552AC]">auto_stories</span>
                    <span>Mi Historia</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* 4. COUNTDOWN */}
        <section className="w-full bg-white border-y border-[#0552AC]/10 py-10 md:py-14 relative overflow-hidden" id="itinerario-section">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 relative">
            <div className="mb-6 md:mb-8">
              <h2 className="font-headline text-2xl md:text-3xl text-[#001F54] font-bold">
                Cuenta regresiva a la noche de gala
              </h2>
              <p className="text-xs text-[#4B5B76] mt-1 font-cinzel uppercase tracking-wider">
                Viernes 4 Dic 2026 • Hotel Holiday Inn Managua
              </p>
            </div>

            <CountdownTimer targetDate={eventDateIso} />

            {/* Timeline Cards — scroll horizontal en mobile, 3 columnas en desktop */}
            <div className="flex md:grid md:grid-cols-3 gap-4 mt-10 overflow-x-auto snap-x snap-mandatory pb-2 md:overflow-visible">
              {event?.timelineItems?.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  className="snap-start shrink-0 w-[75vw] sm:w-[60vw] md:w-auto p-5 rounded-2xl bg-[#FCFDFE] border border-[#0552AC]/20 shadow-sm flex flex-col justify-between hover:border-[#0552AC] transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#0552AC] font-cinzel text-xs font-bold uppercase">
                        {new Date(item.startTime).toLocaleTimeString("es-NI", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                          timeZone: "America/Managua",
                        })}
                      </span>
                      <span className="material-symbols-outlined text-[#0552AC] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.icon || "star"}
                      </span>
                    </div>
                    <h3 className="font-headline text-base text-[#001F54] mb-1.5 font-bold">{item.title}</h3>
                    <p className="text-xs text-[#4B5B76] leading-relaxed">{item.description}</p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-[#0552AC] font-semibold">
                    Hotel Holiday Inn Managua
                  </div>
                </div>
              ))}
            </div>

            {/* Localizador de Mesas Interactivo */}
            <div className="mt-12">
              <TableLookup initialGuest={identifiedGuest} />
            </div>
          </div>
        </section>

        {/* 5. HISTORIA DE DANNIA: ÁLBUM DE ETAPAS & CAPÍTULOS DE VIDA */}
        <section className="w-full bg-[#F8FAFD] border-t border-[#0552AC]/10" id="historia-section">
          {/* A. Carrusel de Etapas de la Quinceañera (100+ Fotos optimizadas) */}
          <LifeStagesCarousel
            initialPhotos={stagePhotos}
            title={etapasSection?.title}
            subtitle={etapasSection?.subtitle}
          />

          {/* B. Capítulos Editoriales de Historia */}
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 pb-12 md:pb-16 pt-2">
            <div className="mb-8 text-center sm:text-left">
              <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                <span className="font-cinzel text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">
                  Hitos Fundamentales
                </span>
              </div>
              <h3 className="font-headline text-2xl md:text-3xl lg:text-4xl text-[#001F54] font-bold">
                El Viaje que Construyó este Sueño
              </h3>
              <p className="text-sm text-[#4B5B76] mt-1">
                Cada etapa me preparó para esta inolvidable noche de gala.
              </p>
            </div>

            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:overflow-visible">
              {(historiaSection?.content as any)?.chapters?.map((chap: any) => (
                <div
                  key={chap.number}
                  className="snap-start shrink-0 w-[75vw] sm:w-auto p-5 rounded-2xl bg-white border border-[#0552AC]/15 shadow-md hover:shadow-lg transition hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-cinzel text-2xl font-bold text-[#D4AF37]">{chap.number}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#0552AC] text-[10px] font-bold">
                        {chap.era}
                      </span>
                    </div>
                    <h4 className="font-headline text-base font-bold text-[#001F54] mb-1.5">{chap.title}</h4>
                    <p className="text-xs text-[#4B5B76] leading-relaxed">{chap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. CARTA DE DANNIA */}
        <section className="w-full py-12 md:py-20 bg-white border-y border-[#0552AC]/10" id="carta-section">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="p-6 md:p-12 rounded-3xl bg-gradient-to-b from-[#FCFDFE] via-white to-[#FDF7E7]/40 border-2 border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
              {/* Heraldic Corner Flourishes */}
              <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />

              <div className="text-center mb-6">
                <span className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#0552AC] font-bold block mb-1">
                  Desde el Coraz&oacute;n
                </span>
                <h2 className="font-headline text-2xl md:text-4xl text-[#001F54] font-bold">
                  Una Carta para Ustedes
                </h2>
              </div>

              {/* Banner Sagrado: Salmos 138:8 */}
              <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] text-white border-2 border-[#D4AF37]/50 shadow-lg text-center relative overflow-hidden">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="h-px w-8 sm:w-14 bg-[#D4AF37]" />
                  <span className="font-cinzel text-xs uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    <span>Salmos 138:8</span>
                  </span>
                  <span className="h-px w-8 sm:w-14 bg-[#D4AF37]" />
                </div>
                <blockquote className="font-serif italic text-base sm:text-lg md:text-xl text-white font-medium leading-relaxed max-w-xl mx-auto">
                  &ldquo;Jehov&aacute; cumplir&aacute; su prop&oacute;sito en m&iacute;; Tu misericordia, oh Jehov&aacute;, es para siempre.&rdquo;
                </blockquote>
              </div>

              <div className="space-y-4 text-sm md:text-base text-[#4B5B76] leading-relaxed font-serif">
                <p className="font-bold text-[#001F54] text-base md:text-lg">
                  {(cartaSection?.content as any)?.salutation || "Querida familia y amigos:"}
                </p>
                <div className="space-y-3.5 text-justify italic">
                  <p className="border-l-2 border-[#D4AF37] pl-4 italic text-[#001F54] font-medium not-italic text-base bg-amber-50/40 py-1.5 rounded-r-lg">
                    &ldquo;Hay momentos en la vida que se vuelven inolvidables cuando los compartimos con las personas que queremos.&rdquo;
                  </p>
                  <p>
                    Con mucha alegría y emoción, quiero invitarte a celebrar conmigo la llegada de mis 15 años, una etapa llena de sueños, ilusiones y nuevos comienzos.
                  </p>
                  <p>
                    Será un día muy especial para mí, y me encantaría contar con tu presencia para hacerlo aún más inolvidable.
                  </p>
                  <p className="font-semibold text-[#0552AC] not-italic text-center pt-1 text-base">
                    ¡Espero verte y compartir juntos esta noche tan especial! 💕✨
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-script text-3xl sm:text-4xl text-[#0552AC]">Dannia Carolina ✨</span>
                <div className="flex items-center gap-2 text-xs font-cinzel text-[#D4AF37] font-bold uppercase tracking-wider bg-[#FDF7E7] px-3.5 py-1.5 rounded-full border border-[#D4AF37]/30 shadow-2xs">
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  <span>Sello de Gratitud</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. DRESS CODE & PLAYLIST */}
        <section className="w-full py-10 md:py-16 bg-[#F8FAFD]" id="etiqueta-section">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Código de Vestimenta */}
            <div className="lg:col-span-6 bg-white p-6 md:p-8 rounded-2xl border border-[#0552AC]/15 shadow-lg">
              <h3 className="font-headline text-xl md:text-2xl text-[#001F54] font-bold mb-2">
                {dressCode?.title || "Código de Vestimenta: Gala Formal"}
              </h3>
              <p className="text-xs md:text-sm text-[#4B5B76] leading-relaxed mb-6">
                {(dressCode?.description || "Agradecemos a nuestros invitados vestir de gala formal para acompañarnos en esta noche tan especial.")
                  .replace(/digno de un cuento real,?\s*/gi, "")
                  .replace(/un cuento real/gi, "una velada inolvidable")
                  .replace(/cuento real/gi, "velada inolvidable")
                  .replace(/gala real/gi, "mis quince años")
                  .replace(/salón imperial/gi, "Hotel Holiday Inn Managua")
                  .replace(/salon imperial/gi, "Hotel Holiday Inn Managua")}
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-xs font-bold uppercase text-[#001F54] tracking-wider block mb-2 font-cinzel">
                    Paleta Sugerida para Invitados
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-[#D4AF37] ring-2 ring-white shadow"></span>
                      <span className="text-[11px] text-[#4B5B76] font-medium">Champagne</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-[#800020] ring-2 ring-white shadow"></span>
                      <span className="text-[11px] text-[#4B5B76] font-medium">Borgoña</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-[#1B4D3E] ring-2 ring-white shadow"></span>
                      <span className="text-[11px] text-[#4B5B76] font-medium">Esmeralda</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-[#1E293B] ring-2 ring-white shadow"></span>
                      <span className="text-[11px] text-[#4B5B76] font-medium">Negro Formal</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <span className="w-4 h-4 rounded-full bg-[#0552AC] ring-1 ring-amber-400" title="Color Azul reservado para la Quinceañera"></span>
                    <span className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-inner" title="Color Blanco reservado"></span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-amber-950 uppercase tracking-wide text-[11px]">
                      Nota de Protocolo de Gala
                    </span>
                    <span className="text-amber-900/90 leading-relaxed">
                      El color <strong>azul (en todas sus tonalidades)</strong> y los colores <strong>blanco y marfil</strong> están <strong>reservados exclusivamente para la Quinceañera</strong>. Agradecemos su cariño al elegir su atuendo de gala en la paleta sugerida.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist Interactiva Spotify & Recomendaciones */}
            <SpotifyPlaylistSection
              initialPlaylist={playlist}
              guestName={identifiedGuest?.fullName}
              guestCode={guestCode}
            />
          </div>
        </section>

        <section className="w-full py-10 md:py-16 bg-white border-t border-[#0552AC]/10" id="rsvp-section">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <RsvpForm
              initialCode={identifiedGuest?.invitationCode}
              initialGuest={identifiedGuest}
              rsvpDeadlineText="20 de Noviembre de 2026"
            />
          </div>
        </section>

        <section className="w-full py-10 md:py-16 bg-[#F8FAFD]" id="deseos-section">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <GuestbookSection />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#001F54] text-white py-8 md:py-12 border-t border-[#D4AF37]/30">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 p-1 ring-1 ring-[#D4AF37]/40 flex items-center justify-center mb-4">
            <img
              alt="D'CAROL Logo"
              className="w-full h-full object-contain"
              src={
                event?.branding?.logoUrl ||
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBzkp1Gb79UXobRrLQGHnahgOFNMZTmpYE35WrdDdL5Nb06s7zYMlgfaDftGN95HDq4BYfEc3sQOolZoS2E6YmKyJQTSpzw6LZaCwdtqe9qTtO6GBVO_tT0t71WJUi0ZizCVNcBppY5Ji5mEH3s2_Hs4QHsFBsgeQWuKMTBhOZawr4B78VRtcvuMtaNVUXVDG-3oUtD-y47LQt5dWQ_9qcRnsGCFzXvXF1t7W_hL5tf7RMJD-1FtF3xAaV0wWP3Hic"
              }
            />
          </div>
          <span className="font-cinzel text-lg tracking-widest text-[#D4AF37] font-bold">
            D'CAROL • MIS XV 2026
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-white/70 mt-1">
            Dannia Carolina Mendoza • Hotel Holiday Inn Managua
          </span>
          <p className="text-xs text-white/50 mt-4 max-w-md">
            Agradecemos con todo el corazón su compañía, cariño y oraciones en este día tan significativo para nuestra
            familia.
          </p>
          <div className="w-16 h-[1px] bg-[#D4AF37]/30 my-6"></div>

          {/* Quick Administration Links */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs text-white/50 mb-3 flex-wrap">
            <Link
              href="/admin"
              className="hover:text-[#D4AF37] transition-colors flex items-center gap-1 font-semibold"
            >
              <span className="material-symbols-outlined text-[14px] text-[#D4AF37]">dashboard_customize</span>
              <span>Centro de Mando (Admin)</span>
            </Link>
            <span>•</span>
            <Link
              href="/admin/etapas"
              className="hover:text-[#D4AF37] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">photo_library</span>
              <span>Módulo Planner</span>
            </Link>
            <span>•</span>
            <Link
              href="/login"
              className="hover:text-[#D4AF37] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Iniciar Sesión</span>
            </Link>
          </div>

          <span className="text-[11px] text-white/40 tracking-wider">
            © 2026 D'CAROL. Todos los derechos reservados.
          </span>
        </div>
      </footer>

      {/* 11. NAVEGACIÓN MÓVIL RÁPIDA (FLOATING DOCK) */}
      <MobileBottomNav />
    </div>
  );
}
