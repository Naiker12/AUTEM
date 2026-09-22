import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

interface AdminHeaderProps {
  isDark: boolean;
  onThemeChange: () => void;
}

export function AdminHeader({ isDark, onThemeChange }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="text-foreground" />
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">AUTEM</p>
        <AdminBreadcrumbs items={["Administración", "Inicio"]} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto rounded-full"
        onClick={onThemeChange}
        aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}
