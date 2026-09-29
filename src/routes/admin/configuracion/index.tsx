import { Link, createFileRoute } from "@tanstack/react-router";
import { Bell, Globe2, Palette, Settings2, ShieldCheck, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/configuracion/")({ component: SettingsHome });

const sections = [
  {
    title: "General de AUTEM",
    description: "Datos institucionales, contacto y perfil de la organización.",
    detail: "Datos base",
    icon: Settings2,
    to: "/admin/configuracion/general",
  },
  {
    title: "Apariencia y tema",
    description: "Identidad visual, logotipo y preferencias de tema.",
    detail: "Marca",
    icon: Palette,
    to: "/admin/configuracion/apariencia",
  },
  {
    title: "Dominios y SEO",
    description: "Dominio principal, indexación y metadatos públicos.",
    detail: "Sitio público",
    icon: Globe2,
    to: "/admin/configuracion/dominios",
  },
  {
    title: "Notificaciones",
    description: "Alertas que debe recibir el equipo de administración.",
    detail: "Avisos",
    icon: Bell,
    to: "/admin/configuracion/notificaciones",
  },
  {
    title: "Integraciones",
    description: "Canales comerciales y servicios conectados al sitio.",
    detail: "Servicios",
    icon: Workflow,
    to: "/admin/configuracion/integraciones",
  },
];

function SettingsHome() {
  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-3xl flex-col gap-2 border-l-2 border-accent pl-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Sistema AUTEM
            </p>
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Configuración</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Administra la base institucional, la identidad y los servicios que sostienen la
              experiencia pública.
            </p>
          </div>
          <Badge variant="outline">
            <ShieldCheck /> 5 módulos disponibles
          </Badge>
        </header>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Espacio de trabajo</CardTitle>
              <CardDescription>
                Los cambios se previsualizan localmente. La persistencia se conectará después a
                autenticación y almacenamiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <OverviewMetric value="5" label="módulos" />
              <OverviewMetric value="1" label="organización" />
              <OverviewMetric value="Local" label="estado actual" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Orden recomendado</CardTitle>
              <CardDescription>Configura primero lo que identifica a AUTEM.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">01</span> General
                </li>
                <li>
                  <span className="font-medium text-foreground">02</span> Apariencia
                </li>
                <li>
                  <span className="font-medium text-foreground">03</span> Dominio y SEO
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.title} to={section.to as never} className="group">
              <Card className="h-full rounded-2xl transition-colors group-hover:border-accent group-hover:bg-muted/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl border bg-muted text-accent">
                      <section.icon className="size-5" />
                    </span>
                    <Badge variant="outline">{section.detail}</Badge>
                  </div>
                  <CardTitle className="mt-3 font-serif text-xl">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-foreground group-hover:text-accent">
                    Configurar →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

function OverviewMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="font-serif text-2xl text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
