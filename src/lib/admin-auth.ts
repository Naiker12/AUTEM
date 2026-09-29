import type { User } from "@supabase/supabase-js";

import { requireSupabase } from "@/lib/supabase";

export type OrganizationRole = "superadmin" | "administrador" | "editor" | "comercial";

export type AdminAccess = {
  user: User;
  role: OrganizationRole;
  organizationId: string;
};

export function canAccessAdminPath(role: OrganizationRole, pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/" || pathname === "/admin/perfil") {
    return true;
  }
  if (role === "superadmin") return true;
  if (role === "administrador") {
    return !pathname.startsWith("/admin/configuracion");
  }
  if (role === "editor") {
    return (
      pathname.startsWith("/admin/contenido") ||
      pathname.startsWith("/admin/galerias-planos-recorridos") ||
      pathname.startsWith("/admin/experiencias")
    );
  }
  return pathname.startsWith("/admin/proyectos") || pathname.startsWith("/admin/lotes-unidades");
}

export async function signInToAdmin(email: string, password: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error("El correo o la contraseña no son correctos.");
  }

  const access = await getCurrentAdminAccess();
  if (!access) {
    await client.auth.signOut();
    throw new Error("Esta cuenta no tiene acceso al panel de administración.");
  }

  return access;
}

export async function getCurrentAdminAccess(): Promise<AdminAccess | null> {
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

  const { data: membership, error: membershipError } = await client
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }
  if (!membership) {
    return null;
  }

  return {
    user,
    role: membership.role as OrganizationRole,
    organizationId: membership.organization_id,
  };
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
  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error("No fue posible cerrar la sesión.");
  }
}
