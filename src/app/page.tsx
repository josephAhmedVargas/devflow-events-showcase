"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useDemo } from "@/context/DemoContext";
import { ShowcaseTopBanner } from "@/components/showcase/ShowcaseTopBanner";
import { ShowcaseFloatingCTA } from "@/components/showcase/ShowcaseFloatingCTA";
import { DemoDigitalPassModal } from "@/components/showcase/DemoDigitalPassModal";
import {
  Sparkles,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Music,
  CheckCircle2,
  Users,
  Camera,
  LayoutDashboard,
  Volume2,
  VolumeX,
  Navigation,
  Heart,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ShowcaseHomePage() {
  const { eventSettings, guests, confirmRsvp, selectedGuestForPass, setSelectedGuestForPass } =
    useDemo();
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // RSVP Form local state
  const [selectedGuestId, setSelectedGuestId] = useState(guests[0]?.id || "");
  const [rsvpSeats, setRsvpSeats] = useState(guests[0]?.totalSeats || 2);
  const [rsvpNote, setRsvpNote] = useState("");
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date("2026-12-04T18:00:00").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirmRsvp(selectedGuestId, Number(rsvpSeats), rsvpNote);
    setRsvpSubmitted(true);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => setRsvpSubmitted(false), 5000);
  };

  const currentRsvpGuest = guests.find((g) => g.id === selectedGuestId) || guests[0];

  return (
    <div className="min-h-screen bg-[#07070D] text-slate-100 font-sans selection:bg-violet-600 selection:text-white pb-24">
      {/* 1. Permanent Top Banner: Showcase Indicator */}
      <ShowcaseTopBanner />

      {/* Floating CTA & Pass Modal */}
      <ShowcaseFloatingCTA />
      <DemoDigitalPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
      />

      {/* Hero Section */}
      <header className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 overflow-hidden border-b border-white/5">
        {/* Ambient Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/20 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Elite Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/70 border border-violet-500/40 text-violet-300 font-mono text-xs tracking-wider uppercase mb-6 shadow-lg shadow-violet-900/20 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>INVITACIÓN OFICIAL DE GALA · EDICIÓN 2026</span>
          </div>

          {/* Subtitle / Scriptural verse */}
          <p className="italic text-slate-400 text-xs sm:text-sm font-serif max-w-md mx-auto mb-4">
            “Jehová cumplirá su propósito en mí; Tu misericordia, oh Jehová, es para siempre.” — Salmos 138:8
          </p>

          {/* Royal Monogram & Quinceañera Name */}
          <h2 className="text-sm font-cinzel tracking-[0.3em] uppercase text-amber-300/90 font-bold mb-2">
            MIS QUINCE AÑOS
          </h2>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight leading-none mb-6">
            Dannia Carolina
          </h1>

          {/* Event Quick Coordinates */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-300 mb-8">
            <span className="inline-flex items-center gap-1.5 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-white/10">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Viernes, 4 de Diciembre de 2026
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-white/10">
              <Clock className="w-4 h-4 text-amber-400" />
              18:00 Horas (Recepción)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-white/10">
              <MapPin className="w-4 h-4 text-rose-400" />
              Hotel Holiday Inn · Salón Imperial
            </span>
          </div>

          {/* Audio Player Pill Simulator */}
          <div className="mb-8">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-violet-500/30 hover:border-cyan-400/50 text-xs font-semibold text-slate-200 transition shadow-md group"
            >
              {isPlayingAudio ? (
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
              )}
              <span>{isPlayingAudio ? "Música de Bienvenida: Reproduciendo..." : "Activar Música de la Fiesta"}</span>
              <Music className="w-3.5 h-3.5 text-violet-400" />
            </button>
          </div>

          {/* Core Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg">
            <button
              onClick={() => {
                setIsPassModalOpen(true);
                confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
              }}
              className="flex-1 min-w-[200px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              <span>Ver Mi Pase Digital VIP</span>
            </button>

            <Link
              href="/admin"
              className="py-3.5 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-semibold text-sm border border-white/10 transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-violet-400" />
              <span>Ver Panel de Anfitrión (Admin)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Countdown Timer Block */}
      <section className="py-10 px-4 max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-4">
            CUENTA REGRESIVA PARA LA GRAN NOCHE
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
            {[
              { label: "DÍAS", value: timeLeft.days },
              { label: "HORAS", value: timeLeft.hours },
              { label: "MINUTOS", value: timeLeft.minutes },
              { label: "SEGUNDOS", value: timeLeft.seconds },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-slate-950/80 border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col items-center"
              >
                <span className="text-2xl sm:text-4xl font-headline font-bold text-white tabular-nums">
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-mono text-slate-400 tracking-wider mt-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive RSVP Form (Simulated) */}
      <section className="py-12 px-4 max-w-3xl mx-auto">
        <div className="bg-[#0D121F] border border-violet-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center max-w-md mx-auto mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-xs mb-2">
              CONFIRMACIÓN DE ASISTENCIA (RSVP)
            </span>
            <h2 className="text-2xl sm:text-3xl font-headline font-bold text-white">
              Confirma tu Lugar de Honor
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Prueba la confirmación de asistencia en 1 toque. Los cupos y mesas se sincronizan inmediatamente en el panel administrativo.
            </p>
          </div>

          <form onSubmit={handleRsvpSubmit} className="relative space-y-4 max-w-lg mx-auto">
            {/* Guest selector for demo */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Selecciona el invitado que confirma (Demo):
              </label>
              <select
                value={selectedGuestId}
                onChange={(e) => {
                  setSelectedGuestId(e.target.value);
                  const found = guests.find((g) => g.id === e.target.value);
                  if (found) {
                    setRsvpSeats(found.totalSeats);
                    setSelectedGuestForPass(found);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
              >
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — Asignado a {g.tableName} ({g.totalSeats} cupos)
                  </option>
                ))}
              </select>
            </div>

            {/* Seats count selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Cupos Asignados:
                </label>
                <div className="w-full bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
                  <span>{currentRsvpGuest.totalSeats} Personas</span>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Cupos a Confirmar:
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentRsvpGuest.totalSeats}
                  value={rsvpSeats}
                  onChange={(e) => setRsvpSeats(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Dedication or dietary note */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Mensaje de felicitación para Dannia (Opcional):
              </label>
              <textarea
                rows={2}
                value={rsvpNote}
                onChange={(e) => setRsvpNote(e.target.value)}
                placeholder="¡Felicidades Dannia! Cuenta con nosotros..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-700/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar Mi Asistencia</span>
            </button>

            {rsvpSubmitted && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-medium animate-fade-in">
                🎉 ¡Confirmación registrada con éxito en el sistema! Ya puedes ver tu Pase Digital actualizado.
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Dress Code & Location Highlights */}
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dress Code Card */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                CÓDIGO DE VESTIMENTA
              </span>
              <h3 className="text-xl font-headline font-bold text-white mt-1">
                {eventSettings.dressCodeTitle}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {eventSettings.dressCodeDescription}
              </p>
            </div>

            <div className="mt-5 p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00205B] border border-amber-300 flex items-center justify-center shrink-0 shadow-md" />
              <div className="text-[11px] text-slate-200">
                <strong className="text-amber-300">Color Reservado:</strong> Azul Zafiro exclusivo de la Quinceañera.
              </div>
            </div>
          </div>

          {/* Location & GPS Card */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                UBICACIÓN & ACCESO
              </span>
              <h3 className="text-xl font-headline font-bold text-white mt-1">
                {eventSettings.venueName}
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                {eventSettings.venueAddress}
              </p>
            </div>

            <div className="mt-5 flex gap-2.5">
              <a
                href={eventSettings.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Navigation className="w-4 h-4" />
                <span>Abrir en Waze</span>
              </a>

              <a
                href={eventSettings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Showcase Modules Access Bar */}
      <section className="py-8 px-4 max-w-4xl mx-auto text-center">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
          EXPLORA LOS MÓDULOS DEL ECOSISTEMA DEVFLOW
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/checkin"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Escáner de Acceso</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Control QR en 0.5s</div>
          </Link>

          <Link
            href="/admin/tables"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-400 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-950 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Plano de Mesas</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Mapeo de 35 mesas</div>
          </Link>

          <Link
            href="/live"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-violet-500/30 hover:border-violet-400 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-950 flex items-center justify-center text-violet-400 mb-2 group-hover:scale-110 transition">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Muro Social en Vivo</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pantallas gigantes LED</div>
          </Link>

          <Link
            href="/admin"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-left transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Panel Anfitrión</div>
            <div className="text-[10px] text-slate-400 mt-0.5">KPIs y métricas de gala</div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-white/5 text-center text-xs text-slate-500 max-w-4xl mx-auto px-4">
        <p className="flex items-center justify-center gap-1">
          <span>Diseñado con pasión por</span>
          <strong className="text-slate-300 font-bold">DevFlow</strong>
          <span>· www.devflow.lat</span>
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Este clon interactivo utiliza datos en memoria y no consume servicios ni base de datos de producción.
        </p>
      </footer>
    </div>
  );
}
