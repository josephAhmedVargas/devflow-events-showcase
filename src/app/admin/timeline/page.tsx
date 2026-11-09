import { Metadata } from "next";
import { LiveTimelineStepper } from "@/components/admin/LiveTimelineStepper";

export const metadata: Metadata = {
  title: "Itinerario & Protocolo del Vals | D'CAROL XV",
  description: "Control y sincronización en tiempo real del cronograma solemne y vals de gala.",
};

export default function AdminTimelinePage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8 max-w-[1560px] mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-bold text-[#0D1829]">
              Itinerario &amp; Protocolo en Tiempo Real
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0552AC] text-white text-[11px] font-bold">
              En Curso: Vals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controla las etapas de la ceremonia, entradas, brindis y sincronización con las pantallas del salón
          </p>
        </div>

        {/* Schedule Delay Health KPI 23 */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">
              alarm_on
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Puntualidad de Agenda (KPI 23)
            </span>
            <span className="text-xs font-bold text-emerald-700">
              0 min de retraso • En hora exacta
            </span>
          </div>
        </div>
      </div>

      {/* Live Timeline Component */}
      <div className="max-w-4xl">
        <LiveTimelineStepper />
      </div>
    </div>
  );
}
