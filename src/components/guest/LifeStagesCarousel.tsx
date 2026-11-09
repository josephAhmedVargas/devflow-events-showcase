"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { StagePhoto } from "@/lib/stages-data";
import { LIFE_STAGES } from "@/lib/exif-parser";
import confetti from "canvas-confetti";

interface LifeStagesCarouselProps {
  initialPhotos: StagePhoto[];
  title?: string | null;
  subtitle?: string | null;
}

export function LifeStagesCarousel({
  initialPhotos,
  title,
  subtitle,
}: LifeStagesCarouselProps) {
  const displayTitle = title || "De Niña a Quinceañera";
  const displaySubtitle =
    subtitle ||
    "Un recorrido por cada etapa de mi vida: desde mis primeros pasos hasta la mágica noche de mis quince años.";

  const [photos] = useState<StagePhoto[]>(initialPhotos);
  const [activeStageFilter, setActiveStageFilter] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [viewMode, setViewMode] = useState<"spotlight" | "grid">("spotlight");
  const [searchQuery, setSearchQuery] = useState("");

  // Lightbox Modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<StagePhoto | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filtered photos for active stage
  const stageFilteredPhotos = useMemo(() => {
    return activeStageFilter === "all"
      ? photos
      : photos.filter((p) => p.stageKey === activeStageFilter);
  }, [photos, activeStageFilter]);

  // Search filtered photos (for grid view)
  const displayPhotos = useMemo(() => {
    let result = stageFilteredPhotos;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.caption?.toLowerCase().includes(q) ||
          p.stageLabel?.toLowerCase().includes(q) ||
          p.cameraInfo?.toLowerCase().includes(q) ||
          String(p.year).includes(q)
      );
    }
    return result;
  }, [stageFilteredPhotos, searchQuery]);

  // Keep index valid when stage changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeStageFilter]);

  // Auto-play timer for spotlight
  useEffect(() => {
    if (!isAutoPlay || viewMode !== "spotlight" || displayPhotos.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlay, viewMode, displayPhotos.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return;

      if (e.key === "Escape") {
        setLightboxPhoto(null);
      } else if (e.key === "ArrowRight") {
        const cIdx = displayPhotos.findIndex((p) => p.id === lightboxPhoto.id);
        if (cIdx !== -1) {
          const nextIdx = (cIdx + 1) % displayPhotos.length;
          setLightboxPhoto(displayPhotos[nextIdx]);
        }
      } else if (e.key === "ArrowLeft") {
        const cIdx = displayPhotos.findIndex((p) => p.id === lightboxPhoto.id);
        if (cIdx !== -1) {
          const prevIdx = (cIdx - 1 + displayPhotos.length) % displayPhotos.length;
          setLightboxPhoto(displayPhotos[prevIdx]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxPhoto, displayPhotos]);

  const handlePrev = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  const handleNext = () => {
    setIsAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const openLightbox = (photo: StagePhoto) => {
    setLightboxPhoto(photo);
    if (photo.stageKey === "actualidad" || photo.year === 2026) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#D4AF37", "#0552AC", "#FFFFFF"],
        });
      } catch {
        // ignore
      }
    }
  };

  const activePhoto = displayPhotos[currentIndex] || displayPhotos[0] || photos[0];

  return (
    <div
      id="etapas-section"
      className="w-full py-12 md:py-20 bg-gradient-to-b from-[#F8FAFD] via-white to-[#F8FAFD] border-t border-[#0552AC]/10 relative overflow-hidden"
    >
      {/* Decorative Aura Backgrounds */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#0552AC]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col gap-8 md:gap-10">
        {/* 1. Header & View Mode Switcher */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Heraldic Badge */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="h-px w-8 md:w-16 bg-[#D4AF37]" />
            <span className="font-cinzel text-[11px] md:text-xs uppercase text-[#0552AC] font-bold tracking-[0.25em] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#D4AF37] text-[16px]">auto_stories</span>
              <span>Álbum de Recuerdos • Mis Etapas</span>
            </span>
            <span className="h-px w-8 md:w-16 bg-[#D4AF37]" />
          </div>

          <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl text-[#001F54] font-bold tracking-tight uppercase leading-tight">
            {displayTitle}
          </h2>

          <p className="font-serif italic text-sm md:text-base text-[#4B5B76] mt-3 leading-relaxed max-w-2xl">
            &ldquo;{displaySubtitle}&rdquo;
          </p>

          {/* View Mode Switcher */}
          <div className="mt-6 p-1 bg-[#E8F0FE]/70 rounded-full border border-[#0552AC]/20 flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("spotlight")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === "spotlight"
                  ? "bg-[#001F54] text-[#D4AF37] shadow-sm font-cinzel"
                  : "text-[#4B5B76] hover:text-[#0552AC]"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">slideshow</span>
              <span>Modo Carrusel</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#001F54] text-[#D4AF37] shadow-sm font-cinzel"
                  : "text-[#4B5B76] hover:text-[#0552AC]"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>Mosaico Completo ({photos.length})</span>
            </button>
          </div>
        </div>

        {/* 2. Stage Filter Navigation Tabs */}
        <div className="flex items-center justify-center gap-1.5 md:gap-2 flex-wrap select-none">
          <button
            type="button"
            onClick={() => setActiveStageFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition duration-300 cursor-pointer ${
              activeStageFilter === "all"
                ? "bg-[#0552AC] text-white shadow-md shadow-[#0552AC]/25 ring-2 ring-[#0552AC]/20 scale-105"
                : "bg-white border border-[#0552AC]/15 text-[#4B5B76] hover:bg-[#E8F0FE]/60 hover:text-[#0552AC]"
            }`}
          >
            Todas las Etapas ({photos.length})
          </button>

          {LIFE_STAGES.map((stage) => {
            const countInStage = photos.filter((p) => p.stageKey === stage.key).length;
            if (countInStage === 0) return null;
            const isActive = activeStageFilter === stage.key;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => setActiveStageFilter(stage.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition duration-300 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-[#0552AC] text-white shadow-md shadow-[#0552AC]/25 ring-2 ring-[#0552AC]/20 scale-105"
                    : "bg-white border border-[#0552AC]/15 text-[#4B5B76] hover:bg-[#E8F0FE]/60 hover:text-[#0552AC]"
                }`}
              >
                <span>{stage.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {countInStage}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. VIEW MODE A: SPOTLIGHT CAROUSEL & FILMSTRIP */}
        {viewMode === "spotlight" && displayPhotos.length > 0 && activePhoto && (
          <div className="flex flex-col gap-6">
            <div
              className="relative bg-white rounded-3xl border border-[#0552AC]/20 shadow-2xl overflow-hidden p-4 sm:p-6 md:p-10"
              onMouseEnter={() => setIsAutoPlay(false)}
              onMouseLeave={() => setIsAutoPlay(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Corner Luxury Flourishes */}
              <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#D4AF37]/60 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#D4AF37]/60 pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-center">
                {/* Photo Showcase (Left 7 Cols) */}
                <div className="lg:col-span-7 relative flex justify-center">
                  <div
                    onClick={() => openLightbox(activePhoto)}
                    className="relative w-full max-w-[560px] aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[#0552AC]/20 bg-[#E8F0FE]/30 group cursor-pointer"
                  >
                    <img
                      src={activePhoto.url}
                      alt={activePhoto.title}
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Stage Badge Overlay */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-full bg-[#001F54]/85 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/40 shadow-lg text-xs font-bold font-cinzel flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                        <span>{activePhoto.stageLabel}</span>
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#001F54] text-xs font-mono font-bold shadow-md">
                        Año {activePhoto.year}
                      </span>
                    </div>

                    {/* Featured Star */}
                    {activePhoto.isFeatured && (
                      <div className="absolute top-4 right-4 z-10">
                        <span
                          className="p-2 rounded-full bg-[#D4AF37] text-[#001F54] shadow-lg flex items-center justify-center font-bold"
                          title="Recuerdo Destacado"
                        >
                          <span className="material-symbols-outlined text-[16px]">star</span>
                        </span>
                      </div>
                    )}

                    {/* Bottom Gradient with Click to Expand */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#001F54]/90 via-[#001F54]/40 to-transparent flex items-end justify-between p-4 sm:p-6 opacity-95 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-[#D4AF37] text-[20px]">photo_camera</span>
                        <span className="text-xs font-medium text-white/90 truncate max-w-[200px] sm:max-w-xs">
                          {activePhoto.cameraInfo || "Archivo Fotográfico Familiar"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 group-hover:bg-[#D4AF37] group-hover:text-[#001F54] transition">
                        <span>Ver en Grande</span>
                        <span className="material-symbols-outlined text-[15px]">fullscreen</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Story Narrative & Controls (Right 5 Cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-5 pl-0 lg:pl-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#0552AC] font-mono text-xs font-bold flex items-center justify-center ring-1 ring-[#0552AC]/20">
                        {String(currentIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs uppercase font-cinzel font-bold tracking-widest text-[#D4AF37]">
                        Momento {currentIndex + 1} de {displayPhotos.length}
                      </span>
                    </div>

                    <h3 className="font-headline text-2xl sm:text-3xl text-[#001F54] font-bold leading-tight">
                      {activePhoto.title}
                    </h3>

                    <div className="p-4 sm:p-5 rounded-2xl bg-[#FCFDFE] border border-[#0552AC]/15 shadow-sm">
                      <p className="font-serif italic text-sm md:text-base text-[#4B5B76] leading-relaxed">
                        &ldquo;{activePhoto.caption}&rdquo;
                      </p>
                    </div>

                    {activePhoto.takenAt && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                        <span className="material-symbols-outlined text-[16px] text-[#0552AC]">event</span>
                        <span>Fecha del momento: </span>
                        <strong className="text-[#001F54]">
                          {new Date(activePhoto.takenAt).toLocaleDateString("es-NI", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Navigation Controls */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Foto anterior"
                        className="w-11 h-11 rounded-full bg-white border border-[#0552AC]/20 text-[#0552AC] hover:bg-[#0552AC] hover:text-white transition flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Siguiente foto"
                        className="w-11 h-11 rounded-full bg-[#0552AC] text-white hover:bg-[#001F54] transition flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAutoPlay((prev) => !prev)}
                        className={`w-11 h-11 rounded-full transition flex items-center justify-center cursor-pointer ${
                          isAutoPlay
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title={isAutoPlay ? "Pausar pase automático" : "Reanudar pase automático"}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isAutoPlay ? "pause" : "play_arrow"}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openLightbox(activePhoto)}
                      className="px-4 py-2 rounded-xl bg-white border border-[#D4AF37] text-[#001F54] hover:bg-amber-50 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer font-cinzel"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">fullscreen</span>
                      <span>Ampliar Recuerdo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filmstrip Track: Horizontal Strip of all photos in this view */}
            <div className="bg-white p-3 rounded-2xl border border-[#0552AC]/15 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-cinzel font-bold text-[#0552AC] uppercase tracking-wider px-2 shrink-0">
                Secuencia ({displayPhotos.length}):
              </span>
              {displayPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    setIsAutoPlay(false);
                    setCurrentIndex(idx);
                  }}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 transition cursor-pointer ${
                    idx === currentIndex
                      ? "ring-2 ring-[#0552AC] scale-105 shadow-md border-2 border-white"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  title={`${photo.title} (${photo.year})`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-mono text-center">
                    {photo.year}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. VIEW MODE B: FULL MOSAIC GRID */}
        {viewMode === "grid" && (
          <div className="flex flex-col gap-6">
            {/* Search and Count Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#0552AC]/15 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar recuerdos, año (ej. 2017) o palabras clave..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0552AC] focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-[#0552AC] font-cinzel font-bold flex items-center gap-1.5 self-center sm:self-auto">
                <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">photo_library</span>
                <span>
                  Mostrando {displayPhotos.length} de {photos.length} recuerdos
                </span>
              </div>
            </div>

            {/* Responsive Grid */}
            {displayPhotos.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[40px] text-slate-400">search_off</span>
                <p className="text-sm font-semibold text-slate-700">No hay recuerdos con este filtro</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveStageFilter("all");
                  }}
                  className="text-xs text-[#0552AC] font-bold hover:underline cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {displayPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => openLightbox(photo)}
                    className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition cursor-pointer border border-[#0552AC]/15 aspect-[4/5] flex flex-col"
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Floating Year Pill */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
                      <span className="px-2.5 py-1 rounded-lg bg-[#001F54]/85 backdrop-blur-md text-[#D4AF37] text-[10px] font-bold font-cinzel shadow-sm">
                        {photo.year}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                      <span className="text-[10px] text-[#D4AF37] font-cinzel font-bold">
                        {photo.stageLabel}
                      </span>
                      <h4 className="text-xs font-bold leading-tight line-clamp-1">{photo.title}</h4>
                      <p className="text-[11px] text-white/80 line-clamp-2 mt-1 font-serif italic">
                        &ldquo;{photo.caption}&rdquo;
                      </p>
                      {photo.cameraInfo && (
                        <div className="flex items-center gap-1 text-[9px] text-white/60 mt-1">
                          <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                          <span className="truncate">{photo.cameraInfo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Authentic Celebration Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-[#4B5B76] font-cinzel tracking-wider uppercase">
            Fototeca de Gala de Dannia Carolina • Celebrando 15 Años de Vida, Sueños y Familia
          </p>
        </div>
      </div>

      {/* ========================================================
          6. CINEMATIC FULL-SCREEN LIGHTBOX MODAL
         ======================================================== */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in zoom-in-95 duration-300 relative max-w-4xl w-full bg-[#001F54] rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/40 flex flex-col md:flex-row text-white max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#D4AF37] hover:text-[#001F54] text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar (ESC)"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>

            {/* Photo Column */}
            <div className="md:w-3/5 relative aspect-square sm:aspect-[4/3] md:aspect-auto bg-black flex items-center justify-center overflow-hidden">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="w-full h-full object-contain max-h-[75vh]"
              />

              {/* Prev / Next Buttons */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const cIdx = displayPhotos.findIndex((p) => p.id === lightboxPhoto.id);
                  if (cIdx !== -1) {
                    const pIdx = (cIdx - 1 + displayPhotos.length) % displayPhotos.length;
                    setLightboxPhoto(displayPhotos[pIdx]);
                  }
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-[#D4AF37] hover:text-[#001F54] text-white flex items-center justify-center transition cursor-pointer"
                title="Foto anterior"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const cIdx = displayPhotos.findIndex((p) => p.id === lightboxPhoto.id);
                  if (cIdx !== -1) {
                    const nIdx = (cIdx + 1) % displayPhotos.length;
                    setLightboxPhoto(displayPhotos[nIdx]);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-[#D4AF37] hover:text-[#001F54] text-white flex items-center justify-center transition cursor-pointer"
                title="Siguiente foto"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>

            {/* Story & Metadata Column */}
            <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between gap-4 bg-gradient-to-b from-[#001F54] to-[#0552AC] overflow-y-auto">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#001F54] font-cinzel">
                    {lightboxPhoto.stageLabel}
                  </span>
                  <span className="text-xs font-mono text-white/80">Año {lightboxPhoto.year}</span>
                </div>

                <h3 className="font-headline text-xl md:text-2xl font-bold leading-tight text-white">
                  {lightboxPhoto.title}
                </h3>

                <p className="font-serif italic text-sm text-white/90 leading-relaxed border-l-2 border-[#D4AF37] pl-3 py-1">
                  &ldquo;{lightboxPhoto.caption}&rdquo;
                </p>

                {lightboxPhoto.takenAt && (
                  <div className="flex items-center gap-2 text-xs text-white/80 pt-2">
                    <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">calendar_today</span>
                    <span>
                      {new Date(lightboxPhoto.takenAt).toLocaleDateString("es-NI", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {lightboxPhoto.cameraInfo && (
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">photo_camera</span>
                    <span>{lightboxPhoto.cameraInfo}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                <span className="text-[10px] font-cinzel uppercase text-white/60 tracking-wider">
                  D&apos;CAROL XV • Dannia Carolina 2026
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(null)}
                  className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-[#001F54] text-xs font-bold transition cursor-pointer"
                >
                  Continuar Viendo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
