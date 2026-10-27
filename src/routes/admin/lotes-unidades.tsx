import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Eye, Map, MapPinned, Pencil, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatLotArea, formatLotPrice, type Lot, type LotMetadata, type LotStatus } from "@/data/lots";
import { getCurrentAdminAccess } from "@/lib/admin-auth";
import { requireSupabase } from "@/lib/supabase";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/lotes-unidades")({ component: LotsAndUnitsPage });

type InventoryLot = Lot & {
  buyer: string;
  advisor: string;
  reservationEndsAt?: string;
  updatedAt: string;
};

type DatabaseLot = {
  external_id: string;
  lot_number: number | null;
  manzana: string | null;
  status: keyof typeof databaseLotStatus;
  price_cop: number | null;
  area_m2: number | null;
  centroid: [number, number] | null;
  geometry: { pathD?: string } | null;
  metadata: LotMetadata | null;
  updated_at: string | null;
};

const PAGE_SIZE = 12;
const databaseLotStatus: Record<
  "available" | "reserved" | "sold" | "last_units" | "hidden",
  LotStatus
> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
  last_units: "Últimas unidades",
  hidden: "Por confirmar",
};

const uiLotStatus: Record<LotStatus, "available" | "reserved" | "sold" | "last_units" | "hidden"> =
  {
    Disponible: "available",
    "Últimas unidades": "last_units",
    Reservado: "reserved",
    Vendido: "sold",
    "Por confirmar": "hidden",
  };

const statusLabels: Record<LotStatus, string> = {
  Disponible: "Disponible",
  "Últimas unidades": "Últimas unidades",
  Reservado: "Reservado",
  Vendido: "Vendido",
  "Por confirmar": "Por confirmar",
};

type ManagedProjectSummary = {
  id: string;
  slug: string;
  name: string;
  masterplan_path: string | null;
};

function LotsAndUnitsPage() {
  const [inventory, setInventory] = useState<InventoryLot[]>([]);
  const [allowedProjects, setAllowedProjects] = useState<ManagedProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ManagedProjectSummary | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [masterplanUrl, setMasterplanUrl] = useState<string | null>(null);
  const [isLoadingLots, setIsLoadingLots] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | LotStatus>("todos");
  const [blockFilter, setBlockFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);
  const [isSavingLot, setIsSavingLot] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const selectedLot = inventory.find((lot) => lot.id === selectedLotId) ?? null;

  async function loadProjectLots(project: ManagedProjectSummary) {
    setIsLoadingLots(true);
    setLoadError(null);
    setProjectId(project.id);
    setSelectedProject(project);
    setSelectedLotId(null);
    setPage(1);

    try {
      const client = requireSupabase();
      setMasterplanUrl(
        project.masterplan_path
          ? client.storage.from("project-media").getPublicUrl(project.masterplan_path).data
              .publicUrl
          : null,
      );

      const { data, error } = await client
        .from("lots")
        .select(
          "external_id, lot_number, manzana, status, price_cop, area_m2, centroid, geometry, metadata, updated_at",
        )
        .eq("project_id", project.id)
        .order("lot_number");

      if (error) throw error;

      setInventory(
        ((data ?? []) as DatabaseLot[]).map((lot) => ({
          id: lot.external_id,
          projectSlug: project.slug,
          area: Number(lot.area_m2 ?? 0),
          price: Number(lot.price_cop ?? 0),
          status: databaseLotStatus[lot.status as keyof typeof databaseLotStatus],
          detail: `${lot.manzana ? `Manzana ${lot.manzana.replace(/^M\s*/i, "")}` : "Proyecto"} · ${lot.metadata?.isReserve ? "Zona de reserva" : "Vía interna"}`,
          terrainPosition: [0, 0] as [number, number],
          centroid: lot.centroid ?? undefined,
          manzana: lot.manzana ?? undefined,
          lotNumber: lot.lot_number ?? undefined,
          pathD: lot.geometry?.pathD,
          isReserve: Boolean(lot.metadata?.isReserve),
          buyer: (lot.metadata?.buyer as string) || "",
          advisor: (lot.metadata?.advisor as string) || "",
          reservationEndsAt: lot.status === "reserved" ? "Pendiente de confirmar" : undefined,
          updatedAt: lot.updated_at
            ? new Date(lot.updated_at).toLocaleDateString("es-CO")
            : "Sin fecha",
          metadata: lot.metadata ?? undefined,
        })),
      );
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "No fue posible cargar los lotes del proyecto.",
      );
    } finally {
      setIsLoadingLots(false);
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const access = await getCurrentAdminAccess();
        if (!access) throw new Error("Inicia sesión para consultar el inventario.");
        const client = requireSupabase();

        // Validar proyectos autorizados para el usuario
        let projectQuery = client
          .from("projects")
          .select("id, slug, name, masterplan_path")
          .eq("organization_id", access.organizationId);

        if (!access.isSuperAdmin) {
          if (!access.assignedProjectIds.length) {
            throw new Error("No tienes proyectos asignados. Contacta al superadministrador.");
          }
          projectQuery = projectQuery.in("id", access.assignedProjectIds);
        }

        const { data: projs, error: projectError } = await projectQuery;
        if (projectError) throw projectError;
        if (!projs || projs.length === 0) {
          throw new Error("No tienes ningún proyecto asignado para gestionar inventario.");
        }
        if (!active) return;
        setAllowedProjects(projs);

        // Seleccionar el proyecto autorizado (por defecto Villa Paraíso si aplica o el primero asignado)
        const initialProject =
          projs.find((p) => p.slug === "villa-paraiso") || projs[0];

        await loadProjectLots(initialProject);
      } catch (error) {
        if (active)
          setLoadError(
            error instanceof Error ? error.message : "No fue posible conectar con los proyectos.",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const blocks = useMemo(
    () => [...new Set(inventory.map((lot) => lot.manzana).filter(Boolean))],
    [inventory],
  );
  const filteredLots = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-CO");
    return inventory.filter((lot) => {
      const matchesQuery =
        !normalizedQuery ||
        [lot.id, lot.detail, lot.manzana ?? "", lot.lotNumber?.toString() ?? ""].some((value) =>
          value.toLocaleLowerCase("es-CO").includes(normalizedQuery),
        );
      return (
        matchesQuery &&
        (statusFilter === "todos" || lot.status === statusFilter) &&
        (blockFilter === "todos" || lot.manzana === blockFilter)
      );
    });
  }, [blockFilter, inventory, query, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredLots.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageLots = filteredLots.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const counts = useMemo(
    () => ({
      available: inventory.filter(
        (lot) => lot.status === "Disponible" || lot.status === "Últimas unidades",
      ).length,
      reserved: inventory.filter((lot) => lot.status === "Reservado").length,
      sold: inventory.filter((lot) => lot.status === "Vendido").length,
    }),
    [inventory],
  );

  async function changeLot(lotId: string, updates: Partial<InventoryLot>) {
    setInventory((current) =>
      current.map((lot) =>
        lot.id === lotId ? { ...lot, ...updates, updatedAt: "Actualizado en esta sesión" } : lot,
      ),
    );
    if (!projectId) return;
    const client = requireSupabase();
    const targetLot = inventory.find((l) => l.id === lotId);
    const dbStatus = updates.status
      ? uiLotStatus[updates.status]
      : targetLot
        ? uiLotStatus[targetLot.status]
        : "available";
    const updatedMetadata = {
      ...(targetLot?.metadata ?? {}),
      ...(updates.metadata ?? {}),
      buyer: updates.buyer ?? targetLot?.buyer ?? "",
      advisor: updates.advisor ?? targetLot?.advisor ?? "",
    };

    const payload = [
      {
        external_id: lotId,
        area_m2: updates.area ?? targetLot?.area ?? 0,
        price_cop: updates.price ?? targetLot?.price ?? 0,
        manzana: updates.manzana ?? targetLot?.manzana ?? null,
        status: dbStatus,
        metadata: updatedMetadata,
      },
    ];

    try {
      await client.rpc("update_lot_data", { lot_data: payload });
    } catch {
      await client
        .from("lots")
        .update({
          status: dbStatus,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("external_id", lotId);
    }

    // Registrar evento en la auditoría para el Superadministrador
    void client.rpc("record_audit_event", {
      p_action: "update_lot",
      p_entity_type: "lot",
      p_entity_id: lotId,
      p_project_id: projectId,
      p_details: {
        lot_id: lotId,
        project_slug: selectedProject?.slug,
        project_name: selectedProject?.name,
        status: updates.status ?? targetLot?.status,
        buyer: updates.buyer ?? targetLot?.buyer,
        advisor: updates.advisor ?? targetLot?.advisor,
        tipo: "cambio_rapido_comercial",
      },
    });
  }

  async function handleSaveLot(
    lotId: string,
    updates: {
      manzana: string;
      area: number;
      price: number;
      status: LotStatus;
      buyer: string;
      advisor: string;
      ubicacion?: string;
      descripcion_lindero?: string;
    },
  ) {
    setIsSavingLot(true);
    setSaveFeedback(null);
    try {
      const dbStatus = uiLotStatus[updates.status];
      const targetLot = inventory.find((l) => l.id === lotId);
      const cuotaInicial = updates.price > 0 ? Math.round(updates.price * 0.20) : undefined;
      const cuotas48 = updates.price > 0 ? Math.round((updates.price * 0.80) / 48) : undefined;

      const updatedMetadata: LotMetadata = {
        ...(targetLot?.metadata ?? {}),
        buyer: updates.buyer,
        advisor: updates.advisor,
        ubicacion: updates.ubicacion ?? (targetLot?.metadata?.ubicacion as string | undefined),
        descripcion_lindero:
          updates.descripcion_lindero ?? targetLot?.metadata?.descripcion_lindero,
        ...(cuotaInicial ? { cuota_inicial_20: cuotaInicial } : {}),
        ...(cuotas48 ? { cuotas_48: cuotas48 } : {}),
      };

      setInventory((prev) =>
        prev.map((l) =>
          l.id === lotId
            ? {
                ...l,
                manzana: updates.manzana,
                area: updates.area,
                price: updates.price,
                status: updates.status,
                buyer: updates.buyer,
                advisor: updates.advisor,
                detail: `${updates.manzana ? `Manzana ${updates.manzana.replace(/^M\s*/i, "")}` : "Proyecto"} · ${targetLot?.isReserve ? "Zona de reserva" : "Vía interna"}`,
                metadata: updatedMetadata,
                updatedAt: "Recién actualizado",
              }
            : l,
        ),
      );

      if (projectId) {
        const payload = [
          {
            external_id: lotId,
            area_m2: updates.area,
            price_cop: updates.price,
            manzana: updates.manzana,
            status: dbStatus,
            metadata: updatedMetadata,
          },
        ];
        const client = requireSupabase();
        const { error: rpcErr } = await client.rpc("update_lot_data", { lot_data: payload });
        if (rpcErr) {
          await client
            .from("lots")
            .update({
              manzana: updates.manzana,
              area_m2: updates.area,
              price_cop: updates.price,
              status: dbStatus,
              metadata: updatedMetadata,
              updated_at: new Date().toISOString(),
            })
            .eq("project_id", projectId)
            .eq("external_id", lotId);
        }

        // Registrar auditoría para el Superadministrador
        void client.rpc("record_audit_event", {
          p_action: "update_lot",
          p_entity_type: "lot",
          p_entity_id: lotId,
          p_project_id: projectId,
          p_details: {
            lot_id: lotId,
            project_slug: selectedProject?.slug,
            project_name: selectedProject?.name,
            manzana: updates.manzana,
            area_m2: updates.area,
            price_cop: updates.price,
            status: updates.status,
            buyer: updates.buyer || null,
            advisor: updates.advisor || null,
            ubicacion: updates.ubicacion || null,
          },
        });
      }

      setSaveFeedback(`Lote ${lotId} actualizado exitosamente.`);
      setTimeout(() => setSaveFeedback(null), 4000);
      setEditingLot(null);
    } catch (err) {
      console.error("Error al guardar lote:", err);
      alert("Hubo un error al guardar el lote.");
    } finally {
      setIsSavingLot(false);
    }
  }

  function resetPage() {
    setPage(1);
  }

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {selectedProject ? `${selectedProject.name} · Inventario` : "Inventario de lotes"}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Lotes y unidades</h1>
            <p className="text-sm text-muted-foreground">
              {inventory.length} registros cargados desde el plano
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Controla disponibilidad, reservas y ventas desde el mismo inventario que consulta el
            plano urbanístico.
          </p>
        </div>

        {allowedProjects.length > 1 && (
          <div className="flex flex-col gap-1.5 sm:items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Proyecto activo
            </span>
            <Select
              value={selectedProject?.id}
              onValueChange={(id) => {
                const proj = allowedProjects.find((p) => p.id === id);
                if (proj) void loadProjectLots(proj);
              }}
            >
              <SelectTrigger className="w-[220px] font-medium bg-card">
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {allowedProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </section>
      {loadError && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {loadError}
        </p>
      )}
      {saveFeedback && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{saveFeedback}</span>
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <InventoryMetric
          label="Disponibles"
          value={counts.available}
          description="Lotes que se pueden ofrecer"
        />
        <InventoryMetric
          label="Reservados"
          value={counts.reserved}
          description="Con reserva temporal activa"
        />
        <InventoryMetric
          label="Vendidos"
          value={counts.sold}
          description="Cierre comercial registrado"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-2xl">
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-1">
              <CardTitle className="font-serif text-2xl">Inventario del proyecto</CardTitle>
              <CardDescription>
                Selecciona un lote para consultar su ficha comercial y su ubicación en el plano, o haz clic en el icono de lápiz para editar sus datos.
              </CardDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    resetPage();
                  }}
                  className="pl-9"
                  placeholder="Buscar lote, manzana o referencia"
                  aria-label="Buscar lote"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as "todos" | LotStatus);
                  resetPage();
                }}
              >
                <SelectTrigger aria-label="Filtrar por estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    {Object.values(statusLabels).map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={blockFilter}
                onValueChange={(value) => {
                  setBlockFilter(value);
                  resetPage();
                }}
              >
                <SelectTrigger aria-label="Filtrar por manzana">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="todos">Todas las manzanas</SelectItem>
                    {blocks.map((block) => (
                      <SelectItem key={block} value={block ?? ""}>
                        {block}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <LotTable
              lots={pageLots}
              onSelect={setSelectedLotId}
              onEdit={(lot) => setEditingLot(lot)}
            />
            <LotPagination
              page={currentPage}
              totalPages={totalPages}
              total={filteredLots.length}
              onChange={setPage}
            />
          </CardContent>
        </Card>
        <MasterplanCard selectedLot={selectedLot} masterplanUrl={masterplanUrl} />
      </section>
      <LotDetailSheet
        lot={selectedLot}
        masterplanUrl={masterplanUrl}
        onOpenChange={(open) => !open && setSelectedLotId(null)}
        onChangeLot={changeLot}
        onEdit={(lot) => setEditingLot(lot)}
      />
      <EditLotDialog
        editingLot={editingLot}
        isSaving={isSavingLot}
        onClose={() => setEditingLot(null)}
        onSave={handleSaveLot}
      />
    </main>
  );
}

function InventoryMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-serif text-3xl text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function LotTable({
  lots,
  onSelect,
  onEdit,
}: {
  lots: InventoryLot[];
  onSelect: (id: string) => void;
  onEdit: (lot: InventoryLot) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lote</TableHead>
          <TableHead className="hidden sm:table-cell">Manzana</TableHead>
          <TableHead className="hidden md:table-cell">Área</TableHead>
          <TableHead className="hidden lg:table-cell">Precio</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="hidden xl:table-cell">Gestión comercial</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => (
          <TableRow key={lot.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onSelect(lot.id)}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{lot.id}</span>
                <span className="text-xs text-muted-foreground">{lot.detail}</span>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{lot.manzana ?? "—"}</TableCell>
            <TableCell className="hidden md:table-cell">{formatLotArea(lot.area)}</TableCell>
            <TableCell className="hidden lg:table-cell">{formatLotPrice(lot.price)}</TableCell>
            <TableCell>
              <StatusBadge status={lot.status} />
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              <span className="text-xs text-muted-foreground">
                {lot.buyer
                  ? `${lot.buyer} · ${lot.advisor || "Sin asesor"}`
                  : "Sin gestión registrada"}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onSelect(lot.id)}
                  title="Ver en plano y ficha técnica"
                >
                  <Eye className="mr-1 size-3.5" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-accent/40 bg-accent/10 px-2.5 text-xs font-medium text-accent hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onEdit(lot)}
                  title={`Editar datos del ${lot.id}`}
                >
                  <Pencil className="mr-1 size-3.5" />
                  Editar
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatusBadge({ status }: { status: LotStatus }) {
  return (
    <Badge
      variant={status === "Disponible" ? "secondary" : status === "Vendido" ? "outline" : "default"}
    >
      {status}
    </Badge>
  );
}

function LotPagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1,
  );
  return (
    <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total} lotes encontrados · página {page} de {totalPages}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              href="#inventario"
              size="default"
              onClick={(event) => {
                event.preventDefault();
                onChange(Math.max(1, page - 1));
              }}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            >
              Anterior
            </PaginationLink>
          </PaginationItem>
          {pages.map((item) => (
            <PaginationItem key={item}>
              <PaginationLink
                href="#inventario"
                isActive={item === page}
                onClick={(event) => {
                  event.preventDefault();
                  onChange(item);
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationLink
              href="#inventario"
              size="default"
              onClick={(event) => {
                event.preventDefault();
                onChange(Math.min(totalPages, page + 1));
              }}
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
            >
              Siguiente
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function MasterplanCard({
  selectedLot,
  masterplanUrl,
}: {
  selectedLot: InventoryLot | null;
  masterplanUrl: string | null;
}) {
  return (
    <Card className="h-fit rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPinned className="size-4" /> Plano urbanístico
        </CardTitle>
        <CardDescription>Vista de referencia del inventario cargado.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {selectedLot ? (
          <>
            <LotPlanPreview lot={selectedLot} masterplanUrl={masterplanUrl} />
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Lote enfocado
                  </p>
                  <p className="font-serif text-xl text-foreground">{selectedLot.id}</p>
                </div>
                <StatusBadge status={selectedLot.status} />
              </div>
              <p className="text-sm text-muted-foreground">{selectedLot.detail}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Área</p>
                  <p className="font-medium">{formatLotArea(selectedLot.area)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Manzana</p>
                  <p className="font-medium">{selectedLot.manzana ?? "Por confirmar"}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border bg-muted">
              {masterplanUrl && (
                <img
                  src={masterplanUrl}
                  alt="Plano urbanístico de Villa Paraíso"
                  className="aspect-square w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-dashed p-4">
              <Map className="size-5 text-accent" />
              <p className="text-sm font-medium">Selecciona un lote</p>
              <p className="text-sm text-muted-foreground">
                El plano se acercará a su zona y mostrará los datos de espacio disponibles.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LotPlanPreview({
  lot,
  masterplanUrl,
}: {
  lot: InventoryLot;
  masterplanUrl: string | null;
}) {
  const [cx, cy] = lot.centroid ?? [1200, 1162];
  const scope = 480;
  const viewBox = `${Math.max(0, cx - scope / 2)} ${Math.max(0, cy - scope / 2)} ${scope} ${scope}`;
  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted">
      <svg
        viewBox={viewBox}
        className="aspect-square w-full"
        role="img"
        aria-label={`Detalle del lote ${lot.id} en el plano urbanístico`}
      >
        {masterplanUrl && (
          <image
            href={masterplanUrl}
            x="0"
            y="0"
            width="2400"
            height="2324"
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        <path
          d={lot.pathD}
          fill="var(--accent)"
          fillOpacity="0.48"
          stroke="var(--foreground)"
          strokeWidth="7"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow-sm">
        Zona de {lot.id}
      </div>
    </div>
  );
}

function LotDetailSheet({
  lot,
  masterplanUrl,
  onOpenChange,
  onChangeLot,
  onEdit,
}: {
  lot: InventoryLot | null;
  masterplanUrl: string | null;
  onOpenChange: (open: boolean) => void;
  onChangeLot: (id: string, updates: Partial<InventoryLot>) => void;
  onEdit?: (lot: InventoryLot) => void;
}) {
  const [buyer, setBuyer] = useState("");
  const [advisor, setAdvisor] = useState("");

  useEffect(() => {
    if (lot) {
      setBuyer(lot.buyer || "");
      setAdvisor(lot.advisor || "");
    }
  }, [lot]);

  if (!lot) return null;
  const reserve = () =>
    onChangeLot(lot.id, {
      status: "Reservado",
      buyer: buyer.trim(),
      advisor: advisor.trim(),
      reservationEndsAt: "48 horas desde la reserva",
    });
  const sell = () =>
    onChangeLot(lot.id, {
      status: "Vendido",
      buyer: buyer.trim(),
      advisor: advisor.trim(),
      reservationEndsAt: undefined,
    });

  const metadata = lot.metadata;

  return (
    <Sheet open={!!lot} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="font-serif text-3xl">{lot.id}</SheetTitle>
              <SheetDescription>
                {lot.detail} · {lot.manzana ?? "Manzana por confirmar"}
              </SheetDescription>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-accent/40 bg-accent/10 font-medium text-accent hover:bg-accent hover:text-accent-foreground"
                onClick={() => onEdit(lot)}
              >
                <Pencil className="size-3.5" />
                Editar lote
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <LotInfo label="Área" value={formatLotArea(lot.area)} />
            <LotInfo label="Precio" value={formatLotPrice(lot.price)} />
            <LotInfo label="Estado" value={statusLabels[lot.status]} />
            <LotInfo label="Actualización" value={lot.updatedAt} />
          </div>

          {/* Información Financiera y de Preventa si existe */}
          {metadata && (metadata.precio_preventa || metadata.cuota_inicial_20) && (
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] font-semibold text-accent">
                Plan comercial y financiamiento
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                {metadata.precio_preventa && (
                  <div>
                    <span className="text-muted-foreground">Precio Preventa:</span>
                    <p className="font-semibold text-foreground text-sm">
                      {formatLotPrice(metadata.precio_preventa)}
                    </p>
                  </div>
                )}
                {metadata.precio_venta && (
                  <div>
                    <span className="text-muted-foreground">Precio Regular:</span>
                    <p className="font-semibold text-foreground text-sm">
                      {formatLotPrice(metadata.precio_venta)}
                    </p>
                  </div>
                )}
                {metadata.cuota_inicial_20 && (
                  <div>
                    <span className="text-muted-foreground">Cuota inicial (20%):</span>
                    <p className="font-semibold text-foreground">
                      {formatLotPrice(metadata.cuota_inicial_20)}
                    </p>
                  </div>
                )}
                {metadata.cuotas_48 && (
                  <div>
                    <span className="text-muted-foreground">48 Cuotas mes:</span>
                    <p className="font-semibold text-foreground">
                      {formatLotPrice(metadata.cuotas_48)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medidas lineales y linderos legales cargados */}
          {metadata?.descripcion_lindero ? (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.14em] font-semibold text-accent">
                  Linderos y especificaciones legales
                </p>
                {metadata.ubicacion && (
                  <Badge variant="outline" className="text-[10px] border-accent/40 bg-accent/10 text-accent">
                    {metadata.ubicacion}
                  </Badge>
                )}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-foreground whitespace-pre-line">
                {metadata.descripcion_lindero}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Medidas lineales
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">Pendientes de cargar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Frente, fondo y linderos se mostrarán aquí cuando se incorporen a la ficha técnica del
                lote.
              </p>
            </div>
          )}

          <LotPlanPreview lot={lot} masterplanUrl={masterplanUrl} />

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lot-buyer">Comprador o interesado</FieldLabel>
              <Input
                id="lot-buyer"
                value={buyer}
                onChange={(event) => setBuyer(event.target.value)}
                placeholder={lot.buyer || "Nombre del cliente"}
              />
              <FieldDescription>
                Se guarda en la base de datos vinculado a la gestión comercial de este lote.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="lot-advisor">Asesor responsable</FieldLabel>
              <Input
                id="lot-advisor"
                value={advisor}
                onChange={(event) => setAdvisor(event.target.value)}
                placeholder={lot.advisor || "Asignar asesor"}
              />
            </Field>
          </FieldGroup>
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-accent" />
              <p className="font-medium">Gestión comercial</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Reserva temporal predeterminada: 48 horas. Al cambiar el estado, se actualizará
              directamente en la base de datos de Villa Paraíso.
            </p>
            {lot.reservationEndsAt && <p className="text-sm">Reserva: {lot.reservationEndsAt}</p>}
          </div>
        </div>
        <SheetFooter className="mt-6 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChangeLot(lot.id, {
                status: "Disponible",
                buyer: "",
                advisor: "",
                reservationEndsAt: undefined,
              })
            }
          >
            Liberar lote
          </Button>
          <Button type="button" variant="secondary" onClick={reserve}>
            <CheckCircle2 data-icon="inline-start" /> Reservar 48 h
          </Button>
          <Button type="button" onClick={sell}>
            <CheckCircle2 data-icon="inline-start" /> Registrar venta
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function LotInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

interface EditLotDialogProps {
  editingLot: InventoryLot | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (
    lotId: string,
    updates: {
      manzana: string;
      area: number;
      price: number;
      status: LotStatus;
      buyer: string;
      advisor: string;
      ubicacion?: string;
      descripcion_lindero?: string;
    },
  ) => Promise<void>;
}

function EditLotDialog({ editingLot, isSaving, onClose, onSave }: EditLotDialogProps) {
  const [manzana, setManzana] = useState("");
  const [area, setArea] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<LotStatus>("Disponible");
  const [buyer, setBuyer] = useState("");
  const [advisor, setAdvisor] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcionLindero, setDescripcionLindero] = useState("");

  useEffect(() => {
    if (editingLot) {
      setManzana(editingLot.manzana || "");
      setArea(editingLot.area || 0);
      setPrice(editingLot.price || 0);
      setStatus(editingLot.status);
      setBuyer(editingLot.buyer || "");
      setAdvisor(editingLot.advisor || "");
      setUbicacion(String(editingLot.metadata?.ubicacion || ""));
      setDescripcionLindero(editingLot.metadata?.descripcion_lindero || "");
    }
  }, [editingLot]);

  if (!editingLot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(editingLot.id, {
      manzana: manzana.trim(),
      area: Number(area),
      price: Number(price),
      status,
      buyer: buyer.trim(),
      advisor: advisor.trim(),
      ubicacion: ubicacion.trim() || undefined,
      descripcion_lindero: descripcionLindero.trim() || undefined,
    });
  };

  return (
    <Dialog open={!!editingLot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-2xl">
                Editar Lote {editingLot.id}
              </DialogTitle>
              <DialogDescription>
                Modifica la información comercial, medidas y linderos que se actualizan directamente en la base de datos y en el plano interactivo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-manzana" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Manzana
              </label>
              <Input
                id="edit-manzana"
                value={manzana}
                onChange={(e) => setManzana(e.target.value)}
                placeholder="Ej. M1, M2"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-status" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Estado Comercial
              </label>
              <Select value={status} onValueChange={(val) => setStatus(val as LotStatus)}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(statusLabels).map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="edit-area" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Área (m²)
              </label>
              <Input
                id="edit-area"
                type="number"
                step="0.01"
                min="0"
                value={area || ""}
                onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                placeholder="Ej. 132.50"
                required
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Visualización: {formatLotArea(area)}
              </span>
            </div>

            <div>
              <label htmlFor="edit-price" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Precio (COP)
              </label>
              <Input
                id="edit-price"
                type="number"
                step="1000"
                min="0"
                value={price || ""}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="Ej. 45000000"
                required
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Visualización: {formatLotPrice(price)}
              </span>
            </div>

            {price > 0 && (
              <div className="sm:col-span-2 rounded-xl border border-accent/20 bg-accent/5 p-3.5">
                <p className="text-xs uppercase tracking-wider font-semibold text-accent mb-2">
                  Plan Financiero Estimado (20% inicial / 48 cuotas)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Precio Total:</span>
                    <span className="font-semibold text-foreground text-sm">{formatLotPrice(price)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Cuota Inicial (20%):</span>
                    <span className="font-semibold text-foreground text-sm">
                      {formatLotPrice(Math.round(price * 0.2))}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">48 Cuotas mes (80%):</span>
                    <span className="font-semibold text-foreground text-sm">
                      {formatLotPrice(Math.round((price * 0.8) / 48))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="edit-ubicacion" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Ubicación
              </label>
              <Input
                id="edit-ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej. Esquina, Central"
              />
            </div>

            <div>
              <label htmlFor="edit-buyer" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Comprador / Interesado
              </label>
              <Input
                id="edit-buyer"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="edit-advisor" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Asesor Responsable
              </label>
              <Input
                id="edit-advisor"
                value={advisor}
                onChange={(e) => setAdvisor(e.target.value)}
                placeholder="Nombre del asesor"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="edit-linderos" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Linderos y Descripción Legal
              </label>
              <Textarea
                id="edit-linderos"
                rows={4}
                value={descripcionLindero}
                onChange={(e) => setDescripcionLindero(e.target.value)}
                placeholder="Por el frente linda con... por la derecha... por la izquierda... por el fondo..."
                className="font-mono text-xs"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Este texto se muestra en la ficha técnica y legal de cada lote.
              </span>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

