"use client";

import { useState } from "react";
import Link from "next/link";
import { FloorMapVisualizer } from "@/components/admin/FloorMapVisualizer";
import { PhotoModerationQueue } from "@/components/admin/PhotoModerationQueue";
import { GuestManagementTable } from "@/components/admin/GuestManagementTable";
import { LiveTimelineStepper } from "@/components/admin/LiveTimelineStepper";

export type AdminTab = "plano" | "muro" | "invitados" | "cronograma";

interface AdminDashboardWorkspaceProps {
  // Seating & Tables
  totalTables: number;
  totalCapacity: number;
  assignedSeats: number;
  availableSeats: number;
  hallName?: string;

  // KPIs & Counts for badges
  totalGuests: number;
  confirmedCount: number;
  pendingCount: number;
  vipCount: number;
  generalCount: number;
  rsvpPercentage: number;
  occupancyPercentage: number;

  totalPhotosCount: number;
  pendingPhotosCount: number;
  approvedPhotosCount: number;
  featuredPhotosCount: number;

  totalWishes: number;
  audioWishes: number;
  writtenWishes: number;

  // Active Stage
  currentStageTitle: string;
  nextStageTitle?: string | null;

  // Active tab state can be controlled or defaulted
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export function AdminDashboardWorkspace({
  totalTables,
  totalCapacity,
  assignedSeats,
  availableSeats,
  hallName = "Salón Principal",
  totalGuests,
  confirmedCount,
  pendingCount,
  vipCount,
  generalCount,
  rsvpPercentage,
  occupancyPercentage,
  totalPhotosCount,
  pendingPhotosCount,
  approvedPhotosCount,
  featuredPhotosCount,
  totalWishes,
  audioWishes,
  writtenWishes,
  currentStageTitle,
  nextStageTitle,
  activeTab: controlledTab,
  onTabChange,
}: AdminDashboardWorkspaceProps) {
  const [internalTab, setInternalTab] = useState<AdminTab>("plano");
  const [viewMode, setViewMode] = useState<"tabs" | "stacked">("tabs");

  const currentTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setTab = (tab: AdminTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Workspace Navigation Bar: Tabs + View Mode */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Tab Switcher with Real Live Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto select-none">
          {/* Tab 1: Plano de Mesas */}
          <button
            type="button"
            onClick={() => setTab("plano")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              currentTab === "plano" && viewMode === "tabs"
                ? "bg-white text-[#0552AC] shadow-xs"
                : "text-slate-600 hover:text-[#0D1829]"
            }`}
          >
            <span
              className="material-symbols-outlined text-[17px] text-[#0552AC]"
              style={{ fontVariationSettings: currentTab === "plano" ? "'FILL' 1" : undefined }}
            >
              map
            </span>
            <span>Plano de Mesas &amp; Salón</span>
            <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-[#0552AC] text-[10px] font-bold">
              {totalTables}
            </span>
          </button>

          {/* Tab 2: Muro & Pantalla LED */}
          <button
            type="button"
            onClick={() => setTab("muro")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              currentTab === "muro" && viewMode === "tabs"
                ? "bg-white text-[#0552AC] shadow-xs"
                : "text-slate-600 hover:text-[#0D1829]"
            }`}
          >
            <span
              className="material-symbols-outlined text-[17px] text-amber-600"
              style={{ fontVariationSettings: currentTab === "muro" ? "'FILL' 1" : undefined }}
            >
              connected_tv
            </span>
            <span>Muro &amp; Pantalla LED</span>
            {pendingPhotosCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                {pendingPhotosCount} por revisar
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                {totalPhotosCount}
              </span>
            )}
          </button>

          {/* Tab 3: Directorio de Invitados */}
          <button
            type="button"
            onClick={() => setTab("invitados")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              currentTab === "invitados" && viewMode === "tabs"
                ? "bg-white text-[#0552AC] shadow-xs"
                : "text-slate-600 hover:text-[#0D1829]"
            }`}
          >
            <span
              className="material-symbols-outlined text-[17px] text-emerald-600"
              style={{ fontVariationSettings: currentTab === "invitados" ? "'FILL' 1" : undefined }}
            >
              group
            </span>
            <span>Directorio de Invitados</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {totalGuests}
            </span>
          </button>

          {/* Tab 4: Cronograma & Automatizaciones */}
          <button
            type="button"
            onClick={() => setTab("cronograma")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              currentTab === "cronograma" && viewMode === "tabs"
                ? "bg-white text-[#0552AC] shadow-xs"
                : "text-slate-600 hover:text-[#0D1829]"
            }`}
          >
            <span
              className="material-symbols-outlined text-[17px] text-indigo-600"
              style={{ fontVariationSettings: currentTab === "cronograma" ? "'FILL' 1" : undefined }}
            >
              schedule
            </span>
            <span>Cronograma &amp; Automatizaciones</span>
          </button>
        </div>

        {/* Right: Layout View Mode Toggle + Shortcuts */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          {/* Quick Deep Links */}
          {currentTab === "plano" && (
            <Link
              href="/admin/tables"
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0552AC] text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>Gestionar Mesas</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          )}

          {currentTab === "muro" && (
            <Link
              href="/admin/moderation"
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0552AC] text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>Muro Completo</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </Link>
          )}

          {currentTab === "invitados" && (
            <Link
              href="/admin/guests"
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0552AC] text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <span>Directorio Completo</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </Link>
          )}

          {/* View Mode Toggle: Tabs vs Stacked */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("tabs")}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === "tabs"
                  ? "bg-white text-[#0552AC] shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Vista por pestañas (enfocada y espaciosa)"
            >
              <span className="material-symbols-outlined text-[17px] block">tab</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("stacked")}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === "stacked"
                  ? "bg-white text-[#0552AC] shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Vista extendida (todas las secciones verticales)"
            >
              <span className="material-symbols-outlined text-[17px] block">view_agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER VIEWS */}
      {viewMode === "tabs" ? (
        <div className="w-full">
          {/* TAB 1: PLANO DE MESAS */}
          {currentTab === "plano" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-150">
              {/* Seating Stats Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Capacidad Total
                  </span>
                  <span className="font-headline text-lg font-bold text-[#0D1829] tabular-nums mt-0.5">
                    {totalCapacity} Sillas
                  </span>
                  <span className="text-[11px] text-slate-500">{totalTables} mesas oficiales</span>
                </div>

                <div className="flex flex-col border-l border-slate-100 pl-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sillas Asignadas
                  </span>
                  <span className="font-headline text-lg font-bold text-[#0552AC] tabular-nums mt-0.5">
                    {assignedSeats} ({occupancyPercentage}%)
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">Asientos confirmados</span>
                </div>

                <div className="flex flex-col border-l border-slate-100 pl-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sillas Disponibles
                  </span>
                  <span className="font-headline text-lg font-bold text-amber-700 tabular-nums mt-0.5">
                    {availableSeats} Libres
                  </span>
                  <span className="text-[11px] text-slate-500">Listas para asignación</span>
                </div>

                <div className="flex flex-col border-l border-slate-100 pl-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sede Oficial
                  </span>
                  <span className="font-headline text-sm font-bold text-[#001F54] mt-1 truncate">
                    Hotel Holiday Inn
                  </span>
                  <span className="text-[11px] text-slate-500">Managua • {hallName}</span>
                </div>
              </div>

              {/* Full Width Floor Map Visualizer */}
              <FloorMapVisualizer
                totalTables={totalTables}
                totalCapacity={totalCapacity}
                assignedSeats={assignedSeats}
                availableSeats={availableSeats}
                hallName={hallName}
              />
            </div>
          )}

          {/* TAB 2: MURO & PANTALLA LED */}
          {currentTab === "muro" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-150">
              <PhotoModerationQueue />
            </div>
          )}

          {/* TAB 3: DIRECTORIO DE INVITADOS */}
          {currentTab === "invitados" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-150">
              <GuestManagementTable />
            </div>
          )}

          {/* TAB 4: CRONOGRAMA & AUTOMATIZACIONES */}
          {currentTab === "cronograma" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-150">
              {/* WhatsApp Triggers & Automations */}
              <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#001F54] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-[#D4AF37]">
                        notifications_active
                      </span>
                    </div>
                    <div>
                      <h3 className="font-headline text-base font-bold text-[#0D1829] leading-tight">
                        Automatizaciones WhatsApp
                      </h3>
                      <p className="text-xs text-slate-500">
                        Disparadores programados &amp; Enlaces Mágicos D&apos;CAROL
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin/automations"
                    className="px-3 py-1.5 rounded-xl bg-[#0552AC]/10 hover:bg-[#0552AC]/20 text-[#0552AC] text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <span>Configurar</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  {/* Trigger 1 */}
                  <Link
                    href="/admin/automations"
                    className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/70 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0552AC]/10 flex items-center justify-center text-[#0552AC] shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[19px]">mark_email_read</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0D1829] group-hover:text-[#0552AC] transition-colors">
                            Invitación Oficial con Enlace Mágico
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            Activa
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          105 comensales base • Enlace personalizado con mesa y cupos familiares
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-[#0552AC] transition-colors">
                      chevron_right
                    </span>
                  </Link>

                  {/* Trigger 2 */}
                  <Link
                    href="/admin/automations"
                    className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/70 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#001F54] shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[19px]">alarm</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0D1829] group-hover:text-[#0552AC] transition-colors">
                            Recordatorio RSVP (Cierre 20 Noviembre)
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                            Programado
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Filtro dinámico para invitados pendientes de confirmación
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-[#0552AC] transition-colors">
                      chevron_right
                    </span>
                  </Link>

                  {/* Trigger 3 */}
                  <Link
                    href="/admin/automations"
                    className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/70 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#0552AC] shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[19px]">qr_code_2</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0D1829] group-hover:text-[#0552AC] transition-colors">
                            Código QR &amp; Plano de Mesa 24h Antes
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-[#0552AC] text-[9px] font-bold">
                            Día del Evento
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Viernes 4 de Diciembre 2026 • Hotel Holiday Inn Managua
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-[#0552AC] transition-colors">
                      chevron_right
                    </span>
                  </Link>
                </div>
              </section>

              {/* Timeline Operator */}
              <LiveTimelineStepper />
            </div>
          )}
        </div>
      ) : (
        /* STACKED VIEW: ALL SECTIONS FULL WIDTH VERTICALLY WITH GENEROUS BREATHING ROOM */
        <div className="flex flex-col gap-10 w-full animate-in fade-in duration-200">
          {/* SECTION 1: FLOOR MAP */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0552AC] text-[22px]">map</span>
                <h2 className="font-headline text-lg font-bold text-[#0D1829]">
                  Plano Esquemático de Mesas &amp; Salón
                </h2>
              </div>
              <Link
                href="/admin/tables"
                className="text-xs font-bold text-[#0552AC] hover:underline flex items-center gap-1"
              >
                <span>Ver pantalla completa</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </Link>
            </div>
            <FloorMapVisualizer
              totalTables={totalTables}
              totalCapacity={totalCapacity}
              assignedSeats={assignedSeats}
              availableSeats={availableSeats}
              hallName={hallName}
            />
          </section>

          {/* SECTION 2: PHOTO MODERATION QUEUE */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[22px]">connected_tv</span>
                <h2 className="font-headline text-lg font-bold text-[#0D1829]">
                  Curaduría Multimedia &amp; Pantalla LED
                </h2>
              </div>
              <Link
                href="/admin/moderation"
                className="text-xs font-bold text-[#0552AC] hover:underline flex items-center gap-1"
              >
                <span>Administrar muro</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </Link>
            </div>
            <PhotoModerationQueue />
          </section>

          {/* SECTION 3: GUEST DIRECTORY */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[22px]">group</span>
                <h2 className="font-headline text-lg font-bold text-[#0D1829]">
                  Directorio de Invitados &amp; Pases
                </h2>
              </div>
              <Link
                href="/admin/guests"
                className="text-xs font-bold text-[#0552AC] hover:underline flex items-center gap-1"
              >
                <span>Directorio completo</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </Link>
            </div>
            <GuestManagementTable />
          </section>

          {/* SECTION 4: TIMELINE & AUTOMATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LiveTimelineStepper />
            <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
              <h3 className="font-headline text-base font-bold text-[#0D1829]">
                Automatizaciones Programadas
              </h3>
              <p className="text-xs text-slate-500">
                Disparadores automáticos vía WhatsApp para invitaciones, confirmación y pases.
              </p>
              <Link
                href="/admin/automations"
                className="mt-4 px-4 py-2 rounded-xl bg-[#0552AC] text-white text-xs font-bold hover:bg-[#001F54] transition-colors text-center"
              >
                Ir a Centro de Automatizaciones
              </Link>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
