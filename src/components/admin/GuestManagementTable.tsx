"use client";

import { useState, useEffect, useMemo } from "react";
import { DigitalPassModal } from "@/components/guest/DigitalPassModal";
import { GuestModal, GuestFormData } from "@/components/admin/GuestModal";
import { confirmDelete, showSuccessAlert, showErrorAlert, showToast } from "@/lib/swal";
import {
  parsePhoneNumber,
  isPhoneMissing,
  normalizePhoneForEvolutionApi,
  formatPhoneDisplay,
} from "@/lib/phone-utils";

interface TableItem {
  id: string;
  tableNumber: number;
  tableName: string;
  capacity: number;
}

interface GuestItem {
  id: string;
  invitationCode: string;
  status: "invited" | "confirmed" | "declined" | "waitlist";
  tier: string;
  maxSeats: number;
  confirmedSeats: number;
  isVip: boolean;
  internalNotes?: string | null;
  person?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  };
  tableAssignment?: {
    id: string;
    tableId: string;
    assignedSeats: number;
    table?: {
      tableNumber: number;
      tableName: string;
    };
  } | null;
  groupMemberships?: Array<{
    group?: {
      name: string;
    };
  }>;
}

export function GuestManagementTable() {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState<"all" | "missing" | "with_phone">("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state
  const [showPassModal, setShowPassModal] = useState(false);
  const [activeGuestCode, setActiveGuestCode] = useState("");

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestModalMode, setGuestModalMode] = useState<"create" | "edit">("create");
  const [editingGuestData, setEditingGuestData] = useState<GuestFormData | null>(null);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/guests");
      const data = await res.json();
      if (data.success && data.guests) {
        setGuests(data.guests);
      }
    } catch (err) {
      console.error("Error loading guests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/admin/tables");
      const data = await res.json();
      if (data.success && data.tables) {
        setTables(data.tables);
      }
    } catch (err) {
      console.error("Error loading tables:", err);
    }
  };

  useEffect(() => {
    fetchGuests();
    fetchTables();
  }, []);

  // Telemetry counts for phone registration
  const missingPhoneCount = useMemo(() => {
    return guests.filter((g) => isPhoneMissing(g.person?.phone)).length;
  }, [guests]);

  const withPhoneCount = useMemo(() => {
    return guests.filter((g) => !isPhoneMissing(g.person?.phone)).length;
  }, [guests]);

  const unassignedCount = useMemo(() => {
    return guests.filter((g) => !g.tableAssignment || !g.tableAssignment.tableId).length;
  }, [guests]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, tableFilter, phoneFilter, pageSize]);

  const handleOpenCreateModal = () => {
    setEditingGuestData(null);
    setGuestModalMode("create");
    setShowGuestModal(true);
  };

  const handleOpenEditModal = (g: GuestItem) => {
    setEditingGuestData({
      id: g.id,
      firstName: g.person?.firstName || "",
      lastName: g.person?.lastName || "",
      phone: g.person?.phone || "",
      email: g.person?.email || "",
      groupName: g.groupMemberships?.[0]?.group?.name || "Familia de Gala",
      tier: (g.tier as any) || "guest",
      maxSeats: g.maxSeats,
      confirmedSeats: g.confirmedSeats,
      status: g.status,
      isVip: Boolean(g.isVip),
      tableId: g.tableAssignment?.tableId || "",
      dietaryNotes: g.person?.notes || g.internalNotes || "",
    });
    setGuestModalMode("edit");
    setShowGuestModal(true);
  };

  const handleDeleteGuest = async (guestId: string, name: string) => {
    const confirmed = await confirmDelete(
      name,
      "Esta acción removerá al titular, sus acompañantes asignados y su pase digital de acceso."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/guests?guestId=${guestId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      showSuccessAlert("Invitado Eliminado", `"${name}" ha sido removido del padrón.`);
      fetchGuests();
    } catch (err: any) {
      showErrorAlert("Error al eliminar", err.message || "No se pudo eliminar el invitado.");
    }
  };

  const handleCopyEvolutionPhone = (evoPhone: string, name: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(evoPhone);
      showToast(`Copiado para Evolution API: ${evoPhone} (${name})`, "success");
    }
  };

  const handleExportCSV = () => {
    if (guests.length === 0) {
      showToast("No hay datos para exportar", "info");
      return;
    }
    const headers = [
      "Código",
      "Nombre",
      "Apellidos",
      "Teléfono_Formateado",
      "Teléfono_Evolution_API",
      "País",
      "Grupo",
      "Pases",
      "Confirmados",
      "Estado",
      "Mesa",
      "Dietas",
    ];
    const rows = filteredGuests.map((g) => {
      const parsed = parsePhoneNumber(g.person?.phone);
      return [
        g.invitationCode,
        g.person?.firstName || "",
        g.person?.lastName || "",
        parsed.formattedDisplay,
        parsed.evolutionApiNumber || "",
        parsed.countryName,
        g.groupMemberships?.[0]?.group?.name || "Familia",
        g.maxSeats,
        g.confirmedSeats,
        g.status,
        g.tableAssignment?.table?.tableName || "Sin mesa",
        `"${(g.person?.notes || g.internalNotes || "Ninguna").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invitados_dannia_xv_evolution_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Padrón exportado con formato Evolution API", "success");
  };

  // Filtered list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const fullName = `${g.person?.firstName || ""} ${g.person?.lastName || ""}`.toLowerCase();
      const groupName = (g.groupMemberships?.[0]?.group?.name || "").toLowerCase();
      const code = (g.invitationCode || "").toLowerCase();
      const phone = (g.person?.phone || "").toLowerCase();
      const isUnassigned = !g.tableAssignment || !g.tableAssignment.tableId;
      const tableName = (g.tableAssignment?.table?.tableName || "").toLowerCase();

      const matchesSearch =
        !searchQuery ||
        fullName.includes(searchQuery.toLowerCase()) ||
        groupName.includes(searchQuery.toLowerCase()) ||
        code.includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery.toLowerCase()) ||
        (isUnassigned && "sin mesa".includes(searchQuery.toLowerCase())) ||
        tableName.includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || g.status === statusFilter;
      const matchesTable =
        tableFilter === "all" ||
        (tableFilter === "unassigned" && isUnassigned) ||
        g.tableAssignment?.tableId === tableFilter;

      const isMissing = isPhoneMissing(g.person?.phone);
      const matchesPhone =
        phoneFilter === "all" ||
        (phoneFilter === "missing" && isMissing) ||
        (phoneFilter === "with_phone" && !isMissing);

      return matchesSearch && matchesStatus && matchesTable && matchesPhone;
    });
  }, [guests, searchQuery, statusFilter, tableFilter, phoneFilter]);

  // Pagination computations
  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredGuests.length);
  const paginatedGuests = filteredGuests.slice(startIndex, endIndex);

  // Generate page numbers for navigation pill bar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (validCurrentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <section className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-5 max-w-full overflow-hidden">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-lg font-bold text-[#0D1829] leading-tight">
            Directorio Activo de Invitados &amp; Asignación
          </h2>
          <p className="text-xs text-slate-500">
            Datos de demostración locales • Mostrando {filteredGuests.length} de {guests.length} titulares registrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto flex-1 min-w-0 sm:min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0552AC] focus:bg-white transition"
            />
          </div>

          {/* RSVP Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0552AC] cursor-pointer max-w-full truncate"
          >
            <option value="all">Estado: Todos</option>
            <option value="confirmed">Confirmados</option>
            <option value="invited">Pendientes</option>
            <option value="declined">Declinados</option>
          </select>

          {/* Phone Status Filter */}
          <select
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value as any)}
            className={`w-full sm:w-auto px-3 py-1.5 rounded-full border text-xs font-semibold focus:outline-none focus:border-[#0552AC] cursor-pointer max-w-full truncate ${
              phoneFilter === "missing"
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <option value="all">Teléfono: Todos ({guests.length})</option>
            <option value="missing">⚠️ Sin Teléfono ({missingPhoneCount})</option>
            <option value="with_phone">📱 Con WhatsApp ({withPhoneCount})</option>
          </select>

          {/* Table Filter */}
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0552AC] cursor-pointer max-w-full sm:max-w-[190px] truncate"
          >
            <option value="all">Mesa: Todas</option>
            <option value="unassigned">Sin Mesa Asignada</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                M-{String(t.tableNumber).padStart(2, "0")} • {t.tableName}
              </option>
            ))}
          </select>

          {/* CSV Export & Add Guest */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              title="Exportar a archivo Excel / CSV con formato Evolution API"
              className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Exportar</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 rounded-full bg-[#0552AC] text-white hover:bg-[#001F54] text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[17px] text-[#D4AF37]">
                person_add
              </span>
              <span>Añadir Invitado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Outreach Filter Chips: WhatsApp / Evolution API Readiness */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs border-t border-slate-100 pt-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-cinzel shrink-0">
          Estado WhatsApp:
        </span>

        <button
          type="button"
          onClick={() => setPhoneFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
            phoneFilter === "all"
              ? "bg-[#0552AC] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Todos los Invitados</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            phoneFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
          }`}>
            {guests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPhoneFilter("missing")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
            phoneFilter === "missing"
              ? "bg-amber-600 text-white shadow-xs ring-2 ring-amber-300"
              : missingPhoneCount > 0
              ? "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
              : "bg-slate-100 text-slate-400 cursor-default"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">phone_disabled</span>
          <span>Sin Tel&eacute;fono Registrado</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            phoneFilter === "missing"
              ? "bg-white/25 text-white"
              : "bg-amber-200 text-amber-900"
          }`}>
            {missingPhoneCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPhoneFilter("with_phone")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
            phoneFilter === "with_phone"
              ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">verified</span>
          <span>Listos Evolution API</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            phoneFilter === "with_phone"
              ? "bg-white/25 text-white"
              : "bg-emerald-200 text-emerald-900"
          }`}>
            {withPhoneCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTableFilter(tableFilter === "unassigned" ? "all" : "unassigned")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
            tableFilter === "unassigned"
              ? "bg-[#0552AC] text-white shadow-xs ring-2 ring-[#0552AC]/40"
              : unassignedCount > 0
              ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">chair</span>
          <span>Sin Mesa Asignada</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            tableFilter === "unassigned"
              ? "bg-white/25 text-white"
              : "bg-amber-200 text-amber-900"
          }`}>
            {unassignedCount}
          </span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Invitado Titular</th>
              <th className="py-3 px-4">Grupo / Familia</th>
              <th className="py-3 px-4 text-center">Pases</th>
              <th className="py-3 px-4">Estado RSVP</th>
              <th className="py-3 px-4">Mesa Asignada</th>
              <th className="py-3 px-4">Dietas / Alergias</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-[#0552AC] border-t-transparent animate-spin"></span>
                    <span>Cargando padrón de invitados...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedGuests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No se encontraron invitados con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedGuests.map((guest) => {
                const fullName = `${guest.person?.firstName || ""} ${guest.person?.lastName || ""}`.trim() || "Invitado";
                const initials = fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("");

                const groupName = guest.groupMemberships?.[0]?.group?.name || "Familia de Gala";
                const tableName = guest.tableAssignment?.table?.tableName || "Sin mesa asignada";
                const isAssigned = Boolean(guest.tableAssignment);

                return (
                  <tr key={guest.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Guest Name & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            guest.isVip
                              ? "bg-[#D4AF37]/20 text-[#001F54] border border-[#D4AF37]"
                              : "bg-[#0552AC]/10 text-[#0552AC]"
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#0D1829] truncate">
                              {fullName}
                            </span>
                            {guest.isVip && (
                              <span className="material-symbols-outlined text-[14px] text-[#D4AF37]" title="Invitado VIP">
                                star
                              </span>
                            )}
                          </div>
                          {(() => {
                            const rawPhone = guest.person?.phone;
                            const isMissing = isPhoneMissing(rawPhone);

                            if (isMissing) {
                              return (
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {guest.invitationCode}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    <span className="material-symbols-outlined text-[12px]">phone_disabled</span>
                                    <span>Sin tel&eacute;fono</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(guest)}
                                    className="text-[10px] text-[#0552AC] hover:underline font-bold cursor-pointer"
                                    title="Registrar número de teléfono"
                                  >
                                    + Registrar
                                  </button>
                                </div>
                              );
                            }

                            const phoneData = parsePhoneNumber(rawPhone);
                            return (
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {guest.invitationCode}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                                  <span>{phoneData.countryFlag}</span>
                                  <span className="font-mono">{phoneData.formattedDisplay}</span>
                                </span>
                                {phoneData.evolutionApiNumber && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyEvolutionPhone(phoneData.evolutionApiNumber!, fullName)}
                                    className="inline-flex items-center gap-1 text-[9px] font-mono font-bold bg-[#E8F0FE] text-[#0552AC] px-1.5 py-0.5 rounded border border-[#0552AC]/20 hover:bg-[#0552AC] hover:text-white transition cursor-pointer"
                                    title="Hacer clic para copiar número limpio para Evolution API"
                                  >
                                    <span className="material-symbols-outlined text-[11px]">content_copy</span>
                                    <span>Evo: {phoneData.evolutionApiNumber}</span>
                                  </button>
                                )}
                                {phoneData.waUrl && (
                                  <a
                                    href={phoneData.waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700 hover:scale-110 transition-transform p-0.5"
                                    title={`Abrir WhatsApp con ${fullName}`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">chat</span>
                                  </a>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </td>

                    {/* Group */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[#0552AC] text-[11px] font-semibold">
                        {groupName}
                      </span>
                    </td>

                    {/* Passes */}
                    <td className="py-3.5 px-4 text-center">
                      {guest.status === "confirmed" ? (
                        <>
                          <span className="font-bold text-emerald-700 text-sm">
                            {guest.confirmedSeats}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({guest.maxSeats} asignados)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-slate-400 text-sm">
                            0
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({guest.maxSeats} cupos)
                          </span>
                        </>
                      )}
                    </td>

                    {/* RSVP Status */}
                    <td className="py-3.5 px-4">
                      {guest.status === "confirmed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Confirmado
                        </span>
                      )}
                      {guest.status === "invited" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Pendiente
                        </span>
                      )}
                      {guest.status === "declined" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Declinado
                        </span>
                      )}
                      {guest.status === "waitlist" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
                          Lista de espera
                        </span>
                      )}
                    </td>

                    {/* Table Assignment */}
                    <td className="py-3.5 px-4">
                      {isAssigned ? (
                        <span className="font-semibold text-[#0552AC] text-xs">
                          {tableName}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-amber-700 italic text-[11px] font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Sin mesa asignada
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(guest)}
                            className="text-[10px] text-[#0552AC] hover:underline font-bold cursor-pointer"
                            title="Asignar mesa a este invitado"
                          >
                            + Asignar
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Diet */}
                    <td className="py-3.5 px-4">
                      {guest.person?.notes || guest.internalNotes ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                          {guest.person?.notes || guest.internalNotes}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Ninguna</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGuestCode(guest.invitationCode);
                            setShowPassModal(true);
                          }}
                          title="Ver Pase Digital QR"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0552AC] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            qr_code_2
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(guest)}
                          title="Editar Invitado & Asignación"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0552AC] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGuest(guest.id, fullName)}
                          title="Eliminar Invitado"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600/70 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* LUXURY PAGINATION BAR */}
      {filteredGuests.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          {/* Left: Summary text */}
          <div className="text-xs text-slate-500">
            Mostrando del <strong className="text-[#0D1829] font-bold">{startIndex + 1}</strong> al{" "}
            <strong className="text-[#0D1829] font-bold">{endIndex}</strong> de{" "}
            <strong className="text-[#0552AC] font-bold">{filteredGuests.length}</strong> invitados
          </div>

          {/* Center & Right: Page Size Selector + Pagination Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0552AC] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Primera página"
              >
                <span className="material-symbols-outlined text-[16px]">first_page</span>
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Página anterior"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, idx) => {
                if (typeof page === "string") {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400">
                      ...
                    </span>
                  );
                }

                const isCurrent = page === validCurrentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isCurrent
                        ? "bg-[#0552AC] text-white shadow-xs"
                        : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Página siguiente"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Última página"
              >
                <span className="material-symbols-outlined text-[16px]">last_page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showGuestModal && (
        <GuestModal
          isOpen={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          onSaved={() => {
            fetchGuests();
            fetchTables();
          }}
          initialData={editingGuestData}
          mode={guestModalMode}
          tables={tables}
        />
      )}

      {showPassModal && (
        <DigitalPassModal
          isOpen={showPassModal}
          initialCode={activeGuestCode}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </section>
  );
}
