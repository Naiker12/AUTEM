import { useEffect, useRef } from "react";
import { Compass, Eye, MapPin, MoveUpRight, ShieldCheck, SunMedium } from "lucide-react";

const base = import.meta.env.BASE_URL;

const metrics = [
  { icon: MapPin, value: "05", label: "Ubicaciones para explorar" },
  { icon: MoveUpRight, value: "1.080+", label: "m² por lote" },
  { icon: Eye, value: "360°", label: "Lectura del paisaje" },
  { icon: ShieldCheck, value: "24/7", label: "Acompañamiento digital" },
];

const principles = [
  {
    icon: Compass,
    title: "Orientación",
    description: "Entiende la relación entre el lote, el acceso y las visuales.",
  },
  {
    icon: SunMedium,
    title: "Luz natural",
    description: "Compara recorridos solares antes de tomar una decisión.",
  },
  {
    icon: Eye,
    title: "Perspectiva",
    description: "Visualiza la escala del proyecto desde cada punto importante.",
  },
];

export default function TerritoryExperienceSections() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-revealed");
        });
      },
      { threshold: 0.16 },
    );
    root
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="territory-experience bg-[#f4f0ea] text-[#332e29]">
      <section className="territory-overview bg-[#dfe5dc] px-6 py-20 md:px-12 md:py-28 xl:px-20">
        <div className="mx-auto max-w-[1700px]">
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:gap-20">
            <div data-reveal className="reveal-up max-w-2xl pb-2">
              <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#8c692e] dark:text-[#ddb66d]">
                Antes de decidir
              </p>
              <h2 className="mt-4 text-[clamp(2.4rem,4.8vw,5.2rem)] font-normal leading-[1.08] tracking-[-0.015em]">
                Una inversión que se
                <br />
                <span className="font-serif italic font-normal text-[#a47c3a] dark:text-[#ddb66d]">
                  puede recorrer.
                </span>
              </h2>
              <p className="mt-8 max-w-md text-base leading-7 text-[#332e29]/65 dark:text-white/65 md:text-lg">
                Accede al masterplan, compara cada entorno y entiende cómo se relaciona tu lote con
                el paisaje antes de visitarlo.
              </p>
              <div className="mt-9 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#5b6258] dark:text-[#a0a89d]">
                <span className="size-2 rounded-full bg-[#b5863c] shadow-[0_0_0_6px_rgba(181,134,60,.14)]" />
                Masterplan interactivo · Lotes 360°
              </div>
            </div>

            <div
              data-reveal
              className="territory-map reveal-up reveal-up--late group relative min-h-[340px] overflow-hidden rounded-2xl border border-black/10 bg-[#1a2b23] shadow-xl dark:border-white/15 md:min-h-[420px]"
            >
              <img
                src={`${base}projects/lotes-360/panoramica-render.png`}
                alt="Perspectiva del territorio y parcelación AUTEM"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[.18em] text-[#fff8e9] backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-[#dfb86c]" />
                Perspectiva del Territorio
              </div>
              <a
                href={`${base}proyecto/lotes-360`}
                className="absolute bottom-6 right-6 flex items-center gap-2.5 rounded-full border border-white/30 bg-black/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md transition hover:bg-[#b5863c] hover:border-[#b5863c]"
              >
                Explorar en 3D
                <MoveUpRight
                  size={14}
                  className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </div>

          <div className="territory-metrics mt-6 grid overflow-hidden rounded-xl border border-[#556257]/15 bg-[#edf0e9]/80 shadow-sm backdrop-blur-sm sm:grid-cols-2 md:grid-cols-4">
            {metrics.map(({ icon: Icon, value, label }, index) => (
              <article
                key={label}
                data-reveal
                className="reveal-up group flex flex-col justify-between border-b border-[#556257]/15 px-4 py-3 last:border-b-0 sm:even:border-r-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-5 lg:py-3.5"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-5 items-center justify-center rounded-full border border-[#b5863c]/30 text-[#9e742d] transition group-hover:bg-[#b5863c] group-hover:text-white">
                    <Icon size={10} strokeWidth={1.4} />
                  </span>
                  <span className="font-mono text-[8px] text-[#8a978c]">0{index + 1}</span>
                </div>
                <div className="mt-2">
                  <p className="font-serif font-light text-xl leading-tight tracking-[-0.02em] text-[#2c2824] dark:text-white md:text-2xl">
                    {value}
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold uppercase leading-tight tracking-[0.14em] text-[#556257]">
                    {label}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="territory-story px-6 py-24 md:px-12 md:py-32 xl:px-20">
        <div className="mx-auto grid max-w-[1700px] gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
          <div data-reveal className="reveal-up order-2 max-w-xl lg:order-1">
            <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#a47c3a] dark:text-[#ddb66d]">
              Diseñado con el territorio
            </p>
            <h2 className="mt-4 text-[clamp(2.4rem,4.4vw,4.8rem)] font-normal leading-[1.08] tracking-[-0.015em]">
              El proyecto empieza
              <br />
              <span className="font-serif italic text-[#a47c3a] dark:text-[#ddb66d]">
                antes del plano.
              </span>
            </h2>
            <p className="mt-8 max-w-md text-base leading-7 text-black/60 md:text-lg md:leading-8">
              Cada lote se lee a partir de su luz, vegetación, acceso y relación con el paisaje. La
              tecnología hace visible esa información.
            </p>
            <div className="mt-10 divide-y divide-black/15 border-y border-black/15">
              {principles.map(({ icon: Icon, title, description }, index) => (
                <div key={title} className="group flex gap-5 py-5">
                  <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-[#b5863c]/35 text-[#a47c3a] transition group-hover:bg-[#b5863c] group-hover:text-white">
                    <Icon size={16} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="text-lg">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-black/55">{description}</p>
                  </div>
                  <span className="ml-auto pt-1 font-mono text-[10px] text-[#a47c3a]">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            data-reveal
            className="reveal-up reveal-up--late relative order-1 min-h-[460px] lg:order-2 lg:min-h-[640px]"
          >
            <img
              src={`${base}projects/lotes-360/acceso-render.png`}
              alt="Acceso al proyecto Lotes 360"
              className="absolute right-0 top-0 h-[78%] w-[78%] rounded-2xl object-cover"
            />
            <img
              src={`${base}projects/lotes-360/lot-l18-zona-social.png`}
              alt="Zona social rodeada de naturaleza"
              className="absolute bottom-0 left-0 h-[48%] w-[49%] rounded-2xl border-[10px] border-[#f4f0ea] object-cover"
            />
            <span className="absolute bottom-[8%] right-[4%] rounded-full bg-[#332e29] px-4 py-3 text-[9px] font-bold uppercase tracking-[.18em] text-white">
              Cartagena · Colombia
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
