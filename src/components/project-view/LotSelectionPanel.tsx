import { useState } from "react";
import {
  Heart,
  MessageCircle,
  PanelLeftClose,
  Ruler,
  SlidersHorizontal,
  Trees,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatLotArea, formatLotPrice, type Lot } from "@/data/lots";
import { WHATSAPP_BASE_URL } from "@/data/constants";

interface LotSelectionPanelProps {
  lots: Lot[];
  selectedId: string;
  onSelect: (lot: Lot) => void;
  onHide: () => void;
  mobileOpen?: boolean;
}

export default function LotSelectionPanel({
  lots,
  selectedId,
  onSelect,
  onHide,
  mobileOpen = false,
}: LotSelectionPanelProps) {
  const [status, setStatus] = useState("Disponibles");
  const [saved, setSaved] = useState<string[]>([]);
  const filteredLots =
    status === "Todos"
      ? lots
      : status === "Reservados"
        ? lots.filter((lot) => lot.status === "Reservado")
        : lots.filter((lot) => lot.status !== "Reservado");
  const toggleSaved = (id: string) =>
    setSaved((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent("Hola AUTEM, quiero recibir asesoría sobre los lotes disponibles.")}`;

  return (
    <aside
      aria-label="Catálogo de lotes"
      className={`${mobileOpen ? "fixed inset-y-0 left-0 flex pt-[72px]" : "hidden"} z-50 w-[min(92vw,370px)] flex-col p-3 xl:absolute xl:bottom-0 xl:top-[72px] xl:z-30 xl:flex xl:w-[370px]`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-border bg-background/94 text-foreground shadow-[20px_20px_70px_rgba(0,0,0,.32)] backdrop-blur-2xl">
        <header className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <Trees className="size-6 text-accent" />
            <div>
              <h2 className="text-base font-semibold">Lotes disponibles</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Selecciona el lugar para tu proyecto
              </p>
            </div>
            <Badge className="ml-auto rounded-full bg-accent/15 text-[9px] text-accent hover:bg-accent/20">
              {lots.filter((lot) => lot.status !== "Reservado").length} disponibles
            </Badge>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Compara ubicación, área y precio sin salir del masterplan.
          </p>
          <Tabs value={status} onValueChange={setStatus} className="mt-4">
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
            className="mt-3 w-full justify-start rounded-xl px-2 text-[9px] uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <SlidersHorizontal /> Filtros avanzados
          </Button>
        </header>

        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <strong className="text-sm">{filteredLots.length} lotes</strong>
          <span className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
            Área ↓
          </span>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredLots.map((lot) => {
              const selected = lot.id === selectedId;
              const isSaved = saved.includes(lot.id);
              return (
                <article
                  key={lot.id}
                  className={`relative overflow-hidden rounded-[14px] border transition ${selected ? "border-[#403a34] bg-[#403a34]/[0.05] dark:border-[#c5a059] dark:bg-[#c5a059]/10 shadow-[0_0_0_1px_rgba(197,160,89,.28)]" : "border-border bg-card/75 hover:border-[#403a34]/40"}`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(lot)}
                    className="grid w-full grid-cols-[106px_1fr] text-left"
                  >
                    <img
                      src={lot.previewImage}
                      alt={`Vista de ${lot.id}`}
                      loading="lazy"
                      className="h-[94px] w-full object-cover"
                    />
                    <div className="p-3 pr-9">
                      <div className="flex items-center gap-2">
                        <strong className="text-lg leading-none">{lot.id}</strong>
                        <Badge
                          className={`rounded-full px-2 py-0.5 text-[7px] ${lot.status === "Disponible" ? "bg-[#403a34]/10 text-[#403a34] dark:bg-[#c5a059]/15 dark:text-[#c5a059]" : "bg-[#a5682b]/15 text-[#98581f] dark:text-[#e3a25f]"}`}
                        >
                          {lot.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">{lot.detail}</p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-foreground/70">
                        <span className="flex items-center gap-1">
                          <Ruler size={10} />
                          {formatLotArea(lot.area)}
                        </span>
                        <strong>{formatLotPrice(lot.price)}</strong>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSaved(lot.id)}
                    className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border border-border bg-background/85 ${isSaved ? "text-[#c5a059]" : "text-muted-foreground"}`}
                    aria-label={`Guardar ${lot.id}`}
                  >
                    <Heart size={13} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </article>
              );
            })}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-4">
          <Button
            asChild
            className="h-11 w-full rounded-full border border-[#403a34] bg-[#403a34] text-[11px] font-medium uppercase tracking-[0.1em] text-[#f6f1eb] hover:bg-transparent hover:text-[#403a34] transition-all duration-300 dark:border-white/20 dark:bg-[#c5a059] dark:text-[#151413] dark:hover:bg-[#f6f1eb]"
          >
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Solicitar asesoría
            </a>
          </Button>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onHide}
        className="absolute right-5 top-[84px] rounded-full border border-border bg-background/90 text-foreground hover:bg-muted hover:text-accent xl:-right-2 xl:top-1/2"
        aria-label="Ocultar catálogo"
      >
        <PanelLeftClose />
      </Button>
    </aside>
  );
}
