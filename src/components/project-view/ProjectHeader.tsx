import { Link } from "@tanstack/react-router";
import { Heart, Menu, MessageCircle, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  onOpenInfo: () => void;
  contactUrl: string;
}

export default function ProjectHeader({ onOpenInfo, contactUrl }: ProjectHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [saved, setSaved] = useState(false);

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
      <div className="flex h-full items-center gap-4 px-4 md:px-7">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Volver a AUTEM">
          <AutemBrandIcon size={31} />
          <div className="hidden sm:block">
            <strong className="block text-xl leading-none tracking-[0.08em]">AUTEM</strong>
            <span className="mt-1 block text-[7px] uppercase tracking-[0.32em] text-muted-foreground">
              Vida que inspira
            </span>
          </div>
        </Link>

        <nav
          className="ml-4 hidden h-full items-center gap-8 text-[10px] font-bold uppercase tracking-[0.12em] lg:flex"
          aria-label="Navegación del proyecto"
        >
          {[
            ["Proyecto", "#project-map"],
            ["Ubicación", "#project-map"],
            ["Accesos", "#project-map"],
            ["Servicios", "#project-map"],
          ].map(([label, href], index) => (
            <a
              key={label}
              href={href}
              className={`relative flex h-full items-center transition hover:text-accent ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}
            >
              {label}
              {index === 0 && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent" />
              )}
            </a>
          ))}
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
