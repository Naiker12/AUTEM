import propertyAzure from "@/assets/property-azure.jpg";
import propertySierra from "@/assets/property-sierra.jpg";
import propertyHorizon from "@/assets/property-horizon.jpg";
import heroVilla from "@/assets/hero-villa.jpg";

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
}

export const ZONAS = [
  "Marbella",
  "Benahavís",
  "Sotogrande",
  "Estepona",
  "Fuengirola",
  "Mijas",
] as const;

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
    location: "Marbella, ES",
    zona: "Marbella",
    price: "Desde €1.2M",
    priceNumeric: 1200000,
    m2: 320,
    bedrooms: 4,
    bathrooms: 3,
    type: "villa",
    tags: ["3D Tour"],
    image: propertyAzure,
    lat: 36.5085,
    lng: -4.8833,
    description: "Una residencia contemporánea con vistas panorámicas al Mediterráneo.",
    longDescription:
      "Situada en la exclusiva zona de Marbella, Residencia Azure ofrece una experiencia de vida incomparable. Con 320 m² distribuidos en dos plantas, la propiedad cuenta con amplios espacios abiertos, ventanales de suelo a techo que inundan cada habitación de luz natural, y una terraza infinita con piscina privada.",
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
  },
  {
    id: "eco-villa-sierra",
    slug: "eco-villa-sierra",
    name: "Eco-Villa Sierra",
    location: "Benahavís, ES",
    zona: "Benahavís",
    price: "Desde €850k",
    priceNumeric: 850000,
    m2: 410,
    bedrooms: 5,
    bathrooms: 4,
    type: "villa",
    tags: ["Nuevo lanzamiento"],
    image: propertySierra,
    lat: 36.5242,
    lng: -4.9928,
    description: "Una villa sostenible integrada en la naturaleza de Benahavís.",
    longDescription:
      "Eco-Villa Sierra representa el futuro de la arquitectura sostenible en la Costa del Sol. Construida con materiales reciclados y sistemas de energía renovable, esta propiedad de 410 m² se asienta sobre una parcela de 2,000 m² con vistas panorámicas a la Sierra de las Nieves.",
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
  },
  {
    id: "the-horizon-suite",
    slug: "the-horizon-suite",
    name: "The Horizon Suite",
    location: "Sotogrande, ES",
    zona: "Sotogrande",
    price: "Desde €2.1M",
    priceNumeric: 2100000,
    m2: 540,
    bedrooms: 6,
    bathrooms: 5,
    type: "penthouse",
    tags: ["AR Ready", "3D Tour"],
    image: propertyHorizon,
    lat: 36.2913,
    lng: -5.2948,
    description: "El pináculo del lujo en Sotogrande. Suite de 540 m² con spa privado.",
    longDescription:
      "The Horizon Suite redefine el concepto de lujo en Sotogrande. Con 540 m² de espacios meticulosamente diseñados, esta propiedad ofrece seis suites con baño privado, un spa de 80 m² con sauna, baño turco y jacuzzi, y una terraza panorámica con piscina de borde infinito.",
    features: [
      "Spa privado (sauna, baño turco, jacuzzi)",
      "Acceso directo a golf Valderrama",
      "Terraza panorámica 180°",
      "Cine en casa",
      "Cava climatizada",
      "Personal de servicio incluido",
    ],
    floorPlan: "6 suites · spa · terraza 120m² · garaje 4 plazas",
    year: 2024,
  },
  {
    id: "villa-del-carmen",
    slug: "villa-del-carmen",
    name: "Villa del Carmen",
    location: "Estepona, ES",
    zona: "Estepona",
    price: "Desde €1.5M",
    priceNumeric: 1500000,
    m2: 380,
    bedrooms: 4,
    bathrooms: 3,
    type: "villa",
    tags: ["Nuevo lanzamiento", "3D Tour"],
    image: heroVilla,
    lat: 36.4283,
    lng: -5.1494,
    description: "Villa moderna a primeralínea con acceso directo a la playa.",
    longDescription:
      "Villa del Carmen combina la elegancia del diseño contemporáneo con la serenidad del entorno costero. Con 380 m² y acceso directo a la playa, ofrece un estilo de vida incomparable en la Costa del Sol.",
    features: [
      "Acceso directo a la playa",
      "Piscina infinity",
      "Cocina abierta gourmet",
      "Suite principal con terraza privada",
      "Sistema de seguridad 24/7",
      "Jardines tropicales",
    ],
    floorPlan: "4 habitaciones · 2 plantas · sótano con trastero",
    year: 2025,
  },
  {
    id: "penthouse-solemar",
    slug: "penthouse-solemar",
    name: "Penthouse Solemar",
    location: "Marbella, ES",
    zona: "Marbella",
    price: "Desde €980k",
    priceNumeric: 980000,
    m2: 180,
    bedrooms: 3,
    bathrooms: 2,
    type: "penthouse",
    tags: ["AR Ready"],
    image: propertyAzure,
    lat: 36.5108,
    lng: -4.8782,
    description: "Penthouse de lujo con terraza panorámica en la Golden Mile.",
    longDescription:
      "Solemar ocupa la planta superior de un edificio boutique en la Golden Mile de Marbella. Con 180 m² y una terraza de 60 m² con vistas 360° al mar y la Sierra, es la definición de vivir en las alturas.",
    features: [
      "Terraza panorámica 60 m²",
      "Vistas 360° al mar y montaña",
      "Parking subterráneo",
      "Piscina comunitaria climatizada",
      "Trastero privado",
      "Cerámica de autor",
    ],
    floorPlan: "3 habitaciones · planta alta · terraza 60m²",
    year: 2024,
  },
  {
    id: "terreno-vista-alta",
    slug: "terreno-vista-alta",
    name: "Terreno Vista Alta",
    location: "Benahavís, ES",
    zona: "Benahavís",
    price: "Desde €450k",
    priceNumeric: 450000,
    m2: 1200,
    bedrooms: 0,
    bathrooms: 0,
    type: "terreno",
    tags: ["Nuevo lanzamiento"],
    image: propertySierra,
    lat: 36.5198,
    lng: -4.989,
    description: "Parcela de 1.200 m² con vistas panorámicas para proyecto a medida.",
    longDescription:
      "Terreno Vista Alta ofrece una oportunidad única para crear la villa de tus sueños en Benahavís. Con 1.200 m² y vistas panorámicas al valle, esta parcelaurbanizable está lista para tu proyecto personalizado.",
    features: [
      "1.200 m² urbanizable",
      "Vistas panorámicas al valle",
      "Acceso por camino asfaltado",
      "Servicios de agua y luz disponibles",
      "Cercano a centros comerciales",
      "Parcela esquinera",
    ],
    floorPlan: "Parcela rectangular · esquinera",
    year: 2025,
  },
  {
    id: "residencia-olive",
    slug: "residencia-olive",
    name: "Residencia Olive",
    location: "Mijas, ES",
    zona: "Mijas",
    price: "Desde €620k",
    priceNumeric: 620000,
    m2: 210,
    bedrooms: 3,
    bathrooms: 2,
    type: "apartamento",
    tags: ["3D Tour"],
    image: propertyHorizon,
    lat: 36.5952,
    lng: -4.6398,
    description: "Apartamento de diseño en Mijas con vistas al campo de golf.",
    longDescription:
      "Residencia Olive combina el encanto del pueblo blanco con el confort moderno. Con 210 m² distribuidos en una planta, ofrece un espacio luminoso y funcional con vistas privilegiadas al campo de golf de Mijas.",
    features: [
      "Vistas al campo de golf",
      "Terraza de 40 m²",
      "Aire acondicionado central",
      "Parking incluido",
      "Urbanización con piscina y jardines",
      "Cerca del centro histórico",
    ],
    floorPlan: "3 habitaciones · 1 planta · terraza 40m²",
    year: 2024,
  },
  {
    id: "villa-atlantico",
    slug: "villa-atlantico",
    name: "Villa Atlántico",
    location: "Fuengirola, ES",
    zona: "Fuengirola",
    price: "Desde €750k",
    priceNumeric: 750000,
    m2: 290,
    bedrooms: 4,
    bathrooms: 3,
    type: "villa",
    tags: ["AR Ready", "Nuevo lanzamiento"],
    image: propertyAzure,
    lat: 36.5413,
    lng: -4.6294,
    description: "Villa familiar a 500m de la playa con jardín tropical.",
    longDescription:
      "Villa Atlántico es el hogar familiar ideal en la Costa del Sol. Con 290 m² y un jardín tropical de 500 m², ofrece espacios amplios y luminosos a solo 500 metros de la playa de Fuengirola.",
    features: [
      "500m de la playa",
      "Jardín tropical 500 m²",
      "Piscina privada",
      "Barbacoa integrada",
      "Habitación de servicio",
      "Doble garaje",
    ],
    floorPlan: "4 habitaciones · 2 plantas · garaje doble",
    year: 2025,
  },
  {
    id: "the-summit-penthouse",
    slug: "the-summit-penthouse",
    name: "The Summit Penthouse",
    location: "Sotogrande, ES",
    zona: "Sotogrande",
    price: "Desde €3.2M",
    priceNumeric: 3200000,
    m2: 420,
    bedrooms: 5,
    bathrooms: 4,
    type: "penthouse",
    tags: ["3D Tour", "AR Ready"],
    image: propertyHorizon,
    lat: 36.289,
    lng: -5.3012,
    description: "Penthouse exclusivo con rooftop pool en la residencia The Summit.",
    longDescription:
      "The Summit Penthouse es una obra maestra de la arquitectura residencial. Con 420 m² en la planta más alta de The Summit, ofrece un rooftop privado con piscina, cocina de verano y vistas panorámicas que abarcan desde el Estrecho de Gibraltar hasta la Costa de la Luz.",
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
  },
];

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug);
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}
