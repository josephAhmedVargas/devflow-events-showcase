"use client";

import { useState, useEffect, useMemo } from "react";
import { parsePhoneNumber, formatPhoneE164 } from "@/lib/phone-utils";

export interface GuestFormData {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  groupName: string;
  tier: "vip" | "family" | "honor_court" | "guest";
  maxSeats: number;
  confirmedSeats: number;
  status: "invited" | "confirmed" | "declined" | "waitlist";
  isVip: boolean;
  tableId: string;
  dietaryNotes: string;
}

interface TableOption {
  id: string;
  tableNumber: number;
  tableName: string;
  capacity: number;
}

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Partial<GuestFormData> | null;
  mode: "create" | "edit";
  tables?: TableOption[];
}

export function GuestModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  mode,
  tables = [],
}: GuestModalProps) {
  const [formData, setFormData] = useState<GuestFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    groupName: "Familia de Gala",
    tier: "guest",
    maxSeats: 2,
    confirmedSeats: 0,
    status: "invited",
    isVip: false,
    tableId: "",
    dietaryNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        groupName: initialData.groupName || "Familia de Gala",
        tier: initialData.tier || "guest",
        maxSeats: initialData.maxSeats ?? 2,
        confirmedSeats: initialData.confirmedSeats ?? 0,
        status: initialData.status || "invited",
        isVip: Boolean(initialData.isVip),
        tableId: initialData.tableId || "",
        dietaryNotes: initialData.dietaryNotes || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        groupName: "Familia de Gala",
        tier: "guest",
        maxSeats: 2,
        confirmedSeats: 0,
        status: "invited",
        isVip: false,
        tableId: "",
        dietaryNotes: "",
      });
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage("Por favor ingrese nombre y apellido");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const cleanPhone = formData.phone.trim()
        ? formatPhoneE164(formData.phone) || formData.phone.trim()
        : "";

      const payload = {
        ...formData,
        phone: cleanPhone,
      };

      if (mode === "create") {
        const res = await fetch("/api/admin/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear invitado");
      } else {
        const res = await fetch("/api/admin/guests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestId: formData.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: cleanPhone,
            tableId: formData.tableId || null,
            status: formData.status,
            maxSeats: formData.maxSeats,
            confirmedSeats: formData.confirmedSeats,
            isVip: formData.isVip,
            notes: formData.dietaryNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar invitado");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0552AC]/10 text-[#0552AC] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">
                {mode === "create" ? "person_add" : "edit"}
              </span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#0D1829]">
                {mode === "create" ? "Registrar Nuevo Invitado" : "Editar Invitado & Pases"}
              </h3>
              <p className="text-xs text-slate-500">
                Pase digital de gala D&apos;CAROL • Quince Años Dannia Carolina
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Nombre(s) *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Ej. Roberto"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Ej. Mendoza"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tel&eacute;fono WhatsApp
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Evolution API / E.164
                </span>
              </div>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej. +505 8429-8767, +506..., +1..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              />
              {/* Live Evolution API Format Preview */}
              {(() => {
                const phonePreview = parsePhoneNumber(formData.phone);
                if (!formData.phone.trim()) {
                  return (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Sin registrar a&uacute;n (puedes agregarlo luego o pegar con prefijo internacional).
                    </span>
                  );
                }
                return (
                  <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{phonePreview.countryFlag}</span>
                      <span className="font-semibold text-slate-700">{phonePreview.countryName}:</span>
                      <span className="font-mono text-[#0552AC] font-bold">{phonePreview.formattedDisplay}</span>
                    </div>
                    {phonePreview.evolutionApiNumber ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold shrink-0 flex items-center gap-1">
                        <span>✓ Evo:</span>
                        <span>{phonePreview.evolutionApiNumber}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                        Incompleto
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Grupo / Familia
              </label>
              <input
                type="text"
                value={formData.groupName}
                onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                placeholder="Ej. Amigos del Colegio"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Passes & RSVP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Pases Asignados
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxSeats}
                onChange={(e) => setFormData({ ...formData, maxSeats: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              />
            </div>
            <div className="min-w-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Estado RSVP
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full max-w-full truncate px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              >
                <option value="invited">Pendiente (Invitado)</option>
                <option value="confirmed">Confirmado</option>
                <option value="declined">Declinado</option>
                <option value="waitlist">Lista de espera</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Confirmados
              </label>
              <input
                type="number"
                min="0"
                max={formData.maxSeats}
                value={formData.confirmedSeats}
                onChange={(e) => setFormData({ ...formData, confirmedSeats: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Table Assignment & VIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="min-w-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Mesa Asignada
              </label>
              <select
                value={formData.tableId}
                onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                className="w-full max-w-full truncate px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
              >
                <option value="">Sin mesa asignada</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    M-{String(t.tableNumber).padStart(2, "0")} • {t.tableName} ({t.capacity} sillas)
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-4 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVip}
                  onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition peer-checked:bg-[#D4AF37]"></div>
              </label>
              <span className="text-xs font-bold text-[#0D1829] flex items-center gap-1">
                <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">
                  workspace_premium
                </span>
                Invitado de Honor / VIP
              </span>
            </div>
          </div>

          {/* Dietary Notes */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Requerimiento Dietético o Alergia
            </label>
            <input
              type="text"
              value={formData.dietaryNotes}
              onChange={(e) => setFormData({ ...formData, dietaryNotes: e.target.value })}
              placeholder="Ej. 1x Vegetariano, alérgico a mariscos..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none transition"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px] text-[#D4AF37]">
                save
              </span>
              <span>{loading ? "Guardando..." : mode === "create" ? "Registrar Invitado" : "Guardar Cambios"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
