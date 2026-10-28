import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  CheckCircle2,
  FileBox,
  FileImage,
  Filter,
  History,
  Layers,
  MapPinned,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentAdminAccess } from "@/lib/admin-auth";
import { requireSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/auditoria")({ component: AuditLogsPage });

interface AuditLogRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  project_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const actionLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: typeof Activity;
  }
> = {
  update_lot: { label: "Lote modificado", variant: "default", icon: Layers },
  create_project: { label: "Proyecto creado", variant: "secondary", icon: MapPinned },
  update_project: { label: "Proyecto actualizado", variant: "outline", icon: Pencil },
  upload_media: { label: "Medio multimedia subido", variant: "secondary", icon: Upload },
  delete_media: { label: "Medio eliminado", variant: "destructive", icon: Trash2 },
};

function formatAction(action: string) {
  return actionLabels[action] || { label: action, variant: "outline" as const, icon: Activity };
}

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("todos");

  const fetchLogs = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const access = await getCurrentAdminAccess();
      if (!access || !access.isSuperAdmin) {
        throw new Error("Acceso restringido. Solo el superadministrador puede ver la auditoría.");
      }
      const client = requireSupabase();
      const { data, error } = await client
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data as AuditLogRow[]) || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar la auditoría.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = actionFilter === "todos" || log.action === actionFilter;
      const matchesQuery =
        !q ||
        (log.user_email?.toLowerCase().includes(q) ?? false) ||
        log.action.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        (log.entity_id?.toLowerCase().includes(q) ?? false) ||
        JSON.stringify(log.details).toLowerCase().includes(q);
      return matchesAction && matchesQuery;
    });
  }, [logs, query, actionFilter]);

  const metrics = useMemo(() => {
    return {
      total: logs.length,
      lotsUpdated: logs.filter((l) => l.action === "update_lot").length,
      mediaUploaded: logs.filter((l) => l.action === "upload_media").length,
      projectsModified: logs.filter((l) => l.action.includes("project")).length,
    };
  }, [logs]);

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Seguridad & Monitoreo
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
              Auditoría del Sistema
            </h1>
            <p className="text-sm text-muted-foreground">
              Supervisión de cambios de usuarios y proyectos
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Registro cronológico inmutable de cada acción realizada por los usuarios en sus
            proyectos asignados (edición de lotes, subida de planos y modificaciones).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchLogs()}
          disabled={isLoading}
          className="gap-2 shrink-0 rounded-full border-accent/40"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar registros</span>
        </Button>
      </section>

      {loadError && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {/* Métricas rápidas de monitoreo */}
      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Acciones</p>
            <p className="font-serif text-3xl text-foreground">{metrics.total}</p>
            <p className="text-xs text-muted-foreground">Historial auditado</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Lotes Editados</p>
            <p className="font-serif text-3xl text-foreground">{metrics.lotsUpdated}</p>
            <p className="text-xs text-muted-foreground">Precios, estados y áreas</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Archivos y Medios
            </p>
            <p className="font-serif text-3xl text-foreground">{metrics.mediaUploaded}</p>
            <p className="text-xs text-muted-foreground">Planos, imágenes y documentos</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Proyectos</p>
            <p className="font-serif text-3xl text-foreground">{metrics.projectsModified}</p>
            <p className="text-xs text-muted-foreground">Creaciones y actualizaciones</p>
          </CardContent>
        </Card>
      </section>

      {/* Tabla con Filtros */}
      <Card className="mt-6 rounded-2xl">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-serif text-2xl">Registros de Actividad</CardTitle>
            <CardDescription>
              Filtra por usuario, tipo de acción o detalle modificado en la plataforma.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por correo, acción, lote o detalle…"
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las acciones</SelectItem>
                  <SelectItem value="update_lot">Lotes modificados</SelectItem>
                  <SelectItem value="create_project">Proyectos creados</SelectItem>
                  <SelectItem value="update_project">Proyectos actualizados</SelectItem>
                  <SelectItem value="upload_media">Archivos subidos</SelectItem>
                  <SelectItem value="delete_media">Archivos eliminados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <ShieldAlert className="size-10 text-muted-foreground/60 mb-3" />
              <p className="text-base font-medium text-foreground">No se encontraron eventos</p>
              <p className="text-xs text-muted-foreground mt-1">
                {query || actionFilter !== "todos"
                  ? "Prueba a cambiar los filtros de búsqueda."
                  : "A medida que los usuarios realicen modificaciones en sus proyectos, aparecerán registrados aquí."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Usuario Responsable</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Elemento</TableHead>
                    <TableHead>Detalle de la Modificación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const actionInfo = formatAction(log.action);
                    const ActionIcon = actionInfo.icon;
                    const date = new Date(log.created_at);
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          <div>{date.toLocaleDateString("es-CO")}</div>
                          <div className="font-mono text-[11px] opacity-75">
                            {date.toLocaleTimeString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
                              {log.user_email ? log.user_email[0].toUpperCase() : "U"}
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              {log.user_email || "Usuario del sistema"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionInfo.variant} className="gap-1 text-xs">
                            <ActionIcon className="size-3" />
                            <span>{actionInfo.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {log.entity_id ? (
                            <span className="rounded bg-muted px-2 py-0.5 font-bold text-foreground">
                              {log.entity_id}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{log.entity_type}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <pre className="max-w-md overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground border">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
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
    </main>
  );
}
