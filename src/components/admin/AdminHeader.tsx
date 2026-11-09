"use client";

import { useState, useEffect } from "react";
import { signOut } from "@/demo/auth";
import { TopExperienceNav } from "@/components/shared/TopExperienceNav";
import { DigitalPassModal } from "@/components/guest/DigitalPassModal";
import { confirmLogout } from "@/lib/swal";

interface AdminHeaderProps {
  eventDate?: string | Date;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onToggleSidebar?: () => void;
}

export function AdminHeader({
  user,
  onToggleSidebar,
}: AdminHeaderProps) {
  const [showPassModal, setShowPassModal] = useState<boolean>(false);

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      await signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 material-bar z-40 flex items-center justify-between px-4 sm:px-8">
        {/* Left: Hamburger + Context Title (mobile) / Experience Nav (desktop) */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#0552AC] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Abrir menú de navegación"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          )}
          {/* Title on mobile, nav on desktop */}
          <div className="lg:hidden flex flex-col min-w-0">
            <span className="font-headline font-bold text-sm text-[#001F54] leading-tight truncate">D&apos;CAROL Admin</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Panel de Control</span>
          </div>
          <div className="hidden xl:block">
            <TopExperienceNav />
          </div>
        </div>

        {/* Right: Operational Controls & User Badge */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Digital Pass Quick Trigger — icon-only on mobile */}
          <button
            type="button"
            onClick={() => setShowPassModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#0552AC] text-white hover:bg-[#001F54] transition text-xs font-semibold shadow-xs active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-[#D4AF37]" style={{ fontVariationSettings: "'FILL' 1" }}>
              qr_code_2
            </span>
            <span className="hidden sm:inline">Pase VIP</span>
          </button>

          {/* Admin User Profile & Sign Out */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0552AC] to-[#001F54] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#D4AF37]/40 shadow-xs cursor-pointer"
                title={user?.email || "admin@dcarol.events"}
              >
                {user?.name?.slice(0, 2).toUpperCase() || "DC"}
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-bold text-[#0D1829] leading-tight">
                  {user?.name || "Organizador"}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium leading-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Sesión Activa
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Digital Pass Modal */}
      {showPassModal && (
        <DigitalPassModal
          isOpen={showPassModal}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </>
  );
}
