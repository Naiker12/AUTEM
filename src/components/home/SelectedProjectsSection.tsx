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
    const updateScrollProgress = () => {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * 0.92 - bounds.top) / (innerHeight * 0.78)));
      section.style.setProperty("--projects-scroll", progress.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateScrollProgress);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("selected-projects--visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(section);
    updateScrollProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} id="proyectos" className="selected-projects bg-[#efeae1] px-6 py-28 text-[#332e29] md:px-12 md:py-36 xl:px-20">
      <div className="mx-auto max-w-[1700px]">
        <header className="selected-projects__header grid gap-8 border-t border-black/15 pt-7 md:grid-cols-[1.25fr_.75fr] md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#a47c3a]">Proyectos seleccionados</p>
            <h2 className="mt-5 max-w-4xl text-[clamp(3rem,6.2vw,7.5rem)] leading-[.84] tracking-[-.075em]">
              El paisaje define
              <br />
              <i className="font-serif font-normal">la arquitectura.</i>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-black/55 md:justify-self-end md:pb-2">
            Tres maneras de habitar el Caribe, diseñadas desde la relación entre territorio, luz y vida cotidiana.
          </p>
        </header>

        <div className="selected-projects__grid mt-16 grid gap-5 md:grid-cols-[.68fr_1.65fr_.68fr] md:items-start lg:mt-24">
          {projects.map((project, index) => (
            <article key={project.name} className={`selected-project ${project.className}`} style={{ transitionDelay: `${index * 120}ms` }}>
              <a href={`${base}${project.href}`} className="group block" aria-label={`Ver ${project.name}`}>
                <div className="selected-project__image relative overflow-hidden rounded-2xl bg-[#ded5c9]">
                  <img src={`${base}${project.image}`} alt={project.name} className="h-full w-full object-cover" />
                  <span className="absolute right-4 top-4 flex size-10 translate-y-2 items-center justify-center rounded-full bg-[#f8f5ef] text-[#332e29] opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight size={18} strokeWidth={1.6} />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                </div>
                <div className="selected-project__meta mt-4 flex items-start justify-between border-b border-black/20 pb-5">
                  <div>
                    <h3 className="text-xl tracking-[-.03em]">{project.name}</h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.13em] text-black/50">
                      {project.location} · {project.type}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#a47c3a]">0{index + 1}</span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
