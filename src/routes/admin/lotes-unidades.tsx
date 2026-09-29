import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Map, MapPinned, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatLotArea, formatLotPrice, type Lot, type LotStatus } from "@/data/lots";
import { getCurrentAdminAccess } from "@/lib/admin-auth";
import { requireSupabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  metadata: { isReserve?: boolean } | null;
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

function LotsAndUnitsPage() {
  const [inventory, setInventory] = useState<InventoryLot[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [masterplanUrl, setMasterplanUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | LotStatus>("todos");
  const [blockFilter, setBlockFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const selectedLot = inventory.find((lot) => lot.id === selectedLotId) ?? null;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const access = await getCurrentAdminAccess();
        if (!access) throw new Error("Inicia sesión para consultar el inventario.");
        const client = requireSupabase();
        const { data: project, error: projectError } = await client
          .from("projects")
          .select("id, slug, masterplan_path")
          .eq("organization_id", access.organizationId)
          .eq("slug", "villa-paraiso")
          .maybeSingle();
        if (projectError) throw projectError;
        if (!project) throw new Error("No se encontró Villa Paraíso en la base de datos.");
        const { data, error } = await client
          .from("lots")
          .select(
            "external_id, lot_number, manzana, status, price_cop, area_m2, centroid, geometry, metadata, updated_at",
          )
          .eq("project_id", project.id)
          .order("lot_number");
        if (error) throw error;
        if (!active) return;
        setProjectId(project.id);
        setMasterplanUrl(
          project.masterplan_path
            ? client.storage.from("project-media").getPublicUrl(project.masterplan_path).data
                .publicUrl
            : null,
        );
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
            buyer: "",
            advisor: "",
            reservationEndsAt: lot.status === "reserved" ? "Pendiente de confirmar" : undefined,
            updatedAt: lot.updated_at
              ? new Date(lot.updated_at).toLocaleDateString("es-CO")
              : "Sin fecha",
          })),
        );
      } catch (error) {
        if (active)
          setLoadError(error instanceof Error ? error.message : "No fue posible cargar los lotes.");
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

  function changeLot(lotId: string, updates: Partial<InventoryLot>) {
    setInventory((current) =>
      current.map((lot) =>
        lot.id === lotId ? { ...lot, ...updates, updatedAt: "Actualizado en esta sesión" } : lot,
      ),
    );
    if (!projectId || !updates.status) return;
    void requireSupabase()
      .from("lots")
      .update({ status: uiLotStatus[updates.status] })
      .eq("project_id", projectId)
      .eq("external_id", lotId);
  }

  function resetPage() {
    setPage(1);
  }

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Villa Paraíso · Inventario
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
      </section>
      {loadError && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {loadError}
        </p>
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
                Selecciona un lote para consultar su ficha comercial y su ubicación en el plano.
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
            <LotTable lots={pageLots} onSelect={setSelectedLotId} />
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

function LotTable({ lots, onSelect }: { lots: InventoryLot[]; onSelect: (id: string) => void }) {
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
          <TableHead>
            <span className="sr-only">Ver lote</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => (
          <TableRow key={lot.id} className="cursor-pointer" onClick={() => onSelect(lot.id)}>
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
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(lot.id);
                }}
              >
                Ver
              </Button>
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
}: {
  lot: InventoryLot | null;
  masterplanUrl: string | null;
  onOpenChange: (open: boolean) => void;
  onChangeLot: (id: string, updates: Partial<InventoryLot>) => void;
}) {
  const [buyer, setBuyer] = useState("");
  const [advisor, setAdvisor] = useState("");
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
  return (
    <Sheet open={!!lot} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-serif text-3xl">{lot.id}</SheetTitle>
          <SheetDescription>
            {lot.detail} · {lot.manzana ?? "Manzana por confirmar"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <LotInfo label="Área" value={formatLotArea(lot.area)} />
            <LotInfo label="Precio" value={formatLotPrice(lot.price)} />
            <LotInfo label="Estado" value={statusLabels[lot.status]} />
            <LotInfo label="Actualización" value={lot.updatedAt} />
          </div>
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
          <LotPlanPreview lot={lot} masterplanUrl={masterplanUrl} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lot-buyer">Comprador o interesado</FieldLabel>
              <Input
                id="lot-buyer"
                value={buyer}
                onChange={(event) => setBuyer(event.target.value)}
                placeholder={lot.buyer || "Registrar cuando exista autorización"}
              />
              <FieldDescription>
                Dato local de demostración: no se conserva al recargar ni se publica.
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
              Reserva temporal predeterminada: 48 horas. Al conectar datos, cada cambio requerirá
              usuario, fecha, motivo y registro de auditoría.
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
