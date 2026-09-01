import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Check, Mouse, MoveRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { useScrollFrame } from "@/hooks/useScrollFrame";

const pillars = [
  {
    number: "01",
    title: "Misión",
    kicker: "Lo que hacemos hoy",
    text: "Transformamos ideas, necesidades y oportunidades en proyectos integrales que generan valor. Integramos arquitectura, urbanismo, diseño, construcción, consultoría y tecnología con un acompañamiento cercano durante todo el proceso.",
  },
  {
    number: "02",
    title: "Visión",
    kicker: "Hacia dónde avanzamos",
    text: "Buscamos consolidarnos como una firma integral de referencia, reconocida por la calidad de sus soluciones, la innovación y la capacidad de acompañar cada proyecto desde su concepción hasta su materialización.",
  },
  {
    number: "03",
    title: "Propósito",
    kicker: "Por qué existimos",
    text: "Crear proyectos que tengan sentido. Un buen proyecto no comienza con un plano, sino con la comprensión profunda de una necesidad, una oportunidad y un contexto territorial.",
  },
];

const valuePromises = [
  {
    number: "01",
    title: "Acompañamiento Estratégico",
    description:
      "Cercanía personalizada y asesoría continua desde la primera idea hasta la formalización jurídica y entrega técnica.",
    tag: "Personalizado",
  },
  {
    number: "02",
    title: "Diseño & Viabilidad Conectados",
    description:
      "Cada propuesta arquitectónica se proyecta con rigor técnico, optimización de presupuesto y viabilidad constructiva real.",
    tag: "Rigor técnico",
  },
  {
    number: "03",
    title: "Lectura Integral del Terreno",
    description:
      "Aprovechamiento bioclimático y topográfico del lote para maximizar ventilación, visuales naturales y plusvalía.",
    tag: "Territorio",
  },
  {
    number: "04",
    title: "Tecnología & Claridad 3D",
    description:
      "Modelado inmersivo y comunicación transparente en cada fase para tomar decisiones con certeza antes de construir.",
    tag: "Inmersión 3D",
  },
];

const categoryDisciplines = [
  {
    number: "01",
    title: "Arquitectura & Interiores",
    meta: "Espacio / Uso / Identidad",
    image: `${import.meta.env.BASE_URL}images/provencal-architecture-stone.jpg`,
    text: "Diseño arquitectónico para residencias campestres, equipamientos, interiores y remodelaciones de alto nivel.",
  },
  {
    number: "02",
    title: "Urbanismo & Loteos",
    meta: "Territorio / Comunidad / Paisaje",
    image: `${import.meta.env.BASE_URL}projects/eco-refugio-turbaco/fachada.jpg`,
    text: "Parcelaciones, condominios campestres, vías de acceso, espacios públicos y paisajismo sostenible.",
  },
  {
    number: "03",
    title: "Topografía & SIG",
    meta: "Datos / Relieve / Precisión",
    image: `${import.meta.env.BASE_URL}images/provencal-oak-detail.jpg`,
    text: "Modelos digitales del terreno, curvas de nivel, cartografía satelital y análisis de capas territoriales.",
  },
  {
    number: "04",
    title: "Desarrollo & Modelo 3D",
    meta: "Concepto / Viabilidad / Proyecto",
    image: `${import.meta.env.BASE_URL}projects/casa-campestre/fachada.jpg`,
    text: "Un proceso integral: estudio de viabilidad, arquitectura, presupuestos rigurosos y supervisión técnica.",
  },
];

const method = [
  { step: "Entender", text: "Escuchamos la necesidad, las expectativas y definimos el reto real del cliente." },
  { step: "Analizar", text: "Leemos normativa, clima, pendientes, topografía y oportunidades del entorno." },
  { step: "Conceptualizar", text: "Construimos una idea rectora arquitectónica clara, medible y funcional." },
  { step: "Diseñar", text: "Coordinamos espacio, materialidad, técnica, estética y presupuesto constructivo." },
  { step: "Visualizar", text: "Hacemos visible el proyecto en 3D e inmersión antes de poner la primera piedra." },
  { step: "Materializar", text: "Acompañamos decisiones, contratación, supervisión y entrega de máxima calidad." },
];

const values = [
  "Compromiso",
  "Cercanía",
  "Integridad",
  "Creatividad",
  "Excelencia",
  "Innovación",
  "Visión integral",
  "Responsabilidad territorial",
];

const stats = [
  { number: "12+", label: "Proyectos Integrales" },
  { number: "40+", label: "Hectáreas Planificadas" },
  { number: "8+", label: "Años de Visión" },
  { number: "3", label: "Ciudades Caribe" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#403a34]">
      <span className="size-1 rounded-full bg-[#403a34]" />
      <span>{children}</span>
    </div>
  );
}

function HairlineDivider() {
  return <div className="h-px w-full bg-[#403a34]/15" />;
}

export function NosotrosPage() {
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-oakame-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      targets.forEach((target) => target.classList.add("opacity-100"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in", "fade-in", "duration-700");
            entry.target.style.opacity = "1";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  const whatsappUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola AUTEM, me gustaría conversar sobre un proyecto.")}`;
  const heroScene = `${import.meta.env.BASE_URL}images/autem-hero-approved-scene-v2.png`;

  useScrollFrame(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const bounds = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(window.innerHeight * 0.55, 1)));
    hero.style.setProperty("--about-hero-scroll", progress.toFixed(4));
  });

  return (
    <div className="oakame-canvas min-h-screen bg-[#f6f1eb] text-[#403a34] font-sans antialiased selection:bg-[#403a34] selection:text-[#f6f1eb]">
      {/* =========================================================================
          HERO SECTION — Sunlit Provençal Atelier & Monumental Typography
          ========================================================================= */}
      <section
        ref={heroRef}
        id="top"
        className="about-image-hero relative min-h-[100svh] md:h-[100svh] w-full overflow-hidden bg-[#f6f1eb] text-[#403a34]"
      >
        {/* Background Architectural Canvas Layer */}
        <img
          src={heroScene}
          alt="Jaime Buelvas, fundador de AUTEM"
          fetchPriority="high"
          decoding="async"
          className="about-image-hero__scene pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Provençal Sunlight & Cadastral Overlay */}

        {/* Hero Bottom Bar: Centered Scroll Cue (Layer z-30) */}
        <div className="absolute inset-x-0 bottom-6 z-30 mx-auto flex items-center justify-center">
          <a
            href="#filosofia"
            className="inline-flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.24em] text-[#555555] hover:text-[#403a34] transition-colors"
          >
            <span className="h-5 w-px bg-[#403a34]/40" />
            <Mouse size={16} className="text-[#403a34]" />
            <span>Desliza para descubrir</span>
          </a>
        </div>
      </section>

      {/* Discrete Stats Bar */}
      <div className="border-y border-[#403a34]/15 bg-[#f6f1eb]">
        <div className="mx-auto max-w-[1440px] px-6 py-8 sm:px-10 lg:px-14 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, idx) => (
            <div key={stat.label} className="flex flex-col border-l border-[#403a34]/15 pl-4 sm:pl-6 first:border-l-0">
              <span className="text-[36px] sm:text-[44px] font-normal leading-none tracking-[-0.05em] text-[#403a34]">
                {stat.number}
              </span>
              <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 01: NUESTRA FILOSOFÍA — Asymmetric Image-Text Split
          ========================================================================= */}
      <section id="filosofia" className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto">
        <div data-oakame-reveal className="opacity-0 transition-opacity duration-700">
          <Eyebrow>Nuestra Filosofía</Eyebrow>

          {/* Monumental Section Display Heading */}
          <h2 className="text-[clamp(2.5rem,5vw,60px)] font-medium leading-[1.15] tracking-[-0.056em] text-[#403a34] max-w-5xl uppercase">
            No diseñamos únicamente espacios. Proyectamos identidad, valor y territorio.
          </h2>

          {/* Asymmetric 2-Column Split */}
          <div className="mt-16 sm:mt-20 grid lg:grid-cols-12 gap-10 lg:gap-16 items-start border-t border-[#403a34]/15 pt-12">
            <div className="lg:col-span-4">
              <p className="text-[18px] sm:text-[20px] font-medium leading-relaxed tracking-[-0.01em] text-[#403a34] lg:text-right">
                VISIÓN INTEGRAL & RIGOR TERRITORIAL
              </p>
              <p className="mt-2 text-[12px] uppercase tracking-[0.083em] text-[#555555] lg:text-right">
                Cartagena · Turbaco · Santa Marta
              </p>
            </div>

            <div className="lg:col-span-8 space-y-6 text-[18px] sm:text-[20px] leading-[1.5] text-[#333333] max-w-[56ch]">
              <p>
                Acompañamos proyectos de arquitectura, urbanismo, diseño, construcción, consultoría
                y planificación territorial desde la primera pregunta hasta su materialización.
              </p>
              <p>
                Combinamos criterio creativo, conocimiento técnico y herramientas digitales para
                convertir necesidades y terrenos en soluciones funcionales, atractivas, viables y
                valiosas que trascienden el tiempo.
              </p>
              <div className="pt-4">
                <a
                  href="#metodo"
                  className="oakame-pill-btn"
                >
                  Conocer Nuestro Método
                </a>
              </div>
            </div>
          </div>

          {/* Monolithic Warm Stone & Reclaimed Wood Architectural Photo Spread */}
          <div className="mt-16 sm:mt-20 border border-[#403a34] bg-[#f6f1eb]">
            <img
              src={`${import.meta.env.BASE_URL}images/provencal-architecture-stone.jpg`}
              alt="Arquitectura AUTEM en piedra cálida y madera noble"
              className="w-full h-[380px] sm:h-[540px] lg:h-[640px] object-cover object-center"
              loading="lazy"
            />
            <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#403a34]/15 text-[10px] uppercase tracking-[0.1em] text-[#555555]">
              <span>Atelier de Arquitectura · Piedra Caliza, Roble Recuperado y Luz Natural</span>
              <span>AUTEM 2026</span>
            </div>
          </div>
        </div>
      </section>

      <HairlineDivider />

      {/* =========================================================================
          SECTION 02: NUESTRA DIRECCIÓN — 3-Pillar Architectural Grid
          ========================================================================= */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto">
        <div data-oakame-reveal className="opacity-0 transition-opacity duration-700">
          <Eyebrow>Nuestra Dirección</Eyebrow>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-[#403a34]/15">
            <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
              Un norte compartido.
            </h2>
            <p className="max-w-md text-[18px] leading-[1.5] text-[#333333]">
              Tres principios arquitectónicos y estratégicos alinean lo que hacemos, hacia dónde vamos y el impacto que dejamos en cada lote.
            </p>
          </div>

          {/* 3 Pillars Grid with 1px Walnut Ink borders */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="border border-[#403a34] bg-[#f6f1eb] p-8 sm:p-10 flex flex-col justify-between min-h-[340px] transition hover:bg-[#efe8df]"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#403a34]/15 pb-4">
                    <span className="text-[12px] font-medium tracking-[0.1em] text-[#403a34]">
                      {pillar.number}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555]">
                      {pillar.kicker}
                    </span>
                  </div>
                  <h3 className="mt-6 text-[32px] sm:text-[40px] font-medium leading-none tracking-[-0.04em] text-[#403a34]">
                    {pillar.title}
                  </h3>
                </div>
                <p className="mt-8 text-[18px] leading-[1.5] text-[#333333]">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HairlineDivider />

      {/* =========================================================================
          SECTION 03: PRODUCT & CATEGORY GRID — Nos Catégories Style
          ========================================================================= */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto">
        <div data-oakame-reveal className="opacity-0 transition-opacity duration-700">
          <Eyebrow>Disciplinas & Capacidades</Eyebrow>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-[#403a34]/15">
            <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
              Servicios conectados en un sistema.
            </h2>
            <p className="max-w-md text-[18px] leading-[1.5] text-[#333333]">
              No son piezas aisladas: estructuran un método riguroso para estudiar, proyectar, comunicar y materializar con precisión.
            </p>
          </div>

          {/* 4-Column Category Grid with 1px Walnut Ink borders, 0px radius */}
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categoryDisciplines.map((cat) => (
              <div
                key={cat.title}
                className="group border border-[#403a34] bg-[#f6f1eb] overflow-hidden flex flex-col justify-between transition hover:border-[#403a34]"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#e8e0d5]">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-[#f6f1eb] px-2.5 py-1 text-[9px] font-medium tracking-[0.1em] uppercase text-[#403a34] border border-[#403a34]/30">
                    {cat.number}
                  </div>
                </div>

                <div className="p-6 border-t border-[#403a34]">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#555555]">
                    {cat.meta}
                  </p>
                  <h3 className="mt-2 text-[20px] font-medium leading-snug tracking-[-0.02em] text-[#403a34]">
                    {cat.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#555555]">
                    {cat.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HairlineDivider />

      {/* =========================================================================
          SECTION 04: PROMESA DE VALOR — Rigor & Detalle
          ========================================================================= */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto">
        <div data-oakame-reveal className="opacity-0 transition-opacity duration-700 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <Eyebrow>Promesa de Valor</Eyebrow>
            <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
              De la primera idea al último detalle.
            </h2>
            <p className="mt-6 text-[18px] leading-[1.5] text-[#333333]">
              No fragmentamos el proyecto. Conectamos cada decisión técnica, estética y financiera
              para que el resultado conserve intención, viabilidad y calidad insuperable.
            </p>
            <div className="mt-8">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="oakame-filled-btn"
              >
                Conversar con un Asesor
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            {valuePromises.map((item) => (
              <div
                key={item.title}
                className="border border-[#403a34] bg-[#f6f1eb] p-7 flex flex-col justify-between min-h-[260px] transition hover:bg-[#efe8df]"
              >
                <div className="flex items-center justify-between border-b border-[#403a34]/15 pb-3">
                  <span className="text-[12px] font-medium tracking-[0.1em] text-[#403a34]">
                    {item.number}
                  </span>
                  <span className="rounded-full border border-[#403a34] px-3 py-0.5 text-[9px] font-medium uppercase tracking-[0.083em] text-[#403a34]">
                    {item.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-[20px] font-medium tracking-[-0.02em] text-[#403a34]">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[#555555]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HairlineDivider />

      {/* =========================================================================
          SECTION 05: MÉTODO AUTEM — 6-Stage Process Grid
          ========================================================================= */}
      <section id="metodo" className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto">
        <div data-oakame-reveal className="opacity-0 transition-opacity duration-700">
          <Eyebrow>Método AUTEM</Eyebrow>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-[#403a34]/15">
            <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
              Claridad en cada etapa.
            </h2>
            <p className="max-w-md text-[18px] leading-[1.5] text-[#333333]">
              Un proceso visible y metódico reduce la incertidumbre y mantiene todas las decisiones alineadas con el presupuesto.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {method.map((item, idx) => (
              <div
                key={item.step}
                className="group border border-[#403a34] bg-[#f6f1eb] p-8 flex flex-col justify-between min-h-[220px] transition hover:bg-[#403a34] hover:text-[#f6f1eb]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-[0.1em] text-[#403a34] group-hover:text-[#f6f1eb]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <MoveRight
                    size={16}
                    className="text-[#403a34]/40 group-hover:text-[#f6f1eb] group-hover:translate-x-1 transition-transform"
                  />
                </div>
                <div>
                  <h3 className="text-[26px] sm:text-[32px] font-medium leading-tight tracking-[-0.03em] text-[#403a34] group-hover:text-[#f6f1eb]">
                    {item.step}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#555555] group-hover:text-[#f6f1eb]/80">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HairlineDivider />

      {/* =========================================================================
          SECTION 06: CULTURA & DIFERENCIALES
          ========================================================================= */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto">
        <div data-oakame-reveal className="opacity-0 transition-opacity duration-700">
          <Eyebrow>Cultura & Principios</Eyebrow>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
                Valores que se ven en la obra.
              </h2>
              <p className="mt-6 text-[18px] leading-[1.5] text-[#333333]">
                La cultura no vive en un documento. Se refleja en la forma de escuchar al propietario, coordinar especialistas y responder con honestidad técnica.
              </p>

              <div className="mt-10 border-t border-[#403a34]/15 pt-8">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#555555] mb-4">
                  Preguntas clave que resolvemos
                </p>
                <div className="space-y-3">
                  {[
                    "¿Qué potencial real tiene mi terreno?",
                    "¿Cómo hacerlo viable financiera y legalmente?",
                    "¿Cómo diseñar para maximizar la plusvalía natural?",
                  ].map((q) => (
                    <div
                      key={q}
                      className="flex items-center justify-between border-b border-[#403a34]/15 pb-3 text-[15px] font-medium text-[#403a34]"
                    >
                      <span>{q}</span>
                      <ArrowUpRight size={16} className="text-[#403a34]/60" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {values.map((val, idx) => (
                <div
                  key={val}
                  className="border border-[#403a34] bg-[#f6f1eb] p-6 flex flex-col justify-between min-h-[140px] transition hover:bg-[#efe8df]"
                >
                  <span className="text-[10px] font-medium tracking-[0.1em] text-[#555555]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[20px] font-medium tracking-[-0.02em] text-[#403a34]">
                    {val}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HairlineDivider />

      {/* =========================================================================
          SECTION 07: CITAS & FUNDADOR — Provençal Editorial Portrait
          ========================================================================= */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto">
        <div data-oakame-reveal className="opacity-0 transition-opacity duration-700 border border-[#403a34] p-8 sm:p-14 lg:p-20 bg-[#f6f1eb]">
          <div className="flex items-center justify-between border-b border-[#403a34]/15 pb-6">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#403a34]">
              La persona detrás de AUTEM
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#555555]">
              Cartagena de Indias · Colombia
            </span>
          </div>

          <div className="mt-10 sm:mt-14">
            <blockquote className="text-[clamp(2.2rem,4.5vw,56px)] font-serif italic leading-[1.1] tracking-[-0.04em] text-[#403a34]">
              “Transformamos ideas en proyectos con valor perdurable, conectando la esencia del territorio con la precisión de la arquitectura.”
            </blockquote>

            <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-[#403a34]/15 pt-8">
              <div>
                <p className="text-[18px] font-medium text-[#403a34]">Jaime Buelvas</p>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#555555] mt-0.5">
                  Fundador y Director de AUTEM
                </p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="oakame-pill-btn self-start sm:self-auto"
              >
                Conversar con Jaime
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 08: CONVERSION CTA — El Siguiente Paso
          ========================================================================= */}
      <section id="contacto-nosotros" className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 bg-[#403a34] text-[#f6f1eb]">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <div className="flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#f6f1eb]/70 mb-4">
              <span className="size-1 rounded-full bg-[#f6f1eb]" />
              <span>El Siguiente Paso</span>
            </div>
            <h2 className="text-[clamp(2.5rem,5.5vw,64px)] font-normal leading-[1.05] tracking-[-0.05em] text-[#f6f1eb] max-w-4xl uppercase">
              Conversemos sobre el potencial de tu proyecto.
            </h2>
            <p className="mt-6 text-[18px] sm:text-[20px] leading-relaxed text-[#f6f1eb]/80 max-w-2xl font-light">
              Estamos listos para evaluar tu terreno, conceptualizar tu visión y estructurar un plan integral de desarrollo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f6f1eb] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#403a34] transition hover:bg-white"
            >
              Hablemos por WhatsApp
              <ArrowUpRight size={16} />
            </a>
            <a
              href={`${import.meta.env.BASE_URL}#proyectos`}
              className="inline-flex items-center justify-center rounded-full border border-[#f6f1eb]/40 px-8 py-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#f6f1eb] transition hover:border-[#f6f1eb] hover:bg-[#f6f1eb]/10"
            >
              Ver Proyectos
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default NosotrosPage;
