import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Kanban,
  ListFilter,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Table as TableIcon,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAdminAccess } from "@/lib/auth/admin-auth";
import {
  addLeadEvent,
  buildWhatsAppReserveUrl,
  getLeadDetail,
  LEAD_STATUS_CONFIG,
  listLeads,
  updateLeadStatus,
  type LeadEventKind,
  type LeadRecord,
  type LeadStatus,
} from "@/lib/repositories/leads-repository";
import {
  listManagedProjects,
  type ManagedProjectRecord,
} from "@/lib/repositories/project-repository";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/solicitudes")({
  component: SolicitudesAdminPage,
});

const KANBAN_COLUMNS: { status: LeadStatus; label: string; dotClass: string }[] = [
  { status: "new", label: "Nuevas", dotClass: "bg-blue-500" },
  { status: "contacted", label: "Contactadas", dotClass: "bg-amber-500" },
  { status: "visit_scheduled", label: "Visita programada", dotClass: "bg-purple-500" },
  { status: "negotiating", label: "En negociación", dotClass: "bg-orange-500" },
  { status: "reserved", label: "Reservadas", dotClass: "bg-emerald-500" },
];

export function SolicitudesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [projects, setProjects] = useState<ManagedProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"table" | "kanban">("table");

  // Selected lead for detail sheet
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteKind, setNewNoteKind] = useState<LeadEventKind>("note");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Reserve confirmation modal
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [isConfirmingReserve, setIsConfirmingReserve] = useState(false);

  const organizationIdRef = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const access = await getCurrentAdminAccess();
      if (!access) {
        toast.error("No se detectó una sesión activa con permisos de administración.");
        return;
      }

      organizationIdRef[1](access.organizationId);

      const [projs, leadsData] = await Promise.all([
        listManagedProjects(
          access.organizationId,
          access.isSuperAdmin ? undefined : access.assignedProjectIds,
        ),
        listLeads(access.organizationId, {
          projectId: selectedProjectId !== "all" ? selectedProjectId : undefined,
          status: selectedStatus !== "all" ? (selectedStatus as LeadStatus) : undefined,
        }),
      ]);

      setProjects(projs);

      // Merge local contingency leads if any exist
      let localLeads: LeadRecord[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("autem_pending_leads");
          if (raw) {
            const parsed = JSON.parse(raw);
            localLeads = (parsed || []).map(
              (p: Record<string, unknown>, idx: number): LeadRecord => ({
                id: `local-${idx}-${Date.now()}`,
                organization_id: access.organizationId,
                project_id: (p.projectId as string) || "",
                lot_id: (p.lotId as string) || null,
                lot_external_id: (p.lotExternalId as string) || null,
                lot_number: (p.lotNumber as number) || null,
                intent: (p.intent as LeadRecord["intent"]) || "reserve",
                full_name: (p.fullName as string) || "Cliente",
                phone: (p.phone as string) || "",
                email: (p.email as string) || null,
                message: (p.message as string) || null,
                visit_date: (p.visitDate as string) || null,
                status: "new",
                assigned_to: null,
                consent_at: (p.createdAt as string) || new Date().toISOString(),
                source: (p.source as string) || "plano",
                utm: (p.utm as Record<string, unknown>) || {},
                next_followup_at: null,
                last_contact_at: null,
                created_at: (p.createdAt as string) || new Date().toISOString(),
                updated_at: (p.createdAt as string) || new Date().toISOString(),
                project_name: "Villa Paraíso",
              }),
            );
          }
        } catch {
          /* ignore */
        }
      }

      // Evitar duplicados si ya están en base de datos
      const existingPhones = new Set(leadsData.map((l) => l.phone));
      const cleanLocal = localLeads.filter((l) => !existingPhones.has(l.phone));

      setLeads([...cleanLocal, ...leadsData]);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
      toast.error("No se pudieron cargar las solicitudes comerciales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId, selectedStatus]);

  // Open detail sheet
  const handleOpenDetail = async (lead: LeadRecord) => {
    setSelectedLead(lead);
    setDetailLoading(true);
    try {
      if (lead.id.startsWith("local-")) {
        setSelectedLead({
          ...lead,
          events: [
            {
              id: "ev-local-1",
              lead_id: lead.id,
              author_id: null,
              kind: "created",
              body: "Solicitud registrada localmente desde el catálogo.",
              meta: {},
              created_at: lead.created_at,
            },
          ],
        });
      } else {
        const fullDetail = await getLeadDetail(lead.id);
        if (fullDetail) {
          setSelectedLead(fullDetail);
        }
      }
    } catch (err) {
      console.error("Error al cargar detalle del lead:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Status update
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      if (!leadId.startsWith("local-")) {
        await updateLeadStatus(leadId, newStatus);
      }
      toast.success(`Estado actualizado a: ${LEAD_STATUS_CONFIG[newStatus]?.label}`);
    } catch (err) {
      console.error("Error actualizando estado:", err);
      toast.error("No se pudo actualizar el estado.");
    }
  };

  // Add follow-up note
  const handleAddNote = async () => {
    if (!selectedLead || !newNoteBody.trim()) return;
    try {
      setIsAddingNote(true);
      const noteText = newNoteBody.trim();
      const kind = newNoteKind;

      if (!selectedLead.id.startsWith("local-")) {
        await addLeadEvent(selectedLead.id, kind, noteText);
      }

      const newEvent = {
        id: `ev-${Date.now()}`,
        lead_id: selectedLead.id,
        author_id: null,
        kind,
        body: noteText,
        meta: {},
        created_at: new Date().toISOString(),
      };

      setSelectedLead((prev) =>
        prev ? { ...prev, events: [...(prev.events || []), newEvent] } : null,
      );
      setNewNoteBody("");
      toast.success("Seguimiento registrado exitosamente.");
    } catch (err) {
      console.error("Error agregando nota:", err);
      toast.error("No se pudo guardar la nota de seguimiento.");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Confirm official reservation on inventory lot
  const handleConfirmOfficialReserve = async () => {
    if (!selectedLead) return;
    try {
      setIsConfirmingReserve(true);

      // 1. Update lead status to 'reserved'
      await handleStatusChange(selectedLead.id, "reserved");

      // 2. If lot_id or lot_external_id exists and supabase is configured, update lot status
      if (supabase && (selectedLead.lot_id || selectedLead.lot_external_id)) {
        let lotQuery = supabase.from("lots").update({
          status: "reserved",
          updated_at: new Date().toISOString(),
        });

        if (selectedLead.lot_id) {
          lotQuery = lotQuery.eq("id", selectedLead.lot_id);
        } else if (selectedLead.lot_external_id) {
          lotQuery = lotQuery.eq("external_id", selectedLead.lot_external_id);
        }

        const { error: lotErr } = await lotQuery;
        if (lotErr) {
          console.warn("Aviso al actualizar lote en tabla lots:", lotErr.message);
        }
      }

      // 3. Log event
      if (!selectedLead.id.startsWith("local-")) {
        await addLeadEvent(
          selectedLead.id,
          "status_change",
          `Reserva oficial confirmada para ${selectedLead.full_name}. Lote bloqueado en el inventario.`,
        );
      }

      toast.success("¡Reserva oficial confirmada y registrada en inventario!");
      setReserveModalOpen(false);
    } catch (err) {
      console.error("Error al confirmar reserva:", err);
      toast.error("Ocurrió un error al confirmar la reserva.");
    } finally {
      setIsConfirmingReserve(false);
    }
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      if (selectedProjectId !== "all" && item.project_id !== selectedProjectId) {
        return false;
      }
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.full_name?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.toLowerCase().includes(q);
        const matchesEmail = item.email?.toLowerCase().includes(q);
        const matchesLot = String(item.lot_number || item.lot_external_id || "")
          .toLowerCase()
          .includes(q);
        return matchesName || matchesPhone || matchesEmail || matchesLot;
      }
      return true;
    });
  }, [leads, selectedProjectId, selectedStatus, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const nuevas = leads.filter((l) => l.status === "new").length;
    const enSeguimiento = leads.filter(
      (l) =>
        l.status === "contacted" || l.status === "visit_scheduled" || l.status === "negotiating",
    ).length;
    const reservadas = leads.filter((l) => l.status === "reserved" || l.status === "won").length;

    return { total, nuevas, enSeguimiento, reservadas };
  }, [leads]);

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      {/* Header */}
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Comercial y CRM
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
              Solicitudes y reservas
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {leads.length} prospectos
            </Badge>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Gestión comercial de solicitudes de separación de lotes, visitas a terreno y seguimiento
            de clientes potenciales de Villa Paraíso y el catálogo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-full"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </section>

      {/* Metrics Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Solicitudes
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-serif text-3xl font-semibold text-foreground">
              {metrics.total}
            </span>
            <Users className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Recibidas por la plataforma</p>
        </Card>

        <Card className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Nuevas sin contactar
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-serif text-3xl font-semibold text-blue-900 dark:text-blue-100">
              {metrics.nuevas}
            </span>
            <Sparkles className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
            Requieren primer contacto
          </p>
        </Card>

        <Card className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
            En seguimiento activo
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-serif text-3xl font-semibold text-amber-900 dark:text-amber-100">
              {metrics.enSeguimiento}
            </span>
            <Clock className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
            Visitas y negociaciones
          </p>
        </Card>

        <Card className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Lotes Reservados
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-serif text-3xl font-semibold text-emerald-900 dark:text-emerald-100">
              {metrics.reservadas}
            </span>
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
            Con intención en firme
          </p>
        </Card>
      </div>

      {/* Control bar / Filters */}
      <div className="mt-8 flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por cliente, teléfono, lote…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Project Filter */}
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los proyectos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(LEAD_STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Switcher: Table vs Kanban */}
        <div className="flex items-center gap-2 border-t pt-3 sm:border-t-0 sm:pt-0">
          <Button
            variant={activeTab === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("table")}
            className="rounded-full"
          >
            <TableIcon className="size-3.5" />
            Tabla
          </Button>
          <Button
            variant={activeTab === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("kanban")}
            className="rounded-full"
          >
            <Kanban className="size-3.5" />
            Tablero
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border bg-card">
            <Spinner className="size-8 text-accent" />
            <p className="text-sm text-muted-foreground">Cargando solicitudes comerciales…</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/50 p-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <Users className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-lg text-foreground">No se encontraron solicitudes</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              {searchQuery || selectedProjectId !== "all" || selectedStatus !== "all"
                ? "No hay resultados con los filtros actuales. Intenta limpiar los filtros de búsqueda."
                : "Aún no se han recibido solicitudes de reserva. Cuando un visitante envíe el formulario desde el catálogo o plano interactivo, aparecerá aquí."}
            </p>
          </div>
        ) : activeTab === "table" ? (
          /* TABLE VIEW */
          <Card className="overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Lote de interés</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new;
                    const dateFormatted = new Date(lead.created_at).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const waUrl = buildWhatsAppReserveUrl({
                      fullName: lead.full_name,
                      phone: lead.phone,
                      lotNumber: lead.lot_number || lead.lot_external_id || undefined,
                      projectName: lead.project_name || "Villa Paraíso",
                    });

                    return (
                      <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/40">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {dateFormatted}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{lead.full_name}</span>
                            {lead.id.startsWith("local-") && (
                              <Badge variant="secondary" className="text-[10px]">
                                Reciente
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{lead.phone}</span>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full bg-emerald-500/10 p-1 text-emerald-600 transition hover:bg-emerald-500/20"
                              title="Abrir WhatsApp para contactar"
                            >
                              <MessageCircle className="size-3.5" />
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
                        <TableCell className="text-xs text-muted-foreground">
                          {lead.project_name || "Villa Paraíso"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusCfg.badgeClass}`}>
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={() => handleOpenDetail(lead)}
                          >
                            <Eye className="size-3.5" />
                            Gestionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          /* KANBAN BOARD VIEW */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {KANBAN_COLUMNS.map((col) => {
              const colLeads = filteredLeads.filter((l) => l.status === col.status);
              return (
                <div
                  key={col.status}
                  className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${col.dotClass}`} />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {col.label}
                      </h4>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {colLeads.length}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {colLeads.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        Sin solicitudes
                      </p>
                    ) : (
                      colLeads.map((lead) => {
                        const waUrl = buildWhatsAppReserveUrl({
                          fullName: lead.full_name,
                          phone: lead.phone,
                          lotNumber: lead.lot_number || lead.lot_external_id || undefined,
                          projectName: lead.project_name || "Villa Paraíso",
                        });

                        return (
                          <Card
                            key={lead.id}
                            onClick={() => handleOpenDetail(lead)}
                            className="cursor-pointer rounded-xl border bg-card p-3 shadow-sm transition hover:border-accent hover:shadow"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-medium text-foreground">
                                {lead.full_name}
                              </h5>
                              {(lead.lot_number || lead.lot_external_id) && (
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  Lote {lead.lot_number || lead.lot_external_id}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {lead.phone}
                            </p>

                            {lead.message && (
                              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground italic">
                                "{lead.message}"
                              </p>
                            )}

                            <div className="mt-3 flex items-center justify-between border-t pt-2">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(lead.created_at).toLocaleDateString("es-CO", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                              <div className="flex items-center gap-1">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-full bg-emerald-500/10 p-1 text-emerald-600 hover:bg-emerald-500/20"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="size-3" />
                                </a>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lead Detail Sheet (Slide-over) */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedLead && (
            <div className="flex flex-col gap-6 py-2">
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      (LEAD_STATUS_CONFIG[selectedLead.status] || LEAD_STATUS_CONFIG.new).badgeClass
                    }`}
                  >
                    {(LEAD_STATUS_CONFIG[selectedLead.status] || LEAD_STATUS_CONFIG.new).label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(selectedLead.created_at).toLocaleString("es-CO")}
                  </span>
                </div>
                <SheetTitle className="font-serif text-2xl text-foreground mt-2">
                  {selectedLead.full_name}
                </SheetTitle>
                <SheetDescription>
                  {selectedLead.project_name || "Villa Paraíso"} · Solicitud de separación y
                  contacto
                </SheetDescription>
              </SheetHeader>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <Phone className="size-3.5 text-blue-600" />
                  Llamar ({selectedLead.phone})
                </a>
                <a
                  href={buildWhatsAppReserveUrl({
                    fullName: selectedLead.full_name,
                    phone: selectedLead.phone,
                    lotNumber: selectedLead.lot_number || selectedLead.lot_external_id || undefined,
                    projectName: selectedLead.project_name || "Villa Paraíso",
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  <MessageCircle className="size-3.5" />
                  Contactar por WhatsApp
                </a>
                {selectedLead.status !== "reserved" && selectedLead.status !== "won" && (
                  <Button
                    size="sm"
                    variant="default"
                    className="rounded-full text-xs"
                    onClick={() => setReserveModalOpen(true)}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Confirmar reserva oficial
                  </Button>
                )}
              </div>

              {/* Customer & Lot Details */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/20 p-4 text-xs">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Lote solicitado
                  </p>
                  <p className="mt-1 font-mono font-medium text-sm text-foreground">
                    {selectedLead.lot_number || selectedLead.lot_external_id
                      ? `Lote ${selectedLead.lot_number || selectedLead.lot_external_id}`
                      : "Interés general en proyecto"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Fecha tentativa visita
                  </p>
                  <p className="mt-1 font-medium text-sm text-foreground">
                    {selectedLead.visit_date || "No especificada"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Correo electrónico
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedLead.email || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    Habeas Data (Ley 1581)
                  </p>
                  <p className="mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Autorizado el {new Date(selectedLead.consent_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedLead.message && (
                  <div className="col-span-2 border-t pt-2 mt-1">
                    <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                      Mensaje del cliente
                    </p>
                    <p className="mt-1 text-foreground italic">"{selectedLead.message}"</p>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cambiar estado comercial
                </label>
                <Select
                  value={selectedLead.status}
                  onValueChange={(val) => handleStatusChange(selectedLead.id, val as LeadStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timeline & Notes */}
              <div className="flex flex-col gap-3 border-t pt-4">
                <h4 className="font-serif text-lg text-foreground">Historial de seguimiento</h4>

                {/* Add Note Form */}
                <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={newNoteKind}
                      onValueChange={(v) => setNewNoteKind(v as LeadEventKind)}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Nota interna</SelectItem>
                        <SelectItem value="call">Llamada telefónica</SelectItem>
                        <SelectItem value="whatsapp">Mensaje WhatsApp</SelectItem>
                        <SelectItem value="email">Correo electrónico</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">Registrar interacción</span>
                  </div>
                  <Textarea
                    placeholder="Escribe el resultado de la llamada o el avance con el cliente…"
                    rows={2}
                    value={newNoteBody}
                    onChange={(e) => setNewNoteBody(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={isAddingNote || !newNoteBody.trim()}
                      className="rounded-full text-xs"
                    >
                      {isAddingNote ? <Spinner className="size-3" /> : <Send className="size-3" />}
                      Guardar nota
                    </Button>
                  </div>
                </div>

                {/* Events Timeline */}
                <div className="flex flex-col gap-3 mt-2">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Spinner className="size-5 text-accent" />
                    </div>
                  ) : !selectedLead.events || selectedLead.events.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">
                      No hay notas registradas para este prospecto.
                    </p>
                  ) : (
                    selectedLead.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 rounded-lg border bg-muted/10 p-3 text-xs"
                      >
                        <div className="mt-0.5 rounded-full bg-accent/10 p-1.5 text-accent">
                          {ev.kind === "call" ? (
                            <PhoneCall className="size-3" />
                          ) : ev.kind === "whatsapp" ? (
                            <MessageCircle className="size-3" />
                          ) : ev.kind === "status_change" ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <MessageSquare className="size-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                              {ev.kind === "call"
                                ? "Llamada"
                                : ev.kind === "whatsapp"
                                  ? "WhatsApp"
                                  : ev.kind === "status_change"
                                    ? "Cambio de estado"
                                    : "Nota comercial"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(ev.created_at).toLocaleString("es-CO", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-foreground leading-relaxed">{ev.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Official Reserve Confirmation Modal */}
      <Dialog open={reserveModalOpen} onOpenChange={setReserveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              ¿Confirmar reserva oficial del lote?
            </DialogTitle>
            <DialogDescription>
              Al confirmar, el estado del cliente cambiará a <strong>Reservado</strong> y el lote{" "}
              <strong>
                {selectedLead?.lot_number || selectedLead?.lot_external_id || "seleccionado"}
              </strong>{" "}
              quedará bloqueado en el inventario comercial de Villa Paraíso a nombre de{" "}
              <strong>{selectedLead?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">
            Podrás gestionar la fecha de vigencia del pago de separación desde el panel de{" "}
            <strong>Lotes y unidades</strong>.
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReserveModalOpen(false)}
              disabled={isConfirmingReserve}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmOfficialReserve}
              disabled={isConfirmingReserve}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isConfirmingReserve ? (
                <Spinner className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Confirmar reserva y bloquear lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
