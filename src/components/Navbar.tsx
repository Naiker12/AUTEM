import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

interface NavbarProps {
  variant: "home" | "inner";
}

const navItems = [
  { href: "#proyectos", label: "Proyectos" },
  { href: "#tecnologia", label: "Experiencia 3D" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#contacto", label: "Contacto" },
];

export default function Navbar({ variant }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const isHome = variant === "home";

  const whatsappUrl =
    "https://wa.me/34600000000?text=" +
    encodeURIComponent("Hola AUTEM, me interesa conocer más sobre sus proyectos.");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        isHome
          ? menuOpen
            ? "bg-primary"
            : "mix-blend-difference text-white"
          : "bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-8">
        <Link to="/" className="font-serif text-2xl tracking-tight">
          AUTEM
        </Link>
        <div className="hidden gap-12 text-xs font-medium uppercase tracking-[0.2em] md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={isHome ? item.href : `/${item.href}`}
              className="transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            className={`hidden size-8 items-center justify-center rounded-full border text-xs transition-all md:flex ${
              isHome ? "border-white/20 hover:bg-white/10" : "border-border hover:bg-muted"
            } ${isDark ? "theme-toggle-spin" : ""}`}
          >
            {isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
          {isHome ? (
            <a
              href="#contacto"
              className="hidden border border-white/20 px-6 py-2 text-[10px] uppercase tracking-widest transition-all hover:bg-white hover:text-primary md:inline-block"
            >
              Invertir
            </a>
          ) : (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden border border-primary/20 px-6 py-2 text-[10px] uppercase tracking-widest transition-all hover:bg-primary hover:text-primary-foreground md:inline-block"
            >
              Agendar visita
            </a>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className={`flex size-10 flex-col items-center justify-center gap-[5px] md:hidden ${
              menuOpen ? "hamburger-open" : ""
            }`}
          >
            <span
              className={`hamburger-line block h-px w-6 ${
                isHome || menuOpen ? "bg-white" : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-px w-6 ${
                isHome || menuOpen ? "bg-white" : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-px w-6 ${
                isHome || menuOpen ? "bg-white" : "bg-foreground"
              }`}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="menu-enter fixed inset-0 top-[88px] z-40 flex flex-col bg-primary md:hidden">
          <div className="flex flex-1 flex-col items-center justify-center gap-10">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={isHome ? item.href : `/${item.href}`}
                onClick={() => setMenuOpen(false)}
                className="font-serif text-3xl italic text-white transition-colors hover:text-accent"
              >
                {item.label}
              </a>
            ))}
            {isHome ? (
              <a
                href="#contacto"
                onClick={() => setMenuOpen(false)}
                className="mt-6 border border-accent px-10 py-4 text-xs uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-primary"
              >
                Invertir
              </a>
            ) : (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="mt-6 border border-accent px-10 py-4 text-xs uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-primary"
              >
                Agendar visita
              </a>
            )}
            <button
              onClick={() => setIsDark(!isDark)}
              className="mt-4 text-xs uppercase tracking-widest text-white/60"
            >
              {isDark ? "\u2600\uFE0F Modo claro" : "\uD83C\uDF19 Modo oscuro"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
