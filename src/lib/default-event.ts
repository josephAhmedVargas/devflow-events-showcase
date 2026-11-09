/**
 * default-event.ts
 * Datos de respaldo completos de alta fidelidad para D'CAROL — Dannia Carolina MIS XV 2026.
 * Garantiza que la landing page de gala y el sistema nunca colapsen por errores
 * de base de datos o cuotas de servidor (previniendo React Error #441).
 */

import { CURATED_DEFAULT_STAGE_PHOTOS } from "./stages-data";

export interface FallbackTimelineItem {
  id: string;
  startTime: string;
  endTime?: string;
  title: string;
  description: string;
  icon?: string;
  isHighlight?: boolean;
}

export interface FallbackEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  eventType: string;
  eventDate: string;
  status: string;
  phase: string;
  timezone: string;
  branding: {
    logoUrl: string;
    monogramUrl: string;
    primaryColor: string;
    accentColor: string;
  };
  profile: {
    honoreeName: string;
    profilePhotoUrl: string;
    welcomeMessage: string;
  };
  dressCodes: Array<{
    id: string;
    title: string;
    description: string;
    forbiddenColors: string[];
    paletteSuggested: string[];
  }>;
  sections: Array<{
    id: string;
    sectionKey: string;
    title: string;
    subtitle: string;
    content: any;
  }>;
  timelineItems: FallbackTimelineItem[];
  playlists: Array<{
    id: string;
    title: string;
    tracks: Array<{
      id: string;
      title: string;
      artist: string;
    }>;
  }>;
}

export const DEFAULT_EVENT_FALLBACK: FallbackEvent = {
  id: "dannia-xv-default-id",
  slug: "dannia-xv-2026",
  title: "D'CAROL — Dannia Carolina MIS XV 2026",
  subtitle: "Celebración de Quince Años",
  eventType: "quinceanera",
  eventDate: "2026-12-04T18:00:00-06:00",
  status: "published",
  phase: "pre_event",
  timezone: "America/Managua",
  branding: {
    logoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBzkp1Gb79UXobRrLQGHnahgOFNMZTmpYE35WrdDdL5Nb06s7zYMlgfaDftGN95HDq4BYfEc3sQOolZoS2E6YmKyJQTSpzw6LZaCwdtqe9qTtO6GBVO_tT0t71WJUi0ZizCVNcBppY5Ji5mEH3s2_Hs4QHsFBsgeQWuKMTBhOZawr4B78VRtcvuMtaNVUXVDG-3oUtD-y47LQt5dWQ_9qcRnsGCFzXvXF1t7W_hL5tf7RMJD-1FtF3xAaV0wWP3Hic",
    monogramUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8CTNUTYb-s4cDf4JnXI9USG9RzZJJn5gx9g4_erq0GyQRr8NeA_xutCw7tKZymdM0BhIIDbBqZ8bN3sxc1LwWCYb_nVv4wSxQY0QT0yY8PjAHS2cOrtDc5ofzhhVdYE4BcRxFtsKP6i-OlSZi27vMoI71bHtqEa5C-75egsF1HgiIIebsMprIUF-Kj0KHfukzHOP-RhsX0c_souhk2tTEw2MUNrkSh_rl78ljHu_fb5W2Lcwvb-56xLZp5p6eUKY",
    primaryColor: "#0552AC",
    accentColor: "#D4AF37",
  },
  profile: {
    honoreeName: "Dannia Carolina",
    profilePhotoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8CTNUTYb-s4cDf4JnXI9USG9RzZJJn5gx9g4_erq0GyQRr8NeA_xutCw7tKZymdM0BhIIDbBqZ8bN3sxc1LwWCYb_nVv4wSxQY0QT0yY8PjAHS2cOrtDc5ofzhhVdYE4BcRxFtsKP6i-OlSZi27vMoI71bHtqEa5C-75egsF1HgiIIebsMprIUF-Kj0KHfukzHOP-RhsX0c_souhk2tTEw2MUNrkSh_rl78ljHu_fb5W2Lcwvb-56xLZp5p6eUKY",
    welcomeMessage:
      "Hay momentos en la vida que se vuelven inolvidables cuando los compartimos con las personas que queremos.",
  },
  dressCodes: [
    {
      id: "dc-1",
      title: "Etiqueta Formal / Gala",
      description:
        "Agradecemos a nuestros invitados vestir de gala formal para acompañarnos en esta noche tan especial.",
      forbiddenColors: ["#0552AC", "#001F54", "#FFFFFF", "#F5F5F0"],
      paletteSuggested: ["#D4AF37", "#800020", "#1B4D3E", "#1E293B"],
    },
  ],
  sections: [
    {
      id: "sec-etapas",
      sectionKey: "etapas",
      title: "Álbum de Etapas • El Viaje de Dannia",
      subtitle: "Un recorrido visual por los momentos más entrañables y sonrisas que han forjado este camino.",
      content: {
        photos: CURATED_DEFAULT_STAGE_PHOTOS,
      },
    },
    {
      id: "sec-historia",
      sectionKey: "historia",
      title: "El Viaje que Construyó este Sueño",
      subtitle: "Cada etapa me preparó para esta inolvidable noche de gala.",
      content: {
        chapters: [
          {
            number: "01",
            era: "2011 — 2016",
            title: "Infancia & Primeros Pasos",
            description:
              "Años de inocencia, risas compartidas y el abrazo protector de una familia que siempre creyó en mí.",
          },
          {
            number: "02",
            era: "2017 — 2021",
            title: "Descubriendo Talentos",
            description:
              "Primeros logros escolares, amistades entrañables y el despertar de sueños que hoy comienzan a florecer.",
          },
          {
            number: "03",
            era: "2022 — 2025",
            title: "Juventud & Gratitud",
            description:
              "Años de madurez, aprendizajes, metas alcanzadas y la ilusión de llegar a este esperado día de fiesta.",
          },
          {
            number: "04",
            era: "2026",
            title: "La Gran Noche",
            description:
              "El sueño hecho realidad: vestir de gala, sonreírle al futuro y compartir con ustedes el vals más especial de mi vida.",
          },
        ],
      },
    },
    {
      id: "sec-carta",
      sectionKey: "carta",
      title: "Desde el Corazón de Dannia",
      subtitle: "Una dedicatoria para cada una de las personas que iluminan mi vida",
      content: {
        salutation: "Querida familia y amigos:",
        body: "Hay momentos en la vida que se vuelven inolvidables cuando los compartimos con las personas que queremos.\n\nCon mucha alegría y emoción, quiero invitarte a celebrar conmigo la llegada de mis 15 años, una etapa llena de sueños, ilusiones y nuevos comienzos.\n\nSerá un día muy especial para mí, y me encantaría contar con tu presencia para hacerlo aún más inolvidable.\n\n¡Espero verte y compartir juntos esta noche tan especial! 💕✨",
        signature: "Con todo mi amor, Dannia Carolina ✨",
      },
    },
  ],
  timelineItems: [
    {
      id: "tl-1",
      startTime: "2026-12-04T18:00:00-06:00",
      title: "Recepción & Bienvenida",
      description: "Bienvenida, fotos de recuerdo y cóctel de honor.",
      icon: "local_bar",
    },
    {
      id: "tl-2",
      startTime: "2026-12-04T19:00:00-06:00",
      title: "Entrada de la Quinceañera",
      description: "Presentación oficial de la Quinceañera ante familiares y amigos.",
      icon: "auto_awesome",
      isHighlight: true,
    },
    {
      id: "tl-3",
      startTime: "2026-12-04T19:30:00-06:00",
      title: "Vals & Brindis de Honor",
      description: "El tradicional vals con chambelanes, padres y palabras solemnes.",
      icon: "celebration",
    },
    {
      id: "tl-4",
      startTime: "2026-12-04T20:30:00-06:00",
      title: "Cena de Gala",
      description: "Banquete servido por el equipo del Hotel Holiday Inn Managua.",
      icon: "restaurant",
    },
    {
      id: "tl-5",
      startTime: "2026-12-04T21:30:00-06:00",
      title: "Apertura de Pista & Fiesta",
      description: "Música en vivo, sorpresas y celebración hasta la medianoche.",
      icon: "music_note",
    },
  ],
  playlists: [
    {
      id: "pl-1",
      title: "Música de la Celebración",
      tracks: [
        { id: "tr-1", title: "Tiempo de Vals", artist: "Chayanne" },
        { id: "tr-2", title: "A Thousand Years", artist: "Christina Perri" },
        { id: "tr-3", title: "Photograph", artist: "Ed Sheeran" },
        { id: "tr-4", title: "Can't Help Falling in Love", artist: "Kina Grannis" },
      ],
    },
  ],
};
