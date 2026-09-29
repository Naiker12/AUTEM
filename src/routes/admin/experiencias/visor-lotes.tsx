import { createFileRoute } from "@tanstack/react-router";
import { Eye, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLotArea, formatLotPrice, type Lot } from "@/data/lots";
import { usePublishedLots, usePublishedProject } from "@/lib/public-projects";
import { cn } from "@/lib/utils";
import { publicProjectMediaUrl } from "@/lib/project-repository";

export const Route = createFileRoute("/admin/experiencias/visor-lotes")({
  component: LotViewerExperiencePage,
});

type StatusFilter = "Todos" | Lot["status"];
const PROJECT_SLUG = "villa-paraiso";
const LOTS_PER_PAGE = 10;

function LotViewerExperiencePage() {
  const { project } = usePublishedProject(PROJECT_SLUG);
  const { lots } = usePublishedLots(project?.id, PROJECT_SLUG);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("Todos");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [showArea, setShowArea] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [page, setPage] = useState(1);

  const filteredLots = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-CO");
    return lots.filter(
      (lot) =>
        (status === "Todos" || lot.status === status) &&
        (!normalized ||
          [lot.id, lot.detail, lot.manzana ?? "", String(lot.lotNumber ?? "")].some((value) =>
            value.toLocaleLowerCase("es-CO").includes(normalized),
          )),
    );
  }, [lots, query, status]);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  useEffect(() => {
    if (!selectedLotId && lots[0]) setSelectedLotId(lots[0].id);
  }, [lots, selectedLotId]);

  const selectedLot = lots.find((lot) => lot.id === selectedLotId) ?? filteredLots[0] ?? lots[0];
  const availableLots = lots.filter(
    (lot) => lot.status === "Disponible" || lot.status === "Últimas unidades",
  ).length;
  const pageCount = Math.max(1, Math.ceil(filteredLots.length / LOTS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * LOTS_PER_PAGE;
  const visibleLots = filteredLots.slice(pageStart, pageStart + LOTS_PER_PAGE);
  const pageNumbers = getPaginationPages(currentPage, pageCount);

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-5 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Experiencias del proyecto · Borrador local
          </p>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Visor de lotes</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Configura la consulta comercial de lotes: inventario, filtros y ficha. El Masterplan
            territorial se administra en su propio módulo.
          </p>
        </div>
        <Badge variant="outline">Villa Paraíso · Sin publicar</Badge>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Resumen del inventario">
        <Metric label="Inventario total" value={lots.length} description="Lotes cargados" />
        <Metric label="Disponibles" value={availableLots} description="Incluye últimas unidades" />
        <Metric
          label="Resultados actuales"
          value={filteredLots.length}
          description="Según filtros del visor"
        />
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.7fr)]">
        <Card id="inventario" className="min-w-0 rounded-2xl">
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <Search className="size-5 text-accent" /> Inventario del visor
              </CardTitle>
              <CardDescription>
                Selecciona un lote para comprobar su ficha comercial y ubicación.
              </CardDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder="Buscar lote, manzana o referencia"
                  aria-label="Buscar lote"
                />
              </div>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
                <SelectTrigger aria-label="Filtrar por estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Todos">Todos los estados</SelectItem>
                    <SelectItem value="Disponible">Disponibles</SelectItem>
                    <SelectItem value="Últimas unidades">Últimas unidades</SelectItem>
                    <SelectItem value="Reservado">Reservados</SelectItem>
                    <SelectItem value="Vendido">Vendidos</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead className="hidden sm:table-cell">Manzana</TableHead>
                  <TableHead className="hidden md:table-cell">Área</TableHead>
                  <TableHead className="hidden lg:table-cell">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLots.map((lot) => (
                  <LotRow
                    key={lot.id}
                    lot={lot}
                    selected={lot.id === selectedLot?.id}
                    onSelect={() => setSelectedLotId(lot.id)}
                  />
                ))}
              </TableBody>
            </Table>
            <div className="mt-5 flex flex-col gap-4 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs text-muted-foreground">
                {filteredLots.length
                  ? `Mostrando ${pageStart + 1}–${Math.min(pageStart + LOTS_PER_PAGE, filteredLots.length)} de ${filteredLots.length} lotes.`
                  : "No hay lotes que coincidan con los filtros."}
              </p>
              {filteredLots.length > 0 && (
                <InventoryPagination
                  currentPage={currentPage}
                  pageCount={pageCount}
                  pageNumbers={pageNumbers}
                  onPageChange={setPage}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" /> Ficha del lote
            </CardTitle>
            <CardDescription>
              Ubicación y datos visibles para la consulta comercial.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {selectedLot && (
              <>
                <LotLocationPreview lot={selectedLot} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Lote seleccionado
                    </p>
                    <p className="mt-1 font-serif text-2xl text-foreground">{selectedLot.id}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedLot.detail}</p>
                  </div>
                  <StatusBadge status={selectedLot.status} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {showArea && <Info label="Área" value={formatLotArea(selectedLot.area)} />}
                  <Info label="Manzana" value={selectedLot.manzana ?? "Por confirmar"} />
                  {showPrice && <Info label="Precio" value={formatLotPrice(selectedLot.price)} />}
                  {showStatus && <Info label="Estado" value={selectedLot.status} />}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4" /> Contenido de la ficha pública
            </CardTitle>
            <CardDescription>
              Define qué atributos comerciales se incluyen al abrir un lote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldGroup className="grid gap-4 md:grid-cols-3">
                <DisplayField
                  label="Área del lote"
                  description="Muestra los metros cuadrados."
                  checked={showArea}
                  onCheckedChange={setShowArea}
                />
                <DisplayField
                  label="Precio de referencia"
                  description="Muestra el valor comercial."
                  checked={showPrice}
                  onCheckedChange={setShowPrice}
                />
                <DisplayField
                  label="Estado comercial"
                  description="Disponible, reservado o vendido."
                  checked={showStatus}
                  onCheckedChange={setShowStatus}
                />
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="size-4" /> Vista pública
            </CardTitle>
            <CardDescription>
              La ficha se abre al seleccionar un lote desde el visor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {[showArea, showPrice, showStatus].filter(Boolean).length} atributos visibles
            </Badge>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function InventoryPagination({
  currentPage,
  pageCount,
  pageNumbers,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  pageNumbers: Array<number | "ellipsis">;
  onPageChange: (page: number) => void;
}) {
  const goToPage = (nextPage: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onPageChange(nextPage);
  };

  return (
    <Pagination className="mx-0 w-auto justify-start lg:justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#inventario"
            onClick={goToPage(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
        {pageNumbers.map((pageNumber, index) =>
          pageNumber === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#inventario"
                isActive={pageNumber === currentPage}
                onClick={goToPage(pageNumber)}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#inventario"
            onClick={goToPage(Math.min(pageCount, currentPage + 1))}
            aria-disabled={currentPage === pageCount}
            className={cn(currentPage === pageCount && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function getPaginationPages(currentPage: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);

  if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", pageCount];
  if (currentPage >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", pageCount];
}

function Metric({
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
function LotRow({
  lot,
  selected,
  onSelect,
}: {
  lot: Lot;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TableRow className={cn("cursor-pointer", selected && "bg-muted/60")} onClick={onSelect}>
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
    </TableRow>
  );
}
function StatusBadge({ status }: { status: Lot["status"] }) {
  return (
    <Badge
      variant={status === "Disponible" || status === "Últimas unidades" ? "secondary" : "outline"}
    >
      {status}
    </Badge>
  );
}
function LotLocationPreview({ lot }: { lot: Lot }) {
  const [cx, cy] = lot.centroid ?? [1200, 1162];
  const scope = 520;
  return (
    <div className="overflow-hidden rounded-xl border bg-muted">
      <svg
        viewBox={`${Math.max(0, cx - scope / 2)} ${Math.max(0, cy - scope / 2)} ${scope} ${scope}`}
        className="aspect-square w-full"
        role="img"
        aria-label={`Ubicación del lote ${lot.id}`}
      >
        <image
          href={
            publicProjectMediaUrl(
              "00000000-0000-0000-0000-000000000101/masterplan/masterplan-clean.svg",
            ) ?? ""
          }
          x="0"
          y="0"
          width="2400"
          height="2324"
          preserveAspectRatio="xMidYMid slice"
        />
        <path
          d={lot.pathD}
          fill="var(--accent)"
          fillOpacity="0.42"
          stroke="var(--foreground)"
          strokeWidth="7"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
function DisplayField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <Field orientation="horizontal" className="rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-1 flex-col gap-1">
        <FieldLabel>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </Field>
  );
}
