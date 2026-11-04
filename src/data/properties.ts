const BASE = import.meta.env.BASE_URL ?? "/";

export type PropertyType = "villa" | "apartamento" | "penthouse" | "terreno";
export type TechTag = "3D Tour" | "Nuevo lanzamiento";

export interface ProjectEcology {
  reserveName: string;
  birdSpeciesCount: number;
  fauna: string[];
  flora: string[];
  forestReserveHa: number;
}

export interface ProjectMetrics {
  totalLots: number;
  areaRange: string;
  totalAreaHa: number;
  greenAreasM2: number;
  trailsTotalM: number;
  trailsPerimeterM: number;
  trailsLakesM: number;
  trailsStreamM: number;
  internalTrailsCount: number;
  lakesCount: number;
  lakesAreaM2: number;
  waterTankLiters: number;
}

export interface ProjectLocationDistance {
  destination: string;
  time: string;
}

export interface ProjectMunicipality {
  name: string;
  department: string;
  altitudeMsnm: number;
  distanceKmToCartagena: number;
  areaKm2: number;
  description: string;
  boundaries: string;
}

export interface ProjectDossierMetadata {
  rawDossierText?: string;
  ecology?: ProjectEcology;
  metrics?: ProjectMetrics;
  locationDistances?: ProjectLocationDistance[];
  municipality?: ProjectMunicipality;
  whyBuyReasons?: string[];
  amenities?: string[];
  services?: string[];
  constructionRules?: string;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  location: string;
  zona: string;
  price: string;
  priceNumeric: number;
  m2: number;
  bedrooms: number;
  bathrooms: number;
  type: PropertyType;
  tags: TechTag[];
  image: string;
  lat: number;
  lng: number;
  description: string;
  longDescription: string;
  features: string[];
  floorPlan: string;
  year: number;
  masterplanVersion?: string;
  floorPlanPdf?: string;
  floorPlanImage?: string;
  lotViewImage?: string;
  tourImage?: string;
  tourUrl?: string;
  images?: string[];
  metadata?: ProjectDossierMetadata;
}

export const ZONAS = ["Santa Rosa · Villanueva"] as const;

const COP_PER_USD = 4200;

export function formatCOP(usd: number): string {
  const cop = usd * COP_PER_USD;
  if (cop >= 1_000_000_000) return `$${(cop / 1_000_000_000).toFixed(1)}B COP`;
  if (cop >= 1_000_000) return `$${(cop / 1_000_000).toFixed(0)}M COP`;
  if (cop >= 1_000) return `$${(cop / 1_000).toFixed(0)}K COP`;
  return `$${cop.toLocaleString("es-CO")} COP`;
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "villa", label: "Villa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "penthouse", label: "Penthouse" },
  { value: "terreno", label: "Terreno" },
];

export const TECH_TAGS: { value: TechTag; label: string }[] = [
  { value: "3D Tour", label: "3D Tour" },
  { value: "Nuevo lanzamiento", label: "Nuevo lanzamiento" },
];

export const properties: Property[] = [
  {
    id: "lotes-360",
    slug: "villa-paraiso",
    name: "Villa Paraíso",
    location: "Santa Rosa de Lima (Bolívar), a 1 km vía a Villanueva",
    zona: "Santa Rosa de Lima",
    price: "Lotes desde $161M COP",
    priceNumeric: 161000000,
    m2: 250,
    bedrooms: 0,
    bathrooms: 0,
    type: "terreno",
    tags: ["3D Tour"],
    image: "",
    lat: 10.436829,
    lng: -75.356179,
    description:
      "Villa Paraíso: 340 parcelas urbanizadas en 25,45 hectáreas dentro de la Reserva Natural La Ciénaga, con 3 grandes lagos (33.128 m²), 106.322 m² de zonas verdes y amenidades Florida Country Club.",
    longDescription:
      "El condominio Villa Paraíso es un proyecto dentro de la Reserva Natural La Ciénaga donde encontrará un ambiente tranquilo y agradable por estar rodeado de mucha fauna y flora, en esta reserva se han registrado más de 130 especies de Aves ya que es un corredor natural de aves; y además es el habitad de Osos Perezosos, Osos Hormigueros, Ardillas, Iguanas, Puerco Espin, Monos Aulladores, Loros, Guacamayos Azules, Rojos e híbridos, Conejos, Armadillos, Tortugas de diferentes especies, y muchos otros animales que se podrían apreciar en cualquier sitio dentro del condominio o en una zona boscosa de 4 hectáreas dejada para el habitad de esta fauna. El objetivo principal de este proyecto es crear una Comunidad amante de la naturaleza y que compartan en Familia un condominio con una gran variedad de Amenidades para el disfrute tanto de los niños y mascotas como de sus vecinos, familiares y amigos. El condominio Villa Paraíso tiene 2.154 metros lineales de Sendero de tres metros de ancho en todo el perímetro interno del proyecto. Además, este condominio cuenta con tres hermosos y grandes lagos que suman 33.128 mts2 en donde se podrá practicar la pesca deportiva y caminar por los 1.695 metros lineales de senderos alrededor de dichos lagos. Y puesto que lo atraviesa un arroyo también podrá caminar por los senderos a lado y lado del mismo que tiene 3 metros de ancho y en algunas partes llega a 6 y hasta 15 metros en algunos tramos; la longitud total de este sendero es de 1.784 metros.",
    features: [
      "340 lotes campestres urbanizados (250 a 750 m²)",
      "25,45 hectáreas en la Reserva Natural La Ciénaga",
      "3 grandes lagos con 33.128 m² de espejo de agua",
      "106.322 m² de zonas verdes y senderos ecológicos",
      "3.479 metros lineales de senderismo",
      "Corredor de más de 130 especies de aves registradas",
      "27 amenidades exclusivas Florida Country Club",
      "Tanque de 250.000 litros suministrando agua por gravedad",
      "Vías internas en zahorra compactada con cunetas y bordillos",
      "A 10 min del futuro Aeropuerto de Cartagena (sin peajes)",
    ],
    floorPlan: "340 lotes · 25,45 ha",
    year: 2026,
    floorPlanImage: undefined,
    lotViewImage: undefined,
    tourUrl: "/tours/villa-paraiso/index.htm",
    tourImage: "/tours/villa-paraiso/index.htm",
    floorPlanPdf: undefined,
    images: [],
    metadata: {
      ecology: {
        reserveName: "Reserva Natural La Ciénaga",
        birdSpeciesCount: 130,
        forestReserveHa: 4,
        fauna: [
          "Osos Perezosos",
          "Osos Hormigueros",
          "Monos Aulladores",
          "Ardillas",
          "Iguanas",
          "Puerco Espín",
          "Loros",
          "Guacamayos Azules, Rojos e híbridos",
          "Conejos",
          "Armadillos",
          "Tortugas de diferentes especies",
          "Guartinajas",
        ],
        flora: [
          "Caracolí",
          "Ceiba Tuluá",
          "Cedro",
          "Campanos",
          "Bambús",
          "Ceiba Blanca",
          "Roble",
          "Acacia",
          "Indio Encuero",
          "Carreto",
          "Cañaguate",
          "Palo de agua",
        ],
      },
      metrics: {
        totalLots: 340,
        areaRange: "250 – 750 m²",
        totalAreaHa: 25.45,
        greenAreasM2: 106322,
        trailsTotalM: 3479,
        trailsPerimeterM: 2154,
        trailsLakesM: 1695,
        trailsStreamM: 1784,
        internalTrailsCount: 5,
        lakesCount: 3,
        lakesAreaM2: 33128,
        waterTankLiters: 250000,
      },
      locationDistances: [
        {
          destination: "Municipio de Santa Rosa de Lima",
          time: "1 km (Vía Santa Rosa - Villanueva)",
        },
        { destination: "Futuro Aeropuerto Internacional de Cartagena", time: "10 minutos" },
        { destination: "Terminal de Transporte de Cartagena", time: "Menos de 10 minutos" },
        { destination: "Zona Norte y Playas de Manzanillo del Mar", time: "15 minutos" },
        { destination: "Club Deportivo Logos de Mozambique", time: "15 minutos" },
        { destination: "Kristal Malls (Shopping Resort)", time: "20 minutos" },
        { destination: "Zona Industrial de Mamonal", time: "25 minutos" },
        { destination: "Puente a Isla de Barú y Playa Blanca", time: "35 minutos" },
        { destination: "Vía La Cordialidad (acceso sin peajes)", time: "A 4.5 km" },
      ],
      municipality: {
        name: "Santa Rosa de Lima",
        department: "Bolívar",
        altitudeMsnm: 32,
        distanceKmToCartagena: 20,
        areaKm2: 154,
        description:
          "Despensa de los productos agrícolas de la región y ubicada a 32 metros sobre el nivel del mar a solo 20 kilómetros de Cartagena de Indias. Ha tenido un gran desarrollo comercial y de infraestructura en los últimos 5 años, con calles principales pavimentadas.",
        boundaries:
          "Norte con Clemencia, Sur con Turbaco, Este con Villanueva, y al Oeste limita con Cartagena de Indias.",
      },
      whyBuyReasons: [
        "Fácil acceso a solo 1 km del Municipio en la vía Santa Rosa - Villanueva, con servicios públicos y viabilidad de gas domiciliario.",
        "Excelente topografía alta con tanque de 250.000 litros existente que suministra agua por gravedad garantizando gran ahorro energético.",
        "Estudio hidrológico radicado en Planeación que garantiza cero inundaciones gracias al arroyo que no se desborda y lagunas de amortiguación.",
        "Conjunto cerrado con portería de lujo 24 horas, cerramiento perimetral en limoncillo y malla galvanizada plastificada en PVC con tubos galvanizados de 2”.",
        "Tres grandes lagos con 33.128 m² de espejo de agua para pesca deportiva y deportes náuticos.",
        "Más de 3.400 metros de senderos bajo frondosos árboles nativos escuchando el canto de las aves.",
        "Hábitat natural protegido con avistamiento de más de 130 especies de aves y fauna silvestre libre (osos perezosos, monos aulladores, etc.).",
        "5 senderos peatonales internos de 3 metros entre manzanas comunicando directamente con los senderos perimetrales.",
        "Alta valorización garantizada a solo 10 minutos de donde se construirá el nuevo Aeropuerto Internacional de Cartagena de Indias.",
        "Libertad de construcción con asesoría en conceptos bioclimáticos y sustentables que armonizan con la reserva.",
      ],
      amenities: [
        "Portería de Lujo y vigilancia 24 Horas",
        "Recepción y Salón de Reuniones",
        "Casa Club - Mirador",
        "Piscina para Adultos y Piscina para Niños",
        "Solárium",
        "Baños sociales",
        "Parque infantil",
        "Gimnasio de mascotas (Pet Park)",
        "Cancha múltiple de Microfútbol y Basquetbol",
        "Senderismo ecológico",
        "Ciclorrutas",
        "Gran Kiosco Social",
        "Lago para Kayaking",
        "Lago para Canotaje",
        "Lago para Pesca Deportiva",
        "Cancha para Tenis, Pádel y Voleibol",
        "Capilla",
        "Zona de lectura y meditación",
        "Zona de BBQ",
        "Puente Mirador en el Arroyo",
        "Senderos para Bicicross",
        "Bio gimnasio al aire libre",
        "Jardines y senderos florales",
        "Bosque de árboles frutales",
        "Observación de aves",
        "106.322 m² de amplias zonas verdes",
        "Copiosa vegetación y reserva boscosa protegida de 4 ha",
      ],
      services: [
        "Servicio de agua domiciliaria proveniente de pozos profundos o empresa operadora con tanques de reserva (250.000 L)",
        "Servicio de energía eléctrica",
        "Parqueadero para visitantes",
        "Alumbrado público ecológico",
        "Servicio de jardinería y mantenimiento paisajístico",
        "Probabilidad y viabilidad de gas domiciliario",
        "Accesibilidad total",
        "Circuito Cerrado de Televisión (CCTV) 24 horas",
        "Vías internas en zahorra compactada con cunetas y bordillos",
        "Cercas vivas con limoncillo y malla galvanizada plastificada en PVC con tubos galvanizados de 2”",
      ],
      constructionRules:
        "Villa Paraíso es un proyecto de libre construcción, donde se verifica que el diseño garantice la armonía con el condominio y contribuya con el cuidado y conservación del medio ambiente para lograr una valorización continua del proyecto.",
    },
  },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find(
    (p) =>
      p.slug === slug ||
      p.id === slug ||
      ((slug === "villa-paraiso" || slug === "lotes-360" || slug === "residencia-azure") &&
        (p.slug === "villa-paraiso" || p.slug === "lotes-360" || p.id === "lotes-360")),
  );
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find(
    (p) =>
      p.id === id ||
      p.slug === id ||
      ((id === "lotes-360" || id === "villa-paraiso") &&
        (p.id === "lotes-360" || p.slug === "villa-paraiso")),
  );
}
