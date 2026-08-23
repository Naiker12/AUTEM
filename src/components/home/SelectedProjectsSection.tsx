import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const base = import.meta.env.BASE_URL;

const projects = [
  {
    name: "Lotes 360°",
    type: "Parcelación campestre",
    location: "Cartagena",
    image: "projects/lotes-360/panoramica-render.png",
    href: "proyecto/lotes-360",
    className: "selected-project--left",
  },
  {
    name: "Eco Villa Sierra",
    type: "Residencia de paisaje",
    location: "Turbaco",
    image: "projects/eco-villa-sierra/fachada.jpg",
    href: "proyecto/eco-villa-sierra",
    className: "selected-project--center",
  },
  {
    name: "The Horizon Suite",
    type: "Arquitectura residencial",
    location: "Cartagena",
    image: "projects/the-horizon-suite/fachada.jpg",
    href: "proyecto/the-horizon-suite",
    className: "selected-project--right",
  },
];

export default function SelectedProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const cards = section.querySelectorAll<HTMLElement>(".selected-project");

    const updateScrollProgress = () => {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      const windowH = window.innerHeight;

      const progress = Math.min(1, Math.max(0, (windowH - bounds.top) / (windowH + bounds.height)));

      cards.forEach((card, i) => {
        const speed = i === 1 ? -8 : i === 0 ? 18 : -14;
        const yOffset = (progress - 0.5) * speed;
        card.style.setProperty("--parallax-y", `${yOffset.toFixed(2)}px`);
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="proyectos"
      className="selected-projects relative z-20 overflow-hidden bg-[#efeae1] px-6 py-24 text-[#332e29] md:px-12 md:py-32 xl:px-20"
    >
      <div className="mx-auto max-w-[1700px]">
        <header className="selected-projects__header grid gap-8 border-t border-black/15 pt-7 md:grid-cols-[1.25fr_.75fr] md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#a47c3a] dark:text-[#ddb66d]">
              Proyectos seleccionados
            </p>
            <h2 className="mt-4 max-w-4xl text-[clamp(2.5rem,5.4vw,5.5rem)] font-normal leading-[1.08] tracking-[-0.015em]">
              El paisaje define
              <br />
              <span className="font-serif italic font-normal text-[#a47c3a] dark:text-[#ddb66d]">
                la arquitectura.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-black/60 dark:text-white/60 md:justify-self-end md:pb-2">
            Tres visiones arquitectónicas en el Caribe colombiano, diseñadas desde la relación entre
            territorio, luz y vida cotidiana.
          </p>
        </header>

        <div className="selected-projects__grid mt-14 grid gap-6 md:grid-cols-[.75fr_1.5fr_.75fr] md:items-start lg:mt-20">
          {projects.map((project, index) => (
            <article
              key={project.name}
              className={`selected-project ${project.className} transition-transform duration-500 ease-out`}
              style={{
                transform: "translate3d(0, var(--parallax-y, 0), 0)",
              }}
            >
              <a
                href={`${base}${project.href}`}
                className="group block"
                aria-label={`Ver ${project.name}`}
              >
                <div
                  className={`selected-project__image relative overflow-hidden rounded-2xl bg-[#ded5c9] shadow-lg transition-all duration-700 group-hover:shadow-2xl ${
                    index === 1
                      ? "h-[420px] md:h-[560px] lg:h-[620px]"
                      : "h-[360px] md:h-[450px] lg:h-[490px]"
                  }`}
                >
                  <img
                    src={`${base}${project.image}`}
                    alt={project.name}
                    className="selected-project__img h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute right-4 top-4 flex size-11 translate-y-2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-hover:bg-[#b5863c] group-hover:border-[#b5863c]">
                    <ArrowUpRight size={18} strokeWidth={1.8} />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                </div>
                <div className="selected-project__meta mt-4 flex items-start justify-between border-b border-black/20 pb-5 transition-colors group-hover:border-[#a47c3a]">
                  <div>
                    <h3 className="font-serif text-xl font-normal tracking-[-.02em] transition-colors group-hover:text-[#a47c3a] md:text-2xl">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.15em] text-black/50">
                      {project.location} · {project.type}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#a47c3a]">
                    0{index + 1}
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
