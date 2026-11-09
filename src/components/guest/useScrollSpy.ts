"use client";

import { useState, useEffect } from "react";

/**
 * Hook para detección en tiempo real de la sección activa mediante scroll
 * Optimizado con requestAnimationFrame y passive listeners para 60fps
 */
export function useScrollSpy(sectionIds: string[], offset: number = 200): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] || "inicio");

  useEffect(() => {
    let ticking = false;

    const checkActiveSection = () => {
      const scrollY = window.scrollY;

      // 1. Si está muy cerca de la parte superior, activar siempre 'inicio'
      if (scrollY < 120) {
        setActiveId(sectionIds[0]);
        return;
      }

      // 2. Si está al final de la página (pie de página), activar la última sección
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (windowHeight + scrollY >= documentHeight - 100) {
        setActiveId(sectionIds[sectionIds.length - 1]);
        return;
      }

      // 3. Recorrer las secciones de arriba a abajo y activar la que esté visible bajo el header
      let currentId = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset) {
            currentId = id;
          }
        }
      }

      setActiveId(currentId);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Verificación inicial al montar
    checkActiveSection();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds, offset]);

  return activeId;
}
