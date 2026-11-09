"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  QrCode,
  LayoutDashboard,
  Users,
  Grid3X3,
  Image as ImageIcon,
  Tv,
  ArrowUpRight,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { eventSettings, guests, photos } = useDemo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingPhotosCount = photos.filter((p) => p.status === "PENDING").length;
  const checkedInCount = guests.filter((g) => g.checkedIn).length;

  const navItems = [
    {
      name: "Dashboard & Métricas",
      href: "/admin",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Escáner en Puerta (QR)",
      href: "/admin/checkin",
      icon: QrCode,
      badge: `${checkedInCount} adentro`,
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      name: "Plano de Mesas (35)",
      href: "/admin/tables",
      icon: Grid3X3,
      badge: "35 mesas",
    },
    {
      name: "Moderación de Fotos",
      href: "/admin/moderation",
      icon: ImageIcon,
      badge: pendingPhotosCount > 0 ? `${pendingPhotosCount} pendientes` : null,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#080911] text-slate-100">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0D0E1A] border-b border-white/10 sticky top-12 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
            DF
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">DEVFLOW EVENTS</div>
            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{eventSettings.title}</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-12 left-0 z-40 md:z-10 w-64 md:w-72 h-[calc(100vh-3rem)] bg-[#0A0C16] border-r border-white/10 p-5 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Event Title */}
          <div className="hidden md:flex items-center gap-3 pb-5 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-600/30 font-black text-white text-sm">
              DF
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                DEVFLOW EVENTS
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  DEMO
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[160px]">{eventSettings.title}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
              Control de Evento
            </div>
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-purple-600/20 to-cyan-600/10 text-white border border-purple-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-purple-400" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        item.badgeColor || "bg-white/10 text-slate-300 border-white/10"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick External Views */}
          <div className="pt-4 border-t border-white/10 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
              Vistas en Pantalla
            </div>
            <Link
              href="/live"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition"
            >
              <div className="flex items-center gap-2.5">
                <Tv className="w-4 h-4 text-purple-400" />
                <span>Pantalla Gigante LED</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Invitación de Invitado</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
            <Link
              href="/recuerdos"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition"
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Subir Fotos (Móvil)</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* System & Anti-theft info card */}
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Modo Portafolio Activo</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Datos simulados en memoria sin costo de base de datos ni credenciales activas.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-[calc(100vh-3rem)]">
        {children}
      </main>
    </div>
  );
}
