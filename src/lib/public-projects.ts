import { useEffect, useState } from "react";
import type { Property } from "@/data/properties";
import type { Lot, LotStatus } from "@/data/lots";
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
  tour_url: string | null;
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

function toProperty(row: PublicProjectRow): Property {
  const media = [...(row.project_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const cover =
    mediaUrl(row.cover_path) ?? media.find((item) => item.media_type === "cover")?.storage_path;
  const image =
    typeof cover === "string" && cover.startsWith("http") ? cover : mediaUrl(cover ?? null);
  const gallery = media
    .filter((item) => item.media_type === "gallery" || item.media_type === "cover")
    .map((item) => mediaUrl(item.storage_path))
    .filter((url): url is string => Boolean(url));
  const masterplan =
    mediaUrl(row.masterplan_path) ??
    mediaUrl(media.find((item) => item.media_type === "masterplan")?.storage_path ?? null);
  const tour = mediaUrl(media.find((item) => item.media_type === "tour")?.storage_path ?? null);
  const price = row.price_label ?? "Consultar precio";

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
    tags: row.tour_url ? ["3D Tour"] : [],
    image: image ?? "",
    lat: row.latitude ?? 0,
    lng: row.longitude ?? 0,
    description: row.description ?? "",
    longDescription: row.long_description ?? row.description ?? "",
    features: row.features ?? [],
    floorPlan: row.area_label ?? "",
    year: new Date().getFullYear(),
    floorPlanImage: masterplan ?? undefined,
    lotViewImage: masterplan ?? undefined,
    tourImage: tour ?? undefined,
    images: gallery.length ? gallery : image ? [image] : [],
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
  metadata: { isReserve?: boolean } | null;
};

const lotStatus: Record<PublicLotRow["status"], LotStatus> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
  last_units: "Últimas unidades",
  hidden: "Por confirmar",
};

export function usePublishedLots(projectId: string | undefined, projectSlug: string) {
  const [lots, setLots] = useState<Lot[]>([]);
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
        setLots(
          (data as PublicLotRow[]).map((row) => ({
            id: row.external_id,
            projectSlug,
            area: Number(row.area_m2 ?? 0),
            price: Number(row.price_cop ?? 0),
            status: lotStatus[row.status],
            detail: `${row.manzana ? `Manzana ${row.manzana.replace(/^M\s*/i, "")}` : "Proyecto"} · ${row.metadata?.isReserve ? "Zona de reserva" : "Vía interna"}`,
            terrainPosition: [0, 0],
            centroid: row.centroid ?? undefined,
            manzana: row.manzana ?? undefined,
            lotNumber: row.lot_number ?? undefined,
            pathD: row.geometry?.pathD,
            isReserve: Boolean(row.metadata?.isReserve),
          })),
        );
      } catch {
        // Keep the visitor from seeing stale local inventory if the query fails.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId, projectSlug]);

  return { lots, loading };
}
