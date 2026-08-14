import { useEffect, useRef } from "react";
import { ArrowRight, Eye, Leaf, MapPin, Mountain, Play, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { getPropertyBySlug } from "@/data/properties";
import ProjectAmbientCanvas from "./ProjectAmbientCanvas";
import SectionMeasureLine from "@/components/SectionMeasureLine";

const projectFacts = [
  { label: "Lotes desde", value: "1.080 m²", icon: Leaf },
  { label: "Entorno", value: "Natural", icon: Mountain },
  { label: "Acceso", value: "Vial", icon: Route },
  { label: "Vista", value: "Panorámica", icon: Eye },
];

export default function ProjectShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const project = getPropertyBySlug("residencia-azure");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        section.classList.add("project-showcase--visible");
        observer.unobserve(section);
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(section);
    let frameId = 0;
    const updateScrollProgress = () => {
      frameId = 0;
      const bounds = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (viewportHeight - bounds.top) / (viewportHeight + bounds.height)),
      );
      section.style.setProperty("--project-scroll-progress", progress.toFixed(4));
      section.style.setProperty("--project-image-y", `${(progress * -30).toFixed(2)}px`);
      section.style.setProperty("--project-image-scale", (1.075 - progress * 0.045).toFixed(4));
    };
    const onScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(updateScrollProgress);
    };
    updateScrollProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="proyectos"
      className="project-showcase relative isolate overflow-hidden border-y border-border bg-background py-20 text-foreground md:min-h-[100svh] md:py-28"
    >
      <SectionMeasureLine index={1} total={4} label="Proyecto" />
      <ProjectAmbientCanvas />
      <div className="pointer-events-none absolute inset-0 opacity-[0.1] dark:opacity-[0.06] [background-image:linear-gradient(to_right,var(--color-accent)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-accent)_1px,transparent_1px)] [background-size:110px_110px] [mask-image:radial-gradient(ellipse_at_64%_46%,black,transparent_72%)]" />
      <div className="pointer-events-none absolute right-[-12%] top-[4%] size-[72vw] rounded-full border border-accent/15" />
      <div className="pointer-events-none absolute -right-32 top-1/3 size-[520px] rounded-full bg-accent/[0.08] blur-[150px]" />

      <div className="section-scroll-content relative mx-auto grid max-w-[1800px] items-center gap-10 px-5 sm:px-8 md:px-10 lg:px-14 xl:min-h-[720px] xl:grid-cols-12 xl:items-end xl:gap-12 xl:px-20">
        <div className="project-showcase__copy relative z-20 xl:col-span-5">
          <p className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-accent">
            <span className="h-px w-8 bg-accent" /> Disponibles ahora
          </p>
          <h2 className="max-w-xl text-[clamp(3.15rem,6vw,7rem)] leading-[0.9] tracking-[-0.055em]">
            <span className="block">El proyecto</span>
            <span className="mt-2 block text-[0.86em] font-serif italic leading-[0.92] text-accent">
              en la naturaleza
            </span>
          </h2>
          <p className="mt-7 max-w-lg text-base leading-8 text-muted-foreground md:text-lg">
            Parcelación campestre con lotes amplios, entorno natural, acceso vial y una vista
            panorámica que puedes recorrer antes de invertir.
          </p>

          <Card className="project-showcase__card mt-8 overflow-hidden rounded-[1.75rem] border-border/70 bg-card/78 shadow-[0_24px_80px_rgba(38,32,22,0.12)] backdrop-blur-xl dark:bg-card/68">
            <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent/[0.07]">
                    <AutemBrandIcon size={29} />
                  </span>
                  <div className="min-w-0">
                    <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.24em] text-accent">
                      Proyecto AUTEM · Vida que inspira
                    </p>
                    <CardTitle className="truncate font-serif text-[2.15rem] font-normal leading-none tracking-[-0.035em] sm:text-4xl md:text-[2.65rem]">
                      {project?.name ?? "Lotes 360°"}
                    </CardTitle>
                  </div>
                </div>
                <Badge className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[8px] uppercase tracking-[0.16em] text-accent shadow-none hover:bg-accent/10">
                  Disponible
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-accent" /> Cartagena, Colombia
                </span>
                <span className="hidden size-1 rounded-full bg-border sm:block" />
                <span>Parcelación campestre</span>
                <span className="hidden size-1 rounded-full bg-border sm:block" />
                <span>Lanzamiento 2026</span>
              </div>
            </CardHeader>
            <Separator className="bg-border/70" />
            <CardContent className="p-5 pt-5 sm:p-6 sm:pt-6 md:p-7 md:pt-7">
              <dl className="grid grid-cols-2 gap-0 sm:grid-cols-4">
                {projectFacts.map(({ label, value, icon: Icon }, index) => (
                  <div
                    key={label}
                    className="flex min-h-[108px] flex-col items-center justify-center border-border/70 px-3 py-4 text-center even:border-l sm:min-h-[92px] sm:border-r sm:border-l-0 sm:py-0 sm:last:border-0"
                    style={{ transitionDelay: `${180 + index * 70}ms` }}
                  >
                    <dt className="flex flex-col items-center text-[10px] text-muted-foreground">
                      <span className="mb-3 flex size-9 items-center justify-center rounded-full border border-accent/35 bg-accent/[0.04] text-accent">
                        <Icon size={18} strokeWidth={1.4} />
                      </span>
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 grid gap-2 sm:grid-cols-2 sm:gap-3">
                <Button
                  asChild
                  size="lg"
                  className="group h-12 w-full justify-center rounded-full bg-accent px-5 text-[9px] font-bold uppercase tracking-[0.14em] text-accent-foreground shadow-[0_14px_34px_rgba(197,160,89,.24)] hover:bg-accent/90 sm:px-6 sm:text-[10px]"
                >
                  <a href={`${import.meta.env.BASE_URL}proyecto/residencia-azure`}>
                    Explorar lotes{" "}
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 w-full justify-center rounded-full border border-border/80 bg-background/60 px-3 text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm hover:border-accent/40 hover:bg-muted sm:px-4 sm:text-[10px]"
                >
                  <a href="#tecnologia">
                    <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                      <Play size={13} fill="currentColor" />
                    </span>
                    Ver recorrido
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="project-showcase__scene relative z-10 h-[410px] sm:h-[520px] md:h-[620px] xl:col-span-7 xl:h-[74svh] xl:min-h-[620px]">
          <div className="project-showcase__image-shell absolute inset-0 overflow-hidden rounded-[2.25rem] border border-accent/20 bg-muted shadow-[0_35px_100px_rgba(35,29,18,0.2)]">
            <img
              src={`${import.meta.env.BASE_URL}projects/lotes-360/masterplan-interactive-aerial.png`}
              alt="Vista aérea del masterplan de Lotes 360 grados en Cartagena"
              className="project-showcase__image h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/28 via-transparent to-accent/10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
            <div className="project-showcase__scan pointer-events-none absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-[#f2cc7d] to-transparent shadow-[0_0_20px_rgba(242,204,125,.85)]" />
            <div className="project-showcase__frame pointer-events-none absolute inset-4 rounded-[1.55rem] border border-white/20" />
          </div>
          <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/20 bg-black/45 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/80 backdrop-blur-xl sm:right-7 sm:top-7">
            10°23' N · 75°29' W
          </div>
        </div>
      </div>
    </section>
  );
}
