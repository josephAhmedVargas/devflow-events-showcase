"use client";

import { useState, useMemo } from "react";
import type { TableItem } from "@/components/admin/TableModal";

interface FloorMapProps {
  totalTables?: number;
  totalCapacity?: number;
  assignedSeats?: number;
  availableSeats?: number;
  hallName?: string;
  tables?: TableItem[];
  onManageTable?: (table: TableItem) => void;
}

// Predefined architectural ballroom coordinates (35 official tables)
const PREDEFINED_COORDINATES: Record<number, { x: number; y: number }> = {
  // 1: Focal VIP Quinceañera Table (Front & Center)
  1: { x: 50, y: 25 },

  // Inner Ring: Pista Central & VIP Arc (flanking dance floor & honor table)
  2: { x: 35, y: 25 },
  5: { x: 65, y: 25 },
  3: { x: 23, y: 31 },
  25: { x: 77, y: 31 },
  4: { x: 32, y: 39 },
  32: { x: 68, y: 39 },

  // Stage Wing
  35: { x: 88, y: 10 },

  // Mid Inner Arc: Salón Los Cristales (encircling the dance floor)
  6: { x: 12, y: 21 },
  7: { x: 12, y: 36 },
  8: { x: 18, y: 48 },
  9: { x: 28, y: 51 },
  10: { x: 39, y: 50 },
  11: { x: 44, y: 39 },
  12: { x: 56, y: 39 },
  13: { x: 61, y: 50 },
  14: { x: 72, y: 51 },
  15: { x: 82, y: 48 },
  16: { x: 88, y: 36 },
  17: { x: 88, y: 21 },

  // Mid Outer Arc: Salón Los Cristales
  18: { x: 14, y: 64 },
  19: { x: 24, y: 64 },
  20: { x: 34, y: 63 },
  21: { x: 44, y: 62 },
  22: { x: 56, y: 62 },
  23: { x: 66, y: 63 },
  24: { x: 76, y: 64 },
  26: { x: 86, y: 64 },

  // Perimeter & Grand Entrance Foyer: Salón Los Cristales
  27: { x: 10, y: 78 },
  28: { x: 20, y: 79 },
  29: { x: 30, y: 80 },
  30: { x: 40, y: 81 },
  31: { x: 50, y: 81 },
  33: { x: 60, y: 81 },
  34: { x: 70, y: 80 },
};

// Fallback tables if none provided via props
const DEFAULT_MOCK_TABLES: TableItem[] = Array.from({ length: 37 }, (_, i) => {
  const num = i + 1;
  const isVip = num === 1 || num === 2 || num === 25 || num === 32;
  const zone =
    num === 1
      ? "Zona VIP"
      : [2, 3, 4, 5, 25, 32].includes(num)
      ? "Pista Central"
      : num === 35
      ? "Área de Escenario"
      : "Salón Los Cristales";

  return {
    id: `default-table-${num}`,
    tableNumber: num,
    tableName:
      num === 1
        ? "Mesa 01 • Dannia Carolina & Niños Mendoza"
        : `Mesa ${String(num).padStart(2, "0")}`,
    capacity: num === 2 || num === 6 || num === 26 ? 12 : 10,
    zone,
    isVip,
    assignments: [],
  };
});

function computeTablePosition(
  table: TableItem,
  index: number
): { x: number; y: number } {
  if (PREDEFINED_COORDINATES[table.tableNumber]) {
    return PREDEFINED_COORDINATES[table.tableNumber];
  }
  // Position any extra / test tables (like table 89) in the perimeter reserve slots
  const overflowIndex = index >= 35 ? index - 35 : index;
  const x = 78 + (overflowIndex % 3) * 10;
  const y = 78 + Math.floor(overflowIndex / 3) * 11;
  return { x: Math.min(93, x), y: Math.min(92, y) };
}

function getTableSeatedCount(table: TableItem): number {
  if (!table.assignments || table.assignments.length === 0) return 0;
  return table.assignments.reduce(
    (acc, a) =>
      acc +
      (a.assignedSeats > 0
        ? a.assignedSeats
        : a.guest?.confirmedSeats && a.guest.confirmedSeats > 0
        ? a.guest.confirmedSeats
        : a.guest?.maxSeats || 1),
    0
  );
}

export function FloorMapVisualizer({
  totalTables,
  totalCapacity = 376,
  assignedSeats = 323,
  availableSeats = 53,
  hallName = "Salón Principal",
  tables,
  onManageTable,
}: FloorMapProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [filterZone, setFilterZone] = useState<"all" | "pista" | "cristales" | "available">(
    "all"
  );

  const displayTables = useMemo(() => {
    if (tables && tables.length > 0) {
      return tables;
    }
    return DEFAULT_MOCK_TABLES;
  }, [tables]);

  const actualTotalTables = totalTables || displayTables.length;

  // Selected table object
  const selectedTable = useMemo(
    () => displayTables.find((t) => t.id === selectedTableId) || null,
    [displayTables, selectedTableId]
  );

  const selectedTableSeated = selectedTable ? getTableSeatedCount(selectedTable) : 0;

  // Filter checker
  const isTableVisible = (table: TableItem) => {
    if (filterZone === "all") return true;
    if (filterZone === "pista") {
      return (
        table.isVip ||
        table.zone?.toLowerCase().includes("pista") ||
        table.zone?.toLowerCase().includes("vip") ||
        [1, 2, 3, 4, 5, 25, 32].includes(table.tableNumber)
      );
    }
    if (filterZone === "cristales") {
      return (
        table.zone?.toLowerCase().includes("cristales") ||
        ![1, 2, 3, 4, 5, 25, 32, 35].includes(table.tableNumber)
      );
    }
    if (filterZone === "available") {
      const seated = getTableSeatedCount(table);
      return seated < table.capacity;
    }
    return true;
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
      {/* Header with Title & Zone Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0552AC]/10 text-[#0552AC] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">map</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-bold text-[#0D1829] leading-tight">
                Plano Esquemático — {hallName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {actualTotalTables} Mesas
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Distribución completa de las {actualTotalTables} mesas de banquete • Haz clic en cualquier mesa para detalles
            </p>
          </div>
        </div>

        {/* Filters & Scroll Shortcut */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterZone("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterZone === "all"
                  ? "bg-white text-[#0552AC] shadow-2xs"
                  : "text-slate-600 hover:text-[#0D1829]"
              }`}
            >
              Todas ({displayTables.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterZone("pista")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterZone === "pista"
                  ? "bg-white text-[#0552AC] shadow-2xs"
                  : "text-slate-600 hover:text-[#0D1829]"
              }`}
            >
              Pista &amp; VIP
            </button>
            <button
              type="button"
              onClick={() => setFilterZone("cristales")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterZone === "cristales"
                  ? "bg-white text-[#0552AC] shadow-2xs"
                  : "text-slate-600 hover:text-[#0D1829]"
              }`}
            >
              Los Cristales
            </button>
            <button
              type="button"
              onClick={() => setFilterZone("available")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterZone === "available"
                  ? "bg-amber-100 text-amber-900 shadow-2xs"
                  : "text-slate-600 hover:text-[#0D1829]"
              }`}
            >
              Con Cupo
            </button>
          </div>

          <button
            type="button"
            onClick={() => scrollToSection("tables-detail-section")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Ver Tarjetas</span>
          </button>
        </div>
      </div>

      {/* Schematic Floor Map Canvas Container (Supports Horizontal Scroll on Mobile) */}
      <div className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-2xl relative overflow-hidden flex flex-col items-center">
        {/* Scrollable ballroom container */}
        <div className="w-full overflow-x-auto select-none py-4 px-2 flex justify-center">
          <div className="relative w-[920px] h-[640px] shrink-0">
            {/* Ambient Hall Architectural Blueprint Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0552AC_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none rounded-xl" />

            {/* Central Aisle / Pasillo Central Walkway */}
            <div className="absolute top-[16%] bottom-[12%] left-1/2 -translate-x-1/2 w-0 border-l border-dashed border-slate-300/70 pointer-events-none z-0" />

            {/* Ambient Stage Lighting Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[120px] bg-gradient-to-b from-[#0552AC]/10 via-[#D4AF37]/5 to-transparent rounded-full blur-xl pointer-events-none" />

            {/* Stage / Pista de Baile Lumínica Banner (Top Center) */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[460px] h-10 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border border-slate-300/90 rounded-full flex items-center justify-center shadow-xs z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#0552AC] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
                  auto_awesome
                </span>
                Escenario Principal • Pista de Baile Lumínica
                <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">
                  auto_awesome
                </span>
              </span>
            </div>

            {/* Render All 37 Tables */}
            {displayTables.map((table, index) => {
              const pos = computeTablePosition(table, index);
              const seated = getTableSeatedCount(table);
              const isFull = seated >= table.capacity;
              const hasSeatsAvailable = seated < table.capacity && seated > 0;
              const isEmpty = seated === 0;
              const isSelected = selectedTableId === table.id;
              const isHovered = hoveredTableId === table.id;
              const isVisible = isTableVisible(table);
              const isHonorTable = table.tableNumber === 1 || table.isVip && table.tableNumber === 1;

              // Format Table Number Label
              const label = isHonorTable
                ? "HONOR"
                : `M-${String(table.tableNumber).padStart(2, "0")}`;

              return (
                <div
                  key={table.id}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                  onMouseEnter={() => setHoveredTableId(table.id)}
                  onMouseLeave={() => setHoveredTableId(null)}
                  onClick={() =>
                    setSelectedTableId((prev) => (prev === table.id ? null : table.id))
                  }
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition duration-200 cursor-pointer ${
                    isVisible ? "opacity-100" : "opacity-25 grayscale-[60%] pointer-events-none"
                  } ${
                    isSelected ? "z-30 scale-110" : isHovered ? "z-20 scale-105" : "z-10"
                  }`}
                >
                  {/* Table Circle */}
                  {isHonorTable ? (
                    // Mesa de Honor Quinceañera (Larger, Gold Ring, Crown)
                    <div
                      className={`w-16 h-16 rounded-full bg-white shadow-md flex flex-col items-center justify-center p-1 text-center transition ring-4 ring-[#D4AF37]/50 hover:ring-[#D4AF37] ${
                        isSelected
                          ? "ring-[#0552AC] border-2 border-[#0552AC] shadow-lg scale-105"
                          : "border border-[#D4AF37]"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[#D4AF37] text-[18px] leading-none -mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        crown
                      </span>
                      <span className="text-[9px] uppercase font-bold text-[#0D1829] leading-tight">
                        M-01
                      </span>
                      <span className="text-[8px] font-bold text-[#D4AF37] leading-none tabular-nums">
                        {seated}/{table.capacity} VIP
                      </span>
                    </div>
                  ) : (
                    // Regular Banquet Tables (M-02 to M-37)
                    <div
                      className={`w-11 h-11 rounded-full shadow-2xs flex flex-col items-center justify-center text-center transition ${
                        isSelected
                          ? "ring-4 ring-[#0552AC] border-2 border-[#0552AC] bg-white shadow-md"
                          : table.isVip
                          ? "border-2 border-[#D4AF37] bg-amber-50/70 hover:bg-amber-100/60 ring-2 ring-[#D4AF37]/20"
                          : isFull
                          ? "border border-[#0552AC]/60 bg-white hover:border-[#0552AC]"
                          : hasSeatsAvailable
                          ? "border-2 border-amber-400 bg-amber-50/80 hover:bg-amber-100"
                          : "border border-dashed border-slate-300 bg-slate-50/90 text-slate-400"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold leading-tight ${
                          table.isVip
                            ? "text-[#001F54]"
                            : isFull
                            ? "text-[#0552AC]"
                            : hasSeatsAvailable
                            ? "text-amber-900"
                            : "text-slate-400"
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-[8px] font-semibold tabular-nums leading-none ${
                          table.isVip
                            ? "text-[#D4AF37]"
                            : isFull
                            ? "text-slate-500"
                            : hasSeatsAvailable
                            ? "text-amber-700 font-bold"
                            : "text-slate-400"
                        }`}
                      >
                        {seated}/{table.capacity}
                      </span>
                    </div>
                  )}

                  {/* Floating Hover Tooltip */}
                  {isHovered && !isSelected && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-50 whitespace-nowrap bg-[#0D1829] text-white text-[11px] rounded-xl px-3 py-1.5 shadow-2xl border border-slate-700/80 flex flex-col gap-0.5 animate-in fade-in duration-100">
                      <div className="flex items-center gap-1.5 font-bold">
                        {table.isVip && <span className="text-[#D4AF37]">★</span>}
                        <span>{table.tableName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-300">
                        <span>{table.zone || "Salón Principal"}</span>
                        <span
                          className={
                            isFull
                              ? "text-blue-300 font-semibold"
                              : hasSeatsAvailable
                              ? "text-amber-300 font-semibold"
                              : "text-slate-400"
                          }
                        >
                          {seated} de {table.capacity} sillas ({Math.round((seated / table.capacity) * 100)}%)
                        </span>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0D1829]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Grand Entrance Architectural Marker (Bottom Center) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-200/90 border border-slate-300 text-slate-600 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-2xs z-10 pointer-events-none">
              <span className="material-symbols-outlined text-[13px] text-slate-500">
                door_front
              </span>
              Entrada Principal de Gala &amp; Recepción
            </div>
          </div>
        </div>

        {/* Mobile pan hint */}
        <div className="md:hidden text-[10px] text-slate-400 py-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">swipe</span>
          <span>Desliza horizontalmente para explorar el salón completo</span>
        </div>
      </div>

      {/* Selected Table Interactive Detail Card */}
      {selectedTable && (
        <div className="bg-gradient-to-r from-blue-50/70 via-white to-amber-50/30 border border-[#0552AC]/20 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                selectedTable.isVip
                  ? "bg-[#D4AF37] text-[#001F54] ring-2 ring-[#D4AF37]/50"
                  : selectedTableSeated >= selectedTable.capacity
                  ? "bg-[#0552AC] text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {selectedTable.tableNumber === 1 ? "VIP" : `M-${String(selectedTable.tableNumber).padStart(2, "0")}`}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline text-base font-bold text-[#0D1829]">
                  {selectedTable.tableName}
                </h3>
                {selectedTable.isVip && (
                  <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#001F54] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-[#D4AF37]">crown</span>
                    VIP
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                  {selectedTable.zone || "Salón Principal"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                <span className="font-semibold text-[#0552AC]">
                  {selectedTableSeated} / {selectedTable.capacity} Sillas Ocupadas (
                  {selectedTable.capacity > 0 ? Math.round((selectedTableSeated / selectedTable.capacity) * 100) : 0}%)
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  {selectedTable.capacity - selectedTableSeated > 0
                    ? `${selectedTable.capacity - selectedTableSeated} cupos libres`
                    : "Mesa Completa al 100%"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onManageTable && (
              <button
                type="button"
                onClick={() => onManageTable(selectedTable)}
                className="px-3.5 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Gestionar Asientos</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(`table-card-${selectedTable.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("ring-4", "ring-[#0552AC]");
                  setTimeout(() => el.classList.remove("ring-4", "ring-[#0552AC]"), 2000);
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Localizar en la cuadrícula de tarjetas"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Localizar</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTableId(null)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar detalle"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="w-full flex items-center justify-center gap-6 text-[11px] text-slate-500 pt-1 z-10 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white border-2 border-[#D4AF37] ring-1 ring-[#D4AF37]/40"></span>
          Mesa VIP / Honor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#0552AC]"></span>
          Mesa Completa (100%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          Con Cupo Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white border border-dashed border-slate-400"></span>
          Sin Asignar
        </span>
      </div>

      {/* Seating Summary Mini-bar */}
      <div className="grid grid-cols-3 gap-3 text-center pt-1">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Capacidad Total
          </span>
          <p className="font-headline text-base font-bold text-[#0D1829] tabular-nums">
            {totalCapacity} Sillas
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sillas Asignadas
          </span>
          <p className="font-headline text-base font-bold text-[#0552AC] tabular-nums">
            {assignedSeats} Sillas
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Disponibles
          </span>
          <p className="font-headline text-base font-bold text-[#D4AF37] tabular-nums">
            {availableSeats} Libres
          </p>
        </div>
      </div>
    </div>
  );
}
