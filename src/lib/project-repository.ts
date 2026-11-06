import type { PropertyType, ProjectDossierMetadata } from "@/data/projects";
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
  logo_path?: string | null;
  tour_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  metadata?: ProjectDossierMetadata;
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
  logoPath?: string | null;
  metadata?: ProjectDossierMetadata;
}

export type ProjectMediaType =
  | "cover"
  | "gallery"
  | "masterplan"
  | "document"
  | "tour"
  | "logo"
  | "cad_source"
  | "masterplan_vector"
  | "georef";

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
  const payload: Record<string, unknown> = {
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
  if (input.logoPath !== undefined) {
    payload.logo_path = input.logoPath;
  }
  if (input.metadata !== undefined) {
    payload.metadata = input.metadata;
  }
  return payload;
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
  let { data, error } = await client
    .from("projects")
    .insert({ organization_id: organizationId, ...payload })
    .select()
    .single();

  if (error && error.message?.includes("metadata") && payload.metadata !== undefined) {
    const { metadata: _unused, ...safePayload } = payload;
    const retry = await client
      .from("projects")
      .insert({ organization_id: organizationId, ...safePayload })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

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
  let { data, error } = await client
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .select()
    .single();

  if (error && error.message?.includes("metadata") && payload.metadata !== undefined) {
    const { metadata: _unused, ...safePayload } = payload;
    const retry = await client
      .from("projects")
      .update(safePayload)
      .eq("id", projectId)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

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

export function extractStoragePath(
  pathOrUrl: string | null | undefined,
  bucket = "project-media",
): string {
  if (!pathOrUrl) return "";
  let clean = pathOrUrl.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    const marker = `/${bucket}/`;
    const idx = clean.indexOf(marker);
    if (idx !== -1) {
      clean = clean.substring(idx + marker.length);
    }
  }
  clean = clean.replace(new RegExp(`^/?${bucket}/`), "").replace(/^\/+/, "");
  return clean;
}

export function publicProjectMediaUrl(storagePath: string | null, bucket = "project-media") {
  if (!storagePath) return null;
  const clean = extractStoragePath(storagePath, bucket);
  return requireSupabase().storage.from(bucket).getPublicUrl(clean).data.publicUrl;
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
  "video/mp4",
  "application/json",
  "application/geo+json",
  "application/octet-stream",
  "image/vnd.dxf",
  "application/dxf",
  "image/x-dwg",
  "application/dwg",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "svg",
  "pdf",
  "mp4",
  "dxf",
  "dwg",
  "geojson",
  "json",
]);

export function getStorageBucketForMedia(mediaType: ProjectMediaType, extension: string): string {
  if (mediaType === "cad_source" || extension === "dxf" || extension === "dwg") {
    return "project-cad";
  }
  if (
    mediaType === "tour" &&
    (extension === "jpg" || extension === "jpeg" || extension === "webp")
  ) {
    return "project-360";
  }
  return "project-media";
}

export async function uploadProjectMedia(
  projectId: string,
  file: File,
  mediaType: ProjectMediaType,
  sortOrder: number,
) {
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(
      `El formato de "${file.name}" (.${extension}) no está permitido. Usa SVG, PNG, JPG, WebP, PDF, MP4, DXF, DWG o GeoJSON.`,
    );
  }

  const isCad = extension === "dxf" || extension === "dwg" || mediaType === "cad_source";
  const maxBytes = isCad ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `${file.name} supera el límite permitido (${Math.round(maxBytes / (1024 * 1024))} MB).`,
    );
  }

  const bucket = getStorageBucketForMedia(mediaType, extension);
  const client = requireSupabase();

  // Si se sube una nueva portada, masterplan o logotipo, eliminamos el archivo anterior del bucket y BD para no ocupar espacio
  if (mediaType === "cover" || mediaType === "masterplan" || mediaType === "logo") {
    try {
      const { data: oldMedia } = await client
        .from("project_media")
        .select("id, storage_path, bucket_id")
        .eq("project_id", projectId)
        .eq("media_type", mediaType);

      if (oldMedia && oldMedia.length > 0) {
        for (const item of oldMedia) {
          const oldPath = extractStoragePath(item.storage_path, item.bucket_id || bucket);
          if (oldPath) {
            await client.storage.from(item.bucket_id || bucket).remove([oldPath]);
          }
        }
        const oldIds = oldMedia.map((m) => m.id);
        await client.from("project_media").delete().in("id", oldIds);
      }

      const { data: proj } = await client
        .from("projects")
        .select("cover_path, masterplan_path")
        .eq("id", projectId)
        .maybeSingle();

      const existingPath =
        mediaType === "cover"
          ? proj?.cover_path
          : mediaType === "masterplan"
            ? proj?.masterplan_path
            : null;
      if (existingPath) {
        const directOldPath = extractStoragePath(existingPath, bucket);
        if (directOldPath) {
          await client.storage.from(bucket).remove([directOldPath]);
        }
      }
    } catch (cleanupError) {
      console.warn("No fue posible limpiar el recurso previo del almacenamiento:", cleanupError);
    }
  }

  const storagePath = `${projectId}/${mediaType}/${crypto.randomUUID()}-${storageSafeFileName(file.name)}`;
  const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: mediaError } = await client.from("project_media").insert({
    project_id: projectId,
    bucket_id: bucket,
    storage_path: storagePath,
    media_type: mediaType,
    title: file.name.replace(/\.[^/.]+$/, ""),
    alt_text: null,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    sort_order: sortOrder,
    is_public: bucket !== "project-cad",
  });
  if (mediaError) {
    await client.storage.from(bucket).remove([storagePath]);
    throw mediaError;
  }

  if (mediaType === "cover" || mediaType === "masterplan") {
    const column = mediaType === "cover" ? "cover_path" : "masterplan_path";
    const updates: Record<string, unknown> = { [column]: storagePath };
    if (mediaType === "masterplan") {
      updates.masterplan_version = new Date().toISOString().slice(0, 7).replace(/-/g, ".");
    }
    const { error: projectError } = await client
      .from("projects")
      .update(updates)
      .eq("id", projectId);
    if (projectError) throw projectError;
  }

  if (mediaType === "logo") {
    try {
      const { data: proj } = await client
        .from("projects")
        .select("metadata")
        .eq("id", projectId)
        .maybeSingle();
      const currentMeta = proj?.metadata && typeof proj.metadata === "object" ? proj.metadata : {};
      await client
        .from("projects")
        .update({
          metadata: { ...currentMeta, logoPath: storagePath },
        })
        .eq("id", projectId);
    } catch (metaErr) {
      console.warn("Aviso al guardar logo en metadata:", metaErr);
    }
  }

  // Registrar auditoría de subida de medio
  void client.rpc("record_audit_event", {
    p_action: "upload_media",
    p_entity_type: "media",
    p_entity_id: storagePath,
    p_project_id: projectId,
    p_details: { fileName: file.name, mediaType, bucket, sizeBytes: file.size },
  });

  const finalUrl = bucket === "project-cad" ? null : publicProjectMediaUrl(storagePath, bucket);

  return { storagePath, url: finalUrl };
}

export async function deleteProjectMedia(
  mediaId: string,
  storagePath: string,
  projectId?: string,
  mediaType?: ProjectMediaType | "tour",
) {
  const client = requireSupabase();
  const cleanPath = extractStoragePath(storagePath);

  // 1. Eliminar archivo físico de Supabase Storage para liberar espacio en disco
  if (cleanPath) {
    const { error: storageError } = await client.storage.from("project-media").remove([cleanPath]);
    if (storageError) {
      console.warn("Aviso al eliminar del bucket de almacenamiento:", storageError.message);
    }
  }

  // 2. Eliminar registro de la base de datos
  const { error: dbError } = await client.from("project_media").delete().eq("id", mediaId);
  if (dbError) throw dbError;

  // 3. Si era portada o plano urbanístico vinculado en la tabla projects, limpiar la columna
  if (projectId) {
    try {
      const { data: proj } = await client
        .from("projects")
        .select("cover_path, masterplan_path")
        .eq("id", projectId)
        .maybeSingle();

      if (proj) {
        const updates: Partial<{
          cover_path: string | null;
          masterplan_path: string | null;
        }> = {};
        if (
          mediaType === "cover" ||
          (proj.cover_path && (proj.cover_path === storagePath || proj.cover_path === cleanPath))
        ) {
          updates.cover_path = null;
        }
        if (
          mediaType === "masterplan" ||
          (proj.masterplan_path &&
            (proj.masterplan_path === storagePath || proj.masterplan_path === cleanPath))
        ) {
          updates.masterplan_path = null;
        }
        if (Object.keys(updates).length > 0) {
          await client.from("projects").update(updates).eq("id", projectId);
        }
      }
      if (mediaType === "logo") {
        try {
          const { data: p } = await client
            .from("projects")
            .select("metadata")
            .eq("id", projectId)
            .maybeSingle();
          if (p?.metadata && typeof p.metadata === "object") {
            const { logoPath: _, ...cleanMeta } = p.metadata as Record<string, unknown>;
            await client.from("projects").update({ metadata: cleanMeta }).eq("id", projectId);
          }
        } catch {
          /* ignore */
        }
      }
    } catch (columnUpdateError) {
      console.warn(
        "No fue posible desvincular el recurso en la tabla de proyectos:",
        columnUpdateError,
      );
    }
  }

  // 4. Registrar auditoría de eliminación de medio
  void client.rpc("record_audit_event", {
    p_action: "delete_media",
    p_entity_type: "media",
    p_entity_id: mediaId,
    p_project_id: projectId || null,
    p_details: { storagePath: cleanPath, mediaType },
  });
}

/**
 * Escanea y elimina archivos en Supabase Storage que no estén vinculados en la base de datos
 * para el proyecto especificado, liberando espacio residual en el bucket.
 */
export async function cleanupOrphanedProjectMedia(projectId: string): Promise<{
  removedCount: number;
  removedPaths: string[];
}> {
  const client = requireSupabase();
  const subfolders: ProjectMediaType[] = ["cover", "gallery", "masterplan", "document", "tour"];

  // Obtener todas las rutas válidas en la base de datos para este proyecto
  const { data: dbRecords } = await client
    .from("project_media")
    .select("storage_path")
    .eq("project_id", projectId);

  const { data: projectRow } = await client
    .from("projects")
    .select("cover_path, masterplan_path")
    .eq("id", projectId)
    .maybeSingle();

  const validPaths = new Set<string>();
  if (dbRecords) {
    for (const r of dbRecords) {
      const p = extractStoragePath(r.storage_path);
      if (p) validPaths.add(p);
    }
  }
  if (projectRow?.cover_path) {
    const p = extractStoragePath(projectRow.cover_path);
    if (p) validPaths.add(p);
  }
  if (projectRow?.masterplan_path) {
    const p = extractStoragePath(projectRow.masterplan_path);
    if (p) validPaths.add(p);
  }

  const orphanedPaths: string[] = [];

  for (const folder of subfolders) {
    const folderPath = `${projectId}/${folder}`;
    const { data: files, error } = await client.storage.from("project-media").list(folderPath);
    if (error || !files) continue;

    for (const file of files) {
      if (!file.name || file.name === ".emptyFolderPlaceholder") continue;
      const fullPath = `${folderPath}/${file.name}`;
      if (!validPaths.has(fullPath)) {
        orphanedPaths.push(fullPath);
      }
    }
  }

  if (orphanedPaths.length > 0) {
    const { error: removeError } = await client.storage.from("project-media").remove(orphanedPaths);
    if (removeError) {
      console.warn("Error al remover archivos huérfanos:", removeError.message);
    }
  }

  return {
    removedCount: orphanedPaths.length,
    removedPaths: orphanedPaths,
  };
}

export async function createSignedCadUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const clean = extractStoragePath(storagePath, "project-cad");
  const { data, error } = await requireSupabase()
    .storage.from("project-cad")
    .createSignedUrl(clean, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}

export interface ProjectDocumentRecord {
  id: string;
  title: string;
  storage_path: string;
  url: string;
  mime_type: string | null;
  size_bytes: number | null;
  updated_at: string;
}

export async function getProjectDocuments(projectSlug: string): Promise<ProjectDocumentRecord[]> {
  const client = requireSupabase();
  try {
    const { data, error } = await client.rpc("get_project_documents", {
      p_project_slug: projectSlug,
    });
    if (!error && Array.isArray(data)) {
      return (data as Record<string, unknown>[]).map((doc) => ({
        id: String(doc.id),
        title: String(doc.title || "Documento del proyecto"),
        storage_path: String(doc.storage_path || ""),
        url: String(
          typeof doc.url === "string" && doc.url.startsWith("http")
            ? doc.url
            : (publicProjectMediaUrl(String(doc.storage_path), "project-media") ?? doc.url ?? ""),
        ),
        mime_type: doc.mime_type ? String(doc.mime_type) : null,
        size_bytes: typeof doc.size_bytes === "number" ? doc.size_bytes : null,
        updated_at: String(doc.updated_at || new Date().toISOString()),
      }));
    }
  } catch (err) {
    console.warn("get_project_documents RPC no disponible, usando fallback:", err);
  }

  // Fallback directo
  const { data: project } = await client
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .maybeSingle();

  if (!project) return [];

  const { data: docs, error: docsError } = await client
    .from("project_media")
    .select("id, title, storage_path, mime_type, size_bytes, created_at")
    .eq("project_id", project.id)
    .eq("media_type", "document")
    .eq("is_public", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (docsError || !docs) return [];

  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title || "Documento del proyecto",
    storage_path: doc.storage_path,
    url: publicProjectMediaUrl(doc.storage_path, "project-media") ?? "",
    mime_type: doc.mime_type,
    size_bytes: doc.size_bytes,
    updated_at: doc.created_at,
  }));
}

/**
 * Actualiza el dossier y metadatos estructurados de un proyecto en Supabase
 */
export async function updateProjectDossier(
  projectId: string,
  metadata: ProjectDossierMetadata,
  features?: string[],
  longDescription?: string,
) {
  const client = requireSupabase();
  const updates: Record<string, unknown> = {
    metadata,
    updated_at: new Date().toISOString(),
  };
  if (features) updates.features = features;
  if (longDescription) updates.long_description = longDescription;

  const { data, error } = await client
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw error;
  return data as ManagedProjectRecord;
}

/**
 * Analizador heurístico para extraer secciones estructuradas de un texto pegado de PDF/dossier
 */
export function parseRawDossierText(text: string): Partial<ProjectDossierMetadata> {
  const result: Partial<ProjectDossierMetadata> = {
    rawDossierText: text,
  };

  // Ecosistema y aves
  const birdsMatch =
    text.match(/más de\s*(\d+)\s*especies de aves/i) || text.match(/(\d+)\s*especies de aves/i);
  const birdCount = birdsMatch ? parseInt(birdsMatch[1], 10) : 130;

  // Lotes y hectáreas
  const lotsMatch = text.match(/(\d+)\s*lotes/i);
  const totalLots = lotsMatch ? parseInt(lotsMatch[1], 10) : 340;

  const haMatch = text.match(/([\d,.]+)\s*hect[aá]reas/i);
  const totalAreaHa = haMatch ? parseFloat(haMatch[1].replace(",", ".")) : 25.45;

  // Lagos y senderos
  const lakesAreaMatch =
    text.match(/([\d,.]+)\s*mts?2?\s*en donde se podr[aá] practicar la pesca/i) ||
    text.match(/lagos que suman\s*([\d,.]+)/i);
  const lakesM2 = lakesAreaMatch
    ? parseFloat(lakesAreaMatch[1].replace(/\./g, "").replace(",", "."))
    : 33128;

  const greenAreasMatch = text.match(/([\d,.]+)\s*mts?2?\s*de zonas verdes/i);
  const greenM2 = greenAreasMatch
    ? parseFloat(greenAreasMatch[1].replace(/\./g, "").replace(",", "."))
    : 106322;

  const trailsMatch = text.match(/([\d,.]+)\s*metros lineales de senderismo/i);
  const trailsTotalM = trailsMatch
    ? parseFloat(trailsMatch[1].replace(/\./g, "").replace(",", "."))
    : 3479;

  result.metrics = {
    totalLots,
    areaRange: "250 – 750 m²",
    totalAreaHa,
    greenAreasM2: greenM2,
    trailsTotalM,
    trailsPerimeterM: 2154,
    trailsLakesM: 1695,
    trailsStreamM: 1784,
    internalTrailsCount: 5,
    lakesCount: 3,
    lakesAreaM2: lakesM2,
    waterTankLiters: 250000,
  };

  result.ecology = {
    reserveName: "Reserva Natural La Ciénaga",
    birdSpeciesCount: birdCount,
    forestReserveHa: 4,
    fauna: [
      "Osos Perezosos",
      "Osos Hormigueros",
      "Monos Aulladores",
      "Ardillas",
      "Iguanas",
      "Puerco Espín",
      "Loros",
      "Guacamayos Azules, Rojos e híbridos",
      "Conejos",
      "Armadillos",
      "Tortugas de diferentes especies",
      "Guartinajas",
    ],
    flora: [
      "Caracolí",
      "Ceiba Tuluá",
      "Cedro",
      "Campanos",
      "Bambús",
      "Ceiba Blanca",
      "Roble",
      "Acacia",
      "Indio Encuero",
      "Carreto",
      "Cañaguate",
      "Palo de agua",
    ],
  };

  // Extraer Por qué comprar
  const whyBuySection = text.match(
    /¿POR QU[EÉ] COMPRAR[^?]*\?([\s\S]*?)(?=Caracter[ií]sticas|Amenidades|Servicios|$)/i,
  );
  if (whyBuySection) {
    const reasons = whyBuySection[1]
      .split(/\n-|\r\n-/)
      .map((r) => r.replace(/^-/, "").trim())
      .filter((r) => r.length > 10);
    if (reasons.length > 0) {
      result.whyBuyReasons = reasons;
    }
  }

  // Extraer Amenidades
  const amenitiesSection = text.match(/Amenidades[^\n]*\n([\s\S]*?)(?=Servicios|Lago para:|$)/i);
  if (amenitiesSection) {
    const rawLines = amenitiesSection[1].split(/\n/);
    const parsed = rawLines
      .map((l) => l.replace(/^\s*\d+[\s.-]*/, "").trim())
      .filter((l) => l.length > 2 && !l.toLowerCase().startsWith("lago para"));
    if (parsed.length > 0) {
      result.amenities = parsed;
    }
  }

  // Extraer Servicios
  const servicesSection = text.match(/Servicios:([\s\S]*?)(?=Villa Paraiso|$)/i);
  if (servicesSection) {
    const sLines = servicesSection[1]
      .split(/\n-|\r\n-/)
      .map((s) => s.replace(/^-/, "").trim())
      .filter((s) => s.length > 5);
    if (sLines.length > 0) {
      result.services = sLines;
    }
  }

  return result;
}
