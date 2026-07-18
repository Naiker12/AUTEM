import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import heroVilla from "@/assets/hero-villa.jpg";
import propertyAzure from "@/assets/property-azure.jpg";
import propertySierra from "@/assets/property-sierra.jpg";
import propertyHorizon from "@/assets/property-horizon.jpg";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import MagneticButton from "@/components/MagneticButton";
import ARExperience from "@/components/ARExperience";
import { properties } from "@/data/properties";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: "AUTEM Real Estate",
          description:
            "Bienes raíces en Cartagena con visualización 3D, tours virtuales y realidad aumentada.",
          areaServed: "Colombia",
        }),
      },
    ],
  }),
});

const featuredSlugs = ["residencia-azure", "eco-villa-sierra", "the-horizon-suite"];
const featuredProperties = properties.filter((p) => featuredSlugs.includes(p.slug));

const featuredOffsets = ["", "md:translate-y-12", ""];

const stats = [
  { value: "120+", label: "Proyectos entregados" },
  { value: "85k", label: "m² construidos" },
  { value: "98%", label: "Clientes satisfechos" },
  { value: "15", label: "Años de experiencia" },
];

const testimonials = [
  {
    quote:
      "El tour virtual y la experiencia AR fueron decisivos. Compramos sin haber pisado la propiedad — y superó cada expectativa.",
    author: "María Elena Vargas",
    role: "Inversionista, Bogotá",
  },
  {
    quote: "Un nivel de asesoría privado y sofisticado. AUTEM entiende la arquitectura como pocos.",
    author: "James Whitmore",
    role: "Coleccionista de arte, Medellín",
  },
];

const navItems = [
  { href: "#proyectos", label: "Proyectos" },
  { href: "#tecnologia", label: "Experiencia 3D" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#contacto", label: "Contacto" },
];

function Index() {
  const [contactStatus, setContactStatus] = useState<"idle" | "sent">("idle");
  const [showLoader, setShowLoader] = useState(true);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [cursorVariant, setCursorVariant] = useState<"default" | "hover">("default");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  const whatsappUrl =
    "https://wa.me/573007200894?text=" +
    encodeURIComponent("Hola AUTEM, me interesa conocer más sobre sus proyectos.");

  // Page loader
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  // Custom cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 12}px)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 2}px)`;
      }
    };
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, input, textarea, [data-cursor-hover]")) {
        setCursorVariant("hover");
      } else {
        setCursorVariant("default");
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  // Parallax hero
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      if (heroRef.current) {
        const bg = heroRef.current.querySelector(".parallax-slow") as HTMLElement;
        const fg = heroRef.current.querySelector(".parallax-fast") as HTMLElement;
        if (bg) bg.style.transform = `translateY(${scrolled * 0.3}px)`;
        if (fg) fg.style.transform = `translateY(${scrolled * 0.15}px)`;
      }

      // Intersection-based color transitions between sections
      sectionsRef.current.forEach((section) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.75 && rect.bottom > 0;
        if (isVisible && section.dataset.section) {
          // Could trigger section-specific animations here
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Exit intent popup
  useEffect(() => {
    if (showLoader) return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("exitPopupShown")) {
        setShowExitPopup(true);
        sessionStorage.setItem("exitPopupShown", "true");
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [showLoader]);

  // Section fade-in observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [showLoader]);

  // Comparison slider logic
  useEffect(() => {
    const clip = document.getElementById("comparison-clip");
    const handle = document.getElementById("comparison-handle");
    if (!clip || !handle) return;

    let isDragging = false;

    const updateSlider = (clientX: number) => {
      const rect = clip.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      clip.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
      handle.style.left = `${percentage}%`;
    };

    const onMouseDown = () => {
      isDragging = true;
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      updateSlider(e.touches[0].clientX);
    };

    handle.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    handle.addEventListener("touchstart", onMouseDown, { passive: true });
    window.addEventListener("touchend", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // Allow clicking anywhere on the image to move slider
    const container = clip.parentElement;
    if (container) {
      container.addEventListener("click", (e) => {
        updateSlider(e.clientX);
      });
    }

    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      handle.removeEventListener("touchstart", onMouseDown);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      {/* Page Loader / Curtain */}
      {showLoader && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary">
          <div className="curtain-sweep absolute inset-0 bg-accent/10" />
          <div className="relative z-10 text-center">
            <span className="logo-glow font-serif text-5xl italic tracking-tight text-accent md:text-7xl">
              AUTEM
            </span>
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/40">
              Bienes raíces en Cartagena
            </p>
            <div className="mx-auto mt-8 h-px w-16 bg-accent/50" />
          </div>
        </div>
      )}

      {/* Custom Cursor (only on desktop) */}
      <div
        ref={cursorRef}
        className={`custom-cursor hidden md:block ${cursorVariant === "hover" ? "is-hovering" : ""}`}
      />
      <div ref={dotRef} className="custom-cursor-dot hidden md:block" />

      {/* Navigation */}
      <Navbar variant="home" />

      <main id="main-content">
        {/* Hero */}
        <section
          ref={heroRef}
          id="top"
          className="relative flex h-screen min-h-[720px] flex-col items-center justify-center overflow-hidden px-6 text-center"
        >
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster={heroVilla}
              className="parallax-slow h-full w-full object-cover"
            >
              <source src={`${import.meta.env.BASE_URL}video-del-hero.mp4`} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="parallax-fast relative z-10 max-w-4xl">
            <span className="animate-fade-up mb-6 inline-block text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
              AUTEM · Real Estate
            </span>
            <h1 className="animate-fade-up delay-100 mb-8 font-serif text-5xl leading-[0.95] text-white md:text-7xl lg:text-8xl">
              Arquitectura <br />
              <span className="italic">sin fronteras</span>
            </h1>
            <p className="animate-fade-up delay-200 mx-auto mb-12 max-w-md text-base font-light leading-relaxed text-white/80 md:text-lg">
              Propiedades que puedes recorrer, personalizar y ver en tu propio espacio antes de que
              exista la primera piedra.
            </p>

            {/* Search Bar */}
            <div className="animate-fade-up delay-300 mx-auto flex max-w-3xl flex-col items-stretch gap-2 rounded-full bg-white p-2 shadow-2xl md:flex-row md:items-center">
              <div className="hidden flex-1 border-r border-stone-100 px-6 text-left md:block">
                <span className="block text-[10px] uppercase tracking-tighter text-stone-400">
                  Ubicación
                </span>
                <span className="text-sm font-medium text-foreground">Caribe Colombiano</span>
              </div>
              <div className="hidden flex-1 border-r border-stone-100 px-6 text-left md:block">
                <span className="block text-[10px] uppercase tracking-tighter text-stone-400">
                  Inversión
                </span>
                <span className="text-sm font-medium text-foreground">$500K – $2.5M</span>
              </div>
              <MagneticButton
                strength={0.2}
                className="w-full rounded-full bg-primary px-10 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:w-auto"
              >
                <a href="#proyectos">Explorar proyectos</a>
              </MagneticButton>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="parallax-fast absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] uppercase tracking-[0.3em] text-white/40">Scroll</span>
              <div className="h-8 w-px bg-gradient-to-b from-accent to-transparent" />
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section
          id="proyectos"
          data-animate
          className="mx-auto max-w-7xl px-6 py-24 opacity-0 md:px-8 md:py-32"
        >
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Disponibles ahora
              </span>
              <h2 className="mt-2 font-serif text-4xl md:text-5xl">Proyectos destacados</h2>
            </div>
            <a
              href={`${import.meta.env.BASE_URL}catalogo`}
              className="self-start border-b border-primary pb-1 text-sm uppercase tracking-widest md:self-end"
            >
              Ver catálogo completo →
            </a>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {featuredProperties.map((p, i) => (
              <a
                key={p.slug}
                href={`/properties/${p.slug}`}
                className={`group block cursor-pointer ${featuredOffsets[i] || ""}`}
              >
                <div className="relative mb-6 aspect-[3/4] overflow-hidden bg-muted-warm">
                  <img
                    src={p.image}
                    alt={p.name}
                    width={800}
                    height={1066}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ animation: "ken-burns 20s ease-in-out infinite alternate" }}
                  />
                  {p.tags.length > 0 && (
                    <div className="absolute left-4 top-4 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur-sm">
                      {p.tags[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-500 group-hover:bg-black/30">
                    <span className="translate-y-4 text-sm font-medium uppercase tracking-widest text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      Ver propiedad →
                    </span>
                  </div>
                </div>
                <h3 className="font-serif text-2xl">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between text-sm font-light text-muted-foreground">
                  <span>
                    {p.location} · {p.m2} m²
                  </span>
                  <span className="font-medium text-foreground">{p.price}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Immersive Tech / AR */}
        <ARExperience />

        {/* Before/After Comparison Slider */}
        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Transformación
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">Antes y después</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Arrastra el slider para ver la transformación
            </p>
          </div>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted-warm">
            {/* Before image (base) */}
            <img
              src={`${import.meta.env.BASE_URL}antes.png`}
              alt="Terreno vacío antes de la construcción"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {/* After image (clipped) */}
            <div
              id="comparison-clip"
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            >
              <img
                src={`${import.meta.env.BASE_URL}despues.png`}
                alt="Propiedad terminada"
                loading="lazy"
                className="h-full w-full object-cover"
                style={{ width: "100vw", maxWidth: "100%" }}
              />
            </div>
            {/* Slider handle */}
            <div
              id="comparison-handle"
              className="absolute top-0 bottom-0 left-1/2 z-10 w-1 cursor-ew-resize bg-accent"
              style={{ transform: "translateX(-50%)" }}
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-accent shadow-2xl">
                <svg
                  className="size-6 text-accent-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                  />
                </svg>
              </div>
            </div>
            {/* Labels */}
            <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-widest text-white backdrop-blur-sm">
              Antes
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] uppercase tracking-widest text-accent-foreground backdrop-blur-sm">
              Después
            </div>
          </div>
        </section>

        {/* Drone Scan / Video */}
        <section
          data-animate
          className="relative overflow-hidden bg-[#0B0B0C] py-24 text-white opacity-0 md:py-32"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-5 md:px-8">
            <div className="md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Escaneo aéreo
              </span>
              <h2 className="mt-6 font-serif text-4xl leading-tight md:text-5xl lg:text-6xl">
                Drones que <span className="italic text-accent">cartografían</span> tu terreno.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-white/60">
                Cada proyecto inicia con un vuelo LiDAR de precisión centimétrica. Reconstruimos el
                sitio en 3D, detectamos zonas de valor y proyectamos el edificio final sobre la
                topografía real.
              </p>

              <ul className="mt-10 space-y-4 text-sm">
                {[
                  { k: "01", v: "Vuelo autónomo · malla LiDAR" },
                  { k: "02", v: "Análisis solar y de vistas" },
                  { k: "03", v: "Render final sobre el terreno" },
                ].map((item) => (
                  <li key={item.k} className="flex items-start gap-4 border-t border-white/10 pt-4">
                    <span className="font-serif italic text-accent">{item.k}</span>
                    <span className="text-white/80">{item.v}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Video Panel */}
            <div className="relative md:col-span-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#101015] to-[#050506] outline outline-1 -outline-offset-1 outline-white/10">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={`${import.meta.env.BASE_URL}antes.png`}
                  className="absolute inset-0 h-full w-full object-cover"
                >
                  <source src={`${import.meta.env.BASE_URL}video-del-panel.mp4`} type="video/mp4" />
                </video>

                {/* HUD Overlays */}
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-widest backdrop-blur-sm">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-accent" />
                  Escaneando en vivo
                </div>
                <div className="absolute bottom-4 left-4 flex gap-6 text-[10px] uppercase tracking-widest text-white/60">
                  <span>
                    Altitud <span className="text-accent">120m</span>
                  </span>
                  <span>
                    Vel <span className="text-accent">6.4m/s</span>
                  </span>
                  <span>
                    Cobertura <span className="text-accent">72%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partners marquee */}
        <section
          data-animate
          className="border-y border-border bg-background py-10 opacity-0 overflow-hidden"
        >
          <div className="mx-auto mb-6 max-w-7xl px-6 md:px-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Colaboradores · Estudios · Prensa
            </span>
          </div>
          <div className="relative">
            <div className="marquee-track flex w-max gap-16 whitespace-nowrap px-6 font-serif text-3xl tracking-tight text-muted-foreground md:text-4xl">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex gap-16 pr-16">
                  {[
                    "Foster + Partners",
                    "BIG",
                    "Zaha Hadid",
                    "Herzog & de Meuron",
                    "Wallpaper*",
                    "Architectural Digest",
                    "Dezeen",
                    "Sotheby's",
                  ].map((n) => (
                    <span
                      key={n}
                      className="italic opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section data-animate className="border-b border-border opacity-0">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-12 px-6 py-20 md:grid-cols-4 md:px-8 md:py-24">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="mb-2 font-serif text-4xl text-accent md:text-5xl">{s.value}</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section
          id="nosotros"
          data-animate
          className="mx-auto max-w-7xl px-6 py-24 opacity-0 md:px-8 md:py-32"
        >
          <h2 className="max-w-3xl font-serif text-4xl md:text-5xl">
            Clientes que ya invirtieron con nosotros.
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
            {testimonials.map((t) => (
              <blockquote key={t.author} className="border-t border-border pt-8">
                <p className="font-serif text-2xl italic leading-snug md:text-3xl">"{t.quote}"</p>
                <footer className="mt-6 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t.author}</span> — {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Contact / CTA */}
        <section id="contacto" data-animate className="bg-muted-warm/30 py-24 opacity-0 md:py-32">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 md:grid-cols-2 md:px-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Contacto privado
              </span>
              <h2 className="mt-2 font-serif text-4xl leading-tight md:text-6xl">
                Hablemos de tu próxima inversión.
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground">
                Asesoría personalizada. Un especialista se pondrá en contacto contigo en menos de 24
                horas.
              </p>
            </div>

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                if (formData.get("website")) return;
                setContactStatus("sent");
                const data = {
                  name: formData.get("name") as string,
                  email: formData.get("email") as string,
                  message: formData.get("message") as string,
                };
                fetch("https://api.emailjs.com/api/v1.0/email/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    service_id: "service_default",
                    template_id: "template_contact",
                    user_id: "user_placeholder",
                    template_params: {
                      from_name: data.name,
                      from_email: data.email,
                      message: data.message,
                      to_name: "Equipo AUTEM",
                    },
                  }),
                }).catch(() => {});
              }}
            >
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label htmlFor="website">No llenes esto</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Nombre
                </label>
                <input
                  required
                  maxLength={100}
                  name="name"
                  type="text"
                  className="mt-2 w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Correo electrónico
                </label>
                <input
                  required
                  maxLength={255}
                  name="email"
                  type="email"
                  className="mt-2 w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Mensaje
                </label>
                <textarea
                  maxLength={1000}
                  name="message"
                  rows={3}
                  className="mt-2 w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                />
              </div>
              <MagneticButton
                type="submit"
                strength={0.15}
                className="w-full bg-primary px-12 py-5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground md:w-auto"
              >
                {contactStatus === "sent" ? "✓ Mensaje enviado" : "Agendar consultoría"}
              </MagneticButton>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* WhatsApp Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-whatsapp px-5 py-4 text-white shadow-2xl transition-transform hover:scale-105"
      >
        <span className="pulse-ring relative flex size-6 items-center justify-center">
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          </svg>
        </span>
        <span className="hidden text-xs font-medium uppercase tracking-widest sm:inline">
          Asesor en línea
        </span>
      </a>

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="popup-enter mx-4 max-w-lg rounded-2xl bg-background p-10 shadow-2xl md:p-14">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              ¿Te vas tan pronto?
            </span>
            <h3 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
              Descarga nuestro brochure con renders, planos y detalles
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Déjanos tu correo y te enviaremos nuestro portafolio completo con renders, planos y
              detalles de inversión.
            </p>
            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setShowExitPopup(false);
              }}
            >
              <input
                required
                type="email"
                placeholder="Tu correo electrónico"
                className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none"
              />
              <div className="flex gap-3">
                <MagneticButton
                  type="submit"
                  strength={0.15}
                  className="flex-1 bg-primary px-6 py-4 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  Recibir brochure
                </MagneticButton>
                <button
                  type="button"
                  onClick={() => setShowExitPopup(false)}
                  className="border border-border px-6 py-4 text-xs uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
                >
                  No, gracias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
