import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import propertyAzure from "@/assets/property-azure.jpg";
import propertySierra from "@/assets/property-sierra.jpg";
import propertyHorizon from "@/assets/property-horizon.jpg";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/MagneticButton";

export const Route = createFileRoute("/properties/$id")({
  component: PropertyDetail,
  head: ({ params }) => ({
    links: [{ rel: "canonical", href: `/properties/${params.id}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: getPropertyData(params.id)?.name || "Propiedad",
          description: getPropertyData(params.id)?.description || "",
          url: `https://autem.es/properties/${params.id}`,
          image: getPropertyData(params.id)?.image || "",
          offers: {
            "@type": "Offer",
            price:
              getPropertyData(params.id)
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

function getPropertyData(id: string) {
  const properties = {
    "residencia-azure": {
      name: "Residencia Azure",
      location: "Bocagrande, CO",
      price: "Desde $1.2M USD",
      m2: "320 m²",
      bedrooms: 4,
      bathrooms: 3,
      description:
        "Una residencia contemporánea con vistas panorámicas al Mar Caribe. Diseñada por arquitectos galardonados, esta propiedad combina líneas limpias con materiales naturales para crear un espacio de vida excepcional.",
      longDescription:
        "Situada en la zona de Bocagrande, Residencia Azure ofrece 320 m² distribuidos en dos plantas con amplios espacios abiertos, ventanales de suelo a techo que inundan cada habitación de luz natural, y una terraza infinita con piscina privada. Los acabados incluyen mármoles nacionales, carpintería en maderas tropicales y un sistema domótico inteligente que controla cada aspecto del hogar.",
      image: propertyAzure,
      features: [
        "Piscina infinita climatizada",
        "Domótica completa",
        "Vistas al mar",
        "Garaje para 3 vehículos",
        "Bodega privada",
        "Gimnasio equipado",
      ],
      floorPlan: "3 habitaciones + suite principal · 2 plantas · sótano",
      year: 2024,
    },
    "eco-villa-sierra": {
      name: "Eco-Villa Sierra",
      location: "Castillogrande, CO",
      price: "Desde $850K USD",
      m2: "410 m²",
      bedrooms: 5,
      bathrooms: 4,
      description:
        "Una villa sostenible integrada en la naturaleza de Castillogrande. Energía solar, sistemas de recolección de agua y materiales ecológicos se combinan con un diseño arquitectónico espectacular.",
      longDescription:
        "Eco-Villa Sierra es arquitectura sostenible en el Caribe colombiano. Construida con materiales reciclados y sistemas de energía renovable, esta propiedad de 410 m² se asienta sobre una parcela de 2,000 m² con vistas panorámicas al Cerro de la Popa. El diseño bioclimático maximiza la eficiencia energética mientras que los grandes ventanales difuminan la línea entre interior y exterior.",
      image: propertySierra,
      features: [
        "Certificación energética A",
        "Paneles solares",
        "Recolección de aguas pluviales",
        "Jardín nativo de bajo consumo",
        "Cocina exterior equipada",
        "Cargador para vehículo eléctrico",
      ],
      floorPlan: "4 habitaciones + suite · 3 plantas · azotea",
      year: 2025,
    },
    "the-horizon-suite": {
      name: "The Horizon Suite",
      location: "Manga, CO",
      price: "Desde $2.1M USD",
      m2: "540 m²",
      bedrooms: 6,
      bathrooms: 5,
      description:
        "6 suites, spa privado y acceso directo al Laguito en la Manga. Una propiedad de 540 m² con diseño vanguardista.",
      longDescription:
        "The Horizon Suite es la suite más completa de la Manga. Con 540 m² de espacios meticulosamente diseñados, esta propiedad ofrece seis suites con baño privado, un spa de 80 m² con sauna, baño turco y jacuzzi, y una terraza panorámica con piscina de borde infinito. La propiedad cuenta con acceso directo al Laguito y vistas ininterrumpidas al Mar Caribe.",
      image: propertyHorizon,
      features: [
        "Spa privado (sauna, baño turco, jacuzzi)",
        "Acceso directo al Laguito",
        "Terraza panorámica 180°",
        "Cine en casa",
        "Cava climatizada",
        "Personal de servicio incluido",
      ],
      floorPlan: "6 suites · spa · terraza 120m² · garaje 4 plazas",
      year: 2024,
    },
  };
  return properties[id as keyof typeof properties] || null;
}

function PropertyDetail() {
  const { id } = Route.useParams();
  const property = getPropertyData(id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [contactStatus, setContactStatus] = useState<"idle" | "sent">("idle");
  const [mortgageAmount, setMortgageAmount] = useState(500000);
  const [mortgageYears, setMortgageYears] = useState(25);
  const [mortgageRate, setMortgageRate] = useState(3.5);

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

  const images = [property.image, property.image, property.image];

  const monthlyPayment =
    mortgageAmount > 0 && mortgageYears > 0 && mortgageRate > 0
      ? (mortgageAmount * (mortgageRate / 100 / 12)) /
        (1 - Math.pow(1 + mortgageRate / 100 / 12, -mortgageYears * 12))
      : 0;

  const whatsappUrl =
    "https://wa.me/573007200894?text=" +
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
          </div>
          <div className="relative mx-auto max-w-7xl px-6 md:px-8">
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl">
              <img
                src={images[selectedImage]}
                alt={property.name}
                width={1920}
                height={822}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <span className="mb-2 inline-block rounded-full bg-accent px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                  {property.year === 2025 ? "Próximo lanzamiento" : "Disponible"}
                </span>
                <h1 className="mt-2 font-serif text-4xl text-white md:text-6xl">{property.name}</h1>
                <p className="mt-2 text-lg text-white/80">
                  {property.location} · {property.m2}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-[3/2] w-32 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === i
                      ? "border-accent"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${property.name} - Vista ${i + 1}`}
                    width={200}
                    height={133}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
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
                    <span className="block font-serif text-3xl text-accent">{property.m2}</span>
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
              </div>

              {/* Location */}
              <div className="mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  Ubicación
                </span>
                <div className="mt-6 aspect-[16/7] w-full overflow-hidden rounded-xl bg-muted-warm/50">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent/10">
                        <svg
                          className="size-8 text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <p className="font-serif text-xl">{property.location}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cartagena, Bolívar, Colombia
                      </p>
                    </div>
                  </div>
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
                      setContactStatus("sent");
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
                    <input
                      required
                      type="text"
                      placeholder="Nombre"
                      className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="Teléfono"
                      className="w-full border-b border-border bg-transparent py-3 text-sm focus:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                    />
                    <button
                      type="submit"
                      className="w-full bg-primary px-6 py-4 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
                    >
                      {contactStatus === "sent" ? "✓ Solicitud enviada" : "Solicitar visita"}
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
