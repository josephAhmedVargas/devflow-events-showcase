"use client";

import { useScrollSpy } from "./useScrollSpy";

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "inicio", label: "Inicio", href: "#inicio" },
  { id: "itinerario-section", label: "Itinerario", href: "#itinerario-section" },
  { id: "historia-section", label: "Historia", href: "#historia-section" },
  { id: "carta-section", label: "Carta", href: "#carta-section" },
  { id: "etiqueta-section", label: "Etiqueta", href: "#etiqueta-section" },
  { id: "rsvp-section", label: "RSVP", href: "#rsvp-section" },
  { id: "deseos-section", label: "Deseos", href: "#deseos-section" },
];

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

export function PublicDesktopNav() {
  const activeId = useScrollSpy(SECTION_IDS, 180);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Compensación por el header fijo de 80px
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", href);
      }
    }
  };

  return (
    <nav
      aria-label="Navegación de Secciones"
      className="hidden lg:flex items-center p-0.5 xl:p-1 bg-[#FCFDFE] border border-[#0552AC]/15 rounded-full shadow-xs select-none"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.href)}
            className={`px-2 xl:px-3 py-1 xl:py-1.5 rounded-full transition duration-200 cursor-pointer whitespace-nowrap text-[11px] xl:text-xs ${
              isActive
                ? "bg-[#0552AC] text-white shadow-sm font-semibold"
                : "text-[#4B5B76] hover:text-[#0552AC] hover:bg-[#E8F0FE]/60 font-medium"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
