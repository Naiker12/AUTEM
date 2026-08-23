import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import ProjectConstructionScene from "./ProjectConstructionScene";
import SelectedProjectsSection from "./SelectedProjectsSection";
import TerritoryExperienceSections from "./TerritoryExperienceSections";

const base = import.meta.env.BASE_URL;
const projects = [
  ["Lotes 360°", "Cartagena · Parcelación campestre", "projects/lotes-360/panoramica-render.png"],
  ["Eco Villa Sierra", "Turbaco · Residencia", "projects/eco-villa-sierra/fachada.jpg"],
  ["The Horizon Suite", "Cartagena · Arquitectura", "projects/the-horizon-suite/fachada.jpg"],
];

function EditorialIntro() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = section.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -box.top / Math.max(box.height - innerHeight, 1)));
      section.style.setProperty("--editorial-progress", p.toFixed(3));
    };
    const onScroll = () => !frame && (frame = requestAnimationFrame(update));
    update();
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
      ref={ref}
      className="editorial-intro relative h-[125svh] overflow-hidden bg-[#f4f0ea] text-[#332e29]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <img
          src={`${base}projects/lotes-360/masterplan-interactive-aerial.png`}
          alt="Masterplan Lotes 360°"
          className="editorial-intro__main absolute left-1/2 top-[12%] h-[76%] w-[88%] -translate-x-1/2 rounded-[1.5rem] object-cover"
        />
        <img
          src={`${base}projects/lotes-360/lot-l07-entorno-verde.png`}
          alt="Entorno natural"
          className="editorial-intro__side editorial-intro__side--left absolute left-[4%] top-[20%] hidden h-[38%] w-[18%] rounded-xl object-cover lg:block"
        />
        <img
          src={`${base}projects/lotes-360/lot-l12-quebrada.png`}
          alt="Vista del lote"
          className="editorial-intro__side editorial-intro__side--right absolute right-[4%] top-[24%] hidden h-[34%] w-[18%] rounded-xl object-cover lg:block"
        />
        <div className="absolute inset-x-0 bottom-[8%] mx-auto max-w-2xl px-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#a47c3a]">
            Territorio · arquitectura · inversión
          </p>
          <h2 className="mt-4 text-[clamp(2.7rem,5vw,5.8rem)] leading-[.92] tracking-[-.06em]">
            Un lugar pensado
            <br />
            para permanecer.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 border-y border-black/15 py-4 text-[10px] font-bold uppercase tracking-[.16em] text-black/55">
            <span>5 ubicaciones</span>
            <span>Lotes desde 1.080 m²</span>
            <span>Cartagena · Colombia</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectGrid() {
  return (
    <section id="proyectos" className="bg-[#f4f0ea] px-6 py-28 text-[#332e29] md:px-12 xl:px-20">
      <header className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#a47c3a]">
          Proyectos seleccionados
        </p>
        <h2 className="mt-4 text-[clamp(2.5rem,4.6vw,5rem)] leading-none tracking-[-.055em]">
          El paisaje define
          <br />
          <i className="font-serif">la arquitectura.</i>
        </h2>
      </header>
      <div className="mx-auto grid max-w-[1700px] gap-5 md:grid-cols-3">
        {projects.map(([name, detail, image], i) => (
          <article key={name} className={i === 1 ? "md:-mt-16" : ""}>
            <img
              src={`${base}${image}`}
              alt={name}
              className="aspect-[.9] w-full rounded-xl object-cover"
            />
            <div className="mt-4 flex items-start justify-between border-b border-black/20 pb-5">
              <div>
                <h3 className="text-xl">{name}</h3>
                <p className="mt-1 text-xs text-black/55">{detail}</p>
              </div>
              <ArrowUpRight size={20} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProcessSection() {
  const stages = ["Lectura del terreno", "Selección del lote", "Construcción", "Entrega"];
  return (
    <section
      data-scroll-scene
      id="tecnologia"
      className="home-process bg-[#e5ddd0] px-6 py-28 text-[#332e29] md:px-12 xl:px-20"
    >
      <div className="mx-auto max-w-[1700px]">
        <header className="scroll-scene-copy mx-auto max-w-xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#a47c3a]">
            Proceso claro
          </p>
          <h2 className="mt-4 text-[clamp(2.5rem,4.6vw,5rem)] leading-none tracking-[-.055em]">
            De la tierra
            <br />a la forma.
          </h2>
        </header>
        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="scroll-scene-media relative h-[520px] overflow-hidden rounded-2xl bg-[#161511]">
            <ProjectConstructionScene />
          </div>
          <ol className="scroll-scene-list divide-y divide-black/20">
            {stages.map((stage, index) => (
              <li key={stage} className="flex items-center justify-between py-7">
                <div>
                  <span className="font-mono text-[10px] text-[#a47c3a]">0{index + 1}</span>
                  <h3 className="mt-2 text-2xl">{stage}</h3>
                </div>
                <ArrowUpRight size={20} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    ["Visualización 3D", "Recorre el proyecto antes de tomar una decisión."],
    ["Selección de lote", "Compara orientación, paisaje, acceso y privacidad."],
    ["Acompañamiento", "Información clara durante cada etapa del proceso."],
  ];
  return (
    <section
      data-scroll-scene
      className="home-services bg-[#26362f] px-6 py-28 text-[#f6f1e8] md:px-12 xl:px-20"
    >
      <div className="mx-auto max-w-[1700px]">
        <p className="scroll-scene-copy text-[10px] font-bold uppercase tracking-[.24em] text-[#ddb66d]">
          La experiencia AUTEM
        </p>
        <div className="mt-10 border-t border-white/20">
          {services.map(([title, description], index) => (
            <article
              key={title}
              className="scroll-scene-item group grid gap-4 border-b border-white/20 py-8 md:grid-cols-[90px_1fr_auto] md:items-center"
              style={{ transitionDelay: `${index * 110}ms` }}
            >
              <span className="font-mono text-[10px] text-[#ddb66d]">0{index + 1}</span>
              <div>
                <h2 className="text-[clamp(2rem,3.5vw,4rem)] leading-none tracking-[-.05em]">
                  {title}
                </h2>
                <p className="mt-3 text-sm text-white/60">{description}</p>
              </div>
              <ArrowUpRight
                size={22}
                className="transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#ddb66d]"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialContact() {
  return (
    <section
      data-scroll-scene
      id="contacto"
      className="home-contact bg-[#bd7659] px-6 py-24 text-[#fff9ef] md:px-12 xl:px-20"
    >
      <div className="mx-auto grid max-w-[1700px] gap-12 md:grid-cols-2">
        <h2 className="scroll-scene-copy max-w-2xl text-[clamp(3rem,6vw,7rem)] leading-[.87] tracking-[-.07em]">
          Hablemos de
          <br />
          <i className="font-serif">tu próximo lugar.</i>
        </h2>
        <div className="scroll-scene-copy scroll-scene-copy--late self-end">
          <p className="max-w-md text-lg leading-8 text-white/75">
            Conoce el proyecto, el territorio y las opciones disponibles con atención personalizada.
          </p>
          <a
            href="#contacto"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#fff9ef] px-6 py-4 text-[10px] font-bold uppercase tracking-[.15em] text-[#332e29] transition hover:bg-[#f2d6ac]"
          >
            Contactar <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <p className="mt-24 overflow-hidden text-[clamp(5rem,17vw,19rem)] font-semibold leading-[.72] tracking-[-.1em] text-white/85">
        AUTEM
      </p>
    </section>
  );
}

export default function EditorialHomeSections() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scenes = [...root.querySelectorAll<HTMLElement>("[data-scroll-scene]")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scenes.forEach((scene) => scene.classList.add("is-scroll-active"));
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      scenes.forEach((scene) => {
        const bounds = scene.getBoundingClientRect();
        const progress = Math.min(
          1,
          Math.max(0, (innerHeight * 0.9 - bounds.top) / (innerHeight * 0.72)),
        );
        scene.style.setProperty("--section-scroll", progress.toFixed(4));
        scene.classList.toggle(
          "is-scroll-active",
          bounds.top < innerHeight * 0.9 && bounds.bottom > 0,
        );
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <SelectedProjectsSection />
      <TerritoryExperienceSections />
      <ServicesSection />
      <ProcessSection />
      <EditorialContact />
    </div>
  );
}
