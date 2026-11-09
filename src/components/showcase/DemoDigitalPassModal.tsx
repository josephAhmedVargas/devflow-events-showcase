"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useDemo } from "@/context/DemoContext";
import { ShowcaseWatermark } from "./ShowcaseWatermark";
import { X, QrCode, Download, ShieldCheck, Check, Sparkles, MapPin, Users } from "lucide-react";
import confetti from "canvas-confetti";

interface DemoDigitalPassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoDigitalPassModal: React.FC<DemoDigitalPassModalProps> = ({ isOpen, onClose }) => {
  const { guests, selectedGuestForPass, setSelectedGuestForPass } = useDemo();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const guest = selectedGuestForPass || guests[0];

  useEffect(() => {
    if (guest && isOpen) {
      QRCode.toDataURL(guest.code, {
        width: 320,
        margin: 1.5,
        color: {
          dark: "#0552AC",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);
    }
  }, [guest, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-auto bg-gradient-to-b from-[#0F172A] via-[#111827] to-[#0B0F19] border border-violet-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs font-mono mb-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            PASE VIP DIGITAL INTERACTIVO
          </div>
          <h3 className="text-xl font-bold font-headline text-white">
            Credencial de Acceso Exclusiva
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Prueba cómo tus invitados visualizan y portan su acreditación digital.
          </p>
        </div>

        {/* Guest Selector Dropdown (Interactive Showcase Feature) */}
        <div className="mb-4 bg-slate-900/80 border border-white/10 p-2.5 rounded-2xl">
          <label className="block text-[11px] font-mono text-cyan-400 mb-1">
            ⚡ Seleccionar Invitado de Prueba para Generar Pase:
          </label>
          <select
            value={guest.id}
            onChange={(e) => {
              const selected = guests.find((g) => g.id === e.target.value);
              if (selected) {
                setSelectedGuestForPass(selected);
                confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
          >
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — Mesa {g.tableNumber} ({g.totalSeats} cupos) [{g.code}]
              </option>
            ))}
          </select>
        </div>

        {/* The Digital Pass Card with Watermark Protection */}
        <ShowcaseWatermark className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-b from-white via-slate-50 to-amber-50/30 text-slate-900 shadow-xl overflow-hidden">
          {/* Pass Top Banner */}
          <div className="bg-[#0552AC] text-white py-3 px-4 text-center border-b border-amber-400/30 relative">
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-300">
              PASE DIGITAL VIP · EDICIÓN GALA 2026
            </div>
            <div className="text-lg font-cinzel font-bold tracking-wide mt-0.5">
              Dannia Carolina
            </div>
            <div className="text-[11px] opacity-80">MIS XV AÑOS · HOTEL HOLIDAY INN</div>
          </div>

          {/* Pass Body */}
          <div className="p-4 sm:p-5 flex flex-col items-center text-center">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Invitado Distinguido
            </div>
            <div className="text-xl font-bold font-headline text-slate-900 mt-1">
              {guest.name}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                <Users className="w-3 h-3 text-blue-700" />
                {guest.totalSeats} Lugares Reservados
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                <MapPin className="w-3 h-3 text-amber-700" />
                Mesa {guest.tableNumber}
              </span>
            </div>

            {/* QR Code Canvas / Img */}
            <div className="my-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR ${guest.code}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <canvas ref={canvasRef} />
                </div>
              )}
              <div className="mt-2 font-mono text-xs font-black tracking-widest text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                {guest.code}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                Escaneo instantáneo en recepción
              </div>
            </div>

            {/* Table Detail Box */}
            <div className="w-full bg-blue-50/80 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-left">
              <div>
                <div className="text-[10px] font-mono uppercase text-blue-800">
                  Ubicación de Salón
                </div>
                <div className="text-xs font-bold text-slate-900">{guest.tableName}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Asiento Asignado
                </span>
              </div>
            </div>
          </div>
        </ShowcaseWatermark>

        {/* Modal Actions */}
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(guest.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <QrCode className="w-4 h-4" />}
            <span>{copied ? "¡Código Copiado!" : "Copiar Código"}</span>
          </button>

          <button
            onClick={() => {
              confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
              alert(
                `Simulación de guardado exitosa.\n\nEn la versión oficial de DevFlow, el invitado descarga su pase en alta resolución (PNG/PDF) o lo guarda en Apple Wallet / Google Wallet con 1 toque.`
              );
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>Guardar en Fotos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
