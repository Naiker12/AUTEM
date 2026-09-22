import { useEffect, useRef, useState } from "react";
import { useScrollFrame } from "@/hooks/useScrollFrame";
import { AnimatedHeading, Reveal } from "./EditorialMotion";
import { properties } from "@/data/properties";
import "./editorial.css";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Search, Box as CubeIcon, Lightbulb, Check } from "lucide-react";
import { WHATSAPP_BASE_URL } from "@/data/constants";

// 1. INTRO / ABOUT SECTION (Left Image, Center Heading & Subtext, Right Image + Ticker)
function IntroAboutSection() {
  const tickerItems = [
    "ARQUITECTURA CON PROPÓSITO",
    "VISUALIZACIÓN INMERSIVA",
    "DISEÑO INTEGRADO AL PAISAJE",
    "ACOMPAÑAMIENTO PERSONALIZADO",
  ];

  return (
    <section
      data-section-reveal
      id="about"
      className="bg-[#f0ebe6] text-[#4f4742] pt-16 md:pt-24 pb-0 overflow-hidden"
    >
      <div className="w-[93%] max-w-[1360px] mx-auto">
        {/* 3-Column Intro Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-20 md:pb-24">
          {/* Left Column Image */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="w-full max-w-[340px] h-[360px] sm:h-[440px] lg:h-[493px] rounded-[8px] overflow-hidden shadow-sm">
              <img
                src={`${import.meta.env.BASE_URL}images/autem-proceso-territorio.png`}
                alt="Ilustración conceptual de planos y modelo del terreno"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>

          {/* Center Column Heading & Subtext */}
          <div className="lg:col-span-6 text-center px-2 sm:px-6 order-1 lg:order-2">
            <AnimatedHeading className="text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
              DISEÑAMOS ESPACIOS ATEMPORALES CON PROPÓSITO
            </AnimatedHeading>
            <p className="mt-4 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-xl mx-auto font-normal">
              OFRECEMOS ARQUITECTURA, INTERIORISMO Y VISUALIZACIÓN PARA CREAR ESPACIOS CON
              IDENTIDAD.
            </p>
          </div>

          {/* Right Column Image */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end order-3">
            <div className="w-full max-w-[340px] h-[360px] sm:h-[440px] lg:h-[493px] rounded-[8px] overflow-hidden shadow-sm">
              <img
                src={`${import.meta.env.BASE_URL}projects/lotes-360/lot-l07-entorno-verde.png`}
                alt="Visualización conceptual del entorno verde de Villa Paraíso"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Running Ticker Banner */}
      <div className="w-full border-y border-[#4f4742]/15 bg-[#f0ebe6] py-5 overflow-hidden select-none">
        <div className="animate-framer-ticker flex items-center whitespace-nowrap">
          {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
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
    </section>
  );
}

// 2. FEATURED PROJECTS SECTION (Staggered 3-Card Layout)
function FeaturedProjectsSection() {
  const projects = properties;

  return (
    <section
      data-section-reveal
      id="proyectos"
      className="bg-[#f0ebe6] text-[#4f4742] py-24 md:py-28"
    >
      <div className="w-[93%] max-w-[1360px] mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <AnimatedHeading className="text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
            PROYECTOS DESTACADOS
          </AnimatedHeading>
          <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-lg mx-auto font-normal">
            UNA SELECCIÓN DE NUESTROS PROYECTOS RECIENTES DE ARQUITECTURA E INTERIORISMO.
          </p>
        </div>

        {/* 3 Cards Row */}
        <div
          className={`editorial-projects ${projects.length === 1 ? "editorial-projects--single" : ""}`}
        >
          {projects.map((proj, index) => (
            <Reveal key={proj.id} delay={index * 100} className="project-reveal">
              <Link
                key={proj.id}
                to="/proyecto/$slug"
                params={{ slug: proj.slug }}
                className="project-card group block"
              >
                {/* Image Box */}
                <div
                  className={`w-full rounded-[8px] overflow-hidden relative shadow-sm ${
                    index % 3 === 1
                      ? "project-card__image project-card__image--tall"
                      : "project-card__image"
                  }`}
                >
                  <img
                    src={proj.image}
                    alt={proj.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Card Meta & Circular 57° Arrow Button */}
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[15px] sm:text-[16px] font-medium tracking-[-0.02em] uppercase text-[#4f4742]">
                      {proj.name}
                    </h3>
                  </div>
                  <div className="framer-circular-btn !w-10 !h-10 shrink-0">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* View More Projects Button */}
        <div className="mt-14 text-center">
          <Link
            to="/proyecto/$slug"
            params={{ slug: properties[0].slug }}
            className="inline-block text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-[#4f4742] underline underline-offset-8 hover:text-black transition-colors"
          >
            EXPLORAR VILLA PARAÍSO
          </Link>
        </div>
      </div>
    </section>
  );
}

// 3. OUR SERVICES SECTION (6 Detailed Services with Hover State)
function OurServicesSection() {
  const [activeHover, setActiveHover] = useState<number | null>(null);

  const services = [
    {
      title: "Arquitectura",
      desc: "Diseñamos edificios contemporáneos que equilibran estética, eficiencia y valor duradero.",
      outcome: "Proceso: necesidades → distribución → propuesta arquitectónica.",
    },
    {
      title: "Interiorismo",
      desc: "Creamos interiores refinados a través de materiales, luz y composición espacial.",
      outcome: "Proceso: usos del espacio → materiales e iluminación → propuesta de ambientes.",
    },
    {
      title: "Renovación y remodelación",
      desc: "Transformamos espacios existentes en ambientes contemporáneos y bien resueltos.",
      outcome:
        "Proceso: revisión del estado actual → alternativas → definición de la intervención.",
    },
    {
      title: "Visualización 3D",
      desc: "Visualizaciones de alta calidad para entender el diseño antes de iniciar la construcción.",
      outcome: "Proceso: planos de referencia → modelo digital → imágenes y revisión espacial.",
    },
    {
      title: "Planeación espacial",
      desc: "Optimizamos la distribución para mejorar funcionalidad, circulación y fluidez espacial.",
      outcome: "Proceso: lectura del terreno → accesos y recorridos → esquema de organización.",
    },
    {
      title: "Asesoría de obra",
      desc: "Revisamos dudas de diseño y coordinamos criterios técnicos según el alcance acordado.",
      outcome:
        "Proceso: revisión de documentos → consultas técnicas → recomendaciones de seguimiento.",
    },
  ];

  return (
    <section
      data-section-reveal
      id="servicios"
      className="bg-[#f0ebe6] text-[#4f4742] py-24 md:py-28 border-t border-[#4f4742]/15"
    >
      <div className="w-[93%] max-w-[1360px] mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <AnimatedHeading className="text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
            NUESTROS SERVICIOS
          </AnimatedHeading>
          <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-lg mx-auto font-normal">
            SERVICIOS INTEGRALES, DESDE EL CONCEPTO HASTA LA ENTREGA.
          </p>
        </div>

        {/* Services Rows with Divider Lines */}
        <div className="divide-y divide-[#4f4742]/20 border-y border-[#4f4742]/20">
          {services.map((service, idx) => (
            <div
              key={service.title}
              onMouseEnter={() => setActiveHover(idx)}
              onMouseLeave={() => setActiveHover(null)}
              tabIndex={0}
              data-motion-card
              className="service-row relative py-8 md:py-10 transition-colors duration-300 hover:bg-[#e8e1d7]/30 px-2 sm:px-4 cursor-pointer"
            >
              <img
                className="service-preview"
                src={`${import.meta.env.BASE_URL}images/${["autem-proceso-territorio.png", "carousel-modern-lounge.jpg", "provencal-oak-detail.jpg", "autem-villa-paraiso-aerial-v2.png", "territory-masterplan-nature.jpg", "autem-proceso-territorio.png"][idx]}`}
                alt=""
                loading="lazy"
              />
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <h3 className="text-[22px] sm:text-[26px] font-normal tracking-[-0.02em] text-[#4f4742]">
                    {service.title}
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-[#57504b] leading-relaxed font-light">
                    {service.desc}
                  </p>
                  <p className="text-[12px] leading-relaxed text-[#4f4742] font-medium">
                    {service.outcome}
                  </p>
                </div>
                <div
                  className={`framer-circular-btn !w-11 !h-11 shrink-0 transition-transform ${
                    activeHover === idx ? "scale-110 bg-[#4f4742] text-[#f0ebe6]" : ""
                  }`}
                >
                  <ArrowUpRight size={17} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4. PROJECT EXPERTISE SECTION (2 Large Image Cards)
function ProjectExpertiseSection() {
  return (
    <section
      data-section-reveal
      className="bg-[#f0ebe6] text-[#4f4742] py-24 md:py-28 border-t border-[#4f4742]/15"
    >
      <div className="w-[93%] max-w-[1360px] mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <AnimatedHeading className="text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
            EXPERIENCIA DE PROYECTO
          </AnimatedHeading>
          <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-lg mx-auto font-normal">
            DISEÑAMOS ESPACIOS RESIDENCIALES Y COMERCIALES CON VISIÓN DE LARGO PLAZO.
          </p>
        </div>

        {/* 2 Big Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Diseño comercial Card */}
          <div
            data-motion-card
            className="expertise-card relative h-[480px] sm:h-[560px] rounded-[10px] overflow-hidden group shadow-sm flex flex-col justify-end p-8 md:p-10"
          >
            <img
              src="https://framerusercontent.com/images/UqMqhHYfcJfkq2yOeOBnNWsjEmQ.jpg"
              alt="Diseño comercial"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            <div className="relative z-10 text-white space-y-2">
              <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-white/80 mb-2">
                ESPACIOS PARA TRABAJAR Y CONECTAR
              </div>
              <h3 className="text-[26px] sm:text-[32px] font-medium leading-none tracking-[-0.02em] uppercase">
                DISEÑO COMERCIAL
              </h3>
              <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.08em] text-white/80 max-w-md font-light">
                ESPACIOS FUNCIONALES PARA OFICINAS, COMERCIOS, HOTELERÍA Y EMPRESAS.
              </p>
            </div>
          </div>

          {/* Diseño residencial Card */}
          <div className="relative h-[480px] sm:h-[560px] rounded-[10px] overflow-hidden group shadow-sm flex flex-col justify-end p-8 md:p-10">
            <img
              src="https://framerusercontent.com/images/ecG0oXxVciB6YeEscSE3BDzmk.jpg"
              alt="Diseño residencial"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            <div className="relative z-10 text-white space-y-2">
              <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-white/80 mb-2">
                ESPACIOS PARA VIVIR
              </div>
              <h3 className="text-[26px] sm:text-[32px] font-medium leading-none tracking-[-0.02em] uppercase">
                DISEÑO RESIDENCIAL
              </h3>
              <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.08em] text-white/80 max-w-md font-light">
                VIVIENDAS CUIDADOSAMENTE DISEÑADAS: VILLAS, APARTAMENTOS Y RESIDENCIAS PRIVADAS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 5. CLEAR DESIGN PROCESS SECTION (4 Cards with Icons & Photos)
function ClearDesignProcessSection() {
  const steps = [
    {
      num: "01",
      tag: "INVESTIGACIÓN",
      title: "ENTENDER EL TERRENO",
      desc: "Revisamos objetivos, contexto y planos disponibles para definir el punto de partida.",
      result: "Resultado: necesidades y criterios de diseño.",
      img: `${import.meta.env.BASE_URL}images/territory-masterplan-nature.jpg`,
      icon: Search,
    },
    {
      num: "02",
      tag: "IDEACIÓN",
      title: "ORGANIZAR EL ESPACIO",
      desc: "Estudiamos distribución, accesos y recorridos para comparar alternativas contigo.",
      result: "Resultado: esquema de implantación y distribución.",
      img: `${import.meta.env.BASE_URL}projects/villa-paraiso/masterplan-clean.svg`,
      icon: CubeIcon,
    },
    {
      num: "03",
      tag: "MODELADO",
      title: "VISUALIZAR LA PROPUESTA",
      desc: "Pasamos del plano al modelo para revisar volúmenes y la relación con el paisaje.",
      result: "Resultado: visualización del proyecto antes de construir.",
      img: `${import.meta.env.BASE_URL}images/autem-villa-paraiso-aerial-v2.png`,
      icon: Lightbulb,
    },
    {
      num: "04",
      tag: "ENTREGA",
      title: "DEFINIR LOS SIGUIENTES PASOS",
      desc: "Revisamos la propuesta y organizamos la documentación y el acompañamiento acordados.",
      result: "Resultado: entregables y alcance de la siguiente etapa.",
      img: `${import.meta.env.BASE_URL}images/autem-proceso-territorio.png`,
      icon: Check,
    },
  ];

  return (
    <section
      data-section-reveal
      id="design-process"
      className="bg-[#f0ebe6] text-[#4f4742] py-24 md:py-28 border-t border-[#4f4742]/15"
    >
      <div className="w-[93%] max-w-[1360px] mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <AnimatedHeading className="text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.15] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
            PROCESO DE DISEÑO CLARO
          </AnimatedHeading>
          <p className="mt-3 text-[13px] sm:text-[14px] leading-[1.6] tracking-[0.04em] text-[#57504b] uppercase max-w-lg mx-auto font-normal">
            UN PROCESO COLABORATIVO, DESDE LA IDEA HASTA LA EJECUCIÓN.
          </p>
        </div>

        {/* 4 Cards Row */}
        <div className="process-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                tabIndex={0}
                data-motion-card
                className="process-card group relative h-[380px] rounded-[10px] overflow-hidden shadow-sm flex flex-col justify-end p-6"
              >
                <img
                  src={step.img}
                  alt={step.title}
                  className="absolute inset-0 w-full h-full object-cover object-center bg-[#d6cfc2] transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Top Floating Icon Pill */}
                <span className="absolute top-6 left-6 rounded-full bg-black/50 px-3 py-1.5 text-white text-xs tracking-wider">
                  {step.num} · {step.tag}
                </span>
                <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#4f4742] shadow-sm">
                  <Icon size={18} />
                </div>

                {/* Content at Bottom */}
                <div className="relative z-10 text-white space-y-2">
                  <h3 className="text-[17px] font-medium leading-tight uppercase tracking-[-0.01em]">
                    {step.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed text-white/80 font-light">
                    {step.desc}
                  </p>
                  <p className="text-[11px] leading-relaxed text-white border-t border-white/25 pt-2">
                    {step.result}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-[#57504b]">
          Imágenes de referencia y visualizaciones conceptuales; no representan obras ejecutadas.
          Los entregables se definen según cada proyecto.
        </p>
      </div>
    </section>
  );
}

// Recursos del proyecto: sin opiniones ni retratos de muestra.
function ProjectResourcesSection() {
  const resources = [
    {
      title: "Plano urbanístico",
      image: "projects/villa-paraiso/masterplan-clean.svg",
      text: "Consulta la organización del proyecto y localiza sus lotes en el plano.",
      status: "Exploración del proyecto",
    },
    {
      title: "Imágenes de la propuesta",
      image: "projects/lotes-360/acceso-render.png",
      text: "Comprende la intención de diseño del acceso y su relación con el entorno. Las imágenes son representaciones, no fotografías de obra terminada.",
      status: "Visualización conceptual",
    },
    {
      title: "Entorno y paisaje",
      image: "projects/lotes-360/lot-l12-quebrada.png",
      text: "Revisa las referencias visuales del paisaje y plantea tus preguntas sobre el lote que te interesa.",
      status: "Referencia visual",
    },
  ];
  return (
    <section id="explorar-proyecto" data-section-reveal className="bg-[#f0ebe6] text-[#4f4742]">
      <div className="w-[93%] max-w-[1360px] mx-auto">
        <div className="text-center mb-12">
          <AnimatedHeading className="text-[clamp(28px,3.2vw,40px)] font-medium leading-tight uppercase">
            CONOCE EL PROYECTO ANTES DE DECIDIR
          </AnimatedHeading>
          <p className="mt-4 text-sm max-w-xl mx-auto leading-relaxed">
            Villa Paraíso reúne planos y recursos visuales para ayudarte a entender la propuesta y
            conversar con nuestro equipo.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {resources.map((resource) => (
            <Reveal key={resource.title}>
              <article>
                <div className="h-72 overflow-hidden rounded-lg bg-[#ddd5c9]">
                  <img
                    src={`${import.meta.env.BASE_URL}${resource.image}`}
                    alt={resource.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-5 text-[10px] uppercase tracking-widest">{resource.status}</p>
                <h3 className="mt-2 text-xl">{resource.title}</h3>
                <p className="mt-3 text-sm leading-relaxed">{resource.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/proyecto/$slug"
            params={{ slug: properties[0].slug }}
            className="inline-flex rounded-full bg-[#4f4742] text-white px-6 py-3 text-sm"
          >
            Explorar Villa Paraíso <ArrowUpRight className="ml-2" size={18} />
          </Link>
          <p className="mt-4 text-xs text-[#57504b]">
            El recorrido 360° está en preparación. Consulta con el equipo el estado, disponibilidad
            y alcance de cada propuesta.
          </p>
        </div>
      </div>
    </section>
  );
}

// 7. QUOTE BANNER ("Architecture should speak of its time...")
function QuoteBannerSection() {
  return (
    <section data-section-reveal className="bg-[#f0ebe6] text-white py-8">
      <div className="w-[93%] max-w-[1360px] mx-auto">
        <div className="relative min-h-[380px] sm:min-h-[440px] rounded-[12px] overflow-hidden shadow-sm flex flex-col justify-between p-8 sm:p-12 lg:p-16">
          <img
            src="https://framerusercontent.com/images/Vot4TfNdPciaGO0nbBK36oh4ec.png"
            alt="Arquitectura al atardecer"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40" />

          {/* Quote Text */}
          <div className="relative z-10 max-w-3xl space-y-4">
            <AnimatedHeading className="text-[clamp(24px,3.5vw,44px)] font-medium leading-[1.18] tracking-[-1.2px] uppercase text-[#efede9]">
              «LA ARQUITECTURA DEBE HABLAR DE SU TIEMPO Y LUGAR, PERO ANHELAR LA ATEMPORALIDAD.»
            </AnimatedHeading>
            <p className="text-[14px] uppercase tracking-[0.1em] text-white/80">"Frank Gehry"</p>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-wrap items-center gap-4 pt-8">
            <Link
              to="/proyecto/$slug"
              params={{ slug: "villa-paraiso" }}
              className="px-6 py-3 rounded-full bg-white text-[#4f4742] text-[11px] font-medium uppercase tracking-[0.12em] hover:bg-white/90 transition-all shadow-sm"
            >
              VER PROYECTOS
            </Link>
            <a
              href="#contacto"
              className="px-6 py-3 rounded-full bg-[#181818]/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium uppercase tracking-[0.12em] hover:bg-black transition-all"
            >
              AGENDAR CONSULTA
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// 8. CONTACT SECTION (Minimalist Underline Form Layout)
function ContactUsSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Arquitectura",
    projectType: "Residencial",
    location: "",
    scale: "230 – 930 m²",
  });

  const projectTypes = ["Residencial", "Comercial"];
  const projectScales = ["Menos de 230 m²", "230 – 930 m²", "930 – 4.650 m²", "Más de 4.650 m²"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hola AUTEM, me gustaría consultar sobre un proyecto:
- Nombre: ${formData.name || "N/A"}
- Correo: ${formData.email || "N/A"}
- Teléfono: ${formData.phone || "N/A"}
- Servicio: ${formData.service}
- Tipo de proyecto: ${formData.projectType}
- Ubicación: ${formData.location || "N/A"}
- Área: ${formData.scale}`;

    window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section
      data-section-reveal
      id="contacto"
      className="bg-[#f0ebe6] text-[#4f4742] py-24 md:py-28 border-t border-[#4f4742]/15"
    >
      <div className="w-[93%] max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Coordinates */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <AnimatedHeading className="text-[clamp(28px,3.5vw,44px)] font-medium leading-[1.12] tracking-[-1.2px] text-[#4f4742] uppercase font-sans">
                HABLEMOS DE TU PROYECTO
              </AnimatedHeading>
              <p className="mt-4 text-[14px] sm:text-[15px] leading-relaxed text-[#57504b] font-light">
                Toda colaboración comienza con una conversación. Queremos conocer tu proyecto, idea
                o alianza.
              </p>
            </div>

            <div className="space-y-6 pt-4 text-[13px] text-[#57504b]">
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#4f4742]/60 mb-1">
                  Teléfono
                </span>
                <a
                  href="tel:+573007200894"
                  className="text-[15px] font-medium text-[#4f4742] hover:underline"
                >
                  +57 (300) 720-0894
                </a>
              </div>

              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#4f4742]/60 mb-1">
                  Correo electrónico
                </span>
                <a
                  href="mailto:contacto@autem.com.co"
                  className="text-[15px] font-medium text-[#4f4742] hover:underline"
                >
                  contacto@autem.com.co
                </a>
              </div>

              <div>
                <span className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#4f4742]/60 mb-1">
                  Dirección
                </span>
                <span className="text-[14px] text-[#4f4742]">
                  Cartagena de Indias & Turbaco · Bolívar, Colombia
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Framer Underline Form */}
          <div className="lg:col-span-7">
            <span className="block text-[16px] font-medium text-[#4f4742] mb-6">
              CUÉNTANOS SOBRE TU PROYECTO
            </span>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Nombre completo */}
              <div>
                <input
                  type="text"
                  aria-label="Nombre completo"
                  required
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent border-b border-[#4f4742]/40 pb-3 text-[14px] text-[#4f4742] placeholder-[#57504b]/60 focus:border-[#4f4742] focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  aria-label="Correo electrónico"
                  required
                  placeholder="Correo electrónico"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border-b border-[#4f4742]/40 pb-3 text-[14px] text-[#4f4742] placeholder-[#57504b]/60 focus:border-[#4f4742] focus:outline-none transition-colors"
                />
              </div>

              {/* Teléfono */}
              <div>
                <input
                  type="tel"
                  aria-label="Teléfono"
                  required
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-transparent border-b border-[#4f4742]/40 pb-3 text-[14px] text-[#4f4742] placeholder-[#57504b]/60 focus:border-[#4f4742] focus:outline-none transition-colors"
                />
              </div>

              {/* Service Select */}
              <div>
                <select
                  aria-label="Servicio"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full bg-transparent border-b border-[#4f4742]/40 pb-3 text-[14px] text-[#4f4742] focus:border-[#4f4742] focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="Arquitectura">Arquitectura</option>
                  <option value="Interiorismo">Interiorismo</option>
                  <option value="Renovación y remodelación">Renovación y remodelación</option>
                  <option value="Visualización 3D">Visualización 3D</option>
                  <option value="Planeación espacial">Planeación espacial</option>
                  <option value="Asesoría de obra">Asesoría de obra</option>
                </select>
              </div>

              {/* Project Type */}
              <div className="space-y-3 pt-2">
                <span className="block text-[13px] text-[#57504b]">Tipo de proyecto</span>
                <div className="flex flex-wrap gap-3">
                  {projectTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, projectType: type })}
                      aria-pressed={formData.projectType === type}
                      className={`px-8 py-3 rounded-full text-[13px] font-normal transition-all duration-200 ${
                        formData.projectType === type
                          ? "bg-[#4f4742] text-[#f0ebe6]"
                          : "bg-[#ded5c9] text-[#4f4742] hover:bg-[#d5cbbe]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ubicación del proyecto */}
              <div className="pt-2">
                <input
                  type="text"
                  aria-label="Ubicación del proyecto"
                  placeholder="Ubicación del proyecto"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-transparent border-b border-[#4f4742]/40 pb-3 text-[14px] text-[#4f4742] placeholder-[#57504b]/60 focus:border-[#4f4742] focus:outline-none transition-colors"
                />
              </div>

              {/* Project Scale */}
              <div className="space-y-3 pt-2">
                <span className="block text-[13px] text-[#57504b]">Escala del proyecto</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projectScales.map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setFormData({ ...formData, scale: scale })}
                      aria-pressed={formData.scale === scale}
                      className={`py-3 px-4 text-center rounded-full text-[13px] font-normal transition-all duration-200 ${
                        formData.scale === scale
                          ? "bg-[#4f4742] text-[#f0ebe6]"
                          : "bg-[#ded5c9] text-[#4f4742] hover:bg-[#d5cbbe]"
                      }`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#4f4742] text-[#f0ebe6] text-[13px] font-medium uppercase tracking-[0.14em] hover:bg-black transition-colors"
                >
                  Continuar en WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// MAIN EXPORT (All Framer Template Sections directly under the Hero)
export default function EditorialHomeSections() {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLElement[]>([]);
  useEffect(() => {
    cards.current = Array.from(
      root.current?.querySelectorAll<HTMLElement>(".expertise-card, .process-card, #about img") ??
        [],
    );
  }, []);
  useScrollFrame(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cards.current.forEach((el) => {
      const box = el.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight + 100) return;
      const progress = Math.max(
        0,
        Math.min(1, (window.innerHeight - box.top) / (window.innerHeight * 0.8)),
      );
      el.style.setProperty("--card-scale", String(reduced ? 1 : 0.9 + progress * 0.1));
    });
  });
  return (
    <div ref={root} className="editorial-home bg-[#f0ebe6]">
      <IntroAboutSection />
      <FeaturedProjectsSection />
      <OurServicesSection />
      <ProjectExpertiseSection />
      <ClearDesignProcessSection />
      <ProjectResourcesSection />
      <QuoteBannerSection />
      <ContactUsSection />
    </div>
  );
}
