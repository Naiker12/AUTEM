import type { User } from "@supabase/supabase-js";

import { requireSupabase } from "@/lib/supabase";

export type OrganizationRole = "superadmin" | "administrador" | "editor" | "comercial";

export type AdminAccess = {
  user: User;
  role: OrganizationRole;
  organizationId: string;
  assignedProjectIds: string[];
  isSuperAdmin: boolean;
};

let cachedAccessPromise: Promise<AdminAccess | null> | null = null;
let cachedAccessTimestamp = 0;
const ACCESS_CACHE_TTL_MS = 15_000;

export function clearAdminAccessCache() {
  cachedAccessPromise = null;
  cachedAccessTimestamp = 0;
}

export function canAccessAdminPath(role: OrganizationRole, pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/" || pathname === "/admin/perfil") {
    return true;
  }
  // Secciones EXCLUSIVAS de Superadmin: Configuración y Auditoría
  if (pathname.startsWith("/admin/configuracion") || pathname.startsWith("/admin/auditoria")) {
    return role === "superadmin";
  }

  // Equipo y accesos: superadmin y administrador (con alcance a sus proyectos)
  if (pathname.startsWith("/admin/equipo-accesos")) {
    return role === "superadmin" || role === "administrador";
  }

  if (role === "superadmin") return true;

  if (role === "administrador") {
    // Administrador de proyecto: gestiona catálogo, lotes, medios, equipo y experiencias de sus proyectos
    return (
      pathname.startsWith("/admin/proyectos") ||
      pathname.startsWith("/admin/lotes-unidades") ||
      pathname.startsWith("/admin/solicitudes") ||
      pathname.startsWith("/admin/galerias-planos-recorridos") ||
      pathname.startsWith("/admin/contenido") ||
      pathname.startsWith("/admin/experiencias") ||
      pathname.startsWith("/admin/equipo-accesos")
    );
  }

  if (role === "editor") {
    return (
      pathname.startsWith("/admin/proyectos") ||
      pathname.startsWith("/admin/contenido") ||
      pathname.startsWith("/admin/galerias-planos-recorridos") ||
      pathname.startsWith("/admin/experiencias")
    );
  }

  // Comercial: proyectos, lotes asignados y solicitudes/CRM
  return (
    pathname.startsWith("/admin/proyectos") ||
    pathname.startsWith("/admin/lotes-unidades") ||
    pathname.startsWith("/admin/solicitudes")
  );
}

export async function signInToAdmin(email: string, password: string) {
  const client = requireSupabase();
  clearAdminAccessCache();
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error("El correo o la contraseña no son correctos.");
  }

  const access = await getCurrentAdminAccess(true);
  if (!access) {
    await client.auth.signOut();
    clearAdminAccessCache();
    throw new Error("Esta cuenta no tiene acceso al panel de administración.");
  }

  return access;
}

async function fetchCurrentAdminAccess(): Promise<AdminAccess | null> {
  const client = requireSupabase();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }
  if (!user) {
    return null;
  }

  // 1. Intentar resolver mediante RPC get_my_access del backend en un solo viaje
  try {
    const { data: accessData, error: rpcError } = await client.rpc("get_my_access");
    if (!rpcError && accessData && typeof accessData === "object") {
      const dataObj = accessData as Record<string, unknown>;
      const role = dataObj.role as OrganizationRole;
      const organizationId = dataObj.organization_id as string;
      const isSuperAdmin = Boolean(dataObj.is_superadmin);
      const assignedProjectIds = Array.isArray(dataObj.project_ids)
        ? (dataObj.project_ids as string[])
        : [];

      return {
        user,
        role,
        organizationId,
        assignedProjectIds,
        isSuperAdmin,
      };
    }
  } catch (rpcErr) {
    // Si la RPC aún no está disponible o falla, continuar al fallback
    console.warn("get_my_access no disponible, usando fallback directo:", rpcErr);
  }

  // 2. Fallback directo consultando organization_members
  const { data: membership, error: membershipError } = await client
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Error al verificar membresía: ${membershipError.message}`);
  }
  if (!membership) {
    return null;
  }

  const isSuperAdmin = membership.role === "superadmin";

  // Cargar proyectos a los que el usuario tiene acceso explícito
  let assignedProjectIds: string[] = [];
  if (isSuperAdmin) {
    // Superadmin tiene acceso a todos los proyectos de la organización
    const { data: allProjects, error: projectsError } = await client
      .from("projects")
      .select("id")
      .eq("organization_id", membership.organization_id);

    if (projectsError) {
      throw new Error(`Error al consultar proyectos: ${projectsError.message}`);
    }
    assignedProjectIds = (allProjects ?? []).map((p) => p.id);
  } else {
    // Usuario no superadmin: consultar membresías en project_members con verificación de errores
    const { data: projectMemberships, error: projectMembersError } = await client
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id);

    if (projectMembersError) {
      throw new Error(
        `Error al consultar asignaciones de proyectos: ${projectMembersError.message}`,
      );
    }
    assignedProjectIds = (projectMemberships ?? []).map((pm) => pm.project_id);
  }

  return {
    user,
    role: membership.role as OrganizationRole,
    organizationId: membership.organization_id,
    assignedProjectIds,
    isSuperAdmin,
  };
}

export async function getCurrentAdminAccess(forceRefresh = false): Promise<AdminAccess | null> {
  const now = Date.now();
  if (!forceRefresh && cachedAccessPromise && now - cachedAccessTimestamp < ACCESS_CACHE_TTL_MS) {
    return cachedAccessPromise;
  }

  cachedAccessTimestamp = now;
  cachedAccessPromise = fetchCurrentAdminAccess().catch((error) => {
    clearAdminAccessCache();
    throw error;
  });

  return cachedAccessPromise;
}

export async function requestPasswordReset(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email);

  if (error) {
    throw new Error("No fue posible solicitar la recuperación en este momento.");
  }
}

export async function verifyRecoveryCode(email: string, token: string) {
  const client = requireSupabase();
  const { error } = await client.auth.verifyOtp({ email, token, type: "recovery" });

  if (error) {
    throw new Error("El código no es válido o ya venció. Solicita uno nuevo.");
  }
}

export async function signOutFromAdmin() {
  const client = requireSupabase();
  clearAdminAccessCache();
  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error("No fue posible cerrar la sesión.");
  }
}
