import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/layout/Container";
import { useScrollFrame } from "@/hooks/useScrollFrame";

const base = import.meta.env.BASE_URL;

const projects = [
  {
    number: "01",
    name: "Lotes 360°",
    type: "Parcelación Campestre",
    location: "Cartagena",
    area: "128 Lotes · Desde 1.080 m²",
    image: "images/lotes-360-luxury-masterplan.jpg",
    href: "proyecto/lotes-360",
    className: "selected-project--left",
  },
  {
    number: "02",
    name: "Eco Villa Sierra",
    type: "Residencia de Paisaje",
    location: "Turbaco",
    area: "480 m² Construidos · Lote 2.200 m²",
    image: "projects/eco-villa-sierra/fachada-home.webp",
    href: "proyecto/eco-villa-sierra",
    className: "selected-project--center",
  },
];

export default function SelectedProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16 },
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  useScrollFrame(() => {
    const section = sectionRef.current;
    if (!section) return;

    const bounds = section.getBoundingClientRect();
    const windowH = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (windowH - bounds.top) / (windowH + bounds.height)));
    section.style.setProperty("--projects-scroll", progress.toFixed(3));

    section.querySelectorAll<HTMLElement>(".selected-project").forEach((card, index) => {
      const speed = index === 1 ? -8 : index === 0 ? 18 : -14;
      const yOffset = (progress - 0.5) * speed;
      card.style.setProperty("--parallax-y", `${yOffset.toFixed(2)}px`);
    });
  });

  return (
    <section
      ref={sectionRef}
      id="proyectos"
      className="selected-projects relative z-20 overflow-hidden bg-[#f6f1eb] px-6 py-24 text-[#403a34] md:px-12 md:py-32 xl:px-20 border-t border-[#403a34]/15"
    >
      <Container>
        <header
          className="selected-projects__header grid gap-8 border-b border-[#403a34]/15 pb-10 md:grid-cols-[1.25fr_.75fr] md:items-end"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: `translate3d(0, ${isVisible ? "0" : "28px"}, 0)`,
            transition:
              "opacity 700ms cubic-bezier(.19,1,.22,1), transform 700ms cubic-bezier(.19,1,.22,1)",
          }}
        >
          <div>
            <div className="mb-4 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#403a34]">
              <span className="size-1 rounded-full bg-[#403a34]" />
              <span>Proyectos Seleccionados</span>
            </div>
            <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
              El paisaje define la arquitectura.
            </h2>
          </div>
          <p className="max-w-md text-[18px] leading-[1.5] text-[#333333] md:justify-self-end">
            Dos visiones arquitectónicas en el Caribe colombiano, proyectadas con rigor técnico y diálogo permanente con el entorno natural.
          </p>
        </header>

        <div className="selected-projects__grid mt-14 grid gap-8 md:grid-cols-2 lg:mt-20">
          {projects.map((project, index) => (
            <article
              key={project.name}
              className={`selected-project ${project.className} transition-transform duration-500 ease-out`}
              style={
                {
                  opacity: isVisible ? 1 : 0,
                  transform: `translate3d(0, calc(var(--parallax-y, 0px) + ${isVisible ? "0px" : "44px"}), 0)`,
                  transition:
                    "opacity 760ms cubic-bezier(.19,1,.22,1), transform 760ms cubic-bezier(.19,1,.22,1)",
                  transitionDelay: `${index * 110}ms`,
                } as CSSProperties
              }
            >
              <a
                href={`${base}${project.href}`}
                className="group block border border-[#403a34] bg-[#f6f1eb] p-0 overflow-hidden transition hover:border-[#403a34]"
                aria-label={`Ver ${project.name}`}
              >
                {/* 0px radius architectural photograph frame - completely flush */}
                <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[500px] overflow-hidden bg-[#e8e0d5]">
                  <img
                    src={`${base}${project.image}`}
                    alt={project.name}
                    loading="lazy"
                    decoding="async"
                    className="selected-project__img h-full w-full object-cover object-center block transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-[#f6f1eb] px-3 py-1 text-[9px] font-medium tracking-[0.1em] uppercase text-[#403a34] border border-[#403a34]/30">
                    {project.number}
                  </div>
                  <span className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-[#403a34] bg-[#f6f1eb] text-[#403a34] transition-all duration-300 group-hover:bg-[#403a34] group-hover:text-[#f6f1eb]">
                    <ArrowUpRight size={16} strokeWidth={1.8} />
                  </span>
                </div>

                <div className="selected-project__meta p-6 sm:p-8 border-t border-[#403a34] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#555555]">
                      {project.location} · {project.type}
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555]">
                      {project.area}
                    </span>
                  </div>
                  <h3 className="mt-3 text-[26px] sm:text-[32px] font-medium leading-tight tracking-[-0.03em] text-[#403a34]">
                    {project.name}
                  </h3>
                </div>
              </a>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
