import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export default function PiePagina() {
  const marqueeText = "AUTEM · ARQUITECTURA Y TERRITORIO · ";

  return (
    <footer className="bg-[#ded5c9] text-[#4f4742] pt-20 md:pt-28 border-t border-[#4f4742]/15 relative overflow-hidden">
      <div className="w-[93%] max-w-[1360px] mx-auto">
        {/* Top Headline & CTA */}
        <div className="pb-16 md:pb-20 border-b border-[#4f4742]/15 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-[clamp(28px,3.8vw,48px)] font-medium leading-[1.12] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
              ABIERTOS A PROYECTOS Y COLABORACIONES QUE TRANSFORMAN ESPACIOS.
            </h2>
          </div>

          <a
            href={`${import.meta.env.BASE_URL}#contacto`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#4f4742] text-[#f0ebe6] text-[12px] font-medium uppercase tracking-[0.14em] hover:bg-black transition-colors w-fit shrink-0"
          >
            <span>HABLEMOS</span>
            <ArrowUpRight size={15} />
          </a>
        </div>

        {/* Links Grid */}
        <div className="py-14 border-b border-[#4f4742]/15 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10 text-[12px] tracking-[0.1em] uppercase">
          {/* Navigation */}
          <div className="space-y-3">
            <ul className="space-y-2.5 text-[#4f4742]/85">
              <li>
                <Link to="/" className="hover:text-black transition-colors">
                  INICIO
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="hover:text-black transition-colors">
                  NOSOTROS
                </Link>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#servicios`}
                  className="hover:text-black transition-colors"
                >
                  SERVICIOS
                </a>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#proyectos`}
                  className="hover:text-black transition-colors"
                >
                  PROYECTOS
                </a>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#design-process`}
                  className="hover:text-black transition-colors"
                >
                  PROCESO
                </a>
              </li>
              <li>
                <a
                  href={`${import.meta.env.BASE_URL}#contacto`}
                  className="hover:text-black transition-colors"
                >
                  CONTACTO
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <ul className="space-y-2.5 text-[#4f4742]/85">
              <li>
                <Link to="/politica-privacidad" className="hover:text-black transition-colors">
                  POLÍTICA DE PRIVACIDAD
                </Link>
              </li>
            </ul>
          </div>

          {/* Project Direct Access */}
          <div className="space-y-2">
            <span className="block text-[10px] text-[#4f4742]/60">PROYECTO DESTACADO</span>
            <Link
              to="/proyecto/$slug"
              params={{ slug: "villa-paraiso" }}
              className="group block text-[13px] font-medium text-[#4f4742] hover:underline"
            >
              VILLA PARAÍSO 3D
            </Link>
            <p className="text-[11px] text-[#57504b] normal-case tracking-normal">
              343 lotes campestres en Santa Rosa · Villanueva con plano maestro interactivo.
            </p>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="py-6 flex items-center justify-between text-[11px] text-[#57504b] uppercase tracking-[0.08em]">
          <p>© 2026 AUTEM Studio. Todos los derechos reservados.</p>
          <a href={`${import.meta.env.BASE_URL}#contacto`} className="hover:underline">
            Cartagena & Turbaco · Bolívar
          </a>
        </div>
      </div>

      {/* Giant Running Marquee Header */}
      <div className="w-full border-t border-[#4f4742]/15 bg-[#ded5c9] py-6 overflow-hidden select-none">
        <div className="animate-framer-marquee flex items-center whitespace-nowrap text-[clamp(3.5rem,8vw,96px)] font-black uppercase tracking-[-0.04em] text-[#4f4742]/20 font-sans leading-none">
          <span>{marqueeText.repeat(6)}</span>
        </div>
      </div>

      {/* Bottom Panoramic Photo */}
      <div className="w-full h-[220px] sm:h-[320px] lg:h-[420px] overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}projects/lotes-360/lot-l07-entorno-verde.png`}
          alt="Visualización conceptual del paisaje de Villa Paraíso"
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
    </footer>
  );
}
