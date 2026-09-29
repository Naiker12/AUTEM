import { AppSidebar } from "@/components/app-sidebar";
import type { OrganizationRole } from "@/lib/admin-auth";

export function AdminSidebar({ role }: { role: OrganizationRole }) {
  return <AppSidebar role={role} />;
}
