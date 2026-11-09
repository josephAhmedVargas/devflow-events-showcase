"use client";

import { useState, useEffect } from "react";
import { formatTableDisplay, cleanTableName, downloadPassImage, sharePassWhatsApp } from "@/lib/pass-utils";
import { showErrorAlert } from "@/lib/swal";

interface SearchResult {
  guestId: string;
  id?: string;
  invitationCode: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  maxSeats: number;
  confirmedSeats?: number;
  status?: string;
  isVip: boolean;
  tableNumber: number | null;
  tableName: string | null;
  tableZone: string | null;
  rsvp?: any;
}

interface TableLookupProps {
  initialGuest?: SearchResult | null;
}

export function TableLookup({ initialGuest = null }: TableLookupProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [activePass, setActivePass] = useState<SearchResult | null>(initialGuest);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (initialGuest) {
      setActivePass(initialGuest);
    }
  }, [initialGuest]);

  const selectAndFocusPass = (pass: SearchResult) => {
    setActivePass(pass);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const el = document.getElementById("active-pass-card");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/table-lookup?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      const list = data.results || [];
      setResults(list);
      if (list.length > 0) {
        selectAndFocusPass(list[0]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const maskCode = (code: string, isExactSearch: boolean) => {
    if (isExactSearch || code.length <= 4) return code;
    const parts = code.split("-");
    if (parts.length >= 3) {
      return `${parts[0]}-***-${parts[2]}`;
    }
    return `${code.slice(0, 2)}***${code.slice(-2)}`;
  };

  return (
    <div
      className="w-full bg-white rounded-3xl border border-[#0552AC]/15 shadow-2xl p-6 md:p-10 relative overflow-hidden"
      id="pase-digital-modal"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Buscador de Mesa */}
        <div className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FE] text-[#0552AC] text-xs font-semibold uppercase tracking-wider font-cinzel">
            <span className="material-symbols-outlined text-[16px]">table_restaurant</span>
            <span>Localizador de Lugares de Honor</span>
          </div>

          <h3 className="font-headline text-2xl md:text-3xl text-[#001F54] font-bold">
            Consulta tu Mesa Asignada
          </h3>

          <p className="text-xs md:text-sm text-[#4B5B76] leading-relaxed">
            Introduce el código alfanumérico indicado en tu invitación (ej.{" "}
            <span className="font-mono font-bold text-[#0552AC]">VIP-DC-001</span>) o tu apellido para conocer tu mesa en el Hotel Holiday Inn.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="flex flex-col sm:flex-row gap-2 pt-1"
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej. VIP-DC-001 o Mendoza..."
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#0552AC]/20 bg-[#F8FAFD] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0552AC] text-xs uppercase font-mono text-[#0D1829]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#0552AC] text-white hover:bg-[#001F54] font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#0552AC]/20 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? "Buscando..." : "Consultar"}
            </button>
          </form>

          {/* Quick tags con invitados reales */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
            <span className="text-slate-400 font-medium">Ejemplos rápidos:</span>
            {["VIP-DC-001", "VIP-DC-002", "DC-2026-006", "DC-2026-088"].map((exampleCode) => (
              <button
                key={exampleCode}
                type="button"
                onClick={() => {
                  setQuery(exampleCode);
                  handleSearch(exampleCode);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#E8F0FE] text-[#0552AC] hover:bg-[#0552AC] hover:text-white font-mono transition-colors font-semibold cursor-pointer"
              >
                {exampleCode}
              </button>
            ))}
          </div>

          {/* Dynamic Search Results */}
          {searched && (
            <div className="pt-2">
              {results && results.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#001F54] block">
                    Resultados Encontrados ({results.length})
                  </span>
                  {results.map((r) => {
                    const isSelected = activePass?.guestId === r.guestId;
                    const isExactMatch = query.trim().toUpperCase() === r.invitationCode.toUpperCase();
                    return (
                      <div
                        key={r.guestId}
                        onClick={() => selectAndFocusPass(r)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-[#E8F0FE] border-[#0552AC] shadow-sm ring-1 ring-[#0552AC]"
                            : "bg-white border-slate-200 hover:border-[#0552AC]/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#001F54]">
                              {r.firstName} {r.lastName}
                            </span>
                            {r.isVip && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FDF7E7] text-[#D4AF37] border border-[#D4AF37]/30 font-bold uppercase font-cinzel">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#4B5B76] font-mono">
                            Código: {maskCode(r.invitationCode, isExactMatch)} • {r.maxSeats} {r.maxSeats === 1 ? "Lugar" : "Lugares"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-cinzel text-xs font-bold text-[#0552AC] block">
                            {r.tableNumber ? `Mesa ${r.tableNumber}` : "Por asignar"}
                          </span>
                          <span className="text-[10px] text-slate-500 line-clamp-1 max-w-[140px]">
                            {cleanTableName(r.tableName)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  No se encontró ningún invitado con esos datos. Por favor verifica el código de tu pase o consulta en recepción.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Tarjeta / Widget del Pase Digital VIP */}
        <div
          id="active-pass-card"
          className="lg:col-span-6 bg-gradient-to-br from-[#001F54] via-[#0552AC] to-[#001F54] text-white p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-[#D4AF37]/40 relative overflow-hidden flex flex-col justify-between min-h-[380px]"
        >
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#D4AF37]/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37] text-[20px]">workspace_premium</span>
                <span className="text-[11px] uppercase tracking-widest font-bold font-cinzel text-[#D4AF37]">
                  Pase Digital VIP Oficial
                </span>
              </div>
              <span className="text-[10px] uppercase text-white/80 font-bold font-cinzel tracking-widest">
                D'CAROL 2026
              </span>
            </div>

            {activePass ? (
              /* Tarjeta con Invitado Activo */
              <div className="space-y-3">
                <div className="bg-white text-[#0D1829] p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex flex-col text-center sm:text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#4B5B76]">
                    Invitado de Honor
                  </span>
                  <h4 className="font-headline text-lg md:text-xl font-bold text-[#001F54]">
                    {activePass.firstName} {activePass.lastName}
                  </h4>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <span className="text-xs text-[#4B5B76] font-semibold">
                      {activePass.maxSeats} {activePass.maxSeats === 1 ? "Lugar" : "Lugares"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-cinzel font-bold text-[#0552AC]">
                      {formatTableDisplay(activePass.tableNumber, activePass.tableName)}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#0552AC] font-mono font-bold mt-2">
                    CÓDIGO: {activePass.invitationCode}
                  </span>
                </div>

                <div className="p-2 bg-[#F8FAFD] rounded-xl border border-slate-200 flex flex-col items-center shrink-0">
                  <img
                    alt="Código QR de Acceso"
                    className="w-24 h-24 object-contain"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      JSON.stringify({
                        code: activePass.invitationCode,
                        name: `${activePass.firstName} ${activePass.lastName}`,
                        seats: activePass.maxSeats,
                        table: activePass.tableNumber,
                      })
                    )}`}
                  />
                  <span className="text-[9px] uppercase tracking-wider text-[#4B5B76] font-bold mt-1 font-mono">
                    Escanear
                  </span>
                </div>
              </div>

              {/* Botones Directos de Descarga y WhatsApp en la Página Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!activePass) return;
                    setIsDownloading(true);
                    try {
                      await downloadPassImage(activePass);
                    } catch (err) {
                      console.error("Error downloading pass:", err);
                      showErrorAlert("Descarga no disponible", "No se pudo generar la imagen del pase automáticamente. Puedes tomar una captura de pantalla.");
                    } finally {
                      setIsDownloading(false);
                    }
                  }}
                  disabled={isDownloading}
                  className="py-3 px-4 rounded-xl bg-white text-[#0552AC] hover:bg-[#F8FAFD] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isDownloading ? "hourglass_top" : "download_for_offline"}
                  </span>
                  <span>{isDownloading ? "Generando..." : "Guardar en Fotos"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activePass) sharePassWhatsApp(activePass);
                  }}
                  className="py-3 px-4 rounded-xl bg-[#25D366] text-white hover:bg-[#1EBE5D] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
            ) : (
              /* Estado Inicial Elegante sin Datos Hardcodeados */
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                </div>
                <h4 className="font-headline text-lg font-bold text-white mb-1">
                  Tu Pase Personalizado
                </h4>
                <p className="text-xs text-white/70 max-w-xs leading-relaxed">
                  Ingresa tu código de invitación o apellido en el buscador para visualizar tu mesa asignada y código QR de acceso de gala.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
            <span className="italic text-[11px]">Hotel Holiday Inn Managua</span>
            <span className="font-cinzel text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
              4 Diciembre 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
