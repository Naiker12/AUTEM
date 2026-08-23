import { Link } from "@tanstack/react-router";
import { ChevronDown, Heart, Menu, MessageCircle, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { properties } from "@/data/properties";

interface ProjectHeaderProps {
  currentSlug?: string;
  onOpenInfo: () => void;
  contactUrl: string;
}

export default function ProjectHeader({ currentSlug, onOpenInfo, contactUrl }: ProjectHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentProject =
    properties.find((p) => p.slug === currentSlug || p.id === currentSlug) || properties[0];

  useEffect(() => {
    const storedTheme = localStorage.getItem("autem-theme");
    setIsDark(
      storedTheme
        ? storedTheme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("autem-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <header className="absolute inset-x-0 top-0 z-40 h-[72px] border-b border-border bg-background/94 text-foreground shadow-2xl backdrop-blur-2xl">
      <div className="flex h-full items-center gap-3 px-4 md:px-7">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Volver a AUTEM">
          <AutemBrandIcon size={31} />
          <div className="hidden sm:block">
            <strong className="block text-xl leading-none tracking-[0.08em]">AUTEM</strong>
            <span className="mt-1 block text-[7px] uppercase tracking-[0.32em] text-muted-foreground">
              Vida que inspira
            </span>
          </div>
        </Link>

        {/* Project Switcher */}
        <div className="ml-2 sm:ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-border bg-background/80 px-3.5 text-xs font-medium backdrop-blur-md hover:border-accent hover:text-accent"
              >
                <span className="max-w-[120px] truncate sm:max-w-[180px]">
                  {currentProject.name}
                </span>
                <ChevronDown size={14} className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5 shadow-xl">
              <DropdownMenuLabel className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Proyectos AUTEM
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {properties.map((p) => {
                const isActive =
                  p.slug === currentSlug ||
                  p.id === currentSlug ||
                  (currentSlug === "lotes-360" && p.slug === "lotes-360");
                return (
                  <DropdownMenuItem key={p.id} asChild className="p-0">
                    <Link
                      to="/proyecto/$slug"
                      params={{ slug: p.slug }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                        isActive ? "bg-accent/15 text-accent font-semibold" : "hover:bg-muted"
                      }`}
                    >
                      <img
                        src={p.image}
                        alt=""
                        className="size-9 rounded-md object-cover border border-border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{p.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{p.location}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav
          className="ml-4 hidden h-full items-center gap-6 text-[10px] font-bold uppercase tracking-[0.12em] xl:flex"
          aria-label="Navegación del proyecto"
        >
          {properties.map((p) => {
            const isActive = p.slug === currentSlug || p.id === currentSlug;
            return (
              <Link
                key={p.id}
                to="/proyecto/$slug"
                params={{ slug: p.slug }}
                className={`relative flex h-full items-center transition hover:text-accent ${
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {p.name}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDark((value) => !value)}
            className="rounded-full text-foreground hover:bg-muted hover:text-foreground"
          >
            {isDark ? <Moon className="text-accent" /> : <Sun className="text-accent" />}
            <span className="hidden sm:inline">{isDark ? "Noche" : "Día"}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSaved((value) => !value)}
            className={`rounded-full hover:bg-muted ${saved ? "text-accent" : "text-foreground"}`}
            aria-label="Guardar proyecto"
          >
            <Heart fill={saved ? "currentColor" : "none"} />
          </Button>
          <Button
            asChild
            className="hidden rounded-full bg-accent px-6 font-bold text-accent-foreground hover:bg-accent/90 md:inline-flex"
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
            className="rounded-full text-foreground hover:bg-muted hover:text-foreground"
            aria-label="Abrir información del proyecto"
          >
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  );
}
