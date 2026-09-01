import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, MoveRight } from "lucide-react";
import SelectedProjectsSection from "./SelectedProjectsSection";
import TerritoryExperienceSections from "./TerritoryExperienceSections";
import Container from "@/components/layout/Container";
import { WHATSAPP_BASE_URL } from "@/data/constants";

function ProcessSection() {
  const [openStageIndex, setOpenStageIndex] = useState<number | null>(null);

  const stages = [
    {
      number: "01",
      title: "Lectura del terreno",
      summary:
        "Análisis topográfico, curvas de nivel y evaluación bioclimática del entorno natural.",
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
      className="home-process bg-[#f6f1eb] px-6 py-24 text-[#403a34] md:px-12 xl:px-20 border-t border-[#403a34]/15"
    >
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#403a34]/15 pb-10">
          <div>
            <div className="mb-4 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#403a34]">
              <span className="size-1 rounded-full bg-[#403a34]" />
              <span>Metodología & Proceso</span>
            </div>
            <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
              De la tierra a la forma.
            </h2>
          </div>
          <p className="max-w-md text-[18px] leading-[1.5] text-[#333333]">
            Un método transparente y riguroso para transformar coordenadas naturales en arquitectura
            de valor perdurable.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-5 border border-[#403a34] bg-[#f6f1eb] overflow-hidden h-full flex flex-col justify-between">
            <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] overflow-hidden bg-[#e8e0d5]">
              <img
                src={`${import.meta.env.BASE_URL}projects/lotes-360/panoramica-render.png`}
                alt="Perspectiva del Masterplan y Parcelación AUTEM"
                className="absolute inset-0 h-full w-full object-cover object-center block transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-4 sm:p-5 border-t border-[#403a34] flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-[#555555] shrink-0">
              <span>Masterplan Lotes 360° · Vista Territorial</span>
              <span>AUTEM 2026</span>
            </div>
          </div>

          <div className="lg:col-span-7 divide-y divide-[#403a34]/15 border-y border-[#403a34]/15 h-full flex flex-col justify-between">
            {stages.map((stage, index) => {
              const isOpen = openStageIndex === index;
              return (
                <article
                  key={stage.title}
                  className="transition-colors flex-1 flex flex-col justify-center"
                >
                  <button
                    type="button"
                    onClick={() => setOpenStageIndex(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between py-5 sm:py-6 text-left transition-all hover:bg-[#403a34]/[0.03]"
                    aria-expanded={isOpen}
                  >
                    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                      <span className="shrink-0 text-[12px] font-medium tracking-[0.1em] text-[#403a34]">
                        {stage.number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[19px] sm:text-[22px] font-medium tracking-[-0.02em] text-[#403a34] transition group-hover:text-[#403a34]">
                          {stage.title}
                        </h3>
                        <p className="mt-1 text-[13px] text-[#555555]">{stage.summary}</p>
                      </div>
                    </div>
                    <span
                      className={`ml-4 flex size-8 shrink-0 items-center justify-center rounded-full border border-[#403a34]/20 text-[#403a34] transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 border-[#403a34] bg-[#403a34] text-[#f6f1eb]"
                          : "group-hover:border-[#403a34]"
                      }`}
                    >
                      <ChevronDown size={14} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="animate-fade-up pb-6 pt-1 pl-8 sm:pl-10">
                      <div className="border-l-2 border-[#403a34] pl-6 py-2">
                        <p className="text-[15px] leading-relaxed text-[#333333]">
                          {stage.details}
                        </p>
                        <div className="mt-4 space-y-2 border-t border-[#403a34]/15 pt-3">
                          {stage.highlights.map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-2.5 text-[13px] text-[#555555]"
                            >
                              <span className="size-1 rounded-full bg-[#403a34]" />
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
      </Container>
    </section>
  );
}

function ServicesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const services = [
    {
      number: "01",
      title: "Visualización 3D & Realidad Aumentada",
      summary: "Recorre y experimenta el proyecto antes de la primera piedra.",
      details:
        "Creamos modelos arquitectónicos tridimensionales con fidelidad espacial absoluta, iluminación fotorrealista de día y noche, recorridos 360° y visualización en Realidad Aumentada para proyectar cada volumen en su entorno real.",
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
      className="home-services bg-[#f6f1eb] px-6 py-24 text-[#403a34] md:px-12 xl:px-20 border-t border-[#403a34]/15"
    >
      <Container>
        <div className="border-b border-[#403a34]/15 pb-8">
          <div className="mb-4 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#403a34]">
            <span className="size-1 rounded-full bg-[#403a34]" />
            <span>Capacidades & Disciplinas</span>
          </div>
          <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
            La Experiencia AUTEM
          </h2>
        </div>

        <div className="divide-y divide-[#403a34]/15 border-b border-[#403a34]/15">
          {services.map((service, index) => {
            const isOpen = openIndex === index;
            return (
              <article key={service.title} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="group flex w-full items-center justify-between py-8 text-left transition-all hover:bg-[#403a34]/[0.03]"
                  aria-expanded={isOpen}
                >
                  <div className="flex min-w-0 items-center gap-5 sm:gap-8">
                    <span className="shrink-0 text-[12px] font-medium tracking-[0.1em] text-[#403a34]">
                      {service.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[22px] sm:text-[28px] font-medium tracking-[-0.02em] text-[#403a34]">
                        {service.title}
                      </h3>
                      <p className="mt-1 text-[14px] text-[#555555]">{service.summary}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-4">
                    <span className="hidden rounded-full border border-[#403a34] px-3.5 py-1 text-[9px] font-medium uppercase tracking-[0.083em] text-[#403a34] sm:inline-block">
                      {service.tag}
                    </span>
                    <span
                      className={`flex size-9 items-center justify-center rounded-full border border-[#403a34]/20 text-[#403a34] transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 border-[#403a34] bg-[#403a34] text-[#f6f1eb]"
                          : "group-hover:border-[#403a34]"
                      }`}
                    >
                      <ChevronDown size={15} />
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="animate-fade-up pb-8 pt-2 pl-8 sm:pl-12">
                    <div className="border-l-2 border-[#403a34] pl-6 py-2">
                      <p className="max-w-3xl text-[15px] sm:text-[16px] leading-relaxed text-[#333333]">
                        {service.details}
                      </p>
                      <div className="mt-6 grid gap-3 border-t border-[#403a34]/15 pt-5 sm:grid-cols-2">
                        {service.highlights.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2.5 text-[13px] text-[#555555]"
                          >
                            <span className="size-1 rounded-full bg-[#403a34]" />
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
      </Container>
    </section>
  );
}

function EditorialContact() {
  const whatsappUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola AUTEM, me interesa recibir asesoría para mi proyecto.")}`;

  const directory = [
    {
      number: "01",
      title: "Asesoría Personalizada",
      desc: "Atención directa con nuestro equipo técnico y arquitectónico para evaluar tu visión.",
    },
    {
      number: "02",
      title: "Coordenadas Territoriales",
      desc: "Cartagena de Indias & Turbaco · Bolívar, Colombia.",
    },
    {
      number: "03",
      title: "Exploración 3D & Masterplan",
      desc: "Acceso guiado a planimetría, análisis bioclimático y recorridos espaciales.",
    },
  ];

  return (
    <section
      data-scroll-scene
      id="contacto"
      className="home-contact bg-[#f6f1eb] px-6 py-24 text-[#403a34] md:px-12 md:py-32 xl:px-20 border-t border-[#403a34]/15 relative overflow-hidden"
    >
      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start pb-16 border-b border-[#403a34]/15">
          {/* Left Column: Heading & Conversion CTA */}
          <div className="lg:col-span-6">
            <div className="mb-4 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#403a34]">
              <span className="size-1 rounded-full bg-[#403a34]" />
              <span>Contacto & Atelier</span>
            </div>
            <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.08] tracking-[-0.056em] text-[#403a34] uppercase">
              Hablemos de tu próximo lugar.
            </h2>
            <p className="mt-6 max-w-lg text-[18px] leading-[1.5] text-[#333333]">
              Evaluamos tu terreno, respondemos inquietudes técnicas sobre el masterplan y
              estructuramos una propuesta arquitectónica de valor perdurable.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
                className="group relative inline-flex items-center gap-2.5 rounded-full border border-emerald-400/45 bg-[#0e1612] px-5 py-3 text-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.22)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-950 hover:text-emerald-300 active:scale-95"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current transition-transform group-hover:rotate-12"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.88 5.83L2 22l4.3-1.83A9.95 9.95 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.85 0-3.57-.52-5.04-1.42l-.36-.22-2.55 1.09 1.09-2.55-.22-.36A7.95 7.95 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.55-5.95c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31s-.88.86-.88 2.1c0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29z" />
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  Asesor WhatsApp
                </span>
              </a>

              <a
                href={`${import.meta.env.BASE_URL}nosotros`}
                className="inline-flex items-center gap-2 rounded-full border border-[#403a34] bg-transparent px-6 py-3 text-[11px] font-medium uppercase tracking-[0.083em] text-[#403a34] transition-all hover:bg-[#403a34] hover:text-[#f6f1eb]"
              >
                Conoce el Estudio <ArrowUpRight size={15} />
              </a>
            </div>
          </div>

          {/* Right Column: Atelier Directory Rows */}
          <div className="lg:col-span-6 divide-y divide-[#403a34]/15 border-y border-[#403a34]/15">
            {directory.map((item) => (
              <div key={item.number} className="py-6 flex items-start gap-6">
                <span className="text-[12px] font-medium tracking-[0.1em] text-[#403a34] shrink-0 pt-0.5">
                  {item.number}
                </span>
                <div>
                  <h3 className="text-[18px] font-medium text-[#403a34] tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#555555]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Editorial Grounding Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-[0.1em] text-[#555555]">
          <span>Estudio AUTEM · Arquitectura, Paisaje & Territorio</span>
          <span className="text-[24px] font-normal tracking-[-0.04em] text-[#403a34]/40 font-serif">
            AUTEM
          </span>
          <span>Cartagena & Turbaco · 2026</span>
        </div>
      </Container>
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
