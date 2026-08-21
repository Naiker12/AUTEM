import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { ArrowUp, Instagram, Linkedin, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { ZONAS } from "@/data/properties";

export default function PiePagina() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      footer.classList.add("footer-editorial--visible");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        footer.classList.add("footer-editorial--visible");
        observer.unobserve(footer);
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      ref={footerRef}
      className="footer-editorial relative overflow-hidden bg-[oklch(0.145_0.005_285)] py-14 text-white/70 md:py-24"
    >
      <div className="footer-top-line pointer-events-none absolute inset-x-[6%] top-0 h-px origin-center bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(216,177,95,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(216,177,95,.12)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 top-4 size-[440px] rounded-full border border-accent/10" />

      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Fila Principal de Navegación */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 lg:grid-cols-12 lg:gap-8 lg:pb-16">
          {/* Columna 1: Marca & Descripción (4 Cols) */}
          <div className="footer-reveal footer-reveal--1 flex flex-col justify-between space-y-7 lg:col-span-4">
            <div>
              <Link to="/" className="group flex items-center gap-3">
                <AutemBrandIcon
                  size={40}
                  className="footer-brand-mark transition-transform group-hover:scale-105"
                />
                <span className="font-serif text-[1.75rem] font-semibold tracking-[0.08em] text-white">
                  AUTEM
                </span>
              </Link>

              <p className="mt-5 max-w-sm text-[13px] font-light leading-6 text-white/55">
                Arquitectura sin fronteras. Proyectos de alta gama, visualización 3D y maquetas
                interactivas en Cartagena de Indias, Barú y Turbaco desde 2010.
              </p>
            </div>

            {/* Datos de contacto directo */}
            <div className="space-y-2.5 text-[12px] text-white/52">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-accent shrink-0" />
                <span>Bocagrande, Av. San Martín 10-45 · Cartagena</span>
              </div>
              <a
                href="tel:+573007200894"
                className="flex w-fit items-center gap-2 transition-colors hover:text-accent"
              >
                <Phone size={14} className="text-accent shrink-0" />
                <span>+57 (300) 720-0894</span>
              </a>
              <a
                href="mailto:hola@autem.es"
                className="flex w-fit items-center gap-2 transition-colors hover:text-accent"
              >
                <Mail size={14} className="text-accent shrink-0" />
                <span>hola@autem.es</span>
              </a>
            </div>
          </div>

          {/* Columna 2: Explorar (2 Cols) */}
          <div className="footer-reveal footer-reveal--2 space-y-4 lg:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent md:text-[10px] md:tracking-[0.25em]">
              Navegación
            </h3>
            <ul className="space-y-2 text-[13px] leading-5 text-white/68">
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#proyectos`}
                  className="hover:text-accent transition-colors"
                >
                  Proyectos Destacados
                </a>
              </li>
              <li>
                <Link to="/catalogo" className="hover:text-accent transition-colors">
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#tecnologia`}
                  className="hover:text-accent transition-colors"
                >
                  Experiencia AR 3D
                </a>
              </li>
              <li>
                <Link to="/nosotros" className="hover:text-accent transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#contacto`}
                  className="hover:text-accent transition-colors"
                >
                  Contacto Privado
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Zonas Exclusivas en Cartagena (3 Cols) */}
          <div className="footer-reveal footer-reveal--3 space-y-4 lg:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent md:text-[10px] md:tracking-[0.25em]">
              Zonas Exclusivas
            </h3>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[13px] leading-5 text-white/68">
              {ZONAS.map((z) => (
                <Link
                  key={z}
                  to="/catalogo"
                  search={{ zona: z }}
                  className="hover:text-accent transition-colors"
                >
                  {z}
                </Link>
              ))}
            </div>
          </div>

          {/* Columna 4: Legal & Fiduciarias (3 Cols) */}
          <div className="footer-reveal footer-reveal--4 space-y-4 lg:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent md:text-[10px] md:tracking-[0.25em]">
              Información legal
            </h3>
            <ul className="space-y-2 text-[13px] leading-5 text-white/52">
              <li>
                <Link to="/politica-privacidad" className="hover:text-accent transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>Información comercial y documentación disponible a solicitud.</li>
              <li>Asesoría para conocer el proceso de compra y el proyecto.</li>
            </ul>
          </div>
        </div>

        {/* Fila Inferior: Copyright, Redes Sociales & Botón Volver Arriba */}
        <div className="footer-reveal footer-reveal--5 mt-8 flex flex-col items-center justify-between gap-6 text-[10px] uppercase tracking-[0.14em] text-white/42 md:flex-row">
          <p>© {new Date().getFullYear()} AUTEM Real Estate. Todos los derechos reservados.</p>

          {/* Los perfiles se habilitan cuando se configuren las URLs oficiales. */}
          <div className="flex items-center gap-6" aria-label="Canales sociales próximamente">
            <span className="flex items-center gap-1.5" aria-label="Instagram próximamente">
              <Instagram size={14} />
              <span>Instagram</span>
            </span>
            <span className="flex items-center gap-1.5" aria-label="LinkedIn próximamente">
              <Linkedin size={14} />
              <span>LinkedIn</span>
            </span>
            <span className="flex items-center gap-1.5" aria-label="YouTube próximamente">
              <Youtube size={14} />
              <span>YouTube</span>
            </span>
          </div>

          {/* Botón Volver Arriba */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-white/60 transition-all hover:border-accent hover:bg-accent/10 hover:text-accent"
          >
            <span>Volver arriba</span>
            <ArrowUp size={12} />
          </button>
        </div>
      </div>
    </footer>
  );
}
