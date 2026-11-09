"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  ArrowLeft,
  Volume2,
  RefreshCw,
  Camera,
  Search,
} from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export default function AdminCheckinPage() {
  const { guests, checkInGuest } = useDemo();
  const [manualCode, setManualCode] = useState("");
  const [lastScanResult, setLastScanResult] = useState<{
    status: "success" | "duplicate" | "invalid";
    guest?: (typeof guests)[0];
    message: string;
  } | null>(null);

  // Sound feedback using Web Audio API (0 external dependencies)
  const playSound = (type: "success" | "error") => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.08); // D6
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // AudioContext fallback
    }
  };

  const handleScanCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    const res = checkInGuest(trimmed);

    if (!res.success) {
      playSound("error");
      if (res.reason === "ALREADY_CHECKED_IN") {
        setLastScanResult({
          status: "duplicate",
          guest: res.guest,
          message: `¡ATENCIÓN! Pase ya utilizado a las ${res.guest?.checkedInAt || "19:15"}. Alerta de posible duplicado.`,
        });
      } else {
        setLastScanResult({
          status: "invalid",
          message: `Código [${trimmed}] no encontrado en el sistema.`,
        });
      }
      return;
    }

    // Success checkin
    playSound("success");
    setLastScanResult({
      status: "success",
      guest: res.guest,
      message: `Acceso Autorizado para ${res.guest?.name || "Invitado"}.`,
    });
    setManualCode("");
  };

  const totalInRoom = guests
    .filter((g) => g.checkedIn)
    .reduce((sum, g) => sum + g.confirmedSeats, 0);
  const totalSeats = guests.reduce((sum, g) => sum + g.confirmedSeats, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-400" />
            <span>Escáner de Puerta & Recepción Express</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Validación en 0.5 segundos con confirmación audible y asignación de mesa en pantalla.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono text-slate-400 uppercase">Aforo en Salón</div>
          <div className="text-2xl font-black text-emerald-400">
            {totalInRoom} <span className="text-xs text-slate-400 font-normal">/ {totalSeats} cupos</span>
          </div>
        </div>
      </div>

      {/* Main Scanner Card & Visual Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Viewport Simulator */}
        <div className="p-6 rounded-3xl bg-[#0D0F1C] border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[380px]">
          {/* Animated Scanning Grid */}
          <div className="w-64 h-64 rounded-2xl border-2 border-emerald-500/40 relative flex items-center justify-center bg-emerald-500/[0.02]">
            {/* Corner crosshairs */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

            {/* Laser scan line */}
            <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-pulse" />

            <div className="text-center space-y-2 p-4">
              <Camera className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Lector QR Listo
              </div>
              <div className="text-[11px] text-slate-400">
                Apunta la cámara al pase digital o usa los botones de prueba abajo
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Respuesta con audio en vivo activada</span>
          </div>
        </div>

        {/* Right: Scan Feedback Card */}
        <div className="flex flex-col justify-between p-6 rounded-3xl bg-[#0D0F1C] border border-white/10">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Resultado de Lectura en Vivo
            </div>

            {lastScanResult ? (
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  lastScanResult.status === "success"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                    : lastScanResult.status === "duplicate"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastScanResult.status === "success" ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="text-base font-extrabold text-white">
                      {lastScanResult.status === "success"
                        ? "✓ ACCESO AUTORIZADO"
                        : lastScanResult.status === "duplicate"
                        ? "⚠️ PASE YA ESCANEADO"
                        : "✕ CÓDIGO INVÁLIDO"}
                    </div>
                    <div className="text-xs text-slate-300">{lastScanResult.message}</div>

                    {lastScanResult.guest && (
                      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">Mesa Asignada</div>
                          <div className="text-lg font-black text-cyan-400 font-mono">
                            Mesa {lastScanResult.guest.tableNumber < 10 ? `0${lastScanResult.guest.tableNumber}` : lastScanResult.guest.tableNumber}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">Cupos Permitidos</div>
                          <div className="text-lg font-black text-white font-mono">
                            {lastScanResult.guest.confirmedSeats} {lastScanResult.guest.confirmedSeats === 1 ? "persona" : "personas"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center text-slate-400 space-y-2">
                <QrCode className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-xs font-semibold text-slate-300">Esperando primer escaneo...</div>
                <div className="text-[11px] text-slate-400">
                  Selecciona cualquier invitado de prueba a continuación para ver la velocidad del sistema.
                </div>
              </div>
            )}
          </div>

          {/* Manual Input Search */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Ingreso Manual por Código o Cédula:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. DAN-001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanCode(manualCode)}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleScanCode(manualCode)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Test Simulator Buttons */}
      <div className="p-5 rounded-2xl bg-[#0D0F1C] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Simulador de Prueba Rápida (1 Clic)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Haz clic en cualquier pase para probar los distintos casos
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {guests.slice(0, 8).map((g) => (
            <button
              key={g.id}
              onClick={() => handleScanCode(g.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition flex items-center gap-2 ${
                g.checkedIn
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>{g.code}</span>
              <span className="text-[10px] text-slate-400 font-sans">({g.name.split(" ")[0]})</span>
              {g.checkedIn && <span className="text-[10px] text-emerald-400">✓ adentro</span>}
            </button>
          ))}

          {/* Invalid Test Button */}
          <button
            onClick={() => handleScanCode("INVALID-CODE-999")}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition"
          >
            ❌ Probar Código Inválido
          </button>
        </div>
      </div>
    </div>
  );
}
