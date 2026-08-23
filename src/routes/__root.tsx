import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRoute, useRouter, HeadContent } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import ScrollProgress from "../components/ScrollProgress";
import PageTransition from "../components/PageTransition";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute size-[480px] rounded-full bg-accent/8 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-accent" />
          Error 404
        </span>
        <h1 className="mt-6 font-serif text-[clamp(2.5rem,5vw,3.8rem)] font-light leading-tight tracking-tight text-foreground">
          Página no encontrada
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          La coordenada o sección que buscas no existe o ha sido reubicada dentro del estudio.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-xs font-bold uppercase tracking-[0.16em] text-accent-foreground shadow-lg transition hover:bg-accent/90"
          >
            Volver al inicio
          </Link>
          <a
            href={`${import.meta.env.BASE_URL}proyecto/lotes-360`}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background/80 px-6 text-xs font-bold uppercase tracking-[0.16em] text-foreground backdrop-blur-sm transition hover:border-accent hover:text-accent"
          >
            Explorar proyectos
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute size-[480px] rounded-full bg-accent/8 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-accent" />
          AUTEM Studio
        </span>
        <h1 className="mt-6 font-serif text-[clamp(2.2rem,4.5vw,3.4rem)] font-light leading-tight tracking-tight text-foreground">
          No se pudo cargar la página
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Ocurrió una interrupción al renderizar esta vista. Puedes recargar o regresar al inicio.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-xs font-bold uppercase tracking-[0.16em] text-accent-foreground shadow-lg transition hover:bg-accent/90 cursor-pointer"
          >
            Reintentar
          </button>
          <a
            href={`${import.meta.env.BASE_URL}`}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background/80 px-6 text-xs font-bold uppercase tracking-[0.16em] text-foreground backdrop-blur-sm transition hover:border-accent hover:text-accent"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "AUTEM — Visualización 3D y realidad aumentada en bienes raíces",
      },
      {
        name: "description",
        content:
          "Propiedades con renders 3D, tours virtuales y realidad aumentada para que las recorras, personalices y veas antes de la primera piedra.",
      },
      {
        property: "og:title",
        content: "AUTEM — Arquitectura, tecnología y bienes raíces en Cartagena",
      },
      {
        property: "og:description",
        content:
          "Propiedades que puedes recorrer, personalizar y ver en tu propio espacio antes de que exista la primera piedra.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: `${import.meta.env.BASE_URL}antes.png`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content: `${import.meta.env.BASE_URL}antes.png`,
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: `${import.meta.env.BASE_URL}favicon.svg`, type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScrollProgress />
      <HeadContent />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:bg-accent focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-accent-foreground focus:shadow-lg focus:outline-none"
      >
        Saltar al contenido
      </a>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </QueryClientProvider>
  );
}
