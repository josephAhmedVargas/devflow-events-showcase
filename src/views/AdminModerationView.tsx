"use client";

import { PhotoModerationQueue } from "@/components/admin/PhotoModerationQueue";
import { useDemoDb } from "@/demo/db";

export default function AdminModerationView() {
  const db = useDemoDb();
  const photos = db.photos;
  const messages = db.messages;
  const pendingPhotosCount = photos.filter((p) => p.moderationStatus === "pending").length;
  const approvedPhotosCount = photos.filter((p) => p.moderationStatus === "approved" || p.isFeatured).length;
  const featuredPhotosCount = photos.filter((p) => p.isFeatured).length;
  const pendingMessagesCount = messages.filter((m) => m.moderationStatus === "pending").length;
  const totalPending = pendingPhotosCount + pendingMessagesCount;

  return (
    <div className="px-6 md:px-8 py-8 flex flex-col gap-6 max-w-[1560px] mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#0D1829]">
              Curaduría Fotográfica &amp; Muro en Vivo
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide transition ${
                totalPending > 0
                  ? "bg-amber-500 text-white animate-pulse shadow-md shadow-amber-500/20"
                  : "bg-emerald-600 text-white shadow-xs"
              }`}
            >
              {totalPending > 0 ? `${totalPending} Por Revisar` : "Todo al Día"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
            <span>Filtra y aprueba fotos y dedicatorias capturadas por los 324 invitados en tiempo real.</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#0552AC] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">location_on</span>
              Hotel Holiday Inn Managua
            </span>
          </p>
        </div>

        {/* Quick Venue / System Status Indicator */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs shrink-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">
              connected_tv
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-bold text-[#0D1829]">
                Gran Pantalla LED Conectada
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              {approvedPhotosCount} fotos activas en proyector
            </span>
          </div>
        </div>
      </div>

      {/* High-Impact Metric Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pendientes de moderar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pendientes
            </span>
            <span className="font-headline text-2xl font-bold text-[#0D1829] mt-0.5">
              {pendingPhotosCount}
            </span>
            <span className="text-[10px] text-amber-600 font-medium">
              {pendingPhotosCount > 0 ? "Requieren tu aprobación" : "Sin fotos en espera"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
          </div>
        </div>

        {/* Card 2: En Pantalla LED */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              En Pantalla LED
            </span>
            <span className="font-headline text-2xl font-bold text-[#0552AC] mt-0.5">
              {approvedPhotosCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              Rotación en tiempo real
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#0552AC] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">connected_tv</span>
          </div>
        </div>

        {/* Card 3: Fotos VIP Destacadas */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Álbum VIP
            </span>
            <span className="font-headline text-2xl font-bold text-[#D4AF37] mt-0.5">
              {featuredPhotosCount}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Con marco dorado de gala
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4AF37] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">star</span>
          </div>
        </div>

        {/* Card 4: Dedicatorias en Libro de Oro */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Libro de Oro
            </span>
            <span className="font-headline text-2xl font-bold text-slate-800 mt-0.5">
              {messages.length}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {pendingMessagesCount > 0 ? `${pendingMessagesCount} por verificar` : "Todas aprobadas"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
          </div>
        </div>
      </div>

      {/* Main Moderation Queue Component */}
      <PhotoModerationQueue />
    </div>
  );
}
