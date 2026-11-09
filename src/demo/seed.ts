/**
 * Semilla de la base de datos de demostración (100% ficticia).
 *
 * Reproduce la forma de los registros que devuelven Drizzle + Neon en la app
 * real, para que los componentes originales funcionen sin cambios. Ningún
 * invitado, teléfono ni código corresponde a una persona real.
 */
import { DEFAULT_EVENT_FALLBACK } from "@/lib/default-event";
import { CURATED_DEFAULT_STAGE_PHOTOS, type StagePhoto } from "@/lib/stages-data";
import { DEFAULT_AUTOMATIONS } from "./automations-seed";

export const EVENT_ID = "evt-demo-dannia-xv";

export interface DemoDb {
  version: number;
  event: any;
  settings: any;
  liveState: any;
  people: any[];
  guests: any[];
  rsvps: any[];
  tables: any[];
  assignments: any[];
  checkins: any[];
  photos: any[];
  messages: any[];
  timeline: any[];
  stages: { title: string; subtitle: string; photos: StagePhoto[] };
  playlist: any;
  automations: any[];
  automationRuns: any[];
  invitations: Record<string, { status: string; sentAt: string | null; sentVia: string | null }>;
}

export const DB_VERSION = 5;

/* ── Deterministic pseudo-random so every visitor sees the same demo ── */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const FIRST_NAMES = [
  "Sofía", "Valentina", "Camila", "Isabella", "Mariana", "Lucía", "Daniela", "Gabriela",
  "Andrea", "Fernanda", "Paola", "Natalia", "Regina", "Ximena", "Renata", "Elena",
  "Alejandro", "Sebastián", "Mateo", "Diego", "Santiago", "Emilio", "Andrés", "Rodrigo",
  "Javier", "Ricardo", "Fernando", "Eduardo", "Gustavo", "Héctor", "Martín", "Tomás",
  "Carmen", "Rosa", "Patricia", "Beatriz", "Claudia", "Mónica", "Teresa", "Silvia",
];

const LAST_NAMES = [
  "Altamirano", "Benavides", "Castellón", "Duarte", "Espinoza", "Fonseca", "Gutiérrez",
  "Herrera", "Icaza", "Jarquín", "Lacayo", "Montalván", "Navarrete", "Obando", "Pallais",
  "Quintana", "Rivas", "Solórzano", "Téllez", "Urbina", "Valdivia", "Zelaya", "Arana",
  "Baltodano", "Cuadra", "Delgadillo", "Estrada", "Flores", "Guerrero", "Hurtado",
];

const UNSPLASH = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`;

const GALA_PHOTOS = [
  "photo-1519741497674-611481863552",
  "photo-1511795409834-ef04bbd61622",
  "photo-1464366400600-7168b8af9bc3",
  "photo-1530103862676-de8c9debad1d",
  "photo-1527529482837-4698179dc6ce",
  "photo-1492684223066-81342ee5ff30",
  "photo-1504196606672-aef5c9cefc92",
  "photo-1513151233558-d860c5398176",
  "photo-1469371670807-013ccf25f16a",
  "photo-1478146896981-b80fe463b330",
  "photo-1522673607200-164d1b6ce486",
  "photo-1529636798458-92182e662485",
];

function iso(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

export function createSeed(): DemoDb {
  const rand = rng(20261204);
  const now = new Date().toISOString();

  /* ── Event ── */
  const event = {
    ...DEFAULT_EVENT_FALLBACK,
    id: EVENT_ID,
    metadata: { edition: "Edición Real de Gala", totalCapacity: 376 },
    createdAt: now,
    updatedAt: now,
  };

  const settings = {
    id: "set-1",
    eventId: EVENT_ID,
    rsvpEnabled: true,
    rsvpDeadline: "2026-11-20T23:59:59-06:00",
    photoUploadsEnabled: true,
    photoModerationEnabled: true,
    guestbookEnabled: true,
    playlistEnabled: true,
    tableLookupEnabled: true,
    liveWallEnabled: true,
    allowCompanions: true,
    maxCompanionsPerGuest: 3,
  };

  /* ── Timeline (7 hitos ceremoniales) ── */
  const timelineBase = [
    ...DEFAULT_EVENT_FALLBACK.timelineItems,
    {
      id: "tl-6",
      startTime: "2026-12-04T22:30:00-06:00",
      title: "Partida del Pastel & Sorpresas",
      description: "Momento dulce con la familia y video sorpresa de los amigos.",
      icon: "cake",
    },
    {
      id: "tl-7",
      startTime: "2026-12-04T23:45:00-06:00",
      title: "Despedida de Gala",
      description: "Último baile, fotos finales y agradecimiento a los invitados.",
      icon: "nights_stay",
    },
  ];
  const timeline = timelineBase.map((t: any, i) => ({
    id: t.id,
    eventId: EVENT_ID,
    locationId: null,
    startTime: t.startTime,
    endTime: t.endTime || null,
    title: t.title,
    description: t.description,
    icon: t.icon || "celebration",
    isHighlight: Boolean(t.isHighlight),
    status: i === 0 ? "current" : "scheduled",
    sortOrder: i + 1,
    createdAt: now,
    updatedAt: now,
  }));

  const liveState = {
    id: "live-1",
    eventId: EVENT_ID,
    currentTimelineItemId: timeline[0].id,
    announcementText: "¡Bienvenidos a la Gala de Mis XV de Dannia Carolina!",
    bannerActive: false,
    activeWallFilter: "all",
    liveCheckinCount: 0,
    updatedAt: now,
  };

  /* ── Tables (37 mesas, mismo plano que la app real) ── */
  const tables = Array.from({ length: 37 }, (_, i) => {
    const num = i + 1;
    const isVip = [1, 2, 25, 32].includes(num);
    const zone =
      num === 1
        ? "Zona VIP"
        : [2, 3, 4, 5, 25, 32].includes(num)
        ? "Pista Central"
        : num === 35
        ? "Área de Escenario"
        : "Salón Los Cristales";
    return {
      id: `tbl-${String(num).padStart(2, "0")}`,
      eventId: EVENT_ID,
      tableNumber: num,
      tableName: num === 1 ? "Mesa de Honor" : num === 2 ? "Mesa Familia Paterna" : `Mesa ${String(num).padStart(2, "0")}`,
      capacity: [2, 6, 26].includes(num) ? 12 : 10,
      zone,
      posX: null,
      posY: null,
      isVip,
      isActive: true,
      notes: null,
      createdAt: now,
      updatedAt: now,
    };
  });

  /* ── Guests ── */
  const people: any[] = [];
  const guests: any[] = [];
  const rsvps: any[] = [];
  const assignments: any[] = [];

  const DC_NUMBERS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 31,
    32, 33, 34, 35, 36, 38, 39, 41, 42, 43, 44, 45, 47, 48, 49, 51, 52, 53, 54, 55, 56, 58, 59, 61,
    62, 63, 64, 65, 66, 67, 68, 69, 71, 72, 73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 84, 85, 86, 87,
    88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    111, 112, 113, 114, 115,
  ];

  const tableLoad: Record<string, number> = {};
  const VIP_COUNT = 8;
  const TOTAL = VIP_COUNT + DC_NUMBERS.length; // 107 titulares, como el evento real

  for (let i = 0; i < TOTAL; i++) {
    const isVip = i < VIP_COUNT;
    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const lastName = `${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]} ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}`;
    const code = isVip
      ? `VIP-DC-${String(i + 1).padStart(3, "0")}`
      : `DC-2026-${String(DC_NUMBERS[i - VIP_COUNT]).padStart(3, "0")}`;
    const maxSeats = isVip ? 3 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 4);

    // Estado RSVP realista a ~4 semanas del evento
    const r = rand();
    const status = isVip || r < 0.62 ? "confirmed" : r < 0.88 ? "invited" : r < 0.95 ? "declined" : "waitlist";
    const confirmedSeats = status === "confirmed" ? Math.max(1, maxSeats - (rand() < 0.25 ? 1 : 0)) : 0;
    const hasPhone = rand() > 0.12;

    const personId = `per-${i + 1}`;
    const guestId = `gst-${i + 1}`;
    people.push({
      id: personId,
      firstName,
      lastName,
      email: null,
      // Números ficticios en formato E.164 de Nicaragua (no asignados a personas reales)
      phone: hasPhone ? `+505 5${String(1000000 + Math.floor(rand() * 8999999)).slice(0, 3)}-${String(1000 + Math.floor(rand() * 8999)).slice(0, 4)}` : null,
      avatarUrl: null,
      notes: null,
      createdAt: iso(60 * 24 * (40 - (i % 30))),
      updatedAt: now,
    });
    guests.push({
      id: guestId,
      eventId: EVENT_ID,
      personId,
      invitationCode: code,
      status,
      tier: isVip ? "vip" : "guest",
      maxSeats,
      confirmedSeats,
      isVip,
      internalNotes: rand() < 0.08 ? "Dieta/Requerimiento: Vegetariano" : null,
      createdAt: iso(60 * 24 * (40 - (i % 30)) + i),
      updatedAt: now,
    });

    if (status === "confirmed" || status === "declined") {
      rsvps.push({
        id: `rsvp-${i + 1}`,
        eventId: EVENT_ID,
        eventGuestId: guestId,
        response: status === "confirmed" ? "attending" : "declined",
        confirmedCount: status === "confirmed" ? confirmedSeats : 0,
        attendingCeremony: status === "confirmed",
        attendingReception: status === "confirmed",
        guestMessage: null,
        dietaryNotes: null,
        songRequest: null,
        createdAt: iso(60 * 24 * (20 - (i % 15))),
        updatedAt: now,
      });
    }

    // Asignación de mesa: VIP → mesas 1-2, el resto se reparte por capacidad
    if (status !== "declined" && (isVip || rand() < 0.86)) {
      const seats = confirmedSeats > 0 ? confirmedSeats : maxSeats;
      const candidates = isVip ? tables.slice(0, 2) : tables.slice(2);
      const table = candidates.find((t) => (tableLoad[t.id] || 0) + seats <= t.capacity);
      if (table) {
        tableLoad[table.id] = (tableLoad[table.id] || 0) + seats;
        assignments.push({
          id: `asg-${i + 1}`,
          eventId: EVENT_ID,
          tableId: table.id,
          eventGuestId: guestId,
          assignedSeats: seats,
          capacityOverride: false,
          overrideReason: null,
          assignedBy: "Admin D'CAROL",
          assignedAt: now,
        });
      }
    }
  }

  // Invitado de bienvenida fijo para el pase de demostración
  people[0].firstName = "Andrea";
  people[0].lastName = "Altamirano Duarte";

  /* ── Fotos del muro en vivo ── */
  const photoSpecs = [
    { by: "Camila (Mesa 7)", cap: "[Pista de Baile] ¡La entrada más bella!", st: "approved", feat: true },
    { by: "Familia Rivas", cap: "[Mesa] Brindando por Dannia 🥂", st: "approved", feat: false },
    { by: "Sebastián (Mesa 12)", cap: "[Vals] Qué momento tan especial", st: "approved", feat: true },
    { by: "Lucía Herrera", cap: "[Selfie] Con la quinceañera ✨", st: "pending", feat: false },
    { by: "Tío Ricardo", cap: "[Decoración] El salón quedó espectacular", st: "approved", feat: false },
    { by: "Valentina (Mesa 4)", cap: "[Pista de Baile] ¡A bailar!", st: "pending", feat: false },
    { by: "Abuela Carmen", cap: "[Familia] Orgullo de la familia", st: "approved", feat: true },
    { by: "Diego Solórzano", cap: "[Mesa] La mejor mesa de la noche", st: "pending", feat: false },
    { by: "Natalia (Mesa 15)", cap: "[Pastel] Qué pastel tan hermoso 🎂", st: "approved", feat: false },
    { by: "Mateo Icaza", cap: "[General] Foto borrosa", st: "rejected", feat: false },
    { by: "Regina Zelaya", cap: "[Corte de Honor] Las damas de honor", st: "approved", feat: false },
    { by: "Familia Cuadra", cap: "[Brindis] ¡Salud por Dannia!", st: "pending", feat: false },
  ];
  const photos = photoSpecs.map((p, i) => ({
    id: `pho-${i + 1}`,
    eventId: EVENT_ID,
    assetId: `ast-${i + 1}`,
    asset: {
      id: `ast-${i + 1}`,
      publicUrl: UNSPLASH(GALA_PHOTOS[i % GALA_PHOTOS.length]),
      thumbnailUrl: UNSPLASH(GALA_PHOTOS[i % GALA_PHOTOS.length], 400),
      mimeType: "image/jpeg",
    },
    uploaderGuestId: null,
    uploaderName: p.by,
    caption: p.cap,
    source: "guest_upload",
    moderationStatus: p.st,
    isFeatured: p.feat,
    liveWallDisplayed: p.st === "approved",
    likesCount: Math.floor(rand() * 40),
    takenAt: null,
    createdAt: iso(5 + i * 9),
    updatedAt: iso(5 + i * 9),
  }));

  /* ── Dedicatorias ── */
  const messageSpecs = [
    ["Familia Montalván", "Dannia, que Dios bendiga cada paso de esta nueva etapa. ¡Te queremos muchísimo!", "approved", true],
    ["Sofía & Camila", "¡Amiga, estás bellísima! Gracias por dejarnos ser parte de tu noche soñada 💙", "approved", false],
    ["Tía Patricia", "Verte crecer ha sido un regalo. Hoy brillas más que nunca, princesa.", "approved", true],
    ["Padrinos Lacayo", "Que tus sueños sean tan grandes como tu corazón. ¡Feliz XV!", "approved", false],
    ["Andrés Fonseca", "¡Qué fiesta tan increíble! Felicidades Dannia 🎉", "pending", false],
    ["Familia Obando", "Un honor celebrar contigo. Que la misericordia de Dios te acompañe siempre.", "approved", false],
    ["Mariana Téllez", "¡El vals me hizo llorar! Eres una inspiración.", "pending", false],
  ] as const;
  const messages = messageSpecs.map(([author, text, st, feat], i) => ({
    id: `msg-${i + 1}`,
    eventId: EVENT_ID,
    guestId: null,
    authorName: author,
    messageText: text,
    moderationStatus: st,
    isFeatured: feat,
    displayedOnWall: st === "approved",
    likesCount: 0,
    createdAt: iso(12 + i * 23),
  }));

  /* ── Playlist ── */
  const playlist = {
    id: "pl-1",
    eventId: EVENT_ID,
    title: "Selección Musical — D'CAROL XV",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    description: "Canciones elegidas con amor que ambientarán cada instante de la velada.",
    isPublic: true,
    tracks: [
      ...DEFAULT_EVENT_FALLBACK.playlists[0].tracks.map((t, i) => ({
        ...t,
        playlistId: "pl-1",
        album: null,
        sortOrder: i + 1,
        requestedByGuestName: null,
        createdAt: iso(60 * 24 * 10),
      })),
      { id: "tr-5", playlistId: "pl-1", title: "La Bikina", artist: "Luis Miguel", album: null, sortOrder: 999, requestedByGuestName: "Tío Ricardo", createdAt: iso(60 * 5) },
      { id: "tr-6", playlistId: "pl-1", title: "Flowers", artist: "Miley Cyrus", album: null, sortOrder: 999, requestedByGuestName: "Sofía & Camila", createdAt: iso(60 * 2) },
    ],
  };

  /* ── Automatizaciones WhatsApp ── */
  const automations = DEFAULT_AUTOMATIONS.map((a: any, i: number) => ({
    id: `auto-${i + 1}`,
    eventId: EVENT_ID,
    ...a,
    runs: [],
    createdAt: iso(60 * 24 * (30 - i)),
    updatedAt: now,
  }));

  const invitations: DemoDb["invitations"] = {};
  guests.slice(0, 64).forEach((g, i) => {
    if (i % 3 !== 2) invitations[g.id] = { status: "sent", sentAt: iso(60 * 24 * 12 + i), sentVia: "whatsapp" };
  });

  return {
    version: DB_VERSION,
    event,
    settings,
    liveState,
    people,
    guests,
    rsvps,
    tables,
    assignments,
    checkins: [],
    photos,
    messages,
    timeline,
    stages: {
      title: "Álbum de Etapas • El Viaje de Dannia",
      subtitle: "Un recorrido visual por los momentos más entrañables y sonrisas que han forjado este camino.",
      photos: CURATED_DEFAULT_STAGE_PHOTOS,
    },
    playlist,
    automations,
    automationRuns: [],
    invitations,
  };
}
