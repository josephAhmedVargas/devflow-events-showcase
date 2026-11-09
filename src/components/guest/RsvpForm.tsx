"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

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
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
          setResponse(data.guest.rsvp.response);
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
        setLookupError("Código no encontrado. Por favor verifica tu pase digital o tarjeta.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setStatus({ type: "error", message: "Por favor ingresa tu código de pase." });
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
        setStatus({ type: "error", message: data.error || "Ocurrió un error." });
      } else {
        setStatus({
          type: "success",
          message: `¡Gracias ${data.guestName}! Tu asistencia ha sido ${
            response === "attending"
              ? `confirmada para ${data.confirmedCount} persona(s)`
              : "registrada (no asistencia)"
          } con éxito en el sistema oficial de gala.`,
        });

        if (response === "attending") {
          confetti({
            particleCount: 130,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#0552AC", "#D4AF37", "#001F54", "#FDF7E7"],
          });
        }
      }
    } catch {
      setStatus({
        type: "error",
        message: "Error al enviar la confirmación. Por favor intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const maxAllowedSeats = guest ? guest.maxSeats : 4;

  return (
    <div
      className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-[#0552AC]/15 shadow-2xl p-6 md:p-10 relative overflow-hidden"
      id="rsvp-form-card"
    >
      {/* Decorative corner accents */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#0552AC]/40 pointer-events-none"></div>
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#0552AC]/40 pointer-events-none"></div>
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#0552AC]/40 pointer-events-none"></div>
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#0552AC]/40 pointer-events-none"></div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FE] text-[#0552AC] text-xs font-semibold uppercase tracking-wider mb-2 font-cinzel">
          <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
          <span>RSVP • Confirmación de Asistencia</span>
        </div>
        <h2 className="font-headline text-3xl md:text-4xl text-[#001F54] font-bold">
          Acompáñanos en esta Noche Solemne
        </h2>
        <p className="text-xs md:text-sm text-[#4B5B76] mt-2 max-w-md mx-auto">
          Agradecemos confirmar tu asistencia antes del{" "}
          <span className="font-bold text-[#0552AC]">{rsvpDeadlineText}</span> para asegurar tu lugar en el
          banquete de gala en el Hotel Holiday Inn.
        </p>
      </div>

      {status?.type === "success" ? (
        <div className="p-8 rounded-2xl bg-[#E8F0FE] border border-[#0552AC]/30 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#0552AC] text-white flex items-center justify-center mb-4 shadow-lg shadow-[#0552AC]/20">
            <span className="material-symbols-outlined text-3xl">done_all</span>
          </div>
          <h3 className="font-headline text-2xl text-[#001F54] font-bold mb-2">
            ¡Respuesta Registrada con Éxito!
          </h3>
          <p className="text-sm text-[#4B5B76] max-w-md mb-6 leading-relaxed">{status.message}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStatus(null)}
              className="px-6 py-2.5 rounded-full bg-white border border-[#0552AC]/20 text-[#0552AC] hover:bg-[#F8FAFD] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Modificar Respuesta
            </button>
            <a
              href="#pase-digital-modal"
              className="px-6 py-2.5 rounded-full bg-[#0552AC] text-white hover:bg-[#001F54] text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              Ver Mi Pase & Mesa
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status?.type === "error" && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{status.message}</span>
            </div>
          )}

          {/* Invitation Code Input & Verification */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel">
                Código de Pase VIP / Invitación *
              </label>
              {loadingGuest && (
                <span className="text-[11px] text-[#0552AC] font-semibold flex items-center gap-1">
                  <span className="animate-spin text-xs">⏳</span> Verificando...
                </span>
              )}
            </div>

            <div className="relative">
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
                className="w-full px-4 py-3 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] font-mono text-sm tracking-wider uppercase text-[#0D1829]"
              />
              <button
                type="button"
                onClick={() => fetchGuestByCode(code)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-[#0552AC]/10 hover:bg-[#0552AC] hover:text-white text-[#0552AC] text-xs font-bold font-cinzel transition-colors"
              >
                Validar
              </button>
            </div>

            {lookupError && (
              <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>{lookupError}</span>
              </p>
            )}

            {/* Guest Identified Badge */}
            {guest && (
              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#E8F0FE] to-white border border-[#0552AC]/30 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0552AC] text-white flex items-center justify-center font-bold text-xs font-cinzel">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#4B5B76] font-bold block">
                      Invitado de Honor Identificado
                    </span>
                    <span className="font-bold text-sm text-[#001F54]">
                      {guest.fullName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] block font-cinzel">
                    Cupo Asignado
                  </span>
                  <span className="text-xs font-bold text-[#0552AC] font-mono">
                    {guest.maxSeats} {guest.maxSeats === 1 ? "Lugar" : "Lugares"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Response Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] mb-2 font-cinzel">
              ¿Confirmas tu Asistencia a la Gala? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResponse("attending")}
                className={`py-3.5 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                  response === "attending"
                    ? "border-[#0552AC] bg-[#0552AC] text-white shadow-md shadow-[#0552AC]/20"
                    : "border-slate-200 bg-white text-[#4B5B76] hover:border-[#0552AC]/40"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Sí, asistiré</span>
              </button>

              <button
                type="button"
                onClick={() => setResponse("declined")}
                className={`py-3.5 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                  response === "declined"
                    ? "border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "border-slate-200 bg-white text-[#4B5B76] hover:border-rose-300"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>No podré asistir</span>
              </button>
            </div>
          </div>

          {response === "attending" && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {/* Seats count selector bounded by guest maxSeats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] font-cinzel">
                    Número de Personas que Asistirán *
                  </label>
                  <span className="text-[11px] text-[#4B5B76]">
                    Máximo permitido: <strong>{maxAllowedSeats}</strong>
                  </span>
                </div>

                <select
                  value={confirmedCount}
                  onChange={(e) => setConfirmedCount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-sm text-[#0D1829] cursor-pointer"
                >
                  {Array.from({ length: maxAllowedSeats }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Persona (Solo el titular)" : `Personas (Titular + ${num - 1} acompañante${num > 2 ? "s" : ""})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ceremony / Reception attendance checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFD] border border-slate-200 cursor-pointer hover:border-[#0552AC]/40">
                  <input
                    type="checkbox"
                    checked={attendingReception}
                    onChange={(e) => setAttendingReception(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0552AC] focus:ring-[#0552AC]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#001F54]">Recepción & Cóctel</span>
                    <span className="text-[10px] text-[#4B5B76]">6:00 PM • Hotel Holiday Inn</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFD] border border-slate-200 cursor-pointer hover:border-[#0552AC]/40">
                  <input
                    type="checkbox"
                    checked={attendingCeremony}
                    onChange={(e) => setAttendingCeremony(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0552AC] focus:ring-[#0552AC]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#001F54]">Entrada & Gran Vals</span>
                    <span className="text-[10px] text-[#4B5B76]">7:00 PM • Hotel Holiday Inn</span>
                  </div>
                </label>
              </div>

              {/* Dietary notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] mb-2 font-cinzel">
                  Restricciones o Preferencias Alimenticias (Opcional)
                </label>
                <input
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Ej: Alergia a mariscos, vegetariano, celíaco..."
                  className="w-full px-4 py-3 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-sm text-[#0D1829]"
                />
              </div>

              {/* Song request */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] mb-2 font-cinzel">
                  Canción que deseas bailar en la noche (Opcional)
                </label>
                <input
                  type="text"
                  value={songRequest}
                  onChange={(e) => setSongRequest(e.target.value)}
                  placeholder="Título y artista para ambientar la pista..."
                  className="w-full px-4 py-3 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-sm text-[#0D1829]"
                />
              </div>
            </div>
          )}

          {/* Dedication message */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#001F54] mb-2 font-cinzel">
              Dedicatoria o Mensaje para Dannia Carolina (Opcional)
            </label>
            <textarea
              rows={3}
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              placeholder="Escribe unas palabras de felicitación que se atesorarán en su libro conmemorativo..."
              className="w-full px-4 py-3 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-sm text-[#0D1829] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-widest transition shadow-xl shadow-[#0552AC]/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">verified</span>
            <span>{loading ? "Enviando confirmación..." : "Enviar Confirmación Oficial"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
