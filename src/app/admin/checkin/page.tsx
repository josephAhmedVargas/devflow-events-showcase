"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatTableDisplay, extractInvitationCode } from "@/lib/pass-utils";
import { Html5Qrcode } from "html5-qrcode";

interface CheckinResult {
  status: "success" | "already_checked_in" | "not_found" | "error";
  message: string;
  guest?: {
    guestId: string;
    invitationCode: string;
    fullName: string;
    maxSeats: number;
    confirmedSeats?: number;
    enteredSeats?: number;
    tableNumber: number | null;
    tableName: string | null;
    zone: string | null;
    isVip: boolean;
  };
  previousCheckin?: {
    checkedInAt: string;
    checkinStation: string;
    checkedInCount: number;
    checkinMethod: string;
  };
  checkin?: any;
}

interface IngressItem {
  checkinId: string;
  checkedInAt: string;
  checkinStation: string;
  checkedInCount: number;
  checkinMethod: string;
  invitationCode: string;
  firstName: string;
  lastName: string;
  isVip: boolean;
  tableNumber: number | null;
  tableName: string | null;
}

export default function AdminCheckinPage() {
  const [stats, setStats] = useState({
    totalCapacity: 324,
    checkedInSeats: 0,
    passesScanned: 0,
    attendancePercentage: 0,
  });

  const [recentCheckins, setRecentCheckins] = useState<IngressItem[]>([]);
  const [scanResult, setScanResult] = useState<CheckinResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningCooldown = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio feedback synthesis using Web Audio API
  const playSound = (type: "success" | "warning") => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      if (type === "success") {
        // High harmonic double-chime (Major chord C5 -> G5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now);
        osc1.frequency.setValueAtTime(783.99, now + 0.12);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
      } else {
        // Harsh buzzer alert for duplicate / unrecognized
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(120, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Fetch stats and recent check-ins
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/checkin");
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.recentCheckins) setRecentCheckins(data.recentCheckins);
    } catch (e) {
      console.error("Error fetching checkin stats:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchStats();
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  // Execute check-in process
  const processCheckin = async (code: string, method: "qr_scan" | "manual_search" = "qr_scan") => {
    const clean = extractInvitationCode(code);
    if (!clean || loading) {
      if (!clean && code.trim()) {
        setScanResult({
          status: "not_found",
          message: `Código no reconocido en el escaneo: ${code.slice(0, 50)}`,
        });
        playSound("warning");
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: clean,
          station: "Puerta Principal • Recepción",
          method,
        }),
      });

      const data: CheckinResult = await res.json();
      setScanResult(data);

      if (data.status === "success") {
        playSound("success");
        fetchStats();
      } else {
        playSound("warning");
      }
    } catch (err) {
      setScanResult({
        status: "error",
        message: "Error de conexión al procesar el pase.",
      });
      playSound("warning");
    } finally {
      setLoading(false);
    }
  };

  // Start Camera QR Reader
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader");
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.72);
            return {
              width: Math.max(Math.min(size, 340), 220),
              height: Math.max(Math.min(size, 340), 220),
            };
          },
        },
        (decodedText) => {
          if (isScanningCooldown.current) return;
          isScanningCooldown.current = true;
          processCheckin(decodedText, "qr_scan");

          // 2.5s cooldown before scanning next QR to prevent multi-fire
          setTimeout(() => {
            isScanningCooldown.current = false;
          }, 2500);
        },
        () => {
          // Frame error (normal when QR not in frame)
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera start error:", err);
      setCameraError("No se pudo acceder a la cámara. Permite los permisos o ingresa el código manual.");
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 md:py-6 flex flex-col gap-6 max-w-[1560px] mx-auto w-full pb-16">
      {/* Banner de Bienvenida & Control de Puerta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] p-6 rounded-3xl text-white shadow-xl border-2 border-[#D4AF37]/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-cinzel text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            <span>Recepción de Honor • Hotel Holiday Inn</span>
          </div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold">
            Control de Acceso &amp; Escáner en Puerta
          </h1>
          <p className="text-xs text-white/80">
            Validación en tiempo real de pases digitales, asignación de mesas y detección anti-duplicados.
          </p>
        </div>

        {/* Quick Metrics Capsule */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/70 block font-semibold">
              Invitados en Sala
            </span>
            <span className="text-xl font-bold text-white font-mono">
              {stats.checkedInSeats} <span className="text-xs font-normal text-white/60">/ {stats.totalCapacity}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/70 block font-semibold">
              Pases Escaneados
            </span>
            <span className="text-xl font-bold text-[#D4AF37] font-mono">
              {stats.passesScanned}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase tracking-wider text-white/70 block font-semibold">
              Aforo Salón
            </span>
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {stats.attendancePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Scan Result Banner (Full Feedback) */}
      {scanResult && (
        <div
          className={`p-6 rounded-3xl border-2 shadow-2xl transition duration-300 animate-in fade-in zoom-in-95 ${
            scanResult.status === "success"
              ? "bg-emerald-50 border-emerald-500 text-emerald-950"
              : scanResult.status === "already_checked_in"
              ? "bg-rose-50 border-rose-600 text-rose-950 animate-pulse"
              : "bg-amber-50 border-amber-400 text-amber-950"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  scanResult.status === "success"
                    ? "bg-emerald-600 text-white"
                    : scanResult.status === "already_checked_in"
                    ? "bg-rose-600 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {scanResult.status === "success"
                    ? "check_circle"
                    : scanResult.status === "already_checked_in"
                    ? "warning"
                    : "help"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      scanResult.status === "success"
                        ? "bg-emerald-600 text-white"
                        : scanResult.status === "already_checked_in"
                        ? "bg-rose-600 text-white"
                        : "bg-amber-600 text-white"
                    }`}
                  >
                    {scanResult.status === "success"
                      ? "🟢 ACCESO AUTORIZADO"
                      : scanResult.status === "already_checked_in"
                      ? "🔴 ALERTA: PASE YA UTILIZADO (DUPLICADO)"
                      : "🟡 NO ENCONTRADO"}
                  </span>
                  {scanResult.guest?.isVip && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#001F54]">
                      INVITADO VIP
                    </span>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-bold font-headline">
                  {scanResult.guest
                    ? scanResult.guest.fullName
                    : scanResult.message}
                </h2>

                {/* Detalle si ya fue escaneado antes (Anti-Fraude) */}
                {scanResult.status === "already_checked_in" && scanResult.previousCheckin && (
                  <div className="p-3 bg-white rounded-xl border border-rose-200 text-rose-900 text-xs space-y-1 mt-2">
                    <p className="font-bold flex items-center gap-1 text-rose-700">
                      <span className="material-symbols-outlined text-sm">block</span>
                      ESTE CÓDIGO YA INGRESÓ AL SALÓN
                    </p>
                    <p>
                      • <strong>Hora de ingreso original:</strong>{" "}
                      {new Date(scanResult.previousCheckin.checkedInAt).toLocaleTimeString("es-NI", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                    <p>
                      • <strong>Estación:</strong> {scanResult.previousCheckin.checkinStation} (
                      {scanResult.previousCheckin.checkedInCount} personas registradas)
                    </p>
                    <p className="text-[11px] text-rose-600 font-semibold pt-0.5">
                      ⚠️ No permitir el ingreso de personas adicionales sin la autorización de la familia anfitriona.
                    </p>
                  </div>
                )}

                {/* Detalle de Mesa y Lugares para Nuevo Ingreso */}
                {scanResult.status === "success" && scanResult.guest && (
                  <p className="text-xs text-emerald-800 font-medium">
                    Registrado exitosamente a las{" "}
                    {new Date().toLocaleTimeString("es-NI", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Tarjeta de Mesa Asignada en Gigante */}
            {scanResult.guest && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md text-center min-w-[200px] shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Ubicación en Salón
                </span>
                <span className="font-cinzel text-xl font-bold text-[#0552AC] block my-0.5">
                  {formatTableDisplay(scanResult.guest.tableNumber, scanResult.guest.tableName)}
                </span>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  Cupo: {scanResult.guest.enteredSeats || scanResult.guest.maxSeats} Personas
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Escaneo: Cámara + Buscador Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cámara de Escáner QR */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0552AC]">qr_code_scanner</span>
              <h3 className="font-headline text-lg font-bold text-[#001F54]">
                Escáner de Cámara en Vivo
              </h3>
            </div>

            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                cameraActive
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-[#0552AC] hover:bg-[#001F54] text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {cameraActive ? "videocam_off" : "photo_camera"}
              </span>
              <span>{cameraActive ? "Detener Cámara" : "Activar Cámara"}</span>
            </button>
          </div>

          {cameraError && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-600">error</span>
              <span>{cameraError}</span>
            </div>
          )}

          {/* Contenedor del Lector QR */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 w-full aspect-square sm:aspect-[4/3] md:aspect-video min-h-[340px] sm:min-h-[400px] flex items-center justify-center border-2 border-[#0552AC]/30 shadow-inner">
            <div id="reader" className="w-full h-full min-h-[340px] sm:min-h-[400px]" />
            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-[230px] h-[230px] sm:w-[280px] sm:h-[280px] max-w-[80vw] max-h-[80vw]">
                  {/* Gilded Royal Viewfinder Corners */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-xl shadow-md" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-xl shadow-md" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-xl shadow-md" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#D4AF37] rounded-br-xl shadow-md" />
                  {/* Subtle target reticle and pulse */}
                  <div className="absolute inset-0 rounded-2xl border border-white/20" />
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/90 text-white space-y-3">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-[#D4AF37]">
                  <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-base">Cámara en Espera</h4>
                  <p className="text-xs text-white/60 max-w-xs mt-1">
                    Pulsa &quot;Activar Cámara&quot; para escanear pases con tu móvil o laptop, o usa el buscador manual al lado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-full bg-[#0552AC] hover:bg-[#001F54] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
                >
                  Encender Lector QR
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Buscador Manual de Emergencia */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0552AC]">badge</span>
            <h3 className="font-headline text-lg font-bold text-[#001F54]">
              Búsqueda Manual o Lector USB
            </h3>
          </div>
          <p className="text-xs text-[#4B5B76] leading-relaxed">
            Si el invitado no tiene batería, muestra una captura borrosa o usas una pistola lectora de código de barras:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              processCheckin(manualCode, "manual_search");
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#001F54] mb-1 font-cinzel">
                Código de Pase (ej. VIP-DC-001)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="VIP-DC-001..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] font-mono text-sm uppercase text-[#0D1829]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="w-full py-3 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#0552AC]/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {loading ? "hourglass_top" : "check"}
              </span>
              <span>{loading ? "Validando..." : "Validar e Ingresar"}</span>
            </button>
          </form>

          {/* Ejemplos Rápidos */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Pruebas Rápidas en Puerta:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["VIP-DC-001", "VIP-DC-002", "DC-2026-006"].map((testCode) => (
                <button
                  key={testCode}
                  type="button"
                  onClick={() => {
                    setManualCode(testCode);
                    processCheckin(testCode, "manual_search");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#E8F0FE] text-[#0552AC] hover:bg-[#0552AC] hover:text-white font-mono text-[10px] font-bold transition-colors cursor-pointer"
                >
                  {testCode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Últimos Ingresos en Vivo */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0552AC]">history</span>
            <h3 className="font-headline text-lg font-bold text-[#001F54]">
              Registro de Ingresos Recientes en Puerta
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Mostrando los últimos {recentCheckins.length} ingresos
          </span>
        </div>

        {recentCheckins.length === 0 ? (
          <div className="p-8 text-center bg-[#F8FAFD] rounded-2xl border border-slate-100 text-slate-400 text-xs">
            Aún no hay ingresos registrados. Los escaneos en puerta aparecerán aquí en vivo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-cinzel">
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Invitado de Honor</th>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Mesa Asignada</th>
                  <th className="py-2.5 px-3 text-center">Personas</th>
                  <th className="py-2.5 px-3 text-right">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCheckins.map((item) => (
                  <tr key={item.checkinId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#0552AC]">
                      {new Date(item.checkedInAt).toLocaleTimeString("es-NI", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#001F54]">
                          {item.firstName} {item.lastName}
                        </span>
                        {item.isVip && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#001F54] font-bold font-cinzel">
                            VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-600">
                      {item.invitationCode}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-cinzel font-bold text-[#0552AC]">
                        {formatTableDisplay(item.tableNumber, item.tableName)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold font-mono">
                      {item.checkedInCount}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.checkinMethod === "qr_scan"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.checkinMethod === "qr_scan" ? "QR Cámara" : "Manual"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
