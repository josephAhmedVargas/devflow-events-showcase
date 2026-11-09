"use client";

import Link from "next/link";

interface OperationalAlertsProps {
  unassignedGuestsCount?: number;
  pendingPhotosCount?: number;
}

export function OperationalAlerts({
  unassignedGuestsCount = 0,
  pendingPhotosCount = 0,
}: OperationalAlertsProps) {
  if (unassignedGuestsCount === 0 && pendingPhotosCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Alert 1: Unassigned Confirmed Guests (KPI 7 from Master Plan) */}
      {unassignedGuestsCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                warning
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Alerta Operativa de Aforo (KPI 7)
              </span>
              <p className="text-xs text-amber-900/90">
                Hay <strong>{unassignedGuestsCount} invitado{unassignedGuestsCount > 1 ? "s" : ""} confirmado{unassignedGuestsCount > 1 ? "s" : ""}</strong> sin mesa de banquete asignada.
              </p>
            </div>
          </div>
          <Link
            href="/admin/guests?status=confirmed"
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-xs transition whitespace-nowrap"
          >
            Asignar Mesa
          </Link>
        </div>
      )}

      {/* Alert 2: Pending Photo Moderation */}
      {pendingPhotosCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/90 border border-blue-200/80 text-blue-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0552AC]/15 text-[#0552AC] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                photo_library
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0552AC]">
                Cola de Moderación Activa
              </span>
              <p className="text-xs text-blue-900/90">
                <strong>{pendingPhotosCount} foto{pendingPhotosCount > 1 ? "s" : ""}</strong> en cola esperando aprobación para proyectarse en la Gran Pantalla LED.
              </p>
            </div>
          </div>
          <Link
            href="/admin/moderation"
            className="px-3 py-1.5 rounded-lg bg-[#0552AC] text-white hover:bg-[#001F54] text-xs font-semibold shadow-xs transition whitespace-nowrap"
          >
            Moderar ({pendingPhotosCount})
          </Link>
        </div>
      )}
    </div>
  );
}
