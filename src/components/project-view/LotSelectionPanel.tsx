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
  const [sort, setSort] = useState("area-asc");
  const statusLots =
    status === "Todos"
      ? lots
      : status === "Reservados"
        ? lots.filter((lot) => lot.status === "Reservado")
        : lots.filter((lot) => lot.status !== "Reservado");
  const filteredLots = statusLots
    .filter((lot) => minArea === "all" || lot.area >= Number(minArea))
    .filter((lot) => maxPrice === "all" || lot.price <= Number(maxPrice) * 1_000_000)
    .sort((first, second) => {
      if (sort === "area-desc") return second.area - first.area;
      if (sort === "price-asc") return first.price - second.price;
      if (sort === "price-desc") return second.price - first.price;
      return first.area - second.area;
    });
  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola AUTEM, quiero recibir asesoría sobre los lotes disponibles.")}`;
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
            setSort("area-asc");
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
      <header className="border-b border-border px-5 pb-2 pt-5">
        <div className="flex items-center gap-3">
          <Trees className="size-6 text-accent" />
          <div>
            <h2 className="text-base font-semibold">Lotes de prueba</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              10 lotes ubicados en el plano maestro
            </p>
          </div>
          <Badge className="ml-auto rounded-full bg-accent/15 text-[9px] text-accent hover:bg-accent/20">
            {lots.length} lotes de prueba
          </Badge>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Compara ubicación, área y precio sin salir del masterplan.
        </p>
        <Tabs value={status} onValueChange={onStatusChange} className="mt-4">
          <TabsList className="grid h-9 w-full grid-cols-3 bg-[#403a34]/[0.06] p-1 text-[#555555] dark:bg-white/[0.06]">
            {["Disponibles", "Reservados", "Todos"].map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className="px-2 text-[9px] uppercase tracking-wider text-[#555555] data-[state=active]:bg-[#403a34] data-[state=active]:text-[#f6f1eb] dark:data-[state=active]:bg-[#c5a059] dark:data-[state=active]:text-[#151413]"
              >
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
                  { value: "1100", label: "Desde 1.100 m²" },
                  { value: "1300", label: "Desde 1.300 m²" },
                ]}
              />
              <FilterSelect
                label="Precio máximo"
                value={maxPrice}
                onValueChange={onMaxPriceChange}
                items={[
                  { value: "all", label: "Cualquier precio" },
                  { value: "250", label: "Hasta $250M" },
                  { value: "300", label: "Hasta $300M" },
                ]}
              />
            </div>
            <FilterSelect
              label="Ordenar por"
              value={sort}
              onValueChange={onSortChange}
              items={[
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
        <span className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Área ↓</span>
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
            return (
              <article
                key={lot.id}
                className={`relative overflow-hidden rounded-[14px] border transition ${selected ? "border-[#403a34] bg-[#403a34]/[0.05] shadow-[0_0_0_1px_rgba(197,160,89,.28)] dark:border-[#c5a059] dark:bg-[#c5a059]/10" : "border-border bg-card/75 hover:border-[#403a34]/40"}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(lot)}
                  className="w-full p-4 pr-14 text-left"
                >
                  <div className="flex items-center gap-2">
                    <strong className="text-xl leading-none">{lot.id}</strong>
                    <Badge
                      className={`rounded-full px-2 py-0.5 text-[7px] ${lot.status === "Por confirmar" ? "bg-[#a5682b]/15 text-[#98581f] dark:text-[#e3a25f]" : "bg-[#403a34]/10 text-[#403a34] dark:bg-[#c5a059]/15 dark:text-[#c5a059]"}`}
                    >
                      {lot.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{lot.detail}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-foreground/70">
                    <span className="flex items-center gap-1">
                      <Ruler size={11} />
                      {formatLotArea(lot.area)}
                    </span>
                    <strong>{formatLotPrice(lot.price)}</strong>
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
