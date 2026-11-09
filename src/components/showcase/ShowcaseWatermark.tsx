import React from "react";

export const ShowcaseWatermark: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      {/* Subtle Anti-Theft Watermark Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden opacity-[0.07] select-none"
        aria-hidden="true"
      >
        <div className="rotate-[-25deg] transform whitespace-nowrap text-center text-xs sm:text-sm font-black tracking-widest text-slate-900 uppercase">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="my-6">
              MUESTRA DE PORTAFOLIO DEVFLOW · NO VÁLIDO PARA ACCESO REAL · WWW.DEVFLOW.LAT
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
