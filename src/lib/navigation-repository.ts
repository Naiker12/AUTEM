import {
  renderedMasterplanVersion,
  masterplanBounds,
} from "@/features/terrain-navigation/masterplan-version";
import { requireSupabase } from "./supabase";
import { validateNavigationBundle } from "@/features/terrain-navigation/navigation-schema";

export async function loadPublishedNavigation(
  projectId: string,
  slug: string,
  masterplanVersion?: string,
) {
  const { data, error } = await requireSupabase()
    .from("project_navigation_versions")
    .select("payload")
    .eq("project_id", projectId)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) return null;
    throw new Error("No fue posible consultar la red publicada.");
  }
  if (!data) return null;
  const result = validateNavigationBundle(data.payload, slug);
  if (
    !masterplanVersion ||
    result.bundle.masterplanVersion !== masterplanVersion ||
    result.bundle.masterplanVersion !== (await renderedMasterplanVersion()) ||
    result.bundle.bounds.width !== masterplanBounds.width ||
    result.bundle.bounds.height !== masterplanBounds.height
  )
    throw new Error("La red y el plano tienen versiones distintas.");
  return result;
}
export async function auditNavigation(projectId: string) {
  const client = requireSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error("Inicia sesión para auditar la red.");
  const { data: project, error: projectError } = await client
    .from("projects")
    .select("organization_id,masterplan_version")
    .eq("id", projectId)
    .single();
  if (projectError) throw projectError;
  const { data: membership, error: memberError } = await client
    .from("organization_members")
    .select("role")
    .eq("organization_id", project.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberError || !membership)
    throw new Error("La cuenta no pertenece a la organización del proyecto.");
  const [nodes, edges] = await Promise.all([
    client.from("project_navigation_nodes").select("*").eq("project_id", projectId),
    client.from("project_navigation_edges").select("*").eq("project_id", projectId),
  ]);
  if (nodes.error) throw nodes.error;
  if (edges.error) throw edges.error;
  const ids = new Set(nodes.data.map((n) => n.id));
  return {
    role: membership.role,
    masterplanVersion: project.masterplan_version,
    nodes: nodes.data,
    edges: edges.data,
    invalidEdges: edges.data.filter((e) => !ids.has(e.from_node_id) || !ids.has(e.to_node_id))
      .length,
  };
}
export async function saveNavigationDraft(projectId: string, payload: unknown) {
  const { data, error } = await requireSupabase()
    .from("project_navigation_versions")
    .insert({ project_id: projectId, payload, status: "draft" })
    .select("id")
    .single();
  if (error)
    throw new Error("No fue posible guardar el borrador. Comprueba la migración y tus permisos.");
  return data.id as string;
}
export async function publishNavigation(versionId: string) {
  const { error } = await requireSupabase().rpc("publish_project_navigation", {
    target_version_id: versionId,
  });
  if (error) throw new Error(error.message);
}

export async function listNavigationVersions(projectId: string) {
  const { data, error } = await requireSupabase()
    .from("project_navigation_versions")
    .select("id,status,payload,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) return { installed: false, versions: [] };
    throw new Error("No fue posible consultar las versiones.");
  }
  return { installed: true, versions: data };
}
