"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  Image as ImageIcon,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
} from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export default function AdminDashboardPage() {
  const { guests, eventSettings, updateGuestStatus, toggleCheckIn } = useDemo();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "CONFIRMED" | "PENDING" | "DECLINED">("all");

  const totalInvitedGuests = guests.reduce((sum, g) => sum + g.confirmedSeats, 0);
  const totalCheckedInGuests = guests
    .filter((g) => g.checkedIn)
    .reduce((sum, g) => sum + g.confirmedSeats, 0);
  const confirmedCount = guests.filter((g) => g.status === "CONFIRMED").length;
  const pendingCount = guests.filter((g) => g.status === "PENDING").length;
  const occupancyPercent = totalInvitedGuests > 0 ? Math.round((totalCheckedInGuests / totalInvitedGuests) * 100) : 0;

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.tableNumber.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
            <span>DevFlow Events</span>
            <span>•</span>
            <span>Centro de Control en Vivo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Dashboard Ejecutivo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Supervisa el aforo del salón, recepción en puerta y confirmaciones en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/checkin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Abrir Escáner de Puerta</span>
          </Link>
          <Link
            href="/live"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-200 font-semibold text-xs hover:bg-purple-600/30 transition"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Gran Pantalla</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Aforo en Salón */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141829] to-[#0E101D] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Aforo en Salón
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalCheckedInGuests}</span>
            <span className="text-xs text-slate-400">/ {totalInvitedGuests} cupos</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
              <span>{occupancyPercent}% ingresado</span>
              <span className="text-emerald-400 font-medium">Control en puerta activo</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Confirmaciones RSVP */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141829] to-[#0E101D] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Confirmaciones RSVP
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{confirmedCount}</span>
            <span className="text-xs text-slate-400">familias ({guests.length} total)</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-400" />
            <span>{pendingCount} pendientes de responder</span>
          </div>
        </div>

        {/* KPI 3: Pases Validados */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141829] to-[#0E101D] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Pases QR Leídos
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {guests.filter((g) => g.checkedIn).length}
            </span>
            <span className="text-xs text-slate-400">familias validadas</span>
          </div>
          <div className="mt-3 text-xs text-cyan-400 flex items-center gap-1 font-medium">
            <span>0 duplicados o colados</span>
          </div>
        </div>

        {/* KPI 4: Mesas Mapeadas */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141829] to-[#0E101D] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Mesas Asignadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">35</span>
            <span className="text-xs text-slate-400">mesas distribuidas</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            <Link href="/admin/tables" className="text-purple-400 hover:underline flex items-center gap-1">
              <span>Ver plano del salón</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Guest List Interactive Table */}
      <div className="p-6 rounded-2xl bg-[#0D0F1B] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Lista Maestra de Invitados</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {filteredGuests.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic en el estado RSVP o en check-in para simular cambios instantáneos en la base de datos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-56 transition"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              {(["all", "CONFIRMED", "PENDING", "DECLINED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    statusFilter === filter
                      ? "bg-purple-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {filter === "all" ? "Todos" : filter === "CONFIRMED" ? "Confirmados" : filter === "PENDING" ? "Pendientes" : "Declinados"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Invitado Principal</th>
                <th className="px-4 py-3">Grupo / Familia</th>
                <th className="px-4 py-3">Mesa</th>
                <th className="px-4 py-3">Cupos</th>
                <th className="px-4 py-3">Estado RSVP</th>
                <th className="px-4 py-3">Acceso en Puerta</th>
                <th className="px-4 py-3 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 font-semibold text-white">
                    <div>{guest.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{guest.code}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{guest.tableName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono font-bold">
                      Mesa {guest.tableNumber < 10 ? `0${guest.tableNumber}` : guest.tableNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                    {guest.confirmedSeats} {guest.confirmedSeats === 1 ? "persona" : "personas"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        const next =
                          guest.status === "CONFIRMED"
                            ? "PENDING"
                            : guest.status === "PENDING"
                            ? "DECLINED"
                            : "CONFIRMED";
                        updateGuestStatus(guest.id, next);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                        guest.status === "CONFIRMED"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : guest.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                      title="Clic para cambiar estado en la demo"
                    >
                      {guest.status === "CONFIRMED" ? "✓ Confirmado" : guest.status === "PENDING" ? "⏳ Pendiente" : "✕ Declinó"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {guest.checkedIn ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>En Salón</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20 text-[11px] font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Por Ingresar</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleCheckIn(guest.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        guest.checkedIn
                          ? "bg-white/5 text-slate-400 hover:bg-white/10"
                          : "bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/50"
                      }`}
                    >
                      {guest.checkedIn ? "Deshacer" : "Simular Entrada"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
