"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { formatTableDisplay, downloadPassImage, sharePassWhatsApp } from "@/lib/pass-utils";
import { showErrorAlert } from "@/lib/swal";

interface DigitalPassProps {
  initialCode?: string;
  initialGuest?: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DigitalPassModal({
  initialCode = "",
  initialGuest = null,
  isOpen: externalIsOpen,
  onClose,
}: DigitalPassProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    setInternalIsOpen(false);
    onClose?.();
  };

  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState(initialCode || (initialGuest ? initialGuest.invitationCode : "VIP-DC-001"));
  const [passData, setPassData] = useState<any>(initialGuest || null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialGuest) {
      setPassData(initialGuest);
      setCode(initialGuest.invitationCode);
    } else if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode, initialGuest]);

  const fetchPass = async (searchCode: string) => {
    const clean = searchCode.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/table-lookup?q=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setPassData(data.results[0]);
      } else {
        setPassData(null);
      }
    } catch {
      setPassData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
    if (!passData) {
      fetchPass(code);
    }
  };

  useEffect(() => {
    if (isOpen && !passData && code) {
      fetchPass(code);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Fuera de la Caja: Descargar pase como imagen HD para acceso offline
  const handleDownloadImage = async () => {
    if (!passData) return;
    setIsDownloading(true);
    try {
      await downloadPassImage(passData);
    } catch (err) {
      console.error("Error downloading pass:", err);
      showErrorAlert("Descarga no disponible", "No se pudo generar la imagen del pase automáticamente. Puedes tomar una captura de pantalla de esta vista.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    if (!passData) return;
    sharePassWhatsApp(passData);
  };

  const scrollToTable = () => {
    handleClose();
    const el = document.getElementById("pase-digital-modal");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {externalIsOpen === undefined && (
        <button
          onClick={handleOpen}
          type="button"
          aria-label="Abrir Mi Pase Digital"
          className="flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 rounded-full bg-[#0552AC] text-white hover:bg-[#001F54] shadow-md shadow-[#0552AC]/20 transition font-semibold text-[11px] xl:text-xs tracking-wider uppercase cursor-pointer active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
          <span className="hidden sm:inline">Mi Pase</span>
        </button>
      )}

      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="relative w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl border-2 border-[#D4AF37]/50 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Royal del Modal */}
            <div className="bg-gradient-to-r from-[#001F54] via-[#0552AC] to-[#001F54] p-5 text-white text-center relative border-b border-[#D4AF37]/30 shrink-0">
              <button
                onClick={handleClose}
                type="button"
                className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Cerrar"
              >
                ✕
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] font-cinzel text-[10px] uppercase font-bold tracking-widest mb-1.5">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                <span>Pase Digital VIP • D'CAROL 2026</span>
              </div>
              <h3 className="font-headline text-2xl font-bold tracking-tight">
                Dannia Carolina
              </h3>
              <p className="font-cinzel text-xs text-[#D4AF37] tracking-widest uppercase">
                Hotel Holiday Inn • 4 Dic 2026
              </p>
            </div>

            {/* Selector / Buscador Rápido de Código */}
            <div className="p-4 bg-[#F8FAFD] border-b border-slate-100 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchPass(code);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Código (ej: VIP-DC-001)"
                    className="w-full pl-8 pr-3 py-2 text-xs uppercase font-mono tracking-wider rounded-xl border border-[#0552AC]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {loading ? "..." : "Cargar"}
                </button>
              </form>

              {/* Quick tags reales */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-[10px]">
                <span className="text-slate-400 font-medium">Ejemplos:</span>
                {["VIP-DC-001", "VIP-DC-002", "DC-2026-006", "DC-2026-088"].map((demoCode) => (
                  <button
                    key={demoCode}
                    type="button"
                    onClick={() => {
                      setCode(demoCode);
                      fetchPass(demoCode);
                    }}
                    className={`px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                      code === demoCode
                        ? "bg-[#0552AC] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-[#0552AC]"
                    }`}
                  >
                    {demoCode}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido Desplazable del Pase */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {passData ? (
                <div className="space-y-4">
                  {/* Tarjeta de Invitado de Honor */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#FCFDFE] to-[#F8FAFD] border-2 border-[#0552AC]/20 text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className="material-symbols-outlined text-[#D4AF37] text-2xl opacity-60">
                        stars
                      </span>
                    </div>

                    <span className="text-[10px] uppercase tracking-widest text-[#4B5B76] block font-semibold">
                      Invitado Distinguido
                    </span>
                    <h4 className="font-headline text-2xl text-[#001F54] font-bold mt-0.5">
                      {passData.firstName} {passData.lastName}
                    </h4>

                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="px-3 py-0.5 rounded-full bg-[#E8F0FE] text-[#0552AC] font-semibold text-xs border border-[#0552AC]/20">
                        {passData.maxSeats} {passData.maxSeats === 1 ? "Lugar Reservado" : "Lugares Reservados"}
                      </span>
                      {passData.isVip && (
                        <span className="px-3 py-0.5 rounded-full bg-[#FDF7E7] text-[#D4AF37] border border-[#D4AF37]/50 font-bold uppercase text-[10px] font-cinzel">
                          Mesa de Honor VIP
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QR Code Style Ticket */}
                  <div className="p-5 rounded-2xl bg-white border-2 border-dashed border-[#0552AC]/30 shadow-inner flex flex-col items-center justify-center text-center relative bg-[radial-gradient(#0552AC_1px,transparent_1px)] [background-size:16px_16px] [background-position:0_0]">
                    <div className="w-36 h-36 p-2 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center mb-2">
                      <img
                        alt="QR Pase VIP"
                        className="w-full h-full object-contain"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          JSON.stringify({
                            code: passData.invitationCode,
                            name: `${passData.firstName} ${passData.lastName}`,
                            seats: passData.maxSeats,
                            table: passData.tableNumber,
                          })
                        )}`}
                      />
                    </div>
                    <span className="font-mono text-sm font-bold text-[#001F54] tracking-widest">
                      {passData.invitationCode}
                    </span>
                    <span className="text-[10px] text-[#4B5B76] uppercase tracking-wider mt-0.5">
                      Escanear en Puerta • Hotel Holiday Inn
                    </span>
                  </div>

                  {/* Ubicación de Mesa Asignada */}
                  <div className="p-4 rounded-2xl bg-[#E8F0FE] border border-[#0552AC]/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0552AC] text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">table_restaurant</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#4B5B76] tracking-wider block">
                          Mesa Reservada
                        </span>
                        <span className="font-cinzel text-sm font-bold text-[#001F54]">
                          {formatTableDisplay(passData.tableNumber, passData.tableName)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={scrollToTable}
                      className="px-2.5 py-1 rounded-lg bg-white text-[#0552AC] font-cinzel text-xs font-bold border border-[#0552AC]/20 uppercase hover:bg-[#0552AC] hover:text-white transition-colors cursor-pointer"
                      title="Ver en el plano de mesas"
                    >
                      Ver en Plano
                    </button>
                  </div>

                  {/* Acciones de Valor: Descargar Imagen Offline & Compartir por WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      disabled={isDownloading}
                      className="py-3 px-3 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-[#0552AC]/20 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {isDownloading ? "hourglass_top" : "download_for_offline"}
                      </span>
                      <span>{isDownloading ? "Generando..." : "Guardar en Fotos"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="py-3 px-3 rounded-xl bg-[#25D366] text-white hover:bg-[#1EBE5D] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-[#25D366]/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">share</span>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ) : searched ? (
                <div className="p-6 text-center bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-2">
                  <span className="material-symbols-outlined text-amber-600 text-3xl">badge</span>
                  <p className="text-xs font-semibold">
                    No encontramos un pase con el código <span className="font-mono font-bold">{code}</span>.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Por favor verifica tu código de invitación o pulsa uno de los ejemplos rápidos arriba.
                  </p>
                </div>
              ) : null}

              <p className="text-[10px] text-center text-[#4B5B76] leading-relaxed pt-1">
                📍 Hotel Holiday Inn Managua. Presenta este pase en tu móvil al llegar al evento.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
