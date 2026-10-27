import { AppSidebar } from "@/components/app-sidebar";
import type { AdminAccess } from "@/lib/admin-auth";

export function AdminSidebar({ access }: { access: AdminAccess }) {
  return <AppSidebar access={access} />;
}
