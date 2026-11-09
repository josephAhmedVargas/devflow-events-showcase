"use client";

import { useState, useEffect } from "react";
import { showToast, showErrorAlert } from "@/lib/swal";

export interface AutomationRuleItem {
  id?: string;
  name: string;
  triggerType: string;
  triggerConfig: {
    targetFilter?: string;
    phase?: string;
    offsetDays?: number;
    label?: string;
    description?: string;
  };
  actionType: string;
  actionConfig: {
    category?: string;
    template: string;
  };
  isActive: boolean;
}

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  rule?: AutomationRuleItem | null;
  mode: "create" | "edit";
}

const VARIABLE_TAGS = [
  { tag: "{{guest_name}}", label: "Nombre Invitado", example: "Familia Scarleth Men" },
  { tag: "{{seats}}", label: "Lugares Reservados", example: "2" },
  { tag: "{{table_info}}", label: "Mesa Asignada", example: "Mesa 01 • Dannia Carolina" },
  { tag: "{{code}}", label: "Código de Acceso", example: "VIP-DC-001" },
  { tag: "{{magic_link}}", label: "Enlace Mágico", example: "https://dannia.event/?code=VIP-DC-001" },
  { tag: "{{pass_link}}", label: "Enlace a Pase", example: "https://dannia.event/?code=VIP-DC-001" },
  { tag: "{{recuerdos_link}}", label: "Enlace Recuerdos", example: "https://dannia.event/recuerdos" },
];

export function AutomationModal({
  isOpen,
  onClose,
  onSaved,
  rule,
  mode,
}: AutomationModalProps) {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("pre_event");
  const [targetFilter, setTargetFilter] = useState("all");
  const [triggerType, setTriggerType] = useState("manual_broadcast");
  const [template, setTemplate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rule && mode === "edit") {
      setName(rule.name || "");
      setPhase(rule.triggerConfig?.phase || "pre_event");
      setTargetFilter(rule.triggerConfig?.targetFilter || "all");
      setTriggerType(rule.triggerType || "manual_broadcast");
      setTemplate(rule.actionConfig?.template || "");
      setIsActive(rule.isActive !== undefined ? rule.isActive : true);
    } else {
      setName("");
      setPhase("pre_event");
      setTargetFilter("all");
      setTriggerType("manual_broadcast");
      setTemplate(
        "✨ *DANNIA CAROLINA • MIS XV AÑOS* ✨\n\nEstimado/a *{{guest_name}}*,\n\n_“Hay momentos en la vida que se vuelven inolvidables cuando los compartimos con las personas que queremos.”_\n\nCon mucha alegría y emoción, quiero invitarte a celebrar conmigo la llegada de mis 15 años, una etapa llena de sueños, ilusiones y nuevos comienzos.\n\n📅 *Fecha:* Viernes 4 de Diciembre de 2026 • 6:00 PM\n📍 *Lugar:* Hotel Holiday Inn Managua\n🎟️ *Pases Reservados:* {{seats}} lugares de honor\n\nPuedes ver tu invitación formal, confirmar tu asistencia y recomendarnos tus canciones favoritas aquí:\n👉 {{magic_link}}\n\n_“Jehová cumplirá su propósito en mí; Tu misericordia, oh Jehová, es para siempre.” — Salmos 138:8_\n\n¡Espero verte y compartir juntos esta noche tan especial! 💕✨"
      );
      setIsActive(true);
    }
  }, [rule, mode, isOpen]);

  if (!isOpen) return null;

  const handleInsertTag = (tag: string) => {
    setTemplate((prev) => prev + " " + tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showErrorAlert("Campo Obligatorio", "Por favor ingresa un nombre para la regla.");
      return;
    }
    if (!template.trim()) {
      showErrorAlert("Plantilla Vacía", "Por favor ingresa el texto de la plantilla de WhatsApp.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: rule?.id,
        name: name.trim(),
        triggerType,
        triggerConfig: {
          phase,
          targetFilter,
          label:
            phase === "pre_event"
              ? "Pre-Evento"
              : phase === "event_day"
              ? "Día del Evento"
              : "Post-Evento",
        },
        actionType: "send_whatsapp",
        actionConfig: {
          category: phase === "pre_event" ? "invitation" : "broadcast",
          template: template.trim(),
        },
        isActive,
      };

      const url = "/api/admin/automations";
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar la regla");

      showToast(
        mode === "create" ? "Regla creada exitosamente" : "Regla actualizada correctamente",
        "success"
      );
      onSaved();
      onClose();
    } catch (err: any) {
      showErrorAlert("Error", err.message || "No se pudo guardar la regla.");
    } finally {
      setLoading(false);
    }
  };

  // Live preview mockup
  const previewText = template
    .replace(/{{guest_name}}/g, "Familia Scarleth Men")
    .replace(/{{seats}}/g, "2")
    .replace(/{{code}}/g, "VIP-DC-001")
    .replace(/{{table_info}}/g, "Mesa 01 • Dannia Carolina")
    .replace(/{{magic_link}}/g, "https://dannia.event/?code=VIP-DC-001")
    .replace(/{{pass_link}}/g, "https://dannia.event/?code=VIP-DC-001")
    .replace(/{{recuerdos_link}}/g, "https://dannia.event/recuerdos");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="animate-in fade-in zoom-in-95 duration-300 bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200/80 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0552AC]/10 text-[#0552AC] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[#0D1829]">
                {mode === "create" ? "Nueva Regla de Automatización" : "Editar Regla de Automatización"}
              </h3>
              <p className="text-xs text-slate-500">
                Plantilla personalizada de gala y condiciones de despacho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule Name */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Nombre de la Regla *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Recordatorio RSVP 14 días antes"
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#0552AC] focus:ring-2 focus:ring-[#0552AC]/15"
              />
            </div>

            {/* Event Phase */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-bold text-slate-700">Etapa del Evento</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full max-w-full truncate px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#0552AC]"
              >
                <option value="pre_event">Pre-Evento (Invitaciones &amp; RSVP)</option>
                <option value="event_day">Día del Evento (Pases &amp; Acceso)</option>
                <option value="post_event">Post-Evento (Agradecimientos &amp; Fotos)</option>
              </select>
            </div>

            {/* Target Filter */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-xs font-bold text-slate-700">Público Objetivo</label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full max-w-full truncate px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#0552AC]"
              >
                <option value="all">Todos los Invitados (105 comensales)</option>
                <option value="pending_rsvp">Solo Pendientes de RSVP</option>
                <option value="confirmed_only">Solo Confirmados (RSVP Aceptado)</option>
                <option value="with_phone">Solo Invitados con Teléfono</option>
              </select>
            </div>
          </div>

          {/* Template Editor */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Plantilla del Mensaje de WhatsApp *
              </label>
              <span className="text-[11px] text-slate-400">
                Usa *texto* para negritas y saltos de línea normales
              </span>
            </div>

            {/* Quick Variable Tags */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                Insertar variable:
              </span>
              {VARIABLE_TAGS.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertTag(v.tag)}
                  className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:border-[#0552AC] hover:text-[#0552AC] hover:bg-[#0552AC]/5 transition cursor-pointer"
                  title={`Ejemplo: ${v.example}`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <textarea
              rows={6}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Escribe el mensaje..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-[#0552AC] focus:ring-2 focus:ring-[#0552AC]/15 leading-relaxed resize-y"
            />
          </div>

          {/* Live Preview (WhatsApp Bubble) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                visibility
              </span>
              Vista Previa en WhatsApp (Ejemplo Dinámico)
            </span>
            <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-slate-300/80 shadow-inner flex flex-col items-start">
              <div className="max-w-md bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-xs text-slate-800 whitespace-pre-wrap leading-relaxed ring-1 ring-[#25D366]/30">
                {previewText}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 self-end">
                18:00 • Encriptado de extremo a extremo
              </span>
            </div>
          </div>

          {/* Active Switch */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">Estado de la Regla</span>
              <span className="text-[11px] text-slate-500">
                Si está activa, estará disponible para el despacho masivo e individual
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-[#0552AC]"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#0552AC] hover:bg-[#001F54] text-white text-xs font-bold shadow-md active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              <span>{mode === "create" ? "Crear Regla" : "Guardar Cambios"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
