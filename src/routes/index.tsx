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
import Navbar from "@/components/Navbar";
import PiePagina, { BotonWhatsappFlotante } from "@/components/pie-pagina";
import MagneticButton from "@/components/MagneticButton";
import EntryLoader3D, {
  LoaderOverlay,
  SCENE_VISIBLE_DURATION_MS,
  LOADER_TEXT_DURATION_MS,
  MIN_LOADER_DISPLAY_MS,
} from "@/components/entry-loader";
import HomeHeroSection from "@/components/home/HomeHeroSection";
import EditorialHomeSections from "@/components/home/EditorialHomeSections";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    links: [{ rel: "canonical", href: "https://autem.es/" }],
    meta: [
      {
        property: "og:image",
        content: `${import.meta.env.BASE_URL}projects/lotes-360/panoramica-render.png`,
      },
      {
        name: "twitter:image",
        content: `${import.meta.env.BASE_URL}projects/lotes-360/panoramica-render.png`,
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
  const loaderContainerRef = useRef<HTMLDivElement>(null);
  const mountTimeRef = useRef(performance.now());
  const [modelVisible, setModelVisible] = useState(false);

  const [loadProgress, setLoadProgress] = useState(0);

  const handleModelLoaded = () => {
    const elapsed = performance.now() - mountTimeRef.current;
    const remainingDelay = Math.max(0, MIN_LOADER_DISPLAY_MS - elapsed);

    setTimeout(() => {
      setLoadProgress(100);
      setModelVisible(true);
      setTimeout(() => setShowLoader(false), LOADER_TEXT_DURATION_MS);
    }, remainingDelay);
  };

  // Prevent scrolling during loader animation and scroll to top on reload
  useEffect(() => {
    if (!hideModel) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [hideModel]);

  // Fade out the loader model after the cinematic animation completes
  useEffect(() => {
    if (!modelVisible) return;
    const timer = setTimeout(() => setHideModel(true), SCENE_VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [modelVisible]);

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
    <div className="home-page min-h-screen font-sans text-foreground selection:bg-accent/30">
      {/* 3D Model — persistent, never destroyed (stays alive for AR cache) */}
      <div
        ref={loaderContainerRef}
        className={`fixed inset-0 z-[9998] overflow-hidden transition-opacity duration-500 ${
          hideModel ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          background: "radial-gradient(ellipse at center, #141414 0%, #0a0a0a 60%, #050505 100%)",
        }}
      >
        <EntryLoader3D onProgress={setLoadProgress} onLoaded={handleModelLoaded} />
      </div>

      {/* Page Loader / Overlay */}
      <LoaderOverlay
        showLoader={showLoader}
        modelVisible={modelVisible}
        loadProgress={loadProgress}
      />

      {/* Navigation */}
      <Navbar variant="home" />

      <main id="main-content">
        <HomeHeroSection visible={hideModel} />
        <EditorialHomeSections />
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
