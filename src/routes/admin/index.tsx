import { createFileRoute } from "@tanstack/react-router";
import { properties } from "@/data/properties";
import { ArrowUpRight, LayoutGrid, Image, MapPinned } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });
const sections = [
  {
    name: "Portada",
    detail: "Imagen principal, título, descripción y llamadas a la acción.",
    url: "/",
    component: "HomeHeroSection",
  },
  {
    name: "Presentación",
    detail: "Introducción, imágenes de territorio y mensaje del estudio.",
    url: "/#about",
    component: "IntroAboutSection",
  },
  {
    name: "Proyectos",
    detail: "Nombre, imagen y enlace desde el catálogo compartido.",
    url: "/admin/proyectos",
    component: "FeaturedProjectsSection",
  },
  {
    name: "Servicios",
    detail: "Seis servicios, procesos e imágenes de apoyo.",
    url: "/#servicios",
    component: "OurServicesSection",
  },
  {
    name: "Áreas de trabajo",
    detail: "Diseño residencial y comercial.",
    url: "/",
    component: "ProjectExpertiseSection",
  },
  {
    name: "Proceso",
    detail: "Cuatro etapas con actividad, resultado e imagen.",
    url: "/#design-process",
    component: "ClearDesignProcessSection",
  },
  {
    name: "Recursos del proyecto",
    detail: "Plano, acceso y entorno. Sin testimonios de muestra.",
    url: "/#explorar-proyecto",
    component: "ProjectResourcesSection",
  },
  {
    name: "Contacto",
    detail: "Formulario que prepara una consulta por WhatsApp.",
    url: "/#contacto",
    component: "ContactUsSection",
  },
  {
    name: "Nosotros",
    detail: "Identidad, disciplinas y método de AUTEM.",
    url: "/nosotros",
    component: "NosotrosPage",
  },
  {
    name: "Visor del proyecto",
    detail: "Lotes, filtros, capas, rotación y galería.",
    url: "/proyecto/lotes-360",
    component: "ProjectView",
  },
  {
    name: "Navegación y pie",
    detail: "Enlaces del sitio, contacto y política de privacidad.",
    url: "/",
    component: "Navbar / PiePagina",
  },
  {
    name: "Privacidad",
    detail: "Contenido legal publicado en el sitio.",
    url: "/politica-privacidad",
    component: "PrivacyPolicy",
  },
];
function AdminDashboard() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-5 md:p-10">
      <header>
        <p className="text-xs uppercase tracking-[.2em] text-muted-foreground">
          AUTEM · Administración
        </p>
        <h1 className="mt-3 text-3xl font-medium">Contenido del sitio</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Una vista organizada de las secciones y recursos que utiliza la página pública. Datos del
          repositorio, sin estadísticas comerciales simuladas.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: MapPinned, title: "Proyectos configurados", value: properties.length },
          { icon: LayoutGrid, title: "Áreas del frontend", value: sections.length },
          {
            icon: Image,
            title: "Imágenes del catálogo",
            value: properties.reduce((sum, p) => sum + (p.images?.length ?? 1), 0),
          },
        ].map(({ icon: Icon, title, value }) => (
          <article key={title} className="rounded-2xl border border-border bg-card p-6">
            <Icon size={20} className="text-muted-foreground" />
            <p className="mt-5 text-3xl">{value}</p>
            <h2 className="mt-2 text-sm text-muted-foreground">{title}</h2>
          </article>
        ))}
      </section>
      <section id="contenido">
        <h2 className="mb-5 text-xl font-medium">Secciones y componentes</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <a
              key={section.name}
              href={section.url}
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-muted focus-visible:outline-2"
            >
              <div className="flex justify-between gap-3">
                <h3 className="font-medium">{section.name}</h3>
                <ArrowUpRight size={18} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.detail}</p>
              <p className="mt-5 text-[10px] tracking-wide text-muted-foreground">
                {section.component}
              </p>
              <span className="mt-3 block text-xs">Abrir sección</span>
            </a>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-border p-6">
        <h2 className="font-medium">Edición y publicación pendientes de conexión</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Este panel aún no tiene autenticación ni almacenamiento de contenido en un servidor. No
          registra contactos, visitas ni ventas. Los botones de publicación no se habilitan hasta
          conectar esos servicios; los datos del catálogo no acreditan disponibilidad comercial
          actual.
        </p>
      </section>
    </main>
  );
}
