import { Link } from "@tanstack/react-router";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { ArrowUp, Instagram, Linkedin, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { ZONAS } from "@/data/properties";

export default function PiePagina() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-stone-800 bg-stone-950 text-stone-300 py-16 md:py-24 overflow-hidden">
      {/* Luz ambiental sutil */}
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6 md:px-8">
        
        {/* Fila Principal de Navegación */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 pb-16 border-b border-stone-800/80">
          
          {/* Columna 1: Marca & Descripción (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div>
              <Link to="/" className="flex items-center gap-3 group">
                <AutemBrandIcon size={36} className="transition-transform group-hover:scale-105" />
                <span className="font-serif text-2xl font-semibold tracking-wider text-white">
                  AUTEM
                </span>
              </Link>

              <p className="mt-4 text-xs font-light leading-relaxed text-stone-400 max-w-sm">
                Arquitectura sin fronteras. Proyectos de alta gama, visualización 3D y maquetas interactivas en Cartagena de Indias, Barú y Turbaco desde 2010.
              </p>
            </div>

            {/* Datos de contacto directo */}
            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-accent shrink-0" />
                <span>Bocagrande, Av. San Martín 10-45 · Cartagena</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-accent shrink-0" />
                <span>+57 (300) 720-0894</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-accent shrink-0" />
                <span>hola@autem.es</span>
              </div>
            </div>
          </div>

          {/* Columna 2: Explorar (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href={`${import.meta.env.BASE_URL}#proyectos`} className="hover:text-accent transition-colors">
                  Proyectos Destacados
                </a>
              </li>
              <li>
                <Link to="/catalogo" className="hover:text-accent transition-colors">
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <a href={`${import.meta.env.BASE_URL}#tecnologia`} className="hover:text-accent transition-colors">
                  Experiencia AR 3D
                </a>
              </li>
              <li>
                <a href={`${import.meta.env.BASE_URL}#nosotros`} className="hover:text-accent transition-colors">
                  Inversionistas
                </a>
              </li>
              <li>
                <a href={`${import.meta.env.BASE_URL}#contacto`} className="hover:text-accent transition-colors">
                  Contacto Privado
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Zonas Exclusivas en Cartagena (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              Zonas Exclusivas
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
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
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              Garantía & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link to="/politica-privacidad" className="hover:text-accent transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <span className="text-stone-300 font-medium">Fiduciarias Aliadas:</span> Bancolombia, Alianza
              </li>
              <li>
                <span className="text-stone-300 font-medium">Licencias:</span> Explotación Turística Airbnb
              </li>
            </ul>
          </div>

        </div>

        {/* Fila Inferior: Copyright, Redes Sociales & Botón Volver Arriba */}
        <div className="mt-8 flex flex-col items-center justify-between gap-6 text-[10px] uppercase tracking-widest text-stone-500 md:flex-row">
          <p>© {new Date().getFullYear()} AUTEM Real Estate. Todos los derechos reservados.</p>

          {/* Redes Sociales */}
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={14} />
              <span>Instagram</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={14} />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
              aria-label="YouTube"
            >
              <Youtube size={14} />
              <span>YouTube</span>
            </a>
          </div>

          {/* Botón Volver Arriba */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-4 py-2 text-stone-300 transition-all hover:border-accent hover:text-accent"
          >
            <span>Volver arriba</span>
            <ArrowUp size={12} />
          </button>
        </div>

      </div>
    </footer>
  );
}
