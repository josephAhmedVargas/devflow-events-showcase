/**
 * API simulada de DevFlow Events.
 *
 * Intercepta `fetch("/api/...")` en el navegador y responde con la misma forma
 * JSON que las rutas reales de Next.js + Drizzle, pero leyendo y escribiendo
 * en localStorage. Así los componentes de producción funcionan sin tocarse y
 * la demo no consume ni un solo servicio (BD, R2, WhatsApp, auth).
 */
"use client";

import { getDb, mutate, newId } from "./db";
import { EVENT_ID, type DemoDb } from "./seed";
import { extractInvitationCode, formatTableDisplay } from "@/lib/pass-utils";
import { sanitizeTemplateText } from "@/lib/invitation-template";
import { LIFE_STAGES, analyzeFileMetadata, getStageFromYear } from "@/lib/exif-parser";
import { substituteTemplateVariables } from "@/lib/template-vars";

type Handler = (ctx: Ctx) => Promise<Response> | Response;
interface Ctx {
  method: string;
  url: URL;
  params: URLSearchParams;
  req: Request;
  json: () => Promise<any>;
  form: () => Promise<FormData>;
}

const nowIso = () => new Date().toISOString();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-DevFlow-Demo": "localStorage" },
  });
}

/* ═══════════════ Relational helpers (equivalentes a `with: {...}`) ═══════════════ */

function personOf(db: DemoDb, g: any) {
  return db.people.find((p) => p.id === g.personId) || null;
}
function rsvpOf(db: DemoDb, g: any) {
  return db.rsvps.find((r) => r.eventGuestId === g.id) || null;
}
function assignmentOf(db: DemoDb, g: any) {
  return db.assignments.find((a) => a.eventGuestId === g.id) || null;
}
function tableById(db: DemoDb, id: string | null | undefined) {
  return db.tables.find((t) => t.id === id) || null;
}

function guestFull(db: DemoDb, g: any) {
  const a = assignmentOf(db, g);
  return {
    ...g,
    person: personOf(db, g),
    rsvp: rsvpOf(db, g),
    tableAssignment: a ? { ...a, table: tableById(db, a.tableId) } : null,
    groupMemberships: [],
    members: [],
    invitation: db.invitations[g.id] || null,
  };
}

function guestFlat(db: DemoDb, g: any) {
  const p = personOf(db, g);
  const t = tableById(db, assignmentOf(db, g)?.tableId);
  return {
    guestId: g.id,
    invitationCode: g.invitationCode,
    firstName: p?.firstName || "",
    lastName: p?.lastName || "",
    maxSeats: g.maxSeats,
    confirmedSeats: g.confirmedSeats,
    isVip: g.isVip,
    tableNumber: t?.tableNumber ?? null,
    tableName: t?.tableName ?? null,
    tableZone: t?.zone ?? null,
    zone: t?.zone ?? null,
  };
}

function matchesQuery(db: DemoDb, g: any, q: string) {
  const p = personOf(db, g);
  const needle = q.toLowerCase();
  return (
    g.invitationCode.toLowerCase().includes(needle) ||
    (p?.firstName || "").toLowerCase().includes(needle) ||
    (p?.lastName || "").toLowerCase().includes(needle)
  );
}

function seatedAt(db: DemoDb, tableId: string) {
  return db.assignments
    .filter((a) => a.tableId === tableId)
    .reduce((acc, a) => {
      if (a.assignedSeats > 0) return acc + a.assignedSeats;
      const g = db.guests.find((x) => x.id === a.eventGuestId);
      return acc + (g?.confirmedSeats > 0 ? g.confirmedSeats : g?.maxSeats || 1);
    }, 0);
}

function currentTimelineItem(db: DemoDb) {
  const sorted = [...db.timeline].sort((a, b) => a.sortOrder - b.sortOrder);
  const current =
    sorted.find((t) => t.status === "current" || t.id === db.liveState.currentTimelineItemId) || sorted[0];
  const idx = current ? sorted.indexOf(current) : -1;
  return { sorted, current, next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null };
}

const hhmm = (d: string) =>
  new Date(d).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Managua" });

/** Comprime una imagen subida a JPEG ligero para que quepa en localStorage. */
async function fileToDataUrl(file: File, maxSide = 1100, quality = 0.78): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }
}

async function hashFile(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ═══════════════════════════════ PUBLIC ROUTES ═══════════════════════════════ */

const rsvp: Record<string, Handler> = {
  GET: ({ params }) => {
    const db = getDb();
    const code = extractInvitationCode(params.get("code")?.trim());
    if (!code) return json({ error: "Código requerido" }, 400);
    const g = db.guests.find((x) => x.invitationCode === code);
    if (!g) return json({ error: "Invitación no encontrada." }, 404);
    const p = personOf(db, g);
    const r = rsvpOf(db, g);
    return json({
      success: true,
      guest: {
        id: g.id,
        invitationCode: g.invitationCode,
        firstName: p?.firstName,
        lastName: p?.lastName,
        fullName: `${p?.firstName} ${p?.lastName}`,
        maxSeats: g.maxSeats,
        confirmedSeats: g.confirmedSeats,
        status: g.status,
        rsvp: r
          ? {
              response: r.response,
              confirmedCount: r.confirmedCount,
              attendingCeremony: r.attendingCeremony,
              attendingReception: r.attendingReception,
              guestMessage: r.guestMessage,
              dietaryNotes: r.dietaryNotes,
              songRequest: r.songRequest,
            }
          : null,
      },
    });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    if (!b.code) return json({ error: "El código de invitación es requerido." }, 400);
    const code = extractInvitationCode(b.code);
    if (!code) return json({ error: "El código de invitación es inválido." }, 400);
    const db = getDb();
    const g = db.guests.find((x) => x.invitationCode === code);
    if (!g) {
      return json({ error: "Código de invitación no encontrado. Verifica tu código en tu invitación impresa o digital." }, 404);
    }
    const response = b.response === "declined" ? "declined" : "attending";
    const count = Math.min(Math.max(1, Number(b.confirmedCount) || 1), g.maxSeats);
    mutate((d) => {
      const guest = d.guests.find((x) => x.id === g.id)!;
      let r = d.rsvps.find((x) => x.eventGuestId === g.id);
      if (!r) {
        r = { id: newId("rsvp"), eventId: EVENT_ID, eventGuestId: g.id, createdAt: nowIso() };
        d.rsvps.push(r);
      }
      Object.assign(r, {
        response,
        confirmedCount: count,
        attendingCeremony: Boolean(b.attendingCeremony),
        attendingReception: Boolean(b.attendingReception),
        guestMessage: b.guestMessage || null,
        dietaryNotes: b.dietaryNotes || null,
        songRequest: b.songRequest || null,
        updatedAt: nowIso(),
      });
      guest.status = response === "attending" ? "confirmed" : "declined";
      guest.confirmedSeats = response === "attending" ? count : 0;
      guest.updatedAt = nowIso();
    });
    const p = personOf(db, g);
    return json({ success: true, guestName: `${p?.firstName} ${p?.lastName}`, response, confirmedCount: count });
  },
};

const tableLookup: Record<string, Handler> = {
  GET: ({ params }) => {
    const raw = params.get("q")?.trim();
    if (!raw || raw.length < 2) return json({ error: "Ingresa al menos 2 caracteres para buscar." }, 400);
    const q = extractInvitationCode(raw) || raw;
    const db = getDb();
    const results = db.guests.filter((g) => matchesQuery(db, g, q)).slice(0, 5).map((g) => guestFlat(db, g));
    return json({ results });
  },
};

const guestbook: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    const messages = db.messages
      .filter((m) => m.moderationStatus === "approved")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20)
      .map(({ id, authorName, messageText, createdAt }) => ({ id, authorName, messageText, createdAt }));
    return json({ messages });
  },
  POST: async ({ json: body }) => {
    const { authorName, messageText } = await body();
    if (!authorName || !messageText) return json({ error: "Por favor escribe tu nombre y un mensaje." }, 400);
    const message = mutate((d) => {
      const m = {
        id: newId("msg"),
        eventId: EVENT_ID,
        guestId: null,
        authorName: String(authorName).trim().slice(0, 100),
        messageText: String(messageText).trim().slice(0, 500),
        moderationStatus: "approved",
        isFeatured: false,
        displayedOnWall: true,
        likesCount: 0,
        createdAt: nowIso(),
      };
      d.messages.unshift(m);
      return m;
    });
    return json({ success: true, message });
  },
};

const photosPublic: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    const photos = db.photos
      .filter((p) => p.moderationStatus === "approved" || p.isFeatured)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30)
      .map((p) => ({
        id: p.id,
        url: p.asset?.publicUrl,
        uploaderName: p.uploaderName || "Invitado de Gala",
        caption: p.caption || "",
        isFeatured: p.isFeatured,
        createdAt: p.createdAt,
      }));
    return json({ success: true, photos });
  },
};

const photosUpload: Record<string, Handler> = {
  POST: async ({ form }) => {
    const fd = await form();
    const file = fd.get("file") as File | null;
    const uploaderName = (fd.get("uploaderName") as string) || "Invitado de Gala";
    const caption = (fd.get("caption") as string) || "";
    const category = (fd.get("category") as string) || "general";
    const publicUrl = file
      ? await fileToDataUrl(file)
      : "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800";
    const needsModeration = getDb().settings.photoModerationEnabled ?? true;
    const status = needsModeration ? "pending" : "approved";
    const photo = mutate((d) => {
      const id = newId("pho");
      const p = {
        id,
        eventId: EVENT_ID,
        assetId: `ast-${id}`,
        asset: { id: `ast-${id}`, publicUrl, thumbnailUrl: publicUrl, mimeType: "image/jpeg" },
        uploaderGuestId: null,
        uploaderName,
        caption: caption ? `[${category}] ${caption}` : `Foto de ${uploaderName}`,
        source: "guest_upload",
        moderationStatus: status,
        isFeatured: false,
        liveWallDisplayed: !needsModeration,
        likesCount: 0,
        takenAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      d.photos.unshift(p);
      return p;
    });
    return json({
      success: true,
      message: needsModeration
        ? "¡Foto recibida! Pasará al proyector en cuanto el coordinador la apruebe."
        : "¡Foto publicada directamente en la Gran Pantalla!",
      photo: { id: photo.id, publicUrl, uploaderName, caption, status },
    });
  },
};

const stagesPublic: Record<string, Handler> = {
  GET: () => {
    const { stages } = getDb();
    const photos = [...stages.photos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return json({ success: true, title: stages.title, subtitle: stages.subtitle, stages: LIFE_STAGES, photos, count: photos.length });
  },
};

function checkinStats(db: DemoDb) {
  const totalCapacity = db.event.metadata?.totalCapacity || 376;
  const checkedInSeats = db.checkins.reduce((acc, c) => acc + (c.checkedInCount || 0), 0);
  return {
    totalCapacity,
    checkedInSeats,
    passesScanned: db.checkins.length,
    attendancePercentage: Math.round((checkedInSeats / totalCapacity) * 100),
  };
}

const checkin: Record<string, Handler> = {
  GET: ({ params }) => {
    const db = getDb();
    const search = params.get("q")?.trim();
    const clean = search ? extractInvitationCode(search) || search : "";
    if (clean && clean.length >= 2) {
      const results = db.guests
        .filter((g) => matchesQuery(db, g, clean))
        .slice(0, 10)
        .map((g) => {
          const c = db.checkins.find((x) => x.eventGuestId === g.id);
          return {
            ...guestFlat(db, g),
            checkinId: c?.id ?? null,
            checkedInAt: c?.checkedInAt ?? null,
            checkinStation: c?.checkinStation ?? null,
            checkedInCount: c?.checkedInCount ?? null,
          };
        });
      return json({ stats: checkinStats(db), results });
    }
    const recentCheckins = [...db.checkins]
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
      .slice(0, 25)
      .map((c) => {
        const g = db.guests.find((x) => x.id === c.eventGuestId);
        const f = g ? guestFlat(db, g) : ({} as any);
        return {
          checkinId: c.id,
          checkedInAt: c.checkedInAt,
          checkinStation: c.checkinStation,
          checkedInCount: c.checkedInCount,
          checkinMethod: c.checkinMethod,
          invitationCode: f.invitationCode,
          firstName: f.firstName,
          lastName: f.lastName,
          isVip: f.isVip,
          tableNumber: f.tableNumber,
          tableName: f.tableName,
        };
      });
    return json({ stats: checkinStats(db), recentCheckins });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    const raw = String(b.code || "").trim();
    const code = extractInvitationCode(raw);
    const station = b.station || "Puerta Principal";
    const method = b.method || "qr_scan";
    if (!code && !b.guestId) {
      return json({ error: "Debes escanear un código QR válido o proporcionar el identificador de invitado." }, 400);
    }
    const db = getDb();
    const g = b.guestId ? db.guests.find((x) => x.id === b.guestId) : db.guests.find((x) => x.invitationCode === code);
    if (!g) {
      return json(
        { success: false, status: "not_found", message: `Código no registrado (${code || raw || b.guestId}). Por favor verificar en la lista oficial de anfitriones.` },
        404
      );
    }
    const f = guestFlat(db, g);
    const p = personOf(db, g);
    const guestPayload = {
      guestId: g.id,
      invitationCode: g.invitationCode,
      fullName: `${p?.firstName} ${p?.lastName}`,
      maxSeats: g.maxSeats,
      confirmedSeats: g.confirmedSeats,
      tableNumber: f.tableNumber,
      tableName: f.tableName,
      zone: f.zone,
      isVip: g.isVip,
    };
    const existing = db.checkins.find((c) => c.eventGuestId === g.id);
    if (existing) {
      return json(
        {
          success: false,
          status: "already_checked_in",
          message: "⚠️ ALERTA: Este pase ya fue utilizado previamente.",
          guest: guestPayload,
          previousCheckin: {
            checkedInAt: existing.checkedInAt,
            checkinStation: existing.checkinStation,
            checkedInCount: existing.checkedInCount,
            checkinMethod: existing.checkinMethod,
          },
        },
        409
      );
    }
    const seats = (b.count ? Number(b.count) : null) || g.confirmedSeats || g.maxSeats || 1;
    const record = mutate((d) => {
      const c = {
        id: newId("chk"),
        eventId: EVENT_ID,
        eventGuestId: g.id,
        checkinStation: station,
        checkedInCount: seats,
        checkinMethod: method,
        notes: b.notes || null,
        checkedInAt: nowIso(),
      };
      d.checkins.push(c);
      d.liveState.liveCheckinCount = (d.liveState.liveCheckinCount || 0) + seats;
      return c;
    });
    return json({
      success: true,
      status: "success",
      message: `¡Acceso Válido! Bienvenido(a) Familia ${p?.lastName}`,
      guest: { ...guestPayload, enteredSeats: seats },
      checkin: record,
    });
  },
};

const playlist: Record<string, Handler> = {
  GET: () => {
    const pl = getDb().playlist;
    return json({
      success: true,
      playlist: {
        id: pl.id,
        title: pl.title,
        spotifyUrl: pl.spotifyUrl,
        description: pl.description,
        tracks: [...pl.tracks].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
      },
    });
  },
  POST: async ({ json: body }) => {
    const { title, artist, guestName, guestCode } = await body();
    if (!title?.trim()) return json({ error: "El título de la canción es requerido." }, 400);
    if (!artist?.trim()) return json({ error: "El artista o grupo es requerido." }, 400);
    const name = (guestName || "Invitado con Afecto").trim();
    const track = mutate((d) => {
      const t = {
        id: newId("tr"),
        playlistId: d.playlist.id,
        title: title.trim(),
        artist: artist.trim(),
        album: null,
        sortOrder: 999,
        requestedByGuestName: name,
        createdAt: nowIso(),
      };
      d.playlist.tracks.push(t);
      if (guestCode) {
        const g = d.guests.find((x) => x.invitationCode === String(guestCode).trim().toUpperCase());
        const r = g && d.rsvps.find((x) => x.eventGuestId === g.id);
        if (r && !r.songRequest) r.songRequest = `${t.title} — ${t.artist}`;
      }
      return t;
    });
    return json({
      success: true,
      message: `¡Gracias ${name}! Tu canción "${track.title}" se agregó a las recomendaciones para Dannia.`,
      track,
    });
  },
};

const telemetry: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    const { current, next } = currentTimelineItem(db);
    const checkedInSeats = db.checkins.reduce((a, c) => a + (c.checkedInCount || 0), 0);
    const confirmedSeats = db.guests
      .filter((g) => g.status === "confirmed" || g.confirmedSeats > 0)
      .reduce((a, g) => a + (g.confirmedSeats || 1), 0);
    return json({
      success: true,
      stage: {
        title: current?.title || "Recepción & Alfombra Real",
        time: current ? hhmm(current.startTime) : "18:00",
        description: current?.description || null,
        status: current?.status || "current",
      },
      nextStage: next ? { title: next.title, time: hhmm(next.startTime), description: next.description } : null,
      counters: {
        photos: db.photos.filter((p) => p.moderationStatus === "approved").length,
        messages: db.messages.filter((m) => m.moderationStatus === "approved").length,
        inSalon: checkedInSeats > 0 ? checkedInSeats : confirmedSeats,
      },
      announcement: db.liveState.announcementText || null,
    });
  },
};

/* ═══════════════════════════════ ADMIN ROUTES ═══════════════════════════════ */

function isPhoneMissing(phone: string | null | undefined) {
  return !phone || String(phone).replace(/\D/g, "").length < 8;
}

const adminGuests: Record<string, Handler> = {
  GET: ({ params }) => {
    const db = getDb();
    const q = (params.get("q") || "").toLowerCase().trim();
    const status = params.get("status") || "all";
    const tableId = params.get("tableId") || "all";
    const phoneStatus = params.get("phoneStatus") || "all";
    const all = [...db.guests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((g) => guestFull(db, g));
    let filtered = all.filter((g) => {
      if (!q) return true;
      const name = `${g.person?.firstName || ""} ${g.person?.lastName || ""}`.toLowerCase();
      return name.includes(q) || g.invitationCode.toLowerCase().includes(q) || (g.person?.phone || "").toLowerCase().includes(q);
    });
    if (status !== "all") filtered = filtered.filter((g) => g.status === status);
    if (tableId === "unassigned") filtered = filtered.filter((g) => !g.tableAssignment);
    else if (tableId !== "all") filtered = filtered.filter((g) => g.tableAssignment?.tableId === tableId);
    if (phoneStatus === "missing") filtered = filtered.filter((g) => isPhoneMissing(g.person?.phone));
    else if (phoneStatus === "with_phone") filtered = filtered.filter((g) => !isPhoneMissing(g.person?.phone));
    return json({ success: true, guests: filtered, totalCount: all.length, filteredCount: filtered.length });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    if (!b.firstName || !b.lastName) return json({ error: "Nombre y apellido son requeridos" }, 400);
    const result = mutate((d) => {
      const isVip = Boolean(b.isVip) || b.tier === "vip";
      const suffix = Math.floor(100 + Math.random() * 900);
      const invitationCode = `${isVip ? "VIP-DC" : "DC-2026"}-${suffix}`;
      const person = {
        id: newId("per"),
        firstName: b.firstName.trim(),
        lastName: b.lastName.trim(),
        phone: b.phone ? String(b.phone).trim() : null,
        email: b.email ? String(b.email).trim().toLowerCase() : null,
        notes: b.dietaryNotes || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const status = b.status || "invited";
      const guest = {
        id: newId("gst"),
        eventId: EVENT_ID,
        personId: person.id,
        invitationCode,
        status,
        tier: isVip ? "vip" : b.tier || "guest",
        maxSeats: Number(b.maxSeats) || 1,
        confirmedSeats: status === "confirmed" ? Math.max(1, Number(b.confirmedSeats) || 1) : Number(b.confirmedSeats) || 0,
        isVip,
        internalNotes: b.dietaryNotes ? `Dieta/Requerimiento: ${b.dietaryNotes}` : null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      d.people.push(person);
      d.guests.push(guest);
      if (b.tableId) {
        d.assignments.push({
          id: newId("asg"),
          eventId: EVENT_ID,
          tableId: b.tableId,
          eventGuestId: guest.id,
          assignedSeats: guest.confirmedSeats > 0 ? guest.confirmedSeats : Math.max(1, guest.maxSeats),
          capacityOverride: false,
          assignedBy: "Admin D'CAROL",
          assignedAt: nowIso(),
        });
      }
      return { ...guest, person, invitationCode, passNumber: `PASS-DC-${String(suffix).padStart(4, "0")}` };
    });
    return json({ success: true, message: "Invitado registrado exitosamente", guest: result });
  },
  PATCH: async ({ json: body }) => {
    const b = await body();
    if (!b.guestId) return json({ error: "guestId es requerido" }, 400);
    if (!getDb().guests.some((g) => g.id === b.guestId)) return json({ error: "Invitado no encontrado" }, 404);
    mutate((d) => {
      const g = d.guests.find((x) => x.id === b.guestId)!;
      const p = d.people.find((x) => x.id === g.personId);
      if (p && (b.firstName || b.lastName || b.phone !== undefined)) {
        if (b.firstName) p.firstName = b.firstName.trim();
        if (b.lastName) p.lastName = b.lastName.trim();
        if (b.phone !== undefined) p.phone = b.phone ? String(b.phone).trim() : null;
        p.updatedAt = nowIso();
      }
      if (b.status) g.status = b.status;
      if (b.maxSeats !== undefined) g.maxSeats = Number(b.maxSeats);
      if (b.confirmedSeats !== undefined) g.confirmedSeats = Number(b.confirmedSeats);
      if (b.isVip !== undefined) g.isVip = Boolean(b.isVip);
      if (b.notes !== undefined) g.internalNotes = b.notes;
      g.updatedAt = nowIso();
      if (b.tableId !== undefined) {
        d.assignments = d.assignments.filter((a) => a.eventGuestId !== g.id);
        if (b.tableId) {
          const seats =
            Number(b.confirmedSeats) > 0 ? Number(b.confirmedSeats) : Number(b.maxSeats) > 0 ? Number(b.maxSeats) : g.confirmedSeats > 0 ? g.confirmedSeats : Math.max(1, g.maxSeats);
          d.assignments.push({
            id: newId("asg"),
            eventId: EVENT_ID,
            tableId: b.tableId,
            eventGuestId: g.id,
            assignedSeats: seats,
            capacityOverride: false,
            assignedBy: "Admin D'CAROL",
            assignedAt: nowIso(),
          });
        }
      }
    });
    return json({ success: true, message: "Invitado actualizado correctamente" });
  },
  DELETE: ({ params }) => {
    const id = params.get("guestId");
    if (!id) return json({ error: "guestId es requerido" }, 400);
    const g = getDb().guests.find((x) => x.id === id);
    if (!g) return json({ error: "Invitado no encontrado" }, 404);
    mutate((d) => {
      d.assignments = d.assignments.filter((a) => a.eventGuestId !== id);
      d.rsvps = d.rsvps.filter((r) => r.eventGuestId !== id);
      d.checkins = d.checkins.filter((c) => c.eventGuestId !== id);
      d.guests = d.guests.filter((x) => x.id !== id);
      d.people = d.people.filter((p) => p.id !== g.personId);
      delete d.invitations[id];
    });
    return json({ success: true, message: "Invitado eliminado exitosamente" });
  },
};

const adminTables: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    const tables = [...db.tables]
      .sort((a, b) => a.tableNumber - b.tableNumber)
      .map((t) => ({
        ...t,
        assignments: db.assignments
          .filter((a) => a.tableId === t.id)
          .map((a) => {
            const g = db.guests.find((x) => x.id === a.eventGuestId);
            return { ...a, guest: g ? { ...g, person: personOf(db, g) } : null };
          }),
      }));
    const unassigned = [...db.guests]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((g) => !assignmentOf(db, g))
      .map((g) => ({ ...g, person: personOf(db, g), tableAssignment: null }));
    const totalCapacity = tables.reduce((a, t) => a + (t.capacity || 0), 0);
    const totalSeated = tables.reduce((a, t) => a + seatedAt(db, t.id), 0);
    return json({
      success: true,
      tables,
      unassignedConfirmedGuests: unassigned,
      unassignedGuests: unassigned,
      metrics: {
        totalTables: tables.length,
        totalCapacity,
        totalSeated,
        availableSeats: Math.max(0, totalCapacity - totalSeated),
        unassignedCount: unassigned.length,
      },
    });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    const table = mutate((d) => {
      let num = Number(b.tableNumber);
      if (!num) num = Math.max(0, ...d.tables.map((t) => t.tableNumber)) + 1;
      const t = {
        id: newId("tbl"),
        eventId: EVENT_ID,
        tableNumber: num,
        tableName: b.tableName || (b.isVip ? "Mesa de Honor VIP" : `Mesa ${String(num).padStart(2, "0")}`),
        capacity: Number(b.capacity) || 10,
        zone: b.zone || "Salón Principal",
        isVip: Boolean(b.isVip),
        isActive: true,
        notes: b.notes ? String(b.notes).trim() : null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      d.tables.push(t);
      return t;
    });
    return json({ success: true, message: "Mesa creada exitosamente", table });
  },
  PATCH: async ({ json: body }) => {
    const b = await body();
    if (!b.tableId) return json({ error: "tableId es requerido" }, 400);
    const db = getDb();
    const table = tableById(db, b.tableId);
    if (!table) return json({ error: "Mesa no encontrada" }, 404);

    if (b.action === "assign_guest") {
      if (!b.guestId) return json({ error: "guestId es requerido" }, 400);
      const current = seatedAt(db, table.id);
      let seats = Number(b.seats);
      if (!seats || seats <= 0) {
        const g = db.guests.find((x) => x.id === b.guestId);
        seats = g ? (g.confirmedSeats > 0 ? g.confirmedSeats : g.maxSeats || 1) : 1;
      }
      if (current + seats > table.capacity && !b.capacityOverride) {
        return json(
          {
            error: `Capacidad excedida. La mesa tiene ${current}/${table.capacity} asientos. Agregar ${seats} personas supera el aforo permitido.`,
            requiresOverride: true,
          },
          422
        );
      }
      const assignment = mutate((d) => {
        d.assignments = d.assignments.filter((a) => a.eventGuestId !== b.guestId);
        const a = {
          id: newId("asg"),
          eventId: EVENT_ID,
          tableId: table.id,
          eventGuestId: b.guestId,
          assignedSeats: seats,
          capacityOverride: Boolean(b.capacityOverride),
          assignedBy: "Admin D'CAROL",
          assignedAt: nowIso(),
        };
        d.assignments.push(a);
        return a;
      });
      return json({ success: true, message: "Invitado asignado a la mesa correctamente", assignment });
    }

    if (b.action === "unassign_guest") {
      if (!b.guestId) return json({ error: "guestId es requerido" }, 400);
      mutate((d) => {
        d.assignments = d.assignments.filter((a) => !(a.tableId === table.id && a.eventGuestId === b.guestId));
      });
      return json({ success: true, message: "Comensal retirado de la mesa" });
    }

    mutate((d) => {
      const t = d.tables.find((x) => x.id === b.tableId)!;
      if (b.tableName !== undefined) t.tableName = String(b.tableName).trim();
      if (b.capacity !== undefined) t.capacity = Number(b.capacity);
      if (b.zone !== undefined) t.zone = String(b.zone).trim();
      if (b.isVip !== undefined) t.isVip = Boolean(b.isVip);
      if (b.notes !== undefined) t.notes = b.notes ? String(b.notes).trim() : null;
      t.updatedAt = nowIso();
    });
    return json({ success: true, message: "Mesa actualizada exitosamente" });
  },
  DELETE: ({ params }) => {
    const id = params.get("tableId");
    const force = params.get("force") === "true";
    if (!id) return json({ error: "tableId es requerido" }, 400);
    const db = getDb();
    if (!tableById(db, id)) return json({ error: "Mesa no encontrada" }, 404);
    const count = db.assignments.filter((a) => a.tableId === id).length;
    if (count > 0 && !force) {
      return json({ error: `No se puede eliminar la mesa porque tiene ${count} asignaciones activas. Reasígnelas primero o agregue ?force=true` }, 409);
    }
    mutate((d) => {
      d.assignments = d.assignments.filter((a) => a.tableId !== id);
      d.tables = d.tables.filter((t) => t.id !== id);
    });
    return json({ success: true, message: "Mesa eliminada correctamente" });
  },
};

const adminMetrics: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    const guests = db.guests;
    const confirmed = guests.filter((g) => g.status === "confirmed" || g.confirmedSeats > 0);
    const vipCount = guests.filter((g) => g.isVip || g.tier === "vip").length;
    const unassigned = guests.filter((g) => !assignmentOf(db, g));
    const totalCapacity = db.tables.reduce((a, t) => a + (t.capacity || 10), 0);
    const assignedSeats = db.assignments.reduce((a, x) => a + (x.assignedSeats || 1), 0);
    const pendingPhotos = db.photos.filter((p) => p.moderationStatus === "pending").length;
    const { current, next } = currentTimelineItem(db);
    return json({
      success: true,
      data: {
        kpis: {
          rsvp: {
            confirmed: confirmed.length,
            total: guests.length,
            pending: guests.filter((g) => g.status === "invited" || g.status === "waitlist").length,
            declined: guests.filter((g) => g.status === "declined").length,
            percentage: guests.length ? Math.round((confirmed.length / guests.length) * 100) : 0,
            adults: vipCount,
            youth: guests.length - vipCount,
            totalSeatsInvited: guests.reduce((a, g) => a + (g.maxSeats || 1), 0),
            totalSeatsConfirmed: confirmed.reduce((a, g) => a + (g.confirmedSeats || 1), 0),
          },
          seating: {
            tablesDistributed: new Set(db.assignments.map((a) => a.tableId)).size,
            totalTables: db.tables.length,
            totalCapacity,
            assignedSeats,
            availableSeats: Math.max(0, totalCapacity - assignedSeats),
            percentage: totalCapacity ? Math.round((assignedSeats / totalCapacity) * 100) : 0,
            unassignedConfirmedCount: unassigned.length,
            honorTableReady: true,
          },
          photos: {
            total: db.photos.length,
            pending: pendingPhotos,
            projected: db.photos.filter((p) => p.moderationStatus === "approved").length,
            vipAlbum: db.photos.filter((p) => p.isFeatured).length,
          },
          messages: { total: db.messages.length, audios: 0, written: db.messages.length },
        },
        alerts: { unassignedGuests: unassigned.length, pendingModeration: pendingPhotos },
        liveState: {
          activeStage: current?.title || "Recepción & Bienvenida",
          nextStage: next?.title || null,
          announcement: db.liveState.announcementText || null,
        },
      },
    });
  },
};

const adminLiveState: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    return json({ success: true, liveState: db.liveState, timeline: [...db.timeline].sort((a, b) => a.sortOrder - b.sortOrder) });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    let stage = b.stageTitle;
    mutate((d) => {
      const sorted = [...d.timeline].sort((a, b2) => a.sortOrder - b2.sortOrder);
      let idx = sorted.findIndex((t) => t.status === "current");
      if (idx === -1) idx = 0;
      if (b.action === "advance") {
        const nextIdx = Math.min(idx + 1, sorted.length - 1);
        if (sorted[idx]) sorted[idx].status = "completed";
        if (sorted[nextIdx]) {
          sorted[nextIdx].status = "current";
          d.liveState.currentTimelineItemId = sorted[nextIdx].id;
          stage = sorted[nextIdx].title;
        }
      }
      if (b.announcementText) d.liveState.announcementText = b.announcementText;
      d.liveState.updatedAt = nowIso();
    });
    return json({ success: true, message: `Etapa actualizada a: ${stage}`, activeStage: stage });
  },
};

function enrichPhoto(p: any) {
  let category = "General";
  let cleanCaption = p.caption || "";
  const m = cleanCaption.match(/^\[(.*?)\]\s*(.*)$/);
  if (m) {
    category = m[1];
    cleanCaption = m[2];
  }
  const t = (p.uploaderName || "").match(/mesa\s*(\d+)/i) || (p.caption || "").match(/mesa\s*(\d+)/i);
  return { ...p, category, cleanCaption, tableNumber: t ? parseInt(t[1], 10) : null };
}

function counts(list: any[]) {
  return {
    total: list.length,
    pending: list.filter((x) => x.moderationStatus === "pending").length,
    approved: list.filter((x) => x.moderationStatus === "approved").length,
    featured: list.filter((x) => x.isFeatured).length,
    rejected: list.filter((x) => x.moderationStatus === "rejected").length,
  };
}

function byFilter(list: any[], filter: string) {
  if (filter === "featured") return list.filter((x) => x.isFeatured);
  if (["pending", "approved", "rejected"].includes(filter)) return list.filter((x) => x.moderationStatus === filter);
  return list;
}

const adminModeration: Record<string, Handler> = {
  GET: ({ params }) => {
    const db = getDb();
    const search = (params.get("search") || "").trim().toLowerCase();
    const photosAll = [...db.photos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const msgsAll = [...db.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    let photos = byFilter(photosAll.map(enrichPhoto), params.get("filter") || "all");
    let guestbookList = byFilter(msgsAll, params.get("messageFilter") || "all");
    if (search) {
      photos = photos.filter((p) =>
        [p.uploaderName, p.caption, p.category, p.tableNumber ? `mesa ${p.tableNumber}` : ""].some((s) => String(s || "").toLowerCase().includes(search))
      );
      guestbookList = guestbookList.filter((m) => `${m.authorName} ${m.messageText}`.toLowerCase().includes(search));
    }
    return json({
      success: true,
      photos,
      guestbook: guestbookList,
      photoCounts: counts(photosAll),
      messageCounts: counts(msgsAll),
      counts: counts(photosAll),
    });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    const setPhotos = (ids: string[], patch: any) =>
      mutate((d) => d.photos.forEach((p) => ids.includes(p.id) && Object.assign(p, patch, { updatedAt: nowIso() })));

    switch (b.bulkAction) {
      case "approve_all_pending": {
        const ids = getDb().photos.filter((p) => p.moderationStatus === "pending").map((p) => p.id);
        setPhotos(ids, { moderationStatus: "approved", liveWallDisplayed: true });
        return json({ success: true, message: `${ids.length} fotos aprobadas para la Gran Pantalla`, count: ids.length });
      }
      case "purge_rejected": {
        const n = getDb().photos.filter((p) => p.moderationStatus === "rejected").length;
        mutate((d) => (d.photos = d.photos.filter((p) => p.moderationStatus !== "rejected")));
        return json({ success: true, message: `${n} fotos descartadas eliminadas`, count: n });
      }
      case "approve_selected":
        setPhotos(b.photoIds || [], { moderationStatus: "approved", liveWallDisplayed: true });
        return json({ success: true, message: `${b.photoIds.length} fotos seleccionadas aprobadas para Pantalla` });
      case "feature_selected":
        setPhotos(b.photoIds || [], { moderationStatus: "approved", isFeatured: true, liveWallDisplayed: true });
        return json({ success: true, message: `${b.photoIds.length} fotos destacadas en Álbum VIP` });
      case "reject_selected":
        setPhotos(b.photoIds || [], { moderationStatus: "rejected", liveWallDisplayed: false, isFeatured: false });
        return json({ success: true, message: `${b.photoIds.length} fotos descartadas` });
      case "delete_selected":
        mutate((d) => (d.photos = d.photos.filter((p) => !(b.photoIds || []).includes(p.id))));
        return json({ success: true, message: `${b.photoIds.length} fotos eliminadas definitivamente` });
      case "approve_all_pending_messages": {
        const ids = getDb().messages.filter((m) => m.moderationStatus === "pending").map((m) => m.id);
        mutate((d) => d.messages.forEach((m) => ids.includes(m.id) && Object.assign(m, { moderationStatus: "approved", displayedOnWall: true })));
        return json({ success: true, message: `${ids.length} dedicatorias aprobadas para proyección`, count: ids.length });
      }
      case "purge_rejected_messages": {
        const n = getDb().messages.filter((m) => m.moderationStatus === "rejected").length;
        mutate((d) => (d.messages = d.messages.filter((m) => m.moderationStatus !== "rejected")));
        return json({ success: true, message: `${n} dedicatorias descartadas eliminadas`, count: n });
      }
    }

    const apply = (item: any, action: string, wallKey: string) => {
      if (action === "approve") Object.assign(item, { moderationStatus: "approved", [wallKey]: true });
      else if (action === "feature") Object.assign(item, { moderationStatus: "approved", isFeatured: true, [wallKey]: true });
      else if (action === "reject") Object.assign(item, { moderationStatus: "rejected", isFeatured: false, [wallKey]: false });
      else if (action === "hide") Object.assign(item, { moderationStatus: "hidden", [wallKey]: false });
    };

    if (b.messageId && b.action) {
      const msg = getDb().messages.find((m) => m.id === b.messageId);
      if (!msg) return json({ error: "Dedicatoria no encontrada" }, 404);
      const updated = mutate((d) => {
        const m = d.messages.find((x) => x.id === b.messageId)!;
        apply(m, b.action, "displayedOnWall");
        return m;
      });
      const verb = b.action === "approve" ? "aprobada" : b.action === "feature" ? "destacada en Libro de Oro" : "descartada";
      return json({ success: true, message: `Dedicatoria de ${msg.authorName} ${verb}`, messageId: b.messageId, newStatus: updated.moderationStatus, isFeatured: updated.isFeatured });
    }

    if (b.photoId && b.action) {
      if (!getDb().photos.some((p) => p.id === b.photoId)) return json({ error: "Foto no encontrada" }, 404);
      const updated = mutate((d) => {
        const p = d.photos.find((x) => x.id === b.photoId)!;
        apply(p, b.action, "liveWallDisplayed");
        p.updatedAt = nowIso();
        return p;
      });
      const verb = b.action === "approve" ? "aprobada para pantalla" : b.action === "feature" ? "destacada en álbum VIP" : "descartada";
      return json({ success: true, message: `Foto ${verb} exitosamente`, photoId: b.photoId, newStatus: updated.moderationStatus, isFeatured: updated.isFeatured });
    }

    return json({ error: "Parámetros de acción inválidos" }, 400);
  },
  DELETE: ({ params }) => {
    const messageId = params.get("messageId");
    const photoId = params.get("photoId");
    if (messageId) {
      mutate((d) => (d.messages = d.messages.filter((m) => m.id !== messageId)));
      return json({ success: true, message: "Dedicatoria eliminada definitivamente" });
    }
    if (photoId) {
      if (!getDb().photos.some((p) => p.id === photoId)) return json({ error: "Foto no encontrada" }, 404);
      mutate((d) => (d.photos = d.photos.filter((p) => p.id !== photoId)));
      return json({ success: true, message: "Foto eliminada definitivamente" });
    }
    return json({ error: "photoId o messageId es requerido" }, 400);
  },
};

function parseClock(value: string, base: string) {
  if (value.includes("T") || !isNaN(Date.parse(value))) return new Date(value);
  const [h, m] = value.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h || 18, m || 0, 0, 0);
  return d;
}

const adminTimeline: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    const { sorted, current } = currentTimelineItem(db);
    return json({
      success: true,
      items: sorted,
      currentItemId: current?.id || null,
      currentTitle: current?.title || "Recepción & Bienvenida",
      totalMilestones: sorted.length,
    });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    if (!b.title) return json({ error: "El título del hito es obligatorio" }, 400);
    const item = mutate((d) => {
      const start = b.startTime ? parseClock(b.startTime, d.event.eventDate) : new Date();
      const t = {
        id: newId("tl"),
        eventId: EVENT_ID,
        locationId: null,
        title: String(b.title).trim(),
        startTime: start.toISOString(),
        endTime: b.endTime ? parseClock(b.endTime, start.toISOString()).toISOString() : null,
        description: b.description ? String(b.description).trim() : null,
        icon: b.icon || "celebration",
        isHighlight: Boolean(b.isHighlight),
        status: b.status || "scheduled",
        sortOrder: isNaN(Number(b.sortOrder)) || b.sortOrder === undefined ? d.timeline.length + 1 : Number(b.sortOrder),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      d.timeline.push(t);
      return t;
    });
    return json({ success: true, message: "Hito ceremonial agregado correctamente", item });
  },
  PATCH: async ({ json: body }) => {
    const b = await body();
    if (!b.itemId) return json({ error: "itemId es requerido" }, 400);
    const item = getDb().timeline.find((t) => t.id === b.itemId);
    if (!item) return json({ error: "Hito no encontrado" }, 404);
    if (b.action === "set_current") {
      mutate((d) => {
        d.timeline.forEach((t) => {
          t.status = t.id === item.id ? "current" : t.sortOrder < item.sortOrder ? "completed" : "scheduled";
          t.updatedAt = nowIso();
        });
        d.liveState.currentTimelineItemId = item.id;
      });
      return json({ success: true, message: `Etapa fijada: "${item.title}" está en curso` });
    }
    mutate((d) => {
      const t = d.timeline.find((x) => x.id === b.itemId)!;
      if (b.title !== undefined) t.title = String(b.title).trim();
      if (b.description !== undefined) t.description = b.description ? String(b.description).trim() : null;
      if (b.icon !== undefined) t.icon = String(b.icon).trim();
      if (b.isHighlight !== undefined) t.isHighlight = Boolean(b.isHighlight);
      if (b.status !== undefined) t.status = b.status;
      t.updatedAt = nowIso();
    });
    return json({ success: true, message: "Hito actualizado correctamente" });
  },
  DELETE: ({ params }) => {
    const id = params.get("itemId");
    if (!id) return json({ error: "itemId es requerido" }, 400);
    if (!getDb().timeline.some((t) => t.id === id)) return json({ error: "Hito no encontrado" }, 404);
    mutate((d) => (d.timeline = d.timeline.filter((t) => t.id !== id)));
    return json({ success: true, message: "Hito eliminado del cronograma" });
  },
};

const adminSettings: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    return json({
      success: true,
      event: { title: db.event.title, eventDate: db.event.eventDate, timezone: db.event.timezone, phase: db.event.phase },
      settings: db.settings,
      branding: db.event.branding,
    });
  },
  PATCH: async ({ json: body }) => {
    const b = await body();
    const keys = [
      "rsvpEnabled", "photoUploadsEnabled", "photoModerationEnabled", "guestbookEnabled",
      "playlistEnabled", "tableLookupEnabled", "liveWallEnabled", "allowCompanions",
    ];
    const patch: Record<string, unknown> = {};
    mutate((d) => {
      if (b.phase && ["pre_event", "live", "post_event"].includes(b.phase)) d.event.phase = b.phase;
      keys.forEach((k) => {
        if (b[k] !== undefined) patch[k] = Boolean(b[k]);
      });
      if (b.maxCompanionsPerGuest !== undefined) patch.maxCompanionsPerGuest = Number(b.maxCompanionsPerGuest);
      Object.assign(d.settings, patch, { updatedAt: nowIso() });
    });
    return json({ success: true, message: "Ajustes del evento guardados correctamente", phase: getDb().event.phase, settings: patch });
  },
};

function stageStats(photos: any[]) {
  return {
    totalPhotos: photos.length,
    withExif: photos.filter((p) => p.takenAt || p.cameraInfo).length,
    stagesCount: new Set(photos.map((p) => p.stageKey)).size,
    featuredCount: photos.filter((p) => p.isFeatured).length,
  };
}

const adminStages: Record<string, Handler> = {
  GET: () => {
    const { stages } = getDb();
    const photos = [...stages.photos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return json({ success: true, title: stages.title, subtitle: stages.subtitle, stages: LIFE_STAGES, photos, stats: stageStats(photos) });
  },
  PUT: async ({ json: body }) => {
    const b = await body();
    if (!Array.isArray(b.photos)) return json({ error: "Se requiere un arreglo de fotos válido" }, 400);
    const photos = b.photos.map((p: any, i: number) => ({ ...p, sortOrder: i + 1 }));
    mutate((d) => {
      d.stages.photos = photos;
      if (b.title) d.stages.title = b.title;
      if (b.subtitle) d.stages.subtitle = b.subtitle;
    });
    return json({ success: true, message: "Álbum de etapas actualizado con éxito", photos, stats: stageStats(photos) });
  },
};

const adminStagesUpload: Record<string, Handler> = {
  POST: async ({ form }) => {
    const fd = await form();
    const files = fd.getAll("file") as File[];
    if (!files.length) return json({ error: "No se seleccionó ningún archivo para subir" }, 400);
    const stageOverride = (fd.get("stageKey") as string) || "";
    const titleOverride = (fd.get("title") as string) || "";
    const captionOverride = (fd.get("caption") as string) || "";
    const current = [...getDb().stages.photos];
    const uploaded: any[] = [];
    for (const file of files) {
      const hash = await hashFile(file);
      if (current.some((p) => p.hash === hash) || uploaded.some((p) => p.hash === hash)) continue;
      const meta = await analyzeFileMetadata(file);
      const year = meta.year || new Date().getFullYear();
      const inferred = getStageFromYear(year);
      const stageKey = stageOverride || inferred.stageKey;
      const stageLabel = LIFE_STAGES.find((s) => s.key === stageKey)?.label || inferred.stageLabel;
      const url = await fileToDataUrl(file, 1000, 0.75);
      uploaded.push({
        id: newId("stg"),
        url,
        thumbnailUrl: url,
        title: titleOverride || `Recuerdo ${year}`,
        caption: captionOverride || `${stageLabel} • ${year}`,
        stageKey,
        stageLabel,
        year,
        takenAt: meta.takenAt,
        cameraInfo: [meta.cameraMake, meta.cameraModel].filter(Boolean).join(" ") || undefined,
        sortOrder: current.length + uploaded.length + 1,
        isFeatured: true,
        source: "planner_bulk",
        hash,
      });
    }
    const photos = [...current, ...uploaded];
    mutate((d) => (d.stages.photos = photos));
    if (!uploaded.length) {
      return json({
        success: true,
        message: "Las fotos seleccionadas ya existen en el álbum (duplicados detectados y omitidos).",
        uploaded: [],
        duplicatesSkipped: true,
        totalPhotos: photos.length,
        photos,
      });
    }
    return json({ success: true, message: `¡Se subieron y procesaron ${uploaded.length} foto(s) con éxito!`, uploaded, totalPhotos: photos.length, photos });
  },
};

/* ── Automatizaciones WhatsApp: todo se simula, nada sale del navegador ── */

function prepareTargets(db: DemoDb, filter: string, guestId?: string) {
  let list = db.guests.map((g) => guestFull(db, g));
  if (guestId) list = list.filter((g) => g.id === guestId);
  else if (filter === "pending_rsvp") list = list.filter((g) => g.status === "invited" || g.status === "waitlist");
  else if (filter === "confirmed_only") list = list.filter((g) => g.status === "confirmed");
  else if (filter === "attended_or_confirmed") list = list.filter((g) => g.status === "confirmed" || g.status === "checked_in");
  else if (filter === "with_phone") list = list.filter((g) => !isPhoneMissing(g.person?.phone));
  return list;
}

function preparedFor(db: DemoDb, g: any, template: string) {
  const name = `${g.person?.firstName || ""} ${g.person?.lastName || ""}`.trim() || "Estimado Invitado";
  const seats = g.rsvp?.confirmedCount || g.confirmedSeats || g.maxSeats || 1;
  const table = g.tableAssignment?.table;
  const tableInfo = table ? formatTableDisplay(table.tableNumber, table.tableName) : "Mesa por Asignar";
  const cleanPhone = String(g.person?.phone || "").replace(/\D/g, "");
  const message = substituteTemplateVariables(
    template,
    { name, firstName: g.person?.firstName, seats, code: g.invitationCode, tableInfo },
    window.location.origin
  );
  const inv = db.invitations[g.id];
  return {
    guestId: g.id,
    invitationCode: g.invitationCode,
    guestName: name,
    firstName: g.person?.firstName,
    phone: g.person?.phone || null,
    cleanPhone: cleanPhone || null,
    seats,
    tableInfo,
    rsvpStatus: g.status === "confirmed" ? "confirmed" : "pending",
    message,
    waUrl: cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`,
    isSent: inv?.status === "sent",
    sentAt: inv?.sentAt || null,
    sentVia: inv?.sentVia || null,
  };
}

const automations: Record<string, Handler> = {
  GET: () => {
    const db = getDb();
    const order: Record<string, number> = { invitation: 1, reminder: 2, digital_pass: 3, thank_you: 4 };
    const list = [...db.automations]
      .map((a) => ({ ...a, runs: db.automationRuns.filter((r) => r.automationId === a.id).slice(0, 5) }))
      .sort((a, b) => (order[a.actionConfig?.category] || 9) - (order[b.actionConfig?.category] || 9));
    const recentRuns = db.automationRuns.slice(0, 20).map((r) => ({ ...r, automation: db.automations.find((a) => a.id === r.automationId) }));
    return json({
      success: true,
      automations: list,
      recentRuns,
      summary: { totalRules: list.length, activeRules: list.filter((a) => a.isActive).length, totalRunsCount: recentRuns.length },
    });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    if (!b.name || !b.triggerType || !b.actionType) return json({ error: "Nombre, disparador y acción son requeridos" }, 400);
    const automation = mutate((d) => {
      const a = {
        id: newId("auto"),
        eventId: EVENT_ID,
        name: String(b.name).trim(),
        triggerType: b.triggerType,
        triggerConfig: b.triggerConfig || {},
        actionType: b.actionType,
        actionConfig: b.actionConfig || {},
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      d.automations.unshift(a);
      return a;
    });
    return json({ success: true, automation });
  },
  PATCH: async ({ json: body }) => {
    const b = await body();
    if (!b.id) return json({ error: "El campo 'id' es requerido" }, 400);
    if (!getDb().automations.some((a) => a.id === b.id)) return json({ error: "Regla de automatización no encontrada" }, 404);
    const automation = mutate((d) => {
      const a = d.automations.find((x) => x.id === b.id)!;
      ["name", "triggerType", "triggerConfig", "actionType", "actionConfig", "isActive"].forEach((k) => {
        if (b[k] !== undefined) a[k] = b[k];
      });
      a.updatedAt = nowIso();
      return a;
    });
    return json({ success: true, automation });
  },
  DELETE: ({ params }) => {
    const id = params.get("id");
    if (!id) return json({ error: "El ID es requerido" }, 400);
    mutate((d) => (d.automations = d.automations.filter((a) => a.id !== id)));
    return json({ success: true, message: "Regla de automatización eliminada correctamente" });
  },
};

const automationsRun: Record<string, Handler> = {
  GET: ({ params }) => {
    const db = getDb();
    const id = params.get("automationId");
    const runs = db.automationRuns
      .filter((r) => !id || r.automationId === id)
      .slice(0, 50)
      .map((r) => ({ ...r, automation: db.automations.find((a) => a.id === r.automationId) }));
    return json({ success: true, runs });
  },
  POST: async ({ json: body }) => {
    const b = await body();
    if (!b.automationId) return json({ error: "El automationId es requerido" }, 400);
    const db = getDb();
    const automation = db.automations.find((a) => a.id === b.automationId) || db.automations[0];
    const filter = b.targetFilterOverride || automation.triggerConfig?.targetFilter || "all";
    const template = sanitizeTemplateText(automation.actionConfig?.template);
    const targets = prepareTargets(db, filter, b.guestId);
    const preparedMessages = targets.map((g) => preparedFor(db, g, template));
    const runRecord = mutate((d) => {
      const r = {
        id: newId("run"),
        automationId: automation.id,
        status: "success",
        startedAt: nowIso(),
        finishedAt: nowIso(),
        resultsSummary: {
          totalTarget: targets.length,
          preparedCount: preparedMessages.length,
          hasPhoneCount: preparedMessages.filter((m) => m.phone).length,
          filterUsed: filter,
          triggeredAt: nowIso(),
        },
        createdAt: nowIso(),
      };
      d.automationRuns.unshift(r);
      return r;
    });
    return json({ success: true, automationName: automation.name, filterUsed: filter, totalTarget: targets.length, runRecord, preparedMessages });
  },
};

function markSent(guestId: string, via = "whatsapp") {
  mutate((d) => {
    d.invitations[guestId] = { status: "sent", sentAt: nowIso(), sentVia: via };
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const automationsSendOne: Record<string, Handler> = {
  POST: async ({ json: body }) => {
    const b = await body();
    const db = getDb();
    const g = db.guests.find((x) => x.id === b.guestId) || null;
    const name = g ? `${personOf(db, g)?.firstName} ${personOf(db, g)?.lastName}` : b.rawGuest?.guestName || "Invitado";
    const phone = g ? personOf(db, g)?.phone : b.rawGuest?.phone || b.rawGuest?.cleanPhone;
    if (!g && !b.rawGuest) return json({ error: "Invitado no encontrado" }, 404);
    if (isPhoneMissing(phone)) return json({ error: `El invitado "${name}" no tiene un teléfono válido registrado para WhatsApp.` }, 400);
    await sleep(650);
    if (g) markSent(g.id);
    return json({
      success: true,
      message: `Invitación enviada exitosamente a ${name} (${phone}) · Simulación DevFlow: ningún mensaje real fue enviado`,
      messageId: newId("sim"),
      guestName: name,
      phone,
      sentAt: nowIso(),
    });
  },
};

const automationsTestSend: Record<string, Handler> = {
  POST: async ({ json: body }) => {
    const b = await body();
    const digits = String(b.testPhone || "").replace(/\D/g, "");
    if (!digits) return json({ error: "El número de teléfono de prueba es requerido" }, 400);
    if (digits.length < 8) {
      return json({ error: `El teléfono "${b.testPhone}" no es válido para WhatsApp. Ingrese un número con código de país (ej. +505 8888-0000).` }, 400);
    }
    await sleep(700);
    const preview = substituteTemplateVariables(
      b.message || sanitizeTemplateText(null),
      { name: "Invitado de Prueba", firstName: "Invitado", seats: 2, code: "VIP-DC-001", tableInfo: "Mesa 1 — Presidencial de Gala", ...(b.rawGuestData || {}) },
      window.location.origin
    );
    return json({
      success: true,
      message: `¡Mensaje de prueba simulado para +${digits}! (Demo DevFlow: no se envió ningún WhatsApp real)`,
      messageId: newId("sim"),
      phone: `+${digits}`,
      messagePreview: preview,
      evolutionData: { simulated: true },
    });
  },
};

const automationsBatchSend: Record<string, Handler> = {
  POST: async ({ json: body }) => {
    const b = await body();
    const db = getDb();
    const automation = db.automations.find((a) => a.id === b.automationId) || db.automations[0];
    const filter = b.targetFilterOverride || automation?.triggerConfig?.targetFilter || "all";
    let queue: any[] = Array.isArray(b.preparedList) && b.preparedList.length
      ? b.preparedList
      : prepareTargets(db, filter).map((g) => preparedFor(db, g, sanitizeTemplateText(automation?.actionConfig?.template)));
    queue = queue.filter((q) => !isPhoneMissing(q.phone || q.cleanPhone));
    if (b.maxLimit) queue = queue.slice(0, Number(b.maxLimit));
    if (!queue.length) {
      return json({ success: false, error: "No se encontraron comensales con número telefónico válido para el filtro seleccionado.", totalCandidates: 0, withPhoneCount: 0 });
    }
    const started = Date.now();
    await sleep(Math.min(2400, 250 + queue.length * 40));
    const results = queue.map((q, i) => ({
      guestId: q.guestId,
      guestName: q.guestName,
      phone: q.cleanPhone || q.phone,
      status: "simulated" as const,
      messageId: `sim_${i + 1}`,
    }));
    mutate((d) => {
      results.forEach((r) => (d.invitations[r.guestId] = { status: "sent", sentAt: nowIso(), sentVia: "whatsapp" }));
      d.automationRuns.unshift({
        id: newId("run"),
        automationId: automation?.id,
        status: "success",
        startedAt: new Date(started).toISOString(),
        finishedAt: nowIso(),
        resultsSummary: { totalTarget: queue.length, successCount: queue.length, failedCount: 0, filterUsed: filter, dryRun: true, resultsSample: results.slice(0, 20) },
        createdAt: nowIso(),
      });
    });
    return json({
      success: true,
      status: "success",
      runId: newId("run"),
      totalQueued: queue.length,
      successCount: queue.length,
      failedCount: 0,
      dryRun: true,
      durationSeconds: Math.round((Date.now() - started) / 1000),
      results,
    });
  },
};

const automationsMarkSent: Record<string, Handler> = {
  POST: async ({ json: body }) => {
    const { guestId, status = "sent", sentVia = "whatsapp_web" } = await body();
    if (!guestId) return json({ error: "guestId es requerido" }, 400);
    const isSent = status === "sent";
    const record = mutate((d) => {
      d.invitations[guestId] = { status: isSent ? "sent" : "draft", sentAt: isSent ? nowIso() : null, sentVia: isSent ? sentVia : null };
      return { eventGuestId: guestId, ...d.invitations[guestId] };
    });
    return json({ success: true, invitation: record, isSent, sentAt: record.sentAt });
  },
};

const evolutionStatus: Record<string, Handler> = {
  GET: () =>
    json({
      online: true,
      statusCode: 200,
      message: "Modo demostración DevFlow: los envíos de WhatsApp se simulan localmente.",
      errorType: null,
      latencyMs: 42,
      instances: [{ name: "devflow-demo", status: "open", profileName: "DevFlow Events (Demo)" }],
      activeInstance: { name: "devflow-demo", status: "open", profileName: "DevFlow Events (Demo)" },
      configuredUrl: "simulado://devflow-demo",
      configuredInstance: "devflow-demo",
    }),
};

/* ═══════════════════════════════ ROUTER ═══════════════════════════════ */

const ROUTES: Record<string, Record<string, Handler>> = {
  "/api/rsvp": rsvp,
  "/api/table-lookup": tableLookup,
  "/api/guestbook": guestbook,
  "/api/photos": photosPublic,
  "/api/photos/upload": photosUpload,
  "/api/stages": stagesPublic,
  "/api/checkin": checkin,
  "/api/playlist/recommend": playlist,
  "/api/live/telemetry": telemetry,
  "/api/admin/guests": adminGuests,
  "/api/admin/tables": adminTables,
  "/api/admin/metrics": adminMetrics,
  "/api/admin/live-state": adminLiveState,
  "/api/admin/moderation": adminModeration,
  "/api/admin/timeline": adminTimeline,
  "/api/admin/settings": adminSettings,
  "/api/admin/stages": adminStages,
  "/api/admin/stages/upload": adminStagesUpload,
  "/api/admin/automations": automations,
  "/api/admin/automations/run": automationsRun,
  "/api/admin/automations/send-one": automationsSendOne,
  "/api/admin/automations/test-send": automationsTestSend,
  "/api/admin/automations/batch-send": automationsBatchSend,
  "/api/admin/automations/mark-sent": automationsMarkSent,
  "/api/admin/automations/evolution-status": evolutionStatus,
};

export async function handleDemoRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const req = new Request(input, init);
  const url = new URL(req.url, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) return null;
  const path = url.pathname.replace(/\/$/, "");
  const route = ROUTES[path];
  const method = req.method.toUpperCase();
  if (!route) return json({ error: `Ruta de demostración no disponible: ${path}` }, 404);
  const handler = route[method];
  if (!handler) return json({ error: "Método no permitido" }, 405);
  // Latencia mínima y realista: la UI muestra sus estados de carga tal como en producción
  await sleep(120 + Math.random() * 160);
  try {
    return await handler({
      method,
      url,
      params: url.searchParams,
      req,
      json: () => req.clone().json().catch(() => ({})),
      form: () => req.clone().formData(),
    });
  } catch (error) {
    console.error("[DevFlow demo api]", path, error);
    return json({ error: "Error en la simulación local" }, 500);
  }
}

let installed = false;
export function installDemoApi() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (href.startsWith("/api/") || href.startsWith(`${window.location.origin}/api/`)) {
      const res = await handleDemoRequest(input, init);
      if (res) return res;
    }
    return realFetch(input, init);
  };
}
