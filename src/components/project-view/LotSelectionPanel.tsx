import { memo, useEffect, useState } from "react";
import {
  Box,
  Download,
  MessageCircle,
  PanelLeftClose,
  Ruler,
  ScanLine,
  Search,
  SlidersHorizontal,
  Trees,
} from "lucide-react";
import LotSearchDialog from "./LotSearchDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { formatLotArea, formatLotPrice, type Lot } from "@/data/lots";

interface LotSelectionPanelProps {
  lots: Lot[];
  selectedId: string;
  onSelect: (lot: Lot) => void;
  onView3D: () => void;
  onViewAR?: () => void;
  onHide: () => void;
  mobileOpen?: boolean;
  isMobileSplit?: boolean;
  // Propiedades opcionales para control compartido de filtros
  filteredLots?: Lot[];
  status?: string;
  onStatusChange?: (status: string) => void;
  minArea?: string;
  onMinAreaChange?: (area: string) => void;
  maxPrice?: string;
  onMaxPriceChange?: (price: string) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  onClearAdvanced?: () => void;
}

export default function LotSelectionPanel({
  lots,
  selectedId,
  onSelect,
  onView3D,
  onViewAR,
  onHide,
  mobileOpen = false,
  isMobileSplit = false,
  filteredLots: controlledFilteredLots,
  status: controlledStatus,
  onStatusChange: controlledOnStatusChange,
  minArea: controlledMinArea,
  onMinAreaChange: controlledOnMinAreaChange,
  maxPrice: controlledMaxPrice,
  onMaxPriceChange: controlledOnMaxPriceChange,
  sort: controlledSort,
  onSortChange: controlledOnSortChange,
  onClearAdvanced: controlledOnClearAdvanced,
}: LotSelectionPanelProps) {
  const [internalStatus, setInternalStatus] = useState("Todos");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [internalMinArea, setInternalMinArea] = useState("all");
  const [internalMaxPrice, setInternalMaxPrice] = useState("all");
  const [internalSort, setInternalSort] = useState("lot-asc");

  const status = controlledStatus ?? internalStatus;
  const setStatus = controlledOnStatusChange ?? setInternalStatus;
  const minArea = controlledMinArea ?? internalMinArea;
  const setMinArea = controlledOnMinAreaChange ?? setInternalMinArea;
  const maxPrice = controlledMaxPrice ?? internalMaxPrice;
  const setMaxPrice = controlledOnMaxPriceChange ?? setInternalMaxPrice;
  const sort = controlledSort ?? internalSort;
  const setSort = controlledOnSortChange ?? setInternalSort;
  const handleClearAdvanced = () => {
    if (controlledOnClearAdvanced) {
      controlledOnClearAdvanced();
    } else {
      setInternalMinArea("all");
      setInternalMaxPrice("all");
      setInternalSort("lot-asc");
    }
  };

  const statusLots =
    status === "Todos"
      ? lots
      : status === "Reservados"
        ? lots.filter((lot) => lot.status === "Reservado")
        : status === "Vendidos"
          ? lots.filter((lot) => lot.status === "Vendido")
          : lots.filter((lot) => lot.status === "Disponible" || lot.status === "Últimas unidades");

  const computedFilteredLots = statusLots
    .filter((lot) => minArea === "all" || lot.area >= Number(minArea))
    .filter((lot) => maxPrice === "all" || lot.price <= Number(maxPrice) * 1_000_000)
    .sort((first, second) => {
      if (sort === "lot-asc") return (first.lotNumber ?? 0) - (second.lotNumber ?? 0);
      if (sort === "lot-desc") return (second.lotNumber ?? 0) - (first.lotNumber ?? 0);
      if (sort === "area-desc") return second.area - first.area;
      if (sort === "area-asc") return first.area - second.area;
      if (sort === "price-asc") return first.price - second.price;
      if (sort === "price-desc") return second.price - first.price;
      return (first.lotNumber ?? 0) - (second.lotNumber ?? 0);
    });

  const filteredLots = controlledFilteredLots ?? computedFilteredLots;

  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(
    "Hola AUTEM, quiero recibir asesoría sobre los lotes del plano maestro.",
  )}`;

  if (isMobileSplit) {
    return (
      <div
        aria-label="Catálogo de lotes"
        className="flex h-full w-full flex-col overflow-hidden bg-background/95 text-foreground backdrop-blur-2xl"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <LotCatalog
            lots={lots}
            filteredLots={filteredLots}
            selectedId={selectedId}
            status={status}
            advancedOpen={advancedOpen}
            minArea={minArea}
            maxPrice={maxPrice}
            sort={sort}
            onStatusChange={setStatus}
            onAdvancedOpenChange={() => setAdvancedOpen((value) => !value)}
            onMinAreaChange={setMinArea}
            onMaxPriceChange={setMaxPrice}
            onSortChange={setSort}
            onClearAdvanced={handleClearAdvanced}
            onSelect={onSelect}
            onView3D={onView3D}
            onViewAR={onViewAR}
            contactUrl={contactUrl}
            isMobile
          />
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Catálogo de lotes"
      className={`${mobileOpen ? "fixed inset-y-0 left-0 flex pt-14 sm:pt-16 lg:pt-[72px]" : "hidden"} z-50 w-[min(92vw,360px)] flex-col p-3 lg:absolute lg:bottom-0 lg:top-[72px] lg:z-30 lg:flex lg:w-[360px]`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-border bg-background/94 text-foreground shadow-[20px_20px_70px_rgba(0,0,0,.32)] backdrop-blur-2xl">
        <LotCatalog
          lots={lots}
          filteredLots={filteredLots}
          selectedId={selectedId}
          status={status}
          advancedOpen={advancedOpen}
          minArea={minArea}
          maxPrice={maxPrice}
          sort={sort}
          onStatusChange={setStatus}
          onAdvancedOpenChange={() => setAdvancedOpen((value) => !value)}
          onMinAreaChange={setMinArea}
          onMaxPriceChange={setMaxPrice}
          onSortChange={setSort}
          onClearAdvanced={handleClearAdvanced}
          onSelect={onSelect}
          onView3D={onView3D}
          onViewAR={onViewAR}
          contactUrl={contactUrl}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onHide}
        className="absolute right-5 top-[84px] rounded-full border border-border bg-background/90 text-foreground hover:bg-muted hover:text-accent lg:-right-2 lg:top-1/2"
        aria-label="Ocultar catálogo"
        title="Ocultar catálogo"
      >
        <PanelLeftClose />
      </Button>
    </aside>
  );
}

interface LotCardItemProps {
  lot: Lot;
  isSelected: boolean;
  onSelect: (lot: Lot) => void;
  onView3D: () => void;
  onViewAR?: () => void;
  isMobile?: boolean;
}

const LotCardItem = memo(
  function LotCardItem({
    lot,
    isSelected,
    onSelect,
    onView3D,
    onViewAR,
    isMobile = false,
  }: LotCardItemProps) {
    const isSold = lot.status === "Vendido";
    const isReserved = lot.status === "Reservado";
    const isLastUnits = lot.status === "Últimas unidades";

    // Colores según especificación:
    // - Vendido: ROJO
    // - Disponible: VERDE CLARO
    // - Reservado: NARANJA
    let badgeClass =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
    let dotClass = "bg-emerald-500";
    let leftBorderClass = "border-l-4 border-l-emerald-500";
    let borderClass = isSelected
      ? "border-[#403a34] bg-emerald-500/[0.06] shadow-[0_0_0_1.5px_rgba(34,197,94,.5)] dark:border-emerald-500 dark:bg-emerald-500/15"
      : "border-border bg-card/90 hover:border-emerald-500/40";

    if (isSold) {
      badgeClass =
        "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      dotClass = "bg-rose-500";
      leftBorderClass = "border-l-4 border-l-rose-500";
      borderClass = isSelected
        ? "border-rose-600 bg-rose-500/10 shadow-[0_0_0_1.5px_rgba(225,29,72,.5)]"
        : "border-border/70 bg-rose-500/[0.03] dark:bg-rose-950/20 hover:border-rose-500/40";
    } else if (isReserved) {
      badgeClass =
        "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-300 dark:border-orange-800";
      dotClass = "bg-orange-500";
      leftBorderClass = "border-l-4 border-l-orange-500";
      borderClass = isSelected
        ? "border-orange-600 bg-orange-500/10 shadow-[0_0_0_1.5px_rgba(249,115,22,.5)]"
        : "border-border/70 bg-orange-500/[0.03] dark:bg-orange-950/20 hover:border-orange-500/40";
    } else if (isLastUnits) {
      badgeClass =
        "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      dotClass = "bg-amber-500";
      leftBorderClass = "border-l-4 border-l-amber-500";
    }

    return (
      <article
        id={`lot-card-${lot.id}`}
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: isMobile ? "78px" : "96px",
        }}
        className={`relative overflow-hidden rounded-[10px] sm:rounded-[14px] border transition-all duration-150 ${leftBorderClass} ${borderClass}`}
      >
        <button
          type="button"
          onClick={() => onSelect(lot)}
          className={`w-full text-left ${isMobile ? "p-2.5 pr-[96px]" : "p-3.5 pr-[108px]"}`}
        >
          <div className="flex items-center gap-2">
            <strong
              className={`font-bold tracking-tight leading-none ${isMobile ? "text-sm sm:text-base" : "text-xl"}`}
            >
              {lot.id}
            </strong>
            <Badge
              variant="outline"
              className={`rounded-full ${isMobile ? "px-1.5 py-0 text-[7.5px]" : "px-2 py-0.5 text-[8px]"} font-semibold flex items-center gap-1 ${badgeClass}`}
            >
              <span className={`${isMobile ? "size-1" : "size-1.5"} rounded-full ${dotClass}`} />
              {lot.status}
            </Badge>
          </div>
          <p
            className={`text-muted-foreground line-clamp-1 ${isMobile ? "mt-0.5 text-[10px] leading-tight" : "mt-2 text-xs"}`}
          >
            {lot.detail}
          </p>
          <div
            className={`flex items-center gap-2.5 text-foreground/80 ${isMobile ? "mt-1 text-[11px]" : "mt-3 text-xs"}`}
          >
            <span className="flex items-center gap-1">
              <Ruler size={isMobile ? 11 : 11} className="text-muted-foreground" />
              {formatLotArea(lot.area)}
            </span>
            {isSold ? (
              <span
                className={`${isMobile ? "text-[10px]" : "text-xs"} font-semibold text-slate-500`}
              >
                Vendido
              </span>
            ) : (
              <strong className={`font-bold text-foreground ${isMobile ? "text-[11px]" : ""}`}>
                {formatLotPrice(lot.price)}
              </strong>
            )}
          </div>
        </button>

        {/* Acciones de lote: Barra horizontal compacta, perfectamente centrada sin recortes ni desbordes */}
        <div
          className={`absolute ${isMobile ? "right-2 gap-1" : "right-2.5 gap-1.5"} top-1/2 -translate-y-1/2 flex items-center`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(lot);
              onView3D();
            }}
            title={`Ver ${lot.id} en 3D`}
            aria-label={`Ver ${lot.id} en 3D`}
            className={`flex ${isMobile ? "size-6.5 rounded-md" : "size-7 rounded-lg"} items-center justify-center bg-[#403a34] text-[#f6f1eb] shadow-xs transition-all hover:bg-accent hover:text-accent-foreground active:scale-90 cursor-pointer`}
          >
            <Box size={isMobile ? 12 : 13.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(lot);
              onViewAR?.();
            }}
            title={`Ver ${lot.id} en AR`}
            aria-label={`Ver ${lot.id} en AR`}
            className={`flex ${isMobile ? "size-6.5 rounded-md" : "size-7 rounded-lg"} items-center justify-center border border-border/80 bg-background/90 text-foreground/80 shadow-xs transition-all hover:border-accent hover:text-accent active:scale-90 cursor-pointer`}
          >
            <ScanLine size={isMobile ? 12 : 13.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(lot);
              const text = `Hola AUTEM, me gustaría recibir la ficha técnica y cotización del Lote ${lot.id} (${lot.area} m² - ${lot.detail}).`;
              window.open(
                `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(text)}`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
            title={`Descargar ficha de ${lot.id}`}
            aria-label={`Descargar ficha de ${lot.id}`}
            className={`flex ${isMobile ? "size-6.5 rounded-md" : "size-7 rounded-lg"} items-center justify-center border border-border/80 bg-background/90 text-foreground/80 shadow-xs transition-all hover:border-accent hover:text-accent active:scale-90 cursor-pointer`}
          >
            <Download size={isMobile ? 12 : 13.5} />
          </button>
        </div>
      </article>
    );
  },
  (prev, next) => {
    return (
      prev.lot.id === next.lot.id &&
      prev.isSelected === next.isSelected &&
      prev.isMobile === next.isMobile &&
      prev.lot.status === next.lot.status &&
      prev.lot.price === next.lot.price
    );
  },
);

function LotCatalog({
  lots,
  filteredLots,
  selectedId,
  status,
  advancedOpen,
  minArea,
  maxPrice,
  sort,
  onStatusChange,
  onAdvancedOpenChange,
  onMinAreaChange,
  onMaxPriceChange,
  onSortChange,
  onClearAdvanced,
  onSelect,
  onView3D,
  onViewAR,
  contactUrl,
  isMobile = false,
}: {
  lots: Lot[];
  filteredLots: Lot[];
  selectedId: string;
  status: string;
  advancedOpen: boolean;
  minArea: string;
  maxPrice: string;
  sort: string;
  onStatusChange: (value: string) => void;
  onAdvancedOpenChange: () => void;
  onMinAreaChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClearAdvanced: () => void;
  onSelect: (lot: Lot) => void;
  onView3D: () => void;
  onViewAR?: () => void;
  contactUrl: string;
  isMobile?: boolean;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSelectFromSearch = (lot: Lot) => {
    // Si el lote tiene un estado comercial diferente al filtro activo, cambiar a "Todos"
    if (status !== "Todos" && lot.status !== status) {
      onStatusChange("Todos");
    }
    onSelect(lot);
  };

  useEffect(() => {
    if (!selectedId) return;
    const cardEl = document.getElementById(`lot-card-${selectedId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  return (
    <>
      <header
        className={`border-b border-border ${isMobile ? "px-3.5 pb-1.5 pt-2" : "px-5 pb-3 pt-5"}`}
      >
        <div className="flex items-center gap-2">
          <Trees className={`${isMobile ? "size-4" : "size-6"} text-accent`} />
          <div>
            <h2 className={`${isMobile ? "text-xs" : "text-base"} font-semibold leading-tight`}>
              Plano Urbanístico
            </h2>
            <p className="mt-0.5 text-[9px] text-muted-foreground">{lots.length} lotes</p>
          </div>
          <Badge className="ml-auto rounded-full bg-accent/15 text-[8.5px] px-2 py-0.5 text-accent hover:bg-accent/20">
            {filteredLots.length} lotes
          </Badge>
        </div>
        {!isMobile && (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Compara ubicación, área y precio.
          </p>
        )}

        {/* Pestañas de Filtro por Estado Comercial */}
        <Tabs
          value={status}
          onValueChange={onStatusChange}
          className={`${isMobile ? "mt-1.5" : "mt-3"}`}
        >
          <TabsList
            className={`grid ${isMobile ? "h-7" : "h-9"} w-full grid-cols-4 bg-[#403a34]/[0.06] p-0.5 text-[#555555] dark:bg-white/[0.06]`}
          >
            {["Todos", "Disponibles", "Reservados", "Vendidos"].map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className={`px-0.5 ${isMobile ? "text-[7.5px]" : "text-[8.5px]"} font-semibold uppercase tracking-wider text-[#555555] data-[state=active]:bg-[#403a34] data-[state=active]:text-[#f6f1eb] dark:data-[state=active]:bg-[#c5a059] dark:data-[state=active]:text-[#151413]`}
              >
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Barra de Filtros: Botón Lupa de Búsqueda Directa + Filtros Avanzados */}
        <div className={`flex items-center gap-1.5 ${isMobile ? "mt-1.5" : "mt-2.5"}`}>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 font-bold text-accent transition-all hover:bg-accent hover:text-accent-foreground active:scale-95 shadow-xs cursor-pointer ${
              isMobile ? "h-6.5 text-[8.5px] px-2" : "h-8 text-[10px] px-3"
            }`}
            title="Buscar lote por número específico (Lupa)"
          >
            <Search className={isMobile ? "size-3" : "size-3.5"} />
            <span>Buscar por número</span>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAdvancedOpenChange}
            className={`${
              isMobile ? "h-6.5 text-[8px] px-2" : "h-8 text-[9px] px-2.5"
            } rounded-xl border border-border/70 bg-muted/40 uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground`}
            title="Filtros avanzados de área, precio y orden"
          >
            <SlidersHorizontal className={isMobile ? "size-3 mr-1" : "size-3.5 mr-1"} />
            <span>{advancedOpen ? "Ocultar" : "Filtros"}</span>
          </Button>
        </div>
        {advancedOpen && (
          <div className="mt-2 space-y-2 rounded-xl border border-border bg-muted/40 p-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <FilterSelect
                label="Área mínima"
                value={minArea}
                onValueChange={onMinAreaChange}
                items={[
                  { value: "all", label: "Cualquier área" },
                  { value: "250", label: "Desde 250 m²" },
                  { value: "350", label: "Desde 350 m²" },
                  { value: "450", label: "Desde 450 m²" },
                ]}
              />
              <FilterSelect
                label="Precio máximo"
                value={maxPrice}
                onValueChange={onMaxPriceChange}
                items={[
                  { value: "all", label: "Cualquier precio" },
                  { value: "150", label: "Hasta $150M" },
                  { value: "200", label: "Hasta $200M" },
                  { value: "250", label: "Hasta $250M" },
                ]}
              />
            </div>
            <FilterSelect
              label="Ordenar por"
              value={sort}
              onValueChange={onSortChange}
              items={[
                { value: "lot-asc", label: "Número de lote (1 a 343)" },
                { value: "lot-desc", label: "Número de lote (343 a 1)" },
                { value: "area-asc", label: "Área: menor a mayor" },
                { value: "area-desc", label: "Área: mayor a menor" },
                { value: "price-asc", label: "Precio: menor a mayor" },
                { value: "price-desc", label: "Precio: mayor a menor" },
              ]}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAdvanced}
              className="h-6 w-full text-[8.5px] text-muted-foreground"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </header>

      <div
        className={`flex items-center justify-between ${isMobile ? "px-3.5 py-1" : "px-5 pb-2 pt-3"}`}
      >
        <strong className={isMobile ? "text-xs font-bold" : "text-sm"}>
          {filteredLots.length} lotes
        </strong>
        <span className="text-[7.5px] sm:text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {sort === "lot-asc"
            ? "Lotes 1 → 343"
            : sort === "lot-desc"
              ? "Lotes 343 → 1"
              : sort === "area-asc"
                ? "Área ↑"
                : sort === "area-desc"
                  ? "Área ↓"
                  : "Precio"}
        </span>
      </div>

      <ScrollArea className={`min-h-0 flex-1 ${isMobile ? "px-2" : "px-3"}`}>
        <div
          className={`${isMobile ? "grid grid-cols-1 md:grid-cols-2 gap-1.5 pb-2.5 max-w-4xl mx-auto" : "space-y-2 pb-3"}`}
        >
          {filteredLots.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs leading-5 text-muted-foreground">
              No hay lotes que cumplan estos filtros.
            </p>
          )}
          {filteredLots.map((lot) => (
            <LotCardItem
              key={lot.id}
              lot={lot}
              isSelected={lot.id === selectedId}
              onSelect={onSelect}
              onView3D={onView3D}
              onViewAR={onViewAR}
              isMobile={isMobile}
            />
          ))}
        </div>
      </ScrollArea>
      <div className={`border-t border-border ${isMobile ? "p-2" : "p-4"}`}>
        <Button
          asChild
          className={`${isMobile ? "h-8 text-[10px]" : "h-11 text-[11px]"} w-full rounded-full border border-[#403a34] bg-[#403a34] font-medium uppercase tracking-[0.08em] text-[#f6f1eb] transition-all duration-300 hover:bg-transparent hover:text-[#403a34] dark:border-white/20 dark:bg-[#c5a059] dark:text-[#151413] dark:hover:bg-[#f6f1eb]`}
        >
          <a href={contactUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className={isMobile ? "size-3.5 mr-1" : "size-4 mr-1.5"} /> Solicitar
            asesoría
          </a>
        </Button>
      </div>

      <LotSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        lots={lots}
        onSelectLot={handleSelectFromSearch}
      />
    </>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <label className="block text-[9px] font-medium text-muted-foreground">
      {label}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="mt-1 h-8 bg-background px-2 text-[10px] text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value} className="text-xs">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
