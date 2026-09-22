import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { useScrollFrame } from "@/hooks/useScrollFrame";

interface HomeHeroSectionProps {
  visible: boolean;
}

/** Opening composition aligned with the supplied Framer reference. */
export default function HomeHeroSection({ visible }: HomeHeroSectionProps) {
  const sceneRef = useRef<HTMLElement>(null);
  useScrollFrame(() => {
    const el = sceneRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = reduced
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            -el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - window.innerHeight),
          ),
        );
    el.style.setProperty("--gallery-progress", String(progress));
  });
  const entranceClass = visible ? "home-entrance" : "opacity-0";
  const heroScene = `${import.meta.env.BASE_URL}images/autem-hero-approved-scene-v2.png`;

  return (
    <section ref={sceneRef} id="top" className="editorial-hero text-white">
      <div className="editorial-hero__stage">
        <img
          className="editorial-hero__side editorial-hero__side--left"
          src={`${import.meta.env.BASE_URL}images/carousel-sunset-terrace.jpg`}
          alt="Terraza integrada al paisaje"
        />
        <img
          className="editorial-hero__side editorial-hero__side--right"
          src={`${import.meta.env.BASE_URL}images/carousel-modern-lounge.jpg`}
          alt="Interior de arquitectura contemporánea"
        />
        <div className="editorial-hero__frame relative overflow-hidden rounded-[12px] bg-[#4f4742]">
          <img
            src={heroScene}
            alt="Director de AUTEM junto al masterplan de Villa Paraíso"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/12 to-black/10" />

          <div className="editorial-hero__content relative flex h-full flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-10">
            <div className="grid items-end gap-8 border-b border-white/70 pb-7 md:grid-cols-12 md:gap-10 md:pb-7">
              <h1 className={`${entranceClass} editorial-hero__title md:col-span-7`}>
                Arquitectura que transforma el territorio.
              </h1>

              <div className={`${entranceClass} max-w-[29rem] md:col-span-5 md:justify-self-end`}>
                <p className="text-[14px] leading-[1.45] tracking-[-0.025em] text-white sm:text-[15px]">
                  Diseñamos proyectos inmobiliarios y arquitectónicos que conectan el paisaje, la
                  inversión y la forma de habitar.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="#proyectos"
                    className="inline-flex items-center gap-2 rounded-full bg-[#f0ebe6] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.05em] text-[#4f4742] transition hover:bg-white"
                  >
                    Ver proyectos <ArrowUpRight size={14} />
                  </a>
                  <a
                    href="#contacto"
                    className="inline-flex items-center gap-2 rounded-full bg-[#4f4742]/85 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.05em] text-white backdrop-blur-sm transition hover:bg-[#4f4742]"
                  >
                    Agendar consulta <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
