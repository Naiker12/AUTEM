import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/layout/AdminShell";

export const Route = createFileRoute("/admin")({ component: AdminRoute });

function AdminRoute() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
