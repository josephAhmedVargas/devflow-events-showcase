"use client";

import { useState, useEffect } from "react";
import {
  AutomationModal,
  AutomationRuleItem,
} from "@/components/admin/AutomationModal";
import { EvolutionTestModal } from "@/components/admin/EvolutionTestModal";
import { EvolutionBatchModal } from "@/components/admin/EvolutionBatchModal";
import {
  confirmDelete,
  confirmAction,
  showSuccessAlert,
  showErrorAlert,
  showToast,
} from "@/lib/swal";

interface AutomationRunRecord {
  id: string;
  automationId: string;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  resultsSummary?: Record<string, any> | null;
  errorMessage?: string | null;
  createdAt: string;
  automation?: {
    name: string;
    triggerType: string;
  };
}

interface PreparedMessageItem {
  guestId: string;
  invitationCode: string;
  guestName: string;
  phone?: string | null;
  cleanPhone?: string | null;
  seats: number;
  tableInfo: string;
  rsvpStatus: string;
  message: string;
  waUrl: string;
  isSent?: boolean;
  sentAt?: string | null;
  sentVia?: string | null;
}

export default function AdminAutomationsPage() {
  const [activeTab, setActiveTab] = useState<"rules" | "dispatcher" | "history">("rules");
  const [rules, setRules] = useState<AutomationRuleItem[]>([]);
  const [runs, setRuns] = useState<AutomationRunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedRule, setSelectedRule] = useState<AutomationRuleItem | null>(null);

  // Evolution API Modals state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [sendingOneId, setSendingOneId] = useState<string | null>(null);
  const [sentSuccessIds, setSentSuccessIds] = useState<Set<string>>(new Set());

  // Evolution API Connection state
  const [evolutionStatus, setEvolutionStatus] = useState<any>(null);
  const [isCheckingEvolution, setIsCheckingEvolution] = useState(false);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>("dannia-xv");

  // Dispatcher state
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [dispatcherFilter, setDispatcherFilter] = useState<string>("all");
  const [sentStatusFilter, setSentStatusFilter] = useState<"all" | "pending" | "sent">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isPreparingMessages, setIsPreparingMessages] = useState<boolean>(false);
  const [preparedMessages, setPreparedMessages] = useState<PreparedMessageItem[]>([]);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState<boolean>(false);

  // Fetch automations and runs
  const fetchAutomationsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/automations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar reglas");

      setRules(data.automations || []);
      setRuns(data.recentRuns || []);

      if (data.automations?.length > 0 && !selectedRuleId) {
        const preferredRule =
          data.automations.find(
            (a: any) =>
              (a.actionConfig as any)?.category === "invitation" ||
              a.name?.toLowerCase().includes("invitaci")
          ) || data.automations[0];
        setSelectedRuleId(preferredRule.id);
      }
    } catch (err: any) {
      showErrorAlert("Error al cargar automatizaciones", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Evolution API Connection Status
  const fetchEvolutionStatus = async () => {
    setIsCheckingEvolution(true);
    try {
      const res = await fetch("/api/admin/automations/evolution-status");
      const data = await res.json();
      setEvolutionStatus(data);
      if (data.activeInstance?.name) {
        setSelectedInstanceName(data.activeInstance.name);
      }
    } catch (err: any) {
      setEvolutionStatus({
        online: false,
        statusCode: 0,
        message: err.message,
        instances: [],
        configuredUrl: "https://wapi.uninexus.lat",
        configuredInstance: "dannia-xv",
      });
    } finally {
      setIsCheckingEvolution(false);
    }
  };

  useEffect(() => {
    fetchAutomationsData();
    fetchEvolutionStatus();
  }, []);

  // Enviar invitación individual vía Evolution API directa
  const handleSendOneEvolution = async (msg: PreparedMessageItem) => {
    if (!msg.phone && !msg.cleanPhone) {
      showErrorAlert(
        "Sin Teléfono",
        `El invitado "${msg.guestName}" no tiene un número registrado para WhatsApp.`
      );
      return;
    }

    setSendingOneId(msg.guestId);
    try {
      const res = await fetch("/api/admin/automations/send-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: msg.guestId,
          automationId: selectedRuleId,
          instanceName: selectedInstanceName || "dannia-xv",
          rawGuest: msg,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object" && data.error !== null
            ? data.error.exists === false
              ? `El número (${data.error.number || msg.cleanPhone || ""}) no está registrado en WhatsApp.`
              : JSON.stringify(data.error)
            : "Fallo devuelto por Evolution API";
        throw new Error(errorMsg);
      }

      setSentSuccessIds((prev) => new Set(prev).add(msg.guestId));
      setPreparedMessages((prev) =>
        prev.map((m) =>
          m.guestId === msg.guestId
            ? { ...m, isSent: true, sentAt: new Date().toISOString(), sentVia: "whatsapp" }
            : m
        )
      );
      showToast(`¡Invitación enviada a ${msg.guestName}!`, "success");
    } catch (err: any) {
      showErrorAlert(
        "Error al Enviar WhatsApp",
        typeof err?.message === "string" ? err.message : JSON.stringify(err)
      );
    } finally {
      setSendingOneId(null);
    }
  };

  // Marcar/Desmarcar invitación como enviada manualmente
  const handleToggleSentManual = async (msg: PreparedMessageItem) => {
    const isCurrentlySent = msg.isSent || sentSuccessIds.has(msg.guestId);
    const nextStatus = isCurrentlySent ? "draft" : "sent";

    try {
      const res = await fetch("/api/admin/automations/mark-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: msg.guestId,
          status: nextStatus,
          sentVia: "manual",
        }),
      });

      if (res.ok) {
        if (nextStatus === "sent") {
          setSentSuccessIds((prev) => new Set(prev).add(msg.guestId));
        } else {
          setSentSuccessIds((prev) => {
            const next = new Set(prev);
            next.delete(msg.guestId);
            return next;
          });
        }

        setPreparedMessages((prev) =>
          prev.map((m) =>
            m.guestId === msg.guestId
              ? {
                  ...m,
                  isSent: nextStatus === "sent",
                  sentAt: nextStatus === "sent" ? new Date().toISOString() : null,
                  sentVia: nextStatus === "sent" ? "manual" : null,
                }
              : m
          )
        );

        showToast(
          nextStatus === "sent"
            ? `Marcada como enviada: ${msg.guestName}`
            : `Marcada como pendiente: ${msg.guestName}`,
          "info"
        );
      }
    } catch (err: any) {
      showErrorAlert("Error al actualizar estado", err.message);
    }
  };

  // Registrar clic en WhatsApp Web
  const handleMarkSentWeb = async (guestId: string) => {
    try {
      fetch("/api/admin/automations/mark-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          status: "sent",
          sentVia: "whatsapp_web",
        }),
      });

      setSentSuccessIds((prev) => new Set(prev).add(guestId));
      setPreparedMessages((prev) =>
        prev.map((m) =>
          m.guestId === guestId
            ? { ...m, isSent: true, sentAt: new Date().toISOString(), sentVia: "whatsapp_web" }
            : m
        )
      );
    } catch {
      // Background optimistic update
    }
  };

  // Fetch prepared messages when selected rule changes or filter changes in dispatcher
  const loadDispatcherMessages = async (ruleId: string, filter: string) => {
    if (!ruleId) return;
    setIsPreparingMessages(true);
    try {
      const res = await fetch("/api/admin/automations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automationId: ruleId,
          targetFilterOverride: filter,
          simulateOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar mensajes");
      setPreparedMessages(data.preparedMessages || []);
    } catch (err: any) {
      showErrorAlert("Error al preparar mensajes", err.message);
    } finally {
      setIsPreparingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dispatcher" && selectedRuleId) {
      loadDispatcherMessages(selectedRuleId, dispatcherFilter);
    }
  }, [activeTab, selectedRuleId, dispatcherFilter]);

  // Toggle active state of a rule
  const handleToggleActive = async (rule: AutomationRuleItem) => {
    try {
      const res = await fetch("/api/admin/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rule.id,
          isActive: !rule.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado");

      showToast(
        !rule.isActive ? `Regla "${rule.name}" activada` : `Regla "${rule.name}" pausada`,
        "info"
      );
      fetchAutomationsData();
    } catch (err: any) {
      showErrorAlert("Error", err.message);
    }
  };

  // Delete rule
  const handleDeleteRule = async (rule: AutomationRuleItem) => {
    if (!rule.id) return;
    const confirmed = await confirmDelete(rule.name, "¿Deseas eliminar permanentemente esta regla?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/automations?id=${rule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar regla");

      showToast(`Regla "${rule.name}" eliminada`, "success");
      fetchAutomationsData();
    } catch (err: any) {
      showErrorAlert("Error al eliminar", err.message);
    }
  };

  // Run / Register batch run
  const handleRegisterBatchRun = async () => {
    if (!selectedRuleId) return;
    const currentRule = rules.find((r) => r.id === selectedRuleId);
    const confirmed = await confirmAction({
      title: "¿Registrar y Despachar Corrida en Lote?",
      text: `Se guardará un registro oficial en el historial con ${preparedMessages.length} destinatarios calculados bajo la regla "${currentRule?.name}".`,
      confirmButtonText: "Sí, Registrar Corrida",
      icon: "question",
    });

    if (!confirmed) return;

    setIsSimulatingBatch(true);
    try {
      const res = await fetch("/api/admin/automations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automationId: selectedRuleId,
          targetFilterOverride: dispatcherFilter,
          simulateOnly: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar la corrida");

      showSuccessAlert(
        "¡Corrida Registrada con Éxito!",
        `Se procesaron ${data.totalTarget} mensajes de gala para la regla "${data.automationName}". Ya puedes despachar individualmente cada WhatsApp.`
      );
      fetchAutomationsData();
    } catch (err: any) {
      showErrorAlert("Error al ejecutar", err.message);
    } finally {
      setIsSimulatingBatch(false);
    }
  };

  // Copy message to clipboard
  const handleCopyText = (text: string, guestName: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Mensaje para ${guestName} copiado al portapapeles`, "success");
  };

  // Filtered prepared messages for search and sent status
  const sentCount = preparedMessages.filter((m) => m.isSent || sentSuccessIds.has(m.guestId)).length;
  const pendingCount = preparedMessages.length - sentCount;

  const filteredMessages = preparedMessages.filter((m) => {
    const isSent = m.isSent || sentSuccessIds.has(m.guestId);
    if (sentStatusFilter === "pending" && isSent) return false;
    if (sentStatusFilter === "sent" && !isSent) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      m.guestName.toLowerCase().includes(q) ||
      m.invitationCode.toLowerCase().includes(q) ||
      m.tableInfo.toLowerCase().includes(q) ||
      (m.phone && m.phone.includes(q))
    );
  });

  const activeRulesCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-8 flex flex-col gap-6 sm:gap-8 max-w-[1600px] mx-auto w-full pb-24">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">
              D&apos;CAROL XV
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              Centro de Mando
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1829] tracking-tight font-sans">
              Automatizaciones &amp; Despacho WhatsApp
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Motor Activo</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Reglas programadas, plantillas personalizadas de gala y despacho con enlaces mágicos
            para Mis XV Años Dannia Carolina.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setSelectedRule(null);
              setModalMode("create");
              setShowModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-md shadow-[#0552AC]/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Nueva Regla</span>
          </button>
        </div>
      </div>

      {/* 2. Metric KPI Cards (Refined Typography, Sans-serif Numbers, Clean Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Reglas Activas
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#0552AC]/10 text-[#0552AC] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0D1829] font-sans tabular-nums">
              {activeRulesCount}
            </span>
            <span className="text-xs font-medium text-slate-500">de {rules.length} configuradas</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Destinatarios Base
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 text-[#001F54] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0D1829] font-sans tabular-nums">
              105
            </span>
            <span className="text-xs font-semibold text-emerald-600">Comensales en Neon DB</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Corridas Registradas
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0D1829] font-sans tabular-nums">
              {runs.length}
            </span>
            <span className="text-xs font-medium text-slate-500">en historial de auditoría</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Canal de Despacho
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </div>
          </div>
          <div>
            <span className="text-lg font-bold text-[#0D1829] font-sans block leading-snug">
              WhatsApp Gala Web
            </span>
            <span className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Enlaces Mágicos 1-Click
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs (Segmented Luxury Pill Controls) */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 border border-slate-200/80 w-fit">
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "rules"
              ? "bg-white text-[#0552AC] shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Reglas de Automatización</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "rules" ? "bg-[#0552AC]/10 text-[#0552AC]" : "bg-slate-200 text-slate-600"
            }`}
          >
            {rules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("dispatcher")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "dispatcher"
              ? "bg-white text-[#0552AC] shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          <span>Despachador WhatsApp</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "dispatcher"
                ? "bg-[#0552AC]/10 text-[#0552AC]"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {preparedMessages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "history"
              ? "bg-white text-[#0552AC] shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>Historial de Ejecuciones</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "history"
                ? "bg-[#0552AC]/10 text-[#0552AC]"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {runs.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: REGLAS DE AUTOMATIZACIÓN
         ======================================================== */}
      {activeTab === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => {
            const phase = rule.triggerConfig?.phase || "pre_event";
            const phaseBadge =
              phase === "pre_event"
                ? { label: "Pre-Evento", bg: "bg-blue-50 text-blue-700 border-blue-200" }
                : phase === "event_day"
                ? { label: "Día del Evento", bg: "bg-amber-50 text-amber-700 border-amber-200" }
                : { label: "Post-Evento", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };

            return (
              <div
                key={rule.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between gap-5 transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${phaseBadge.bg}`}
                        >
                          {phaseBadge.label}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {rule.triggerConfig?.label || "Programado"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#0D1829] mt-2 leading-snug font-sans">
                        {rule.name}
                      </h3>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          rule.isActive ? "bg-[#0552AC]" : "bg-slate-300"
                        }`}
                        title={rule.isActive ? "Regla Activa" : "Regla Pausada"}
                      >
                        <span
                          className={`absolute top-[2px] w-5 h-5 rounded-full bg-white transition-transform ${
                            rule.isActive ? "right-[2px]" : "left-[2px]"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Preview Bubble */}
                  <div className="p-3.5 rounded-2xl bg-[#EFEAE2] border border-slate-200 flex flex-col gap-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase">
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      Plantilla de Mensaje WhatsApp
                    </div>
                    <div className="bg-white p-3 rounded-xl rounded-tl-xs shadow-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto ring-1 ring-[#25D366]/30">
                      {rule.actionConfig?.template}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedRuleId(rule.id || "");
                      setActiveTab("dispatcher");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Despachar WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedRule(rule);
                        setModalMode("edit");
                        setShowModal(true);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar Regla"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule)}
                      className="p-2 rounded-xl text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar Regla"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          TAB 2: DESPACHADOR WHATSAPP INTERACTIVO
         ======================================================== */}
      {activeTab === "dispatcher" && (
        <div className="flex flex-col gap-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 md:p-8 max-w-full overflow-hidden">
          {/* Banner de Estado de Conexión Evolution API */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  evolutionStatus?.online
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {evolutionStatus?.online ? "cloud_done" : "cloud_off"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0D1829]">Evolution API (WhatsApp)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      evolutionStatus?.online
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {isCheckingEvolution
                      ? "Comprobando..."
                      : evolutionStatus?.online
                      ? "En Línea"
                      : "Verificar Servicio"}
                  </span>
                  {evolutionStatus?.latencyMs && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {evolutionStatus.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Host: <strong className="font-mono text-slate-700">https://wapi.uninexus.lat</strong> •
                  Instancia: <strong className="font-mono text-[#0552AC]">{selectedInstanceName}</strong>
                </p>
                {!evolutionStatus?.online && evolutionStatus?.message && (
                  <p className="text-[11px] text-amber-700 mt-1 font-medium leading-tight">
                    💡 {evolutionStatus.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchEvolutionStatus}
                disabled={isCheckingEvolution}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Comprobar conectividad con Evolution API"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isCheckingEvolution ? "animate-spin" : ""
                  }`}
                >
                  refresh
                </span>
                <span>Probar Conexión</span>
              </button>
            </div>
          </div>

          {/* Banner de Vinculación WhatsApp (QR Code si la instancia no está 'open') */}
          {evolutionStatus?.online &&
            evolutionStatus?.activeInstance &&
            evolutionStatus.activeInstance.status !== "open" && (
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {evolutionStatus.qrCodeBase64 ? (
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-amber-200 shrink-0">
                      <img
                        src={evolutionStatus.qrCodeBase64}
                        alt="Código QR WhatsApp"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <span className="material-symbols-outlined text-[36px] animate-pulse">
                        qr_code_2
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-300">
                        Vincular WhatsApp Requerido
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Estado:{" "}
                        <strong className="text-amber-700 capitalize">
                          {evolutionStatus.activeInstance.status}
                        </strong>
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Escanea este código QR con el WhatsApp emisor
                    </h3>
                    <ol className="text-slate-600 text-[11px] list-decimal list-inside space-y-0.5 max-w-md">
                      <li>Abre WhatsApp en tu teléfono</li>
                      <li>Toca Menú (o Configuración) &gt; Dispositivos vinculados</li>
                      <li>Toca Vincular un dispositivo y apunta la cámara al código QR</li>
                    </ol>
                    {evolutionStatus.pairingCode && (
                      <p className="text-[11px] font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 w-fit mt-1">
                        Código alternativo: <strong>{evolutionStatus.pairingCode}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={fetchEvolutionStatus}
                    disabled={isCheckingEvolution}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        isCheckingEvolution ? "animate-spin" : ""
                      }`}
                    >
                      refresh
                    </span>
                    <span>Ya lo escaneé (Actualizar)</span>
                  </button>
                  <span className="text-[10px] text-slate-400">El QR expira en ~40s</span>
                </div>
              </div>
            )}

          {/* Row 1: Plantilla Activa Selector & Botones de Acción */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex flex-col gap-1.5 flex-1 max-w-xl min-w-0">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#0552AC]">
                  chat_bubble
                </span>
                Plantilla Seleccionada para el Despacho
              </label>
              <select
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                className="w-full max-w-full truncate px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#0552AC] bg-slate-50/50 hover:bg-white transition-colors"
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Main Action Group: Test Send, Bulk Send, Register Audit */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              {/* Botón 1: Prueba de Envío Rápido */}
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#25D366] text-[#1EBE5D] hover:bg-[#25D366]/10 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Enviar un mensaje de prueba a cualquier número de WhatsApp"
              >
                <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
                <span>Probar con mi Teléfono</span>
              </button>

              {/* Botón 2: Disparador Masivo Manual (Enviar a Todos) */}
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1EBE5D] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#25D366]/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                title="Iniciar disparador manual para enviar a todos los números registrados"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Disparador Masivo (Enviar a Todos)</span>
              </button>

              {/* Botón 3: Registrar Corrida en Auditoría */}
              <button
                onClick={handleRegisterBatchRun}
                disabled={isSimulatingBatch || isPreparingMessages}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                title="Registra una corrida manual de control en base de datos"
              >
                {isSimulatingBatch ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">checklist</span>
                )}
                <span>Auditoría</span>
              </button>
            </div>
          </div>

          {/* Row 2: Filtros de Audiencia, Estado de Envío & Buscador */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Filter Audience Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Audiencia:
                </span>
                {[
                  { id: "all", label: "Todos los Invitados" },
                  { id: "pending_rsvp", label: "Solo Pendientes (RSVP)" },
                  { id: "confirmed_only", label: "Solo Confirmados" },
                  { id: "with_phone", label: "Con Teléfono" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDispatcherFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      dispatcherFilter === f.id
                        ? "bg-[#0552AC] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Status Filter (Enviados vs Pendientes) */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  Estado:
                </span>
                <button
                  onClick={() => setSentStatusFilter("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    sentStatusFilter === "all"
                      ? "bg-white text-[#0552AC] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Todos ({preparedMessages.length})
                </button>
                <button
                  onClick={() => setSentStatusFilter("pending")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    sentStatusFilter === "pending"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-amber-800 hover:bg-amber-100/60"
                  }`}
                >
                  <span>⏳ Pendientes</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                    {pendingCount}
                  </span>
                </button>
                <button
                  onClick={() => setSentStatusFilter("sent")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    sentStatusFilter === "sent"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-emerald-800 hover:bg-emerald-100/60"
                  }`}
                >
                  <span>✓ Ya Enviados</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                    {sentCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar comensal por nombre, código de invitación, mesa asignada o teléfono..."
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#0552AC] bg-slate-50/50 hover:bg-white transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 3: Notice & Counter Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0552AC] text-[20px] shrink-0">
                verified_user
              </span>
              <span>
                <strong>Control de Envíos:</strong> Puedes despachar automáticamente con <em>"Enviar Directo"</em> o abrir <em>"WhatsApp Web"</em> (se marca como enviado automáticamente al dar clic).
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-bold">
              <span className="text-amber-700">⏳ {pendingCount} pendientes</span>
              <span className="text-emerald-700">✓ {sentCount} enviados</span>
              {sentCount > 0 && (
                <button
                  onClick={async () => {
                    const confirmed = await confirmAction({
                      title: "¿Reiniciar estado de envíos?",
                      text: "Esto marcará a todos los comensales como pendientes en la lista para que puedas despacharles la Invitación Oficial sin bloqueos.",
                      confirmButtonText: "Sí, reiniciar a pendientes",
                    });
                    if (confirmed) {
                      setSentSuccessIds(new Set());
                      setPreparedMessages((prev) =>
                        prev.map((m) => ({ ...m, isSent: false, sentAt: null, sentVia: null }))
                      );
                      showToast("Todos los comensales marcados como pendientes", "success");
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer shadow-2xs transition flex items-center gap-1"
                  title="Reiniciar contador de enviados"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  <span>Reiniciar a Pendientes</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Table */}
          {isPreparingMessages ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="material-symbols-outlined text-[40px] animate-spin text-[#0552AC]">
                progress_activity
              </span>
              <span className="text-xs font-semibold">Generando mensajes personalizados...</span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="material-symbols-outlined text-[44px]">group_off</span>
              <span className="text-xs font-semibold">
                No hay invitados que coincidan con el filtro seleccionado
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                    <th className="py-3 px-4">Comensal / Asistencia</th>
                    <th className="py-3 px-4">Mesa Asignada</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4">Vista Previa Mensaje</th>
                    <th className="py-3 px-4 text-right">Despacho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                  {filteredMessages.map((msg) => {
                    const isGuestSent = msg.isSent || sentSuccessIds.has(msg.guestId);

                    return (
                      <tr key={msg.guestId} className="hover:bg-slate-50/80 transition-colors">
                        {/* Guest Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0D1829]">{msg.guestName}</span>
                              {isGuestSent ? (
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  <span>Enviado</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                                  <span>Pendiente</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-100">
                                {msg.invitationCode}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                                {msg.seats} {msg.seats === 1 ? "pase" : "pases"}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  msg.rsvpStatus === "confirmed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {msg.rsvpStatus}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {msg.tableInfo}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {msg.phone ? (
                            <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {msg.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Sin registrar</span>
                          )}
                        </td>

                        {/* Message Preview */}
                        <td className="py-3.5 px-4 max-w-sm truncate">
                          <span
                            className="text-slate-600 font-mono text-[11px] truncate block bg-slate-50 p-2 rounded-lg border border-slate-200/60 cursor-pointer hover:border-slate-300"
                            title={msg.message}
                            onClick={() => handleCopyText(msg.message, msg.guestName)}
                          >
                            {msg.message}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Manual Check */}
                            <button
                              onClick={() => handleToggleSentManual(msg)}
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                isGuestSent
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200"
                              }`}
                              title={
                                isGuestSent
                                  ? "Desmarcar envío (volver a pendiente)"
                                  : "Marcar como enviado manualmente"
                              }
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                {isGuestSent ? "check_box" : "check_box_outline_blank"}
                              </span>
                            </button>

                            {/* Botón Envío Directo Evolution API */}
                            <button
                              onClick={() => handleSendOneEvolution(msg)}
                              disabled={(!msg.phone && !msg.cleanPhone) || sendingOneId === msg.guestId}
                              className={`px-3 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                isGuestSent
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-[#0552AC] hover:bg-[#001F54] text-white"
                              }`}
                              title="Enviar instantáneamente vía Evolution API"
                            >
                              {sendingOneId === msg.guestId ? (
                                <span className="material-symbols-outlined text-[16px] animate-spin">
                                  progress_activity
                                </span>
                              ) : isGuestSent ? (
                                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                                  check_circle
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">bolt</span>
                              )}
                              <span>{isGuestSent ? "¡Enviado!" : "Enviar Directo"}</span>
                            </button>

                            <button
                              onClick={() => handleCopyText(msg.message, msg.guestName)}
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Copiar texto al portapapeles"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                content_copy
                              </span>
                            </button>
                            <a
                              href={msg.waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleMarkSentWeb(msg.guestId)}
                              className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                              title="Abrir chat en WhatsApp Web / App (se marca como enviado automáticamente)"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                open_in_new
                              </span>
                              <span>WhatsApp Web</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: HISTORIAL DE EJECUCIONES (AUDITORÍA)
         ======================================================== */}
      {activeTab === "history" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0D1829] font-sans">
                Registro de Corridas &amp; Auditoría
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Historial de preparaciones de cola y ejecuciones registradas en Neon PostgreSQL
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Últimas {runs.length} ejecuciones registradas
            </span>
          </div>

          {/* Banner Explicativo de Auditoría */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-950">
            <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0 mt-0.5">
              info
            </span>
            <div className="space-y-1">
              <strong className="block text-sm text-amber-950">
                ¿Qué significa este Historial de Auditoría?
              </strong>
              <p className="text-[12px] text-amber-900 leading-relaxed">
                Cada registro en esta tabla corresponde a la <strong>preparación y cálculo de destinatarios en cola</strong> bajo una regla específica. 
                <strong className="text-amber-950"> Ningún mensaje de WhatsApp se envía automáticamente por sí solo al registrar una corrida.</strong>
              </p>
              <p className="text-[12px] text-amber-900 leading-relaxed">
                Para enviar las invitaciones reales, debes usar deliberadamente el botón <strong>"Disparador Masivo"</strong> o despachar comensal por comensal haciendo clic en <strong>"Enviar Directo"</strong> / <strong>"WhatsApp Web"</strong> en la pestaña <em>Despachador WhatsApp</em>.
              </p>
            </div>
          </div>

          {runs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="material-symbols-outlined text-[44px]">history_toggle_off</span>
              <span className="text-xs font-semibold">
                Aún no se han registrado corridas de automatización
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Regla</th>
                    <th className="py-3 px-4">Destinatarios Alistados en Cola</th>
                    <th className="py-3 px-4">Filtro Usado</th>
                    <th className="py-3 px-4">Tipo de Operación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                  {runs.map((r) => {
                    const dateFormatted = new Date(r.createdAt).toLocaleString("es-NI", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    });
                    const summary = r.resultsSummary || {};

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{dateFormatted}</td>
                        <td className="py-3 px-4 font-bold text-[#0D1829]">
                          {r.automation?.name || "Automatización"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-800 text-[11px]">
                            {summary.totalTarget || 0} comensales
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {summary.filterUsed || "all"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-[#0552AC] border border-blue-200">
                            Cola Alistada
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for Rule Editing / Creation */}
      <AutomationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={fetchAutomationsData}
        rule={selectedRule}
        mode={modalMode}
      />

      {/* Modal for Quick Evolution Test Send */}
      <EvolutionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        rules={rules}
        selectedRuleId={selectedRuleId}
        guests={preparedMessages}
        instanceName={selectedInstanceName}
      />

      {/* Modal for Bulk Broadcast Execution */}
      <EvolutionBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        automationId={selectedRuleId}
        automationName={rules.find((r) => r.id === selectedRuleId)?.name || "Invitación Oficial con Enlace Mágico"}
        rules={rules}
        onSelectRule={(id) => setSelectedRuleId(id)}
        guests={preparedMessages}
        instanceName={selectedInstanceName}
        onRunFinished={() => {
          fetchAutomationsData();
        }}
      />
    </div>
  );
}
