"use client";

import { GuestManagementTable } from "@/components/admin/GuestManagementTable";
import { useDemoDb } from "@/demo/db";

export default function AdminGuestsView() {
  const db = useDemoDb();
  const guests = db.guests;
  const confirmedGuests = guests.filter((g) => g.status === "confirmed" || g.confirmedSeats > 0);
  const confirmedTitulares = confirmedGuests.length;
  const confirmedSeats = confirmedGuests.reduce((acc, g) => acc + (g.confirmedSeats || g.maxSeats || 1), 0);

  const pendingGuests = guests.filter((g) => g.status === "invited" || g.status === "waitlist");
  const pendingTitulares = pendingGuests.length;

  const declinedGuests = guests.filter((g) => g.status === "declined");
  const declinedTitulares = declinedGuests.length;

  const totalTitulares = guests.length;
  const totalSeats = guests.reduce((acc, g) => acc + (g.maxSeats || 1), 0);

  const vipGuests = guests.filter((g) => g.isVip || g.tier === "vip");
  const vipCount = vipGuests.length;

  const confirmedPercent = totalSeats > 0 ? Math.round((confirmedSeats / totalSeats) * 100) : 0;

  return (
    <div className="px-3.5 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-5 sm:gap-6 max-w-[1560px] mx-auto w-full pb-20">
      {/* Header with Title & Stats Strip */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline text-xl sm:text-2xl md:text-3xl font-bold text-[#0D1829]">
                Directorio de Invitados &amp; Pases
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0552AC] text-white text-[11px] font-bold shadow-2xs">
                {totalTitulares} Titulares • {totalSeats} Cupos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Padrón oficial de gala de Dannia Carolina • Control de Asistencia y Pases QR en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{confirmedPercent}% Asistencia Confirmada</span>
            </span>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Card 1: Confirmados */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Confirmados
              </span>
              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                check_circle
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-emerald-700 font-headline leading-none">
                {confirmedSeats}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">personas</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {confirmedTitulares} de {totalTitulares} titulares
            </span>
          </div>

          {/* Card 2: Pendientes */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pendientes
              </span>
              <span className="material-symbols-outlined text-[16px] text-amber-500">
                pending_actions
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-amber-600 font-headline leading-none">
                {pendingTitulares}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">familias</span>
            </div>
            <span className="text-[10px] text-amber-700 mt-1">
              Recordatorio WhatsApp listo
            </span>
          </div>

          {/* Card 3: Declinados */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Declinados
              </span>
              <span className="material-symbols-outlined text-[16px] text-rose-500">
                cancel
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-rose-600 font-headline leading-none">
                {declinedTitulares}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">titulares</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              Lugares liberados
            </span>
          </div>

          {/* Card 4: VIPs */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] font-cinzel">
                VIP de Honor
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
                star
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-[#001F54] font-headline leading-none">
                {vipCount}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">mesas de gala</span>
            </div>
            <span className="text-[10px] text-[#0552AC] font-semibold mt-1">
              Corte &amp; Familia directa
            </span>
          </div>

          {/* Card 5: Capacidad Total */}
          <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r lg:bg-gradient-to-b from-[#001F54] to-[#0552AC] text-white shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] font-cinzel">
                Aforo Total
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
                chair
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white font-headline leading-none">
                {totalSeats}
              </span>
              <span className="text-[11px] text-white/70 font-medium">asientos</span>
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-500"
                style={{ width: `${confirmedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Table & Mobile Cards */}
      <GuestManagementTable />
    </div>
  );
}
