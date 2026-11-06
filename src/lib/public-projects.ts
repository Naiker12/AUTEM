import { useEffect, useState } from "react";
import { properties, type Property } from "@/data/properties";
import {
  formatLotDetail,
  mapDatabaseLotStatus,
  sanitizePublicLotMetadata,
  type Lot,
  type LotMetadata,
} from "@/data/lots";
import villaParaisoCadLots from "@/data/villa-paraiso-lots.json";
import { supabase } from "@/lib/supabase";

type PublicProjectRow = {
  id: string;
  slug: string;
  name: string;
  property_type: Property["type"];
  location: string;
  latitude: number | null;
  longitude: number | null;
  price_label: string | null;
  price_from_cop: number | null;
  area_label: string | null;
  description: string | null;
  long_description: string | null;
  features: string[] | null;
  cover_path: string | null;
  masterplan_path: string | null;
  masterplan_version: string | null;
  tour_url: string | null;
  metadata?: import("@/data/properties").ProjectDossierMetadata | null;
  project_media?: PublicMediaRow[];
};

type PublicMediaRow = {
  storage_path: string;
  media_type: "cover" | "gallery" | "masterplan" | "document" | "tour";
  sort_order: number;
};

function mediaUrl(storagePath: string | null) {
  if (!storagePath || !supabase) return null;
  return supabase.storage.from("project-media").getPublicUrl(storagePath).data.publicUrl;
}

function areaFromLabel(areaLabel: string | null, fallback: number) {
  const match = areaLabel?.replace(/\./g, "").match(/\d+(?:,\d+)?/);
  if (!match) return fallback;
  return Number(match[0].replace(",", ".")) || fallback;
}

const DEPRECATED_MEDIA_PATTERNS = ["autem-villa-paraiso-aerial-v2.png"];

function isDeprecatedOrDeletedMedia(path?: string | null): boolean {
  if (!path) return false;
  return DEPRECATED_MEDIA_PATTERNS.some((pattern) => path.includes(pattern));
}

function toProperty(row: PublicProjectRow): Property {
  const media = [...(row.project_media ?? [])]
    .filter((item) => !isDeprecatedOrDeletedMedia(item.storage_path))
    .sort((a, b) => a.sort_order - b.sort_order);

  const rawCover =
    (row.cover_path && !isDeprecatedOrDeletedMedia(row.cover_path)
      ? mediaUrl(row.cover_path)
      : null) ?? mediaUrl(media.find((item) => item.media_type === "cover")?.storage_path ?? null);

  const image =
    typeof rawCover === "string" && rawCover.startsWith("http")
      ? rawCover
      : mediaUrl(rawCover ?? null);

  const gallery = [
    ...new Set(
      media
        .filter((item) => item.media_type === "gallery")
        .map((item) => mediaUrl(item.storage_path))
        .filter((url): url is string => Boolean(url) && !isDeprecatedOrDeletedMedia(url)),
    ),
  ];
  const masterplan =
    mediaUrl(row.masterplan_path) ??
    mediaUrl(media.find((item) => item.media_type === "masterplan")?.storage_path ?? null);
  const fallbackTour =
    row.slug === "villa-paraiso" ? "/panoramas/villa-paraiso/pano-8192.v1.webp" : undefined;
  const tour =
    row.tour_url?.trim() ||
    fallbackTour ||
    mediaUrl(media.find((item) => item.media_type === "tour")?.storage_path ?? null);
  const price = row.price_label ?? "Consultar precio";

  const safeImages =
    gallery.length > 0 ? gallery : image && !isDeprecatedOrDeletedMedia(image) ? [image] : [];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location || "",
    zona: row.location,
    price,
    priceNumeric: row.price_from_cop ?? 0,
    m2: areaFromLabel(row.area_label, 0),
    bedrooms: 0,
    bathrooms: 0,
    type: row.property_type,
    tags: tour ? ["3D Tour"] : [],
    image: image ?? "",
    lat: row.latitude ?? 0,
    lng: row.longitude ?? 0,
    description: row.description ?? "",
    longDescription: row.long_description ?? row.description ?? "",
    features: row.features ?? [],
    floorPlan: row.area_label ?? "",
    year: new Date().getFullYear(),
    masterplanVersion: row.masterplan_version ?? undefined,
    floorPlanImage: masterplan ?? undefined,
    lotViewImage: masterplan ?? undefined,
    tourUrl: tour ?? undefined,
    tourImage: tour ?? undefined,
    images: safeImages,
    metadata:
      row.metadata ??
      properties.find(
        (p) =>
          p.slug === row.slug ||
          p.id === row.id ||
          (row.slug && row.slug.toLowerCase().includes("paraiso")),
      )?.metadata ??
      undefined,
  };
}

async function fetchPublishedProjects() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_media(storage_path, media_type, sort_order)")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data as PublicProjectRow[]).map(toProperty);
}

export function usePublishedProjects() {
  const [projects, setProjects] = useState<Property[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    let active = true;
    void fetchPublishedProjects()
      .then((data) => {
        if (active && data) setProjects(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { projects, loading };
}

export function usePublishedProject(slug: string) {
  const { projects, loading } = usePublishedProjects();
  const project = projects.find((item) => item.slug === slug || item.id === slug);
  return { project, loading };
}

type PublicLotRow = {
  external_id: string;
  lot_number: number | null;
  manzana: string | null;
  status: "available" | "reserved" | "sold" | "last_units" | "hidden";
  price_cop: number | null;
  area_m2: number | null;
  centroid: [number, number] | null;
  geometry: { pathD?: string } | null;
  metadata: LotMetadata | null;
};

// Solo se publican los lotes que existen como polígono en el plano CAD vigente (338).
const villaParaisoMappedCadLots = villaParaisoCadLots.filter((cadLot) => Boolean(cadLot.pathD));

function getInitialVillaParaisoLots(projectSlug: string): Lot[] {
  return villaParaisoMappedCadLots.map((cadLot) => {
    const normalizedManzana = cadLot.manzana ? cadLot.manzana.replace(/^M\s*/i, "") : undefined;
    return {
      id: cadLot.id,
      projectSlug,
      area: cadLot.areaM2,
      price: 0,
      status: "Disponible" as const,
      detail: formatLotDetail(normalizedManzana, false),
      terrainPosition: [0, 0] as [number, number],
      centroid: cadLot.centroid as [number, number],
      manzana: cadLot.manzana,
      lotNumber: cadLot.lotNumber,
      pathD: cadLot.pathD,
      isReserve: false,
    };
  });
}

export function usePublishedLots(projectId: string | undefined, projectSlug: string) {
  const isVillaParaiso = projectSlug === "villa-paraiso" || projectSlug === "lotes-360";
  const [lots, setLots] = useState<Lot[]>(() =>
    isVillaParaiso ? getInitialVillaParaisoLots(projectSlug) : [],
  );
  const [loading, setLoading] = useState(Boolean(supabase && projectId));

  useEffect(() => {
    if (!supabase || !projectId) {
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("lots")
          .select(
            "external_id, lot_number, manzana, status, price_cop, area_m2, centroid, geometry, metadata",
          )
          .eq("project_id", projectId)
          .order("lot_number");
        if (error) throw error;
        if (!active) return;

        if (isVillaParaiso && villaParaisoCadLots.length > 0) {
          const rowMap = new Map((data as PublicLotRow[]).map((r) => [r.external_id, r]));
          const mappedLots: Lot[] = villaParaisoMappedCadLots.map((cadLot) => {
            const row = rowMap.get(cadLot.id);
            const sanitizedMeta = sanitizePublicLotMetadata(row?.metadata);
            const isReserve = Boolean(sanitizedMeta?.isReserve);
            const normalizedManzana = cadLot.manzana
              ? cadLot.manzana.replace(/^M\s*/i, "")
              : undefined;
            return {
              id: cadLot.id,
              projectSlug,
              area: cadLot.areaM2,
              price: Number(row?.price_cop ?? 0),
              status: !row
                ? "Disponible"
                : row.status === "hidden"
                  ? "Por confirmar"
                  : mapDatabaseLotStatus(row.status),
              detail: formatLotDetail(normalizedManzana, isReserve),
              terrainPosition: [0, 0],
              centroid: cadLot.centroid as [number, number],
              manzana: cadLot.manzana,
              lotNumber: cadLot.lotNumber,
              pathD: cadLot.pathD,
              isReserve,
              metadata: sanitizedMeta,
            };
          });
          setLots(mappedLots);
        } else {
          setLots(
            (data as PublicLotRow[]).map((row) => {
              const sanitizedMeta = sanitizePublicLotMetadata(row.metadata);
              const isReserve = Boolean(sanitizedMeta?.isReserve);
              const normalizedManzana = row.manzana ? row.manzana.replace(/^M\s*/i, "") : undefined;
              return {
                id: row.external_id,
                projectSlug,
                area: Number(row.area_m2 ?? 0),
                price: Number(row.price_cop ?? 0),
                status:
                  row.status === "hidden" ? "Por confirmar" : mapDatabaseLotStatus(row.status),
                detail: formatLotDetail(normalizedManzana, isReserve),
                terrainPosition: [0, 0],
                centroid: row.centroid ?? undefined,
                manzana: row.manzana ?? undefined,
                lotNumber: row.lot_number ?? undefined,
                pathD: row.geometry?.pathD,
                isReserve,
                metadata: sanitizedMeta,
              };
            }),
          );
        }
      } catch {
        // Keep the visitor from seeing stale local inventory if the query fails.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId, projectSlug, isVillaParaiso]);

  return { lots, loading };
}

export interface ProjectGeoreference {
  id: string;
  project_id: string;
  srid: number;
  status: "missing" | "draft" | "validated";
  cad_units: string;
  origin_cad: { x: number; y: number } | null;
  origin_geo: { lat: number; lng: number } | null;
  rotation_deg: number;
  scale_factor: number;
  affine_transform: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    rmsError: number;
    controlPointCount: number;
  } | null;
  bounds_geo: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  } | null;
  control_points: Array<{
    source: { x: number; y: number };
    target: { x: number; y: number };
    label?: string;
  }>;
  notes: string | null;
  validated_at: string | null;
}

export function useProjectGeoreference(slug: string | undefined) {
  const [georeference, setGeoreference] = useState<ProjectGeoreference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;
    let active = true;
    if (!slug || !client) {
      setGeoreference(null);
      setLoading(false);
      return;
    }
    const activeClient = client;

    async function load() {
      try {
        const { data, error } = await activeClient.rpc("get_project_georeference", {
          p_project_slug: slug,
        });
        if (error) {
          // Si no existe la función o no está publicada la georreferencia, continúa sin error
          if (active) setGeoreference(null);
        } else if (active) {
          const item = Array.isArray(data) ? data[0] : data;
          setGeoreference(item ?? null);
        }
      } catch {
        if (active) setGeoreference(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  return { georeference, loading };
}
