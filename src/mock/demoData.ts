export interface DemoGuest {
  id: string;
  code: string;
  name: string;
  tableNumber: number;
  tableName: string;
  totalSeats: number;
  confirmedSeats: number;
  status: "CONFIRMED" | "PENDING" | "DECLINED";
  checkedIn: boolean;
  checkedInAt?: string;
  dietaryRestrictions?: string;
  phone?: string;
  notes?: string;
}

export interface DemoTable {
  id: number;
  number: number;
  name: string;
  capacity: number;
  assignedSeats: number;
  category: "VIP" | "FAMILIA" | "AMIGOS" | "CORPORATIVO";
  location: "CENTRO" | "LATERAL_IZQ" | "LATERAL_DER" | "FONDO";
}

export interface DemoPhoto {
  id: string;
  author: string;
  message: string;
  imageUrl: string;
  createdAt: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  likes: number;
  tableNumber?: number;
}

export const INITIAL_EVENT_SETTINGS = {
  title: "Gala de XV Años · Dannia Carolina",
  shortTitle: "D'CAROL 2026",
  date: "2026-12-04T18:00:00",
  venueName: "Hotel Holiday Inn · Salón Imperial",
  venueAddress: "Pista Juan Pablo II, Managua, Nicaragua",
  wazeUrl: "https://waze.com/ul?q=Holiday%20Inn%20Managua",
  googleMapsUrl: "https://maps.google.com/?q=Holiday+Inn+Managua",
  dressCodeTitle: "Etiqueta Rigurosa / Gala",
  dressCodeDescription: "Vestido largo de gala para damas y traje formal oscuro para caballeros. El color Azul Zafiro está reservado exclusivamente para la Quinceañera.",
  reservedColors: ["#00205B", "#0552AC"],
  totalCapacity: 356,
  spotifyPlaylistUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
  showcaseMode: true,
};

export const INITIAL_GUESTS: DemoGuest[] = [
  {
    id: "g1",
    code: "VIP-DC-001",
    name: "Scarleth Mendoza",
    tableNumber: 1,
    tableName: "Mesa 1 · Honor VIP",
    totalSeats: 2,
    confirmedSeats: 2,
    status: "CONFIRMED",
    checkedIn: true,
    checkedInAt: "18:14",
    phone: "+505 8888-0001",
    notes: "Tía de la quinceañera / Madrina",
  },
  {
    id: "g2",
    code: "VIP-DC-002",
    name: "Carlos Alberto Morales",
    tableNumber: 8,
    tableName: "Mesa 8 · Amigos de Secundaria",
    totalSeats: 4,
    confirmedSeats: 4,
    status: "CONFIRMED",
    checkedIn: false,
    phone: "+505 8888-0002",
    notes: "Pase de prueba para probar el escáner",
  },
  {
    id: "g3",
    code: "VIP-DC-003",
    name: "Dra. Elena Rostrán",
    tableNumber: 3,
    tableName: "Mesa 3 · Familia Paterna",
    totalSeats: 2,
    confirmedSeats: 0,
    status: "PENDING",
    checkedIn: false,
    phone: "+505 8888-0003",
  },
  {
    id: "g4",
    code: "VIP-DC-004",
    name: "Ing. Roberto Somarriba",
    tableNumber: 12,
    tableName: "Mesa 12 · Amigos Familiares",
    totalSeats: 3,
    confirmedSeats: 3,
    status: "CONFIRMED",
    checkedIn: false,
    phone: "+505 8888-0004",
  },
  {
    id: "g5",
    code: "VIP-DC-005",
    name: "Familia Blandón Castillo",
    tableNumber: 15,
    tableName: "Mesa 15 · Colegas Médicos",
    totalSeats: 5,
    confirmedSeats: 5,
    status: "CONFIRMED",
    checkedIn: false,
    phone: "+505 8888-0005",
  },
  {
    id: "g6",
    code: "VIP-DC-006",
    name: "Lic. Mariana Silva",
    tableNumber: 2,
    tableName: "Mesa 2 · Familia Materna",
    totalSeats: 2,
    confirmedSeats: 2,
    status: "CONFIRMED",
    checkedIn: false,
    phone: "+505 8888-0006",
  },
  {
    id: "g7",
    code: "VIP-DC-007",
    name: "Dr. Fernando Gutiérrez",
    tableNumber: 5,
    tableName: "Mesa 5 · Amigos de la Infancia",
    totalSeats: 2,
    confirmedSeats: 0,
    status: "PENDING",
    checkedIn: false,
    phone: "+505 8888-0007",
  },
  {
    id: "g8",
    code: "VIP-DC-008",
    name: "Familia Centeno Vega",
    tableNumber: 9,
    tableName: "Mesa 9 · Corte de Honor",
    totalSeats: 4,
    confirmedSeats: 4,
    status: "CONFIRMED",
    checkedIn: false,
    phone: "+505 8888-0008",
  },
  {
    id: "g9",
    code: "VIP-DC-009",
    name: "Gabriel & Sofía Mendoza",
    tableNumber: 1,
    tableName: "Mesa 1 · Honor VIP",
    totalSeats: 2,
    confirmedSeats: 2,
    status: "CONFIRMED",
    checkedIn: true,
    checkedInAt: "18:22",
    phone: "+505 8888-0009",
  },
  {
    id: "g10",
    code: "VIP-DC-010",
    name: "Prof. Javier Morales",
    tableNumber: 18,
    tableName: "Mesa 18 · Docentes de Honor",
    totalSeats: 2,
    confirmedSeats: 0,
    status: "DECLINED",
    checkedIn: false,
    phone: "+505 8888-010",
  },
  {
    id: "g11",
    code: "VIP-DC-011",
    name: "Valeria Toruño",
    tableNumber: 4,
    tableName: "Mesa 4 · Dama de Honor",
    totalSeats: 1,
    confirmedSeats: 1,
    status: "CONFIRMED",
    checkedIn: false,
    phone: "+505 8888-0011",
  },
  {
    id: "g12",
    code: "VIP-DC-012",
    name: "Familia Argüello Lacayo",
    tableNumber: 7,
    tableName: "Mesa 7 · Familia Ampliada",
    totalSeats: 4,
    confirmedSeats: 4,
    status: "CONFIRMED",
    checkedIn: false,
    phone: "+505 8888-0012",
  },
];

export const INITIAL_TABLES: DemoTable[] = Array.from({ length: 35 }, (_, i) => {
  const num = i + 1;
  const isVip = num <= 2;
  const isFamily = num >= 3 && num <= 10;
  return {
    id: num,
    number: num,
    name: isVip ? `Mesa ${num} · Honor VIP` : isFamily ? `Mesa ${num} · Familia` : `Mesa ${num} · Invitados`,
    capacity: 10,
    assignedSeats: num === 1 ? 4 : num === 8 ? 4 : num === 15 ? 5 : num % 2 === 0 ? 8 : 6,
    category: isVip ? "VIP" : isFamily ? "FAMILIA" : "AMIGOS",
    location: num <= 10 ? "CENTRO" : num <= 22 ? "LATERAL_IZQ" : "LATERAL_DER",
  };
});

export const INITIAL_PHOTOS: DemoPhoto[] = [
  {
    id: "p1",
    author: "Madrina Scarleth",
    message: "¡Que noche tan mágica Dannia! Dios guíe cada paso en esta nueva etapa. Te amamos.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    createdAt: "Hace 12 min",
    status: "APPROVED",
    likes: 18,
    tableNumber: 1,
  },
  {
    id: "p2",
    author: "Carlos Morales",
    message: "¡La mejor fiesta del año! Saludos desde la mesa 8.",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
    createdAt: "Hace 24 min",
    status: "APPROVED",
    likes: 14,
    tableNumber: 8,
  },
  {
    id: "p3",
    author: "Dra. Elena Rostrán",
    message: "Hermosa decoración y qué orgullo verte cumplir tus quince primaveras.",
    imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    createdAt: "Hace 35 min",
    status: "APPROVED",
    likes: 9,
    tableNumber: 3,
  },
  {
    id: "p4",
    author: "Familia Blandón",
    message: "Un brindis por la quinceañera más bella y alegre. ¡Felicidades!",
    imageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
    createdAt: "Hace 48 min",
    status: "APPROVED",
    likes: 22,
    tableNumber: 15,
  },
];

export const TIMELINE_STAGES = [
  { time: "18:00", title: "Recepción & Cóctel de Bienvenida", active: true },
  { time: "19:30", title: "Entrada Triunfal de Dannia", active: false },
  { time: "20:15", title: "Vals de Honor & Brindis Familiar", active: false },
  { time: "21:00", title: "Cena de Gala Internacional", active: false },
  { time: "22:00", title: "Apertura de Pista & Carnaval Neón", active: false },
];
