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
  { icon: Compass, title: "Orientación", description: "Entiende la relación entre el lote, el acceso y las visuales." },
  { icon: SunMedium, title: "Luz natural", description: "Compara recorridos solares antes de tomar una decisión." },
  { icon: Eye, title: "Perspectiva", description: "Visualiza la escala del proyecto desde cada punto importante." },
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
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="territory-experience bg-[#f4f0ea] text-[#332e29]">
      <section className="territory-overview bg-[#dfe5dc] px-6 py-20 md:px-12 md:py-28 xl:px-20">
        <div className="mx-auto max-w-[1700px]">
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:gap-20">
            <div data-reveal className="reveal-up max-w-2xl pb-2">
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#8c692e]">Antes de decidir</p>
              <h2 className="mt-5 text-[clamp(2.9rem,5.2vw,6.2rem)] leading-[.88] tracking-[-.07em]">
                Una inversión que se
                <br />
                <i className="font-serif">puede recorrer.</i>
              </h2>
              <p className="mt-8 max-w-md text-base leading-7 text-[#332e29]/65 md:text-lg">
                Accede al masterplan, compara cada entorno y entiende cómo se relaciona tu lote con el paisaje antes de visitarlo.
              </p>
              <div className="mt-9 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#5b6258]">
                <span className="size-2 rounded-full bg-[#b5863c] shadow-[0_0_0_6px_rgba(181,134,60,.14)]" />
                Masterplan interactivo · Lotes 360°
              </div>
            </div>

            <div data-reveal className="territory-map reveal-up reveal-up--late relative min-h-[320px] overflow-hidden rounded-2xl bg-[#21342c] md:min-h-[400px]">
              <img
                src={`${base}projects/lotes-360/masterplan-interactive-aerial.png`}
                alt="Vista aérea del masterplan Lotes 360"
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(20,33,27,.68),transparent_58%)]" />
              <div className="territory-map__line absolute inset-x-[7%] top-1/2 border-t border-[#f1d28e]/70" />
              <div className="absolute left-7 top-7 rounded-full border border-white/25 bg-[#1b2b24]/75 px-4 py-2 text-[9px] font-bold uppercase tracking-[.17em] text-[#fff8e9] backdrop-blur-md">
                Explora el territorio
              </div>
              <div className="absolute bottom-7 left-7 max-w-[12rem] text-[#fff8e9]">
                <p className="font-serif text-4xl leading-none">360°</p>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/65">Perspectiva del paisaje</p>
              </div>
              <span className="absolute bottom-7 right-7 flex size-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-[#f1d28e] backdrop-blur-md">
                <MoveUpRight size={18} strokeWidth={1.5} />
              </span>
            </div>
          </div>

          <div className="territory-metrics mt-10 grid overflow-hidden rounded-2xl border border-[#556257]/20 bg-[#edf0e9]/85 shadow-[0_18px_50px_rgba(33,52,44,.08)] md:grid-cols-4">
            {metrics.map(({ icon: Icon, value, label }, index) => (
              <article
                key={label}
                data-reveal
                className="reveal-up group border-b border-[#556257]/15 p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:p-8"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-8 items-center justify-center rounded-full border border-[#b5863c]/35 text-[#9e742d] transition group-hover:bg-[#b5863c] group-hover:text-white">
                    <Icon size={15} strokeWidth={1.5} />
                  </span>
                  <span className="font-mono text-[9px] text-[#8a978c]">0{index + 1}</span>
                </div>
                <p className="mt-7 font-serif text-[clamp(2rem,3vw,3rem)] leading-none tracking-[-.05em]">{value}</p>
                <p className="mt-3 max-w-[11rem] text-[10px] font-semibold uppercase leading-4 tracking-[.14em] text-[#4d574e]">
                  {label}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="territory-story px-6 py-24 md:px-12 md:py-32 xl:px-20">
        <div className="mx-auto grid max-w-[1700px] gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
          <div data-reveal className="reveal-up order-2 max-w-xl lg:order-1">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#a47c3a]">Diseñado con el territorio</p>
            <h2 className="mt-5 text-[clamp(2.7rem,4.8vw,5.6rem)] leading-[.9] tracking-[-.06em]">
              El proyecto empieza
              <br />
              <i className="font-serif">antes del plano.</i>
            </h2>
            <p className="mt-8 max-w-md text-base leading-7 text-black/60 md:text-lg md:leading-8">
              Cada lote se lee a partir de su luz, vegetación, acceso y relación con el paisaje. La tecnología hace visible esa información.
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
                  <span className="ml-auto pt-1 font-mono text-[10px] text-[#a47c3a]">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal className="reveal-up reveal-up--late relative order-1 min-h-[460px] lg:order-2 lg:min-h-[640px]">
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
