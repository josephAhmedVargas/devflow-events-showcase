/**
 * Safely extracts an invitation code from any raw QR scan, JSON payload, URL, or user input.
 * Handles:
 * - Plain codes: "VIP-DC-001", "vip-dc-001"
 * - JSON payloads: {"code":"VIP-DC-001","name":"...","seats":2,"table":1}
 * - Uppercase/lowercase/mixed-case JSON keys: {"CODE":"VIP-DC-001"}, {"codigo":"..."}, {"invitationCode":"..."}
 * - Double stringified JSON: '"{\"code\":\"VIP-DC-001\"}"'
 * - URLs: https://.../checkin?code=VIP-DC-001, /pass/VIP-DC-001, etc.
 * - Malformed JSON strings
 */
export function extractInvitationCode(rawInput: string | null | undefined): string {
  if (!rawInput) return "";
  let str = String(rawInput).trim();

  // 1. Strip surrounding quotes if double stringified
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }

  // Normalize escaped quotes if stringified JSON was passed as literal
  if (str.includes('\\"')) {
    str = str.replace(/\\"/g, '"');
  }

  // 2. Handle URL format
  if (str.startsWith("http://") || str.startsWith("https://")) {
    try {
      const url = new URL(str);
      const codeParam =
        url.searchParams.get("code") ||
        url.searchParams.get("c") ||
        url.searchParams.get("invitationCode") ||
        url.searchParams.get("id");
      if (codeParam) {
        return codeParam.trim().toUpperCase();
      }
      const parts = url.pathname.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart && /^(VIP-DC-\d+|DC-\d+-[A-Z0-9]+|[A-Z0-9_-]{4,25})$/i.test(lastPart)) {
        return lastPart.trim().toUpperCase();
      }
    } catch {
      // not a standard URL, continue
    }
  }

  // 3. Handle JSON object string
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === "object") {
        const keys = Object.keys(parsed);
        const matchKey = keys.find((k) =>
          /^(code|codigo|código|invitationcode|invitation_code|passcode|pass_code|id)$/i.test(k)
        );
        if (matchKey && parsed[matchKey]) {
          return String(parsed[matchKey]).trim().toUpperCase();
        }
      }
    } catch {
      // JSON parse failed, proceed to regex
    }
  }

  // 4. Regex extraction for JSON-like string (case-insensitive)
  const regexMatch = str.match(
    /(?:\\?["']?(?:code|codigo|código|invitationcode|invitation_code|passcode)\\?["']?\s*:\s*\\?["']?)([A-Za-z0-9_-]+)/i
  );
  if (regexMatch && regexMatch[1]) {
    return regexMatch[1].trim().toUpperCase();
  }

  // 5. Clean up any surrounding brackets/quotes and return uppercase
  const cleaned = str.replace(/^["'{\[\s]+|["'}\]\s]+$/g, "").trim();
  return cleaned.toUpperCase();
}

export function cleanTableName(tableName: string | null | undefined): string {
  if (!tableName) return "";
  // Removes prefixes like "Mesa 01 • ", "Mesa 1 - ", "Mesa 1 • ", etc.
  return tableName.replace(/^mesa\s*\d+\s*[•·\-\:]\s*/i, "").trim();
}

export function formatTableDisplay(
  tableNumber: number | string | null | undefined,
  tableName: string | null | undefined
): string {
  if (!tableNumber && !tableName) return "Por confirmar en recepción";

  const cleaned = cleanTableName(tableName);

  if (tableNumber && cleaned) {
    return `Mesa ${tableNumber} • ${cleaned}`;
  }
  if (tableNumber) {
    return `Mesa ${tableNumber}`;
  }
  return cleaned || "Por confirmar en recepción";
}

export async function downloadPassImage(passData: {
  firstName: string;
  lastName: string;
  invitationCode: string;
  maxSeats: number;
  tableNumber?: number | string | null;
  tableName?: string | null;
}): Promise<void> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 800;
  canvas.height = 1200;

  // 1. Background Gradient Gala (Royal Blue to Deep Midnight)
  const grad = ctx.createLinearGradient(0, 0, 0, 1200);
  grad.addColorStop(0, "#001F54");
  grad.addColorStop(0.5, "#0552AC");
  grad.addColorStop(1, "#001233");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 1200);

  // 2. Gold Border Frame
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 740, 1140);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(42, 42, 716, 1116);

  // 3. Header Texts
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 24px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("D'CAROL • MIS XV AÑOS", 400, 110);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText("Dannia Carolina", 400, 175);

  ctx.fillStyle = "#E8F0FE";
  ctx.font = "18px sans-serif";
  ctx.fillText("PASE DIGITAL OFICIAL DE ACCESO", 400, 215);

  // Line divider
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.beginPath();
  ctx.moveTo(150, 240);
  ctx.lineTo(650, 240);
  ctx.stroke();

  // 4. White Pass Card Interior
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(80, 270, 640, 780, 28);
  ctx.fill();

  // Guest Name
  ctx.fillStyle = "#4B5B76";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("INVITADO DISTINGUIDO DE GALA", 400, 330);

  ctx.fillStyle = "#001F54";
  ctx.font = "bold 36px Georgia, serif";
  ctx.fillText(`${passData.firstName} ${passData.lastName}`, 400, 380);

  // Seats & VIP
  ctx.fillStyle = "#0552AC";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(
    `${passData.maxSeats} ${passData.maxSeats === 1 ? "Lugar Reservado" : "Lugares Reservados"}`,
    400,
    425
  );

  // Mesa - Clean without duplication
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 28px Georgia, serif";
  ctx.fillText(
    passData.tableNumber ? `MESA ${passData.tableNumber}` : "MESA POR ASIGNAR",
    400,
    475
  );

  const cleanedTableName = cleanTableName(passData.tableName);
  if (cleanedTableName) {
    ctx.fillStyle = "#4B5B76";
    ctx.font = "16px sans-serif";
    ctx.fillText(cleanedTableName, 400, 505);
  }

  // Load and draw QR
  const qrImg = new Image();
  qrImg.crossOrigin = "anonymous";
  const qrData = JSON.stringify({
    code: passData.invitationCode,
    name: `${passData.firstName} ${passData.lastName}`,
    seats: passData.maxSeats,
    table: passData.tableNumber,
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  await new Promise((resolve) => {
    qrImg.onload = resolve;
    qrImg.onerror = resolve;
    qrImg.src = qrUrl;
  });

  // Draw QR Box
  ctx.fillStyle = "#F8FAFD";
  ctx.beginPath();
  ctx.roundRect(240, 540, 320, 320, 20);
  ctx.fill();
  ctx.strokeStyle = "#CBD5E1";
  ctx.stroke();

  ctx.drawImage(qrImg, 260, 560, 280, 280);

  // Code under QR
  ctx.fillStyle = "#001F54";
  ctx.font = "bold 26px monospace";
  ctx.fillText(passData.invitationCode, 400, 905);

  ctx.fillStyle = "#64748B";
  ctx.font = "14px sans-serif";
  ctx.fillText("Presentar en la recepción principal de entrada", 400, 935);

  // 5. Footer info
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 18px Georgia, serif";
  ctx.fillText("VIERNES 4 DE DICIEMBRE 2026 • 6:00 PM", 400, 1100);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "15px sans-serif";
  ctx.fillText("Hotel Holiday Inn Managua", 400, 1130);

  // Trigger Download
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `Pase_Acceso_DanniaXV_${passData.invitationCode}.png`;
  link.href = dataUrl;
  link.click();
}

export function sharePassWhatsApp(passData: {
  firstName: string;
  lastName: string;
  invitationCode: string;
  maxSeats: number;
  tableNumber?: number | string | null;
  tableName?: string | null;
}): void {
  const tableTitle = formatTableDisplay(passData.tableNumber, passData.tableName);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?code=${encodeURIComponent(passData.invitationCode)}`;
  const text = `✨ ¡Hola! Te comparto el pase de gala oficial para los Quince Años de Dannia Carolina en el Hotel Holiday Inn Managua (Viernes 4 de Diciembre, 6:00 PM):\n\nInvitado: ${passData.firstName} ${passData.lastName}\nLugares: ${passData.maxSeats}\nUbicación: ${tableTitle}\nCódigo de Acceso: ${passData.invitationCode}\n\nPuedes ver tu pase y confirmar aquí: ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}
