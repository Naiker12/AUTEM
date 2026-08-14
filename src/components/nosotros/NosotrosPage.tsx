import { useEffect } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  MoveRight,
  Sparkles,
  Target,
  Telescope,
} from "lucide-react";
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
    icon: Target,
    title: "Misión",
    kicker: "Lo que hacemos hoy",
    text: "Transformamos ideas, necesidades y oportunidades en proyectos integrales que generan valor. Integramos arquitectura, urbanismo, diseño, construcción, consultoría y tecnología con un acompañamiento cercano durante todo el proceso.",
  },
  {
    number: "02",
    icon: Telescope,
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

const commitments = [
  "Acompañamiento cercano y personalizado",
  "Comprensión integral de cada necesidad",
  "Soluciones diseñadas a medida",
  "Diseño, técnica y viabilidad conectados",
  "Comunicación clara en cada etapa",
  "Representación gráfica de alta calidad",
  "Aprovechamiento estratégico del terreno",
  "Orientación para tomar mejores decisiones",
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

export default function NosotrosPage() {
  useEffect(() => {
    const targets = document.querySelectorAll("[data-about-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      targets.forEach((target) => target.classList.add("fade-in-up"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("fade-in-up");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const whatsappUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola AUTEM, me gustaría conversar sobre un proyecto.")}`;
  const founderImage = `${import.meta.env.BASE_URL}images/jaime-buelvas-founder-presenting-cutout-v6.png`;

  return (
    <>
      <section className="relative min-h-[900px] overflow-hidden bg-[#090a0a] px-5 pb-6 pt-24 text-white sm:px-8 lg:min-h-screen lg:pt-24">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(216,177,95,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(216,177,95,.07)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
        <div className="pointer-events-none absolute right-[-15%] top-[8%] h-[70%] w-[70%] rounded-full bg-[#b78b3b]/10 blur-[150px]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-7.5rem)] max-w-[1500px] lg:grid-cols-12">
          <div className="relative z-30 flex flex-col justify-between pb-8 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:py-10">
            <div className="about-hero-reveal flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e1bb6b]">
              <span className="size-1.5 rounded-full bg-[#e1bb6b]" />
              Nosotros / AUTEM
            </div>
            <div className="about-hero-reveal about-hero-reveal-delay mt-16 max-w-[710px] lg:mt-0">
              <p className="mb-7 max-w-md text-[15px] leading-6 text-white/65">
                Arquitectura, territorio y tecnología trabajando como un solo sistema.
              </p>
              <h1 className="max-w-[760px] text-[clamp(3.7rem,5.6vw,6.25rem)] font-normal leading-[0.92] tracking-[-0.05em]">
                Ideas que
                <span className="block font-serif italic text-[#e1bb6b]">se convierten</span>
                <span className="block">en territorio.</span>
              </h1>
            </div>
            <div className="about-hero-reveal about-hero-reveal-delay-2 mt-12 flex max-w-xl flex-col gap-6 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-0 lg:flex-col lg:items-start lg:gap-4 xl:flex-row xl:items-center">
              <div>
                <p className="text-[15px] font-medium">Jaime Buelvas</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
                  Fundador y director
                </p>
              </div>
              <a
                href="#perfil"
                className="group flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e1bb6b]"
              >
                Conocer AUTEM
                <span className="flex size-10 items-center justify-center rounded-full border border-white/20 transition group-hover:border-[#e1bb6b] group-hover:bg-[#e1bb6b] group-hover:text-black">
                  <ArrowDown size={15} />
                </span>
              </a>
            </div>
          </div>
          <div className="relative z-10 mt-4 min-h-[560px] lg:col-span-6 lg:col-start-3 lg:row-start-1 lg:mt-0 lg:min-h-[calc(100svh-7.5rem)]">
            <div className="absolute bottom-[-1px] right-[-16%] z-10 h-[104%] w-[116%] sm:right-[-3%] sm:w-[88%] lg:right-[-5%] lg:h-full lg:w-[94%]">
              <img
                src={founderImage}
                alt="Jaime Buelvas, fundador de AUTEM, presentando un modelo arquitectónico"
                width="1080"
                height="1440"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-contain object-bottom drop-shadow-[0_30px_70px_rgba(0,0,0,.32)]"
              />
            </div>
            <div className="absolute left-[-7%] top-[34%] z-20 h-[46%] w-[82%] sm:left-[2%] sm:w-[68%] lg:left-[-5%] lg:top-[38%] lg:h-[43%] lg:w-[66%]">
              <FounderBuildingScene />
            </div>
          </div>
        </div>
      </section>

      <section id="perfil" className="bg-[#f6f5f1] px-6 py-24 text-[#151515] md:px-8 md:py-32">
        <div
          data-about-reveal
          className="mx-auto grid max-w-[1360px] gap-12 opacity-0 lg:grid-cols-12 lg:gap-16"
        >
          <div className="lg:col-span-4">
            <SectionLabel>Perfil corporativo</SectionLabel>
            <p className="max-w-xs text-sm leading-6 text-black/50">
              Una mirada completa permite tomar mejores decisiones desde el inicio.
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

      <section className="relative overflow-hidden border-y border-border bg-background px-5 py-20 text-foreground sm:px-8 md:py-24">
        <div className="pointer-events-none absolute -right-32 top-10 size-[420px] rounded-full bg-accent/[0.07] blur-[130px]" />
        <div className="relative mx-auto max-w-[1500px]">
          <div
            data-about-reveal
            className="mb-10 flex flex-col justify-between gap-5 opacity-0 md:flex-row md:items-end"
          >
            <div>
              <SectionLabel>Nuestra dirección</SectionLabel>
              <h2 className="text-4xl font-normal tracking-[-0.04em] md:text-6xl">
                Un norte compartido.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Tres principios alinean lo que hacemos, hacia dónde vamos y el impacto que queremos
              crear.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {pillars.map((pillar, index) => {
              const PillarIcon = pillar.icon;
              return (
                <Card
                  key={pillar.title}
                  data-about-reveal
                  style={{ animationDelay: `${index * 90}ms` }}
                  className="group min-h-[340px] rounded-[1.5rem] border-border/70 bg-card/76 opacity-0 shadow-[0_16px_50px_rgba(35,28,18,.07)] transition duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_24px_65px_rgba(197,160,89,.12)] dark:bg-card/62"
                >
                  <CardHeader className="p-6 pb-4 md:p-8 md:pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl border border-accent/25 bg-accent/[0.07] text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                        <PillarIcon size={20} strokeWidth={1.5} />
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/80 px-3 py-1.5 text-[8px] font-normal uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        {pillar.number}
                      </Badge>
                    </div>
                    <p className="mt-8 text-[8px] font-bold uppercase tracking-[0.18em] text-accent">
                      {pillar.kicker}
                    </p>
                    <CardTitle className="font-serif text-4xl font-normal tracking-[-0.04em]">
                      {pillar.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 md:px-8 md:pb-8">
                    <div className="mb-5 h-px bg-gradient-to-r from-accent/55 via-border to-transparent" />
                    <p className="text-sm leading-7 text-muted-foreground">{pillar.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#0b0c0c] px-6 py-24 text-white md:px-8 md:py-32">
        <div className="mx-auto max-w-[1360px]">
          <div data-about-reveal className="grid gap-14 opacity-0 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-6">
              <SectionLabel dark>Promesa de valor</SectionLabel>
              <h2 className="text-[clamp(3rem,6vw,6.2rem)] font-normal leading-[0.92] tracking-[-0.055em]">
                De la primera idea <span className="text-[#e1bb6b]">al último detalle.</span>
              </h2>
              <p className="mt-8 max-w-lg text-sm leading-7 text-white/50">
                No fragmentamos el proyecto. Conectamos cada decisión para que el resultado conserve
                intención, viabilidad y calidad.
              </p>
            </div>
            <ul className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-6">
              {commitments.map((item, index) => (
                <li
                  key={item}
                  className="flex min-h-24 items-start gap-4 rounded-[14px] border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-white/70 transition hover:border-[#e1bb6b]/45 hover:bg-white/[0.06]"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e1bb6b]/12 text-[#e1bb6b]">
                    <Check size={12} />
                  </span>
                  <span>
                    <span className="mb-1 block font-mono text-[8px] text-white/25">
                      0{index + 1}
                    </span>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f5f1] px-6 py-24 text-[#151515] md:px-8 md:py-32">
        <div className="mx-auto grid max-w-[1360px] gap-14 lg:grid-cols-12">
          <div
            data-about-reveal
            className="opacity-0 lg:col-span-4 lg:sticky lg:top-32 lg:self-start"
          >
            <SectionLabel>Objetivos</SectionLabel>
            <h2 className="text-4xl font-normal leading-tight tracking-[-0.04em] md:text-6xl">
              Lo que debe lograr un buen proyecto.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {objectives.map(([title, text], index) => (
              <Card
                key={title}
                data-about-reveal
                style={{ animationDelay: `${(index % 2) * 80}ms` }}
                variant="editorial"
                size="lg"
                className="group relative min-h-[210px] overflow-hidden border-black/[0.09] bg-white opacity-0 transition duration-500 hover:-translate-y-1 hover:border-accent/45 hover:shadow-[0_22px_55px_rgba(197,160,89,.14)] dark:bg-white"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full border border-accent/15 transition-transform duration-700 group-hover:scale-125" />
                <CardContent className="relative flex h-full min-h-[210px] flex-col justify-between pt-[var(--card-padding)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px w-12 bg-accent/45 transition-all duration-500 group-hover:w-20" />
                  </div>
                  <div className="mt-10">
                    <h3 className="font-serif text-[clamp(1.55rem,2vw,2rem)] font-normal leading-tight tracking-[-0.035em] text-[#171717]">
                      {title}
                    </h3>
                    <p className="mt-3 max-w-sm text-[13px] leading-6 text-black/55">{text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white px-6 py-24 text-[#151515] md:px-8 md:py-32">
        <div className="mx-auto grid max-w-[1360px] gap-14 lg:grid-cols-12 lg:gap-20">
          <div data-about-reveal className="opacity-0 lg:col-span-4">
            <SectionLabel>Capacidades</SectionLabel>
            <h2 className="text-5xl font-normal tracking-[-0.045em] md:text-7xl">
              Servicios conectados.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-black/48">
              No son piezas aisladas: forman un sistema para estudiar, diseñar, comunicar y
              construir mejor.
            </p>
          </div>
          <div data-about-reveal className="opacity-0 lg:col-span-7 lg:col-start-6">
            <Accordion type="single" collapsible defaultValue="service-0">
              {services.map((service, index) => (
                <AccordionItem
                  key={service.title}
                  value={`service-${index}`}
                  className="border-black/15"
                >
                  <AccordionTrigger className="gap-5 py-7 text-left no-underline hover:no-underline">
                    <span className="grid flex-1 gap-2 pr-3 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
                      <span className="font-mono text-[9px] text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xl font-medium tracking-[-0.025em] md:text-2xl">
                        {service.title}
                      </span>
                      <span className="hidden text-[8px] uppercase tracking-[0.17em] text-black/35 sm:block">
                        {service.meta}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-7 pl-12 text-sm leading-7 text-black/50">
                    {service.text}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0b0c0c] px-6 py-24 text-white md:px-8 md:py-28">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(225,187,107,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(225,187,107,.055)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />
        <div className="pointer-events-none absolute -right-40 top-1/3 size-[480px] rounded-full bg-[#e1bb6b]/[0.06] blur-[140px]" />
        <div className="mx-auto max-w-[1360px]">
          <div data-about-reveal className="relative opacity-0">
            <SectionLabel dark>Método AUTEM</SectionLabel>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h2 className="max-w-3xl text-[clamp(3rem,5vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
                Claridad en
                <span className="font-serif italic text-[#e1bb6b]"> cada etapa.</span>
              </h2>
              <p className="max-w-sm text-sm leading-6 text-white/45">
                Un proceso visible reduce incertidumbre y mantiene las decisiones alineadas.
              </p>
            </div>
          </div>
          <ol className="relative mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {method.map(([step, text], index) => (
              <li
                key={step}
                data-about-reveal
                style={{ animationDelay: `${(index % 3) * 80}ms` }}
                className="group relative min-h-[220px] overflow-hidden bg-[#0b0c0c] p-7 opacity-0 transition duration-500 hover:bg-[#121313] md:p-8"
              >
                <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-[#e1bb6b] transition-transform duration-500 group-hover:scale-x-100" />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#e1bb6b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <MoveRight
                    size={16}
                    className="text-white/20 transition group-hover:translate-x-1 group-hover:text-[#e1bb6b]"
                  />
                </div>
                <h3 className="mt-12 font-serif text-3xl font-normal tracking-[-0.035em] transition-colors group-hover:text-[#e1bb6b]">
                  {step}
                </h3>
                <p className="mt-4 max-w-sm text-[13px] leading-6 text-white/52">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#f6f5f1] px-6 py-24 text-[#151515] md:px-8 md:py-28">
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

      <section className="relative overflow-hidden border-t border-black/10 bg-white px-6 py-24 text-[#151515] md:px-8 md:py-28">
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

      <section className="relative overflow-hidden bg-[#0b0c0c] px-6 py-24 text-white md:px-8 md:py-28">
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

      <section className="relative isolate overflow-hidden bg-[#d7ac58] px-6 py-20 text-[#111] md:px-8 md:py-24">
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
    </>
  );
}
