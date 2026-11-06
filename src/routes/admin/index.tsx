import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Boxes,
  FolderKanban,
  ImageIcon,
  Inbox,
  LayoutPanelTop,
  MessageCircle,
  Settings2,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentAdminAccess } from "@/lib/auth/admin-auth";
import {
  buildWhatsAppReserveUrl,
  LEAD_STATUS_CONFIG,
  listLeads,
  type LeadRecord,
} from "@/lib/repositories/leads-repository";
import { usePublishedProjects } from "@/lib/repositories/public-projects";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

const publicSections = 12;
const settingsModules = 5;
const coverageData = [
  { area: "Contenido", modules: 9 },
  { area: "Proyectos", modules: 3 },
  { area: "Experiencias", modules: 2 },
  { area: "Ajustes", modules: settingsModules },
];

const totalModules = coverageData.reduce((sum, item) => sum + item.modules, 0);

const chartConfig = {
  modules: { label: "Módulos", color: "var(--accent)" },
} satisfies ChartConfig;

const resourceChartConfig = {
  sections: { label: "Secciones públicas", color: "var(--accent)" },
  projects: { label: "Proyectos", color: "var(--primary)" },
  media: { label: "Medios", color: "var(--muted-foreground)" },
  settings: { label: "Ajustes", color: "var(--border)" },
} satisfies ChartConfig;

const spaceStatusData = [
  { key: "source", value: 1, fill: "var(--color-source)" },
  { key: "authentication", value: 1, fill: "var(--color-authentication)" },
  { key: "publication", value: 1, fill: "var(--color-publication)" },
];

const spaceStatusConfig = {
  source: { label: "Repositorio local", color: "var(--accent)" },
  authentication: { label: "Autenticación por conectar", color: "var(--muted-foreground)" },
  publication: { label: "Publicación por conectar", color: "var(--border)" },
} satisfies ChartConfig;

const moduleRows = [
  {
    area: "Contenido público",
    detail: "Portada, presentación, servicios, áreas de trabajo, contacto y nosotros.",
    modules: 8,
    status: "Mapeado",
  },
  {
    area: "Proyectos",
    detail: "Catálogo, recursos, galerías, planos y recorridos.",
    modules: 3,
    status: "Configurado",
  },
  {
    area: "Experiencias",
    detail: "Masterplan interactivo y tour de terreno con GPS.",
    modules: 2,
    status: "Disponible",
  },
  {
    area: "Configuración",
    detail: "General, apariencia, dominios, notificaciones e integraciones.",
    modules: settingsModules,
    status: "Disponible",
  },
];

function AdminDashboard() {
  const { projects } = usePublishedProjects();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("administrador");
  const [recentLeads, setRecentLeads] = useState<LeadRecord[]>([]);
  const [leadsMetrics, setLeadsMetrics] = useState({ total: 0, nuevas: 0 });

  useEffect(() => {
    void getCurrentAdminAccess().then(async (access) => {
      if (access) {
        setIsSuperAdmin(access.isSuperAdmin);
        setUserRole(access.role);
        try {
          const leads = await listLeads(access.organizationId);
          setRecentLeads(leads.slice(0, 5));
          setLeadsMetrics({
            total: leads.length,
            nuevas: leads.filter((l) => l.status === "new").length,
          });
        } catch {
          /* ignore error */
        }
      }
    });
  }, []);

  const catalogImages = projects.reduce((sum, project) => sum + (project.images?.length ?? 1), 0);
  const resourceData = [
    {
      key: "sections",
      label: "Secciones públicas",
      value: publicSections,
      fill: "var(--color-sections)",
    },
    { key: "projects", label: "Proyectos", value: projects.length, fill: "var(--color-projects)" },
    { key: "media", label: "Medios", value: catalogImages, fill: "var(--color-media)" },
    { key: "settings", label: "Ajustes", value: settingsModules, fill: "var(--color-settings)" },
  ];
  const metrics = [
    {
      title: "Proyectos en catálogo",
      value: projects.length,
      description: "Desarrollos activos en la plataforma.",
      icon: FolderKanban,
    },
    {
      title: "Solicitudes de reserva",
      value: leadsMetrics.total,
      description: `${leadsMetrics.nuevas} nuevas por contactar.`,
      icon: Inbox,
    },
    {
      title: "Medios del catálogo",
      value: catalogImages,
      description: "Imágenes y planos vinculados.",
      icon: ImageIcon,
    },
    {
      title: "Módulos disponibles",
      value: settingsModules,
      description: "Catálogo, lotes, medios y accesos.",
      icon: Settings2,
    },
  ];
  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              AUTEM · {isSuperAdmin ? "Superadministrador" : `Panel de ${userRole}`}
            </p>
            <h1 className="text-3xl font-medium text-foreground sm:text-4xl">Panel de control</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/admin/solicitudes">
                <Inbox className="size-4 text-accent" />
                <span>Solicitudes y CRM</span>
              </Link>
            </Button>
            {isSuperAdmin && (
              <>
                <Button asChild variant="outline" className="gap-2 border-accent/40">
                  <Link to="/admin/auditoria">
                    <ShieldAlert className="size-4 text-accent" />
                    <span>Auditoría</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/admin/equipo-accesos">
                    <UsersRound className="size-4" />
                    <span>Equipo</span>
                  </Link>
                </Button>
              </>
            )}
            <Button asChild variant="outline">
              <a href="/" target="_blank" rel="noopener noreferrer">
                Ver sitio <ArrowUpRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </header>

        {/* Tarjeta de bienvenida y accesos directos para usuarios asignados a proyectos */}
        {!isSuperAdmin && (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs uppercase tracking-[0.16em] font-bold text-accent">
                  Tu Espacio de Trabajo
                </span>
                <h2 className="font-serif text-2xl text-foreground mt-1">Gestión de tu Proyecto</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Tienes acceso asignado para gestionar solicitudes de clientes, editar información
                  y administrar el inventario de lotes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Link to="/admin/solicitudes">Solicitudes y CRM</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/lotes-unidades">Lotes y Unidades</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/galerias-planos-recorridos">Medios y Planos</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/proyectos">Ficha del Proyecto</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <section
          className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
          aria-label="Resumen de plataforma"
        >
          {metrics.map(({ title, value, description, icon: Icon }) => (
            <Card key={title} size="sm">
              <CardHeader className="relative pr-14">
                <CardDescription>{title}</CardDescription>
                <CardAction className="absolute right-[var(--card-padding)] top-[var(--card-padding)]">
                  <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon aria-hidden="true" />
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-4xl font-medium tabular-nums text-foreground">{value}</p>
                <p className="text-xs leading-5 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Solicitudes recientes de reserva y CRM */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-serif text-2xl">Solicitudes recientes de lotes</CardTitle>
              <CardDescription>
                Clientes interesados en separar lotes o agendar visitas a Villa Paraíso.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/admin/solicitudes">
                Ver todas en CRM ({leadsMetrics.total}) <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center">
                <Inbox className="size-8 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">
                  Aún no hay solicitudes registradas
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Cuando los clientes hagan clic en "Reservar este lote" desde el plano urbanístico
                  o catálogo, aparecerán aquí con su contacto directo.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-2 rounded-full text-xs">
                  <a
                    href="/proyecto/villa-paraiso?vista=plano"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Probar reserva en plano <ArrowUpRight className="ml-1 size-3" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Teléfono / WhatsApp</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLeads.map((lead) => {
                      const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new;
                      const waUrl = buildWhatsAppReserveUrl({
                        fullName: lead.full_name,
                        phone: lead.phone,
                        lotNumber: lead.lot_number || lead.lot_external_id || undefined,
                        projectName: lead.project_name || "Villa Paraíso",
                      });
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {lead.full_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{lead.phone}</span>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-emerald-500/10 p-1 text-emerald-600 hover:bg-emerald-500/20"
                                title="Contactar por WhatsApp"
                              >
                                <MessageCircle className="size-3" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.lot_number || lead.lot_external_id ? (
                              <Badge variant="outline" className="font-mono text-xs">
                                Lote {lead.lot_number || lead.lot_external_id}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">General</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${statusCfg.badgeClass}`}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs rounded-full"
                            >
                              <Link to="/admin/solicitudes">Gestionar</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.75fr)]">
          <Card className="min-w-0">
            <CardHeader className="relative pr-32">
              <CardTitle>Cobertura del panel</CardTitle>
              <CardDescription>Distribución de los módulos ya identificados.</CardDescription>
              <CardAction className="absolute right-[var(--card-padding)] top-[var(--card-padding)]">
                <Badge variant="secondary">{totalModules} módulos</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="estructura" className="flex flex-col gap-5">
                <TabsList className="w-fit max-w-full">
                  <TabsTrigger value="estructura">Estructura</TabsTrigger>
                  <TabsTrigger value="recursos">Recursos</TabsTrigger>
                </TabsList>
                <TabsContent value="estructura" className="mt-0">
                  <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto">
                    <BarChart
                      accessibilityLayer
                      data={coverageData}
                      margin={{ top: 12, right: 8, left: -16 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="area" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Bar dataKey="modules" fill="var(--color-modules)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                </TabsContent>
                <TabsContent value="recursos" className="mt-0">
                  <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                    <ChartContainer
                      config={resourceChartConfig}
                      className="h-72 w-full aspect-auto"
                    >
                      <PieChart>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel nameKey="key" />}
                        />
                        <Pie
                          data={resourceData}
                          dataKey="value"
                          nameKey="key"
                          innerRadius={56}
                          outerRadius={92}
                          paddingAngle={3}
                          strokeWidth={0}
                        />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-col gap-2 md:w-48">
                      {resourceData.map((resource) => (
                        <div
                          key={resource.key}
                          className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                        >
                          <span className="text-sm text-muted-foreground">{resource.label}</span>
                          <span className="font-medium tabular-nums text-foreground">
                            {resource.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="relative pr-32">
              <CardTitle>Estado del espacio</CardTitle>
              <CardDescription>Conexiones necesarias para operar el panel.</CardDescription>
              <CardAction className="absolute right-[var(--card-padding)] top-[var(--card-padding)]">
                <Badge variant="outline">Preparación</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="relative mx-auto size-48">
                <ChartContainer config={spaceStatusConfig} className="size-full aspect-auto">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="key" />}
                    />
                    <Pie
                      data={spaceStatusData}
                      dataKey="value"
                      nameKey="key"
                      innerRadius={56}
                      outerRadius={78}
                      paddingAngle={4}
                      strokeWidth={0}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-medium tabular-nums text-foreground">3</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Conexiones
                  </span>
                </div>
              </div>
              <StatusLine label="Fuente de datos" status="Repositorio local" variant="secondary" />
              <StatusLine label="Autenticación" status="Por conectar" variant="outline" />
              <StatusLine label="Publicación" status="Por conectar" variant="outline" />
            </CardContent>
            <CardFooter className="flex items-start gap-2 rounded-b-xl bg-muted/50">
              <Boxes className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm leading-6 text-muted-foreground">
                Próximo paso: conectar una fuente de datos para habilitar edición, borradores y
                publicación.
              </p>
            </CardFooter>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="relative pr-28">
              <CardTitle>Inventario de módulos</CardTitle>
              <CardDescription>
                Áreas presentes en la plataforma y preparadas para recibir su vista de gestión.
              </CardDescription>
              <CardAction className="absolute right-[var(--card-padding)] top-[var(--card-padding)]">
                <Badge variant="secondary">{moduleRows.length} áreas</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead className="hidden md:table-cell">Alcance actual</TableHead>
                    <TableHead className="text-right">Módulos</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleRows.map((row) => (
                    <TableRow key={row.area}>
                      <TableCell className="font-medium text-foreground">{row.area}</TableCell>
                      <TableCell className="hidden max-w-xl text-muted-foreground md:table-cell">
                        {row.detail}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.modules}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={row.status === "Mapeado" ? "secondary" : "outline"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function StatusLine({
  label,
  status,
  variant,
}: {
  label: string;
  status: string;
  variant: "secondary" | "outline";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={variant}>{status}</Badge>
    </div>
  );
}
