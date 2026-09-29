import { useEffect, useState, type ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminContentTransition } from "./AdminContentTransition";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import type { OrganizationRole } from "@/lib/admin-auth";

export function AdminShell({ children, role }: { children: ReactNode; role: OrganizationRole }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("autem-theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("autem-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <SidebarProvider>
      <AdminSidebar role={role} />
      <SidebarInset className="bg-background">
        <AdminHeader isDark={isDark} onThemeChange={() => setIsDark((current) => !current)} />
        <AdminContentTransition>{children}</AdminContentTransition>
      </SidebarInset>
    </SidebarProvider>
  );
}
