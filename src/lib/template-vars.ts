/**
 * Sustituye variables dinámicas en la plantilla de invitación.
 * (Extraído de lib/evolution-api.ts de la app real, sin credenciales ni red.)
 */
export function substituteTemplateVariables(
  template: string,
  guest: {
    name?: string | null;
    firstName?: string | null;
    seats?: number | string;
    code?: string | null;
    tableInfo?: string | null;
  },
  origin: string
): string {
  const safeName = (guest.name || "Estimado Invitado").trim();
  const firstName = (guest.firstName || safeName.split(" ")[0] || "Estimado").trim();
  const seats = String(guest.seats || 1);
  const code = (guest.code || "").trim();
  const tableInfo = (guest.tableInfo || "Mesa por Asignar").trim();

  const magicLink = code ? `${origin}/?code=${encodeURIComponent(code)}` : origin;
  const passLink = code ? `${origin}/?code=${encodeURIComponent(code)}#pase-digital-modal` : origin;
  const recuerdosLink = `${origin}/recuerdos`;

  return template
    .replace(/{{guest_name}}/g, safeName)
    .replace(/{{first_name}}/g, firstName)
    .replace(/{{seats}}/g, seats)
    .replace(/{{code}}/g, code)
    .replace(/{{table_info}}/g, tableInfo)
    .replace(/{{magic_link}}/g, magicLink)
    .replace(/{{pass_link}}/g, passLink)
    .replace(/{{recuerdos_link}}/g, recuerdosLink);
}
