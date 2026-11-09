"use client";

import { useEffect, useState } from "react";
import { installDemoApi } from "./api";
import { ShowcaseDock } from "@/components/showcase/ShowcaseDock";

// Se instala al evaluar el módulo, antes de que cualquier componente haga fetch.
installDemoApi();

/**
 * Los datos viven en localStorage, que no existe en el servidor. Renderizamos
 * tras montar para que la primera pintura ya muestre el estado del visitante
 * (sin parpadeos de hidratación).
 */
export function DemoRuntime({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#F8FAFD]" aria-busy="true">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0552AC] to-[#001F54] grid place-items-center text-[#D4AF37] font-cinzel font-bold text-sm ring-4 ring-[#D4AF37]/25">
            DC
          </div>
          <span className="text-[11px] tracking-[0.18em] uppercase text-slate-500 font-semibold">
            DevFlow Events
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
            {children}
      <ShowcaseDock />
    </>
  );
}
