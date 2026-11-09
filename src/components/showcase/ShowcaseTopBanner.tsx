"use client";

import React from "react";
import { useDemo } from "@/context/DemoContext";
import { Sparkles, RotateCcw, MessageCircle, ExternalLink } from "lucide-react";

export const ShowcaseTopBanner: React.FC = () => {
  const { resetDemo } = useDemo();

  return (
    <div className="bg-gradient-to-r from-[#07070D] via-[#121422] to-[#0A0D18] border-b border-violet-500/30 text-white px-3 sm:px-6 py-2.5 text-xs z-50 sticky top-0 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Brand & Mode Badge */}
        <div className="flex items-center gap-2.5 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 bg-violet-600/30 text-violet-300 border border-violet-500/40 font-mono px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            SHOWCASE DEMO
          </span>
          <span className="text-slate-300 font-medium">
            <strong className="text-white font-semibold">DevFlow Events OS</strong> · Portafolio Interactivo para Eventos de Gala
          </span>
          <span className="hidden md:inline-block text-slate-500">|</span>
          <span className="hidden md:inline-block text-emerald-400/90 font-mono text-[11px]">
            ● Modo In-Memory ($0 costo BD)
          </span>
        </div>

        {/* Right: Quick Actions & CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetDemo();
              if (typeof window !== "undefined") {
                // simple feedback
                alert("Los datos de demostración han sido restaurados a su estado original.");
              }
            }}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition text-[11px] hover:underline"
            title="Restaura los 12 invitados, fotos y mesas a su estado original"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reiniciar Datos</span>
          </button>

          <a
            href="https://wa.me/50588888888?text=Hola%20DevFlow,%20estoy%20probando%20la%20demo%20de%20DevFlow%20Events%20y%20quiero%20cotizar%20para%20un%20evento."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white px-3.5 py-1 rounded-full font-bold text-[11px] shadow-sm transition hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Cotizar por WhatsApp</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
};
