"use client";

import { useState, useEffect } from "react";
import { confirmDelete, showToast } from "@/lib/swal";

export interface TableItem {
  id: string;
  tableNumber: number;
  tableName: string;
  capacity: number;
  zone: string;
  isVip: boolean;
  notes?: string | null;
  assignments?: Array<{
    id: string;
    assignedSeats: number;
    guest?: {
      id: string;
      invitationCode: string;
      person?: {
        firstName: string;
        lastName: string;
        phone?: string | null;
      };
      confirmedSeats: number;
      maxSeats?: number;
    };
  }>;
}

export interface UnassignedGuest {
  id: string;
  invitationCode: string;
  confirmedSeats: number;
  maxSeats?: number;
  status?: string;
  isVip?: boolean;
  person?: {
    firstName: string;
    lastName: string;
  };
}

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  table?: TableItem | null;
  mode: "create" | "edit";
  unassignedGuests?: UnassignedGuest[];
}

export function TableModal({
  isOpen,
  onClose,
  onSaved,
  table,
  mode,
  unassignedGuests = [],
}: TableModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "seats">("details");
  const [tableName, setTableName] = useState("");
  const [tableNumber, setTableNumber] = useState(1);
  const [capacity, setCapacity] = useState(10);
  const [zone, setZone] = useState("Salón Principal");
  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState("");

  // Seats assignment state
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [seatsToAssign, setSeatsToAssign] = useState(2);
  const [overrideCapacity, setOverrideCapacity] = useState(false);
  const [unassignedSearch, setUnassignedSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (table) {
      setTableName(table.tableName || "");
      setTableNumber(table.tableNumber || 1);
      setCapacity(table.capacity || 10);
      setZone(table.zone || "Salón Principal");
      setIsVip(Boolean(table.isVip));
      setNotes(table.notes || "");
    } else {
      setTableName("");
      setTableNumber(1);
      setCapacity(10);
      setZone("Salón Principal");
      setIsVip(false);
      setNotes("");
    }
    setActiveTab("details");
    setUnassignedSearch("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [table, isOpen]);

  if (!isOpen) return null;

  const currentSeated =
    table?.assignments?.reduce(
      (acc, a) =>
        acc +
        (a.assignedSeats > 0
          ? a.assignedSeats
          : a.guest?.confirmedSeats && a.guest.confirmedSeats > 0
          ? a.guest.confirmedSeats
          : a.guest?.maxSeats || 1),
      0
    ) || 0;

  const filteredUnassigned = unassignedGuests.filter((g) => {
    if (!unassignedSearch.trim()) return true;
    const q = unassignedSearch.toLowerCase().trim();
    const name = `${g.person?.firstName || ""} ${g.person?.lastName || ""}`.toLowerCase();
    const code = (g.invitationCode || "").toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber,
            tableName,
            capacity,
            zone,
            isVip,
            notes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear mesa");
      } else {
        const res = await fetch("/api/admin/tables", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: table?.id,
            tableName,
            capacity,
            zone,
            isVip,
            notes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar mesa");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignGuest = async () => {
    if (!table?.id || !selectedGuestId) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: table.id,
          action: "assign_guest",
          guestId: selectedGuestId,
          seats: seatsToAssign,
          capacityOverride: overrideCapacity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar comensal");

      setSuccessMessage("Comensal asignado con éxito");
      setSelectedGuestId("");
      onSaved();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al asignar comensal");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignGuest = async (guestId: string) => {
    if (!table?.id || !guestId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: table.id,
          action: "unassign_guest",
          guestId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al retirar comensal");

      setSuccessMessage("Comensal retirado de la mesa");
      onSaved();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al retirar comensal");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!table?.id) return;
    const confirmed = await confirmDelete(table.tableName, "Se eliminará esta mesa y las asignaciones de comensales.");
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tables?tableId=${table.id}&force=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar mesa");

      showToast(`${table.tableName} eliminada correctamente`, "success");
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al eliminar mesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isVip ? "bg-[#D4AF37] text-[#001F54]" : "bg-[#0552AC] text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">table_restaurant</span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#0D1829]">
                {mode === "create" ? "Crear Mesa de Banquete" : `Mesa ${tableNumber}: ${tableName}`}
              </h3>
              <p className="text-xs text-slate-500">
                Aforo máximo: {capacity} personas • Ocupados: {currentSeated}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher (Only in edit mode) */}
        {mode === "edit" && (
          <div className="px-6 pt-3 flex border-b border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                activeTab === "details"
                  ? "border-[#0552AC] text-[#0552AC]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Detalles &amp; Aforo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seats")}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "seats"
                  ? "border-[#0552AC] text-[#0552AC]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Gestionar Asientos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {currentSeated}/{capacity}
              </span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab 1: Table Info Form */}
          {activeTab === "details" && (
            <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Número de Mesa
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Nombre o Distintivo *
                  </label>
                  <input
                    type="text"
                    required
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="Ej. Mesa de Honor • Dannia &amp; Corte"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Capacidad (Sillas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Zona del Salón
                  </label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full max-w-full truncate px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
                  >
                    <option value="Salón Principal">Salón Principal</option>
                    <option value="Pista Central">Pista Central</option>
                    <option value="Zona VIP">Zona VIP</option>
                    <option value="Terraza Jardín">Terraza Jardín</option>
                  </select>
                </div>
              </div>

              {/* VIP switch */}
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVip}
                    onChange={(e) => setIsVip(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition peer-checked:bg-[#D4AF37]"></div>
                </label>
                <span className="text-xs font-bold text-[#0D1829] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">
                    star
                  </span>
                  Mesa de Honor / VIP
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Frente a pantalla LED, colocar sillas para niños..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {mode === "edit" ? (
                  <button
                    type="button"
                    onClick={handleDeleteTable}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Eliminar Mesa
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[17px] text-[#D4AF37]">save</span>
                    <span>{loading ? "Guardando..." : "Guardar Mesa"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Manage Seats Panel */}
          {activeTab === "seats" && table && (
            <div className="flex flex-col gap-5">
              {/* Capacity Progress Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-[#0D1829]">
                  <span>Ocupación de Mesa</span>
                  <span className={currentSeated > capacity ? "text-rose-600" : "text-[#0552AC]"}>
                    {currentSeated} / {capacity} Sillas ({Math.round((currentSeated / capacity) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] ${
                      currentSeated > capacity
                        ? "bg-rose-500"
                        : currentSeated === capacity
                        ? "bg-emerald-500"
                        : "bg-[#0552AC]"
                    }`}
                    style={{ width: `${Math.min(100, (currentSeated / capacity) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Add Unassigned Guest Subform */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0D1829] uppercase tracking-wider">
                    Asignar Invitado a esta Mesa
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {unassignedGuests.length} sin mesa en el evento
                  </span>
                </div>

                {/* Search Bar for Unassigned Guests */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={unassignedSearch}
                    onChange={(e) => setUnassignedSearch(e.target.value)}
                    placeholder="Filtrar por nombre o código de invitación..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div className="sm:col-span-2 min-w-0">
                    <select
                      value={selectedGuestId}
                      onChange={(e) => {
                        const gId = e.target.value;
                        setSelectedGuestId(gId);
                        const found = unassignedGuests.find((u) => u.id === gId);
                        if (found) {
                          const passes =
                            found.confirmedSeats > 0 ? found.confirmedSeats : found.maxSeats || 1;
                          setSeatsToAssign(passes);
                        }
                      }}
                      className="w-full max-w-full truncate px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
                    >
                      <option value="">
                        --{" "}
                        {filteredUnassigned.length === unassignedGuests.length
                          ? `Seleccionar (${unassignedGuests.length} sin mesa)`
                          : `Resultados (${filteredUnassigned.length} de ${unassignedGuests.length})`}{" "}
                        --
                      </option>
                      {filteredUnassigned.map((g) => {
                        const passes =
                          g.confirmedSeats > 0 ? g.confirmedSeats : g.maxSeats || 1;
                        return (
                          <option key={g.id} value={g.id}>
                            {g.person?.firstName} {g.person?.lastName} ({passes}{" "}
                            {passes === 1 ? "pase" : "pases"}) • {g.invitationCode}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={seatsToAssign}
                      onChange={(e) => setSeatsToAssign(Number(e.target.value))}
                      placeholder="Sillas"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 text-center font-bold text-[#0552AC] focus:bg-white focus:border-[#0552AC]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideCapacity}
                      onChange={(e) => setOverrideCapacity(e.target.checked)}
                      className="rounded text-[#0552AC] focus:ring-0"
                    />
                    <span>Permitir sobrecupo excepcional (Override)</span>
                  </label>

                  <button
                    type="button"
                    disabled={!selectedGuestId || loading}
                    onClick={handleAssignGuest}
                    className="px-4 py-1.5 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 disabled:opacity-40 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Sentar a la Mesa</span>
                  </button>
                </div>
              </div>

              {/* Currently Seated Guests List */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-[#0D1829] uppercase tracking-wider">
                  Invitados Actualmente Sentados ({table.assignments?.length || 0})
                </h4>

                {(!table.assignments || table.assignments.length === 0) ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Mesa vacía. Aún no hay comensales asignados.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {table.assignments.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#0552AC]/10 text-[#0552AC] flex items-center justify-center text-xs font-bold">
                            {(a.guest?.person?.firstName?.[0] || "I") + (a.guest?.person?.lastName?.[0] || "")}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#0D1829]">
                              {a.guest?.person?.firstName} {a.guest?.person?.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {a.guest?.invitationCode} • {a.assignedSeats} asiento(s)
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => a.guest && handleUnassignGuest(a.guest.id)}
                          className="p-1 rounded-lg text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Retirar de esta mesa"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
