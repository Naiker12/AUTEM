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

function sanitizeHttpUrl(rawUrl?: string | null): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("El enlace de recorrido debe ser una URL válida (https://…).");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("El enlace de recorrido solo permite protocolo HTTP o HTTPS.");
  }
  return parsed.toString();
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
    tour_url: sanitizeHttpUrl(input.tourUrl),
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };
}

export async function listManagedProjects(
  organizationId: string,
  allowedProjectIds?: string[],
): Promise<ManagedProjectRecord[]> {
  let query = requireSupabase()
    .from("projects")
    .select("*, lots(count), project_media(id, media_type)")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (allowedProjectIds !== undefined) {
    if (allowedProjectIds.length === 0) return [];
    query = query.in("id", allowedProjectIds);
  }

  const { data, error } = await query;
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
  const client = requireSupabase();
  const payload = toProjectPayload(input);
  const { data, error } = await client
    .from("projects")
    .insert({ organization_id: organizationId, ...payload })
    .select()
    .single();
  if (error) throw error;

  // Registrar auditoría
  void client.rpc("record_audit_event", {
    p_action: "create_project",
    p_entity_type: "project",
    p_entity_id: data.id,
    p_project_id: data.id,
    p_details: { name: data.name, slug: data.slug, status: data.status },
  });

  return data as ManagedProjectRecord;
}

export async function updateManagedProject(projectId: string, input: ProjectInput) {
  const client = requireSupabase();
  const payload = toProjectPayload(input);
  const { data, error } = await client
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw error;

  // Registrar auditoría
  void client.rpc("record_audit_event", {
    p_action: "update_project",
    p_entity_type: "project",
    p_entity_id: projectId,
    p_project_id: projectId,
    p_details: { name: data.name, slug: data.slug, status: data.status },
  });

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

const ALLOWED_PROJECT_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
]);

export async function uploadProjectMedia(
  projectId: string,
  file: File,
  mediaType: ProjectMediaType,
  sortOrder: number,
) {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error(`${file.name} supera el límite de 25 MB.`);
  }
  if (file.type && !ALLOWED_PROJECT_MEDIA_MIME_TYPES.has(file.type)) {
    throw new Error(
      `El formato de ${file.name} (${file.type}) no está permitido. Usa JPG, PNG, WebP, AVIF, SVG o PDF.`,
    );
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

  // Registrar auditoría de subida de medio
  void client.rpc("record_audit_event", {
    p_action: "upload_media",
    p_entity_type: "media",
    p_entity_id: storagePath,
    p_project_id: projectId,
    p_details: { fileName: file.name, mediaType, sizeBytes: file.size },
  });

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

  // Registrar auditoría de eliminación de medio
  void client.rpc("record_audit_event", {
    p_action: "delete_media",
    p_entity_type: "media",
    p_entity_id: mediaId,
    p_project_id: projectId || null,
    p_details: { storagePath, mediaType },
  });

  if (projectId && (mediaType === "cover" || mediaType === "masterplan")) {
    const column = mediaType === "cover" ? "cover_path" : "masterplan_path";
    await client
      .from("projects")
      .update({ [column]: null })
      .eq("id", projectId);
  }
}
