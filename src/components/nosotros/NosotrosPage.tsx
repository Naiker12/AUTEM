import { useEffect } from "react";
import { ArrowDown, ArrowUpRight, Check, Compass, Layers, MoveRight, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FounderBuildingScene from "./FounderBuildingScene";

const pillars = [
  {
    number: "01",
    icon: Compass,
    title: "Misión",
    kicker: "Lo que hacemos hoy",
    text: "Transformamos ideas, necesidades y oportunidades en proyectos integrales que generan valor. Integramos arquitectura, urbanismo, diseño, construcción, consultoría y tecnología con un acompañamiento cercano durante todo el proceso.",
  },
  {
    number: "02",
    icon: Layers,
    title: "Visión",
    kicker: "Hacia dónde avanzamos",
    text: "Buscamos consolidarnos como una firma integral de referencia, reconocida por la calidad de sus soluciones, la innovación y la capacidad de acompañar cada proyecto desde su concepción hasta su materialización.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Propósito",
    kicker: "Por qué existimos",
    text: "Crear proyectos que tengan sentido. Un buen proyecto no comienza con un plano, sino con la comprensión profunda de una necesidad, una oportunidad y un contexto.",
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

const objectives = [
  ["Crear valor", "Diseño que fortalece la inversión y el entorno."],
  ["Leer el territorio", "Cada decisión parte de lo que el lugar permite y necesita."],
  ["Optimizar recursos", "Más claridad, menos improvisación y mejor control."],
  ["Proyectar viabilidad", "Ideas sólidas técnica, económica y espacialmente."],
  ["Generar identidad", "Soluciones únicas, coherentes con cada contexto."],
  ["Anticipar problemas", "Analizamos antes de construir para reducir riesgos."],
];

const services = [
  {
    title: "Arquitectura",
    meta: "Espacio / uso / identidad",
    text: "Diseño arquitectónico para vivienda, edificios, equipamientos, interiores, remodelaciones y fachadas.",
  },
  {
    title: "Urbanismo",
    meta: "Territorio / comunidad / paisaje",
    text: "Parcelaciones, loteos, condominios, lotes campestres, vías, espacio público y paisajismo.",
  },
  {
    title: "Topografía y análisis",
    meta: "Datos / relieve / precisión",
    text: "Levantamientos, modelos digitales del terreno, curvas de nivel y análisis de movimientos de tierra.",
  },
  {
    title: "SIG y planeación territorial",
    meta: "Cartografía / capas / decisión",
    text: "Análisis espacial, cartografía digital, georreferenciación y mapas temáticos para entender el territorio.",
  },
  {
    title: "Desarrollo inmobiliario",
    meta: "Concepto / viabilidad / proyecto",
    text: "Un proceso completo: terreno, análisis, concepto, urbanismo, arquitectura, imagen, viabilidad y proyecto.",
  },
  {
    title: "Visualización y construcción",
    meta: "3D / presupuesto / control",
    text: "Modelado 3D, renders, recorridos virtuales, presupuestos, programación, supervisión y control de calidad.",
  },
];

const method = [
  ["Entender", "Escuchamos la necesidad y definimos el reto real."],
  ["Analizar", "Leemos contexto, normativa, terreno y oportunidades."],
  ["Conceptualizar", "Construimos una idea rectora clara y medible."],
  ["Diseñar", "Coordinamos espacio, técnica, estética y viabilidad."],
  ["Visualizar", "Hacemos visible el proyecto antes de construirlo."],
  ["Materializar", "Acompañamos decisiones, ejecución y calidad."],
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

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`mb-6 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] ${dark ? "text-[#e1bb6b]" : "text-accent"}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </div>
  );
}

export function NosotrosPage() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-about-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      targets.forEach((target) => target.classList.add("fade-in-up", "about-scene-active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("fade-in-up", "about-scene-active");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );
    targets.forEach((target) => observer.observe(target));

    let frame = 0;
    const updateScroll = () => {
      frame = 0;
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const progress = Math.min(
          1,
          Math.max(0, (window.innerHeight * 0.92 - rect.top) / (window.innerHeight * 0.76)),
        );
        target.style.setProperty("--about-scroll", progress.toFixed(3));
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScroll);
    };
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const whatsappUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola AUTEM, me gustaría conversar sobre un proyecto.")}`;
  const founderImage = `${import.meta.env.BASE_URL}images/jaime-buelvas-founder-presenting-cutout-v6.png`;

  return (
    <div className="about-page overflow-hidden bg-[#090a0b] text-white">
      <section className="about-hero relative min-h-[920px] overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_80%_40%,#171208_0%,#0c0b08_50%,#080808_100%)] px-5 pb-8 pt-24 text-white sm:px-8 lg:min-h-screen lg:pt-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(216,177,95,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(216,177,95,.15)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] size-[550px] rounded-full bg-[#b78b3b]/10 blur-[160px]" />

        <div className="relative mx-auto grid min-h-[calc(100svh-7.5rem)] max-w-[1560px] lg:grid-cols-12 lg:items-center">
          {/* Left Column: Founder + 3D Masterplan Maquette (38-42% visual weight) */}
          <div className="relative z-10 min-h-[520px] lg:col-span-5 lg:min-h-[calc(100svh-7.5rem)]">
            <div className="absolute bottom-[-1px] left-[-8%] z-10 h-[104%] w-[116%] sm:left-[-2%] sm:w-[94%] lg:left-[-4%] lg:h-full lg:w-[102%]">
              <img
                src={founderImage}
                alt="Jaime Buelvas, fundador de AUTEM, presentando el masterplan 3D sobre su mano"
                width="1080"
                height="1440"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-contain object-bottom drop-shadow-[0_30px_70px_rgba(0,0,0,.4)] filter grayscale contrast-105"
              />
            </div>
            <div className="absolute left-[-6%] top-[30%] z-20 h-[52%] w-[88%] sm:left-[2%] sm:w-[78%] lg:left-[-2%] lg:top-[34%] lg:h-[50%] lg:w-[84%]">
              <FounderBuildingScene />
            </div>
          </div>

          {/* Right Column: Statement, Identity & Discrete Metrics (58-62% visual weight) */}
          <div className="relative z-30 flex flex-col justify-between pb-8 pt-6 lg:col-span-7 lg:pl-10 lg:py-12">
            <div>
              <div className="about-hero-reveal flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.26em] text-[#e1bb6b]">
                <span className="size-1.5 rounded-full bg-[#e1bb6b] shadow-[0_0_8px_#e1bb6b]" />
                Estudio AUTEM
              </div>

              <div className="about-hero-reveal about-hero-reveal-delay mt-8 max-w-[760px]">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#e1bb6b]/75">
                  <span>01 / Arquitectura</span>
                  <span className="opacity-40">•</span>
                  <span>02 / Desarrollo</span>
                  <span className="opacity-40">•</span>
                  <span>03 / Tecnología</span>
                </div>

                <h1 className="text-[clamp(3.5rem,5.6vw,6.4rem)] font-normal leading-[0.92] tracking-[-0.045em]">
                  Convertimos visión
                  <span className="block font-serif italic text-[#e1bb6b]">en territorio.</span>
                </h1>

                <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/70 font-light">
                  Arquitectura, estrategia y tecnología trabajando como un solo sistema para
                  transformar lugares en proyectos con valor perdurable.
                </p>
              </div>
            </div>

            <div className="about-hero-reveal about-hero-reveal-delay-2 mt-12 border-t border-white/15 pt-6">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-base font-medium text-white">Jaime Buelvas</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/50">
                    Fundador y Director de AUTEM
                  </p>
                </div>
                <a
                  href="#filosofia"
                  className="group flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e1bb6b]"
                >
                  Conocer metodología
                  <span className="flex size-10 items-center justify-center rounded-full border border-white/20 transition group-hover:border-[#e1bb6b] group-hover:bg-[#e1bb6b] group-hover:text-black">
                    <ArrowDown size={15} />
                  </span>
                </a>
              </div>

              {/* Discrete Stats Bar */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
                <div>
                  <p className="font-serif text-2xl font-light text-[#e1bb6b] md:text-3xl">12+</p>
                  <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/45">
                    Proyectos
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-light text-[#e1bb6b] md:text-3xl">40+</p>
                  <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/45">
                    Hectáreas
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-light text-[#e1bb6b] md:text-3xl">8+</p>
                  <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/45">
                    Años de visión
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-light text-[#e1bb6b] md:text-3xl">3</p>
                  <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/45">
                    Ciudades Caribe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="filosofia"
        className="about-profile bg-[#f6f5f1] px-6 py-24 text-[#151515] md:px-8 md:py-32"
      >
        <div
          data-about-reveal
          className="about-profile-content mx-auto grid max-w-[1360px] gap-12 opacity-0 lg:grid-cols-12 lg:gap-16"
        >
          <div className="lg:col-span-4">
            <SectionLabel>Nuestra filosofía</SectionLabel>
            <p className="max-w-xs text-sm leading-6 text-black/50">
              No diseñamos únicamente espacios. Diseñamos experiencias integradas de territorio.
            </p>
          </div>
          <div className="lg:col-span-8">
            <h2 className="max-w-5xl text-[clamp(2.8rem,5.4vw,5.7rem)] font-normal leading-[0.98] tracking-[-0.05em]">
              Una firma integral para
              <span className="block font-serif italic text-accent">proyectos con sentido.</span>
            </h2>
            <div className="mt-12 grid gap-8 border-t border-black/15 pt-8 text-base leading-8 text-black/58 md:grid-cols-2">
              <p>
                Acompañamos proyectos de arquitectura, urbanismo, diseño, construcción, consultoría
                y planificación territorial desde la primera pregunta hasta su materialización.
              </p>
              <p>
                Combinamos criterio creativo, conocimiento técnico y herramientas digitales para
                convertir necesidades y terrenos en soluciones funcionales, atractivas, viables y
                valiosas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-direction relative overflow-hidden border-y border-border bg-background px-5 py-16 text-foreground sm:px-8 md:py-20">
        <div className="pointer-events-none absolute -right-32 top-10 size-[420px] rounded-full bg-accent/[0.07] blur-[130px]" />
        <div className="relative mx-auto max-w-[1440px]">
          <div
            data-about-reveal
            className="mb-8 flex flex-col justify-between gap-4 opacity-0 md:flex-row md:items-end"
          >
            <div>
              <SectionLabel>Nuestra dirección</SectionLabel>
              <h2 className="text-3xl font-normal tracking-[-0.035em] md:text-5xl">
                Un norte compartido.
              </h2>
            </div>
            <p className="max-w-md text-xs leading-6 text-muted-foreground md:text-sm">
              Tres principios alinean lo que hacemos, hacia dónde vamos y el impacto que queremos
              crear.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {pillars.map((pillar, index) => {
              const PillarIcon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  data-about-reveal
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/70 p-6 opacity-0 shadow-sm transition duration-500 hover:-translate-y-1 hover:border-accent/45 hover:shadow-md dark:bg-card/50 md:p-7"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                        <PillarIcon size={18} strokeWidth={1.5} />
                      </span>
                      <span className="font-mono text-[9px] font-bold tracking-[0.16em] text-accent/80">
                        {pillar.number}
                      </span>
                    </div>
                    <p className="mt-6 text-[8.5px] font-bold uppercase tracking-[0.2em] text-accent">
                      {pillar.kicker}
                    </p>
                    <h3 className="mt-1 font-serif text-2xl font-normal tracking-[-0.03em] md:text-3xl">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="mt-4 border-t border-border/60 pt-4 text-xs leading-6 text-muted-foreground">
                    {pillar.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-promise relative overflow-hidden bg-[#0c0d0e] px-6 py-24 text-white md:px-8 md:py-32">
        <div className="pointer-events-none absolute right-[-10%] top-1/4 size-[520px] rounded-full bg-[#e1bb6b]/[0.04] blur-[160px]" />
        <div className="mx-auto max-w-[1380px]">
          <div
            data-about-reveal
            className="grid gap-14 opacity-0 lg:grid-cols-12 lg:gap-16 lg:items-start"
          >
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <SectionLabel dark>Promesa de valor</SectionLabel>
              <h2 className="text-[clamp(2.8rem,5.2vw,5.6rem)] font-normal leading-[0.94] tracking-[-0.045em]">
                De la primera idea{" "}
                <span className="block font-serif italic text-[#e1bb6b]">al último detalle.</span>
              </h2>
              <p className="mt-7 max-w-md text-sm leading-7 text-white/55 font-light">
                No fragmentamos el proyecto. Conectamos cada decisión técnica, estética y financiera
                para que el resultado conserve intención, viabilidad y calidad insuperable.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {valuePromises.map((item, index) => (
                <div
                  key={item.title}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#e1bb6b]/40 hover:bg-white/[0.06] hover:shadow-[0_20px_50px_rgba(225,187,107,.08)] md:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#e1bb6b]">
                      {item.number}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[8.5px] font-medium tracking-wider text-white/60">
                      {item.tag}
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="font-serif text-xl font-normal tracking-[-0.02em] text-white transition-colors group-hover:text-[#e1bb6b] md:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-xs leading-6 text-white/55 font-light">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-objectives bg-[#f6f5f1] px-6 py-20 text-[#151515] md:px-8 md:py-24">
        <div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-12">
          <div
            data-about-reveal
            className="opacity-0 lg:col-span-4 lg:sticky lg:top-32 lg:self-start"
          >
            <SectionLabel>Objetivos</SectionLabel>
            <h2 className="text-3xl font-normal leading-tight tracking-[-0.035em] md:text-5xl">
              Lo que debe lograr un buen proyecto.
            </h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:col-span-8">
            {objectives.map(([title, text], index) => (
              <div
                key={title}
                data-about-reveal
                style={{ animationDelay: `${(index % 2) * 60}ms` }}
                className="group relative flex flex-col justify-between rounded-xl border border-black/10 bg-white p-5 opacity-0 shadow-sm transition duration-500 hover:-translate-y-1 hover:border-accent/45 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] md:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px w-8 bg-accent/35 transition-all duration-500 group-hover:w-12" />
                </div>
                <div className="mt-4">
                  <h3 className="font-serif text-lg font-normal leading-snug tracking-[-0.025em] text-[#171717] transition-colors group-hover:text-accent dark:text-white md:text-xl">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-black/55 dark:text-white/55">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-capabilities border-y border-black/10 bg-white px-6 py-20 text-[#151515] md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-12 lg:gap-16">
          <div data-about-reveal className="opacity-0 lg:col-span-4">
            <SectionLabel>Capacidades</SectionLabel>
            <h2 className="text-4xl font-normal tracking-[-0.04em] md:text-6xl">
              Servicios conectados.
            </h2>
            <p className="mt-5 max-w-sm text-xs leading-6 text-black/50 md:text-sm md:leading-7">
              No son piezas aisladas: forman un sistema para estudiar, diseñar, comunicar y
              construir mejor.
            </p>
          </div>
          <div data-about-reveal className="opacity-0 lg:col-span-8">
            <Accordion type="single" collapsible defaultValue="service-0">
              {services.map((service, index) => (
                <AccordionItem
                  key={service.title}
                  value={`service-${index}`}
                  className="border-black/15"
                >
                  <AccordionTrigger className="gap-5 py-6 text-left no-underline hover:no-underline">
                    <span className="grid flex-1 gap-2 pr-3 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
                      <span className="font-mono text-[9px] text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg font-medium tracking-[-0.02em] md:text-xl">
                        {service.title}
                      </span>
                      <span className="hidden text-[8px] uppercase tracking-[0.17em] text-black/35 sm:block">
                        {service.meta}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-6 pl-10 text-xs leading-6 text-black/55 md:text-sm md:leading-7">
                    {service.text}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="about-method relative overflow-hidden bg-[#0b0c0c] px-6 py-20 text-white md:px-8 md:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(225,187,107,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(225,187,107,.055)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />
        <div className="pointer-events-none absolute -right-40 top-1/3 size-[480px] rounded-full bg-[#e1bb6b]/[0.06] blur-[140px]" />
        <div className="mx-auto max-w-[1360px]">
          <div data-about-reveal className="relative opacity-0">
            <SectionLabel dark>Método AUTEM</SectionLabel>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="max-w-3xl text-[clamp(2.6rem,4.5vw,4.8rem)] font-normal leading-[0.96] tracking-[-0.045em]">
                Claridad en
                <span className="font-serif italic text-[#e1bb6b]"> cada etapa.</span>
              </h2>
              <p className="max-w-sm text-xs leading-6 text-white/45 md:text-sm">
                Un proceso visible reduce incertidumbre y mantiene las decisiones alineadas.
              </p>
            </div>
          </div>
          <ol className="relative mt-12 grid gap-px overflow-hidden rounded-xl border border-white/12 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {method.map(([step, text], index) => (
              <li
                key={step}
                data-about-reveal
                style={{ animationDelay: `${(index % 3) * 60}ms` }}
                className="group relative min-h-[145px] overflow-hidden bg-[#0b0c0c] p-5 opacity-0 transition duration-500 hover:bg-[#121313] md:p-6"
              >
                <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-[#e1bb6b] transition-transform duration-500 group-hover:scale-x-100" />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9.5px] font-bold tracking-[0.14em] text-[#e1bb6b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <MoveRight
                    size={14}
                    className="text-white/20 transition group-hover:translate-x-1 group-hover:text-[#e1bb6b]"
                  />
                </div>
                <h3 className="mt-4 font-serif text-xl font-normal tracking-[-0.025em] text-white transition-colors group-hover:text-[#e1bb6b] md:text-2xl">
                  {step}
                </h3>
                <p className="mt-2 max-w-sm text-xs leading-5 text-white/50">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="about-culture bg-[#f6f5f1] px-6 py-24 text-[#151515] md:px-8 md:py-28">
        <div className="mx-auto max-w-[1360px]">
          <div data-about-reveal className="grid gap-8 opacity-0 lg:grid-cols-2 lg:items-end">
            <div>
              <SectionLabel>Cultura</SectionLabel>
              <h2 className="text-[clamp(3rem,5vw,5.4rem)] font-normal leading-[0.96] tracking-[-0.05em]">
                Valores que se ven
                <span className="block font-serif italic text-accent">en el trabajo.</span>
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-black/50 lg:justify-self-end">
              La cultura no vive en una declaración. Está en la forma de escuchar, decidir,
              documentar y responder por cada proyecto.
            </p>
          </div>
          <div className="mt-14 grid overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <article
                key={value}
                data-about-reveal
                style={{ animationDelay: `${(index % 4) * 70}ms` }}
                className="group relative min-h-32 bg-white p-5 opacity-0 transition duration-500 hover:bg-[#fbf7ee] md:min-h-40 md:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px w-8 bg-accent/40 transition-all duration-500 group-hover:w-14" />
                </div>
                <h3 className="mt-10 max-w-[13rem] font-serif text-xl font-normal leading-tight tracking-[-0.025em] transition-colors group-hover:text-accent md:text-2xl">
                  {value}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-difference relative overflow-hidden border-t border-black/10 bg-white px-6 py-24 text-[#151515] md:px-8 md:py-28">
        <div className="pointer-events-none absolute -left-40 top-1/4 size-[430px] rounded-full bg-accent/[0.06] blur-[130px]" />
        <div
          data-about-reveal
          className="relative mx-auto grid max-w-[1360px] gap-14 opacity-0 lg:grid-cols-12 lg:items-center"
        >
          <div className="lg:col-span-7">
            <SectionLabel>Qué nos diferencia</SectionLabel>
            <h2 className="max-w-4xl text-[clamp(3.2rem,6vw,6.6rem)] font-normal leading-[0.9] tracking-[-0.055em]">
              No entregamos
              <span className="block">solamente </span>
              <span className="font-serif italic text-accent">planos.</span>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="max-w-md text-lg leading-8 text-black/58 md:text-xl">
              Entregamos acompañamiento, criterio y una visión integral para convertir preguntas
              complejas en decisiones claras.
            </p>
            <div className="mt-9 divide-y divide-black/10 border-y border-black/10">
              {[
                "¿Qué puedo hacer en este terreno?",
                "¿Cómo hacerlo viable?",
                "¿Cómo construirlo mejor?",
              ].map((question) => (
                <div
                  key={question}
                  className="group flex min-h-16 items-center justify-between gap-5 py-4 text-sm font-medium transition-colors hover:text-accent"
                >
                  <span>{question}</span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-black/12 transition group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-founder relative overflow-hidden bg-[#0b0c0c] px-6 py-24 text-white md:px-8 md:py-28">
        <div className="pointer-events-none absolute right-[-10%] top-[-70%] size-[760px] rounded-full border border-[#e1bb6b]/15" />
        <div
          data-about-reveal
          className="relative mx-auto grid max-w-[1360px] gap-12 opacity-0 lg:grid-cols-12 lg:items-center"
        >
          <div className="lg:col-span-4">
            <SectionLabel dark>La persona detrás de AUTEM</SectionLabel>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
              Cartagena / Colombia
            </p>
          </div>
          <div className="lg:col-span-8">
            <blockquote className="max-w-5xl font-serif text-[clamp(3rem,5.3vw,5.8rem)] font-normal leading-[0.98] tracking-[-0.052em]">
              “Transformamos ideas en
              <span className="font-serif italic text-[#e1bb6b]"> proyectos de valor.</span>”
            </blockquote>
            <div className="mt-12 flex flex-col justify-between gap-5 border-t border-white/15 pt-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-base font-medium">Jaime Buelvas</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Fundador y director de AUTEM
                </p>
              </div>
              <p className="max-w-sm text-sm leading-6 text-white/45">
                Visión arquitectónica, lectura territorial y precisión técnica al servicio de cada
                proyecto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta relative isolate overflow-hidden bg-[#d7ac58] px-6 py-20 text-[#111] md:px-8 md:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(17,17,17,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,.08)_1px,transparent_1px)] [background-size:84px_84px] [mask-image:linear-gradient(90deg,black,transparent_72%)]" />
        <div className="pointer-events-none absolute -right-36 -top-56 size-[520px] rounded-full border border-black/15" />
        <div className="relative mx-auto flex max-w-[1360px] flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-55">
              El siguiente paso
            </p>
            <h2 className="mt-5 max-w-4xl text-[clamp(2.8rem,5vw,5.6rem)] font-normal leading-[0.96] tracking-[-0.05em]">
              Conversemos sobre el
              <span className="block font-serif italic">potencial de tu proyecto.</span>
            </h2>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-14 shrink-0 items-center gap-4 self-start rounded-full border border-black/40 bg-black/[0.04] px-7 py-4 text-[10px] font-bold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
          >
            Hablemos{" "}
            <ArrowUpRight
              size={15}
              className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </section>
    </div>
  );
}

export default NosotrosPage;
