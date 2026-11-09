"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopExperienceNavProps {
  className?: string;
  variant?: "light" | "admin" | "live";
  isAdmin?: boolean;
}

export function TopExperienceNav({
  className = "",
  variant = "light",
  isAdmin = false,
}: TopExperienceNavProps) {
  const pathname = usePathname();

  // Only render for authenticated admins or inside the admin panel
  const isAuthorized = isAdmin || variant === "admin" || pathname.startsWith("/admin");
  if (!isAuthorized) {
    return null;
  }

  const navItems = [
    {
      href: "/",
      label: "Invitación",
      icon: "mark_email_read",
      active: pathname === "/",
    },
    {
      href: "/live",
      label: "En Vivo",
      icon: "live_tv",
      badge: "LIVE",
      active: pathname.startsWith("/live"),
    },
    {
      href: "/admin",
      label: "Admin",
      icon: "dashboard_customize",
      active: pathname.startsWith("/admin"),
    },
    {
      href: "/recuerdos",
      label: "Recuerdos",
      icon: "photo_library",
      active: pathname.startsWith("/recuerdos"),
    },
  ];

  return (
    <nav
      aria-label="Selector de Experiencias D'CAROL"
      className={`inline-flex items-center p-0.5 xl:p-1 rounded-full bg-slate-100/90 backdrop-blur-sm border border-slate-200/80 shadow-xs ${className}`}
    >
      {navItems.map((item) => {
        const isActive = item.active;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-1 px-1.5 xl:px-2.5 py-1 rounded-full text-[11px] xl:text-xs font-medium transition duration-200 select-none whitespace-nowrap ${
              isActive
                ? "bg-[#0552AC] text-white shadow-sm font-semibold"
                : "text-slate-600 hover:text-[#0552AC] hover:bg-white/80"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[14px] ${
                isActive ? "text-[#D4AF37]" : "text-slate-400"
              }`}
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.badge && !isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
