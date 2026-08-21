import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { X } from "lucide-react";
import AutemBrandIcon from "@/components/AutemBrandIcon";

interface NavbarProps {
  variant: "home" | "inner" | "about";
}

interface NavItem {
  id: string;
  href: string;
  label: string;
  page?: boolean;
}

const navItems: NavItem[] = [
  { id: "proyectos", href: `${import.meta.env.BASE_URL}#proyectos`, label: "El proyecto" },
  { id: "tecnologia", href: `${import.meta.env.BASE_URL}#tecnologia`, label: "Experiencia 3D" },
  { id: "nosotros", href: `${import.meta.env.BASE_URL}nosotros`, label: "Nosotros", page: true },
  { id: "contacto", href: `${import.meta.env.BASE_URL}#contacto`, label: "Contacto" },
];

export default function Navbar({ variant }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useModalA11y(menuOpen, () => setMenuOpen(false));
  const [activeSection, setActiveSection] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("autem-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const isHome = variant === "home";
  const isAbout = variant === "about";

  useEffect(() => {
    const handleHeaderScroll = () => setIsScrolled(window.scrollY > 48);
    handleHeaderScroll();
    window.addEventListener("scroll", handleHeaderScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleHeaderScroll);
  }, []);

  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent("Hola AUTEM, me interesa conocer más sobre sus proyectos.");

  // Track active section on scroll
  useEffect(() => {
    if (!isHome) {
      setActiveSection("");
      return;
    }

    const sectionIds = ["proyectos", "tecnologia", "contacto"];

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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string, isPage = false) => {
    if (isPage) return;
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
      className={`fixed z-50 w-full transition-all duration-500 ${
        isHome && isScrolled && !menuOpen ? "top-3 px-4 md:px-8" : "top-0"
      } ${
        isHome
          ? menuOpen
            ? "bg-background text-foreground"
            : isScrolled
              ? "text-foreground"
              : isDark
                ? "bg-gradient-to-b from-black/70 via-black/25 to-transparent text-white"
                : "border-b border-border/60 bg-background/78 text-foreground backdrop-blur-xl"
          : isAbout
            ? menuOpen
              ? "bg-primary"
              : "border-b border-white/10 bg-[#090a0a]/80 text-white backdrop-blur-md"
            : "bg-background/80 backdrop-blur-md"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1800px] items-center justify-between transition-all duration-500 ${
          isHome && isScrolled && !menuOpen
            ? "rounded-[2rem] border border-border/75 bg-background/88 px-5 py-3 shadow-[0_16px_50px_rgba(30,25,18,0.14)] backdrop-blur-2xl md:px-8 lg:px-10"
            : "px-6 py-5 md:px-10 lg:px-14 xl:px-20"
        }`}
      >
        <Link
          to="/"
          className="group flex items-center gap-3.5 text-foreground"
          aria-label="AUTEM — Territorio y arquitectura"
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-accent/30 bg-accent/[0.06] transition duration-500 group-hover:border-accent/65 group-hover:bg-accent/[0.12]">
            <AutemBrandIcon size={33} className="transition-transform duration-500 group-hover:scale-105" />
          </span>
          <span className="font-sans text-[1.35rem] font-semibold leading-none tracking-[0.2em] sm:text-[1.45rem]">
            AUTEM
          </span>
        </Link>
        <div className="hidden gap-5 text-[10px] font-medium uppercase tracking-[0.18em] md:flex lg:gap-8 lg:text-xs lg:tracking-[0.2em]">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.id, item.page)}
                className={`relative whitespace-nowrap py-1 transition-all duration-300 ${
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
              (isHome && isDark) || isAbout
                ? "border-white/20 hover:bg-white/10"
                : "border-border hover:bg-muted"
            } ${isDark ? "theme-toggle-spin" : ""}`}
          >
            {isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
          {isHome ? (
            <a
              href="#contacto"
              onClick={(e) => handleNavClick(e, "contacto")}
              className={`hidden rounded-full border px-4 py-2 text-[9px] uppercase tracking-widest transition-all lg:px-6 lg:text-[10px] md:inline-block ${isDark ? "border-white/20 hover:bg-white hover:text-primary" : "border-accent/60 hover:bg-accent hover:text-accent-foreground"}`}
            >
              Invertir
            </a>
          ) : (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden border px-4 py-2 text-[9px] uppercase tracking-widest transition-all lg:px-6 lg:text-[10px] md:inline-block ${
                isAbout
                  ? "border-white/20 hover:bg-white hover:text-primary"
                  : "border-primary/20 hover:bg-primary hover:text-primary-foreground"
              }`}
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
                menuOpen
                  ? "bg-foreground"
                  : (isHome && isDark) || isAbout
                    ? "bg-white"
                    : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen
                  ? "bg-foreground"
                  : (isHome && isDark) || isAbout
                    ? "bg-white"
                    : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen
                  ? "bg-foreground"
                  : (isHome && isDark) || isAbout
                    ? "bg-white"
                    : "bg-foreground"
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
                    handleNavClick(e, item.id, item.page);
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
