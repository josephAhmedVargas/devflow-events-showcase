"use client";

import { useState, useEffect } from "react";
import { TimelineModal, TimelineItemData } from "@/components/admin/TimelineModal";
import { confirmDelete, showErrorAlert, showToast } from "@/lib/swal";

interface TimelineItem {
  id: string;
  title: string;
  startTime: string;
  endTime?: string | null;
  description?: string | null;
  icon?: string | null;
  isHighlight: boolean;
  status: "scheduled" | "current" | "completed" | "delayed";
  sortOrder: number;
}

export function LiveTimelineStepper() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string>("Recepción & Bienvenida");
  const [loading, setLoading] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<TimelineItemData | null>(null);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/timeline");
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        if (data.currentTitle) setCurrentTitle(data.currentTitle);
      }
    } catch (err) {
      console.error("Error loading timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleOpenEditModal = (item: TimelineItem) => {
    setSelectedItem({
      id: item.id,
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime || undefined,
      description: item.description || undefined,
      icon: item.icon || "celebration",
      isHighlight: item.isHighlight,
      status: item.status as any,
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const handleSetCurrent = async (itemId: string, title: string) => {
    setIsAdvancing(true);
    try {
      const res = await fetch("/api/admin/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action: "set_current" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotice(`"${title}" es ahora la etapa en curso para todo el salón.`);
      setTimeout(() => setNotice(null), 3500);
      showToast(`Etapa "${title}" en curso`, "info");
      fetchTimeline();
    } catch (err: any) {
      showErrorAlert("Error al avanzar etapa", err.message || "No se pudo actualizar la etapa");
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    const confirmed = await confirmDelete(title, "¿Deseas eliminar este hito del itinerario en vivo?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/timeline?itemId=${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`"${title}" eliminado del itinerario`, "success");
      fetchTimeline();
    } catch (err: any) {
      showErrorAlert("Error al eliminar", err.message || "No se pudo eliminar el hito");
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "";
    try {
      if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          let hours = d.getHours();
          const minutes = String(d.getMinutes()).padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12;
          const strHours = String(hours).padStart(2, "0");
          return `${strHours}:${minutes} ${ampm}`;
        }
      }
      const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strHours = String(hours).padStart(2, "0");
        return `${strHours}:${minutes} ${ampm}`;
      }
    } catch {
      // fallback
    }
    return timeStr.replace(/p\.\s*m\./gi, "PM").replace(/a\.\s*m\./gi, "AM");
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-6">
      {/* Toast Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-[#0552AC] text-white text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
              check_circle
            </span>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0552AC]/10 text-[#0552AC] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">browse_activity</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-[#0D1829] leading-tight">
              Cronograma Ceremonial en Vivo
            </h3>
            <p className="text-xs text-slate-500">
              Etapa en Directo: <span className="font-bold text-[#0552AC]">{currentTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
              add_circle
            </span>
            <span>Nuevo Hito</span>
          </button>
        </div>
      </div>

      {/* Timeline Steps List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 rounded-full border-2 border-[#0552AC] border-t-transparent animate-spin"></span>
            <span className="text-xs font-semibold">Cargando cronograma solemne...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-600">No hay hitos en el cronograma</p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 text-xs font-bold text-[#0552AC] underline"
          >
            Agregar el primer momento solemne
          </button>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {items.map((step) => {
            const isCurrent = step.status === "current";
            const isDone = step.status === "completed";
            const startTimeFormatted = formatTime(step.startTime);
            const endTimeFormatted = formatTime(step.endTime);
            const timeRange = endTimeFormatted ? `${startTimeFormatted} – ${endTimeFormatted}` : startTimeFormatted;

            return (
              <div key={step.id} className="relative group">
                {/* Stepper Dot */}
                <div
                  className={`absolute -left-6 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    isCurrent
                      ? "bg-[#0552AC] border-[#D4AF37] ring-4 ring-[#0552AC]/20 text-white shadow-xs"
                      : isDone
                      ? "bg-emerald-500 border-white text-white"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isDone ? "done" : isCurrent ? "play_arrow" : (step.icon || "star")}
                  </span>
                </div>

                {/* Card Container */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition ${
                    isCurrent
                      ? "bg-gradient-to-r from-blue-50/50 via-white to-white border-[#0552AC] ring-2 ring-[#0552AC]/10 shadow-xs"
                      : isDone
                      ? "bg-slate-50/60 border-slate-200"
                      : "bg-white border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  {/* Top Bar: Time, Status Badges & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                    {/* Left: Time and Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0552AC] bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-200/60 whitespace-nowrap shrink-0 tabular-nums">
                        {timeRange}
                      </span>

                      {isCurrent && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/80 whitespace-nowrap shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          EN VIVO AHORA
                        </span>
                      )}

                      {step.isHighlight && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#001F54] text-[10px] font-bold border border-[#D4AF37]/60 whitespace-nowrap shrink-0">
                          <span className="material-symbols-outlined text-[13px] text-[#D4AF37]">star</span>
                          Momento Estelar
                        </span>
                      )}

                      {isDone && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-semibold whitespace-nowrap shrink-0">
                          Concluido
                        </span>
                      )}
                    </div>

                    {/* Right: Actions Toolbar */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {!isCurrent && (
                        <button
                          type="button"
                          disabled={isAdvancing}
                          onClick={() => handleSetCurrent(step.id, step.title)}
                          title="Fijar como momento activo ahora"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0552AC] hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_circle</span>
                          <span>Fijar En Curso</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(step)}
                        title="Editar hito"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0552AC] hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(step.id, step.title)}
                        title="Eliminar hito"
                        className="p-1.5 rounded-lg text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom: Milestone Title and Description */}
                  <div className="pt-2.5">
                    <h4 className="font-headline text-base sm:text-lg font-bold text-[#0D1829] leading-snug">
                      {step.title}
                    </h4>

                    {step.description && (
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <TimelineModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSaved={fetchTimeline}
          item={selectedItem}
          mode={modalMode}
        />
      )}
    </div>
  );
}
