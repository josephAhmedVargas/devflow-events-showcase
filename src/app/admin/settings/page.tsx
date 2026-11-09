"use client";

import { useState, useEffect } from "react";
import { showErrorAlert, showSuccessAlert } from "@/lib/swal";

interface EventSettingsData {
  rsvpEnabled: boolean;
  photoUploadsEnabled: boolean;
  photoModerationEnabled: boolean;
  guestbookEnabled: boolean;
  playlistEnabled: boolean;
  tableLookupEnabled: boolean;
  liveWallEnabled: boolean;
  allowCompanions: boolean;
  maxCompanionsPerGuest: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<EventSettingsData>({
    rsvpEnabled: true,
    photoUploadsEnabled: true,
    photoModerationEnabled: true,
    guestbookEnabled: true,
    playlistEnabled: true,
    tableLookupEnabled: true,
    liveWallEnabled: true,
    allowCompanions: true,
    maxCompanionsPerGuest: 2,
  });

  const [eventPhase, setEventPhase] = useState<"pre_event" | "live" | "post_event">("pre_event");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        if (data.event?.phase) {
          setEventPhase(data.event.phase);
        }
        setSettings({
          rsvpEnabled: Boolean(data.settings.rsvpEnabled),
          photoUploadsEnabled: Boolean(data.settings.photoUploadsEnabled),
          photoModerationEnabled: Boolean(data.settings.photoModerationEnabled),
          guestbookEnabled: Boolean(data.settings.guestbookEnabled),
          playlistEnabled: Boolean(data.settings.playlistEnabled),
          tableLookupEnabled: Boolean(data.settings.tableLookupEnabled),
          liveWallEnabled: Boolean(data.settings.liveWallEnabled),
          allowCompanions: Boolean(data.settings.allowCompanions),
          maxCompanionsPerGuest: Number(data.settings.maxCompanionsPerGuest) || 2,
        });
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (key: keyof EventSettingsData) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveNotice(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, phase: eventPhase }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      showSuccessAlert(
        "¡Ajustes Guardados!",
        "Ajustes del evento guardados en Neon PostgreSQL con éxito!"
      );
    } catch (err: any) {
      showErrorAlert("Error al guardar ajustes", err.message || "No se pudo actualizar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8 max-w-[1200px] mx-auto w-full pb-16">
      {/* Toast Notice */}
      {saveNotice && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{saveNotice}</span>
          </div>
          <button onClick={() => setSaveNotice(null)} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-[#0D1829]">
            Ajustes del Evento &amp; Parámetros Operativos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configuración de directivas de confirmación, moderación multimedia y reglas de aforo
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2.5 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">
            save
          </span>
          <span>{saving ? "Guardando..." : "Guardar Ajustes"}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <div className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 rounded-full border-2 border-[#0552AC] border-t-transparent animate-spin"></span>
            <span className="text-xs font-semibold">Cargando configuración del evento...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Section 0: Control Maestro de Fase del Evento */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#D4AF37]/40 shadow-xs flex flex-col gap-5 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#D4AF37] text-[26px]">
                  flag
                </span>
                <div>
                  <h2 className="font-headline text-base font-bold text-[#0D1829]">
                    Fase Global del Evento
                  </h2>
                  <p className="text-xs text-slate-500">
                    Define la experiencia que experimentan los invitados en la portada y adapta la plataforma
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-[#E8F0FE] text-[#0552AC] border border-[#0552AC]/20">
                Fase Activa: {eventPhase === "pre_event" ? "Pre-Evento" : eventPhase === "live" ? "En Vivo" : "Post-Evento"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Pre-Event */}
              <button
                type="button"
                onClick={() => setEventPhase("pre_event")}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition cursor-pointer ${
                  eventPhase === "pre_event"
                    ? "border-[#0552AC] bg-[#E8F0FE]/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-[#0D1829] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#0552AC]">mark_email_read</span>
                    <span>1. Pre-Evento</span>
                  </span>
                  {eventPhase === "pre_event" && (
                    <span className="w-2 h-2 rounded-full bg-[#0552AC]"></span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Invitación editorial, cuenta regresiva, confirmaciones de asistencia (RSVP) y asignación de mesas.
                </p>
              </button>

              {/* Option 2: Live */}
              <button
                type="button"
                onClick={() => setEventPhase("live")}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition cursor-pointer ${
                  eventPhase === "live"
                    ? "border-rose-500 bg-rose-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-[#0D1829] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-rose-600 animate-pulse">live_tv</span>
                    <span>2. En Vivo (Día D)</span>
                  </span>
                  {eventPhase === "live" && (
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Banner en portada para acceder a la celebración, subida rápida de fotos por QR y Live Wall para proyector.
                </p>
              </button>

              {/* Option 3: Post-Event */}
              <button
                type="button"
                onClick={() => setEventPhase("post_event")}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition cursor-pointer ${
                  eventPhase === "post_event"
                    ? "border-[#D4AF37] bg-amber-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-[#0D1829] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">auto_stories</span>
                    <span>3. Post-Evento</span>
                  </span>
                  {eventPhase === "post_event" && (
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Carta de gratitud de Dannia, galería de fotos curadas y libro conmemorativo de dedicatorias.
                </p>
              </button>
            </div>
          </div>

          {/* Section 1: Switches Operativos */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#0552AC] text-[24px]">
                toggle_on
              </span>
              <div>
                <h2 className="font-headline text-base font-bold text-[#0D1829]">
                  Conmutadores Operativos Principales
                </h2>
                <p className="text-xs text-slate-400">
                  Controla en tiempo real qué módulos están abiertos para los invitados
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Toggle 1: RSVP */}
              <div className="py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1829]">
                    Recepción de Confirmaciones RSVP
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Permite a los invitados confirmar o declinar asistencia desde la invitación
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.rsvpEnabled}
                    onChange={() => handleToggle("rsvpEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
                </label>
              </div>

              {/* Toggle 2: Moderación de Fotos */}
              <div className="py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1829]">
                    Moderación Previa Obligatoria de Fotos
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Ninguna foto subida por invitados se proyectará sin aprobación previa del coordinador
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.photoModerationEnabled}
                    onChange={() => handleToggle("photoModerationEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
                </label>
              </div>

              {/* Toggle 3: Subida de Fotos por Invitados */}
              <div className="py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1829]">
                    Subida de Fotos Móvil desde /live
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Habilita la cámara y selector de galería para los invitados en la fiesta
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.photoUploadsEnabled}
                    onChange={() => handleToggle("photoUploadsEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
                </label>
              </div>

              {/* Toggle 4: Consulta de Mesas */}
              <div className="py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1829]">
                    Buscador de Mesa VIP para Invitados
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Permite consultar el número de mesa y plano con el código o nombre
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.tableLookupEnabled}
                    onChange={() => handleToggle("tableLookupEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
                </label>
              </div>

              {/* Toggle 5: Muro en Vivo / Live Wall */}
              <div className="py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1829]">
                    Emisión en Vivo para Gran Pantalla LED
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Habilita la sincronización del feed en tiempo real para proyectores
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.liveWallEnabled}
                    onChange={() => handleToggle("liveWallEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
                </label>
              </div>

              {/* Toggle 6: Libro de Deseos */}
              <div className="py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0D1829]">
                    Libro de Deseos &amp; Dedicatorias
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Permite enviar mensajes de felicitación para el ticker en vivo y archivo
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.guestbookEnabled}
                    onChange={() => handleToggle("guestbookEnabled")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Reglas de Acompañantes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#0552AC] text-[24px]">
                group_add
              </span>
              <h2 className="font-headline text-base font-bold text-[#0D1829]">
                Políticas de Acompañantes por Invitación
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
              <div>
                <label className="text-xs font-bold text-[#0D1829] block mb-1">
                  Máximo de Acompañantes por Pase
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxCompanionsPerGuest}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxCompanionsPerGuest: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-[#0552AC] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowCompanions}
                    onChange={() => handleToggle("allowCompanions")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
                </label>
                <span className="text-xs font-bold text-[#0D1829]">
                  Permitir Acompañantes Adicionales
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Paleta y Branding Oficial */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#D4AF37] text-[24px]">
                palette
              </span>
              <div>
                <h2 className="font-headline text-base font-bold text-[#0D1829]">
                  Paleta Institucional D&apos;CAROL Dannia Carolina
                </h2>
                <p className="text-xs text-slate-400">
                  Tokens visuales congelados de acuerdo con el Master Plan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#0552AC] text-white flex flex-col justify-between h-24 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider">Azul Royal</span>
                <span className="font-mono text-xs font-bold">#0552AC</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#001F54] text-white flex flex-col justify-between h-24 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider">Azul Noche</span>
                <span className="font-mono text-xs font-bold">#001F54</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#D4AF37] text-[#001F54] flex flex-col justify-between h-24 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider">Champagne Real</span>
                <span className="font-mono text-xs font-bold">#D4AF37</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-slate-200 text-[#0D1829] flex flex-col justify-between h-24 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider">Superficie Marfil</span>
                <span className="font-mono text-xs font-bold">#F8FAFD</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
