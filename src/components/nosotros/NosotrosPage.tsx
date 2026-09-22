import { ArrowUpRight, MoveRight } from "lucide-react";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import "@/components/home/editorial.css";

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
    image: `${import.meta.env.BASE_URL}images/autem-villa-paraiso-aerial-v2.png`,
    text: "Parcelaciones, condominios campestres, vías de acceso, espacios públicos y paisajismo sostenible.",
  },
  {
    number: "03",
    title: "Topografía & SIG",
    meta: "Datos / Relieve / Precisión",
    image: `${import.meta.env.BASE_URL}images/autem-proceso-territorio.png`,
    text: "Modelos digitales del terreno, curvas de nivel, cartografía satelital y análisis de capas territoriales.",
  },
  {
    number: "04",
    title: "Desarrollo & Modelo 3D",
    meta: "Concepto / Viabilidad / Proyecto",
    image: `${import.meta.env.BASE_URL}images/carousel-forest-pavilion.jpg`,
    text: "Un proceso integral: estudio de viabilidad, arquitectura, presupuestos rigurosos y supervisión técnica.",
  },
];

const method = [
  {
    step: "Entender",
    text: "Escuchamos la necesidad, las expectativas y definimos el reto real del cliente.",
  },
  {
    step: "Analizar",
    text: "Leemos normativa, clima, pendientes, topografía y oportunidades del entorno.",
  },
  {
    step: "Conceptualizar",
    text: "Construimos una idea rectora arquitectónica clara, medible y funcional.",
  },
  {
    step: "Diseñar",
    text: "Coordinamos espacio, materialidad, técnica, estética y presupuesto constructivo.",
  },
  {
    step: "Visualizar",
    text: "Hacemos visible el proyecto en 3D e inmersión antes de poner la primera piedra.",
  },
  {
    step: "Materializar",
    text: "Acompañamos decisiones, contratación, supervisión y entrega de máxima calidad.",
  },
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

const tickerItems = [
  "ARQUITECTURA CON PROPÓSITO",
  "RIGOR TERRITORIAL",
  "DISEÑO INTEGRADO AL PAISAJE",
  "ACOMPAÑAMIENTO PERSONALIZADO",
  "VISUALIZACIÓN INMERSIVA 3D",
];

export function NosotrosPage() {
  const whatsappUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola AUTEM, me gustaría conversar sobre un proyecto.")}`;
  const heroScene = `${import.meta.env.BASE_URL}images/autem-hero-approved-scene-v2.png`;

  return (
    <div className="bg-[#f0ebe6] text-[#4f4742] font-sans antialiased selection:bg-[#4f4742]/15 selection:text-[#4f4742]">
      {/* =========================================================================
          HERO SECTION — Same Editorial Framed Composition as Home
          ========================================================================= */}
      <section id="top" className="pt-[75px] pb-4 px-3 sm:px-4 md:px-6">
        <div className="hero-backdrop-entrance relative w-full h-[calc(100svh-95px)] min-h-[580px] max-h-[860px] rounded-[12px] overflow-hidden bg-[#4f4742] shadow-sm">
          {/* Main Hero Image */}
          <img
            src={heroScene}
            alt="Jaime Buelvas, director y fundador de AUTEM"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Ambient Contrast Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/15" />

          {/* Hero Content Overlay */}
          <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12 text-white">
            <div className="grid items-end gap-6 border-b border-white/70 pb-6 md:grid-cols-12 md:gap-10 md:pb-8">
              <h1 className="about-hero-reveal text-[clamp(36px,4.5vw,78px)] font-normal leading-[1.06] tracking-[-0.05em] uppercase md:col-span-7">
                Arquitectura, visión y territorio.
              </h1>

              <div className="about-hero-reveal about-hero-reveal-delay max-w-[30rem] md:col-span-5 md:justify-self-end">
                <p className="text-[14px] sm:text-[15px] leading-[1.45] tracking-[-0.02em] text-white/95">
                  Diseñamos proyectos inmobiliarios y arquitectónicos que conectan el paisaje, la
                  inversión y la forma de habitar con rigor técnico y criterio atemporal.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="#filosofia"
                    className="about-hero-reveal about-hero-reveal-delay-2 inline-flex items-center gap-2 rounded-full bg-[#f0ebe6] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[#4f4742] transition hover:bg-white"
                  >
                    Nuestra Filosofía <ArrowUpRight size={14} />
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-hero-reveal about-hero-reveal-delay-2 inline-flex items-center gap-2 rounded-full bg-[#4f4742]/85 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white backdrop-blur-sm transition hover:bg-[#4f4742]"
                  >
                    Agendar consulta <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Running Ticker Banner */}
      <div className="w-full border-y border-[#4f4742]/15 bg-[#f0ebe6] py-5 overflow-hidden select-none">
        <div className="animate-framer-ticker flex items-center whitespace-nowrap">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-10 mx-6 text-[12px] sm:text-[13px] font-medium tracking-[0.14em] uppercase text-[#4f4742]"
            >
              <span>{item}</span>
              <span className="text-[10px] text-[#4f4742]/60">°</span>
            </div>
          ))}
        </div>
      </div>

      {/* Discrete Stats Bar */}
      <div className="border-b border-[#4f4742]/15 bg-[#f0ebe6]">
        <div className="mx-auto w-[93%] max-w-[1360px] py-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col border-l border-[#4f4742]/15 pl-4 sm:pl-6 first:border-l-0"
            >
              <span className="text-[36px] sm:text-[44px] font-normal leading-none tracking-[-0.05em] text-[#4f4742]">
                {stat.number}
              </span>
              <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#57504b]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 01: NUESTRA FILOSOFÍA
          ========================================================================= */}
      <section id="filosofia" className="py-20 md:py-28">
        <div className="w-[93%] max-w-[1360px] mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-[#57504b] block mb-3">
              NUESTRA FILOSOFÍA
            </span>
            <h2 className="text-[clamp(26px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans max-w-4xl mx-auto">
              NO DISEÑAMOS ÚNICAMENTE ESPACIOS. PROYECTAMOS IDENTIDAD, VALOR Y TERRITORIO.
            </h2>
            <p className="mt-4 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-2xl mx-auto font-normal">
              Acompañamos proyectos de arquitectura, urbanismo y diseño desde la primera pregunta
              hasta su materialización.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4f4742]">
                VISIÓN INTEGRAL & RIGOR TERRITORIAL
              </span>
              <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-[#57504b]">
                Cartagena · Turbaco · Santa Marta
              </p>
              <p className="mt-6 text-[15px] sm:text-[16px] leading-[1.65] text-[#57504b]">
                Acompañamos proyectos de arquitectura, urbanismo, diseño, construcción, consultoría
                y planificación territorial desde la primera pregunta hasta su materialización.
              </p>
              <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.65] text-[#57504b]">
                Combinamos criterio creativo, conocimiento técnico y herramientas digitales para
                convertir necesidades y terrenos en soluciones funcionales, atractivas, viables y
                valiosas que trascienden el tiempo.
              </p>
              <div className="mt-8">
                <a
                  href="#metodo"
                  className="inline-flex items-center gap-2 rounded-full bg-[#4f4742] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#f0ebe6] transition hover:bg-black"
                >
                  Conocer Nuestro Método <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[8px] overflow-hidden shadow-sm border border-[#4f4742]/15 bg-[#ded5c9]/30">
                <img
                  src={`${import.meta.env.BASE_URL}images/provencal-architecture-stone.jpg`}
                  alt="Arquitectura AUTEM en piedra cálida y madera noble"
                  className="w-full h-[360px] sm:h-[460px] object-cover object-center"
                  loading="lazy"
                />
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#4f4742]/15 text-[10px] uppercase tracking-[0.1em] text-[#57504b]">
                  <span>Atelier de Arquitectura · Piedra Caliza, Roble y Luz Natural</span>
                  <span>AUTEM 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 02: NUESTRA DIRECCIÓN — 3 Pillars
          ========================================================================= */}
      <section className="py-20 md:py-28 border-t border-[#4f4742]/15">
        <div className="w-[93%] max-w-[1360px] mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-[#57504b] block mb-3">
              NUESTRA DIRECCIÓN
            </span>
            <h2 className="text-[clamp(26px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
              UN NORTE COMPARTIDO
            </h2>
            <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-lg mx-auto font-normal">
              TRES PRINCIPIOS QUE ALINEAN LO QUE HACEMOS, HACIA DÓNDE VAMOS Y EL IMPACTO QUE
              DEJAMOS.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-[8px] border border-[#4f4742]/15 bg-[#ded5c9]/30 hover:bg-[#ded5c9]/60 p-8 sm:p-10 flex flex-col justify-between min-h-[320px] transition-all duration-300 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#4f4742]/15 pb-4">
                    <span className="text-[12px] font-semibold tracking-[0.1em] text-[#4f4742]">
                      {pillar.number}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#57504b]">
                      {pillar.kicker}
                    </span>
                  </div>
                  <h3 className="mt-6 text-[26px] sm:text-[30px] font-medium leading-none tracking-[-0.03em] uppercase text-[#4f4742]">
                    {pillar.title}
                  </h3>
                </div>
                <p className="mt-8 text-[14px] sm:text-[15px] leading-relaxed text-[#57504b]">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 03: DISCIPLINAS & CAPACIDADES
          ========================================================================= */}
      <section className="py-20 md:py-28 border-t border-[#4f4742]/15">
        <div className="w-[93%] max-w-[1360px] mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-[#57504b] block mb-3">
              DISCIPLINAS & CAPACIDADES
            </span>
            <h2 className="text-[clamp(26px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
              SERVICIOS CONECTADOS EN UN SISTEMA
            </h2>
            <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-lg mx-auto font-normal">
              UN MÉTODO RIGUROSO PARA ESTUDIAR, PROYECTAR, COMUNICAR Y MATERIALIZAR CON PRECISIÓN.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryDisciplines.map((cat) => (
              <div
                key={cat.title}
                className="rounded-[8px] border border-[#4f4742]/15 bg-[#f0ebe6] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#4f4742]/40 shadow-sm group"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e8e0d5]">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-[#f0ebe6]/90 backdrop-blur-sm px-2.5 py-1 text-[9px] font-semibold tracking-[0.1em] uppercase text-[#4f4742] border border-[#4f4742]/20">
                    {cat.number}
                  </div>
                </div>

                <div className="p-6 border-t border-[#4f4742]/15 flex flex-col justify-between flex-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#57504b]">
                      {cat.meta}
                    </p>
                    <h3 className="mt-2 text-[18px] sm:text-[20px] font-medium leading-snug tracking-[-0.02em] uppercase text-[#4f4742]">
                      {cat.title}
                    </h3>
                    <p className="mt-3 text-[13px] sm:text-[14px] leading-relaxed text-[#57504b]">
                      {cat.text}
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="framer-circular-btn !w-10 !h-10 shrink-0">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 04: PROMESA DE VALOR
          ========================================================================= */}
      <section className="py-20 md:py-28 border-t border-[#4f4742]/15">
        <div className="w-[93%] max-w-[1360px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-[#57504b] block mb-3">
              PROMESA DE VALOR
            </span>
            <h2 className="text-[clamp(26px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
              DE LA PRIMERA IDEA AL ÚLTIMO DETALLE
            </h2>
            <p className="mt-6 text-[15px] sm:text-[16px] leading-[1.65] text-[#57504b]">
              No fragmentamos el proyecto. Conectamos cada decisión técnica, estética y financiera
              para que el resultado conserve intención, viabilidad y calidad insuperable.
            </p>
            <div className="mt-8">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#4f4742] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#f0ebe6] transition hover:bg-black"
              >
                Conversar con un Asesor <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            {valuePromises.map((item) => (
              <div
                key={item.title}
                className="rounded-[8px] border border-[#4f4742]/15 bg-[#ded5c9]/30 hover:bg-[#ded5c9]/60 p-7 flex flex-col justify-between min-h-[230px] transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-[#4f4742]/15 pb-3">
                  <span className="text-[12px] font-semibold tracking-[0.1em] text-[#4f4742]">
                    {item.number}
                  </span>
                  <span className="rounded-full border border-[#4f4742]/30 px-3 py-0.5 text-[9px] font-medium uppercase tracking-[0.083em] text-[#4f4742]">
                    {item.tag}
                  </span>
                </div>
                <div>
                  <h3 className="mt-4 text-[18px] sm:text-[20px] font-medium tracking-[-0.02em] uppercase text-[#4f4742]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#57504b]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 05: MÉTODO AUTEM
          ========================================================================= */}
      <section id="metodo" className="py-20 md:py-28 border-t border-[#4f4742]/15">
        <div className="w-[93%] max-w-[1360px] mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-[#57504b] block mb-3">
              MÉTODO AUTEM
            </span>
            <h2 className="text-[clamp(26px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
              CLARIDAD EN CADA ETAPA
            </h2>
            <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-lg mx-auto font-normal">
              UN PROCESO VISIBLE Y METÓDICO QUE MANTIENE TODAS LAS DECISIONES ALINEADAS CON EL
              PRESUPUESTO.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {method.map((item, idx) => (
              <div
                key={item.step}
                className="rounded-[8px] border border-[#4f4742]/15 bg-[#ded5c9]/30 p-8 flex flex-col justify-between min-h-[210px] transition-all duration-300 hover:bg-[#4f4742] hover:text-[#f0ebe6] group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold tracking-[0.1em] text-[#4f4742] group-hover:text-[#f0ebe6]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <MoveRight
                    size={16}
                    className="text-[#4f4742]/50 group-hover:text-[#f0ebe6] group-hover:translate-x-1 transition-transform"
                  />
                </div>
                <div>
                  <h3 className="text-[22px] sm:text-[26px] font-medium leading-tight tracking-[-0.03em] uppercase text-[#4f4742] group-hover:text-[#f0ebe6]">
                    {item.step}
                  </h3>
                  <p className="mt-3 text-[13px] sm:text-[14px] leading-relaxed text-[#57504b] group-hover:text-[#f0ebe6]/80">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 06: CULTURA & PRINCIPIOS
          ========================================================================= */}
      <section className="py-20 md:py-28 border-t border-[#4f4742]/15">
        <div className="w-[93%] max-w-[1360px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-[#57504b] block mb-3">
              CULTURA & PRINCIPIOS
            </span>
            <h2 className="text-[clamp(26px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
              VALORES QUE SE VEN EN LA OBRA
            </h2>
            <p className="mt-6 text-[15px] sm:text-[16px] leading-[1.65] text-[#57504b]">
              La cultura no vive en un documento. Se refleja en la forma de escuchar al propietario,
              coordinar especialistas y responder con honestidad técnica.
            </p>

            <div className="mt-10 border-t border-[#4f4742]/15 pt-8">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#57504b] mb-4 font-semibold">
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
                    className="flex items-center justify-between border-b border-[#4f4742]/15 pb-3 text-[14px] font-medium text-[#4f4742]"
                  >
                    <span>{q}</span>
                    <ArrowUpRight size={15} className="text-[#4f4742]/60" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {values.map((val, idx) => (
              <div
                key={val}
                className="rounded-[8px] border border-[#4f4742]/15 bg-[#ded5c9]/30 p-6 flex flex-col justify-between min-h-[110px] transition hover:bg-[#ded5c9]/60 shadow-sm"
              >
                <span className="text-[10px] font-semibold tracking-[0.1em] text-[#57504b]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[17px] sm:text-[19px] font-medium tracking-[-0.02em] uppercase text-[#4f4742]">
                  {val}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 07: CITAS & FUNDADOR
          ========================================================================= */}
      <section className="py-20 md:py-28 border-t border-[#4f4742]/15">
        <div className="w-[93%] max-w-[1360px] mx-auto">
          <div className="rounded-[12px] bg-[#4f4742] text-[#f0ebe6] p-8 sm:p-12 lg:p-16 shadow-md">
            <div className="flex items-center justify-between border-b border-[#f0ebe6]/20 pb-6">
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#f0ebe6]/80 font-medium">
                La persona detrás de AUTEM
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#f0ebe6]/60">
                Cartagena de Indias · Colombia
              </span>
            </div>

            <div className="mt-8 sm:mt-10">
              <blockquote className="text-[clamp(20px,2.8vw,36px)] font-normal leading-[1.28] tracking-[-0.03em] text-[#f0ebe6] uppercase font-sans">
                “Transformamos ideas en proyectos con valor perdurable, conectando la esencia del
                territorio con la precisión de la arquitectura.”
              </blockquote>

              <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-[#f0ebe6]/20 pt-8">
                <div>
                  <p className="text-[18px] font-medium text-[#f0ebe6]">Jaime Buelvas</p>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#f0ebe6]/70 mt-0.5">
                    Fundador y Director de AUTEM
                  </p>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f0ebe6] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#4f4742] transition hover:bg-white self-start sm:self-auto"
                >
                  Conversar con Jaime <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 08: EL SIGUIENTE PASO (CTA)
          ========================================================================= */}
      <section
        id="contacto-nosotros"
        className="py-20 md:py-28 px-6 sm:px-10 lg:px-14 bg-[#403a34] text-[#f0ebe6]"
      >
        <div className="max-w-[1360px] w-[93%] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#f0ebe6]/70 block mb-3">
              EL SIGUIENTE PASO
            </span>
            <h2 className="text-[clamp(28px,3.5vw,48px)] font-medium leading-[1.1] tracking-[-1px] text-[#f0ebe6] max-w-3xl uppercase font-sans">
              Conversemos sobre el potencial de tu proyecto.
            </h2>
            <p className="mt-4 text-[14px] sm:text-[15px] leading-relaxed text-[#f0ebe6]/80 max-w-xl font-light">
              Estamos listos para evaluar tu terreno, conceptualizar tu visión y estructurar un plan
              integral de desarrollo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#f0ebe6] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#4f4742] transition hover:bg-white shadow-md"
            >
              Hablemos por WhatsApp
              <ArrowUpRight size={16} />
            </a>
            <a
              href={`${import.meta.env.BASE_URL}#proyectos`}
              className="inline-flex items-center justify-center rounded-full border border-[#f0ebe6]/40 px-8 py-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#f0ebe6] transition hover:border-[#f0ebe6] hover:bg-[#f0ebe6]/10"
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
