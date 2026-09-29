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

export async function listManagedProjects(organizationId: string) {
  const { data, error } = await requireSupabase()
    .from("projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as ManagedProjectRecord[];
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
