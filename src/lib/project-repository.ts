import type { PropertyType } from "@/data/properties";
import { requireSupabase } from "@/lib/supabase";

export type ProjectStatus = "draft" | "published" | "archived";

export interface ManagedProjectRecord {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  property_type: PropertyType;
  location: string;
  latitude: number | null;
  longitude: number | null;
  price_label: string | null;
  price_from_cop: number | null;
  area_label: string | null;
  description: string | null;
  long_description: string | null;
  features: string[];
  cover_path: string | null;
  masterplan_path: string | null;
  masterplan_version: string | null;
  tour_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  gallery_count?: number;
  lot_count?: number;
}

export interface ProjectInput {
  slug: string;
  name: string;
  propertyType: PropertyType;
  location: string;
  status: ProjectStatus;
  priceLabel?: string | null;
  areaLabel?: string | null;
  description?: string | null;
  longDescription?: string | null;
  tourUrl?: string | null;
}

export type ProjectMediaType = "cover" | "gallery" | "masterplan" | "document" | "tour";

type ManagedProjectQueryRow = ManagedProjectRecord & {
  lots?: { count: number }[];
  project_media?: { id: string; media_type: ProjectMediaType }[];
};

function storageSafeFileName(fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : "";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${base || "archivo"}${extension}`;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toProjectPayload(input: ProjectInput) {
  const slug = normalizeSlug(input.slug || input.name);
  if (!slug) throw new Error("Escribe un nombre o identificador válido para el proyecto.");
  return {
    slug,
    name: input.name.trim(),
    property_type: input.propertyType,
    location: input.location.trim(),
    status: input.status,
    price_label: input.priceLabel?.trim() || null,
    area_label: input.areaLabel?.trim() || null,
    description: input.description?.trim() || null,
    long_description: input.longDescription?.trim() || null,
    tour_url: input.tourUrl?.trim() || null,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };
}

export async function listManagedProjects(organizationId: string): Promise<ManagedProjectRecord[]> {
  const { data, error } = await requireSupabase()
    .from("projects")
    .select("*, lots(count), project_media(id, media_type)")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ManagedProjectQueryRow[]).map((row) => ({
    ...row,
    lot_count: row.lots?.[0]?.count ?? 0,
    gallery_count: Array.isArray(row.project_media)
      ? row.project_media.filter((media) => media.media_type === "gallery").length
      : 0,
  }));
}

export async function createManagedProject(organizationId: string, input: ProjectInput) {
  const { data, error } = await requireSupabase()
    .from("projects")
    .insert({ organization_id: organizationId, ...toProjectPayload(input) })
    .select()
    .single();
  if (error) throw error;
  return data as ManagedProjectRecord;
}

export async function updateManagedProject(projectId: string, input: ProjectInput) {
  const { data, error } = await requireSupabase()
    .from("projects")
    .update(toProjectPayload(input))
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw error;
  return data as ManagedProjectRecord;
}

export function publicProjectMediaUrl(storagePath: string | null) {
  if (!storagePath) return null;
  return requireSupabase().storage.from("project-media").getPublicUrl(storagePath).data.publicUrl;
}

export interface ProjectMediaRecord {
  id: string;
  project_id: string;
  bucket_id: string;
  storage_path: string;
  media_type: ProjectMediaType | "tour";
  title: string | null;
  alt_text: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  is_public: boolean;
  created_at: string;
  url: string | null;
}

export async function listProjectMedia(projectId: string): Promise<ProjectMediaRecord[]> {
  const { data, error } = await requireSupabase()
    .from("project_media")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    url: publicProjectMediaUrl(item.storage_path),
  })) as ProjectMediaRecord[];
}

export async function uploadProjectMedia(
  projectId: string,
  file: File,
  mediaType: ProjectMediaType,
  sortOrder: number,
) {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error(`${file.name} supera el límite de 25 MB.`);
  }
  const client = requireSupabase();
  const storagePath = `${projectId}/${mediaType}/${crypto.randomUUID()}-${storageSafeFileName(file.name)}`;
  const { error: uploadError } = await client.storage
    .from("project-media")
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { error: mediaError } = await client.from("project_media").insert({
    project_id: projectId,
    bucket_id: "project-media",
    storage_path: storagePath,
    media_type: mediaType,
    title: file.name,
    alt_text: null,
    mime_type: file.type || null,
    size_bytes: file.size,
    sort_order: sortOrder,
    is_public: true,
  });
  if (mediaError) {
    await client.storage.from("project-media").remove([storagePath]);
    throw mediaError;
  }

  if (mediaType === "cover" || mediaType === "masterplan") {
    const column = mediaType === "cover" ? "cover_path" : "masterplan_path";
    const { error: projectError } = await client
      .from("projects")
      .update({ [column]: storagePath })
      .eq("id", projectId);
    if (projectError) throw projectError;
  }
  return { storagePath, url: publicProjectMediaUrl(storagePath) };
}

export async function deleteProjectMedia(
  mediaId: string,
  storagePath: string,
  projectId?: string,
  mediaType?: ProjectMediaType | "tour",
) {
  const client = requireSupabase();
  const { error: storageError } = await client.storage.from("project-media").remove([storagePath]);
  if (storageError) {
    console.warn("No fue posible eliminar el archivo físico del bucket:", storageError.message);
  }

  const { error: dbError } = await client.from("project_media").delete().eq("id", mediaId);
  if (dbError) throw dbError;

  if (projectId && (mediaType === "cover" || mediaType === "masterplan")) {
    const column = mediaType === "cover" ? "cover_path" : "masterplan_path";
    await client
      .from("projects")
      .update({ [column]: null })
      .eq("id", projectId);
  }
}
