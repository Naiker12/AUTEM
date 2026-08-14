import { useEffect, useRef } from "react";
import {
  Award,
  Building2,
  MapPin,
  Maximize,
  RotateCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionMeasureLine from "@/components/SectionMeasureLine";

const projectStats = [
  { value: "5", label: "Ubicaciones para elegir", icon: MapPin },
  { value: "1.080+", label: "m² por lote", icon: Maximize },
  { value: "360°", label: "Experiencia de exploración", icon: RotateCw },
  { value: "24/7", label: "Acceso digital al proyecto", icon: ShieldCheck },
];

const trustCards = [
  {
    icon: TrendingUp,
    eyebrow: "Rentas cortas (Airbnb/Booking)",
    title: "Alta Rentabilidad Turística",
    description:
      "Proyectos en zonas de alta demanda en Cartagena con retornos estimados entre 12% y 16% EA.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Patrimonio autónomo",
    title: "Garantía Fiduciaria & Legal",
    description:
      "Tus recursos son administrados por fiduciarias vigiladas por la Superintendencia Financiera.",
  },
  {
    icon: Building2,
    eyebrow: "Valorización asegurada",
    title: "Plusvalía sobre Planos",
    description:
      "Aumento progresivo del m² estimado entre 18% y 25% durante la fase de desarrollo del proyecto.",
  },
  {
    icon: Award,
    eyebrow: "Operación 100% legal",
    title: "Licencias Turísticas Activas",
    description:
      "Propiedades estructuradas con permisos de explotación turística comercial e industrial.",
  },
];

export default function InvestmentTrustSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        section.classList.add("investment-trust--visible");
        observer.unobserve(section);
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="testimonios"
      className="investment-trust relative isolate overflow-hidden border-b border-border bg-background py-16 text-foreground md:py-20"
    >
      <SectionMeasureLine index={3} total={4} label="Confianza" />
      <div className="investment-trust__contours pointer-events-none absolute inset-0" />
      <div className="section-scroll-content relative z-10 mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="investment-trust__stats mx-auto grid max-w-[1120px] grid-cols-2 overflow-hidden rounded-[1.4rem] border border-border/65 bg-card/72 shadow-[0_18px_55px_rgba(38,31,21,.09)] backdrop-blur-xl lg:grid-cols-4 dark:bg-card/58">
          {projectStats.map(({ value, label, icon: Icon }, index) => (
            <div
              key={label}
              className={`relative flex min-h-24 items-center gap-4 px-5 py-5 sm:px-7 ${
                index % 2 ? "border-l border-border/65" : ""
              } ${index > 1 ? "border-t border-border/65 lg:border-t-0" : ""} ${
                index > 0 ? "lg:border-l lg:border-border/65" : ""
              }`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-accent/30 text-accent">
                <Icon size={21} strokeWidth={1.45} />
              </span>
              <div>
                <p className="font-serif text-[1.8rem] leading-none tracking-[-0.035em] sm:text-[2.05rem]">
                  {value}
                </p>
                <p className="mt-2 max-w-32 text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-muted-foreground">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <header className="investment-trust__heading mx-auto mt-14 max-w-4xl text-center md:mt-16">
          <p className="flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-6 bg-accent/60" /> Confianza & valorización en Cartagena
            <span className="h-px w-6 bg-accent/60" />
          </p>
          <h2 className="mt-5 text-[clamp(2.6rem,4.5vw,4.7rem)] leading-[0.98] tracking-[-0.045em]">
            Inversionistas que eligieron
            <span className="block font-serif italic text-accent">la arquitectura del futuro.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Decisiones respaldadas por visualización 3D, acompañamiento legal y conocimiento del
            mercado inmobiliario de Cartagena.
          </p>
        </header>

        <div className="investment-trust__cards mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trustCards.map(({ icon: Icon, eyebrow, title, description }, index) => (
            <Card
              key={title}
              variant="editorial"
              className="group transition duration-500 hover:-translate-y-1 hover:border-accent/35 hover:shadow-[0_22px_58px_rgba(197,160,89,.13)]"
              style={{ transitionDelay: `${120 + index * 70}ms` }}
            >
              <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
                <span className="mb-2 grid size-11 place-items-center rounded-xl bg-accent/[0.09] text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon size={21} strokeWidth={1.55} />
                </span>
                <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-accent">
                  {eyebrow}
                </p>
                <CardTitle className="font-serif text-xl font-normal leading-tight tracking-[-0.025em]">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                <p className="text-[13px] leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
