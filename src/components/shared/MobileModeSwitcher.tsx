"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MODES = [
  {
    href: "/",
    label: "Invitación",
    icon: "mark_email_read",
    matchFn: (p: string) => p === "/",
  },
  {
    href: "/live",
    label: "Evento en Vivo",
    icon: "live_tv",
    badge: true,
    matchFn: (p: string) => p.startsWith("/live"),
  },
  {
    href: "/recuerdos",
    label: "Recuerdos",
    icon: "photo_library",
    matchFn: (p: string) => p.startsWith("/recuerdos"),
  },
  {
    href: "/admin",
    label: "Admin",
    icon: "dashboard_customize",
    matchFn: (p: string) => p.startsWith("/admin"),
  },
];

interface MobileModeSwitcherProps {
  /** Tailwind top-* class to position below the page header. Defaults to "top-16" (64px). */
  topOffset?: string;
  isAdmin?: boolean;
}

export function MobileModeSwitcher({ topOffset = "top-16", isAdmin = false }: MobileModeSwitcherProps) {
  const pathname = usePathname();

  // Only render on mobile if user is authenticated admin or in admin panel
  const isAuthorized = isAdmin || pathname.startsWith("/admin");
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={`md:hidden fixed ${topOffset} left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/70`}>
      <div className="flex items-center overflow-x-auto px-3 py-1.5 gap-1.5 scrollbar-none">
        {MODES.map((mode) => {
          const isActive = mode.matchFn(pathname);
          return (
            <Link
              key={mode.href}
              href={mode.href}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition duration-150 whitespace-nowrap shrink-0 select-none ${
                isActive
                  ? "bg-[#0552AC] text-white font-semibold shadow-sm"
                  : "text-[#4B5B76] hover:text-[#0552AC] hover:bg-[#E8F0FE]/60"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isActive ? "text-[#D4AF37]" : "text-slate-400"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {mode.icon}
              </span>
              <span>{mode.label}</span>
              {mode.badge && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
