const BASE = import.meta.env.BASE_URL ?? "/";

export type PropertyType = "villa" | "apartamento" | "penthouse" | "terreno";
export type TechTag = "3D Tour" | "Nuevo lanzamiento";

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
  tourImage?: string;
  images?: string[];
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
    slug: "lotes-360",
    name: "Villa Paraíso",
    location: "Santa Rosa · Villanueva, Bolívar",
    zona: "Santa Rosa · Villanueva",
    price: "Lotes desde $161M COP",
    priceNumeric: 161000000,
    m2: 280,
    bedrooms: 0,
    bathrooms: 0,
    type: "terreno",
    tags: ["3D Tour"],
    image: "",
    lat: 10.436829,
    lng: -75.356179,
    description:
      "Parcelación campestre de 343 lotes con vías internas, naturaleza protegida y amenidades.",
    longDescription:
      "Villa Paraíso reúne 343 lotes campestres en Santa Rosa · Villanueva, Bolívar. Cuenta con vías internas pavimentadas, corredores biológicos naturales, zona social y acceso controlado a pocos minutos de Cartagena.",
    features: [
      "343 lotes campestres",
      "Vías internas pavimentadas",
      "Corredores naturales y arroyo",
      "Zona social y amenidades",
      "Redes y servicios planificados",
      "Acceso y portería controlada",
    ],
    floorPlan: "Parcelación campestre · 343 lotes",
    year: 2026,
    floorPlanImage: undefined,
    lotViewImage: undefined,
    floorPlanPdf: undefined,
    images: [],
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
      ((id === "villa-paraiso" || id === "lotes-360" || id === "residencia-azure") &&
        (p.slug === "villa-paraiso" || p.slug === "lotes-360" || p.id === "lotes-360")),
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
