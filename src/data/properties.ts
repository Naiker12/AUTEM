const BASE = import.meta.env.BASE_URL ?? "/";

export type PropertyType = "villa" | "apartamento" | "penthouse" | "terreno";
export type TechTag = "3D Tour" | "AR Ready" | "Nuevo lanzamiento";

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
  floorPlanPdf?: string;
  floorPlanImage?: string;
  images?: string[];
}

export const ZONAS = [
  "Bocagrande",
  "Castillogrande",
  "Manga",
  "Pie de la Popa",
  "Santa Ana",
  "Barú",
  "Turbaco",
] as const;

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
  { value: "AR Ready", label: "AR Ready" },
  { value: "Nuevo lanzamiento", label: "Nuevo lanzamiento" },
];

export const properties: Property[] = [
  {
    id: "residencia-azure",
    slug: "residencia-azure",
    name: "Residencia Azure",
    location: "Bocagrande, CO",
    zona: "Bocagrande",
    price: "Desde $1.2M USD",
    priceNumeric: 1200000,
    m2: 320,
    bedrooms: 4,
    bathrooms: 3,
    type: "villa",
    tags: ["3D Tour"],
    image: `${BASE}projects/residencia-azure/fachada.jpg`,
    lat: 10.4008,
    lng: -75.5532,
    description: "Una residencia contemporánea con vistas panorámicas al Mar Caribe.",
    longDescription:
      "Situada en la zona de Bocagrande, Residencia Azure ofrece 320 m² distribuidos en dos plantas con amplios espacios abiertos, ventanales de suelo a techo que inundan cada habitación de luz natural, y una terraza infinita con piscina privada.",
    features: [
      "Piscina infinita climatizada",
      "Domótica completa",
      "Vistas al mar",
      "Garaje para 3 vehículos",
      "Bodega privada",
      "Gimnasio equipado",
    ],
    floorPlan: "3 habitaciones + suite principal · 2 plantas · sótano",
    year: 2024,
    floorPlanImage: `${BASE}projects/residencia-azure/planta.jpg`,
    floorPlanPdf: `${BASE}projects/residencia-azure/export.pdf`,
    images: [
      `${BASE}projects/residencia-azure/fachada.jpg`,
      `${BASE}projects/residencia-azure/sala.jpg`,
      `${BASE}projects/residencia-azure/habitacion-1.jpg`,
      `${BASE}projects/residencia-azure/cocina.jpg`,
      `${BASE}projects/residencia-azure/planta.jpg`,
      `${BASE}projects/residencia-azure/planta-2d.jpg`,
      `${BASE}projects/residencia-azure/planta-3d.jpg`,
    ],
  },
  {
    id: "eco-villa-sierra",
    slug: "eco-villa-sierra",
    name: "Eco-Villa Sierra",
    location: "Castillogrande, CO",
    zona: "Castillogrande",
    price: "Desde $850K USD",
    priceNumeric: 850000,
    m2: 410,
    bedrooms: 5,
    bathrooms: 4,
    type: "villa",
    tags: ["Nuevo lanzamiento"],
    image: `${BASE}projects/eco-villa-sierra/fachada.jpg`,
    lat: 10.3908,
    lng: -75.5465,
    description: "Una villa sostenible integrada en la naturaleza de Castillogrande.",
    longDescription:
      "Eco-Villa Sierra es arquitectura sostenible en el Caribe colombiano. Construida con materiales reciclados y sistemas de energía renovable, esta propiedad de 410 m² se asienta sobre una parcela de 2.000 m² con vistas panorámicas al Cerro de la Popa.",
    features: [
      "Certificación energética A",
      "Paneles solares",
      "Recolección de aguas pluviales",
      "Jardín nativo de bajo consumo",
      "Cocina exterior equipada",
      "Cargador para vehículo eléctrico",
    ],
    floorPlan: "4 habitaciones + suite · 3 plantas · azotea",
    year: 2025,
    floorPlanImage: `${BASE}projects/eco-villa-sierra/planta.jpg`,
    floorPlanPdf: `${BASE}projects/eco-villa-sierra/export.pdf`,
    images: [
      `${BASE}projects/eco-villa-sierra/fachada.jpg`,
      `${BASE}projects/eco-villa-sierra/sala.jpg`,
      `${BASE}projects/eco-villa-sierra/habitacion-1.jpg`,
      `${BASE}projects/eco-villa-sierra/cocina.jpg`,
      `${BASE}projects/eco-villa-sierra/planta.jpg`,
      `${BASE}projects/eco-villa-sierra/planta-2d.jpg`,
      `${BASE}projects/eco-villa-sierra/planta-3d.jpg`,
    ],
  },
  {
    id: "the-horizon-suite",
    slug: "the-horizon-suite",
    name: "The Horizon Suite",
    location: "Manga, CO",
    zona: "Manga",
    price: "Desde $2.1M USD",
    priceNumeric: 2100000,
    m2: 540,
    bedrooms: 6,
    bathrooms: 5,
    type: "penthouse",
    tags: ["AR Ready", "3D Tour"],
    image: `${BASE}projects/the-horizon-suite/fachada.jpg`,
    lat: 10.4102,
    lng: -75.5345,
    description: "6 suites, spa privado y acceso directo al Laguito en Manga.",
    longDescription:
      "The Horizon Suite es la suite más completa de la Manga. Con 540 m² de espacios meticulosamente diseñados, esta propiedad ofrece seis suites con baño privado, un spa de 80 m² con sauna, baño turco y jacuzzi, y una terraza panorámica con piscina de borde infinito.",
    features: [
      "Spa privado (sauna, baño turco, jacuzzi)",
      "Acceso directo al Laguito",
      "Terraza panorámica 180°",
      "Cine en casa",
      "Cava climatizada",
      "Personal de servicio incluido",
    ],
    floorPlan: "6 suites · spa · terraza 120m² · garaje 4 plazas",
    year: 2024,
    floorPlanImage: `${BASE}projects/the-horizon-suite/planta.jpg`,
    floorPlanPdf: `${BASE}projects/the-horizon-suite/export.pdf`,
    images: [
      `${BASE}projects/the-horizon-suite/fachada.jpg`,
      `${BASE}projects/the-horizon-suite/sala.jpg`,
      `${BASE}projects/the-horizon-suite/habitacion-1.jpg`,
      `${BASE}projects/the-horizon-suite/cocina.jpg`,
      `${BASE}projects/the-horizon-suite/planta.jpg`,
      `${BASE}projects/the-horizon-suite/planta-2d.jpg`,
      `${BASE}projects/the-horizon-suite/planta-3d.jpg`,
    ],
  },
  {
    id: "villa-del-carmen",
    slug: "villa-del-carmen",
    name: "Villa del Carmen",
    location: "Pie de la Popa, CO",
    zona: "Pie de la Popa",
    price: "Desde $1.5M USD",
    priceNumeric: 1500000,
    m2: 380,
    bedrooms: 4,
    bathrooms: 3,
    type: "villa",
    tags: ["Nuevo lanzamiento", "3D Tour"],
    image: `${BASE}projects/villa-del-carmen/fachada.jpg`,
    lat: 10.4215,
    lng: -75.5252,
    description: "Villa moderna con acceso directo a la bahía y vistas al centro histórico.",
    longDescription:
      "Villa del Carmen combina la elegancia del diseño contemporáneo con la serenidad del entorno caribeño. Con 380 m² y acceso directo a la bahía de Cartagena, ofrece un estilo de vida incomparable con vistas al centro histórico amurallado.",
    features: [
      "Acceso directo a la bahía",
      "Piscina infinity",
      "Cocina abierta gourmet",
      "Suite principal con terraza privada",
      "Sistema de seguridad 24/7",
      "Jardines tropicales",
    ],
    floorPlan: "4 habitaciones · 2 plantas · sótano con trastero",
    year: 2025,
    floorPlanImage: `${BASE}projects/villa-del-carmen/planta.jpg`,
    floorPlanPdf: `${BASE}projects/villa-del-carmen/export.pdf`,
    images: [
      `${BASE}projects/villa-del-carmen/fachada.jpg`,
      `${BASE}projects/villa-del-carmen/sala.jpg`,
      `${BASE}projects/villa-del-carmen/habitacion-1.jpg`,
      `${BASE}projects/villa-del-carmen/cocina.jpg`,
      `${BASE}projects/villa-del-carmen/planta.jpg`,
      `${BASE}projects/villa-del-carmen/planta-2d.jpg`,
      `${BASE}projects/villa-del-carmen/planta-3d.jpg`,
    ],
  },
  {
    id: "penthouse-solemar",
    slug: "penthouse-solemar",
    name: "Penthouse Solemar",
    location: "Bocagrande, CO",
    zona: "Bocagrande",
    price: "Desde $980K USD",
    priceNumeric: 980000,
    m2: 180,
    bedrooms: 3,
    bathrooms: 2,
    type: "penthouse",
    tags: [],
    image: `${BASE}projects/penthouse-solemar/fachada.jpg`,
    lat: 10.3972,
    lng: -75.5548,
    description: "Terraza panorámica de 60 m² con vistas 360° al mar y la ciudad.",
    longDescription:
      "Solemar ocupa la planta superior de un edificio boutique en Bocagrande. Con 180 m² y una terraza de 60 m² con vistas 360° al mar y la ciudad, es la definición de vivir en las alturas del Caribe.",
    features: [
      "Terraza panorámica 60 m²",
      "Vistas 360° al mar y ciudad",
      "Parking subterráneo",
      "Piscina comunitaria climatizada",
      "Trastero privado",
      "Cerámica de autor",
    ],
    floorPlan: "3 habitaciones · planta alta · terraza 60m²",
    year: 2024,
    floorPlanImage: `${BASE}projects/penthouse-solemar/planta.jpg`,
    floorPlanPdf: `${BASE}projects/penthouse-solemar/export.pdf`,
    images: [
      `${BASE}projects/penthouse-solemar/fachada.jpg`,
      `${BASE}projects/penthouse-solemar/sala.jpg`,
      `${BASE}projects/penthouse-solemar/habitacion-1.jpg`,
      `${BASE}projects/penthouse-solemar/cocina.jpg`,
      `${BASE}projects/penthouse-solemar/planta.jpg`,
      `${BASE}projects/penthouse-solemar/planta-2d.jpg`,
      `${BASE}projects/penthouse-solemar/planta-3d.jpg`,
    ],
  },
  {
    id: "terreno-vista-alta",
    slug: "terreno-vista-alta",
    name: "Terreno Vista Alta",
    location: "Santa Ana, CO",
    zona: "Santa Ana",
    price: "Desde $450K USD",
    priceNumeric: 450000,
    m2: 1200,
    bedrooms: 0,
    bathrooms: 0,
    type: "terreno",
    tags: ["Nuevo lanzamiento"],
    image: `${BASE}projects/terreno-vista-alta/fachada.jpg`,
    lat: 10.2825,
    lng: -75.5312,
    description: "Parcela de 1.200 m² con vistas panorámicas para proyecto a medida.",
    longDescription:
      "Terreno Vista Alta ofrece una oportunidad única para crear la villa de tus sueños en Santa Ana. Con 1.200 m² y vistas panorámicas a la bahía, esta parcela urbanizable está lista para tu proyecto personalizado.",
    features: [
      "1.200 m² urbanizable",
      "Vistas panorámicas a la bahía",
      "Acceso por camino asfaltado",
      "Servicios de agua y luz disponibles",
      "Cercano a centros comerciales",
      "Parcela esquinera",
    ],
    floorPlan: "Parcela rectangular · esquinera",
    year: 2025,
    floorPlanImage: `${BASE}projects/terreno-vista-alta/planta.jpg`,
    floorPlanPdf: `${BASE}projects/terreno-vista-alta/export.pdf`,
    images: [
      `${BASE}projects/terreno-vista-alta/lote.jpg`,
      `${BASE}projects/terreno-vista-alta/fachada.jpg`,
      `${BASE}projects/terreno-vista-alta/planta.jpg`,
      `${BASE}projects/terreno-vista-alta/planta-2d.jpg`,
      `${BASE}projects/terreno-vista-alta/planta-3d.jpg`,
    ],
  },
  {
    id: "residencia-olive",
    slug: "residencia-olive",
    name: "Residencia Olive",
    location: "Barú, CO",
    zona: "Barú",
    price: "Desde $620K USD",
    priceNumeric: 620000,
    m2: 210,
    bedrooms: 3,
    bathrooms: 2,
    type: "apartamento",
    tags: ["3D Tour"],
    image: `${BASE}projects/residencia-olive/fachada.jpg`,
    lat: 10.2355,
    lng: -75.5718,
    description: "Apartamento de diseño en Barú con vistas al Caribe.",
    longDescription:
      "Residencia Olive combina el encanto isleño con el confort moderno. Con 210 m² distribuidos en una planta, ofrece un espacio luminoso y funcional con vistas privilegiadas al mar Caribe y las playas de Barú.",
    features: [
      "Vistas al mar Caribe",
      "Terraza de 40 m²",
      "Aire acondicionado central",
      "Parking incluido",
      "Urbanización con piscina y jardines",
      "Acceso a playa privada",
    ],
    floorPlan: "3 habitaciones · 1 planta · terraza 40m²",
    year: 2024,
    floorPlanImage: `${BASE}projects/residencia-olive/planta.jpg`,
    floorPlanPdf: `${BASE}projects/residencia-olive/export.pdf`,
    images: [
      `${BASE}projects/residencia-olive/fachada.jpg`,
      `${BASE}projects/residencia-olive/sala.jpg`,
      `${BASE}projects/residencia-olive/habitacion-1.jpg`,
      `${BASE}projects/residencia-olive/cocina.jpg`,
      `${BASE}projects/residencia-olive/planta.jpg`,
      `${BASE}projects/residencia-olive/planta-2d.jpg`,
      `${BASE}projects/residencia-olive/planta-3d.jpg`,
    ],
  },
  {
    id: "villa-atlantico",
    slug: "villa-atlantico",
    name: "Villa Atlántico",
    location: "Santa Ana, CO",
    zona: "Santa Ana",
    price: "Desde $750K USD",
    priceNumeric: 750000,
    m2: 290,
    bedrooms: 4,
    bathrooms: 3,
    type: "villa",
    tags: ["Nuevo lanzamiento"],
    image: `${BASE}projects/villa-atlantico/fachada.jpg`,
    lat: 10.2862,
    lng: -75.5288,
    description: "Villa familiar con jardín tropical a minutos del centro histórico.",
    longDescription:
      "Villa Atlántico es el hogar familiar ideal en Cartagena. Con 290 m² y un jardín tropical de 500 m², ofrece espacios amplios y luminosos a solo minutos del centro histórico amurallado y la playa de Bocagrande.",
    features: [
      "Jardín tropical 500 m²",
      "Piscina privada",
      "Barbacoa integrada",
      "Habitación de servicio",
      "Doble garaje",
      "Cerca del centro histórico",
    ],
    floorPlan: "4 habitaciones · 2 plantas · garaje doble",
    year: 2025,
    floorPlanImage: `${BASE}projects/villa-atlantico/planta.jpg`,
    floorPlanPdf: `${BASE}projects/villa-atlantico/export.pdf`,
    images: [
      `${BASE}projects/villa-atlantico/fachada.jpg`,
      `${BASE}projects/villa-atlantico/sala.jpg`,
      `${BASE}projects/villa-atlantico/habitacion-1.jpg`,
      `${BASE}projects/villa-atlantico/cocina.jpg`,
      `${BASE}projects/villa-atlantico/planta.jpg`,
      `${BASE}projects/villa-atlantico/planta-2d.jpg`,
      `${BASE}projects/villa-atlantico/planta-3d.jpg`,
    ],
  },
  {
    id: "the-summit-penthouse",
    slug: "the-summit-penthouse",
    name: "The Summit Penthouse",
    location: "Castillogrande, CO",
    zona: "Castillogrande",
    price: "Desde $3.2M USD",
    priceNumeric: 3200000,
    m2: 420,
    bedrooms: 5,
    bathrooms: 4,
    type: "penthouse",
    tags: ["3D Tour"],
    image: `${BASE}projects/the-summit-penthouse/fachada.jpg`,
    lat: 10.3895,
    lng: -75.5442,
    description: "Rooftop privado con piscina y vistas panorámicas en Castillogrande.",
    longDescription:
      "The Summit Penthouse es una obra maestra de la arquitectura residencial. Con 420 m² en la planta más alta de The Summit, ofrece un rooftop privado con piscina, cocina de verano y vistas panorámicas que abarcan desde la bahía de Cartagena hasta el Mar Caribe.",
    features: [
      "Rooftop privado con piscina",
      "Cocina de verano en terraza",
      "Ascensor privado",
      "Sistema de domótica Crestron",
      "Cine privado",
      "Wine cellar para 200 botellas",
    ],
    floorPlan: "5 suites · rooftop 150m² · ascensor privado",
    year: 2024,
    floorPlanImage: `${BASE}projects/the-summit-penthouse/planta.jpg`,
    floorPlanPdf: `${BASE}projects/the-summit-penthouse/export.pdf`,
    images: [
      `${BASE}projects/the-summit-penthouse/fachada.jpg`,
      `${BASE}projects/the-summit-penthouse/sala.jpg`,
      `${BASE}projects/the-summit-penthouse/habitacion-1.jpg`,
      `${BASE}projects/the-summit-penthouse/cocina.jpg`,
      `${BASE}projects/the-summit-penthouse/planta.jpg`,
      `${BASE}projects/the-summit-penthouse/planta-2d.jpg`,
      `${BASE}projects/the-summit-penthouse/planta-3d.jpg`,
    ],
  },
  {
    id: "casa-campestre",
    slug: "casa-campestre",
    name: "Casa Campestre AUTEM",
    location: "Barú, CO",
    zona: "Barú",
    price: "Desde $680K USD",
    priceNumeric: 680000,
    m2: 388,
    bedrooms: 3,
    bathrooms: 3,
    type: "villa",
    tags: ["AR Ready", "Nuevo lanzamiento"],
    image: `${BASE}projects/casa-campestre/fachada.jpg`,
    lat: 10.2425,
    lng: -75.5682,
    description: "Casa estilo farmhouse de un piso con alberca privada y jardín tropical en Barú.",
    longDescription:
      "Casa Campestre AUTEM es una residencia de estilo campestre americano ubicada en Barú. Con 388 m² de construcción en una sola planta, ofrece un diseño cálido y funcional con techos altos de vigas de madera, amplios espacios abiertos y una integración total con el jardín tropical circundante. La alberca rectangular privada y las zonas de estar exterior la hacen ideal para familias que buscan comodidad y contacto con la naturaleza.",
    features: [
      "Alberca rectangular privada",
      "Jardín tropical amplio",
      "Techos altos con vigas de madera",
      "Integración interior-exterior",
      "Cocina gourmet abierta",
      "Terraza cubierta con asador",
    ],
    floorPlan: "3 habitaciones · 1 planta · alberca · jardín",
    year: 2025,
    floorPlanImage: `${BASE}projects/casa-campestre/planta.jpg`,
    floorPlanPdf: `${BASE}projects/casa-campestre/export.pdf`,
    images: [
      `${BASE}projects/casa-campestre/fachada.jpg`,
      `${BASE}projects/casa-campestre/sala.jpg`,
      `${BASE}projects/casa-campestre/habitacion-1.jpg`,
      `${BASE}projects/casa-campestre/cocina.jpg`,
      `${BASE}projects/casa-campestre/planta.jpg`,
      `${BASE}projects/casa-campestre/planta-2d.jpg`,
      `${BASE}projects/casa-campestre/planta-3d.jpg`,
    ],
  },
  {
    id: "eco-refugio-turbaco",
    slug: "eco-refugio-turbaco",
    name: "Eco-Refugio Turbaco",
    location: "Turbaco, Bolívar, CO",
    zona: "Turbaco",
    price: "Desde $180K USD",
    priceNumeric: 180000,
    m2: 600,
    bedrooms: 3,
    bathrooms: 2,
    type: "villa",
    tags: ["AR Ready", "Nuevo lanzamiento"],
    image: `${BASE}projects/eco-refugio-turbaco/fachada.jpg`,
    lat: 10.3324,
    lng: -75.4133,
    description:
      "Una casa de campo entre colinas verdes, a 20 minutos de Cartagena, pensada para el descanso.",
    longDescription:
      "Ubicado en Turbaco, a solo 20 minutos de Cartagena y 200 metros sobre el nivel del mar, este proyecto aprovecha el clima más fresco de la zona y su entorno de colinas y vegetación tropical. Diseñado con un vuelo LiDAR previo del lote, el proyecto respeta la topografía natural y maximiza vistas e insolación.",
    features: [
      "Clima fresco de altura (200 msnm)",
      "Zonas verdes y árboles frutales nativos",
      "Piscina exterior",
      "Diseño bioclimático",
      "Modelo 3D navegable en AR",
    ],
    floorPlan: "3 habitaciones · 2 baños · 1 planta",
    year: 2026,
    floorPlanImage: `${BASE}projects/eco-refugio-turbaco/planta.jpg`,
    floorPlanPdf: `${BASE}projects/eco-refugio-turbaco/export.pdf`,
    images: [
      `${BASE}projects/eco-refugio-turbaco/lote.jpg`,
      `${BASE}projects/eco-refugio-turbaco/fachada.jpg`,
      `${BASE}projects/eco-refugio-turbaco/sala.jpg`,
      `${BASE}projects/eco-refugio-turbaco/habitacion-1.jpg`,
      `${BASE}projects/eco-refugio-turbaco/habitacion-2.jpg`,
      `${BASE}projects/eco-refugio-turbaco/cocina.jpg`,
      `${BASE}projects/eco-refugio-turbaco/planta.jpg`,
      `${BASE}projects/eco-refugio-turbaco/planta-2d.jpg`,
      `${BASE}projects/eco-refugio-turbaco/planta-3d.jpg`,
    ],
  },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug);
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function getFloorPlanUrl(slug: string): string {
  if (typeof window === "undefined") return "";
  const property = properties.find((p) => p.slug === slug);
  if (property?.floorPlanImage) {
    const path = property.floorPlanImage.startsWith("http")
      ? property.floorPlanImage
      : `${window.location.origin}${property.floorPlanImage.startsWith("/") ? "" : "/"}${property.floorPlanImage}`;
    return path;
  }
  if (property?.floorPlanPdf) {
    const path = property.floorPlanPdf.startsWith("http")
      ? property.floorPlanPdf
      : `${window.location.origin}${property.floorPlanPdf.startsWith("/") ? "" : "/"}${property.floorPlanPdf}`;
    return path;
  }
  return `${window.location.origin}${import.meta.env.BASE_URL}properties/${slug}`;
}
