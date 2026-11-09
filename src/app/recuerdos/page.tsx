"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Camera, Sparkles, Send, CheckCircle2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export default function RecuerdosUploadPage() {
  const { uploadPhoto, eventSettings } = useDemo();
  const [guestName, setGuestName] = useState("");
  const [tableNumber, setTableNumber] = useState<number>(8);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to Base64 in local state ($0 server cost)
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !caption.trim()) return;

    const finalUrl =
      previewUrl ||
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

    uploadPhoto(
      guestName.trim(),
      caption.trim(),
      finalUrl,
      tableNumber
    );

    setSubmitted(true);
  };

  const handleReset = () => {
    setGuestName("");
    setCaption("");
    setPreviewUrl(null);
    setSubmitted(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 min-h-[calc(100vh-3rem)] flex flex-col justify-center">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la Invitación</span>
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E101D] border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center mx-auto text-white shadow-lg shadow-purple-600/30">
            <Camera className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Comparte tus Recuerdos
          </h1>
          <p className="text-xs text-slate-400">
            Tus fotos y dedicatorias se proyectarán en las pantallas LED del salón de gala.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">¡Foto Enviada con Éxito!</h2>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Tu recuerdo fue enviado al panel de moderación. Aparecerá en la pantalla gigante en breves instantes.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/admin/moderation"
                className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition"
              >
                Ver en Cola de Moderación (Admin)
              </Link>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition"
              >
                Subir otra foto
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Guest Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Tu Nombre o Familia:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Familia Morales"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Table Number */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Tu Mesa:
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141829] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 transition font-mono"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    Mesa {n < 10 ? `0${n}` : n} {n === 1 ? "· Mesa de Honor" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Picker */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Foto desde tu Cámara o Galería:
              </label>
              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/15 bg-black/50">
                  <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(null)}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 text-xs text-white hover:bg-black/90 font-mono"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/15 hover:border-purple-500/50 cursor-pointer transition group">
                  <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-purple-400 transition mb-2" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    Tocar para tomar foto o elegir de la galería
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG o WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Dedicatoria o Mensaje:
              </label>
              <textarea
                required
                rows={3}
                placeholder="¡Muchas felicidades en tu gran noche! Que se cumplan todos tus sueños..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={180}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
              />
              <div className="text-[10px] text-slate-500 text-right font-mono">
                {caption.length} / 180 caracteres
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:scale-[1.01] transition"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a la Gran Pantalla</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
