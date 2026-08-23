import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
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
        {/* Left: Masterplan Lot Overlay Card */}
        <div className="editorial-intro__side editorial-intro__side--left absolute left-[4%] top-[18%] hidden h-[42%] w-[22%] overflow-hidden rounded-2xl border border-black/10 shadow-2xl dark:border-white/20 lg:block">
          <img
            src={`${base}projects/lotes-360/masterplan-general-aerial.jpg`}
            alt="Plano de Lotes Masterplan General"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
          <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between">
            <span className="rounded-full border border-[#a47c3a]/50 bg-black/70 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-[#ddb66d] backdrop-blur-md">
              Masterplan General · 128 Lotes
            </span>
          </div>
        </div>

        {/* Right: Aspirational Landscape / Nature Card */}
        <div className="editorial-intro__side editorial-intro__side--right absolute right-[4%] top-[22%] hidden h-[36%] w-[19%] overflow-hidden rounded-2xl border border-black/10 shadow-2xl dark:border-white/20 lg:block">
          <img
            src={`${base}projects/lotes-360/lot-l07-entorno-verde.png`}
            alt="Entorno natural y amenidades"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
          <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between">
            <span className="rounded-full border border-white/30 bg-black/70 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md">
              Naturaleza & Amenidades
            </span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[8%] mx-auto max-w-2xl px-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#a47c3a] dark:text-[#ddb66d]">
            Territorio · arquitectura · inversión
          </p>
          <h2 className="mt-4 text-[clamp(2.4rem,4.8vw,5.2rem)] font-normal leading-[1.08] tracking-[-0.015em]">
            Un lugar pensado
            <br />
            <span className="font-serif italic font-normal text-[#a47c3a] dark:text-[#ddb66d]">
              para permanecer.
            </span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 border-y border-black/15 py-4 text-[10px] font-bold uppercase tracking-[.16em] text-black/55 dark:text-white/60">
            <span>3 proyectos activos</span>
            <span>Lotes desde 1.080 m²</span>
            <span>Cartagena & Turbaco · Colombia</span>
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
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#a47c3a] dark:text-[#ddb66d]">
          Proyectos seleccionados
        </p>
        <h2 className="mt-4 text-[clamp(2.4rem,4.6vw,4.8rem)] font-normal leading-[1.08] tracking-[-0.015em]">
          El paisaje define
          <br />
          <span className="font-serif italic text-[#a47c3a] dark:text-[#ddb66d]">
            la arquitectura.
          </span>
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
                <p className="mt-1 text-xs text-black/55 dark:text-white/60">{detail}</p>
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
  const [openStageIndex, setOpenStageIndex] = useState<number | null>(0);

  const stages = [
    {
      number: "01",
      title: "Lectura del terreno",
      summary: "Análisis topográfico, curvas de nivel y evaluación del entorno natural.",
      details:
        "Estudiamos las pendientes, la vegetación nativa, los recorridos de luz y las visuales antes de trazar la primera línea, identificando el potencial paisajístico de cada coordenada.",
      highlights: [
        "Levantamiento topográfico y modelo digital del terreno",
        "Análisis de asoleamiento y vientos predominantes",
        "Identificación de corredores verdes y visuales protegidas",
      ],
    },
    {
      number: "02",
      title: "Selección del lote",
      summary: "Elección informada con visualización 3D y parámetros de habitabilidad.",
      details:
        "Comparamos la privacidad, los accesos viales, la cercanía a zonas comunes y la orientación solar para seleccionar el lote que mejor se adapta a tu proyecto arquitectónico.",
      highlights: [
        "Comparativa de áreas, frentes y linderos",
        "Simulación interactiva de visuales futuras",
        "Evaluación de privacidad y entorno directo",
      ],
    },
    {
      number: "03",
      title: "Construcción",
      summary: "Desarrollo constructivo riguroso con supervisión técnica continua.",
      details:
        "Ejecución de infraestructura vial, redes subterráneas, paisajismo y edificaciones con estándares de calidad elevados, control de cronogramas y supervisión periódica.",
      highlights: [
        "Vías internas y redes de servicios de alta especificación",
        "Supervisión técnica y reportes transparentes de avance",
        "Materiales seleccionados para el clima del Caribe",
      ],
    },
    {
      number: "04",
      title: "Entrega",
      summary: "Recepción técnica de la propiedad y formalización jurídica integral.",
      details:
        "Verificación exhaustiva de linderos, amojonamiento en sitio, disponibilidad de servicios y acompañamiento legal completo hasta la firma de escrituras.",
      highlights: [
        "Acta de entrega técnica con verificación en terreno",
        "Acompañamiento en trámites notariales y registro",
        "Soporte y asesoría post-entrega",
      ],
    },
  ];

  return (
    <section
      data-scroll-scene
      id="tecnologia"
      className="home-process bg-[#e5ddd0] px-6 py-24 text-[#332e29] md:px-12 xl:px-20"
    >
      <div className="mx-auto max-w-[1700px]">
        <header className="scroll-scene-copy mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(2.5rem,4.6vw,4.8rem)] font-normal leading-[1.04] tracking-[-0.02em]">
            De la tierra
            <br />
            <span className="font-serif italic text-[#a47c3a] dark:text-[#ddb66d]">
              a la forma.
            </span>
          </h2>
        </header>
        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="scroll-scene-media group relative sticky top-28 h-[480px] overflow-hidden rounded-2xl border border-black/10 bg-[#161511] shadow-xl">
            <img
              src={`${import.meta.env.BASE_URL}projects/lotes-360/panoramica-render.png`}
              alt="Perspectiva del Masterplan y Parcelación de Lotes AUTEM"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
              <span className="rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ddb66d] backdrop-blur-md">
                Lectura Territorial · Lotes 360°
              </span>
              <span className="text-[10px] font-medium tracking-wider text-white/70">
                128 Parcelas
              </span>
            </div>
          </div>
          <div className="scroll-scene-list divide-y divide-black/15 dark:divide-white/15">
            {stages.map((stage, index) => {
              const isOpen = openStageIndex === index;
              return (
                <article key={stage.title} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setOpenStageIndex(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between py-5 text-left transition-all"
                    aria-expanded={isOpen}
                  >
                    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                      <span className="shrink-0 font-mono text-xs text-[#a47c3a] dark:text-[#ddb66d]">
                        {stage.number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-serif font-light text-[clamp(1.15rem,2.1vw,1.85rem)] tracking-[-0.015em] transition group-hover:text-[#a47c3a] dark:group-hover:text-[#ddb66d]">
                          {stage.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-black/55 dark:text-white/55 font-light">
                          {stage.summary}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`ml-4 flex size-8 shrink-0 items-center justify-center rounded-full border border-black/15 text-[#a47c3a] transition-all duration-300 dark:border-white/20 dark:text-[#ddb66d] ${
                        isOpen
                          ? "rotate-180 border-[#a47c3a] bg-[#a47c3a]/10 dark:border-[#ddb66d] dark:bg-[#ddb66d]/15"
                          : "group-hover:border-black/35 dark:group-hover:border-white/40"
                      }`}
                    >
                      <ChevronDown size={14} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="animate-fade-up pb-6 pt-1">
                      <div className="rounded-xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-black/25 sm:ml-10">
                        <p className="text-xs leading-6 text-black/75 dark:text-white/75 font-light">
                          {stage.details}
                        </p>
                        <div className="mt-4 space-y-2 border-t border-black/10 pt-3.5 dark:border-white/10">
                          {stage.highlights.map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-2 text-xs font-light text-black/70 dark:text-white/70"
                            >
                              <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-[#a47c3a]/20 text-[9px] text-[#a47c3a] dark:bg-[#ddb66d]/20 dark:text-[#ddb66d]">
                                <Check size={10} strokeWidth={2.5} />
                              </span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const services = [
    {
      number: "01",
      title: "Visualización 3D & Realidad Aumentada",
      summary: "Recorre y experimenta el proyecto antes de la primera piedra.",
      details:
        "Creamos modelos arquitectónicos tridimensionales con fidelidad espacial absoluta, iluminación fotorrealista de día y noche, recorridos 360° y visualización en Realidad Aumentada (AR) para proyectar cada volumen en su entorno real.",
      highlights: [
        "Renders 4K fotorrealistas con iluminación natural",
        "Maquetas interactivas y modelos 3D navegables",
        "Visualización en Realidad Aumentada (WebXR)",
        "Recorridos peatonales y vistas aéreas",
      ],
      tag: "Tecnología & Espacio",
    },
    {
      number: "02",
      title: "Selección & Análisis Territorial de Lote",
      summary: "Compara orientación solar, topografía, vientos, accesos y privacidad.",
      details:
        "Analizamos cada lote con cartografía de precisión, curvas de nivel y patrones bioclimáticos para garantizar que el diseño arquitectónico aproveche al máximo las visuales, la brisa y el asoleamiento.",
      highlights: [
        "Estudio de asoleamiento y recorridos solares",
        "Modelado digital de curvas de nivel y pendientes",
        "Evaluación de privacidad, visuales y accesos",
        "Diagnóstico de linderos y disponibilidad técnica",
      ],
      tag: "Territorio & Bioclima",
    },
    {
      number: "03",
      title: "Acompañamiento & Consultoría Integral",
      summary: "Información clara, asesoría técnica y supervisión en cada etapa.",
      details:
        "Acompañamiento continuo y personalizado desde la conceptualización hasta la entrega final, conectando diseño arquitectónico, viabilidad técnica, presupuestos reales y cumplimiento normativo.",
      highlights: [
        "Asesoría técnica y arquitectónica cercana",
        "Estructuración de presupuestos y costos detallados",
        "Coordinación de diseño, ingeniería y licencias",
        "Seguimiento y control de calidad en obra",
      ],
      tag: "Gestión & Viabilidad",
    },
  ];

  return (
    <section
      data-scroll-scene
      className="home-services bg-[#26362f] px-6 py-24 text-[#f6f1e8] md:px-12 xl:px-20"
    >
      <div className="mx-auto max-w-[1700px]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/15 pb-8 md:flex-row md:items-end">
          <div>
            <p className="scroll-scene-copy text-[10px] font-bold uppercase tracking-[.26em] text-[#ddb66d]">
              La experiencia AUTEM
            </p>
            <h2 className="mt-3 font-serif font-light text-[clamp(1.9rem,3.6vw,3.4rem)] leading-[1.08] tracking-[-0.015em] text-white">
              Servicios & Metodología
            </h2>
          </div>
          <p className="max-w-md text-xs font-light leading-5 text-white/60 md:text-sm">
            Haz clic en cada área para desplegar los detalles técnicos, entregables y metodología de
            trabajo.
          </p>
        </div>

        <div className="divide-y divide-white/15">
          {services.map((service, index) => {
            const isOpen = openIndex === index;
            return (
              <article
                key={service.title}
                className="scroll-scene-item transition-colors"
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="group flex w-full items-center justify-between py-6 text-left transition-all hover:bg-white/[0.02]"
                  aria-expanded={isOpen}
                >
                  <div className="flex min-w-0 items-center gap-5 sm:gap-8">
                    <span className="shrink-0 font-mono text-xs text-[#ddb66d]">
                      {service.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-serif font-light text-[clamp(1.25rem,2.3vw,2rem)] tracking-[-0.015em] text-white transition group-hover:text-[#ddb66d]">
                        {service.title}
                      </h3>
                      <p className="mt-1 text-xs font-light text-white/55">{service.summary}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <span className="hidden rounded-full border border-white/20 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ddb66d]/90 backdrop-blur-sm sm:inline-block">
                      {service.tag}
                    </span>
                    <span
                      className={`flex size-8 items-center justify-center rounded-full border border-white/25 text-[#ddb66d] transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 border-[#ddb66d] bg-[#ddb66d]/15"
                          : "group-hover:border-white/50"
                      }`}
                    >
                      <ChevronDown size={15} />
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="animate-fade-up pb-8 pt-2">
                    <div className="rounded-2xl border border-white/12 bg-black/25 p-6 backdrop-blur-md sm:ml-14 md:p-8">
                      <p className="max-w-3xl text-sm font-light leading-7 text-white/80">
                        {service.details}
                      </p>
                      <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                        {service.highlights.map((item) => (
                          <div
                            key={item}
                            className="flex items-start gap-2.5 text-xs font-light text-white/75"
                          >
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#ddb66d]/20 text-[10px] text-[#ddb66d]">
                              <Check size={11} strokeWidth={2.5} />
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
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
        <h2 className="scroll-scene-copy max-w-2xl text-[clamp(2.5rem,5.2vw,5.5rem)] font-normal leading-[1.08] tracking-[-0.015em]">
          Hablemos de
          <br />
          <span className="font-serif italic text-[#fff9ef]/90">tu próximo lugar.</span>
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
      <p className="mt-24 overflow-hidden text-[clamp(4rem,14vw,16rem)] font-bold leading-none tracking-[-0.03em] text-white/85">
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
