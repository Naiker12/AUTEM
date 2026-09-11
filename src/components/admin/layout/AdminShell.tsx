import { useEffect, useState, type ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("autem-theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("autem-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-background">
        <AdminHeader isDark={isDark} onThemeChange={() => setIsDark((current) => !current)} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
