export interface StagePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  caption: string;
  stageKey: "infancia" | "ninez" | "adolescencia" | "pre_xv" | "actualidad" | string;
  stageLabel: string;
  year: number;
  takenAt?: string | null;
  cameraInfo?: string;
  sortOrder: number;
  isFeatured?: boolean;
  source?: "planner_bulk" | "curated_default" | "official";
  hash?: string;
}

export const CURATED_DEFAULT_STAGE_PHOTOS: StagePhoto[] = [
  {
    id: "stage-1-infancia-1",
    url: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&q=80&w=1000",
    thumbnailUrl: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&q=80&w=400",
    title: "Mis Primeros Pasos",
    caption: "Dando mis primeros pasitos en el jardín, sostenida del amor incondicional de mis padres y con una sonrisa que iluminaba cada rincón.",
    stageKey: "infancia",
    stageLabel: "Primera Infancia",
    year: 2012,
    takenAt: "2012-04-18T15:30:00.000Z",
    cameraInfo: "Canon EOS Digital",
    sortOrder: 1,
    isFeatured: true,
    source: "curated_default",
  },
  {
    id: "stage-1-infancia-2",
    url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=1000",
    thumbnailUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=400",
    title: "Tardes de Juegos & Ternura",
    caption: "Los abrazos de mis abuelitos, las muñecas favoritas y la dulzura inocente que marcó mis primeros años en el hogar.",
    stageKey: "infancia",
    stageLabel: "Primera Infancia",
    year: 2014,
    takenAt: "2014-07-22T17:15:00.000Z",
    cameraInfo: "Nikon D3200",
    sortOrder: 2,
    isFeatured: false,
    source: "curated_default",
  },
  {
    id: "stage-2-ninez-1",
    url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=1000",
    thumbnailUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400",
    title: "Primer Día de Clases & Sueños",
    caption: "Mochila lista, listones en el cabello y un corazón curioso listo para explorar el mundo, leer sus primeros cuentos y hacer amistades eternas.",
    stageKey: "ninez",
    stageLabel: "Niñez",
    year: 2017,
    takenAt: "2017-02-06T08:00:00.000Z",
    cameraInfo: "Sony Alpha 6000",
    sortOrder: 3,
    isFeatured: true,
    source: "curated_default",
  },
  {
    id: "stage-2-ninez-2",
    url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1000",
    thumbnailUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400",
    title: "La Magia del Baile & la Expresión",
    caption: "Descubriendo el ritmo, la música y el escenario. Cada presentación escolar era una fiesta llena de aplausos familiares.",
    stageKey: "ninez",
    stageLabel: "Niñez",
    year: 2019,
    takenAt: "2019-11-14T19:20:00.000Z",
    cameraInfo: "iPhone XR",
    sortOrder: 4,
    isFeatured: false,
    source: "curated_default",
  },
  {
    id: "stage-3-adol-1",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1000",
    thumbnailUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400",
    title: "Creciendo con Valentía & Amistad",
    caption: "Años de risas cómplices, momentos compartidos y el nacimiento de amistades que hoy me acompañan.",
    stageKey: "adolescencia",
    stageLabel: "Adolescencia",
    year: 2022,
    takenAt: "2022-09-10T16:45:00.000Z",
    cameraInfo: "iPhone 12 Pro",
    sortOrder: 5,
    isFeatured: true,
    source: "curated_default",
  },
  {
    id: "stage-3-adol-2",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    title: "Ilusiones que Toman Forma",
    caption: "Comenzar a imaginar cómo sería llegar a mis quince años. Guardando cada meta y descubriendo mi propia voz.",
    stageKey: "adolescencia",
    stageLabel: "Adolescencia",
    year: 2024,
    takenAt: "2024-05-18T18:10:00.000Z",
    cameraInfo: "Canon EOS R6",
    sortOrder: 6,
    isFeatured: false,
    source: "curated_default",
  },
  {
    id: "stage-4-pre-1",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000",
    thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400",
    title: "Sesión Previa: El Vestido Azul Zafiro",
    caption: "La primera vez que me probé el vestido de quinceañera. Mirarme al espejo y sentir que cada sueño de niña se hacía realidad.",
    stageKey: "pre_xv",
    stageLabel: "Sesión Pre-XV",
    year: 2025,
    takenAt: "2025-11-20T16:00:00.000Z",
    cameraInfo: "Sony FX3",
    sortOrder: 7,
    isFeatured: true,
    source: "curated_default",
  },
  {
    id: "stage-5-hoy-1",
    url: "https://lh3.googleusercontent.com/aida/AEtjO1VM1tasSkyYoxqk8mEdEIyKCqiXzv3Ho224AcQfbd8Tg5mLDxhaoEAaLPXFlfzAI9rZnmFqyhDbmgslJeK_uMBvjoeBcds6eOpun1nsQDBu0C2h_iE-JNGLJeQXcdxrPsDL_rV_piihE36UDZhFn_TzWlhnwzKdIk8z273Hsy6GvT8nkLixZ9P89ZFV4bUu1eoX77kelnSw-OEE4e-LGSOVLFc3PKQAmDrx09aFCNIY3R8ENIbiCTZX",
    thumbnailUrl: "https://lh3.googleusercontent.com/aida/AEtjO1VM1tasSkyYoxqk8mEdEIyKCqiXzv3Ho224AcQfbd8Tg5mLDxhaoEAaLPXFlfzAI9rZnmFqyhDbmgslJeK_uMBvjoeBcds6eOpun1nsQDBu0C2h_iE-JNGLJeQXcdxrPsDL_rV_piihE36UDZhFn_TzWlhnwzKdIk8z273Hsy6GvT8nkLixZ9P89ZFV4bUu1eoX77kelnSw-OEE4e-LGSOVLFc3PKQAmDrx09aFCNIY3R8ENIbiCTZX",
    title: "Hoy: Mis Quince Años",
    caption: "Celebrando mis quince años en el Hotel Holiday Inn Managua. Lista para compartir esta hermosa noche junto a todos ustedes.",
    stageKey: "actualidad",
    stageLabel: "Hoy: Mis XV Años",
    year: 2026,
    takenAt: "2026-10-18T19:00:00.000Z",
    cameraInfo: "D'CAROL Producción",
    sortOrder: 8,
    isFeatured: true,
    source: "curated_default",
  },
];
