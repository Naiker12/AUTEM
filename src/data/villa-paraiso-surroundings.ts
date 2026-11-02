export interface PointOfInterest {
  id: string;
  name: string;
  shortName: string;
  category: "town" | "airport" | "transport" | "beach" | "leisure" | "nature";
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceKm: number;
  travelTime: string;
  highlightTag: string;
  description: string;
  keyBenefits: string[];
  directionsUrl?: string;
}

export const POI_CATEGORIES = [
  { id: "all", label: "Todos", icon: "sparkles" },
  { id: "nature", label: "Naturaleza", icon: "trees" },
  { id: "airport", label: "Aeropuerto", icon: "plane" },
  { id: "transport", label: "Movilidad & Vías", icon: "car" },
  { id: "beach", label: "Playas & Ocio", icon: "waves" },
  { id: "town", label: "Municipios", icon: "building" },
] as const;

export type PoiCategoryFilter = (typeof POI_CATEGORIES)[number]["id"];

export const VILLA_PARAISO_SURROUNDINGS: PointOfInterest[] = [
  {
    id: "reserva-cienaga",
    name: "Reserva Natural La Ciénaga",
    shortName: "Reserva La Ciénaga",
    category: "nature",
    categoryLabel: "Santuario Ecológico",
    lat: 10.4385,
    lng: -75.3525,
    distanceKm: 0.1,
    travelTime: "En el proyecto",
    highlightTag: "130+ especies de aves",
    description:
      "Reserva natural de bosque seco tropical de más de 4 hectáreas que rodea directamente a Villa Paraíso. Es un corredor biológico protegido donde habitan más de 130 especies de aves registradas, monos aulladores, osos perezosos, iguanas y flora nativa como ceibas, guayacanes y caracolíes.",
    keyBenefits: [
      "Corredor biológico protegido envolvente",
      "Avistamiento permanente de aves y fauna silvestre",
      "Aire puro, paz campestre y cero contaminación acústica",
    ],
  },
  {
    id: "santa-rosa-lima",
    name: "Municipio de Santa Rosa de Lima",
    shortName: "Santa Rosa de Lima",
    category: "town",
    categoryLabel: "Casco Urbano & Servicios",
    lat: 10.4456,
    lng: -75.3686,
    distanceKm: 1.8,
    travelTime: "1 km · 3 min",
    highlightTag: "Vecindario directo",
    description:
      "Casco urbano tradicional de Santa Rosa de Lima, despensa agrícola del norte de Bolívar. Cuenta con supermercados, centros de salud, farmacias, colegios, entidades bancarias y comercio general a solo 1 km de la portería.",
    keyBenefits: [
      "A solo 1 km de la portería de Villa Paraíso",
      "Acceso a servicios médicos, colegios y comercio local",
      "Vía intermunicipal completamente pavimentada",
    ],
  },
  {
    id: "acceso-via-villanueva",
    name: "Vía Santa Rosa – Villanueva",
    shortName: "Acceso Vía Principal",
    category: "transport",
    categoryLabel: "Vía de Acceso Principal",
    lat: 10.4355,
    lng: -75.3582,
    distanceKm: 0.3,
    travelTime: "1 minuto",
    highlightTag: "Conexión pavimentada",
    description:
      "Corredor vial intermunicipal pavimentado que conecta directamente con la portería principal de Villa Paraíso, garantizando un ingreso rápido, seguro y fluido sin trochas.",
    keyBenefits: [
      "Conexión directa con la portería del condominio",
      "Pavimentación en excelente estado",
      "Iluminación y fácil tránsito para todo tipo de vehículos",
    ],
  },
  {
    id: "nuevo-aeropuerto-cartagena",
    name: "Futuro Aeropuerto Internacional de Cartagena",
    shortName: "Nuevo Aeropuerto Bayunca",
    category: "airport",
    categoryLabel: "Megaproyecto de Infraestructura",
    lat: 10.5358,
    lng: -75.3969,
    distanceKm: 12.5,
    travelTime: "10 minutos",
    highlightTag: "Mayor plusvalía (Sin peajes)",
    description:
      "El nuevo aeropuerto internacional de Cartagena de Indias, proyectado en Bayunca para reemplazar al actual Rafael Núñez. Villa Paraíso gozará de una de las mayores valorizaciones del departamento con conexión directa en 10 minutos y sin ningún peaje.",
    keyBenefits: [
      "Trayecto de solo 10 minutos en vía descongestionada",
      "Acceso 100% libre de peajes desde Santa Rosa",
      "Máximo potencial de valorización para la inversión inmobiliaria",
    ],
  },
  {
    id: "via-cordialidad",
    name: "Vía La Cordialidad (Ruta Nacional 90)",
    shortName: "Vía La Cordialidad",
    category: "transport",
    categoryLabel: "Autopista Troncal",
    lat: 10.412,
    lng: -75.385,
    distanceKm: 4.5,
    travelTime: "6 minutos",
    highlightTag: "Sin peajes · Doble calzada",
    description:
      "Arteria vial nacional de alta capacidad que interconecta rápidamente con el casco urbano de Cartagena, la zona logística y el corredor hacia Barranquilla sin pagar peaje.",
    keyBenefits: [
      "A solo 4.5 km de Villa Paraíso",
      "Vía de doble calzada con flujo vehicular continuo",
      "Rápida integración con el sistema de transporte regional",
    ],
  },
  {
    id: "terminal-transporte-cartagena",
    name: "Terminal de Transporte de Cartagena",
    shortName: "Terminal de Cartagena",
    category: "transport",
    categoryLabel: "Movilidad Terrestre",
    lat: 10.3998,
    lng: -75.4577,
    distanceKm: 14.2,
    travelTime: "Menos de 10 min",
    highlightTag: "Conexión nacional",
    description:
      "Terminal central de transporte interdepartamental y regional de Cartagena (sector El Pozón), facilitando traslados ágiles hacia ciudades de la Costa y el interior del país.",
    keyBenefits: [
      "Menos de 10 minutos de recorrido en vehículo",
      "Rutas y flotas continuas a nivel nacional",
      "Punto neurálgico de interconexión terrestre",
    ],
  },
  {
    id: "lagos-mozambique",
    name: "Club Deportivo Lagos de Mozambique",
    shortName: "Lagos de Mozambique",
    category: "leisure",
    categoryLabel: "Club Deportivo & Social",
    lat: 10.5167,
    lng: -75.45,
    distanceKm: 15.0,
    travelTime: "15 minutos",
    highlightTag: "Deporte y vida campestre",
    description:
      "Exclusivo complejo deportivo y club campestre con canchas profesionales de fútbol, lagos y áreas recreativas para compartir fines de semana y competencias familiares.",
    keyBenefits: [
      "Canchas deportivas de primer nivel",
      "Ambiente social y campestre para toda la familia",
      "A 15 minutos en el corredor de Santa Rosa - Bayunca",
    ],
  },
  {
    id: "manzanillo-playas",
    name: "Playas de Manzanillo del Mar & Serena del Mar",
    shortName: "Playas de Manzanillo",
    category: "beach",
    categoryLabel: "Playas del Caribe & Resorts",
    lat: 10.5147,
    lng: -75.4977,
    distanceKm: 18.5,
    travelTime: "15 minutos",
    highlightTag: "Mar Caribe a 15 min",
    description:
      "Corredor de playas del norte de Cartagena, resorts como Karibana y Estelar, clubes de playa, campo de golf TPC y el Centro Hospitalario Serena del Mar operado por la Fundación Santa Fe.",
    keyBenefits: [
      "Acceso a playas caribeñas abiertas y limpias",
      "Centro Hospitalario Serena del Mar de alta complejidad",
      "Restaurantes de playa y clubes náuticos",
    ],
  },
  {
    id: "kristal-malls",
    name: "Kristal Malls (Shopping Resort · Azul de Arenas)",
    shortName: "Kristal Malls",
    category: "leisure",
    categoryLabel: "Shopping Resort de Gran Formato",
    lat: 10.505,
    lng: -75.485,
    distanceKm: 16.8,
    travelTime: "20 minutos",
    highlightTag: "Crystal Lagoons · Retail",
    description:
      "Megaproyecto comercial de gran envergadura en la Zona Norte con lagunas cristalinas artificiales (Crystal Lagoons), cines, grandes marcas, tiendas por departamento y oferta gastronómica premium.",
    keyBenefits: [
      "Shopping resort con lagunas artificiales",
      "Cines, supermercados y boutiques de lujo",
      "Gran polo de valorización comercial",
    ],
  },
  {
    id: "municipio-villanueva",
    name: "Municipio de Villanueva (Bolívar)",
    shortName: "Villanueva",
    category: "town",
    categoryLabel: "Cultura & Tradición Campestre",
    lat: 10.4442,
    lng: -75.2747,
    distanceKm: 9.0,
    travelTime: "10 minutos",
    highlightTag: "Pueblo vecino artesanal",
    description:
      "Municipio vecino conectado por la misma vía de Villa Paraíso. Reconocido por sus eventos culturales, festivales folclóricos, clima agradable y gastronomía criolla caribeña.",
    keyBenefits: [
      "A solo 10 minutos por la carretera principal",
      "Tradición artesanal y festivales típicos",
      "Abastecimiento de alimentos frescos campesinos",
    ],
  },
  {
    id: "cartagena-centro",
    name: "Cartagena de Indias (Centro Histórico & Ciudad Amurallada)",
    shortName: "Cartagena Histórica",
    category: "town",
    categoryLabel: "Ciudad Principal & Patrimonio UNESCO",
    lat: 10.4236,
    lng: -75.5478,
    distanceKm: 20.0,
    travelTime: "25 minutos",
    highlightTag: "Patrimonio de la Humanidad",
    description:
      "El centro histórico, financiero, turístico y gastronómico de Cartagena de Indias. Murallas coloniales, centros médicos de cuarto nivel, marinas y vida cosmopolita a 25 minutos de tu casa de campo.",
    keyBenefits: [
      "A solo 25 minutos del corazón de la ciudad",
      "Patrimonio Histórico y Cultural de la Humanidad",
      "Centros financieros, clínicas de alta complejidad y puertos",
    ],
  },
  {
    id: "zona-mamonal",
    name: "Zona Franca e Industrial de Mamonal",
    shortName: "Mamonal Industrial",
    category: "transport",
    categoryLabel: "Polo Logístico & Empresarial",
    lat: 10.315,
    lng: -75.505,
    distanceKm: 25.0,
    travelTime: "25 minutos",
    highlightTag: "Distrito empresarial",
    description:
      "El clúster industrial, petroquímico y logístico más importante del país. Ideal para empresarios, directivos y familias que buscan combinar trabajo y una vida campestre apacible.",
    keyBenefits: [
      "Polo de empleo e inversión empresarial clave",
      "Conexión directa por variantes viales",
      "Permite vivir en un entorno ecológico sin estrés urbano",
    ],
  },
  {
    id: "isla-baru",
    name: "Isla de Barú & Playa Blanca",
    shortName: "Isla de Barú",
    category: "beach",
    categoryLabel: "Turismo Tropical & Aguas Cristalinas",
    lat: 10.22,
    lng: -75.56,
    distanceKm: 35.0,
    travelTime: "35 minutos",
    highlightTag: "Aguas turquesas del Caribe",
    description:
      "Acceso terrestre a las paradisíacas playas de arena blanca y aguas turquesas de Barú y el Parque Nacional Natural Corales del Rosario.",
    keyBenefits: [
      "Acceso vehicular directo por el puente de Barú",
      "Deportes náuticos, buceo y arrecifes de coral",
      "Paseos de fin de semana para toda la familia",
    ],
  },
];
