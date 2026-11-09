"use client";

import Link from "next/link";
import { OperationalAlerts } from "@/components/admin/OperationalAlerts";
import { AdminDashboardWorkspace } from "@/components/admin/AdminDashboardWorkspace";
import { useDemoDb } from "@/demo/db";

export default function AdminDashboardView() {
  const db = useDemoDb();
  const mainEvent: { [key: string]: any; guests: any[]; tables: any[]; photos: any[]; guestbookEntries: any[] } = {
    ...db.event,
    liveState: db.liveState,
    guests: db.guests.map((g) => ({ ...g, tableAssignment: db.assignments.find((a) => a.eventGuestId === g.id) || null })),
    tables: db.tables,
    photos: db.photos,
    guestbookEntries: db.messages,
  };

  // 1. Live Timeline Stages
  const timeline: any[] = [...db.timeline].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentStage =
    timeline.find((t) => t.status === "current" || t.id === mainEvent?.liveState?.currentTimelineItemId) ||
    timeline[0] || { title: "Recepción & Alfombra Real" };
  const currentStageIndex = timeline.indexOf(currentStage);
  const nextStage =
    currentStageIndex >= 0 && currentStageIndex < timeline.length - 1 ? timeline[currentStageIndex + 1] : null;

  // 2. Table assignments & occupancy
  const assignments = db.assignments;
  const assignedSeats = assignments.reduce((acc, a) => acc + (a.assignedSeats || 1), 0);

  // 3. Guests & RSVP Calculations
  const guests = mainEvent?.guests || [];
  const confirmedGuests = guests.filter((g) => g.status === "confirmed" || g.confirmedSeats > 0);
  const unassignedGuests = guests.filter((g) => !g.tableAssignment);

  const totalGuests = guests.length;
  const confirmedCount = confirmedGuests.length;
  const pendingCount = totalGuests - confirmedCount;
  const rsvpPercentage = totalGuests > 0 ? Math.round((confirmedCount / totalGuests) * 100) : 0;
  const vipCount = guests.filter((g) => g.isVip || g.tier === "vip").length;
  const generalCount = totalGuests - vipCount;
  const totalSeats = confirmedGuests.reduce((acc, g) => acc + (g.confirmedSeats || 1), 0);

  // 4. Tables & Capacity
  const tables = mainEvent?.tables || [];
  const tablesCount = tables.length;
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 10), 0);
  const occupancyPercentage = totalCapacity > 0 ? Math.round((assignedSeats / totalCapacity) * 100) : 0;
  const availableSeats = Math.max(0, totalCapacity - assignedSeats);

  // 5. Photos Moderation
  const photos = mainEvent?.photos || [];
  const totalPhotosCount = photos.length;
  const pendingPhotosCount = photos.filter((p) => p.moderationStatus === "pending").length;
  const approvedPhotosCount = photos.filter((p) => p.moderationStatus === "approved").length;
  const featuredPhotosCount = photos.filter((p) => p.isFeatured).length;

  // 6. Wishes & Dedications
  const wishes = mainEvent?.guestbookEntries || [];
  const totalWishes = wishes.length;
  const audioWishes = wishes.filter((w: any) => w.audioUrl || w.mediaType === "audio").length;
  const writtenWishes = totalWishes - audioWishes;

  // 7. Days countdown
  const eventDate = mainEvent?.eventDate ? new Date(mainEvent.eventDate) : new Date("2026-12-04T18:00:00-06:00");
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="flex flex-col w-full pb-20 max-w-[1560px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-7 gap-6 sm:gap-7">
      {/* 1. EXECUTIVE HERO HEADER */}
      <div className="w-full bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Honoree & Event Metadata */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#0552AC] to-[#001F54] flex items-center justify-center text-[#D4AF37] relative ring-2 ring-[#D4AF37]/40 shadow-xs shrink-0">
            <span
              className="material-symbols-outlined text-[26px] sm:text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              crown
            </span>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#D4AF37]"></span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline font-bold text-lg sm:text-2xl text-[#0D1829] leading-tight truncate">
                Dannia Carolina Mendoza
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#0552AC] text-[10px] font-bold uppercase tracking-wider">
                Mis Quince Años
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {daysRemaining > 0 ? `Faltan ${daysRemaining} Días` : "¡Gran Noche!"}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-medium">Hotel Holiday Inn Managua • Salón Principal</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="text-slate-600">Viernes 4 de Diciembre 2026 • 6:00 PM</span>
            </p>
          </div>
        </div>

        {/* Right: Operational Telemetry & Quick Action Hub */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Active Live Stage Pill */}
          <Link
            href="/admin/timeline"
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 px-3.5 py-2 rounded-2xl shadow-2xs transition-colors"
            title="Ver itinerario completo del evento"
          >
            <span
              className="material-symbols-outlined text-[#D4AF37] text-[18px] shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              timer
            </span>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                Etapa Activa
              </span>
              <span className="text-xs font-bold text-[#0D1829] truncate max-w-[130px] sm:max-w-[160px]">
                {currentStage.title}
              </span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              chevron_right
            </span>
          </Link>

          {/* Quick Action: Launch Gran Pantalla LED */}
          <Link
            href="/live"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#001F54] hover:bg-[#0552AC] text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-[#001F54]/25 transition active:scale-95 shrink-0"
            title="Abrir la proyección LED en vivo para proyector o pantalla de salón"
          >
            <span className="material-symbols-outlined text-[17px] text-[#D4AF37]">
              connected_tv
            </span>
            <span>Pantalla LED</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </Link>
        </div>
      </div>

      {/* 2. OPERATIONAL ALERTS (If any pending action) */}
      <OperationalAlerts
        unassignedGuestsCount={unassignedGuests.length}
        pendingPhotosCount={pendingPhotosCount}
      />

      {/* 3. FOUR PRIMARY KPI CARDS (Bento Grid) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: RSVP Attendance */}
        <Link
          href="/admin/guests"
          className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0552AC]/40 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Asistencia RSVP
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="font-headline text-3xl sm:text-4xl font-bold text-[#0D1829] tabular-nums">
                    {confirmedCount}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    / {totalGuests} comensales
                  </span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0552AC] ring-1 ring-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">
                  how_to_reg
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-bold text-[#0552AC] flex items-center gap-1">
                  <span>{rsvpPercentage}% Asistencia</span>
                </span>
                <span className="text-slate-500 font-medium">
                  {pendingCount} restante{pendingCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0552AC] to-[#001F54] rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.min(100, rsvpPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0552AC]" />
              <strong>{vipCount}</strong> VIP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              <strong>{generalCount}</strong> General
            </span>
            <span className="text-[#0552AC] group-hover:translate-x-0.5 transition-transform font-bold flex items-center">
              Ver <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </Link>

        {/* KPI 2: Banquet & Seating Allocation */}
        <Link
          href="/admin/tables"
          className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0552AC]/40 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Aforo &amp; Banquete
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="font-headline text-3xl sm:text-4xl font-bold text-[#0D1829] tabular-nums">
                    {assignedSeats}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    / {totalCapacity} sillas
                  </span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">
                  table_restaurant
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-bold text-[#001F54]">
                  {occupancyPercentage}% Ocupación
                </span>
                <span className="text-emerald-700 font-bold text-[11px]">
                  {availableSeats} sillas libres
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#D4AF37] rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#001F54]" />
              <strong>{tablesCount}</strong> Mesas activas
            </span>
            <span className="truncate text-slate-500 max-w-[110px]">
              Holiday Inn
            </span>
            <span className="text-[#0552AC] group-hover:translate-x-0.5 transition-transform font-bold flex items-center">
              Plano <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </Link>

        {/* KPI 3: Live Photo Stream Queue */}
        <Link
          href="/admin/moderation"
          className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0552AC]/40 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Fotos &amp; Pantalla LED
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="font-headline text-3xl sm:text-4xl font-bold text-[#0D1829] tabular-nums">
                    {totalPhotosCount}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    subidas
                  </span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">
                  connected_tv
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                {pendingPhotosCount > 0 ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {pendingPhotosCount} Por Moderar
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Al Día en Pantalla
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-500">
                  {approvedPhotosCount} en vivo
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1 text-[#D4AF37] font-bold">
              <span className="material-symbols-outlined text-[13px]">star</span>
              {featuredPhotosCount} VIP
            </span>
            <span className="text-slate-500">
              Rotación activa
            </span>
            <span className="text-[#0552AC] group-hover:translate-x-0.5 transition-transform font-bold flex items-center">
              Muro <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </Link>

        {/* KPI 4: Digital Guestbook & Dedications */}
        <Link
          href="/admin/moderation"
          className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#0552AC]/40 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Libro de Oro Digital
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="font-headline text-3xl sm:text-4xl font-bold text-[#0D1829] tabular-nums">
                    {totalWishes}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    dedicatorias
                  </span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-[15px] text-[#0552AC]">mic</span>
                  {audioWishes} audios
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-[15px] text-[#D4AF37]">edit_note</span>
                  {writtenWishes} escritas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
            {wishes.length > 0 ? (
              <span className="text-emerald-700 font-bold">
                ✓ Mensajes recibidos
              </span>
            ) : (
              <span className="text-slate-400 italic">
                Esperando dedicatorias
              </span>
            )}
            <span className="text-[#0552AC] group-hover:translate-x-0.5 transition-transform font-bold flex items-center">
              Libro <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </Link>
      </section>

      {/* 4. MAIN INTERACTIVE COMMAND CENTER WORKSPACE */}
      <AdminDashboardWorkspace
        totalTables={tablesCount}
        totalCapacity={totalCapacity}
        assignedSeats={assignedSeats}
        availableSeats={availableSeats}
        hallName="Salón Principal"
        totalGuests={totalGuests}
        confirmedCount={confirmedCount}
        pendingCount={pendingCount}
        vipCount={vipCount}
        generalCount={generalCount}
        rsvpPercentage={rsvpPercentage}
        occupancyPercentage={occupancyPercentage}
        totalPhotosCount={totalPhotosCount}
        pendingPhotosCount={pendingPhotosCount}
        approvedPhotosCount={approvedPhotosCount}
        featuredPhotosCount={featuredPhotosCount}
        totalWishes={totalWishes}
        audioWishes={audioWishes}
        writtenWishes={writtenWishes}
        currentStageTitle={currentStage.title}
        nextStageTitle={nextStage ? nextStage.title : null}
      />
    </div>
  );
}
