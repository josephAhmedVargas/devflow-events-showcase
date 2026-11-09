"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { PhotoDetailModal, PhotoDetailData } from "@/components/admin/PhotoDetailModal";
import { confirmAction, confirmDelete, showErrorAlert, showSuccessAlert, showToast } from "@/lib/swal";

interface PhotoItem {
  id: string;
  uploaderName?: string | null;
  authorName?: string | null;
  caption?: string | null;
  cleanCaption?: string | null;
  category?: string | null;
  tableNumber?: number | null;
  moderationStatus: "pending" | "approved" | "rejected" | "hidden";
  isFeatured: boolean;
  liveWallDisplayed: boolean;
  createdAt: string;
  asset?: {
    publicUrl: string;
    thumbnailUrl?: string | null;
    fileSizeBytes?: number;
    width?: number;
    height?: number;
  };
}

interface GuestbookItem {
  id: string;
  authorName: string;
  messageText: string;
  moderationStatus: "pending" | "approved" | "rejected" | "hidden";
  isFeatured: boolean;
  displayedOnWall: boolean;
  createdAt: string;
}

interface ModerationCounts {
  total: number;
  pending: number;
  approved: number;
  featured: number;
  rejected: number;
}

export function PhotoModerationQueue() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookItem[]>([]);
  const [photoCounts, setPhotoCounts] = useState<ModerationCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    featured: 0,
    rejected: 0,
  });
  const [messageCounts, setMessageCounts] = useState<ModerationCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    featured: 0,
    rejected: 0,
  });

  // UI state
  const [mainTab, setMainTab] = useState<"photos" | "guestbook">("photos");
  const [photoFilter, setPhotoFilter] = useState<"pending" | "approved" | "featured" | "rejected" | "all">("pending");
  const [messageFilter, setMessageFilter] = useState<"all" | "pending" | "approved" | "featured" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Multi-select state
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // Auto-refresh & Sound state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState(6);
  const prevPendingCount = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Settings: Moderation Mode (Strict vs Auto-Project)
  const [strictModeration, setStrictModeration] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Inspector modal state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Live Screen Simulator Modal state
  const [showLiveSimulator, setShowLiveSimulator] = useState(false);

  // Sound ping for new incoming photo
  const playNewPhotoChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880.0, now + 0.1); // A5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio autoplay policy
    }
  }, [soundEnabled]);

  // Fetch settings to know if photoModerationEnabled is true or false
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.settings?.photoModerationEnabled !== undefined) {
        setStrictModeration(Boolean(data.settings.photoModerationEnabled));
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  }, []);

  // Fetch moderation queue
  const fetchQueue = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const params = new URLSearchParams();
      if (photoFilter !== "all") params.set("filter", photoFilter);
      if (messageFilter !== "all") params.set("messageFilter", messageFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/moderation?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPhotos(data.photos || []);
        setGuestbookMessages(data.guestbook || []);
        if (data.photoCounts) {
          if (data.photoCounts.pending > prevPendingCount.current && prevPendingCount.current !== 0) {
            playNewPhotoChime();
            setActionNotice(`¡${data.photoCounts.pending - prevPendingCount.current} nueva(s) foto(s) por moderar! 🔔`);
            setTimeout(() => setActionNotice(null), 4000);
          }
          prevPendingCount.current = data.photoCounts.pending;
          setPhotoCounts(data.photoCounts);
        }
        if (data.messageCounts) {
          setMessageCounts(data.messageCounts);
        }
      }
    } catch (err) {
      console.error("Error loading moderation queue:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [photoFilter, messageFilter, searchQuery, playNewPhotoChime]);

  // Initial load
  useEffect(() => {
    fetchSettings();
    fetchQueue(false);
  }, [fetchSettings, fetchQueue]);

  // Polling every 10s with visual countdown (pauses when backgrounded to save Neon compute)
  useEffect(() => {
    if (!autoRefresh) return;
    setCountdown(10);
    const ticker = setInterval(() => {
      // Pause ticker if browser tab is hidden
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQueue(true);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [autoRefresh, fetchQueue]);

  // Toggle Strict Moderation vs Auto-Project
  const handleToggleModerationMode = async () => {
    setUpdatingSettings(true);
    const newStrictState = !strictModeration;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoModerationEnabled: newStrictState,
        }),
      });

      if (res.ok) {
        setStrictModeration(newStrictState);
        setActionNotice(
          newStrictState
            ? "🛡️ Modo Moderación Estricto activado (Requiere aprobación previa)"
            : "⚡ Modo Auto-Proyección activado (Las fotos van directo a pantalla)"
        );
        setTimeout(() => setActionNotice(null), 4500);
      } else {
        showErrorAlert("Error", "No se pudo actualizar el modo de moderación.");
      }
    } catch {
      showErrorAlert("Error de conexión", "Error al cambiar el ajuste.");
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Single Photo Actions
  const handleSinglePhotoAction = async (photoId: string, action: "approve" | "feature" | "reject" | "delete") => {
    try {
      if (action === "delete") {
        const confirmed = await confirmDelete("esta fotografía", "Se removerá de la base de datos y no se podrá recuperar.");
        if (!confirmed) return;

        const res = await fetch(`/api/admin/moderation?photoId=${photoId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast("Foto eliminada definitivamente", "success");
      } else {
        const res = await fetch("/api/admin/moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId, action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast(
          action === "approve"
            ? "Foto aprobada para pantalla LED 📺"
            : action === "feature"
            ? "Foto destacada en Álbum VIP 🌟"
            : "Foto descartada",
          "success"
        );
      }

      // Remove from selection if selected
      if (selectedPhotoIds.has(photoId)) {
        const next = new Set(selectedPhotoIds);
        next.delete(photoId);
        setSelectedPhotoIds(next);
      }

      fetchQueue(true);
    } catch (err: any) {
      showErrorAlert("Error", err.message || "Error al procesar acción");
    }
  };

  // Single Message Actions
  const handleSingleMessageAction = async (
    messageId: string,
    action: "approve" | "feature" | "reject" | "delete"
  ) => {
    try {
      if (action === "delete") {
        const confirmed = await confirmDelete("esta dedicatoria", "Se eliminará del Libro de Oro permanentemente.");
        if (!confirmed) return;

        const res = await fetch(`/api/admin/moderation?messageId=${messageId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast("Dedicatoria eliminada", "success");
      } else {
        const res = await fetch("/api/admin/moderation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast(
          action === "approve"
            ? "Dedicatoria aprobada para el muro ✍️"
            : action === "feature"
            ? "Dedicatoria destacada en Libro de Oro 👑"
            : "Dedicatoria descartada",
          "success"
        );
      }

      fetchQueue(true);
    } catch (err: any) {
      showErrorAlert("Error", err.message || "Error al procesar dedicatoria");
    }
  };

  // Multi-Selection Checkbox Handlers
  const toggleSelectPhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedPhotoIds.size === filteredPhotos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  };

  // Batch action for selected photos
  const handleBatchPhotoAction = async (action: "approve_selected" | "feature_selected" | "reject_selected" | "delete_selected") => {
    if (selectedPhotoIds.size === 0) return;
    const photoIds = Array.from(selectedPhotoIds);

    const actionConfig: Record<string, { title: string; text: string; isDestructive?: boolean; confirmText: string }> = {
      approve_selected: {
        title: `¿Aprobar ${photoIds.length} fotos?`,
        text: `Las ${photoIds.length} fotos seleccionadas comenzarán a rotar en la Gran Pantalla LED.`,
        confirmText: "Sí, Aprobar Seleccionadas",
      },
      feature_selected: {
        title: `¿Destacar ${photoIds.length} fotos como VIP?`,
        text: `Se añadirán al Álbum VIP de Oro con marco de gala.`,
        confirmText: "Sí, Destacar VIP",
      },
      reject_selected: {
        title: `¿Descartar ${photoIds.length} fotos?`,
        text: `No se proyectarán en el salón.`,
        confirmText: "Sí, Descartar",
        isDestructive: true,
      },
      delete_selected: {
        title: `¿Eliminar definitivamente ${photoIds.length} fotos?`,
        text: `Se eliminarán de la base de datos de forma irreversible.`,
        confirmText: "Sí, Eliminar Definitivamente",
        isDestructive: true,
      },
    };

    const cfg = actionConfig[action];
    const confirmed = await confirmAction({
      title: cfg.title,
      text: cfg.text,
      confirmButtonText: cfg.confirmText,
      isDestructive: Boolean(cfg.isDestructive),
      icon: cfg.isDestructive ? "warning" : "question",
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkAction: action, photoIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || "Acción en lote completada", "success");
      setSelectedPhotoIds(new Set());
      fetchQueue(false);
    } catch (err: any) {
      showErrorAlert("Error", err.message || "Error al procesar lote");
    } finally {
      setLoading(false);
    }
  };

  // Batch download selected photos
  const handleBatchDownload = () => {
    const selectedList = photos.filter((p) => selectedPhotoIds.has(p.id));
    if (selectedList.length === 0) return;

    selectedList.forEach((photo, idx) => {
      const url = photo.asset?.publicUrl;
      if (!url) return;
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = url;
        a.download = `Foto_DanniaXV_${photo.id}.webp`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 300);
    });

    showToast(`Descargando ${selectedList.length} fotos en alta resolución...`, "info");
  };

  // Bulk actions: Approve all pending
  const handleBulkApprove = async () => {
    const confirmed = await confirmAction({
      title: "¿Aprobar todas las fotos pendientes?",
      text: `Se aprobarán ${photoCounts.pending} fotos para ser proyectadas inmediatamente en la Gran Pantalla LED.`,
      confirmButtonText: "Sí, Aprobar Todo",
      icon: "question",
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkAction: "approve_all_pending" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccessAlert("Fotos Aprobadas", data.message || "Todas las fotos pendientes fueron aprobadas para la Gran Pantalla.");
      fetchQueue(false);
    } catch (err: any) {
      showErrorAlert("Error al aprobar en lote", err.message || "No se pudo procesar la aprobación masiva.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions: Purge rejected
  const handlePurgeRejected = async () => {
    const confirmed = await confirmAction({
      title: "¿Eliminar definitivamente fotos descartadas?",
      text: "Se borrarán de forma irreversible todas las fotos descartadas.",
      confirmButtonText: "Sí, Purgar Fotos",
      isDestructive: true,
      icon: "warning",
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkAction: "purge_rejected" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message || "Fotos descartadas eliminadas", "success");
      fetchQueue(false);
    } catch (err: any) {
      showErrorAlert("Error al purgar descartadas", err.message || "No se pudo completar la purga.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions: Approve all pending messages
  const handleBulkApproveMessages = async () => {
    const confirmed = await confirmAction({
      title: "¿Aprobar todas las dedicatorias pendientes?",
      text: `Se aprobarán ${messageCounts.pending} dedicatorias para aparecer en el muro y Libro de Oro.`,
      confirmButtonText: "Sí, Aprobar Dedicatorias",
      icon: "question",
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkAction: "approve_all_pending_messages" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccessAlert("Dedicatorias Aprobadas", data.message || "Todas las dedicatorias fueron aprobadas con éxito.");
      fetchQueue(false);
    } catch (err: any) {
      showErrorAlert("Error al aprobar dedicatorias", err.message || "No se pudo procesar el lote.");
    } finally {
      setLoading(false);
    }
  };

  // Sorting
  const filteredPhotos = useMemo(() => {
    const list = [...photos];
    list.sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? tB - tA : tA - tB;
    });
    return list;
  }, [photos, sortOrder]);

  const openInspector = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowDetailModal(true);
  };

  const currentSelectedPhoto: PhotoDetailData | null =
    selectedPhotoIndex !== null && filteredPhotos[selectedPhotoIndex]
      ? {
          id: filteredPhotos[selectedPhotoIndex].id,
          url:
            filteredPhotos[selectedPhotoIndex].asset?.publicUrl ||
            "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
          author:
            filteredPhotos[selectedPhotoIndex].uploaderName ||
            filteredPhotos[selectedPhotoIndex].authorName ||
            "Invitado de Gala",
          table: filteredPhotos[selectedPhotoIndex].tableNumber
            ? `Mesa ${filteredPhotos[selectedPhotoIndex].tableNumber}`
            : "Mesa General",
          category: filteredPhotos[selectedPhotoIndex].category || undefined,
          timeAgo: new Date(filteredPhotos[selectedPhotoIndex].createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          caption: filteredPhotos[selectedPhotoIndex].cleanCaption || filteredPhotos[selectedPhotoIndex].caption || undefined,
          status: filteredPhotos[selectedPhotoIndex].moderationStatus,
          liveWallDisplayed: filteredPhotos[selectedPhotoIndex].liveWallDisplayed,
          fileSizeBytes: filteredPhotos[selectedPhotoIndex].asset?.fileSizeBytes,
        }
      : null;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md flex flex-col gap-6 relative">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-[#0552AC] text-white text-xs font-bold flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
              auto_awesome
            </span>
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-white/80 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Control Bar: Mode Toggle + Live Status + Projector Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Polling Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? "bg-emerald-500 animate-ping" : "bg-slate-300"
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {autoRefresh ? `En Vivo (${countdown}s)` : "Pausado"}
            </span>
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-[11px] text-[#0552AC] font-bold hover:underline ml-0.5 cursor-pointer"
            >
              {autoRefresh ? "Pausar" : "Reanudar"}
            </button>
          </div>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer shadow-2xs ${
              soundEnabled
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
            title={soundEnabled ? "Silenciar campana de fotos" : "Activar sonido de nuevas fotos"}
          >
            <span className="material-symbols-outlined text-[15px] text-[#D4AF37]">
              {soundEnabled ? "volume_up" : "volume_off"}
            </span>
            <span>{soundEnabled ? "Sonido On" : "Mudo"}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchQueue(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Refrescar datos ahora"
          >
            <span className={`material-symbols-outlined text-[15px] ${loading ? "animate-spin text-[#0552AC]" : ""}`}>
              refresh
            </span>
            <span>Refrescar</span>
          </button>

          {/* Mode Switcher: Strict vs Auto-Project */}
          <button
            type="button"
            disabled={updatingSettings}
            onClick={handleToggleModerationMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-2xs ${
              strictModeration
                ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                : "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100"
            }`}
            title="Alternar entre revisión obligatoria o proyección directa a Gran Pantalla"
          >
            <span className="material-symbols-outlined text-[15px]">
              {strictModeration ? "shield" : "bolt"}
            </span>
            <span>
              {strictModeration ? "Moderación Estricta" : "Auto-Proyección"}
            </span>
            <span className="text-[10px] text-slate-500 font-normal underline ml-0.5">
              (Cambiar)
            </span>
          </button>
        </div>

        {/* Action: Open Live Screen Simulator or Projector in New Window */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setShowLiveSimulator(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer whitespace-nowrap"
            title="Simular proyección en ventana flotante"
          >
            <span className="material-symbols-outlined text-[16px] text-[#0552AC]">preview</span>
            <span>Simulador Pantalla</span>
          </button>

          <Link
            href="/live"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#001F54] hover:bg-[#0552AC] text-white text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">connected_tv</span>
            <span>Pantalla LED en Vivo</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </Link>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Main Tabs: Fotos vs Dedicatorias */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMainTab("photos");
              setSelectedPhotoIds(new Set());
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-headline text-sm font-bold transition cursor-pointer ${
              mainTab === "photos"
                ? "bg-[#0552AC] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">photo_library</span>
            <span>Fotos ({photoCounts.total})</span>
            {photoCounts.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {photoCounts.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTab("guestbook")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-headline text-sm font-bold transition cursor-pointer ${
              mainTab === "guestbook"
                ? "bg-[#0552AC] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_stories</span>
            <span>Dedicatorias ({messageCounts.total})</span>
            {messageCounts.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {messageCounts.pending}
              </span>
            )}
          </button>
        </div>

        {/* Search input & Sort selector */}
        <div className="flex items-center gap-2.5 flex-1 md:max-w-md justify-end">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                mainTab === "photos"
                  ? "Buscar por invitado, mesa o momento..."
                  : "Buscar dedicatoria o autor..."
              }
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0552AC] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            title="Alternar orden cronológico"
          >
            <span className="material-symbols-outlined text-[16px]">
              {sortOrder === "desc" ? "arrow_downward" : "arrow_upward"}
            </span>
            <span className="hidden sm:inline">
              {sortOrder === "desc" ? "Recientes" : "Antiguas"}
            </span>
          </button>
        </div>
      </div>

      {/* FILTER PILLS & BULK ACTIONS FOR PHOTOS */}
      {mainTab === "photos" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-full text-xs font-semibold">
            <button
              onClick={() => setPhotoFilter("pending")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                photoFilter === "pending"
                  ? "bg-[#0552AC] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0552AC]"
              }`}
            >
              Pendientes ({photoCounts.pending})
            </button>
            <button
              onClick={() => setPhotoFilter("approved")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                photoFilter === "approved"
                  ? "bg-[#0552AC] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0552AC]"
              }`}
            >
              Aprobadas ({photoCounts.approved})
            </button>
            <button
              onClick={() => setPhotoFilter("featured")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                photoFilter === "featured"
                  ? "bg-[#D4AF37] text-[#001F54] shadow-xs"
                  : "text-slate-600 hover:text-[#001F54]"
              }`}
            >
              VIP ({photoCounts.featured})
            </button>
            <button
              onClick={() => setPhotoFilter("rejected")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                photoFilter === "rejected"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-600"
              }`}
            >
              Descartadas ({photoCounts.rejected})
            </button>
            <button
              onClick={() => setPhotoFilter("all")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                photoFilter === "all"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todas ({photoCounts.total})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Select all toggle */}
            {filteredPhotos.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                {selectedPhotoIds.size === filteredPhotos.length
                  ? "Deseleccionar todas"
                  : `Seleccionar todas (${filteredPhotos.length})`}
              </button>
            )}

            {/* Quick Bulk Action Buttons */}
            {photoFilter === "pending" && photoCounts.pending > 0 && (
              <button
                type="button"
                onClick={handleBulkApprove}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Aprobar Todo ({photoCounts.pending})</span>
              </button>
            )}

            {photoFilter === "rejected" && photoCounts.rejected > 0 && (
              <button
                type="button"
                onClick={handlePurgeRejected}
                className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>Purgar Descartadas</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* FILTER PILLS & BULK ACTIONS FOR GUESTBOOK */}
      {mainTab === "guestbook" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-full text-xs font-semibold">
            <button
              onClick={() => setMessageFilter("all")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                messageFilter === "all"
                  ? "bg-[#0552AC] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0552AC]"
              }`}
            >
              Todas ({messageCounts.total})
            </button>
            <button
              onClick={() => setMessageFilter("approved")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                messageFilter === "approved"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Aprobadas ({messageCounts.approved})
            </button>
            <button
              onClick={() => setMessageFilter("featured")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                messageFilter === "featured"
                  ? "bg-[#D4AF37] text-[#001F54] shadow-xs"
                  : "text-slate-600 hover:text-[#001F54]"
              }`}
            >
              VIP ({messageCounts.featured})
            </button>
            <button
              onClick={() => setMessageFilter("pending")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                messageFilter === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-amber-700"
              }`}
            >
              Pendientes ({messageCounts.pending})
            </button>
            <button
              onClick={() => setMessageFilter("rejected")}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                messageFilter === "rejected"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-600"
              }`}
            >
              Descartadas ({messageCounts.rejected})
            </button>
          </div>

          {messageCounts.pending > 0 && (
            <button
              type="button"
              onClick={handleBulkApproveMessages}
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>Aprobar Todas las Pendientes ({messageCounts.pending})</span>
            </button>
          )}
        </div>
      )}

      {/* FLOATING MULTI-SELECT ACTION BAR */}
      {selectedPhotoIds.size > 0 && mainTab === "photos" && (
        <div className="sticky top-24 z-30 p-3 rounded-2xl bg-[#001F54] text-white flex flex-wrap items-center justify-between gap-3 shadow-2xl border border-[#D4AF37]/40 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#001F54] flex items-center justify-center text-xs font-bold">
              {selectedPhotoIds.size}
            </span>
            <span className="text-xs font-bold text-white">
              {selectedPhotoIds.size} foto(s) seleccionada(s)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleBatchPhotoAction("approve_selected")}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">connected_tv</span>
              <span>Aprobar ({selectedPhotoIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchPhotoAction("feature_selected")}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#b89528] text-[#001F54] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">star</span>
              <span>VIP ({selectedPhotoIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchPhotoAction("reject_selected")}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">block</span>
              <span>Descartar</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDownload}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="Descargar fotos seleccionadas a tu dispositivo"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>Descargar</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPhotoIds(new Set())}
              className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 text-xs transition-colors cursor-pointer ml-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: PHOTOS GRID */}
      {mainTab === "photos" && (
        <>
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-[#0552AC] border-t-transparent animate-spin"></span>
                <span className="text-xs font-semibold">Actualizando cola de fotos en vivo...</span>
              </div>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-slate-300 text-[48px] block mb-2">
                photo_library
              </span>
              <p className="text-sm font-semibold text-slate-700">
                No hay fotos en esta sección ({photoFilter})
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Las capturas subidas por los invitados desde el Modo Evento en Vivo aparecerán aquí automáticamente en tiempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, idx) => {
                const imgUrl =
                  photo.asset?.publicUrl ||
                  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600";
                const timeStr = new Date(photo.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const authorName = photo.uploaderName || photo.authorName || "Invitado de Gala";
                const isSelected = selectedPhotoIds.has(photo.id);

                return (
                  <div
                    key={photo.id}
                    className={`group relative bg-slate-900 rounded-2xl overflow-hidden border transition flex flex-col justify-between ${
                      isSelected
                        ? "border-[#0552AC] ring-2 ring-[#0552AC]/40 shadow-lg"
                        : "border-slate-200 shadow-2xs hover:shadow-xl"
                    }`}
                  >
                    {/* Photo Thumbnail */}
                    <div
                      onClick={() => openInspector(idx)}
                      className="relative aspect-square w-full cursor-pointer bg-slate-950 overflow-hidden"
                    >
                      <Image
                        src={imgUrl}
                        alt={photo.caption || "Foto de invitado"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 300px"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 opacity-80 group-hover:opacity-95 transition-opacity" />

                      {/* Top Badges & Multi-select checkbox */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => toggleSelectPhoto(photo.id, e)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer ${
                              isSelected
                                ? "bg-[#0552AC] text-white shadow-md ring-1 ring-white"
                                : "bg-black/50 backdrop-blur-xs text-white/50 hover:text-white hover:bg-black/80"
                            }`}
                            title="Seleccionar foto"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isSelected ? "check" : "check_box_outline_blank"}
                            </span>
                          </button>

                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                            {photo.tableNumber ? `Mesa ${photo.tableNumber}` : "Mesa de Gala"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {photo.liveWallDisplayed && (
                            <span
                              className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs"
                              title="Activa en proyector"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              LED
                            </span>
                          )}

                          {photo.isFeatured && (
                            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#001F54] text-[10px] font-bold flex items-center gap-0.5 shadow-2xs">
                              <span className="material-symbols-outlined text-[12px]">star</span>
                              VIP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Author and Caption overlay */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold block truncate drop-shadow-xs">
                            {authorName}
                          </span>
                          {photo.category && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-medium shrink-0">
                              {photo.category}
                            </span>
                          )}
                        </div>

                        {(photo.cleanCaption || photo.caption) && (
                          <p className="text-[11px] text-slate-200 line-clamp-1 italic drop-shadow-xs mt-0.5">
                            &ldquo;{photo.cleanCaption || photo.caption}&rdquo;
                          </p>
                        )}
                        <span className="text-[9px] text-slate-400 block mt-0.5">{timeStr}</span>
                      </div>
                    </div>

                    {/* Quick Action Button Bar */}
                    <div className="p-2 bg-white flex items-center justify-between gap-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleSinglePhotoAction(photo.id, "reject")}
                        title="Descartar foto (No proyectar)"
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-600/70 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSinglePhotoAction(photo.id, "feature")}
                        title="Destacar en Álbum VIP con marco dorado"
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          photo.isFeatured
                            ? "bg-amber-50 text-[#D4AF37]"
                            : "hover:bg-amber-50 text-amber-700/70 hover:text-amber-700"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">star</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openInspector(idx)}
                        title="Inspeccionar a detalle"
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSinglePhotoAction(photo.id, "approve")}
                        title="Aprobar para rotación en Pantalla LED"
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer ${
                          photo.moderationStatus === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-[#0552AC] hover:bg-[#001F54] text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">connected_tv</span>
                        <span>{photo.moderationStatus === "approved" ? "Proyectada" : "Proyectar"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: GUESTBOOK DEDICATIONS MODERATION */}
      {mainTab === "guestbook" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Mostrando {guestbookMessages.length} dedicatorias del Libro de Oro
            </span>
          </div>

          {guestbookMessages.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              No hay dedicatorias registradas todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guestbookMessages.map((msg) => {
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isApproved = msg.moderationStatus === "approved";
                const isFeatured = msg.isFeatured;
                const isRejected = msg.moderationStatus === "rejected";

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl bg-white border transition flex flex-col justify-between gap-3 shadow-2xs ${
                      isFeatured
                        ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/30 bg-gradient-to-br from-white to-[#FDFBF7]"
                        : isRejected
                        ? "border-rose-200 bg-rose-50/20 opacity-75"
                        : "border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#E8F0FE] text-[#0552AC] flex items-center justify-center font-bold text-xs">
                          {msg.authorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-[#0D1829]">
                            {msg.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400">{timeStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isFeatured && (
                          <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#001F54] text-[10px] font-bold flex items-center gap-0.5 shadow-2xs">
                            <span className="material-symbols-outlined text-[12px]">star</span>
                            VIP
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Aprobada
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Descartada
                          </span>
                        )}
                        {msg.moderationStatus === "pending" && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 italic font-serif leading-relaxed px-1">
                      &ldquo;{msg.messageText}&rdquo;
                    </p>

                    {/* Action buttons for dedicatoria */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleSingleMessageAction(msg.id, "delete")}
                        className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Eliminar de la base de datos"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete_outline</span>
                        <span>Eliminar</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSingleMessageAction(msg.id, "reject")}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold border border-rose-200/60 transition-colors cursor-pointer"
                          title="Descartar dedicatoria"
                        >
                          Descartar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSingleMessageAction(msg.id, "feature")}
                          className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#001F54] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Destacar con marco dorado en Libro de Oro"
                        >
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>VIP</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSingleMessageAction(msg.id, "approve")}
                          className="px-3 py-1 rounded-lg bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>Aprobar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* INSPECTOR MODAL WITH KEYBOARD SHORTCUTS */}
      {showDetailModal && currentSelectedPhoto && (
        <PhotoDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          photo={currentSelectedPhoto}
          onAction={handleSinglePhotoAction}
          onPrev={() => {
            if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
              setSelectedPhotoIndex(selectedPhotoIndex - 1);
            }
          }}
          onNext={() => {
            if (selectedPhotoIndex !== null && selectedPhotoIndex < filteredPhotos.length - 1) {
              setSelectedPhotoIndex(selectedPhotoIndex + 1);
            }
          }}
          hasPrev={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
          hasNext={selectedPhotoIndex !== null && selectedPhotoIndex < filteredPhotos.length - 1}
        />
      )}

      {/* LIVE SCREEN SIMULATOR MODAL */}
      {showLiveSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            {/* Top Bar */}
            <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between text-white bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold font-headline uppercase tracking-wider text-[#D4AF37]">
                  Simulador de Gran Pantalla LED • Hotel Holiday Inn Managua
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveSimulator(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Simulated Screen */}
            <div className="relative w-full h-96 sm:h-[480px] bg-black flex items-center justify-center overflow-hidden">
              {filteredPhotos.filter((p) => p.liveWallDisplayed || p.moderationStatus === "approved").length > 0 ? (
                <div className="relative w-full h-full">
                  <Image
                    src={
                      filteredPhotos.find((p) => p.liveWallDisplayed || p.moderationStatus === "approved")?.asset?.publicUrl ||
                      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200"
                    }
                    alt="Proyección LED"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-cinzel">
                      {filteredPhotos.find((p) => p.liveWallDisplayed || p.moderationStatus === "approved")?.uploaderName || "Invitado de Gala"}
                    </span>
                    <p className="font-headline text-xl italic drop-shadow-md">
                      &ldquo;
                      {filteredPhotos.find((p) => p.liveWallDisplayed || p.moderationStatus === "approved")?.cleanCaption ||
                        "Felicidades en tus XV Años Dannia Carolina"}
                      &rdquo;
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 p-8">
                  <span className="material-symbols-outlined text-[48px] block mb-2 text-slate-600">
                    connected_tv
                  </span>
                  <p className="text-sm font-semibold text-slate-300">No hay fotos aprobadas en pantalla todavía</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Aprueba fotos de la cola para que comiencen a rotar en la Gran Pantalla LED.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                <span>Resolución nativa de Gran Pantalla 16:9 • Rotación cada 6 segundos</span>
              </span>
              <Link
                href="/live"
                target="_blank"
                rel="noreferrer"
                className="text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir en Proyector Completo</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
