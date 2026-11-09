"use client";

import React from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Check,
  X,
  Tv,
  ArrowLeft,
  Sparkles,
  Heart,
  Clock,
  Eye,
} from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export default function AdminModerationPage() {
  const { photos, updatePhotoStatus } = useDemo();

  const pendingPhotos = photos.filter((p) => p.status === "PENDING");
  const approvedPhotos = photos.filter((p) => p.status === "APPROVED");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-purple-400" />
            <span>Panel de Moderación · Muro Social en Vivo</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Filtra y aprueba las fotos y dedicatorias de los invitados antes de proyectarse en las pantallas LED.
          </p>
        </div>

        <Link
          href="/live"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-semibold text-xs hover:bg-purple-600/30 transition self-start sm:self-auto"
        >
          <Tv className="w-4 h-4" />
          <span>Ver Muro en Pantalla Gigante</span>
        </Link>
      </div>

      {/* Pending Photos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Cola de Revisión</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingPhotos.length} pendientes
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            Las fotos aprobadas se transmiten inmediatamente a la proyección.
          </span>
        </div>

        {pendingPhotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingPhotos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-3xl bg-[#0D0F1C] border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-purple-500/40 transition"
              >
                <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt={photo.author}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-200">
                    Mesa {(photo.tableNumber ?? 1) < 10 ? `0${photo.tableNumber ?? 1}` : photo.tableNumber}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs font-bold text-white">{photo.author}</div>
                    <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">
                      "{photo.message}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={() => updatePhotoStatus(photo.id, "APPROVED")}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar</span>
                    </button>
                    <button
                      onClick={() => updatePhotoStatus(photo.id, "REJECTED")}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-600/20 border border-white/10 text-slate-400 hover:text-rose-300 text-xs transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 text-center text-slate-400 space-y-2">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-200">Cola de moderación al día</div>
            <div className="text-xs text-slate-400">
              Todas las fotos recibidas han sido revisadas. Puedes subir más desde la vista de invitado.
            </div>
            <div className="pt-2">
              <Link
                href="/recuerdos"
                target="_blank"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 text-xs text-white hover:bg-white/15 transition"
              >
                <span>Subir foto de prueba</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Approved Photos Gallery */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Fotos Actualmente Proyectadas en Pantalla LED</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {approvedPhotos.length} en vivo
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {approvedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="rounded-2xl bg-[#0D0F1C] border border-white/10 overflow-hidden relative group"
            >
              <div className="aspect-square">
                <img
                  src={photo.imageUrl}
                  alt={photo.author}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2 text-[11px] truncate text-slate-300 font-medium">
                {photo.author}
              </div>
              <button
                onClick={() => updatePhotoStatus(photo.id, "REJECTED")}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                title="Quitar de la pantalla"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
