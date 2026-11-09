"use client";

import { useState, useEffect } from "react";
import { confirmDelete, showToast } from "@/lib/swal";

export interface TimelineItemData {
  id?: string;
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
  icon: string;
  isHighlight: boolean;
  status: "scheduled" | "current" | "completed";
}

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: TimelineItemData | null;
  mode: "create" | "edit";
}

const AVAILABLE_ICONS = [
  { key: "celebration", label: "Celebración" },
  { key: "church", label: "Ceremonia / Misa" },
  { key: "music_note", label: "Vals / Música" },
  { key: "restaurant", label: "Banquete / Cena" },
  { key: "local_bar", label: "Brindis / Bar" },
  { key: "star", label: "Momento de Gala" },
  { key: "photo_camera", label: "Sesión Fotográfica" },
  { key: "schedule", label: "Recepción / General" },
];

export function TimelineModal({
  isOpen,
  onClose,
  onSaved,
  item,
  mode,
}: TimelineModalProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("celebration");
  const [isHighlight, setIsHighlight] = useState(false);
  const [status, setStatus] = useState<"scheduled" | "current" | "completed">("scheduled");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      // Format time string if ISO
      if (item.startTime && item.startTime.includes("T")) {
        const d = new Date(item.startTime);
        setStartTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      } else {
        setStartTime(item.startTime || "18:00");
      }
      if (item.endTime && item.endTime.includes("T")) {
        const d = new Date(item.endTime);
        setEndTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      } else {
        setEndTime(item.endTime || "19:00");
      }
      setDescription(item.description || "");
      setIcon(item.icon || "celebration");
      setIsHighlight(Boolean(item.isHighlight));
      setStatus(item.status || "scheduled");
    } else {
      setTitle("");
      setStartTime("18:00");
      setEndTime("19:00");
      setDescription("");
      setIcon("celebration");
      setIsHighlight(false);
      setStatus("scheduled");
    }
    setErrorMessage(null);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Por favor ingrese el título del hito");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/timeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            startTime,
            endTime,
            description,
            icon,
            isHighlight,
            status,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear hito");
      } else {
        const res = await fetch("/api/admin/timeline", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: item?.id,
            title,
            description,
            icon,
            isHighlight,
            status,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al actualizar hito");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    const confirmed = await confirmDelete(item.title || "este hito", "¿Deseas eliminar este hito del cronograma?");
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/timeline?itemId=${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");

      showToast(`Hito "${item.title}" eliminado`, "success");
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0552AC]/10 text-[#0552AC] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#0D1829]">
                {mode === "create" ? "Nuevo Hito del Cronograma" : "Editar Hito Ceremonial"}
              </h3>
              <p className="text-xs text-slate-500">
                Itinerario oficial D&apos;CAROL • Sincronización en Vivo
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Nombre de la Etapa / Momento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Entrada Triunfal &amp; Vals de Honor"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Hora de Inicio *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Hora de Fin (Aprox.)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Ícono Representativo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic.key}
                  onClick={() => setIcon(ic.key)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                    icon === ic.key
                      ? "border-[#0552AC] bg-[#0552AC]/10 text-[#0552AC] font-bold ring-2 ring-[#0552AC]/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{ic.key}</span>
                  <span className="text-[9px] truncate max-w-full">{ic.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Instrucciones / Descripción Operativa
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Pista iluminada, música solemne, proyección en pantalla LED..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none resize-none"
            />
          </div>

          {/* Highlight & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighlight}
                  onChange={(e) => setIsHighlight(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition peer-checked:bg-[#D4AF37]"></div>
              </label>
              <span className="text-xs font-bold text-[#0D1829] flex items-center gap-1">
                <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">
                  auto_awesome
                </span>
                Momento Estelar
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Estado Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
              >
                <option value="scheduled">Programado</option>
                <option value="current">En Curso (Directo)</option>
                <option value="completed">Concluido</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Eliminar Hito
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
                <span>{loading ? "Guardando..." : "Guardar Hito"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
