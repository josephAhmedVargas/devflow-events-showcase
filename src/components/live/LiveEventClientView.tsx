"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopExperienceNav } from "@/components/shared/TopExperienceNav";
import { MobileModeSwitcher } from "@/components/shared/MobileModeSwitcher";
import { DigitalPassModal } from "@/components/guest/DigitalPassModal";
import { showErrorAlert } from "@/lib/swal";

export function LiveEventClientView({ isAdmin = false }: { isAdmin?: boolean }) {
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState("Vals & Brindis");
  const [dedication, setDedication] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isFullscreenProjector, setIsFullscreenProjector] = useState(false);

  interface LiveTelemetry {
    stage: {
      title: string;
      time: string;
      description?: string | null;
      status: string;
    };
    nextStage?: {
      title: string;
      time: string | null;
      description?: string | null;
    } | null;
    counters: {
      photos: number;
      messages: number;
      inSalon: number;
    };
    announcement?: string | null;
  }

  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);

  // Photo queue state
  interface UploadItem {
    id: string;
    url: string;
    filter: string;
    name: string;
    file?: File;
  }

  const [uploadedPhotos, setUploadedPhotos] = useState<UploadItem[]>([]);
  const [wallPhotos, setWallPhotos] = useState<
    Array<{ id: string; url: string; uploaderName: string; caption?: string }>
  >([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Fetch approved photos from real API
  const fetchWallPhotos = async () => {
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      if (data.photos && data.photos.length > 0) {
        setWallPhotos(data.photos);
      }
    } catch (e) {
      console.error("Error fetching live photos:", e);
    }
  };

  // Fetch real live telemetry
  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/live/telemetry");
      const data = await res.json();
      if (data.success) {
        setTelemetry(data);
      }
    } catch (e) {
      console.error("Error fetching telemetry:", e);
    }
  };

  useEffect(() => {
    fetchWallPhotos();
    fetchTelemetry();
    const interval = setInterval(() => {
      // Pause polling if tab is backgrounded or minimized to save Neon compute
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchWallPhotos();
      fetchTelemetry();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const moments = [
    { name: "Vals & Brindis", icon: "celebration" },
    { name: "Selfie / Mesa", icon: "groups" },
    { name: "Pista de Baile", icon: "nightlife" },
  ];

  // Client-side ultra-fast WebP compression
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1440;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          "image/webp",
          0.82
        );
      };
      img.onerror = () => resolve(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newItems: UploadItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        newItems.push({
          id: `ph-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          url: previewUrl,
          filter: "Recuerdos",
          name: file.name,
          file,
        });
      }
      setUploadedPhotos((prev) => [...newItems, ...prev]);
    }
    // Permitir volver a seleccionar el mismo archivo si se elimina
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAllPhotos = () => {
    setUploadedPhotos([]);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!dedication && uploadedPhotos.length === 0) return;
    setIsSubmitting(true);

    try {
      if (uploadedPhotos.length > 0) {
        for (const photo of uploadedPhotos) {
          if (photo.file) {
            const compressedBlob = await compressImage(photo.file);
            const formData = new FormData();
            formData.append("uploaderName", "Invitado de Gala");
            formData.append("caption", dedication);
            formData.append("category", selectedMoment);
            const fileName = `${photo.name.replace(/\.[^/.]+$/, "")}.webp`;
            formData.append("file", compressedBlob, fileName);

            await fetch("/api/photos/upload", {
              method: "POST",
              body: formData,
            });
          }
        }
      } else if (dedication) {
        const formData = new FormData();
        formData.append("uploaderName", "Invitado de Gala");
        formData.append("caption", dedication);
        formData.append("category", selectedMoment);
        await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
        });
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setDedication("");
      handleClearAllPhotos();

      // Re-fetch live feed immediately
      setTimeout(() => {
        fetchWallPhotos();
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting:", error);
      showErrorAlert("Error al enviar foto", "No se pudo enviar la foto en este momento. Por favor intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0D1829] flex flex-col selection:bg-[#0552AC] selection:text-white">
      {/* Fixed Top Shell Header */}
      <header className="fixed top-0 left-0 right-0 z-50 material-bar">
        <div className="h-16 md:h-20 w-full max-w-[1360px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo & Monogram */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-[#0552AC] to-[#001F54] flex items-center justify-center text-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-xs shrink-0">
              <span className="font-cinzel text-sm md:text-base font-bold tracking-wider">DC</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-sm md:text-base text-[#0D1829] tracking-tight">
                  D&apos;CAROL
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#0552AC]">
                  Live
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase hidden sm:block">
                Edición en Vivo • Mis XV
              </span>
            </div>
          </Link>

          {/* Navigation Pill Switcher — xl only */}
          {isAdmin && (
            <div className="hidden md:flex items-center">
              <TopExperienceNav isAdmin={true} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPassModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0552AC] text-white hover:bg-[#001F54] transition text-xs font-semibold shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-[#D4AF37]" style={{ fontVariationSettings: "'FILL' 1" }}>
                qr_code_2
              </span>
              <span className="hidden sm:inline">Mi Pase</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mode switcher below header — mobile/tablet only (only if admin) */}
      {isAdmin && <MobileModeSwitcher topOffset="top-16 md:top-20" />}

      {/* Main Content Area */}
      {/* pt: 64+36=100 mobile | 80+36=116 md | xl no mode bar=80 */}
      <main className="w-full pt-[100px] md:pt-[116px] md:pt-[80px] pb-16 flex-1 max-w-[1360px] mx-auto px-4 md:px-8 flex flex-col gap-6">
        {/* SECTION 1: CEREMONIAL BROADCAST STATUS BAR */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-md p-4 md:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#0552AC]/5 rounded-full blur-2xl pointer-events-none" />

          {/* Left: Live Badge & Current Stage */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {telemetry?.stage.time ? `En Vivo • ${telemetry.stage.time}` : "En Vivo"}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">
                  auto_awesome
                </span>
                <h2 className="font-headline text-lg font-bold text-[#0D1829] truncate">
                  {telemetry?.stage.title || "Recepción & Alfombra Real"}
                </h2>
              </div>
              {telemetry?.nextStage ? (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Siguiente hito:{" "}
                  <strong className="text-[#0552AC]">
                    {telemetry.nextStage.time ? `${telemetry.nextStage.time} — ` : ""}
                    {telemetry.nextStage.title}
                  </strong>
                </p>
              ) : (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">stars</span>
                  <span>Gran Gala de Quince Años en Desarrollo</span>
                </p>
              )}
            </div>
          </div>

          {/* Center: Live Pulse Counters */}
          <div className="flex items-center justify-around lg:justify-center gap-6 py-2 px-5 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#0552AC]">
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span className="font-headline text-base font-bold tabular-nums">
                  {telemetry?.counters.photos ?? wallPhotos.length}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fotos</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                <span className="material-symbols-outlined text-[16px]">favorite</span>
                <span className="font-headline text-base font-bold tabular-nums">
                  {telemetry?.counters.messages ?? 0}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mensajes</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-slate-700">
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span className="font-headline text-base font-bold tabular-nums">
                  {telemetry?.counters.inSalon ?? 0}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">En Salón</span>
            </div>
          </div>

          {/* Right: Screen Projection Switcher */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              type="button"
              onClick={() => setIsFullscreenProjector(!isFullscreenProjector)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] transition text-xs font-semibold shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
                fullscreen
              </span>
              <span>Modo Gran Pantalla</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: GUEST ACTION CENTER & PHOTO UPLOAD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Mobile Photo Upload & Dedications (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#0552AC] text-[10px] font-bold uppercase tracking-wider">
                  D&apos;CAROL Live Stream
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Acceso Invitados
                </span>
              </div>
              <h3 className="font-headline text-xl font-bold text-[#0D1829]">
                Comparte tus Recuerdos con Dannia
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sube fotos espontáneas de tu mesa o videos cortos para que se proyecten en la Gran Pantalla central.
              </p>
            </div>

            {/* Hidden Native Camera Input with capture="environment" for direct mobile camera viewfinder */}
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* Hidden Native Gallery Input for photo library selection */}
            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Upload Action CTA Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#001F54] text-white hover:bg-[#0552AC] transition text-xs font-semibold shadow-xs active:scale-98 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
                  photo_camera
                </span>
                <span>Tomar Foto</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-xs font-semibold active:scale-98 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0552AC]">
                  photo_library
                </span>
                <span>Elegir de Galería</span>
              </button>
            </div>

            {/* Horizontal Polaroid Preview Strip */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    Fotos Seleccionadas ({uploadedPhotos.length})
                  </span>
                  {uploadedPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllPhotos}
                      className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 transition-colors underline cursor-pointer"
                    >
                      Limpiar todas
                    </button>
                  )}
                </div>
                <span className="text-slate-400 text-[11px]">Filtro activo</span>
              </div>

              {uploadedPhotos.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs bg-slate-50/50">
                  Aún no has seleccionado fotos. Toma una foto con tu cámara o elige de tu galería.
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 pt-2 no-scrollbar">
                  {uploadedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="shrink-0 w-36 bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col gap-1 shadow-2xs relative group"
                    >
                      {/* Botón para eliminar foto individual */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute -top-1.5 -right-1.5 z-20 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition hover:scale-110 active:scale-95 cursor-pointer"
                        title="Eliminar esta foto"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>

                      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-200">
                        <Image
                          src={photo.url}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold">
                          100% Listo
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-white/90 text-[#0552AC] text-[9px] font-bold">
                          {photo.filter}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate pt-1">
                        {photo.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Moment / Category Selector Chips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ¿En qué momento fue tomada?
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {moments.map((moment) => (
                  <button
                    key={moment.name}
                    type="button"
                    onClick={() => setSelectedMoment(moment.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                      selectedMoment === moment.name
                        ? "bg-[#0552AC] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {moment.icon}
                    </span>
                    <span>{moment.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dedication Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Dedicatoria o Deseo para Dannia
                </label>
                <span className="text-slate-400 text-[10px]">
                  {dedication.length} / 140
                </span>
              </div>
              <textarea
                value={dedication}
                onChange={(e) => setDedication(e.target.value.slice(0, 140))}
                placeholder="Escribe tu felicitación o anécdota inolvidable..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0552AC] focus:bg-white transition resize-none"
              />
            </div>

            {/* Submit Button with Live Feedback */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-xs shadow-md transition duration-300 flex items-center justify-center gap-2 active:scale-98 ${
                  submitSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-[#0552AC] text-white hover:bg-[#001F54]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin text-[#D4AF37]">
                      progress_activity
                    </span>
                    <span>Transmitiendo al Salón...</span>
                  </>
                ) : submitSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
                      check_circle
                    </span>
                    <span>¡Enviado a Proyección! ✨</span>
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined text-[18px] text-[#D4AF37]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      send
                    </span>
                    <span>Enviar al Muro en Pantalla</span>
                    <span className="material-symbols-outlined text-[16px]">
                      auto_awesome
                    </span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1 text-center text-[10px] text-slate-400">
                <span className="material-symbols-outlined text-[#D4AF37] text-[13px]">
                  verified
                </span>
                <span>Aprobación en vivo por moderación en menos de 30s</span>
              </div>
            </div>
          </div>

          {/* Right: Live Status Drawer & Quick Links (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 text-[#001F54] flex items-center justify-center font-bold">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {submitSuccess ? "check_circle" : uploadedPhotos.length > 0 ? "upload" : "live_tv"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      Estado de tus envíos
                    </span>
                    <h4 className="font-headline text-base font-bold text-[#0D1829]">
                      {submitSuccess
                        ? "¡Recuerdo enviado con éxito!"
                        : uploadedPhotos.length > 0
                        ? `${uploadedPhotos.length} foto${uploadedPhotos.length > 1 ? "s" : ""} lista${uploadedPhotos.length > 1 ? "s" : ""} para enviar`
                        : "Listo para compartir recuerdos"}
                    </h4>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  submitSuccess
                    ? "bg-emerald-50 text-emerald-700"
                    : uploadedPhotos.length > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-[#E8F0FE] text-[#0552AC]"
                }`}>
                  {submitSuccess ? "EN MODERACIÓN" : uploadedPhotos.length > 0 ? "PENDIENTE" : "SALA CONECTADA"}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {submitSuccess
                  ? "Tus fotos han sido recibidas por el equipo de coordinación y se proyectarán en la pantalla central una vez aprobadas."
                  : uploadedPhotos.length > 0
                  ? "Presiona el botón dorado 'Enviar al Muro en Pantalla' para subir tus fotos a la transmisión en vivo."
                  : "Toma fotos espontáneas desde tu mesa o escribe una dedicatoria para Dannia Carolina para proyectarlas en vivo en el salón."}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFullscreenProjector(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[#0552AC] text-[17px]">
                    tv
                  </span>
                  <span>Ver Pantalla</span>
                </button>
                <Link
                  href="/#mesas"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[#D4AF37] text-[17px]">
                    restaurant_menu
                  </span>
                  <span>Menú &amp; Mesa</span>
                </Link>
              </div>
            </div>

            {/* Live Dedicated Wall Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-headline text-base font-bold text-[#0D1829]">
                  Últimas Fotos en Pantalla
                </h4>
                <span className="text-[11px] font-bold text-[#0552AC]">
                  {wallPhotos.length > 0 ? `${wallPhotos.length} en Vivo` : "Rotación Activa"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(wallPhotos.length > 0
                  ? wallPhotos.slice(0, 2)
                  : [
                      {
                        id: "p1",
                        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
                        uploaderName: "Mesa 01 • Familia Dannia",
                      },
                      {
                        id: "p2",
                        url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400",
                        uploaderName: "Corte de Honor Real",
                      },
                    ]
                ).map((wp) => (
                  <div key={wp.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200 shadow-sm">
                    <Image
                      src={wp.url}
                      alt={wp.uploaderName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] truncate">
                      {wp.uploaderName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Celestial Footer */}
        <footer className="pt-8 pb-12 flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#E8F0FE] flex items-center justify-center text-[#0552AC]">
            <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">
              auto_awesome
            </span>
          </div>
          <span className="font-headline italic text-sm text-[#0552AC] max-w-sm">
            &quot;Las mejores noches no se miden en horas, sino en sonrisas compartidas.&quot;
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            D&apos;CAROL Live Memory Stream • Hotel Holiday Inn Managua
          </span>
        </footer>
      </main>

      {/* Fullscreen Projector Modal for Gran Pantalla LED */}
      {isFullscreenProjector && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between p-8 text-white select-none animate-fade-in">
          {/* Top Projector Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#001F54] font-bold text-sm">
                DC
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-lg font-bold">
                  D&apos;CAROL — Dannia Carolina MIS XV
                </span>
                <span className="text-xs text-[#D4AF37] tracking-wider uppercase font-cinzel">
                  Muro Multimedia en Vivo • Hotel Holiday Inn Managua
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreenProjector(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Central Featured Projected Photo */}
          <div className="flex-1 flex items-center justify-center my-6">
            <div className="relative w-full max-w-4xl h-[70vh] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-[#D4AF37]/50">
              <Image
                src={
                  wallPhotos.length > 0
                    ? wallPhotos[0].url
                    : "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1400"
                }
                alt="Live Wall Projection"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 flex flex-col gap-1">
                <span className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider font-cinzel">
                  {wallPhotos.length > 0
                    ? wallPhotos[0].uploaderName
                    : "Mesa 01 • Familia Dannia Carolina"}
                </span>
                <p className="font-headline text-2xl text-white italic">
                  {wallPhotos.length > 0 && wallPhotos[0].caption
                    ? wallPhotos[0].caption
                    : "“¡Por tus quince prima hermosa! Que Dios te bendiga siempre ✨👑”"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Projector QR Callout */}
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-300">
              Escanea el código de tu pase para enviar tus recuerdos a la pantalla
            </span>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-cinzel">
              Loop 6s • Moderación en Vivo
            </span>
          </div>
        </div>
      )}

      {/* Digital Pass Modal */}
      {showPassModal && (
        <DigitalPassModal
          isOpen={showPassModal}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </div>
  );
}
