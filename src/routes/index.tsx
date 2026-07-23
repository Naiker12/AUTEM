import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContactForm } from "@/hooks/useContactForm";
import { useModalA11y } from "@/hooks/useModalA11y";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import {
  contactSchema,
  brochureSchema,
  type ContactFormData,
  type BrochureFormData,
} from "@/lib/validation";
import heroVilla from "@/assets/hero-villa.jpg";
import propertyAzure from "@/assets/property-azure.jpg";
import propertySierra from "@/assets/property-sierra.jpg";
import propertyHorizon from "@/assets/property-horizon.jpg";
import Navbar from "@/components/Navbar";
import PiePagina, { BotonWhatsappFlotante } from "@/components/pie-pagina";
import PropertyCard from "@/components/PropertyCard";
import MagneticButton from "@/components/MagneticButton";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import ARExperience from "@/components/ARExperience";
import EntryLoader3D, {
  LoaderOverlay,
  SCENE_VISIBLE_DURATION_MS,
  LOADER_TEXT_DURATION_MS,
} from "@/components/entry-loader";
import { BeforeAfterSlider } from "@/components/before-after";
import DroneScanSection from "@/components/DroneScanSection";
import AnimatedSectionDivider from "@/components/AnimatedSectionDivider";
import HeroCarousel from "@/components/HeroCarousel";
import HeroSearchBar from "@/components/HeroSearchBar";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import SeccionContacto from "@/components/contacto";
import { properties } from "@/data/properties";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    links: [{ rel: "canonical", href: "https://autem.es/" }],
    meta: [
      {
        property: "og:image",
        content: `${import.meta.env.BASE_URL}antes.png`,
      },
      {
        name: "twitter:image",
        content: `${import.meta.env.BASE_URL}antes.png`,
      },
    ],
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

const featuredSlugs = [
  "residencia-azure",
  "eco-villa-sierra",
  "the-horizon-suite",
  "eco-refugio-turbaco",
  "casa-campestre",
  "villa-del-carmen",
];
const featuredProperties = featuredSlugs
  .map((slug) => properties.find((p) => p.slug === slug))
  .filter((p): p is typeof properties[0] => p !== undefined);

const stats = [
  { value: "120+", label: "Proyectos entregados" },
  { value: "85k", label: "m² construidos" },
  { value: "98%", label: "Clientes satisfechos" },
  { value: "15", label: "Años de experiencia" },
];

const navItems = [
  { href: "#proyectos", label: "Proyectos" },
  { href: "#tecnologia", label: "Experiencia 3D" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#contacto", label: "Contacto" },
];

function Index() {
  const contactForm = useContactForm();
  const brochureForm = useContactForm(
    "Hola AUTEM, me gustaría recibir el brochure con renders, planos y detalles de inversión.",
  );

  const {
    register: registerContact,
    handleSubmit: validateContact,
    formState: { errors: contactErrors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const {
    register: registerBrochure,
    handleSubmit: validateBrochure,
    formState: { errors: brochureErrors },
  } = useForm<BrochureFormData>({
    resolver: zodResolver(brochureSchema),
  });
  const [showLoader, setShowLoader] = useState(true);
  const [hideModel, setHideModel] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const exitPopupRef = useModalA11y(showExitPopup, () => setShowExitPopup(false));
  const [cursorVariant, setCursorVariant] = useState<"default" | "hover">("default");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const loaderContainerRef = useRef<HTMLDivElement>(null);
  const [modelVisible, setModelVisible] = useState(false);

  const [loadProgress, setLoadProgress] = useState(0);

  const handleModelLoaded = () => {
    setModelVisible(true);
    setTimeout(() => setShowLoader(false), LOADER_TEXT_DURATION_MS);
  };

  // Fade out the loader model after the cinematic animation completes
  useEffect(() => {
    if (!modelVisible) return;
    const timer = setTimeout(() => setHideModel(true), SCENE_VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [modelVisible]);

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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      {/* 3D Model — persistent, never destroyed (stays alive for AR cache) */}
      <div
        ref={loaderContainerRef}
        className={`fixed inset-0 z-[9998] overflow-hidden transition-opacity duration-[1000ms] ${
          hideModel ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          background: "radial-gradient(ellipse at center, #141414 0%, #0a0a0a 60%, #050505 100%)",
        }}
      >
        <EntryLoader3D
          modelUrl={`${import.meta.env.BASE_URL}models/the-horizon-suite.glb`}
          onProgress={setLoadProgress}
          onLoaded={handleModelLoaded}
        />
      </div>

      {/* Page Loader / Overlay */}
      <LoaderOverlay
        showLoader={showLoader}
        modelVisible={modelVisible}
        loadProgress={loadProgress}
      />

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
          <HeroCarousel />

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
            <HeroSearchBar />
          </div>

          {/* Scroll indicator with descending animated gold laser thread */}
          <div className="parallax-fast absolute -bottom-10 left-1/2 z-20 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] font-bold uppercase tracking-[0.35em] text-accent/80 animate-pulse">
                Scroll
              </span>
              <div className="relative h-24 w-[1.5px] bg-gradient-to-b from-accent via-amber-400 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 blur-[0.5px] animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Animated Gold Laser Divider line connecting Hero to Proyectos */}
        <AnimatedSectionDivider className="mt-8" />

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

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 md:gap-10">
            {featuredProperties.map((p) => (
              <PropertyCard key={p.slug} property={p} />
            ))}
          </div>
        </section>

        {/* Animated Gold Laser Divider Line */}
        <AnimatedSectionDivider />

        {/* Immersive Tech / AR */}
        <ARExperience />

        {/* Animated Gold Divider Line */}
        <AnimatedSectionDivider />

        {/* Before/After Comparison Slider */}
        <section data-animate className="mx-auto max-w-7xl px-6 py-16 opacity-0 md:px-8 md:py-24">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Transformación
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">Antes y después</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Arrastra o haz clic en cualquier punto para ver la transformación del proyecto
            </p>
          </div>

          <BeforeAfterSlider
            beforeSrc={`${import.meta.env.BASE_URL}antes.png`}
            afterSrc={`${import.meta.env.BASE_URL}despues.png`}
            beforeAlt="Terreno en su estado inicial antes de la construcción"
            afterAlt="Propiedad de lujo AUTEM construida y terminada"
            beforeLabel="Antes"
            afterLabel="Después"
          />
        </section>

        {/* Animated Gold Divider Line */}
        <AnimatedSectionDivider />

        {/* Drone Scan / Video */}
        <DroneScanSection />

        {/* Partners marquee */}
        <section
          data-animate
          className="border-y border-stone-200/80 dark:border-stone-800/80 bg-stone-100/40 dark:bg-stone-900/30 py-5 opacity-0 overflow-hidden"
        >
          <div className="mx-auto mb-3 max-w-7xl px-6 md:px-8">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent">
              Colaboradores · Estudios · Prensa
            </span>
          </div>
          <div className="relative">
            <div className="marquee-track flex w-max gap-12 whitespace-nowrap px-6 text-sm font-serif font-light tracking-[0.15em] text-stone-500 dark:text-stone-400 md:text-base">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex gap-12 pr-12">
                  {[
                    "Foster + Partners",
                    "BIG",
                    "Zaha Hadid",
                    "Herzog & de Meuron",
                    "Wallpaper*",
                    "Architectural Digest",
                    "Dezeen",
                    "Sotheby's Realty",
                  ].map((n) => (
                    <span
                      key={n}
                      className="italic opacity-70 hover:opacity-100 hover:text-accent transition-all cursor-default"
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
        <section data-animate className="border-b border-border opacity-0 py-10 md:py-12">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 md:grid-cols-4 md:gap-6 md:px-8">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group relative flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/60 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:bg-stone-900 hover:text-white hover:shadow-[0_12px_30px_rgba(197,160,89,0.18)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-3xl font-bold text-accent transition-transform duration-300 group-hover:scale-105 md:text-4xl">
                    {s.value}
                  </span>
                  <div className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent/40 opacity-0 group-hover:animate-ping group-hover:opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent/60 group-hover:bg-accent" />
                  </div>
                </div>
                <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500 transition-colors group-hover:text-stone-300">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials & Real Estate Investment Highlights */}
        <section
          id="nosotros"
          data-animate
          className="mx-auto max-w-7xl px-6 py-24 opacity-0 md:px-8 md:py-32"
        >
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Confianza & Valorización en Cartagena
            </span>
            <h2 className="mt-3 mx-auto max-w-3xl font-serif text-4xl leading-tight md:text-5xl lg:text-6xl">
              Inversionistas que eligieron la arquitectura del futuro.
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base text-muted-foreground font-light">
              Descubre los testimonios verificados de compradores e inversionistas que adquirieron propiedades exclusivas en Cartagena y Bolívar a través de nuestra experiencia 3D y AR.
            </p>
          </div>

          <TestimonialsCarousel />
        </section>

        {/* Sección de Contacto Privado & Consultoría */}
        <SeccionContacto />
      </main>

      {/* Footer / Pie de Página */}
      <PiePagina />

      {/* Botón Flotante de WhatsApp VIP */}
      <BotonWhatsappFlotante />

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div
          ref={exitPopupRef}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Descarga nuestro brochure"
        >
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
                validateBrochure((data) => {
                  brochureForm.handleSubmit({ email: data.email });
                })(e);
              }}
            >
              <div>
                <input
                  {...registerBrochure("email")}
                  type="email"
                  placeholder="Tu correo electrónico"
                  className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none"
                />
                {brochureErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{brochureErrors.email.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <MagneticButton
                  type="submit"
                  strength={0.15}
                  disabled={brochureForm.status === "sending"}
                  className="flex-1 bg-primary px-6 py-4 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  {brochureForm.status === "sent"
                    ? "✓ Enviado por WhatsApp"
                    : brochureForm.status === "sending"
                      ? "Abriendo WhatsApp..."
                      : brochureForm.status === "error"
                        ? "Error — intentar de nuevo"
                        : "Recibir brochure"}
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
