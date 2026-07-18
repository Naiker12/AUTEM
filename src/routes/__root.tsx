import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AUTEM — Bienes raíces premium con visualización 3D y AR" },
      { name: "description", content: "Propiedades exclusivas que integran renders 3D, tours virtuales y realidad aumentada para una experiencia de inversión inmobiliaria sin precedentes." },
      { property: "og:title", content: "AUTEM — Bienes raíces premium" },
      { property: "og:description", content: "Arquitectura sin fronteras. Propiedades premium con tecnología 3D y realidad aumentada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..500&family=Inter:wght@300;400;500;600&display=swap" },
    ],
    scripts: [
      // Google Analytics 4 — reemplazar G-XXXXXXXXXX con tu ID real
      // {
      //   type: "text/partytown",
      //   children: `
      //     window.dataLayer = window.dataLayer || [];
      //     function gtag(){dataLayer.push(arguments);}
      //     gtag('js', new Date());
      //     gtag('config', 'G-XXXXXXXXXX');
      //   `,
      // },
      // {
      //   src: "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX",
      //   async: true,
      // },
      // Meta Pixel — reemplazar XXXXXXXXXXXXX con tu Pixel ID real
      // {
      //   children: `
      //     !function(f,b,e,v,n,t,s)
      //     {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      //     n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      //     if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      //     n.queue=[];t=b.createElement(e);t.async=!0;
      //     t.src=v;s=b.getElementsByTagName(e)[0];
      //     s.parentNode.insertBefore(t,s)}(window, document,'script',
      //     'https://connect.facebook.net/en_US/fbevents.js');
      //     fbq('init', 'XXXXXXXXXXXXX');
      //     fbq('track', 'PageView');
      //   `,
      // },
      // {
      //   children: `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=XXXXXXXXXXXXX&ev=PageView&noscript=1"/></noscript>`,
      // },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}