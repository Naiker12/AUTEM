import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContactForm } from "@/hooks/useContactForm";
import { Download, Smartphone } from "lucide-react";
import { properties, getPropertyById } from "@/data/properties";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { contactSchema, type ContactFormData } from "@/lib/validation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/MagneticButton";
import { ProjectGallery, ProjectFloorPlan, ProjectMap } from "@/components/projects";
import { getARModel } from "@/data/ar-models";

export const Route = createFileRoute("/properties/$id")({
  component: PropertyDetail,
  head: ({ params }) => ({
    links: [
      {
        rel: "canonical",
        href: `https://autem.es/properties/${params.id}`,
      },
    ],
    meta: [
      {
        property: "og:image",
        content: getPropertyById(params.id)?.image || `${import.meta.env.BASE_URL}antes.png`,
      },
      {
        name: "twitter:image",
        content: getPropertyById(params.id)?.image || `${import.meta.env.BASE_URL}antes.png`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: getPropertyById(params.id)?.name || "Propiedad",
          description: getPropertyById(params.id)?.description || "",
          url: `https://autem.es/properties/${params.id}`,
          image: getPropertyById(params.id)?.image || "",
          offers: {
            "@type": "Offer",
            price:
              getPropertyById(params.id)
                ?.price.replace("Desde ", "")
                .replace("$", "")
                .replace("M USD", "000000")
                .replace("K USD", "000") || "0",
            priceCurrency: "USD",
          },
        }),
      },
    ],
  }),
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const property = getPropertyById(id);
  const [mortgageAmount, setMortgageAmount] = useState(500000);
  const [mortgageYears, setMortgageYears] = useState(25);
  const [mortgageRate, setMortgageRate] = useState(3.5);
  const propertyContactForm = useContactForm();
  const {
    register: registerProp,
    handleSubmit: validateProp,
    formState: { errors: propErrors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Propiedad no encontrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            La propiedad que buscas no existe o ha sido eliminada.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = [property.image];

  const monthlyPayment =
    mortgageAmount > 0 && mortgageYears > 0 && mortgageRate > 0
      ? (mortgageAmount * (mortgageRate / 100 / 12)) /
        (1 - Math.pow(1 + mortgageRate / 100 / 12, -mortgageYears * 12))
      : 0;

  const whatsappUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent(
      `Hola AUTEM, me interesa la propiedad "${property.name}" en ${property.location}.`,
    );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      {/* Navigation */}
      <Navbar variant="inner" />

      <main id="main-content">
        {/* Gallery */}
        <section className="pt-24">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-accent"
            >
              ← Volver a proyectos
            </Link>
            <ProjectGallery property={property} />
          </div>
        </section>

        {/* Content Grid */}
        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Descripción
                </span>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl">{property.name}</h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  {property.longDescription}
                </p>
              </div>

              {/* Key Features */}
              <div className="mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Características
                </span>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {property.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background px-5 py-4"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">
                        ✓
                      </span>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floor Plan */}
              <div className="mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Distribución
                </span>
                <div className="mt-6 flex flex-wrap gap-8 rounded-lg border border-border bg-background px-8 py-6">
                  <div className="text-center">
                    <span className="block font-serif text-3xl text-accent">{property.m2} m²</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Superficie
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block font-serif text-3xl text-accent">
                      {property.bedrooms}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Habitaciones
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block font-serif text-3xl text-accent">
                      {property.bathrooms}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Baños
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block font-serif text-3xl text-accent">{property.year}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Año
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{property.floorPlan}</p>
                <div className="mt-6">
                  <ProjectFloorPlan property={property} />
                </div>
              </div>

              {/* Floor Plan PDF */}
              {property.floorPlanPdf && (
                <div className="mb-12">
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">
                    Planos y fachadas
                  </span>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Planta amueblada, planta técnica con medidas y las 4 fachadas del proyecto.
                  </p>
                  <div className="mt-6 overflow-hidden rounded-xl border border-border">
                    <iframe
                      src={property.floorPlanPdf}
                      title={`Planos de ${property.name}`}
                      className="h-[600px] w-full"
                    />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <a
                      href={property.floorPlanPdf}
                      download
                      className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
                    >
                      <Download size={14} />
                      Descargar PDF
                    </a>
                    <a
                      href={`${WHATSAPP_BASE_URL}?text=Hola%20AUTEM%2C%20me%20interesan%20los%20planos%20t%C3%A9cnicos%20(CAD%2FBIM)%20de%20esta%20propiedad.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
                    >
                      Solicitar planos técnicos (CAD/BIM)
                    </a>
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Ubicación & Entorno
                </span>
                <p className="mt-2 text-sm text-muted-foreground">
                  {property.location} · Cartagena, Bolívar, Colombia
                </p>
                <div className="mt-6">
                  <ProjectMap property={property} className="h-[360px] w-full" />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-8">
                {/* Price Card */}
                <div className="rounded-xl border border-border bg-background p-8">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Precio desde
                  </span>
                  <p className="mt-2 font-serif text-4xl text-accent">{property.price}</p>
                  <div className="mt-6 space-y-3">
                    <MagneticButton
                      strength={0.15}
                      className="flex w-full items-center justify-center gap-2 bg-primary px-6 py-4 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                    >
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        Agendar visita
                      </a>
                    </MagneticButton>
                    <a
                      href={`${import.meta.env.BASE_URL}#contacto`}
                      className="flex w-full items-center justify-center border border-border px-6 py-4 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
                    >
                      Solicitar información
                    </a>
                    {getARModel(property.slug) && (
                      <Link
                        to={`/ar/${property.slug}`}
                        className="flex w-full items-center justify-center gap-2 border border-border px-6 py-4 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
                      >
                        <Smartphone size={14} /> Ver en Realidad Aumentada
                      </Link>
                    )}
                    {property.floorPlanPdf && (
                      <a
                        href={property.floorPlanPdf}
                        download
                        className="flex w-full items-center justify-center gap-2 border border-border px-6 py-4 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
                      >
                        <Download size={14} />
                        Ficha técnica (PDF)
                      </a>
                    )}
                  </div>
                </div>

                {/* Mortgage Calculator */}
                <div className="rounded-xl border border-border bg-background p-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">
                    Calculadora
                  </span>
                  <h3 className="mt-2 font-serif text-xl">Hipoteca estimada</h3>
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>Monto</span>
                        <span>${mortgageAmount.toLocaleString()}</span>
                      </label>
                      <input
                        type="range"
                        min={100000}
                        max={3000000}
                        step={50000}
                        value={mortgageAmount}
                        onChange={(e) => setMortgageAmount(Number(e.target.value))}
                        className="mt-2 w-full accent-accent"
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>Plazo</span>
                        <span>{mortgageYears} años</span>
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={35}
                        step={1}
                        value={mortgageYears}
                        onChange={(e) => setMortgageYears(Number(e.target.value))}
                        className="mt-2 w-full accent-accent"
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>Interés</span>
                        <span>{mortgageRate}%</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={0.1}
                        value={mortgageRate}
                        onChange={(e) => setMortgageRate(Number(e.target.value))}
                        className="mt-2 w-full accent-accent"
                      />
                    </div>
                    <div className="border-t border-border pt-4">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Pago mensual estimado
                      </span>
                      <p className="font-serif text-2xl text-accent">
                        ${Math.round(monthlyPayment).toLocaleString()}
                        <span className="text-sm text-muted-foreground">/mes</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="rounded-xl border border-border bg-background p-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">
                    Contacto rápido
                  </span>
                  <h3 className="mt-2 font-serif text-xl">¿Te interesa?</h3>
                  <form
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      if (formData.get("website")) return;
                      validateProp((data) => {
                        propertyContactForm.handleSubmit({
                          name: data.name,
                          email: data.email,
                          phone: data.phone,
                          message: `Me interesa la propiedad "${property.name}" en ${property.location}.`,
                        });
                      })(e);
                    }}
                  >
                    <div className="absolute left-[-9999px]" aria-hidden="true">
                      <label htmlFor="property-website">No llenes esto</label>
                      <input
                        id="property-website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <input
                        {...registerProp("name")}
                        type="text"
                        placeholder="Nombre"
                        className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                      />
                      {propErrors.name && (
                        <p className="mt-1 text-xs text-red-500">{propErrors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <input
                        {...registerProp("email")}
                        type="email"
                        placeholder="Email"
                        className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                      />
                      {propErrors.email && (
                        <p className="mt-1 text-xs text-red-500">{propErrors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <input
                        {...registerProp("phone")}
                        type="tel"
                        placeholder="Teléfono"
                        className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                      />
                      {propErrors.phone && (
                        <p className="mt-1 text-xs text-red-500">{propErrors.phone.message}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={propertyContactForm.status === "sending"}
                      className="w-full bg-primary px-6 py-4 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                    >
                      {propertyContactForm.status === "sent"
                        ? "✓ Solicitud enviada"
                        : propertyContactForm.status === "sending"
                          ? "Abriendo WhatsApp..."
                          : propertyContactForm.status === "error"
                            ? "Error — intentar de nuevo"
                            : "Solicitar visita"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
