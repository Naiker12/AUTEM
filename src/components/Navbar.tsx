import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { X } from "lucide-react";
import AutemBrandIcon from "@/components/AutemBrandIcon";

interface NavbarProps {
  variant: "home" | "inner";
}

const navItems = [
  { id: "proyectos", href: `${import.meta.env.BASE_URL}#proyectos`, label: "Proyectos" },
  { id: "tecnologia", href: `${import.meta.env.BASE_URL}#tecnologia`, label: "Experiencia 3D" },
  { id: "nosotros", href: `${import.meta.env.BASE_URL}#nosotros`, label: "Nosotros" },
  { id: "contacto", href: `${import.meta.env.BASE_URL}#contacto`, label: "Contacto" },
];

export default function Navbar({ variant }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useModalA11y(menuOpen, () => setMenuOpen(false));
  const [activeSection, setActiveSection] = useState<string>("");
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("autem-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const isHome = variant === "home";

  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent("Hola AUTEM, me interesa conocer más sobre sus proyectos.");

  // Track active section on scroll
  useEffect(() => {
    if (!isHome) {
      setActiveSection("");
      return;
    }

    const sectionIds = ["proyectos", "tecnologia", "nosotros", "contacto"];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(id);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("autem-theme", isDark ? "dark" : "light");
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const targetUrl = `${import.meta.env.BASE_URL}#${id}`;
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const navOffset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        setActiveSection(id);
      }
    } else {
      window.location.href = targetUrl;
    }
  };

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
        <Link to="/" className="flex items-center gap-3 font-serif text-2xl tracking-tight group">
          <AutemBrandIcon size={30} className="transition-transform group-hover:scale-105" />
          <span>AUTEM</span>
        </Link>
        <div className="hidden gap-10 text-xs font-medium uppercase tracking-[0.2em] md:flex">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`relative py-1 transition-all duration-300 ${
                  isActive
                    ? "text-accent font-bold tracking-[0.25em]"
                    : "hover:text-accent opacity-85 hover:opacity-100"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
                )}
              </a>
            );
          })}
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
              onClick={(e) => handleNavClick(e, "contacto")}
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
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen ? "bg-foreground" : isHome ? "bg-white" : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen ? "bg-foreground" : isHome ? "bg-white" : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen ? "bg-foreground" : isHome ? "bg-white" : "bg-foreground"
              }`}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          className="menu-enter fixed inset-0 z-50 flex h-screen w-screen flex-col bg-background p-6 md:hidden overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
              <AutemBrandIcon className="size-8" />
              <span className="font-serif text-lg font-bold tracking-wider text-foreground">
                AUTEM
              </span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex size-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    setMenuOpen(false);
                    handleNavClick(e, item.id);
                  }}
                  className={`font-serif text-3xl transition-colors ${
                    isActive
                      ? "text-accent font-bold not-italic underline decoration-accent underline-offset-8"
                      : "text-foreground hover:text-accent font-normal italic"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            {isHome ? (
              <a
                href="#contacto"
                onClick={(e) => {
                  setMenuOpen(false);
                  handleNavClick(e, "contacto");
                }}
                className="mt-4 border-2 border-accent px-10 py-4 text-xs font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-accent-foreground transition-all rounded-full shadow-lg shadow-accent/10"
              >
                Invertir
              </a>
            ) : (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="mt-4 border-2 border-accent px-10 py-4 text-xs font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-accent-foreground transition-all rounded-full shadow-lg shadow-accent/10"
              >
                Agendar visita
              </a>
            )}
            <button
              onClick={() => setIsDark(!isDark)}
              className="mt-2 flex items-center gap-2 rounded-full border border-border bg-muted/50 px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              {isDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
