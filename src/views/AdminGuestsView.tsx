"use client";

import { GuestManagementTable } from "@/components/admin/GuestManagementTable";
import { useDemoDb } from "@/demo/db";

export default function AdminGuestsView() {
  const db = useDemoDb();
  const guests = db.guests;
  const confirmed = guests.filter((g) => g.status === "confirmed" || g.confirmedSeats > 0).length;
  const pending = guests.filter((g) => g.status === "invited" || g.status === "waitlist").length;
  const declined = guests.filter((g) => g.status === "declined").length;
  const total = guests.length;
  const totalSeats = guests.reduce((acc, g) => acc + (g.maxSeats || 1), 0);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-6 max-w-[1560px] mx-auto w-full pb-16">
      {/* Header with Title & Stats Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline text-2xl font-bold text-[#0D1829]">
              Directorio de Invitados &amp; Pases
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0552AC] text-white text-[11px] font-bold">
              {total} Titulares ({totalSeats} Personas)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lista oficial de invitados de Dannia Carolina • Hotel Holiday Inn Managua
          </p>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="px-3 py-1 text-center border-r border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Confirmados
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {confirmed}
            </span>
          </div>
          <div className="px-3 py-1 text-center border-r border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Pendientes
            </span>
            <span className="text-sm font-bold text-amber-600">
              {pending}
            </span>
          </div>
          <div className="px-3 py-1 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Declinados
            </span>
            <span className="text-sm font-bold text-rose-600">
              {declined}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Table */}
      <GuestManagementTable />
    </div>
  );
}
