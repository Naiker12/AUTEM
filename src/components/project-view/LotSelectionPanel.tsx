import { useState } from "react";
import {
  Box,
  Download,
  MessageCircle,
  PanelLeftClose,
  Ruler,
  ScanLine,
  SlidersHorizontal,
  Trees,
} from "lucide-react";
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
  onHide: () => void;
  mobileOpen?: boolean;
}

export default function LotSelectionPanel({
  lots,
  selectedId,
  onSelect,
  onView3D,
  onHide,
  mobileOpen = false,
}: LotSelectionPanelProps) {
  const [status, setStatus] = useState("Todos");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [minArea, setMinArea] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  // Orden por defecto: Lote 1 al último (1 a 343)
  const [sort, setSort] = useState("lot-asc");

  const statusLots =
    status === "Todos"
      ? lots
      : status === "Reservados"
        ? lots.filter((lot) => lot.status === "Reservado")
        : status === "Vendidos"
          ? lots.filter((lot) => lot.status === "Vendido")
          : lots.filter((lot) => lot.status === "Disponible" || lot.status === "Últimas unidades");

  const filteredLots = statusLots
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

  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(
    "Hola AUTEM, quiero recibir asesoría sobre los lotes del plano maestro.",
  )}`;

  return (
    <aside
      aria-label="Catálogo de lotes"
      className={`${mobileOpen ? "fixed inset-y-0 left-0 flex pt-[72px]" : "hidden"} z-50 w-[min(92vw,370px)] flex-col p-3 xl:absolute xl:bottom-0 xl:top-[72px] xl:z-30 xl:flex xl:w-[370px]`}
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
          onClearAdvanced={() => {
            setMinArea("all");
            setMaxPrice("all");
            setSort("lot-asc");
          }}
          onSelect={onSelect}
          onView3D={onView3D}
          contactUrl={contactUrl}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onHide}
        className="absolute right-5 top-[84px] rounded-full border border-border bg-background/90 text-foreground hover:bg-muted hover:text-accent xl:-right-2 xl:top-1/2"
        aria-label="Ocultar catálogo"
        title="Ocultar catálogo"
      >
        <PanelLeftClose />
      </Button>
    </aside>
  );
}

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
  contactUrl,
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
  contactUrl: string;
}) {
  return (
    <>
      <header className="border-b border-border px-5 pb-3 pt-5">
        <div className="flex items-center gap-3">
          <Trees className="size-6 text-accent" />
          <div>
            <h2 className="text-base font-semibold">Plano Maestro</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {lots.length} lotes con geometría real
            </p>
          </div>
          <Badge className="ml-auto rounded-full bg-accent/15 text-[9px] text-accent hover:bg-accent/20">
            {filteredLots.length} lotes
          </Badge>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Compara ubicación, área y precio sin salir del masterplan.
        </p>

        {/* Pestañas de Filtro por Estado Comercial */}
        <Tabs value={status} onValueChange={onStatusChange} className="mt-3">
          <TabsList className="grid h-9 w-full grid-cols-4 bg-[#403a34]/[0.06] p-1 text-[#555555] dark:bg-white/[0.06]">
            {["Todos", "Disponibles", "Reservados", "Vendidos"].map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className="px-1 text-[8.5px] font-semibold uppercase tracking-wider text-[#555555] data-[state=active]:bg-[#403a34] data-[state=active]:text-[#f6f1eb] dark:data-[state=active]:bg-[#c5a059] dark:data-[state=active]:text-[#151413]"
              >
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Filtros avanzados desplegables */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAdvancedOpenChange}
          className="mt-2 h-7 w-full justify-start rounded-lg px-2 text-[9px] uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <SlidersHorizontal /> {advancedOpen ? "Ocultar filtros" : "Filtros avanzados"}
        </Button>
        {advancedOpen && (
          <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/40 p-3">
            <div className="grid grid-cols-2 gap-2">
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
              className="h-7 w-full text-[9px] text-muted-foreground"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </header>

      <div className="flex items-center justify-between px-5 pb-2 pt-3">
        <strong className="text-sm">{filteredLots.length} lotes</strong>
        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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

      <ScrollArea className="min-h-0 flex-1 px-3">
        <div className="space-y-2 pb-3">
          {filteredLots.length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs leading-5 text-muted-foreground">
              No hay lotes que cumplan estos filtros.
            </p>
          )}
          {filteredLots.map((lot) => {
            const selected = lot.id === selectedId;
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
            let borderClass = selected
              ? "border-[#403a34] bg-emerald-500/[0.04] shadow-[0_0_0_1px_rgba(34,197,94,.4)] dark:border-emerald-500 dark:bg-emerald-500/10"
              : "border-border bg-card/90 hover:border-emerald-500/40";

            if (isSold) {
              // Vendido en ROJO
              badgeClass =
                "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800";
              dotClass = "bg-rose-500";
              leftBorderClass = "border-l-4 border-l-rose-500";
              borderClass = selected
                ? "border-rose-600 bg-rose-500/10 shadow-[0_0_0_1px_rgba(225,29,72,.4)]"
                : "border-border/70 bg-rose-500/[0.03] dark:bg-rose-950/20 hover:border-rose-500/40";
            } else if (isReserved) {
              // Reservado en NARANJA
              badgeClass =
                "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-300 dark:border-orange-800";
              dotClass = "bg-orange-500";
              leftBorderClass = "border-l-4 border-l-orange-500";
              borderClass = selected
                ? "border-orange-600 bg-orange-500/10 shadow-[0_0_0_1px_rgba(249,115,22,.4)]"
                : "border-border/70 bg-orange-500/[0.03] dark:bg-orange-950/20 hover:border-orange-500/40";
            } else if (isLastUnits) {
              badgeClass =
                "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800";
              dotClass = "bg-amber-500";
              leftBorderClass = "border-l-4 border-l-amber-500";
            }

            return (
              <article
                key={lot.id}
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: "0 94px",
                }}
                className={`relative overflow-hidden rounded-[14px] border transition-all duration-150 ${leftBorderClass} ${borderClass}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(lot)}
                  className="w-full p-4 pr-14 text-left"
                >
                  <div className="flex items-center gap-2">
                    <strong className="text-xl font-bold tracking-tight leading-none">
                      {lot.id}
                    </strong>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2 py-0.5 text-[8px] font-semibold flex items-center gap-1.5 ${badgeClass}`}
                    >
                      <span className={`size-1.5 rounded-full ${dotClass}`} />
                      {lot.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{lot.detail}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-foreground/80">
                    <span className="flex items-center gap-1">
                      <Ruler size={11} className="text-muted-foreground" />
                      {formatLotArea(lot.area)}
                    </span>
                    {isSold ? (
                      <span className="text-xs font-semibold text-slate-500">Vendido</span>
                    ) : (
                      <strong className="font-bold text-foreground">
                        {formatLotPrice(lot.price)}
                      </strong>
                    )}
                  </div>
                </button>
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-1">
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => {
                      onSelect(lot);
                      onView3D();
                    }}
                    title={`Ver ${lot.id} en 3D`}
                    aria-label={`Ver ${lot.id} en 3D`}
                    className="size-7 rounded-lg bg-[#403a34] text-[#f6f1eb] hover:bg-accent hover:text-accent-foreground"
                  >
                    <Box size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title={`Ver ${lot.id} en AR`}
                    aria-label={`Ver ${lot.id} en AR`}
                    className="size-7 rounded-lg border-border bg-background/80 text-muted-foreground hover:text-foreground"
                  >
                    <ScanLine size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={`Descargar ficha de ${lot.id}`}
                    aria-label={`Descargar ficha de ${lot.id}`}
                    className="size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download size={14} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t border-border p-4">
        <Button
          asChild
          className="h-11 w-full rounded-full border border-[#403a34] bg-[#403a34] text-[11px] font-medium uppercase tracking-[0.1em] text-[#f6f1eb] transition-all duration-300 hover:bg-transparent hover:text-[#403a34] dark:border-white/20 dark:bg-[#c5a059] dark:text-[#151413] dark:hover:bg-[#f6f1eb]"
        >
          <a href={contactUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> Solicitar asesoría
          </a>
        </Button>
      </div>
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
