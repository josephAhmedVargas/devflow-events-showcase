"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export interface PhotoDetailData {
  id: string;
  url: string;
  author: string;
  table?: string;
  category?: string;
  timeAgo: string;
  caption?: string;
  status: "pending" | "approved" | "featured" | "rejected" | "hidden";
  liveWallDisplayed?: boolean;
  fileSizeBytes?: number;
}

interface PhotoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: PhotoDetailData | null;
  onAction: (photoId: string, action: "approve" | "feature" | "reject" | "delete") => Promise<void>;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function PhotoDetailModal({
  isOpen,
  onClose,
  photo,
  onAction,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: PhotoDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset zoom when switching photos
  useEffect(() => {
    setIsZoomed(false);
  }, [photo?.id]);

  const handleActionClick = async (action: "approve" | "feature" | "reject" | "delete") => {
    if (!photo || loading) return;
    setLoading(true);
    try {
      await onAction(photo.id, action);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Ultra-fast keyboard shortcuts for event coordinators
  useEffect(() => {
    if (!isOpen || !photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "a" || e.key === "A" || e.key === "Enter") {
        e.preventDefault();
        handleActionClick("approve");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleActionClick("feature");
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleActionClick("reject");
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        setIsZoomed((prev) => !prev);
      } else if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, photo, loading, hasPrev, hasNext, onPrev, onNext]);

  if (!isOpen || !photo) return null;

  const fileSizeFormatted = photo.fileSizeBytes
    ? `${(photo.fileSizeBytes / 1024).toFixed(0)} KB`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl max-w-3xl w-full max-h-[96vh] overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col relative">
        {/* Top Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0552AC] animate-pulse"></span>
            <div className="flex items-center gap-2">
              <h3 className="font-headline text-sm font-bold text-[#0D1829]">
                Inspección de Captura • {photo.author}
              </h3>
              {photo.category && (
                <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[10px] font-bold">
                  {photo.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Toggle */}
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                isZoomed
                  ? "bg-[#0552AC] text-white border-[#0552AC]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="Alternar Zoom 2x (Z)"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isZoomed ? "zoom_out" : "zoom_in"}
              </span>
              <span className="hidden sm:inline text-[11px]">{isZoomed ? "200%" : "100%"}</span>
            </button>

            {/* Prev / Next Navigation */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={onPrev}
                className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Foto anterior (←)"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <div className="w-px h-4 bg-slate-200" />
              <button
                type="button"
                disabled={!hasNext}
                onClick={onNext}
                className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Foto siguiente (→)"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer ml-1"
              title="Cerrar (Esc)"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* High-res Image Display with Zoom support */}
        <div
          onClick={() => setIsZoomed(!isZoomed)}
          className={`relative w-full h-80 sm:h-[420px] bg-slate-950 flex items-center justify-center shrink-0 overflow-hidden cursor-${
            isZoomed ? "zoom-out" : "zoom-in"
          }`}
        >
          <div
            className={`relative w-full h-full transition-transform duration-300 ${
              isZoomed ? "scale-175" : "scale-100"
            }`}
          >
            <Image
              src={photo.url}
              alt={photo.caption || "Foto de invitado"}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 800px"
              unoptimized
            />
          </div>

          {/* Status overlay badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
            {photo.liveWallDisplayed && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Activa en Pantalla LED</span>
              </span>
            )}
            {fileSizeFormatted && (
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-slate-300 text-[10px]">
                {fileSizeFormatted}
              </span>
            )}
          </div>
        </div>

        {/* Meta details & Caption */}
        <div className="p-5 flex flex-col gap-3.5 bg-white overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-base font-bold text-[#0D1829]">
                {photo.author}
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                <span>{photo.table || "Mesa de Gala"}</span>
                <span>•</span>
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                <span>{photo.timeAgo}</span>
              </span>
            </div>

            <div>
              {photo.status === "approved" && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">connected_tv</span>
                  Aprobada
                </span>
              )}
              {photo.status === "featured" && (
                <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#001F54] text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#D4AF37]">star</span>
                  Álbum VIP
                </span>
              )}
              {photo.status === "pending" && (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                  Pendiente de Revisión
                </span>
              )}
              {photo.status === "rejected" && (
                <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  Descartada
                </span>
              )}
            </div>
          </div>

          {photo.caption && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800 italic leading-relaxed">
              &ldquo;{photo.caption}&rdquo;
            </div>
          )}

          {/* Action Toolbar with Direct Shortcut Badges */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleActionClick("delete")}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                title="Eliminar de la base de datos"
              >
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>Eliminar</span>
              </button>

              <a
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                download={`Foto_DanniaXV_${photo.id}.webp`}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                title="Descargar imagen en alta resolución"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Descargar HD</span>
              </a>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleActionClick("reject")}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold flex items-center gap-1.5 border border-rose-200/60 transition-colors disabled:opacity-40 cursor-pointer"
                title="Rechazar para que no salga en pantalla (R)"
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
                <span>Rechazar</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] text-rose-700 font-mono shadow-2xs border border-rose-200/60">R</kbd>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleActionClick("feature")}
                className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#b89528] text-[#001F54] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-40 cursor-pointer"
                title="Destacar en Álbum VIP con marco de oro (F)"
              >
                <span className="material-symbols-outlined text-[16px]">star</span>
                <span>Destacar VIP</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#001F54]/20 text-[#001F54] text-[10px] font-mono shadow-2xs">F</kbd>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleActionClick("approve")}
                className="px-4 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-40 cursor-pointer"
                title="Aprobar para proyectar en Pantalla LED (Enter o A)"
              >
                <span className="material-symbols-outlined text-[16px]">connected_tv</span>
                <span>Proyectar</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-white text-[10px] font-mono shadow-2xs">A</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
