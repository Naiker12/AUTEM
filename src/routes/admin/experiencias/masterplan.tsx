import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  MapPin,
  MousePointerClick,
  Orbit,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MasterplanSvgViewer from "@/components/project-view/MasterplanSvgViewer";
import {
  DEFAULT_PROJECT_VIEW_SETTINGS,
  type ProjectViewSettings,
} from "@/components/project-view/types";
import {
  formatLotArea,
  formatLotPrice,
  mapUiLotStatusToDb,
  type Lot,
  type LotStatus,
} from "@/data/lots";
import layersData from "@/data/villa-paraiso-layers.json";
import { usePublishedLots, usePublishedProject } from "@/lib/public-projects";
import { requireSupabase, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/experiencias/masterplan")({
  component: MasterplanExperiencePage,
});

function MasterplanExperiencePage() {
  const { project: publishedProject, loading: isProjectLoading } =
    usePublishedProject("villa-paraiso");
  const projectId = publishedProject?.id ?? "00000000-0000-0000-0000-000000000101";

  const { lots: initialLots, loading: areLotsLoading } = usePublishedLots(
    projectId,
    "villa-paraiso",
  );

  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("autem_admin_masterplan_lot") || "";
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedLotId) {
        sessionStorage.setItem("autem_admin_masterplan_lot", selectedLotId);
      } else {
        sessionStorage.removeItem("autem_admin_masterplan_lot");
      }
    }
  }, [selectedLotId]);
  const [pendingStatus, setPendingStatus] = useState<LotStatus>("Disponible");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [manzanaFilter, setManzanaFilter] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [focusRequest, setFocusRequest] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [viewSettings] = useState<ProjectViewSettings>(DEFAULT_PROJECT_VIEW_SETTINGS);

  // Sincronizar lotes iniciales una vez cargados
  useEffect(() => {
    if (initialLots && initialLots.length > 0) {
      setLots(initialLots);
    }
  }, [initialLots]);

  // Lote seleccionado actualmente
  const selectedLot = useMemo(() => {
    if (!selectedLotId) return null;
    const cleanId = selectedLotId.replace(/^lot-/, "");
    return (
      lots.find(
        (lot) =>
          lot.id === cleanId ||
          lot.id === `L-${cleanId}` ||
          lot.id.replace(/^L-/, "") === cleanId.replace(/^L-/, "") ||
          String(lot.lotNumber) === cleanId.replace(/^L-/, ""),
      ) ?? null
    );
  }, [lots, selectedLotId]);

  // Actualizar el estado comercial pendiente cuando cambia la selección
  useEffect(() => {
    if (selectedLot) {
      setPendingStatus(selectedLot.status);
    }
  }, [selectedLot]);

  // Lista de manzanas únicas presentes en los lotes
  const manzanas = useMemo(() => {
    const set = new Set<string>();
    for (const lot of lots) {
      if (lot.manzana) set.add(lot.manzana);
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
  }, [lots]);

  // Métricas reales del proyecto Villa Paraíso
  const metrics = useMemo(() => {
    const total = lots.length;
    let available = 0;
    let reserved = 0;
    let sold = 0;
    let totalPrice = 0;

    for (const lot of lots) {
      totalPrice += lot.price || 0;
      if (lot.status === "Disponible" || lot.status === "Últimas unidades") {
        available++;
      } else if (lot.status === "Reservado") {
        reserved++;
      } else if (lot.status === "Vendido") {
        sold++;
      }
    }

    return {
      total,
      available,
      availablePct: total > 0 ? Math.round((available / total) * 100) : 0,
      reserved,
      reservedPct: total > 0 ? Math.round((reserved / total) * 100) : 0,
      sold,
      soldPct: total > 0 ? Math.round((sold / total) * 100) : 0,
      totalPrice,
    };
  }, [lots]);

  // Filtro activo y lotes filtrados
  const isFilterActive =
    statusFilter !== "todos" || Boolean(searchQuery.trim()) || manzanaFilter !== "todas";

  const filteredLots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return lots.filter((lot) => {
      // Filtro de estado
      if (statusFilter !== "todos") {
        if (
          statusFilter === "Disponible" &&
          lot.status !== "Disponible" &&
          lot.status !== "Últimas unidades"
        ) {
          return false;
        }
        if (statusFilter === "Reservado" && lot.status !== "Reservado") {
          return false;
        }
        if (statusFilter === "Vendido" && lot.status !== "Vendido") {
          return false;
        }
      }

      // Filtro de manzana
      if (manzanaFilter !== "todas" && lot.manzana !== manzanaFilter) {
        return false;
      }

      // Búsqueda por texto (número de lote, manzana o id)
      if (query) {
        const lotNumberStr = lot.lotNumber ? String(lot.lotNumber) : "";
        const idStr = lot.id.toLowerCase();
        const manzanaStr = (lot.manzana ?? "").toLowerCase();
        const detailStr = (lot.detail ?? "").toLowerCase();
        if (
          !lotNumberStr.includes(query) &&
          !idStr.includes(query) &&
          !manzanaStr.includes(query) &&
          !detailStr.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [lots, statusFilter, manzanaFilter, searchQuery]);

  // Selección de un lote
  const handleSelectLot = useCallback((lotId: string) => {
    setSelectedLotId(lotId);
    setFocusRequest((prev) => prev + 1);
  }, []);

  // Limpiar filtros
  const handleClearFilters = useCallback(() => {
    setStatusFilter("todos");
    setManzanaFilter("todas");
    setSearchQuery("");
  }, []);

  // Guardar el nuevo estado comercial en Supabase
  const handleSaveStatus = async () => {
    if (!selectedLot) return;
    setIsSaving(true);

    try {
      if (supabase && projectId) {
        const client = requireSupabase();
        const dbStatus = mapUiLotStatusToDb(pendingStatus);

        const { error } = await client
          .from("lots")
          .update({
            status: dbStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("project_id", projectId)
          .eq("external_id", selectedLot.id);

        if (error) {
          throw error;
        }
      }

      // Actualizar estado local inmediatamente
      setLots((current) =>
        current.map((l) => (l.id === selectedLot.id ? { ...l, status: pendingStatus } : l)),
      );

      toast.success(
        `Lote ${selectedLot.lotNumber ?? selectedLot.id} actualizado a "${pendingStatus}"`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar el lote";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10 space-y-6">
      {/* Encabezado Principal */}
      <section className="flex flex-col gap-4 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-2 border-l-2 border-accent pl-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Experiencias del proyecto · Villa Paraíso
            </span>
            <Badge
              variant="outline"
              className="text-[11px] font-normal border-accent/40 text-accent"
            >
              Oficial CAD 338 Lotes
            </Badge>
          </div>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
            Masterplan interactivo
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Visualizador administrativo del plano maestro vectorial. Monitorea las capas
            cartográficas (lagos, vías, amenidades), filtra el inventario e inspecciona o actualiza
            el estado de cualquier lote directamente sobre el plano.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" asChild>
            <Link to="/proyecto/$slug" params={{ slug: "villa-paraiso" }} target="_blank">
              <ExternalLink data-icon="inline-start" className="size-4" />
              Ver en público
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/lotes-unidades">
              <Boxes data-icon="inline-start" className="size-4" />
              Inventario tabla
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/experiencias/panorama-360">
              <Orbit data-icon="inline-start" className="size-4" />
              Visor 360°
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/experiencias/recorrido-terreno">
              <Compass data-icon="inline-start" className="size-4" />
              Tour GPS
            </Link>
          </Button>
        </div>
      </section>

      {/* Indicadores de Inventario (KPIs Reales) */}
      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        aria-label="Resumen de inventario"
      >
        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Total Lotes</span>
              <Layers className="size-4 text-accent" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">
              {metrics.total || (isProjectLoading || areLotsLoading ? "…" : "338")}
            </p>
            <p className="text-xs text-muted-foreground">Polígonos vectoriales CAD</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Disponibles
              </span>
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">{metrics.available}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.availablePct}% del inventario comercial
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Reservados
              </span>
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">{metrics.reserved}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.reservedPct}% en proceso de cierre
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Vendidos
              </span>
              <Eye className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">{metrics.sold}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.soldPct}% escriturados o cerrados
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-accent">
                Valor Total
              </span>
              <Boxes className="size-4 text-accent" />
            </div>
            <p className="font-serif text-2xl font-bold text-foreground mt-1 truncate">
              {metrics.totalPrice > 0 ? formatLotPrice(metrics.totalPrice) : "$28.4B COP"}
            </p>
            <p className="text-xs text-muted-foreground">Inventario comercial</p>
          </CardContent>
        </Card>
      </section>

      {/* Barra de Filtros y Búsqueda */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/60 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Búsqueda */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar lote (ej. 302, M15)..."
              className="pl-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40">
            {(["todos", "Disponible", "Reservado", "Vendido"] as const).map((st) => (
              <Button
                key={st}
                type="button"
                variant={statusFilter === st ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="h-7 text-xs px-2.5 capitalize"
              >
                {st === "todos" ? "Todos" : st}
              </Button>
            ))}
          </div>

          {/* Filtro por Manzana */}
          {manzanas.length > 0 && (
            <Select value={manzanaFilter} onValueChange={setManzanaFilter}>
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="Manzana" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todas">Todas las manzanas</SelectItem>
                  {manzanas.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          {isFilterActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3.5" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="size-3.5 text-accent" />
          <span>
            Mostrando <strong>{filteredLots.length}</strong> de {lots.length} lotes
          </span>
        </div>
      </section>

      {/* Visor SVG y Panel de Control Lateral */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Canvas del Masterplan Vectorial */}
        <Card className="overflow-hidden rounded-2xl border shadow-sm flex flex-col min-h-[620px] h-[720px]">
          <CardHeader className="border-b py-3 px-4 sm:px-6 flex flex-row items-center justify-between bg-muted/20">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <MapPin className="size-4 text-accent" />
                Plano Vectorial Urbano
              </CardTitle>
              <CardDescription className="text-xs">
                Arrastra para navegar, usa la rueda o botones para hacer zoom y haz clic sobre un
                lote para seleccionarlo.
              </CardDescription>
            </div>
            {selectedLot && (
              <Badge variant="secondary" className="gap-1.5 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-accent" />
                Lote {selectedLot.lotNumber ?? selectedLot.id}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1 relative isolate bg-card overflow-hidden">
            {lots.length > 0 ? (
              <MasterplanSvgViewer
                lots={lots}
                filteredLots={filteredLots}
                isFilterActive={isFilterActive}
                selectedLotId={selectedLotId}
                focusRequest={focusRequest}
                onSelectLot={handleSelectLot}
                isDesktopSidebarOpen={false}
                isRightPanelOpen={Boolean(selectedLot)}
                settings={viewSettings}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                <RefreshCw className="size-5 animate-spin mr-2 text-accent" />
                Cargando masterplan de Villa Paraíso…
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Lateral: Inspector del Lote y Herramientas */}
        <div className="flex flex-col gap-6">
          {/* Card Inspector de Lote */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <MousePointerClick className="size-4 text-accent" />
                  Inspector de Lote
                </span>
                {selectedLot && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLotId("")}
                    className="h-6 px-1.5 text-xs text-muted-foreground"
                    title="Cerrar inspector"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedLot
                  ? "Datos técnicos y comerciales del lote seleccionado."
                  : "Toca o haz clic sobre cualquier lote en el plano vectorial para editarlo."}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {selectedLot ? (
                <>
                  {/* Ficha rápida del lote */}
                  <div className="rounded-xl border bg-muted/30 p-3.5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                          {selectedLot.manzana
                            ? `Manzana ${selectedLot.manzana}`
                            : "Lote campestre"}
                        </p>
                        <h3 className="font-serif text-2xl font-bold text-foreground">
                          Lote {selectedLot.lotNumber ?? selectedLot.id}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize font-semibold text-xs",
                          selectedLot.status === "Disponible" &&
                            "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          selectedLot.status === "Reservado" &&
                            "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          selectedLot.status === "Vendido" &&
                            "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {selectedLot.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                      <div>
                        <span className="text-muted-foreground">Área total:</span>
                        <p className="font-semibold text-foreground text-sm">
                          {formatLotArea(selectedLot.area)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Precio de lista:</span>
                        <p className="font-semibold text-accent text-sm">
                          {selectedLot.price > 0
                            ? formatLotPrice(selectedLot.price)
                            : "Por cotizar"}
                        </p>
                      </div>
                      {selectedLot.price > 0 && selectedLot.area > 0 && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Valor por m²:</span>
                          <p className="text-muted-foreground font-medium">
                            {formatLotPrice(Math.round(selectedLot.price / selectedLot.area))}/m²
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modificador de Estado Comercial */}
                  <div className="space-y-2">
                    <label
                      htmlFor="lot-status-select"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Actualizar estado comercial
                    </label>
                    <Select
                      value={pendingStatus}
                      onValueChange={(val) => setPendingStatus(val as LotStatus)}
                    >
                      <SelectTrigger id="lot-status-select" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Disponible">🟢 Disponible</SelectItem>
                          <SelectItem value="Reservado">🟡 Reservado</SelectItem>
                          <SelectItem value="Vendido">🔴 Vendido</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveStatus}
                    disabled={isSaving || pendingStatus === selectedLot.status}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 size-4 animate-spin" />
                        Guardando en base de datos…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" />
                        Guardar estado en Supabase
                      </>
                    )}
                  </Button>

                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Link to="/admin/lotes-unidades">
                        Abrir ficha comercial completa en Inventario →
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-dashed rounded-xl">
                  <MousePointerClick className="size-8 text-accent/60 mb-2" />
                  <p className="font-medium text-foreground text-sm">Ningún lote seleccionado</p>
                  <p className="text-xs mt-1 text-muted-foreground leading-relaxed max-w-[240px]">
                    Haz clic sobre cualquier lote en el masterplan o usa la barra de búsqueda para
                    seleccionarlo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información y Capas del Masterplan */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontal className="size-4 text-accent" />
                Capas y Dimensiones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between border-b pb-2">
                <span>Dimensiones base SVG:</span>
                <span className="font-mono font-medium text-foreground">
                  {layersData.dimensions.width} × {layersData.dimensions.height} px
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span>Cuerpos de agua (Lagos):</span>
                <span className="font-medium text-foreground">
                  {layersData.waterAreas?.length ?? 3} espejos de agua
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span>Red vial (Calzadas):</span>
                <span className="font-medium text-foreground">
                  {layersData.calzadas?.length ?? 24} tramos conectados
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Manzanas catastrales:</span>
                <span className="font-medium text-foreground">{manzanas.length} Manzanas</span>
              </div>
            </CardContent>
          </Card>

          {/* Pestaña de navegación entre experiencias */}
          <Card className="rounded-2xl border shadow-sm bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Otras Experiencias Conectadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                to="/admin/experiencias/panorama-360"
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <Orbit className="size-4 text-accent" />
                  Visor 360° (Cámara aérea)
                </span>
                <span className="text-muted-foreground">→</span>
              </Link>
              <Link
                to="/admin/experiencias/recorrido-terreno"
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <Compass className="size-4 text-accent" />
                  Tour de Terreno y GPS
                </span>
                <span className="text-muted-foreground">→</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
