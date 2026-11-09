"use client";

import React, { useState } from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";

export const ShowcaseFloatingCTA: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-fade-in">
      <div className="relative group bg-[#0A0D18]/95 border border-violet-500/40 hover:border-cyan-400/60 p-3.5 pr-9 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-violet-500/20 max-w-xs sm:max-w-sm">
        {/* Dismiss Button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 p-1"
          title="Cerrar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>¿Organizas un evento de gala?</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Lleva pases QR, muro social y plano digital a tu fiesta con DevFlow.
            </p>
            <a
              href="https://wa.me/50588888888?text=Hola,%20vi%20la%20demo%20interactiva%20de%20DevFlow%20Events%20y%20me%20gustar%C3%ADa%20cotizar%20para%20un%20evento."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition group-hover:translate-x-0.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Solicitar Cotización por WhatsApp →</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
