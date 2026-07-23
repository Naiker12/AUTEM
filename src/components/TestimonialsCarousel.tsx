import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote, ShieldCheck, TrendingUp, Building, Award } from "lucide-react";

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  location: string;
  project: string;
  projectZone: string;
  rating: number;
  yieldReturn: string;
  avatar: string;
}

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: "1",
    quote:
      "Comprar desde Bogotá sin haber viajado a Cartagena daba temor, pero el tour 3D interactivo y la maqueta AR en mi sala nos dieron el 100% de confianza. Hoy Residencia Azure en Bocagrande produce un 14.8% EA en rentas cortas.",
    author: "Dra. María Elena Vargas",
    role: "Inversionista Médica",
    location: "Bogotá, Colombia",
    project: "Residencia Azure",
    projectZone: "Bocagrande, Cartagena",
    rating: 5,
    yieldReturn: "14.8% Renta Corta",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "2",
    quote:
      "AUTEM entiende el mercado del Caribe como nadie. Adquirí un penthouse en The Horizon Suite y la valorización durante el periodo de construcción superó el 22%. La gestión fiduciaria nos brindó total tranquilidad legal.",
    author: "Carlos E. Restrepo",
    role: "Socio Fundador Equity Capital",
    location: "Medellín, Colombia",
    project: "The Horizon Suite",
    projectZone: "Manga, Cartagena",
    rating: 5,
    yieldReturn: "+22% Valorización",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "3",
    quote:
      "Buscábamos un refugio campestre sostenible cerca de Cartagena y el proyecto Eco-Refugio Turbaco superó nuestras expectativas. Clima fresco a 200 msnm, rodeado de naturaleza y a 20 minutos de la ciudad. Una joya única.",
    author: "Sophia & Marc Dupont",
    role: "Arquitectos & Diseñadores",
    location: "Miami / París",
    project: "Eco-Refugio Turbaco",
    projectZone: "Turbaco, Bolívar",
    rating: 5,
    yieldReturn: "Casa de Descanso",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "4",
    quote:
      "La integración del modelo 3D con las licencias turísticas de Airbnb-Ready es el futuro del real estate en Cartagena. Mi propiedad en Eco-Villa Sierra está rentando desde el primer mes de entrega.",
    author: "Alejandro Mendoza",
    role: "Empresario Inmobiliario",
    location: "Monterrey, México",
    project: "Eco-Villa Sierra",
    projectZone: "Castillogrande, Cartagena",
    rating: 5,
    yieldReturn: "15.2% Yield Neto",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
];

const INVESTMENT_HIGHLIGHTS = [
  {
    icon: TrendingUp,
    title: "Alta Rentabilidad Turística",
    subtitle: "Rentas Cortas (Airbnb/Booking)",
    desc: "Proyectos en zonas de alta demanda en Cartagena con retornos estimados entre 12% y 16% EA.",
  },
  {
    icon: ShieldCheck,
    title: "Garantía Fiduciaria & Legal",
    subtitle: "Patrimonio Autónomo",
    desc: "Tus recursos son administrados por fiduciarias vigiladas por la Superintendencia Financiera.",
  },
  {
    icon: Building,
    title: "Plusvalía sobre Planos",
    subtitle: "Valorización Asegurada",
    desc: "Aumento progresivo del m² estimado entre 18% y 25% durante la fase de desarrollo del proyecto.",
  },
  {
    icon: Award,
    title: "Licencias Turísticas Activas",
    subtitle: "Operación 100% Legal",
    desc: "Propiedades estructuradas con permisos de explotación turística comercial e industrial.",
  },
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoplay]);

  const handlePrev = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS_DATA.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };

  const current = TESTIMONIALS_DATA[currentIndex];

  return (
    <div className="w-full">
      {/* Investment Highlights Grid */}
      <div className="mb-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {INVESTMENT_HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group relative rounded-2xl border border-stone-200/80 bg-stone-50/50 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-stone-900 hover:text-white hover:shadow-xl dark:border-stone-800/80 dark:bg-stone-900/50"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-stone-950">
                <Icon size={24} />
              </div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-accent">
                {item.subtitle}
              </span>
              <h3 className="mt-1 font-serif text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground group-hover:text-stone-300">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Testimonial Carousel Box */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-900 text-stone-100 p-8 md:p-14 shadow-2xl dark:border-stone-800">
        
        {/* Background Decorative Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10">
          
          {/* Header Tag & Stars */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                Inversionistas Verificados
              </span>
              <span className="hidden sm:inline text-stone-500">•</span>
              <span className="text-xs text-stone-400 font-medium">{current.projectZone}</span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(current.rating)].map((_, i) => (
                <Star key={i} size={16} className="fill-amber-400" />
              ))}
            </div>
          </div>

          {/* Testimonial Quote Content */}
          <div className="my-8 flex gap-6">
            <Quote size={48} className="hidden sm:block shrink-0 text-accent/30" />
            <div>
              <p className="font-serif text-xl font-light italic leading-relaxed text-stone-100 md:text-2xl lg:text-3xl">
                "{current.quote}"
              </p>
            </div>
          </div>

          {/* Footer: Author Info & Controls */}
          <div className="mt-8 flex flex-col gap-6 border-t border-stone-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Author Profile */}
            <div className="flex items-center gap-4">
              <img
                src={current.avatar}
                alt={current.author}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border-2 border-accent/40 object-cover shadow-lg"
              />
              <div>
                <h4 className="font-serif text-lg font-medium text-white">{current.author}</h4>
                <p className="text-xs text-stone-400">
                  {current.role} · <span className="text-stone-300">{current.location}</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-block rounded bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    Proyecto: {current.project}
                  </span>
                  <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {current.yieldReturn}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls: Prev / Next & Bullets */}
            <div className="flex items-center gap-4 self-end sm:self-auto">
              
              {/* Pagination Dots */}
              <div className="flex items-center gap-2 pr-2">
                {TESTIMONIALS_DATA.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setIsAutoplay(false);
                      setCurrentIndex(idx);
                    }}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === currentIndex ? "w-8 bg-accent" : "w-2.5 bg-stone-700 hover:bg-stone-500"
                    }`}
                    aria-label={`Ir al testimonio ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev Button */}
              <button
                onClick={handlePrev}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-700 bg-stone-800 text-stone-300 transition-all hover:border-accent hover:bg-accent hover:text-stone-950 active:scale-95"
                aria-label="Testimonio anterior"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-700 bg-stone-800 text-stone-300 transition-all hover:border-accent hover:bg-accent hover:text-stone-950 active:scale-95"
                aria-label="Testimonio siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
