"use client";

import { useState, useEffect } from "react";
import { showToast, showErrorAlert, showSuccessAlert } from "@/lib/swal";
import { sanitizeTemplateText } from "@/lib/invitation-template";

interface GuestItem {
  guestId: string;
  guestName: string;
  invitationCode: string;
  phone?: string | null;
  cleanPhone?: string | null;
  seats: number;
  tableInfo: string;
  rsvpStatus: string;
  message: string;
  isSent?: boolean;
  sentAt?: string | null;
  sentVia?: string | null;
}

interface EvolutionBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  automationId: string;
  automationName?: string;
  rules?: any[];
  onSelectRule?: (ruleId: string) => void;
  guests: GuestItem[];
  instanceName: string;
  onRunFinished: () => void;
}

export function EvolutionBatchModal({
  isOpen,
  onClose,
  automationId,
  automationName,
  rules = [],
  onSelectRule,
  guests,
  instanceName,
  onRunFinished,
}: EvolutionBatchModalProps) {
  const [currentRuleId, setCurrentRuleId] = useState<string>(automationId);

  useEffect(() => {
    if (automationId) setCurrentRuleId(automationId);
  }, [automationId]);

  const activeRule =
    rules.find((r) => r.id === currentRuleId) ||
    rules.find((r) => (r.actionConfig as any)?.category === "invitation") ||
    rules[0];

  const isInvitationRule =
    activeRule?.actionConfig?.category === "invitation" ||
    activeRule?.name?.toLowerCase().includes("invitaci");

  const [filterMode, setFilterMode] = useState<"only_unsent" | "with_phone" | "pending_rsvp" | "confirmed_only">("only_unsent");
  const [skipAlreadySent, setSkipAlreadySent] = useState<boolean>(true);
  const [delaySeconds, setDelaySeconds] = useState<number>(8);
  const [isDryRun, setIsDryRun] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressCount, setProgressCount] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [currentGuestName, setCurrentGuestName] = useState<string>("");
  const [activityLogs, setActivityLogs] = useState<Array<{ name: string; phone: string; status: "success" | "failed"; error?: string }>>([]);
  const [failedGuestsList, setFailedGuestsList] = useState<GuestItem[]>([]);
  const [batchTotal, setBatchTotal] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [shouldAbort, setShouldAbort] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter calculations
  const candidatesWithPhone = guests.filter((g) => Boolean(g.cleanPhone || g.phone));
  const unsentCount = candidatesWithPhone.filter((g) => !g.isSent).length;
  const alreadySentCount = candidatesWithPhone.length - unsentCount;

  // Active queue to send
  const queue = candidatesWithPhone.filter((g) => {
    // Si la opción de omitir ya enviados está activa o estamos en only_unsent
    if (filterMode === "only_unsent") return !g.isSent;
    if (skipAlreadySent && g.isSent) return false;
    if (filterMode === "pending_rsvp") return !g.rsvpStatus || g.rsvpStatus === "pending";
    if (filterMode === "confirmed_only") return g.rsvpStatus === "confirmed" || g.rsvpStatus === "attending";
    return true;
  });

  const estimatedMinutes = Math.ceil((queue.length * delaySeconds) / 60);

  const startBatchExecution = async (customQueue?: GuestItem[]) => {
    const queueToRun = customQueue || queue;
    if (queueToRun.length === 0) {
      showErrorAlert("Sin Destinatarios", "No hay invitados pendientes con teléfono para enviar.");
      return;
    }

    setIsRunning(true);
    setIsCompleted(false);
    setProgressCount(0);
    setSuccessCount(0);
    setFailedCount(0);
    setBatchTotal(queueToRun.length);
    setActivityLogs([]);
    setShouldAbort(false);

    let succ = 0;
    let fail = 0;
    const newFailed: GuestItem[] = [];

    for (let i = 0; i < queueToRun.length; i++) {
      if (shouldAbort) {
        showToast("Envío masivo pausado por el usuario", "info");
        break;
      }

      const guest = queueToRun[i];
      setCurrentGuestName(guest.guestName);
      setProgressCount(i + 1);

      try {
        if (isDryRun) {
          // Simulation
          await new Promise((r) => setTimeout(r, 400));
          succ++;
          setSuccessCount(succ);
          guest.isSent = true;
          setActivityLogs((prev) => [
            {
              name: guest.guestName,
              phone: guest.cleanPhone || guest.phone || "",
              status: "success",
            },
            ...prev.slice(0, 49),
          ]);
        } else {
          // Real send via /api/admin/automations/send-one
          const res = await fetch("/api/admin/automations/send-one", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestId: guest.guestId,
              automationId: currentRuleId || automationId,
              instanceName,
              customTemplate: sanitizeTemplateText(activeRule?.actionConfig?.template),
              rawGuest: guest,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            succ++;
            setSuccessCount(succ);
            guest.isSent = true;
            guest.sentAt = new Date().toISOString();
            setActivityLogs((prev) => [
              {
                name: guest.guestName,
                phone: data.phone || guest.cleanPhone || "",
                status: "success",
              },
              ...prev.slice(0, 49),
            ]);
          } else {
            fail++;
            setFailedCount(fail);
            newFailed.push(guest);
            const rawError = data?.error;
            const safeError =
              typeof rawError === "string"
                ? rawError
                : typeof rawError === "object" && rawError !== null
                ? rawError.exists === false
                  ? `El número (${rawError.number || guest.cleanPhone || ""}) no está en WhatsApp`
                  : JSON.stringify(rawError)
                : "Fallo al enviar mensaje";

            setActivityLogs((prev) => [
              {
                name: guest.guestName,
                phone: guest.cleanPhone || guest.phone || "",
                status: "failed",
                error: safeError,
              },
              ...prev.slice(0, 49),
            ]);
          }

          // Anti-Spam / Anti-Ban Delay pacing between sends (except last)
          if (i < queueToRun.length - 1 && delaySeconds > 0) {
            // Humanized jitter (between 500ms and 2500ms) to avoid robotic constant intervals
            const jitterMs = Math.floor(Math.random() * 2000) + 500;
            await new Promise((r) => setTimeout(r, delaySeconds * 1000 + jitterMs));

            // Anti-Spam cooling pause: every 20 messages, pause 15 seconds to let WhatsApp socket cool down
            if ((i + 1) % 20 === 0 && delaySeconds >= 4) {
              setActivityLogs((prev) => [
                {
                  name: "🛡️ Enfriamiento Preventivo",
                  phone: "Pausa Anti-Spam",
                  status: "success",
                  error: "Pausando 15s para proteger tu línea de WhatsApp...",
                },
                ...prev.slice(0, 49),
              ]);
              await new Promise((r) => setTimeout(r, 15000));
            }
          }
        }
      } catch (err: any) {
        fail++;
        setFailedCount(fail);
        newFailed.push(guest);
        const errMsg = typeof err?.message === "string" ? err.message : String(err);
        setActivityLogs((prev) => [
          {
            name: guest.guestName,
            phone: guest.cleanPhone || guest.phone || "",
            status: "failed",
            error: errMsg,
          },
          ...prev.slice(0, 49),
        ]);
      }
    }

    setFailedGuestsList(newFailed);
    setIsRunning(false);
    setIsCompleted(true);
    setCurrentGuestName("");
    onRunFinished();

    if (succ > 0) {
      showSuccessAlert(
        "¡Envío Masivo Concluido!",
        `Se procesaron ${succ} invitaciones exitosamente por WhatsApp.${fail > 0 ? ` (${fail} quedaron pendientes o con fallo para reintentar).` : ""}`
      );
    }
  };

  const retryFailedOnly = () => {
    if (failedGuestsList.length === 0) return;
    startBatchExecution(failedGuestsList);
  };

  const activeTotal = batchTotal || queue.length;
  const percent = activeTotal > 0 ? Math.round((progressCount / activeTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full p-6 md:p-8 flex flex-col gap-5 my-8 relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0552AC] to-[#001F54] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0552AC] font-cinzel">
                Disparador Masivo Oficial
              </span>
              <h3 className="text-lg font-bold text-[#0D1829] font-sans">
                Envío de Invitaciones por WhatsApp (Evolution API)
              </h3>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Configuration step (if not running and not completed) */}
        {!isRunning && !isCompleted && (
          <div className="space-y-4 text-xs">
            {/* Rule Selector with category badge */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Regla / Plantilla de Mensaje a Despachar:
              </label>
              <select
                value={currentRuleId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setCurrentRuleId(newId);
                  onSelectRule?.(newId);
                }}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold bg-white transition cursor-pointer ${
                  isInvitationRule
                    ? "border-emerald-300 text-emerald-950 focus:ring-emerald-500"
                    : "border-amber-400 text-amber-950 focus:ring-amber-500 bg-amber-50/40"
                }`}
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.actionConfig as any)?.category === "invitation" ? "✨ [INVITACIÓN OFICIAL] " : ""}
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-invitation warning if thank_you or reminder is selected */}
            {!isInvitationRule && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-rose-600 text-[20px] shrink-0 mt-0.5">
                  warning
                </span>
                <div>
                  <strong className="block text-xs text-rose-950">
                    ⚠️ ¡Atención! No estás enviando la Invitación Oficial
                  </strong>
                  <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                    Has seleccionado <strong>{activeRule?.name}</strong>. Si lo que deseas es enviar la invitación para asistir a los Quince Años, cambia la regla arriba a <strong>&quot;Invitación Oficial con Enlace Mágico&quot;</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Template preview bubble */}
            <div>
              <label className="font-bold text-slate-700 flex items-center justify-between mb-1">
                <span>Vista Previa del Mensaje que Recibirán por WhatsApp:</span>
                <span className="text-[10px] text-[#25D366] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
                  Mensaje Oficial
                </span>
              </label>
              <div className="p-3 rounded-2xl bg-[#ECE5DD] border border-[#25D366]/30 max-h-36 overflow-y-auto">
                <div className="bg-white p-3 rounded-xl rounded-tl-xs shadow-xs text-slate-800 font-sans text-[11px] whitespace-pre-wrap leading-relaxed border border-slate-200/60">
                  {sanitizeTemplateText(activeRule?.actionConfig?.template)}
                </div>
              </div>
            </div>

            {/* Audience Filter Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">
                  Audiencia de Destino:
                </label>
                <span className="text-[11px] text-slate-500">
                  Total candidatos: <strong>{candidatesWithPhone.length}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "only_unsent",
                    label: "⏳ Solo No Enviados (Reanudar)",
                    desc: `${unsentCount} pendientes (${alreadySentCount} ya enviados)`,
                    recommended: true,
                  },
                  {
                    id: "with_phone",
                    label: "Todos con Teléfono",
                    desc: `${candidatesWithPhone.length} comensales en total`,
                    recommended: false,
                  },
                  {
                    id: "pending_rsvp",
                    label: "Solo Pendientes RSVP",
                    desc: "Sin respuesta aún",
                    recommended: false,
                  },
                  {
                    id: "confirmed_only",
                    label: "Solo Confirmados",
                    desc: "Asistencia confirmada",
                    recommended: false,
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setFilterMode(opt.id as any);
                      if (opt.id === "with_phone") {
                        setSkipAlreadySent(false);
                      } else if (opt.id === "only_unsent") {
                        setSkipAlreadySent(true);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                      filterMode === opt.id
                        ? "border-[#0552AC] bg-blue-50/50 ring-2 ring-[#0552AC]/20 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt.recommended && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider">
                        Recomendado
                      </span>
                    )}
                    <span className="font-bold text-[#0D1829] block">{opt.label}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Resumption & Anti-Duplicate Protection */}
            <div
              className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                skipAlreadySent
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-slate-200 bg-slate-50/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-[22px] shrink-0 ${
                    skipAlreadySent ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {skipAlreadySent ? "safety_check" : "published_with_changes"}
                </span>
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      skipAlreadySent ? "text-emerald-950" : "text-slate-800"
                    }`}
                  >
                    {skipAlreadySent
                      ? "Omitir los ya enviados (Reanudación Segura)"
                      : "Enviar a todos (Ignorar estado previo)"}
                  </span>
                  <span
                    className={`text-[11px] block leading-relaxed ${
                      skipAlreadySent ? "text-emerald-800" : "text-slate-600"
                    }`}
                  >
                    {skipAlreadySent
                      ? `Protección activa: omitiendo ${alreadySentCount} ya enviados (${queue.length} restantes). Para enviar a los ${candidatesWithPhone.length} comensales, apaga este switch.`
                      : `Protección desactivada: se enviará el mensaje a los ${candidatesWithPhone.length} comensales con teléfono sin omitir a nadie.`}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={skipAlreadySent}
                  onChange={(e) => setSkipAlreadySent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Safety Pacing & Anti-Spam */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Ritmo de Envío Seguro (Anti-Baneo WhatsApp):
                </label>
                <select
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value={8}>🛡️ Recomendado Anti-Spam (8s + variación humana)</option>
                  <option value={15}>🔒 Máxima Seguridad (15s + pausa cada 20)</option>
                  <option value={4}>⚡ Moderado (4s + variación humana)</option>
                  <option value={2}>⚠️ Rápido (2s - solo números verificados)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Incluye variación humana aleatoria (+0.5s a +2.5s) y pausas de enfriamiento cada 20 envíos.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Modo de Operación:
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    className="w-4 h-4 text-[#0552AC] rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Modo Simulación (Prueba en seco sin enviar)
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  Útil para validar el flujo sin mandar mensajes reales.
                </p>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-amber-800 block">
                  Resumen de la Operación
                </span>
                <span className="text-base font-extrabold font-sans">
                  {queue.length} invitaciones listas para despachar
                </span>
                <span className="text-xs text-amber-700 block mt-0.5">
                  Tiempo estimado: ~{estimatedMinutes} minuto(s) a {delaySeconds}s de cadencia
                </span>
              </div>
              <span className="material-symbols-outlined text-[32px] text-amber-600">
                schedule
              </span>
            </div>
          </div>
        )}

        {/* Live Progress View (while running or completed) */}
        {(isRunning || isCompleted) && (
          <div className="space-y-4 text-xs">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between font-bold text-slate-700 mb-1.5">
                <span>
                  {isRunning ? "Despachando invitaciones en curso..." : "¡Proceso Concluido!"}
                </span>
                <span className="font-mono text-[#0552AC] text-sm">{percent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#25D366] to-[#0552AC] transition-[width] duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {currentGuestName && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Enviando a: <strong className="text-slate-800">{currentGuestName}</strong>...
                </p>
              )}
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lote</span>
                <span className="text-xl font-black text-slate-800 font-sans">{activeTotal}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Éxitos</span>
                <span className="text-xl font-black text-emerald-700 font-sans">{successCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600 block">Fallos</span>
                <span className="text-xl font-black text-rose-700 font-sans">{failedCount}</span>
              </div>
            </div>

            {/* Live Activity Stream */}
            <div>
              <span className="font-bold text-slate-700 block mb-1">
                Registro en Vivo de Envíos:
              </span>
              <div className="h-44 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 divide-y divide-slate-100">
                {activityLogs.map((log, idx) => (
                  <div key={idx} className="py-1.5 px-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[16px] ${
                          log.status === "success" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {log.status === "success" ? "check_circle" : "error"}
                      </span>
                      <span className="font-bold text-slate-800">{log.name}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{log.phone}</span>
                    </div>
                    {log.error ? (
                      <span
                        className="text-rose-600 font-medium text-[10px] max-w-xs truncate"
                        title={typeof log.error === "string" ? log.error : JSON.stringify(log.error)}
                      >
                        {typeof log.error === "string" ? log.error : JSON.stringify(log.error)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold text-[10px]">Entregado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {isRunning && (
              <button
                onClick={() => setShouldAbort(true)}
                className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs hover:bg-amber-200 transition-colors cursor-pointer"
              >
                Pausar Envío
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning && isCompleted && (
              <>
                {failedCount > 0 && failedGuestsList.length > 0 && (
                  <button
                    onClick={retryFailedOnly}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                  >
                    <span className="material-symbols-outlined text-[17px]">replay</span>
                    <span>Reintentar los {failedGuestsList.length} con error</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsCompleted(false);
                    setFailedCount(0);
                    setSuccessCount(0);
                    setProgressCount(0);
                    setBatchTotal(0);
                    setActivityLogs([]);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Ajustar Filtros
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Cerrar
                </button>
              </>
            )}

            {!isRunning && !isCompleted && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => startBatchExecution()}
                  disabled={queue.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] via-emerald-600 to-[#0552AC] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>Iniciar Envío Masivo Oficial ({queue.length})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
