"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { formatTableDisplay } from "@/lib/pass-utils";

interface GuestInfo {
  id?: string;
  guestId?: string;
  invitationCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  maxSeats: number;
  confirmedSeats?: number;
  status: string;
  isVip?: boolean;
  tableNumber?: number | null;
  tableName?: string | null;
  tableZone?: string | null;
  rsvp?: {
    response: "attending" | "declined" | string;
    confirmedCount: number;
    attendingCeremony: boolean;
    attendingReception: boolean;
    guestMessage?: string | null;
    dietaryNotes?: string | null;
    songRequest?: string | null;
  } | null;
}

interface RsvpFormProps {
  initialCode?: string;
  initialGuest?: GuestInfo | null;
  rsvpDeadlineText?: string;
}

const DEMO_GUESTS = [
  { code: "VIP-DC-001", label: "Fam. Mendoza (VIP)", seats: 4 },
  { code: "VIP-DC-002", label: "Lucía Herrera", seats: 2 },
  { code: "DC-2026-006", label: "Diego Solórzano", seats: 2 },
  { code: "DC-2026-088", label: "Fam. Cuadra", seats: 3 },
];

const DIETARY_QUICK_TAGS = [
  "Sin restricciones",
  "Vegetariano",
  "Sin gluten / Celíaco",
  "Alergia a mariscos",
  "Sin nueces",
  "Sin lácteos",
];

export function RsvpForm({
  initialCode = "",
  initialGuest = null,
  rsvpDeadlineText = "20 de Noviembre de 2026",
}: RsvpFormProps) {
  const [code, setCode] = useState(initialCode);
  const [guest, setGuest] = useState<GuestInfo | null>(initialGuest);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [response, setResponse] = useState<"attending" | "declined">("attending");
  const [confirmedCount, setConfirmedCount] = useState(1);
  const [attendingReception, setAttendingReception] = useState(true);
  const [attendingCeremony, setAttendingCeremony] = useState(true);
  const [guestMessage, setGuestMessage] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [songRequest, setSongRequest] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
    confirmedCount?: number;
    guestName?: string;
  } | null>(null);

  // Function to load guest details by code
  const fetchGuestByCode = async (targetCode: string) => {
    const clean = targetCode.trim().toUpperCase();
    if (!clean || clean.length < 3) return;

    setLoadingGuest(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/rsvp?code=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (res.ok && data.success && data.guest) {
        setGuest(data.guest);
        const max = data.guest.maxSeats || 1;
        if (data.guest.rsvp) {
          setResponse(data.guest.rsvp.response === "declined" ? "declined" : "attending");
          setConfirmedCount(Math.min(data.guest.rsvp.confirmedCount || 1, max));
          setAttendingCeremony(data.guest.rsvp.attendingCeremony ?? true);
          setAttendingReception(data.guest.rsvp.attendingReception ?? true);
          setGuestMessage(data.guest.rsvp.guestMessage || "");
          setDietaryNotes(data.guest.rsvp.dietaryNotes || "");
          setSongRequest(data.guest.rsvp.songRequest || "");
        } else {
          setConfirmedCount(max);
        }
      } else {
        setGuest(null);
        setLookupError("Código no encontrado. Por favor verifica tu pase digital o selecciona un código de demostración.");
      }
    } catch {
      setLookupError("Error al verificar código. Intenta nuevamente.");
    } finally {
      setLoadingGuest(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      fetchGuestByCode(initialCode);
    } else if (initialGuest) {
      setGuest(initialGuest);
      setCode(initialGuest.invitationCode);
      setConfirmedCount(initialGuest.maxSeats || 1);
    }
  }, [initialCode, initialGuest]);

  const handleSelectDemoCode = (selectedCode: string) => {
    setCode(selectedCode);
    setStatus(null);
    fetchGuestByCode(selectedCode);
  };

  const handleSelectDietaryTag = (tag: string) => {
    if (tag === "Sin restricciones") {
      setDietaryNotes("Ninguna");
      return;
    }
    if (!dietaryNotes || dietaryNotes === "Ninguna") {
      setDietaryNotes(tag);
    } else if (!dietaryNotes.includes(tag)) {
      setDietaryNotes(`${dietaryNotes}, ${tag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setStatus({ type: "error", message: "Por favor ingresa o valida tu código de pase." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          response,
          confirmedCount: response === "attending" ? confirmedCount : 0,
          attendingCeremony,
          attendingReception,
          guestMessage,
          dietaryNotes,
          songRequest,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Ocurrió un error al procesar tu confirmación." });
      } else {
        setStatus({
          type: "success",
          guestName: data.guestName,
          confirmedCount: data.confirmedCount,
          message:
            response === "attending"
              ? `¡Gracias ${data.guestName}! Tu asistencia ha sido confirmada para ${data.confirmedCount} persona(s) de honor en el sistema oficial de gala.`
              : `Hemos registrado tu respuesta. Lamentamos mucho que no puedas acompañarnos, ¡gracias por informarnos!`,
        });

        if (response === "attending") {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#0552AC", "#D4AF37", "#001F54", "#FDF7E7"],
          });
        }
      }
    } catch {
      setStatus({
        type: "error",
        message: "Error de red al enviar la confirmación. Por favor intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const maxAllowedSeats = guest ? Math.max(1, guest.maxSeats) : 4;

  return (
    <div
      className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-[#0552AC]/15 shadow-2xl p-5 sm:p-8 md:p-10 relative overflow-hidden"
      id="rsvp-form-card"
    >
      {/* Decorative corner flourishes */}
      <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
      <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-[#D4AF37]/50 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-[#D4AF37]/50 pointer-events-none" />

      {/* Atmospheric Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-[#0552AC]/5 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="text-center mb-7 sm:mb-9">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F0FE] text-[#0552AC] border border-[#0552AC]/20 text-[11px] font-bold uppercase tracking-widest mb-3 font-cinzel shadow-2xs">
          <span className="material-symbols-outlined text-[15px] text-[#D4AF37]">how_to_reg</span>
          <span>RSVP • Confirmación de Asistencia</span>
        </div>

        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-[#001F54] font-bold tracking-tight">
          Acompáñanos en esta Noche Solemne
        </h2>

        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] text-[#D4AF37]">event_available</span>
            <span>Confirmar antes del <strong className="text-[#001F54]">{rsvpDeadlineText}</strong></span>
          </span>
          <span className="text-xs text-[#4B5B76] hidden sm:inline">•</span>
          <span className="text-xs text-[#4B5B76] font-medium">Hotel Holiday Inn Managua</span>
        </div>
      </div>

      {/* SUCCESS STATE */}
      {status?.type === "success" ? (
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#E8F0FE]/80 via-white to-[#FDF7E7]/50 border-2 border-[#D4AF37]/50 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 shadow-xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#0552AC] to-[#001F54] text-[#D4AF37] flex items-center justify-center mb-4 shadow-xl ring-4 ring-[#D4AF37]/30">
            <span className="material-symbols-outlined text-3xl sm:text-4xl">
              {response === "attending" ? "verified" : "event_busy"}
            </span>
          </div>

          <span className="font-cinzel text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-1">
            {response === "attending" ? "¡Lugar Confirmado!" : "Registro Exitoso"}
          </span>

          <h3 className="font-headline text-2xl sm:text-3xl text-[#001F54] font-bold mb-3">
            {response === "attending" ? "¡Te Esperamos con Alegría!" : "Gracias por tu Respuesta"}
          </h3>

          <p className="text-sm sm:text-base text-[#4B5B76] max-w-lg mb-6 leading-relaxed">
            {status.message}
          </p>

          {/* Confirmed Details Summary Card */}
          {response === "attending" && guest && (
            <div className="w-full max-w-md bg-white p-4 sm:p-5 rounded-2xl border border-[#0552AC]/20 shadow-md mb-7 text-left space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Titular</span>
                <span className="font-bold text-xs text-[#001F54]">{guest.fullName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Lugares Confirmados</span>
                <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {status.confirmedCount} de {guest.maxSeats} persona(s)
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Mesa Asignada</span>
                <span className="font-bold text-xs text-[#0552AC]">
                  {formatTableDisplay(guest.tableNumber, guest.tableName)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Código de Pase</span>
                <span className="font-mono font-bold text-xs text-[#001F54] bg-slate-100 px-2 py-0.5 rounded">
                  {guest.invitationCode}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-[#0552AC]/30 text-[#0552AC] hover:bg-[#F8FAFD] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs active:scale-95"
            >
              Modificar Confirmación
            </button>
            <a
              href="#pase-digital-modal"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-[#0552AC]/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">qr_code_2</span>
              <span>Ver Pase Digital &amp; Mesa</span>
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
          {status?.type === "error" && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-2xs">
              <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
              <span className="leading-relaxed">{status.message}</span>
            </div>
          )}

          {/* PASO 1: CÓDIGO DE INVITACIÓN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#0552AC] text-white text-[10px] flex items-center justify-center font-sans font-bold">1</span>
                <span>Código de Invitación o Pase *</span>
              </label>
              {loadingGuest && (
                <span className="text-[11px] text-[#0552AC] font-semibold flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-[#0552AC] border-t-transparent animate-spin" />
                  <span>Verificando lista oficial...</span>
                </span>
              )}
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                tag
              </span>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setCode(val);
                  if (val.length >= 7) {
                    fetchGuestByCode(val);
                  }
                }}
                onBlur={() => {
                  if (code) fetchGuestByCode(code);
                }}
                placeholder="Ej: VIP-DC-001 o DC-2026-006"
                className="w-full pl-10 pr-24 py-3.5 rounded-2xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] font-mono text-xs sm:text-sm tracking-wider uppercase text-[#0D1829] shadow-inner transition"
              />
              <button
                type="button"
                onClick={() => fetchGuestByCode(code)}
                disabled={loadingGuest || !code.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold font-cinzel transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Validar
              </button>
            </div>

            {/* Quick Demo Code Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Probar en demo:</span>
              {DEMO_GUESTS.map((demo) => (
                <button
                  key={demo.code}
                  type="button"
                  onClick={() => handleSelectDemoCode(demo.code)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition cursor-pointer flex items-center gap-1 ${
                    code === demo.code
                      ? "bg-[#0552AC] text-white shadow-2xs"
                      : "bg-[#E8F0FE] text-[#0552AC] hover:bg-[#0552AC]/15"
                  }`}
                >
                  <span>{demo.code}</span>
                  <span className="opacity-70 text-[9px] hidden xs:inline">({demo.seats}p)</span>
                </button>
              ))}
            </div>

            {lookupError && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1.5 animate-in fade-in">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>{lookupError}</span>
              </p>
            )}

            {/* Credencial de Invitado Identificado */}
            {guest && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] text-white shadow-lg border-2 border-[#D4AF37]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-[#001F54] flex items-center justify-center font-bold text-sm font-cinzel shadow-md shrink-0">
                    {guest.firstName?.slice(0, 1)}
                    {guest.lastName?.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#D4AF37] font-bold">
                        Invitado de Honor
                      </span>
                      {guest.isVip && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-[#D4AF37] text-[#001F54] font-bold uppercase font-cinzel">
                          VIP
                        </span>
                      )}
                    </div>
                    <h3 className="font-headline text-base sm:text-lg font-bold text-white truncate">
                      {guest.fullName}
                    </h3>
                    <p className="text-xs text-white/80">
                      Mesa asignada:{" "}
                      <strong className="text-[#D4AF37] font-semibold">
                        {formatTableDisplay(guest.tableNumber, guest.tableName)}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-center sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block font-cinzel">
                    Cupo Asignado
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {guest.maxSeats} {guest.maxSeats === 1 ? "Lugar reservado" : "Lugares reservados"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PASO 2: DECISIÓN DE ASISTENCIA */}
          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0552AC] text-white text-[10px] flex items-center justify-center font-sans font-bold">2</span>
              <span>¿Confirmas tu Asistencia a la Gala? *</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opción Sí */}
              <button
                type="button"
                onClick={() => setResponse("attending")}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-center gap-3.5 cursor-pointer relative overflow-hidden ${
                  response === "attending"
                    ? "border-[#0552AC] bg-gradient-to-r from-[#0552AC] to-[#001F54] text-white shadow-lg shadow-[#0552AC]/20 ring-2 ring-[#0552AC]/30"
                    : "border-slate-200 bg-[#FCFDFE] text-slate-700 hover:border-[#0552AC]/40 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    response === "attending" ? "bg-white/20 text-[#D4AF37]" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </div>
                <div>
                  <span className="font-bold text-sm block">Sí, asistiré con honor</span>
                  <span className={`text-[11px] block ${response === "attending" ? "text-white/80" : "text-slate-500"}`}>
                    Compartiré esta noche especial
                  </span>
                </div>
              </button>

              {/* Opción No */}
              <button
                type="button"
                onClick={() => setResponse("declined")}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-center gap-3.5 cursor-pointer relative overflow-hidden ${
                  response === "declined"
                    ? "border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-600/20 ring-2 ring-rose-400/30"
                    : "border-slate-200 bg-[#FCFDFE] text-slate-700 hover:border-rose-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    response === "declined" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">cancel</span>
                </div>
                <div>
                  <span className="font-bold text-sm block">No podré asistir</span>
                  <span className={`text-[11px] block ${response === "declined" ? "text-white/80" : "text-slate-500"}`}>
                    Lamento no poder acompañarles
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* PASO 3: DETALLES DE ASISTENCIA (Solo si asiste) */}
          {response === "attending" && (
            <div className="space-y-6 pt-3 border-t border-slate-100 animate-in fade-in duration-300">
              {/* Stepper de Cupos / Acompañantes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0552AC] text-white text-[10px] flex items-center justify-center font-sans font-bold">3</span>
                    <span>Personas que Asistirán *</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Máximo permitido: <strong className="text-[#0552AC] font-bold">{maxAllowedSeats}</strong>
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFD] border border-[#0552AC]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Stepper controls */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmedCount((prev) => Math.max(1, prev - 1))}
                      disabled={confirmedCount <= 1}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#001F54] hover:bg-slate-100 flex items-center justify-center font-bold text-lg disabled:opacity-30 transition cursor-pointer shadow-2xs"
                    >
                      –
                    </button>

                    <div className="text-center min-w-[100px]">
                      <span className="font-headline font-bold text-2xl text-[#001F54] block leading-none">
                        {confirmedCount}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {confirmedCount === 1 ? "1 Persona" : `${confirmedCount} Personas`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConfirmedCount((prev) => Math.min(maxAllowedSeats, prev + 1))}
                      disabled={confirmedCount >= maxAllowedSeats}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#001F54] hover:bg-slate-100 flex items-center justify-center font-bold text-lg disabled:opacity-30 transition cursor-pointer shadow-2xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Pill Selector */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
                    {Array.from({ length: maxAllowedSeats }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setConfirmedCount(num)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                          confirmedCount === num
                            ? "bg-[#0552AC] text-white shadow-xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-[#0552AC]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic pl-1">
                  {confirmedCount === 1
                    ? "Asistirá únicamente el invitado titular."
                    : `Asistirá el titular más ${confirmedCount - 1} acompañante${confirmedCount > 2 ? "s" : ""}.`}
                </p>
              </div>

              {/* Sub-Eventos: Recepción y Entrada */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel block">
                  Momentos del Evento en los que nos Acompañarás
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                      attendingReception
                        ? "bg-[#E8F0FE]/60 border-[#0552AC]"
                        : "bg-white border-slate-200 opacity-70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={attendingReception}
                      onChange={(e) => setAttendingReception(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-[#0552AC] focus:ring-[#0552AC] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#001F54]">Recepción &amp; Cóctel</span>
                        <span className="text-[10px] bg-[#0552AC] text-white px-2 py-0.2 rounded-full font-bold">
                          6:00 PM
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Alfombra azul, cóctel de bienvenida y fotos oficiales.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                      attendingCeremony
                        ? "bg-[#FDF7E7]/60 border-[#D4AF37]"
                        : "bg-white border-slate-200 opacity-70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={attendingCeremony}
                      onChange={(e) => setAttendingCeremony(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-[#0552AC] focus:ring-[#0552AC] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#001F54]">Entrada &amp; Gran Vals</span>
                        <span className="text-[10px] bg-[#D4AF37] text-[#001F54] px-2 py-0.2 rounded-full font-bold font-cinzel">
                          7:00 PM
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Ceremonia solemne, vals de honor, brindis y cena.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preferencias Alimenticias con Quick Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel block">
                  Restricciones o Preferencias Alimenticias (Opcional)
                </label>

                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {DIETARY_QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectDietaryTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                        dietaryNotes.includes(tag) || (tag === "Sin restricciones" && dietaryNotes === "Ninguna")
                          ? "bg-[#0552AC] text-white border-[#0552AC]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    restaurant
                  </span>
                  <input
                    type="text"
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    placeholder="Ej: Alergia a mariscos, vegetariano, celíaco..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs sm:text-sm text-[#0D1829]"
                  />
                </div>
              </div>

              {/* Sugerencia de Canción */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel block">
                  Canción que Deseas Bailar en la Pista (Opcional)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 text-[18px]">
                    music_note
                  </span>
                  <input
                    type="text"
                    value={songRequest}
                    onChange={(e) => setSongRequest(e.target.value)}
                    placeholder="Título y artista para el DJ de la noche..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs sm:text-sm text-[#0D1829]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dedicatoria a Dannia */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel block">
              Dedicatoria o Mensaje de Bendición para Dannia Carolina (Opcional)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder="Escribe unas palabras de felicitación que se atesorarán en su libro conmemorativo de gala..."
                className="w-full p-4 rounded-2xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs sm:text-sm text-[#0D1829] resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Botón Principal de Enviar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] text-white hover:brightness-110 font-bold text-xs uppercase tracking-widest transition shadow-xl shadow-[#0552AC]/25 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 font-cinzel border border-[#D4AF37]/40"
          >
            <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">
              {loading ? "hourglass_empty" : "verified"}
            </span>
            <span>
              {loading ? "Enviando confirmación..." : "Confirmar en el Registro Oficial"}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}
