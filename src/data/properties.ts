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
