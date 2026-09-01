import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { ArrowUp, Instagram, Linkedin, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { ZONAS } from "@/data/properties";
import Container from "@/components/layout/Container";

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
      className="footer-editorial relative overflow-hidden bg-[#f6f1eb] text-[#403a34] border-t border-[#403a34]/15 py-14 md:py-24 dark:bg-[#151413] dark:text-white/70 dark:border-white/10 transition-colors duration-300"
    >
      <div className="footer-top-line pointer-events-none absolute inset-x-[6%] top-0 h-px origin-center bg-gradient-to-r from-transparent via-[#403a34]/30 to-transparent dark:via-accent/70" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.12] [background-image:linear-gradient(rgba(64,58,52,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(64,58,52,.15)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(216,177,95,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(216,177,95,.12)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#c5a059]/[0.05] dark:bg-accent/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 top-4 size-[440px] rounded-full border border-[#403a34]/10 dark:border-accent/10" />

      <Container className="px-6 md:px-8">
        {/* Fila Principal de Navegación */}
        <div className="grid grid-cols-1 gap-10 border-b border-[#403a34]/15 pb-12 dark:border-white/10 lg:grid-cols-12 lg:gap-8 lg:pb-16">
          {/* Columna 1: Marca & Descripción (4 Cols) */}
          <div className="footer-reveal footer-reveal--1 flex flex-col justify-between space-y-7 lg:col-span-4">
            <div>
              <Link to="/" className="group flex items-center gap-3">
                <AutemBrandIcon
                  size={40}
                  className="footer-brand-mark transition-transform group-hover:scale-105"
                />
                <span className="font-serif text-[1.75rem] font-semibold tracking-[0.08em] text-[#403a34] dark:text-white">
                  AUTEM
                </span>
              </Link>

              <p className="mt-5 max-w-sm text-[13px] font-light leading-6 text-[#555555] dark:text-white/55">
                Arquitectura sin fronteras. Proyectos de alta gama, visualización 3D y maquetas
                interactivas en Cartagena de Indias, Barú y Turbaco desde 2010.
              </p>
            </div>

            {/* Datos de contacto directo */}
            <div className="space-y-2.5 text-[12px] text-[#555555] dark:text-white/52">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#c5a059] shrink-0" />
                <span>Bocagrande, Av. San Martín 10-45 · Cartagena</span>
              </div>
              <a
                href="tel:+573007200894"
                className="flex w-fit items-center gap-2 transition-colors hover:text-[#403a34] dark:hover:text-accent"
              >
                <Phone size={14} className="text-[#c5a059] shrink-0" />
                <span>+57 (300) 720-0894</span>
              </a>
              <a
                href="mailto:hola@autem.es"
                className="flex w-fit items-center gap-2 transition-colors hover:text-[#403a34] dark:hover:text-accent"
              >
                <Mail size={14} className="text-[#c5a059] shrink-0" />
                <span>hola@autem.es</span>
              </a>
            </div>
          </div>

          {/* Columna 2: Explorar (2 Cols) */}
          <div className="footer-reveal footer-reveal--2 space-y-4 lg:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#403a34] dark:text-accent md:text-[10px] md:tracking-[0.25em]">
              Navegación
            </h3>
            <ul className="space-y-2 text-[13px] leading-5 text-[#555555] dark:text-white/68">
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#proyectos`}
                  className="hover:text-[#403a34] dark:hover:text-accent transition-colors"
                >
                  Proyectos Seleccionados
                </a>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#tecnologia`}
                  className="hover:text-[#403a34] dark:hover:text-accent transition-colors"
                >
                  Metodología & Servicios
                </a>
              </li>
              <li>
                <Link
                  to="/nosotros"
                  className="hover:text-[#403a34] dark:hover:text-accent transition-colors"
                >
                  Nosotros
                </Link>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#contacto`}
                  className="hover:text-[#403a34] dark:hover:text-accent transition-colors"
                >
                  Contacto Privado
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Zonas Exclusivas en Cartagena (3 Cols) */}
          <div className="footer-reveal footer-reveal--3 space-y-4 lg:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#403a34] dark:text-accent md:text-[10px] md:tracking-[0.25em]">
              Zonas Exclusivas
            </h3>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[13px] leading-5 text-[#555555] dark:text-white/68">
              {ZONAS.map((z) => (
                <Link
                  key={z}
                  to="/catalogo"
                  search={{ zona: z }}
                  className="hover:text-[#403a34] dark:hover:text-accent transition-colors"
                >
                  {z}
                </Link>
              ))}
            </div>
          </div>

          {/* Columna 4: Legal & Fiduciarias (3 Cols) */}
          <div className="footer-reveal footer-reveal--4 space-y-4 lg:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#403a34] dark:text-accent md:text-[10px] md:tracking-[0.25em]">
              Información legal
            </h3>
            <ul className="space-y-2 text-[13px] leading-5 text-[#555555] dark:text-white/52">
              <li>
                <Link
                  to="/politica-privacidad"
                  className="hover:text-[#403a34] dark:hover:text-accent transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>Información comercial y documentación disponible a solicitud.</li>
              <li>Asesoría para conocer el proceso de compra y el proyecto.</li>
            </ul>
          </div>
        </div>

        {/* Fila Inferior: Copyright, Redes Sociales & Botón Volver Arriba */}
        <div className="footer-reveal footer-reveal--5 mt-8 flex flex-col items-center justify-between gap-6 text-[10px] uppercase tracking-[0.14em] text-[#555555] dark:text-white/42 md:flex-row">
          <p>© {new Date().getFullYear()} AUTEM Real Estate. Todos los derechos reservados.</p>

          <div className="flex items-center gap-3 sm:gap-6" aria-label="Canales sociales">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-300 hover:bg-[#403a34]/[0.06] hover:text-[#403a34] dark:hover:bg-white/[0.08] dark:hover:text-[#c5a059]"
              aria-label="Visitar Instagram de AUTEM"
            >
              <Instagram
                size={14}
                className="transition-transform duration-300 group-hover:scale-115 group-hover:-translate-y-0.5 group-hover:text-[#c5a059]"
              />
              <span className="transition-all duration-300 group-hover:tracking-[0.18em]">
                Instagram
              </span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-300 hover:bg-[#403a34]/[0.06] hover:text-[#403a34] dark:hover:bg-white/[0.08] dark:hover:text-[#c5a059]"
              aria-label="Visitar LinkedIn de AUTEM"
            >
              <Linkedin
                size={14}
                className="transition-transform duration-300 group-hover:scale-115 group-hover:-translate-y-0.5 group-hover:text-[#c5a059]"
              />
              <span className="transition-all duration-300 group-hover:tracking-[0.18em]">
                LinkedIn
              </span>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-300 hover:bg-[#403a34]/[0.06] hover:text-[#403a34] dark:hover:bg-white/[0.08] dark:hover:text-[#c5a059]"
              aria-label="Visitar YouTube de AUTEM"
            >
              <Youtube
                size={14}
                className="transition-transform duration-300 group-hover:scale-115 group-hover:-translate-y-0.5 group-hover:text-[#c5a059]"
              />
              <span className="transition-all duration-300 group-hover:tracking-[0.18em]">
                YouTube
              </span>
            </a>
          </div>

          {/* Botón Volver Arriba */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 rounded-full border border-[#403a34]/20 bg-transparent px-4 py-2 text-[#403a34] transition-all hover:bg-[#403a34] hover:text-[#f6f1eb] dark:border-white/10 dark:bg-white/[0.045] dark:text-white/60 dark:hover:border-accent dark:hover:bg-accent/10 dark:hover:text-accent"
          >
            <span>Volver arriba</span>
            <ArrowUp size={12} />
          </button>
        </div>
      </Container>
    </footer>
  );
}
