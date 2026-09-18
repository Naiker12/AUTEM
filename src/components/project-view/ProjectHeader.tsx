import { Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Moon, MoreVertical, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Button } from "@/components/ui/button";
import ModeSwitcher from "./ModeSwitcher";
import type { ViewMode } from "./types";

interface ProjectHeaderProps {
  propertyName?: string;
  onOpenInfo: () => void;
  contactUrl: string;
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  showViewSwitcher: boolean;
  isPanelOpen?: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export default function ProjectHeader({
  propertyName = "Villa Paraíso",
  onOpenInfo,
  contactUrl,
  activeMode,
  onModeChange,
  showViewSwitcher,
  isPanelOpen = false,
  isDark: propIsDark,
  onToggleTheme,
}: ProjectHeaderProps) {
  const [internalIsDark, setInternalIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      const stored = localStorage.getItem("autem-theme");
      if (stored) return stored === "dark";
      return (
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });

  const isDark = propIsDark !== undefined ? propIsDark : internalIsDark;

  useEffect(() => {
    if (propIsDark === undefined) {
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem("autem-theme", isDark ? "dark" : "light");
    }
  }, [isDark, propIsDark]);

  return (
    <header className="absolute inset-x-0 top-0 z-40 h-14 sm:h-16 lg:h-[72px] border-b border-border bg-background/94 text-foreground shadow-2xl backdrop-blur-2xl">
      <div className="relative flex h-full items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-7">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 sm:gap-2.5"
          aria-label="Volver a AUTEM"
        >
          <AutemBrandIcon size={24} />
          <div>
            <strong className="block text-sm sm:text-base md:text-lg font-serif font-medium leading-none tracking-tight text-foreground">
              {propertyName}
            </strong>
            <span className="mt-1 block text-[7px] sm:text-[7.5px] uppercase tracking-[0.22em] text-muted-foreground">
              AUTEM · Proyecto
            </span>
          </div>
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="shrink-0 rounded-full text-foreground hover:bg-muted hover:text-foreground h-8 px-2 sm:px-3 text-xs"
          aria-label="Volver atrás"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline ml-1">Atrás</span>
        </Button>

        {showViewSwitcher && (
          <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <ModeSwitcher activeMode={activeMode} onChange={onModeChange} inHeader />
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleTheme || (() => setInternalIsDark((value) => !value))}
            className="rounded-full text-foreground hover:bg-muted hover:text-foreground"
          >
            {isDark ? <Moon className="text-accent" /> : <Sun className="text-accent" />}
            <span className="hidden sm:inline">{isDark ? "Noche" : "Día"}</span>
          </Button>
          <Button
            asChild
            className="hidden rounded-full bg-accent px-6 font-bold text-accent-foreground hover:bg-accent/90 md:inline-flex shadow-[0_4px_16px_rgba(197,160,89,0.3)]"
          >
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Contacto
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenInfo}
            className={`rounded-full transition-colors ${isPanelOpen ? "bg-accent/20 text-accent ring-1 ring-accent/30" : "text-foreground hover:bg-muted hover:text-foreground"}`}
            aria-label="Abrir centro de control del proyecto"
            title="Centro de control y configuración"
          >
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
