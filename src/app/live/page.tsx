"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Heart, Camera, QrCode, Maximize2, ArrowLeft } from "lucide-react";
import { useDemo } from "@/context/DemoContext";
import QRCode from "qrcode";

export default function LiveSocialWallPage() {
  const { photos, eventSettings } = useDemo();
  const approvedPhotos = photos.filter((p) => p.status === "APPROVED");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qrUrl, setQrUrl] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Live rotating carousel every 6 seconds
  useEffect(() => {
    if (approvedPhotos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % approvedPhotos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [approvedPhotos.length]);

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    update();
    const clockInterval = setInterval(update, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Generate QR for uploading photos
  useEffect(() => {
    QRCode.toDataURL("https://devflow.lat/demo-events/recuerdos", {
      margin: 1,
      width: 240,
      color: { dark: "#0A0B14", light: "#FFFFFF" },
    }).then(setQrUrl);
  }, []);

  const activePhoto = approvedPhotos[currentIndex] || approvedPhotos[0];

  return (
    <div className="relative min-h-[calc(100vh-3rem)] bg-[#05060A] text-white flex flex-col justify-between p-6 md:p-12 overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar for Venue LED Screens */}
      <header className="relative z-10 flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-purple-600/40">
            DF
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase flex items-center gap-2">
              <span>DEVFLOW EVENTS</span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                TRANSMISIÓN EN VIVO
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {eventSettings.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono text-slate-400 uppercase">Hora en Salón</div>
            <div className="text-2xl font-black text-cyan-400 font-mono tracking-wider">
              {currentTime || "20:00:00"}
            </div>
          </div>
          <Link
            href="/admin"
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
            title="Volver al Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Center Stage: Live Photo Spotlight */}
      <main className="relative z-10 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full">
        {/* Big Spotlight Photo Card */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {activePhoto ? (
            <div className="w-full max-w-2xl rounded-3xl bg-[#0D0F1E] border border-white/15 p-4 md:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative overflow-hidden group">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/60">
                <img
                  src={activePhoto.imageUrl}
                  alt={activePhoto.author}
                  className="w-full h-full object-cover transition-opacity duration-700"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs font-mono text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Mesa {(activePhoto.tableNumber ?? 1) < 10 ? `0${activePhoto.tableNumber ?? 1}` : activePhoto.tableNumber}</span>
                </div>
              </div>

              {/* Caption & Dedication */}
              <div className="mt-5 space-y-2 text-center">
                <p className="text-lg md:text-xl font-bold text-white italic">
                  "{activePhoto.message}"
                </p>
                <div className="text-sm font-semibold text-purple-300">
                  — {activePhoto.author}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 text-center text-slate-400 space-y-3">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-base font-bold text-white">Esperando las primeras fotos del salón</div>
              <div className="text-xs text-slate-400 max-w-sm mx-auto">
                Los invitados pueden escanear el código QR para compartir sus recuerdos en vivo.
              </div>
            </div>
          )}
        </div>

        {/* Right: QR Code for Guests */}
        <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-3xl bg-[#0D0F1E] border border-white/10 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Camera className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-black text-white">¿Estás en la fiesta?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Escanea con la cámara de tu teléfono para subir tus selfies y felicitaciones en vivo a esta pantalla.
            </p>
          </div>

          {/* QR Container */}
          <div className="p-3 bg-white rounded-2xl shadow-lg">
            {qrUrl ? (
              <img src={qrUrl} alt="Escanea para subir fotos" className="w-44 h-44 rounded-lg" />
            ) : (
              <div className="w-44 h-44 bg-slate-200 animate-pulse rounded-lg" />
            )}
          </div>

          <div className="text-[11px] font-mono text-purple-300 font-semibold uppercase tracking-wider">
            Sin apps que instalar • En 1 toque
          </div>
        </div>
      </main>

      {/* Bottom Footer Ribbon */}
      <footer className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Experiencia Audiovisual Interactiva por <strong>DevFlow</strong></span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>{approvedPhotos.length} fotos proyectadas</span>
          <span>•</span>
          <span>Modo Pantalla Gigante Activo</span>
        </div>
      </footer>
    </div>
  );
}
