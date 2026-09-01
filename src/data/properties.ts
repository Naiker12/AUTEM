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
  lotViewImage?: string;
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
    id: "lotes-360",
    slug: "lotes-360",
    name: "Lotes 360°",
    location: "Cartagena, CO · Parcelación campestre",
    zona: "Cartagena",
    price: "Desde $210M COP",
    priceNumeric: 210000000,
    m2: 1080,
    bedrooms: 0,
    bathrooms: 0,
    type: "terreno",
    tags: ["3D Tour"],
    image: `${BASE}projects/lotes-360/panoramica-render.png`,
    lat: 10.4008,
    lng: -75.5532,
    description: "Parcelación campestre de lotes amplios, naturaleza protegida y vistas abiertas.",
    longDescription:
      "Lotes 360° reúne lotes campestres desde 1.080 m², conectados por vías internas, corredores naturales y zonas para disfrutar el paisaje. Cada render representa una ubicación real dentro del mismo desarrollo.",
    features: [
      "Lotes desde 1.080 m²",
      "Vías internas pavimentadas",
      "Quebrada y corredores naturales",
      "Zona social campestre",
      "Miradores panorámicos",
      "Acceso controlado",
    ],
    floorPlan: "Parcelación campestre · lotes seleccionados por ubicación",
    year: 2026,
    floorPlanImage: `${BASE}projects/lotes-360/plano-lotes-render.png`,
    lotViewImage: `${BASE}projects/lotes-360/plano-lotes-render.png`,
    floorPlanPdf: undefined,
    images: [
      `${BASE}projects/lotes-360/panoramica-render.png`,
      `${BASE}projects/lotes-360/acceso-render.png`,
      `${BASE}projects/lotes-360/lot-l07-entorno-verde.png`,
      `${BASE}projects/lotes-360/lot-l12-quebrada.png`,
      `${BASE}projects/lotes-360/lot-l18-zona-social.png`,
      `${BASE}projects/lotes-360/plano-lotes-render.png`,
    ],
  },
  {
    id: "eco-villa-sierra",
    slug: "eco-villa-sierra",
    name: "Eco-Villa Sierra",
    location: "Turbaco · Castillogrande, CO",
    zona: "Turbaco",
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
    description: "Una villa sostenible integrada en la naturaleza de Turbaco.",
    longDescription:
      "Eco-Villa Sierra es arquitectura sostenible en el Caribe colombiano. Construida con materiales de vanguardia y sistemas de energía renovable, esta propiedad de 410 m² se asienta sobre una parcela con vistas panorámicas excepcionales.",
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
    lotViewImage: `${BASE}projects/eco-villa-sierra/planta-3d.jpg`,
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
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find(
    (p) =>
      p.slug === slug ||
      p.id === slug ||
      (slug === "residencia-azure" && (p.slug === "lotes-360" || p.id === "lotes-360")) ||
      (slug === "lotes-360" && (p.slug === "residencia-azure" || p.id === "residencia-azure")),
  );
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find(
    (p) =>
      p.id === id ||
      p.slug === id ||
      (id === "residencia-azure" && (p.id === "lotes-360" || p.slug === "lotes-360")) ||
      (id === "lotes-360" && (p.id === "residencia-azure" || p.slug === "residencia-azure")),
  );
}

export function getFloorPlanUrl(slug: string): string {
  if (typeof window === "undefined") return "";
  const property = getPropertyBySlug(slug);
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
