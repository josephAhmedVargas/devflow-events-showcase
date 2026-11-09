"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/demo/auth";
import { confirmLogout } from "@/lib/swal";

interface AdminSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  totalGuests?: number;
  totalTables?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({
  user,
  totalGuests,
  totalTables,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const mainNavItems = [
    {
      href: "/admin",
      label: "Métricas & Resumen",
      icon: "dashboard",
      exact: true,
    },
    {
      href: "/admin/guests",
      label: "Invitados & RSVP",
      icon: "group",
      badge: totalGuests !== undefined ? String(totalGuests) : undefined,
    },
    {
      href: "/admin/tables",
      label: "Plano de Mesas",
      icon: "table_restaurant",
      badge: totalTables !== undefined ? `${totalTables} Mesas` : undefined,
    },
    {
      href: "/admin/checkin",
      label: "Escáner & Puerta",
      icon: "qr_code_scanner",
      badge: "En Vivo",
      badgeColor: "bg-emerald-600 text-white",
    },
    {
      href: "/admin/timeline",
      label: "Itinerario & Vals",
      icon: "schedule",
    },
    {
      href: "/admin/moderation",
      label: "Muro & Moderación",
      icon: "photo_library",
      badge: "En Vivo",
      badgeColor: "bg-[#0552AC] text-white",
    },
    {
      href: "/admin/automations",
      label: "Automatizaciones",
      icon: "bolt",
      badge: "WhatsApp",
      badgeColor: "bg-emerald-600 text-white",
    },
    {
      href: "/admin/etapas",
      label: "Álbum de Etapas",
      icon: "auto_stories",
      badge: "Planner",
      badgeColor: "bg-[#D4AF37] text-[#001F54]",
    },
  ];

  const configNavItems = [
    {
      href: "/admin/settings",
      label: "Ajustes del Evento",
      icon: "tune",
    },
  ];

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      await signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-45 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-200/80 z-50 flex flex-col pt-5 pb-10 lg:pb-8 shadow-lg lg:shadow-xs select-none transition-transform duration-500 ease-[var(--ease-spring-sheet)] ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0552AC] to-[#001F54] flex items-center justify-center text-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-xs shrink-0"
            >
              <span className="font-cinzel text-base font-bold tracking-wider">DC</span>
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="font-headline font-bold text-base text-[#0D1829] tracking-tight leading-tight truncate">
                D&apos;CAROL XV
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                Centro de Mando
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Cerrar menú"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

      {/* Main Navigation */}
      <div className="px-5 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Gestión Integral
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {mainNavItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-150 ${
                isActive
                  ? "bg-[#0552AC] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0552AC]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? "text-[#D4AF37]" : "text-slate-400"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Configuración
          </span>
        </div>

        {configNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-150 ${
                isActive
                  ? "bg-[#0552AC] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0552AC]"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isActive ? "text-[#D4AF37]" : "text-slate-400"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Authenticated User Profile & Sign Out Footer */}
      <div className="px-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0552AC] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-[#D4AF37]">
              {user?.name?.slice(0, 2).toUpperCase() || "DC"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#0D1829] truncate">
                {user?.name || "Organizador D'CAROL"}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.email || "admin@dcarol.events"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600/80 hover:text-rose-700 transition-colors cursor-pointer shrink-0"
            title="Cerrar sesión de forma segura"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>

        {/* Security Shield Badge */}
        <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-emerald-600">verified_user</span>
            <span>Sesión Encriptada</span>
          </span>
          <span className="font-mono text-[9px] text-slate-400">TLS 1.3</span>
        </div>
      </div>
    </aside>
    </>
  );
}
