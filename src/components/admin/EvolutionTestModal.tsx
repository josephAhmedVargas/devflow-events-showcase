"use client";

import { useState } from "react";
import { parsePhoneNumber } from "@/lib/phone-utils";
import { showToast, showErrorAlert } from "@/lib/swal";
import { sanitizeTemplateText } from "@/lib/invitation-template";

interface GuestOption {
  guestId: string;
  guestName: string;
  invitationCode: string;
  seats: number;
  tableInfo: string;
  phone?: string | null;
}

interface EvolutionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: Array<{ id?: string; name: string; actionConfig?: any }>;
  selectedRuleId: string;
  guests: GuestOption[];
  instanceName: string;
}

export function EvolutionTestModal({
  isOpen,
  onClose,
  rules,
  selectedRuleId,
  guests,
  instanceName,
}: EvolutionTestModalProps) {
  const [testPhone, setTestPhone] = useState("");
  const [selectedRule, setSelectedRule] = useState(selectedRuleId || (rules[0]?.id ?? ""));
  const [selectedGuestId, setSelectedGuestId] = useState<string>(guests[0]?.guestId || "");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  if (!isOpen) return null;

  const currentRule = rules.find((r) => r.id === selectedRule) || rules[0];
  const templateText = sanitizeTemplateText(currentRule?.actionConfig?.template);

  const chosenGuest = guests.find((g) => g.guestId === selectedGuestId) || guests[0] || {
    guestName: "Familia Mendoza Navarro",
    invitationCode: "VIP-DC-001",
    seats: 4,
    tableInfo: "Mesa 1 — Mesa de Honor",
  };

  // Preview message
  const origin = typeof window !== "undefined" ? window.location.origin : "https://dcarol.events";
  const previewMessage = templateText
    .replace(/{{guest_name}}/g, chosenGuest.guestName)
    .replace(/{{first_name}}/g, chosenGuest.guestName.split(" ")[0])
    .replace(/{{seats}}/g, String(chosenGuest.seats))
    .replace(/{{code}}/g, chosenGuest.invitationCode)
    .replace(/{{table_info}}/g, chosenGuest.tableInfo)
    .replace(/{{magic_link}}/g, `${origin}/?code=${encodeURIComponent(chosenGuest.invitationCode)}`)
    .replace(/{{pass_link}}/g, `${origin}/?code=${encodeURIComponent(chosenGuest.invitationCode)}#pase-digital-modal`)
    .replace(/{{recuerdos_link}}/g, `${origin}/recuerdos`);

  const parsed = parsePhoneNumber(testPhone);

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      showErrorAlert("Número Requerido", "Por favor ingresa un número de teléfono de prueba.");
      return;
    }

    if (!parsed.isValid) {
      showErrorAlert(
        "Formato Inválido",
        "Por favor ingresa un número con código de país (ej. +505 8429 8767 o 50584298767)."
      );
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/admin/automations/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testPhone: parsed.cleanDigits,
          message: templateText,
          instanceName,
          guestId: chosenGuest?.guestId,
          rawGuestData: {
            name: chosenGuest.guestName,
            seats: chosenGuest.seats,
            code: chosenGuest.invitationCode,
            tableInfo: chosenGuest.tableInfo,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object" && data.error !== null
            ? data.error.exists === false
              ? `El número (${data.error.number || parsed.formattedDisplay || testPhone}) no está registrado en WhatsApp.`
              : JSON.stringify(data.error)
            : "Fallo en el servicio Evolution API";
        throw new Error(errorMsg);
      }

      setLastResult({
        success: true,
        message: data.message,
        messageId: data.messageId,
        phone: data.phone,
        data: data.evolutionData,
      });

      showToast(`¡Mensaje de prueba enviado a ${data.phone}!`, "success");
    } catch (err: any) {
      const errMsg = typeof err?.message === "string" ? err.message : JSON.stringify(err);
      setLastResult({
        success: false,
        error: errMsg,
      });
      showErrorAlert("Error al Enviar Prueba", errMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full p-6 md:p-8 flex flex-col gap-5 my-8 relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">send_to_mobile</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0552AC] font-cinzel">
                Laboratorio de Pruebas WhatsApp
              </span>
              <h3 className="text-lg font-bold text-[#0D1829] font-sans">
                Prueba de Envío en Vivo (Evolution API)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-xs">
          {/* 1. Teléfono de prueba */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Teléfono de Prueba (WhatsApp donde deseas recibirlo):
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Ej: +505 8429 8767 o 50584298767"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#0552AC] bg-white"
                />
              </div>
              {parsed.hasPhone && (
                <span
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1.5 ${
                    parsed.isValid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <span>{parsed.countryFlag}</span>
                  <span>{parsed.formattedDisplay}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Puedes ingresar tu propio número de WhatsApp para comprobar cómo se ve el mensaje real.
            </p>
          </div>

          {/* 2. Regla / Plantilla */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Plantilla de Mensaje:
              </label>
              <select
                value={selectedRule}
                onChange={(e) => setSelectedRule(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50"
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Simular con Datos de:
              </label>
              <select
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50"
              >
                {guests.slice(0, 30).map((g) => (
                  <option key={g.guestId} value={g.guestId}>
                    {g.guestName} ({g.seats} pases • {g.tableInfo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Vista Previa Mensaje (Burbuja WhatsApp) */}
          <div>
            <label className="font-bold text-slate-700 flex items-center justify-between mb-1.5">
              <span>Vista Previa del Mensaje Renderizado:</span>
              <span className="text-[10px] text-[#25D366] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
                Formato WhatsApp con Enlace Mágico
              </span>
            </label>
            <div className="p-3.5 rounded-2xl bg-[#ECE5DD] border border-[#25D366]/30 max-h-48 overflow-y-auto">
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-xs text-slate-800 font-sans text-xs whitespace-pre-wrap leading-relaxed border border-slate-200/60">
                {previewMessage}
              </div>
            </div>
          </div>

          {/* Feedback del último resultado */}
          {lastResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                lastResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                {lastResult.success ? "check_circle" : "error"}
              </span>
              <div>
                <strong className="block">
                  {lastResult.success
                    ? "¡Envío Exitoso a Evolution API!"
                    : "No se pudo entregar el mensaje"}
                </strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  {lastResult.success
                    ? `Mensaje ID: ${lastResult.messageId} • Destino: ${lastResult.phone}`
                    : typeof lastResult.error === "string"
                    ? lastResult.error
                    : JSON.stringify(lastResult.error)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <button
            onClick={handleSendTest}
            disabled={isSending || !testPhone.trim()}
            className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-md shadow-[#25D366]/25 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Enviando WhatsApp...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Enviar Prueba Ahora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
