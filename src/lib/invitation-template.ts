/**
 * Plantilla oficial de Invitación para los Quince Años de Dannia Carolina.
 * Contiene el texto exacto redactado por la quinceañera y el versículo bíblico Salmos 138:8.
 */
export const OFFICIAL_QUINCEANERA_TEMPLATE = `✨ *DANNIA CAROLINA • MIS XV AÑOS* ✨

Estimado/a *{{guest_name}}*,

_“Hay momentos en la vida que se vuelven inolvidables cuando los compartimos con las personas que queremos.”_

Con mucha alegría y emoción, quiero invitarte a celebrar conmigo la llegada de mis 15 años, una etapa llena de sueños, ilusiones y nuevos comienzos. Será un día muy especial para mí, y me encantaría contar con tu presencia para hacerlo aún más inolvidable.

📅 *Fecha:* Viernes 4 de Diciembre de 2026 • 6:00 PM
📍 *Lugar:* Hotel Holiday Inn Managua
🎟️ *Pases Reservados:* {{seats}} lugares de honor

Puedes ver tu invitación formal, confirmar tu asistencia y recomendarnos tus canciones favoritas aquí:
👉 {{magic_link}}

_“Jehová cumplirá su propósito en mí; Tu misericordia, oh Jehová, es para siempre.” — Salmos 138:8_

¡Espero verte y compartir juntos esta noche tan especial! 💕✨`;

/**
 * Sanitiza cualquier texto de plantilla de invitación.
 * Si detecta menciones de "Gala Real", "Salón Imperial" o el texto antiguo de AI slop,
 * lo reemplaza inmediatamente por la plantilla oficial de la quinceañera.
 */
export function sanitizeTemplateText(template?: string | null): string {
  if (!template || !template.trim()) {
    return OFFICIAL_QUINCEANERA_TEMPLATE;
  }

  const isOldSlop =
    /gala real/i.test(template) ||
    /salon imperial/i.test(template) ||
    /salón imperial/i.test(template) ||
    /gala imperial/i.test(template) ||
    /es un honor invitarte/i.test(template) ||
    /cuento real/i.test(template);

  if (isOldSlop) {
    return OFFICIAL_QUINCEANERA_TEMPLATE;
  }

  return template;
}
