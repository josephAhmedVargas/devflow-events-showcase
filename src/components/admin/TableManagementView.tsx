"use client";

import { useState, useEffect } from "react";
import { FloorMapVisualizer } from "@/components/admin/FloorMapVisualizer";
import { TableModal, TableItem } from "@/components/admin/TableModal";
import { confirmDelete, showErrorAlert, showToast } from "@/lib/swal";

interface UnassignedGuest {
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

interface TableMetrics {
  totalTables: number;
  totalCapacity: number;
  totalSeated: number;
  availableSeats: number;
  unassignedCount: number;
}

export function TableManagementView() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [unassignedGuests, setUnassignedGuests] = useState<UnassignedGuest[]>([]);
  const [metrics, setMetrics] = useState<TableMetrics>({
    totalTables: 20,
    totalCapacity: 210,
    totalSeated: 184,
    availableSeats: 26,
    unassignedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);

  const fetchTablesData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tables");
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
        setUnassignedGuests(data.unassignedGuests || data.unassignedConfirmedGuests || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Error loading tables data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedTable(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleOpenEditModal = (table: TableItem) => {
    setSelectedTable(table);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDeleteTable = async (tableId: string, name: string) => {
    const confirmed = await confirmDelete(name, "Esta mesa será removida y los invitados asignados quedarán sin mesa.");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/tables?tableId=${tableId}&force=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar mesa");
      showToast(`${name} eliminada correctamente`, "success");
      fetchTablesData();
    } catch (err: any) {
      showErrorAlert("Error al eliminar mesa", err.message || "No se pudo eliminar la mesa");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Title, Stats & CTA */}
      <div className="flex flex-col gap-3 pb-2 border-b border-slate-200/60">
        {/* Row 1: Title & Primary CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-[#0D1829] tracking-tight">
              Plano de Mesas &amp; Seating Chart
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0552AC] text-white text-[11px] font-bold shadow-2xs">
              {tables.length} Mesas Activas
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-sm hover:shadow flex items-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
              add_circle
            </span>
            <span>Nueva Mesa</span>
          </button>
        </div>

        {/* Row 2: Subtitle & Live Telemetry Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Distribución esquemática, aforo y balance de asientos
          </p>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Unassigned Warning Pill if any */}
            {metrics.unassignedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold shadow-2xs">
                <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
                <span>{metrics.unassignedCount} invitados sin mesa asignada</span>
              </div>
            )}

            {/* Capacity Pill */}
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                  Ocupación Total
                </span>
                <span className="text-xs font-bold text-[#0552AC] tabular-nums">
                  {metrics.totalSeated} / {metrics.totalCapacity} Sillas ({metrics.totalCapacity > 0 ? Math.round((metrics.totalSeated / metrics.totalCapacity) * 100) : 0}%)
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#001F54]">
                <span className="material-symbols-outlined text-[18px]">chair</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Floor Map Canvas */}
      <FloorMapVisualizer
        tables={tables}
        totalTables={tables.length}
        totalCapacity={metrics.totalCapacity}
        assignedSeats={metrics.totalSeated}
        availableSeats={metrics.availableSeats}
        hallName="Salón Principal"
        onManageTable={handleOpenEditModal}
      />

      {/* Banquet Tables Detailed Cards Grid */}
      <div id="tables-detail-section" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-lg font-bold text-[#0D1829]">
              Detalle de Mesas de Banquete &amp; Comensales
            </h2>
            <p className="text-xs text-slate-500">
              {tables.length} mesas registradas • Haz clic en &ldquo;Gestionar Asientos&rdquo; para agregar o cambiar invitados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <div className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-[#0552AC] border-t-transparent animate-spin"></span>
              <span className="text-xs font-semibold">Cargando distribución de mesas...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => {
              const seated =
                table.assignments?.reduce(
                  (acc, a) =>
                    acc +
                    (a.assignedSeats > 0
                      ? a.assignedSeats
                      : a.guest?.confirmedSeats && a.guest.confirmedSeats > 0
                      ? a.guest.confirmedSeats
                      : a.guest?.maxSeats || 1),
                  0
                ) || 0;
              const isFull = seated >= table.capacity;
              const percentage = Math.round((seated / table.capacity) * 100);

              return (
                <div
                  key={table.id}
                  id={`table-card-${table.id}`}
                  className={`bg-white rounded-2xl p-4 border transition duration-200 hover:shadow-md flex flex-col justify-between min-w-0 overflow-hidden ${
                    table.isVip
                      ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-xs"
                      : isFull
                      ? "border-slate-200/90 shadow-2xs"
                      : "border-amber-300 bg-amber-50/10 shadow-2xs"
                  }`}
                >
                  {/* Table Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            table.isVip
                              ? "bg-[#D4AF37] text-[#001F54]"
                              : isFull
                              ? "bg-[#0552AC] text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {table.isVip ? "VIP" : `M-${String(table.tableNumber).padStart(2, "0")}`}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            title={table.tableName}
                            className="text-xs font-bold text-[#0D1829] leading-tight truncate block"
                          >
                            {table.tableName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate block">
                            {table.zone || "Salón Principal"}
                          </span>
                        </div>
                      </div>

                      {/* Edit icon */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(table)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0552AC] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                        title="Editar detalles de mesa"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                    </div>

                    {/* Capacity Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span
                          className={`font-bold ${
                            table.isVip
                              ? "text-[#001F54]"
                              : isFull
                              ? "text-[#0552AC]"
                              : "text-amber-700"
                          }`}
                        >
                          {seated} / {table.capacity} Sillas
                        </span>
                        <span className="text-slate-400 font-medium">
                          {isFull ? "Completa" : `${table.capacity - seated} Libres`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-[width] ${
                            table.isVip
                              ? "bg-[#D4AF37]"
                              : isFull
                              ? "bg-[#0552AC]"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Mini Comensales Preview */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 min-w-0">
                      {table.assignments && table.assignments.length > 0 ? (
                        table.assignments.slice(0, 3).map((a) => (
                          <div key={a.id} className="text-[10px] text-slate-600 flex items-center justify-between gap-1.5 min-w-0">
                            <span
                              className="truncate min-w-0 flex-1"
                              title={`${a.guest?.person?.firstName} ${a.guest?.person?.lastName}`}
                            >
                              • {a.guest?.person?.firstName} {a.guest?.person?.lastName}
                            </span>
                            <span className="font-mono text-slate-400 shrink-0 tabular-nums">
                              ({a.assignedSeats}p)
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Mesa sin comensales asignados</span>
                      )}
                      {table.assignments && table.assignments.length > 3 && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          + {table.assignments.length - 3} personas más...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Table Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {table.isVip ? "Mesa de Honor" : `${seated} Asignados`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(table)}
                      className="text-xs font-bold text-[#0552AC] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Gestionar Asientos</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit Table & Seating Drawer */}
      {showModal && (
        <TableModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSaved={fetchTablesData}
          table={selectedTable}
          mode={modalMode}
          unassignedGuests={unassignedGuests}
        />
      )}
    </div>
  );
}
