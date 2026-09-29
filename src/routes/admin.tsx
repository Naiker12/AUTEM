import { Navigate, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { AdminShell } from "@/components/admin/layout/AdminShell";
import { canAccessAdminPath, getCurrentAdminAccess, type AdminAccess } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Panel de Administración | AUTEM" }],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const [accessState, setAccessState] = useState<AdminAccess | null | "checking">("checking");
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    let active = true;
    const checkAccess = () => {
      void getCurrentAdminAccess()
        .then((access) => {
          if (active) setAccessState(access);
        })
        .catch(() => {
          if (active) setAccessState(null);
        });
    };

    checkAccess();
    const subscription = supabase?.auth.onAuthStateChange(() => checkAccess()).data.subscription;

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (accessState === null) {
    return <Navigate to="/login-admin" replace />;
  }

  if (accessState === "checking") {
    return (
      <main
        className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground"
        aria-busy="true"
      >
        <LoaderCircle className="size-5 animate-spin text-accent" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">AUTEM</p>
          <p className="text-sm text-muted-foreground">Verificando acceso seguro…</p>
        </div>
      </main>
    );
  }

  if (!canAccessAdminPath(accessState.role, pathname)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AdminShell role={accessState.role}>
      <Outlet />
    </AdminShell>
  );
}
