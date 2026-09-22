import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/layout/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Panel de Administración | AUTEM" }],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const hasAccess =
    typeof window !== "undefined" && sessionStorage.getItem("autem-admin-demo-access") === "true";

  if (!hasAccess) {
    return <Navigate to="/login-admin" replace />;
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
