"use client";

import { useScrollSpy } from "./useScrollSpy";

interface MobileBottomNavProps {
  onOpenPass?: () => void;
}

const SECTION_IDS = [
  "inicio",
  "itinerario-section",
  "etapas-section",
  "historia-section",
  "carta-section",
  "etiqueta-section",
  "rsvp-section",
  "deseos-section",
];

export function MobileBottomNav({ onOpenPass }: MobileBottomNavProps) {
  const activeSectionId = useScrollSpy(SECTION_IDS, 180);

  const navItems = [
    { id: "inicio", label: "Inicio", icon: "home", href: "#inicio" },
    { id: "itinerario", label: "Evento", icon: "calendar_month", href: "#itinerario-section" },
    { id: "historia", label: "Historia", icon: "auto_stories", href: "#historia-section" },
    { id: "rsvp", label: "RSVP", icon: "how_to_reg", href: "#rsvp-section" },
  ];

  const getActiveNavId = (sectionId: string) => {
    if (sectionId === "inicio") return "inicio";
    if (sectionId === "itinerario-section") return "itinerario";
    if (sectionId === "etapas-section" || sectionId === "historia-section" || sectionId === "carta-section") return "historia";
    if (
      sectionId === "rsvp-section" ||
      sectionId === "deseos-section" ||
      sectionId === "etiqueta-section"
    )
      return "rsvp";
    return "inicio";
  };

  const currentActiveId = getActiveNavId(activeSectionId);

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const yOffset = -72;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleOpenPass = () => {
    if (onOpenPass) {
      onOpenPass();
      return;
    }
    const passBtns = document.querySelectorAll("button");
    for (const btn of passBtns) {
      if (btn.closest("nav[aria-label='Navegación Móvil Rápida']")) continue;
      const aria = btn.getAttribute("aria-label") || "";
      const text = btn.textContent || "";
      if (aria.includes("Pase Digital") || text.includes("Mi Pase")) {
        // Trigger click on the modal opening button
        (btn as HTMLButtonElement).click();
        return;
      }
    }
    const element = document.querySelector("#pase-digital-modal, #itinerario-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Split items: 2 left, FAB center, 2 right
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <nav
      aria-label="Navegación Móvil Rápida"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Backdrop blur bar */}
      <div className="relative material-dock">
        <div className="max-w-md mx-auto flex items-end justify-around px-2 pt-2 pb-2">

          {/* Left items */}
          {leftItems.map((item) => {
            const isActive = currentActiveId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[52px] rounded-xl transition duration-200 select-none cursor-pointer active:scale-95 ${
                  isActive ? "text-[#0552AC]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition duration-200 ${
                    isActive ? "bg-[#E8F0FE]" : ""
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                </div>
                <span
                  className={`text-[10px] tracking-tight mt-0.5 leading-tight font-medium ${
                    isActive ? "text-[#0552AC] font-semibold" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Center FAB — Mi Pase Digital */}
          <div className="flex flex-col items-center justify-end pb-0.5 mx-1">
            <button
              type="button"
              onClick={handleOpenPass}
              aria-label="Abrir Mi Pase Digital"
              className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0552AC] to-[#001F54] text-[#D4AF37] shadow-lg shadow-[#0552AC]/30 ring-4 ring-white transition duration-200 active:scale-95 hover:shadow-[#0552AC]/40 hover:shadow-xl"
            >
              <span
                className="material-symbols-outlined text-[26px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                qr_code_2
              </span>
              <span className="sr-only">Mi Pase</span>
              {/* Pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37] ring-2 ring-white" />
              </span>
            </button>
            <span className="text-[10px] font-bold text-[#0552AC] mt-1.5 leading-tight tracking-tight">
              Mi Pase
            </span>
          </div>

          {/* Right items */}
          {rightItems.map((item) => {
            const isActive = currentActiveId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[52px] rounded-xl transition duration-200 select-none cursor-pointer active:scale-95 ${
                  isActive ? "text-[#0552AC]" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition duration-200 ${
                    isActive ? "bg-[#E8F0FE]" : ""
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {item.id === "rsvp" && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-tight mt-0.5 leading-tight font-medium ${
                    isActive ? "text-[#0552AC] font-semibold" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
