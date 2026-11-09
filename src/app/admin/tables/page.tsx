"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Grid3X3, Users, ArrowLeft, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export default function AdminTablesPage() {
  const { tables, guests } = useDemo();
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);

  const selectedTable = tables.find((t) => t.number === selectedTableNumber);
  const guestsAtSelectedTable = guests.filter((g) => g.tableNumber === selectedTableNumber);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-blue-400" />
            <span>Plano de Distribución de Mesas (35 Mesas)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mapeo interactivo del salón de gala. Selecciona cualquier mesa para consultar aforo y comensales.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-400" />
            <span className="text-slate-300">Mesa de Honor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-400" />
            <span className="text-slate-300">Con Invitados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10" />
            <span className="text-slate-400">Disponible</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Map Grid (35 Tables) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0D0F1C] border border-white/10 space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Distribución de Mesas del Salón</span>
            <span className="text-slate-500 font-mono">Total: 35 Mesas</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 pt-2">
            {tables.map((table) => {
              const tableGuests = guests.filter((g) => g.tableNumber === table.number);
              const hasGuests = tableGuests.length > 0;
              const isSelected = selectedTableNumber === table.number;
              const isHonor = table.number === 1;

              return (
                <button
                  key={table.number}
                  onClick={() => setSelectedTableNumber(table.number)}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                    isSelected
                      ? "ring-2 ring-purple-500 bg-purple-600/30 scale-105 shadow-lg shadow-purple-600/30"
                      : isHonor
                      ? "bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30"
                      : hasGuests
                      ? "bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-white/5 border border-white/10 hover:bg-white/10 opacity-70"
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400">MESA</div>
                  <div className="text-base font-black text-white font-mono">
                    {table.number < 10 ? `0${table.number}` : table.number}
                  </div>
                  <div className="text-[10px] mt-1 text-slate-400 truncate max-w-[60px]">
                    {isHonor ? "Honor" : hasGuests ? `${tableGuests.length} fam` : `${table.capacity}p`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Details Sidebar */}
        <div className="p-6 rounded-3xl bg-[#0D0F1C] border border-white/10 space-y-5">
          <div className="pb-4 border-b border-white/10">
            <div className="text-xs font-mono uppercase tracking-wider text-purple-400">
              Detalle de Asignación
            </div>
            <div className="text-2xl font-black text-white mt-1">
              Mesa {selectedTableNumber < 10 ? `0${selectedTableNumber}` : selectedTableNumber}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {selectedTable?.name || `Mesa General`} · Capacidad máxima: {selectedTable?.capacity || 10} personas
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Invitados Asignados ({guestsAtSelectedTable.length})
            </div>

            {guestsAtSelectedTable.length > 0 ? (
              <div className="space-y-2.5">
                {guestsAtSelectedTable.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{g.name}</div>
                        <div className="text-[11px] text-slate-400">{g.tableName}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-200">
                        {g.confirmedSeats} cupos
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Estado en Puerta:</span>
                      {g.checkedIn ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ya ingresó al salón</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pendiente de llegada</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center text-slate-400 text-xs">
                No hay invitados asignados a esta mesa en los datos de prueba.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
