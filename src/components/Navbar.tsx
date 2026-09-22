import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { X } from "lucide-react";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import Container from "@/components/layout/Container";
import { useScrollFrame } from "@/hooks/useScrollFrame";

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
  { id: "nosotros", href: `${import.meta.env.BASE_URL}nosotros`, label: "NOSOTROS", page: true },
  { id: "design-process", href: `${import.meta.env.BASE_URL}#design-process`, label: "PROCESO" },
  { id: "proyectos", href: `${import.meta.env.BASE_URL}#proyectos`, label: "PROYECTOS" },
  { id: "servicios", href: `${import.meta.env.BASE_URL}#servicios`, label: "SERVICIOS" },
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

  useScrollFrame(() => setIsScrolled(window.scrollY > 48));

  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent("Hola AUTEM, me interesa conocer más sobre sus proyectos.");

  // Track active section on scroll
  useScrollFrame(() => {
    if (!isHome) {
      setActiveSection("");
      return;
    }

    const sectionIds = ["about", "proyectos", "servicios", "design-process", "contacto"];

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
    if (isPage) {
      if (isAbout && id === "nosotros") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
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
      className={`nav-entrance fixed z-50 w-full transition-all duration-500 ${
        (isHome || isAbout) && isScrolled && !menuOpen ? "top-3 px-4 md:px-8" : "top-0"
      } ${
        isHome || isAbout
          ? menuOpen
            ? "bg-[#f0ebe6] text-[#4f4742]"
            : isScrolled
              ? "text-[#4f4742]"
              : "bg-[#f0ebe6] text-[#4f4742]"
          : "bg-background/80 backdrop-blur-md text-foreground"
      }`}
    >
      <Container
        className={`relative flex items-center transition-all duration-500 ${
          (isHome || isAbout) && isScrolled && !menuOpen
            ? "rounded-[2rem] border border-[#4f4742]/15 bg-[#f0ebe6]/92 px-5 py-3 shadow-[0_16px_50px_rgba(79,71,66,0.12)] backdrop-blur-2xl md:px-8 lg:px-10"
            : "px-6 py-5 md:px-10 lg:px-14 xl:px-20"
        }`}
      >
        {/* ── Brand (centered on desktop) ── */}
        <Link
          to="/"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`nav-entrance__brand group flex items-center gap-3.5 cursor-pointer md:absolute md:left-1/2 md:-translate-x-1/2 ${
            isHome || isAbout ? "text-[#4f4742]" : "text-foreground"
          }`}
          aria-label="AUTEM — Volver al inicio"
        >
          <span
            className={`flex size-11 items-center justify-center rounded-full border transition duration-500 ${
              isHome || isAbout
                ? "border-[#c5a059]/35 bg-[#c5a059]/[0.07] group-hover:border-[#c5a059]/60 group-hover:bg-[#c5a059]/[0.13]"
                : "border-accent/30 bg-accent/[0.06] group-hover:border-accent/65 group-hover:bg-accent/[0.12]"
            }`}
          >
            <AutemBrandIcon
              size={31}
              className="transition-transform duration-500 group-hover:scale-105"
            />
          </span>
          <span className="font-sans text-[1.35rem] font-semibold leading-none tracking-[0.2em] sm:text-[1.45rem]">
            AUTEM
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="nav-entrance__links hidden gap-5 text-[10px] font-medium uppercase tracking-[0.18em] md:flex lg:gap-8 lg:text-[11px] lg:tracking-[0.2em]">
          {navItems.map((item) => {
            const isActive = isAbout ? item.id === "nosotros" : activeSection === item.id;
            return item.page ? (
              <Link
                key={item.id}
                to="/nosotros"
                onClick={(e) => {
                  if (isAbout) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`relative whitespace-nowrap py-1 transition-all duration-300 ${
                  isActive
                    ? "font-semibold text-[#4f4742]"
                    : "opacity-70 hover:opacity-100 text-[#4f4742]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] rounded-full bg-[#4f4742]" />
                )}
              </Link>
            ) : (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.id, item.page)}
                className={`relative whitespace-nowrap py-1 transition-all duration-300 ${
                  isActive
                    ? "font-semibold text-[#c5a059]"
                    : isHome || isAbout
                      ? "opacity-70 hover:opacity-100 text-[#4f4742] hover:text-[#4f4742]"
                      : "opacity-80 hover:opacity-100 text-foreground hover:text-accent"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] rounded-full bg-[#c5a059]" />
                )}
              </a>
            );
          })}
        </div>

        {/* ── Actions ── */}
        <div className="nav-entrance__actions ml-auto flex items-center gap-4">
          {!isHome && !isAbout && (
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
              className="hidden size-8 items-center justify-center rounded-full border text-xs transition-all md:flex border-border hover:bg-muted"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          )}
          {isHome ? (
            <a
              href="#contacto"
              onClick={(e) => handleNavClick(e, "contacto")}
              className="hidden rounded-full border border-[#4f4742] bg-[#4f4742] text-[#f0ebe6] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:bg-[#403a34] hover:border-[#403a34] hover:shadow-md md:inline-block"
            >
              CONTÁCTANOS
            </a>
          ) : isAbout ? (
            <a
              href="#contacto-nosotros"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("contacto-nosotros");
                if (el) {
                  const bodyRect = document.body.getBoundingClientRect().top;
                  const elementRect = el.getBoundingClientRect().top;
                  window.scrollTo({
                    top: elementRect - bodyRect - 80,
                    behavior: "smooth",
                  });
                }
              }}
              className="hidden rounded-full border border-[#4f4742] bg-[#4f4742] text-[#f0ebe6] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:bg-[#403a34] hover:border-[#403a34] hover:shadow-md md:inline-block"
            >
              CONTÁCTANOS
            </a>
          ) : (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-accent/40 bg-accent/10 text-[#403a34] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:bg-accent hover:border-accent hover:text-white hover:shadow-md md:inline-block"
            >
              Agendar visita
            </a>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className={`flex size-10 flex-col items-center justify-center gap-[5px] md:hidden ${
              menuOpen ? "hamburger-open" : ""
            }`}
          >
            <span
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen ? "bg-[#4f4742]" : isHome || isAbout ? "bg-[#4f4742]" : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen ? "bg-[#4f4742]" : isHome || isAbout ? "bg-[#4f4742]" : "bg-foreground"
              }`}
            />
            <span
              className={`hamburger-line block h-0.5 w-6 transition-all ${
                menuOpen ? "bg-[#4f4742]" : isHome || isAbout ? "bg-[#4f4742]" : "bg-foreground"
              }`}
            />
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div
          ref={menuRef}
          id="mobile-navigation"
          className="menu-enter fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#f0ebe6] p-6 md:hidden overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <div className="flex items-center justify-between border-b border-[#4f4742]/20 pb-4">
            <Link
              to="/"
              onClick={() => {
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <AutemBrandIcon className="size-8" />
              <span className="font-sans text-lg font-semibold tracking-[0.2em] text-[#4f4742]">
                AUTEM
              </span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex size-10 items-center justify-center rounded-full border border-[#4f4742]/25 text-[#4f4742] hover:bg-[#4f4742]/10 transition"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
            {navItems.map((item) => {
              const isActive = isAbout ? item.id === "nosotros" : activeSection === item.id;
              return item.page ? (
                <Link
                  key={item.id}
                  to="/nosotros"
                  onClick={() => {
                    setMenuOpen(false);
                    if (isAbout) {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`font-sans text-[1.55rem] font-light tracking-[-0.02em] transition-colors ${
                    isActive
                      ? "text-[#4f4742] font-semibold"
                      : "text-[#4f4742]/65 hover:text-[#4f4742]"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    setMenuOpen(false);
                    handleNavClick(e, item.id, item.page);
                  }}
                  className={`font-sans text-[1.55rem] font-light tracking-[-0.02em] transition-colors ${
                    isActive
                      ? "text-[#c5a059] font-semibold"
                      : "text-[#4f4742]/65 hover:text-[#4f4742]"
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
                className="mt-6 rounded-full bg-[#4f4742] text-[#f0ebe6] px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-[#403a34] transition-all duration-300 shadow-lg"
              >
                CONTACTO
              </a>
            ) : isAbout ? (
              <a
                href="#contacto-nosotros"
                onClick={() => {
                  setMenuOpen(false);
                  const el = document.getElementById("contacto-nosotros");
                  if (el) {
                    window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
                  }
                }}
                className="mt-6 rounded-full bg-[#4f4742] text-[#f0ebe6] px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-[#403a34] transition-all duration-300 shadow-lg"
              >
                CONTACTO
              </a>
            ) : (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="mt-6 rounded-full border-2 border-[#c5a059] bg-[#c5a059]/10 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4f4742] hover:bg-[#c5a059] hover:text-white transition-all duration-300 shadow-md"
              >
                Agendar visita
              </a>
            )}
            {!isHome && !isAbout && (
              <button
                onClick={() => setIsDark(!isDark)}
                className="theme-toggle-mobile mt-3 flex items-center gap-2 rounded-full border border-[#4f4742]/20 bg-[#4f4742]/06 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#4f4742]/70 hover:text-[#4f4742] transition"
              >
                {isDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
