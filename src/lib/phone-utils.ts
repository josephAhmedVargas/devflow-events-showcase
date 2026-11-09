/**
 * phone-utils.ts
 * Utilidades de sanitización, validación y formateo de números telefónicos
 * optimizados para integración con WhatsApp y Evolution API (v1 / v2).
 *
 * Casos soportados:
 * - Caracteres extraños o errores de teclado como "¡+505 84298767"
 * - Nicaragua (+505, 8 dígitos nacionales)
 * - Costa Rica (+506, 8 dígitos nacionales)
 * - Estados Unidos / Canadá (+1, 10 dígitos nacionales)
 * - Guiones, espacios, paréntesis, puntos, prefijos internacionales 00
 * - Números locales de 8 dígitos sin prefijo (asume +505 por defecto)
 */

export interface ParsedPhone {
  raw: string;
  hasPhone: boolean;
  isValid: boolean;
  cleanDigits: string;
  evolutionApiNumber: string | null; // e.g. "50584298767" (para Evolution API y wa.me)
  e164: string | null;               // e.g. "+50584298767"
  formattedDisplay: string;         // e.g. "+505 8429-8767"
  countryCode: string | null;        // e.g. "505", "506", "1"
  nationalNumber: string | null;     // e.g. "84298767"
  countryName: string;               // e.g. "Nicaragua", "Costa Rica", "Estados Unidos / Canadá"
  countryFlag: string;               // e.g. "🇳🇮", "🇨🇷", "🇺🇸"
  waUrl: string | null;              // https://wa.me/50584298767
}

const COUNTRY_DEFINITIONS: Array<{
  code: string;
  name: string;
  flag: string;
  nationalLength: number | number[];
  displayFormat: (nat: string) => string;
}> = [
  {
    code: "505",
    name: "Nicaragua",
    flag: "🇳🇮",
    nationalLength: 8,
    displayFormat: (nat) => `+505 ${nat.slice(0, 4)}-${nat.slice(4)}`,
  },
  {
    code: "506",
    name: "Costa Rica",
    flag: "🇨🇷",
    nationalLength: 8,
    displayFormat: (nat) => `+506 ${nat.slice(0, 4)}-${nat.slice(4)}`,
  },
  {
    code: "1",
    name: "Estados Unidos / Canadá",
    flag: "🇺🇸",
    nationalLength: 10,
    displayFormat: (nat) => `+1 (${nat.slice(0, 3)}) ${nat.slice(3, 6)}-${nat.slice(6)}`,
  },
  {
    code: "502",
    name: "Guatemala",
    flag: "🇬🇹",
    nationalLength: 8,
    displayFormat: (nat) => `+502 ${nat.slice(0, 4)}-${nat.slice(4)}`,
  },
  {
    code: "503",
    name: "El Salvador",
    flag: "🇸🇻",
    nationalLength: 8,
    displayFormat: (nat) => `+503 ${nat.slice(0, 4)}-${nat.slice(4)}`,
  },
  {
    code: "504",
    name: "Honduras",
    flag: "🇭🇳",
    nationalLength: 8,
    displayFormat: (nat) => `+504 ${nat.slice(0, 4)}-${nat.slice(4)}`,
  },
  {
    code: "507",
    name: "Panamá",
    flag: "🇵🇦",
    nationalLength: 8,
    displayFormat: (nat) => `+507 ${nat.slice(0, 4)}-${nat.slice(4)}`,
  },
  {
    code: "52",
    name: "México",
    flag: "🇲🇽",
    nationalLength: 10,
    displayFormat: (nat) => `+52 ${nat.slice(0, 2)} ${nat.slice(2, 6)}-${nat.slice(6)}`,
  },
  {
    code: "34",
    name: "España",
    flag: "🇪🇸",
    nationalLength: 9,
    displayFormat: (nat) => `+34 ${nat.slice(0, 3)} ${nat.slice(3, 6)} ${nat.slice(6)}`,
  },
];

/**
 * Regex estricto para número válido para Evolution API:
 * - Empieza con dígito 1-9 (código de país sin signo +)
 * - Solo dígitos
 * - Longitud entre 9 y 15 dígitos según norma ITU E.164
 */
export const EVOLUTION_API_PHONE_REGEX = /^[1-9]\d{8,14}$/;

/**
 * Sanitiza cualquier texto crudo para obtener solo dígitos limpios con código de país.
 */
export function sanitizeRawPhoneString(raw: string | null | undefined): string {
  if (!raw) return "";

  // 1. Quitar signos de apertura/cierre de admiración, interrogación, almohadillas, etc.
  // Ej: ¡+505 84298767! -> +505 84298767
  let cleaned = raw.replace(/[¡!¿?#*@$%\^&=_~`|\\/\[\]{}<>]/g, "").trim();

  // 2. Si empieza por 00 (código de salida internacional europeo/latam), reemplazar por +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // 3. Extraer si tenía un signo + explícito
  const hasPlus = cleaned.includes("+");

  // 4. Quedarse solo con dígitos
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (!digitsOnly) return "";

  // 5. Si tenía +, usar los dígitos tal cual
  if (hasPlus) {
    return digitsOnly;
  }

  // 6. Si no tenía +, analizar longitud:
  // Si tiene 8 dígitos (formato estándar de Nicaragua), autocompletar código 505
  if (digitsOnly.length === 8) {
    return `505${digitsOnly}`;
  }

  // Si tiene 10 dígitos y empieza por códigos de área de USA (o no empieza con 505),
  // y no tiene 1 adelante:
  // Si ya tiene código de país (ej. 50584298767 tiene 11 dígitos, 50688881234 tiene 11 dígitos)
  return digitsOnly;
}

/**
 * Parsea y descompone un número de teléfono en todos sus componentes para la UI y Evolution API.
 */
export function parsePhoneNumber(rawInput: string | null | undefined): ParsedPhone {
  const raw = (rawInput ?? "").trim();

  if (!raw) {
    return {
      raw: "",
      hasPhone: false,
      isValid: false,
      cleanDigits: "",
      evolutionApiNumber: null,
      e164: null,
      formattedDisplay: "Sin teléfono",
      countryCode: null,
      nationalNumber: null,
      countryName: "Desconocido",
      countryFlag: "📱",
      waUrl: null,
    };
  }

  const cleanDigits = sanitizeRawPhoneString(raw);

  if (!cleanDigits || cleanDigits.length < 8) {
    return {
      raw,
      hasPhone: false,
      isValid: false,
      cleanDigits,
      evolutionApiNumber: null,
      e164: null,
      formattedDisplay: raw,
      countryCode: null,
      nationalNumber: null,
      countryName: "Inválido",
      countryFlag: "⚠️",
      waUrl: null,
    };
  }

  // Detectar país por prefijo
  let matchedCountry = null;
  let nationalNumber = cleanDigits;
  let countryCode = null;

  // Ordenar países por longitud de código descendente (ej: 505, 506 antes de 1)
  const sortedCountries = [...COUNTRY_DEFINITIONS].sort(
    (a, b) => b.code.length - a.code.length
  );

  for (const c of sortedCountries) {
    if (cleanDigits.startsWith(c.code)) {
      const rest = cleanDigits.slice(c.code.length);
      const expectedLengths = Array.isArray(c.nationalLength)
        ? c.nationalLength
        : [c.nationalLength];

      if (expectedLengths.includes(rest.length)) {
        matchedCountry = c;
        countryCode = c.code;
        nationalNumber = rest;
        break;
      }
    }
  }

  // Si no hizo match exacto con la lista pero tiene longitud razonable (8-15 dígitos)
  const isValid = EVOLUTION_API_PHONE_REGEX.test(cleanDigits);
  const evolutionApiNumber = isValid ? cleanDigits : null;
  const e164 = isValid ? `+${cleanDigits}` : null;

  let formattedDisplay: string;
  let countryName = "Internacional";
  let countryFlag = "🌐";

  if (matchedCountry) {
    formattedDisplay = matchedCountry.displayFormat(nationalNumber);
    countryName = matchedCountry.name;
    countryFlag = matchedCountry.flag;
  } else if (cleanDigits.length >= 8) {
    formattedDisplay = `+${cleanDigits}`;
  } else {
    formattedDisplay = raw;
  }

  const waUrl = evolutionApiNumber
    ? `https://wa.me/${evolutionApiNumber}`
    : null;

  return {
    raw,
    hasPhone: true,
    isValid,
    cleanDigits,
    evolutionApiNumber,
    e164,
    formattedDisplay,
    countryCode,
    nationalNumber,
    countryName,
    countryFlag,
    waUrl,
  };
}

/**
 * Normaliza un número para Evolution API (e.g. "50584298767").
 * Devuelve null si no hay teléfono o no es válido.
 */
export function normalizePhoneForEvolutionApi(phone: string | null | undefined): string | null {
  const parsed = parsePhoneNumber(phone);
  return parsed.evolutionApiNumber;
}

/**
 * Normaliza un número al formato internacional E.164 (e.g. "+50584298767").
 */
export function formatPhoneE164(phone: string | null | undefined): string | null {
  const parsed = parsePhoneNumber(phone);
  return parsed.e164;
}

/**
 * Formatea un número para visualización amigable en la UI (e.g. "+505 8429-8767").
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  const parsed = parsePhoneNumber(phone);
  return parsed.formattedDisplay;
}

/**
 * Determina si el registro no tiene teléfono asignado.
 */
export function isPhoneMissing(phone: string | null | undefined): boolean {
  if (!phone) return true;
  const trimmed = phone.trim();
  if (!trimmed) return true;
  // Solo caracteres no numéricos
  const digits = trimmed.replace(/\D/g, "");
  return digits.length === 0;
}
