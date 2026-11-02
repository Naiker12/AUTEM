import {
  Activity,
  ArrowLeft,
  Bird,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Droplets,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  Fish,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Sparkles,
  TreePine,
  Trees,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import {
  formatLotArea,
  formatLotPrice,
  getLotFinancing,
  getLotsSummary,
  type Lot,
} from "@/data/lots";
import type { Property } from "@/data/properties";
import { getProjectDocuments, type ProjectDocumentRecord } from "@/lib/project-repository";
import type { ProjectViewSettings, ViewMode } from "./types";

export interface ProjectViewControlPanelProps {
  property: Property;
  lots?: Lot[];
  settings: ProjectViewSettings;
  onSettingsChange: (changes: Partial<ProjectViewSettings>) => void;
  onResetSettings: () => void;
  onSelectMode: (mode: ViewMode) => void;
  onClose?: () => void;
  isMobile?: boolean;
  selectedLot?: Lot | null;
  onClearSelectedLot?: () => void;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "PDF";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ProjectSection = "resumen" | "razones" | "amenidades" | "ubicacion" | "servicios";

/**
 * Contenido interno estilizado, modular y con el dossier oficial completo del proyecto
 */
export function ProjectViewControlPanelContent({
  property,
  lots = [],
  settings,
  onSettingsChange,
  onResetSettings,
  onSelectMode,
  onClose,
  isMobile = false,
  selectedLot,
  onClearSelectedLot,
}: ProjectViewControlPanelProps) {
  const hasSelectedLot = Boolean(selectedLot);
  const { initialPayment, monthlyPayment48 } = useMemo(
    () => getLotFinancing(selectedLot),
    [selectedLot],
  );

  const isVillaParaiso =
    property?.slug === "villa-paraiso" ||
    property?.slug === "lotes-360" ||
    property?.name?.toLowerCase().includes("villa para");

  const summary = useMemo(() => getLotsSummary(lots), [lots]);
  const totalLotsLabel = isVillaParaiso ? 340 : summary.totalCount > 0 ? summary.totalCount : 340;
  const areaRangeLabel =
    property.metadata?.metrics?.areaRange ||
    (summary.totalCount > 0 ? summary.areaRangeLabel : "250 – 750 m²");
  const totalAreaLabel = property.metadata?.metrics?.totalAreaHa
    ? `${property.metadata.metrics.totalAreaHa} hectáreas`
    : "25,45 hectáreas";

  const displayPrice = useMemo(() => {
    if (!property?.price) return "Consultar";
    const cleaned = property.price
      .replace(/^lotes\s+desde\s+/i, "")
      .replace(/^desde\s+/i, "")
      .trim();
    return cleaned || property.price;
  }, [property?.price]);

  const contactUrl = selectedLot
    ? `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(
        `Hola AUTEM, me interesa recibir asesoría y cotización del Lote ${selectedLot.id} (${formatLotArea(selectedLot.area)} - ${formatLotPrice(selectedLot.price)}) en ${property.name}.\n\nUbicación en Google Maps: https://maps.google.com/?q=10.436829,-75.356179 (Santa Rosa de Lima a 1 km vía a Villanueva)`,
      )}`
    : `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola AUTEM, deseo recibir asesoría e información oficial sobre ${property.name}.\n\nUbicación en Google Maps: https://maps.google.com/?q=10.436829,-75.356179`)}`;

  const [activeTab, setActiveTab] = useState("project");
  const [projectSection, setProjectSection] = useState<ProjectSection>("resumen");
  const [documents, setDocuments] = useState<ProjectDocumentRecord[]>([]);

  useEffect(() => {
    let active = true;
    async function loadDocs() {
      if (!property?.slug) return;
      try {
        const docs = await getProjectDocuments(property.slug);
        if (active) setDocuments(docs);
      } catch (err) {
        console.warn("No fue posible cargar documentos del proyecto:", err);
      }
    }
    void loadDocs();
    return () => {
      active = false;
    };
  }, [property?.slug]);

  const lotDoc = useMemo(() => {
    if (!selectedLot) return null;
    return (
      documents.find(
        (d) =>
          d.title.toLowerCase().includes(`lote ${selectedLot.id}`.toLowerCase()) ||
          d.title.toLowerCase().includes("ficha"),
      ) ||
      documents[0] ||
      null
    );
  }, [selectedLot, documents]);

  // Si cambia el lote seleccionado, aseguramos que la pestaña activa sea "project"
  useEffect(() => {
    if (selectedLot?.id) {
      setActiveTab("project");
    }
  }, [selectedLot?.id]);

  const meta = property.metadata;

  return (
    <div className="project-control-panel flex h-full min-h-0 w-full flex-col overflow-hidden bg-card text-foreground">
      {/* Cabecera compacta y estilizada */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="text-base font-semibold tracking-tight leading-snug truncate">
            {hasSelectedLot ? `Ficha del Lote ${selectedLot?.id}` : property.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed truncate">
            {hasSelectedLot
              ? `${selectedLot?.detail || "Parcela individual"} · ${property.name}`
              : property.location || "Información del proyecto"}
          </p>
        </div>
        {onClose && (
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-xl"
            aria-label="Cerrar y volver a la vista"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-3 mt-3 flex h-10 shrink-0 rounded-xl p-1">
          <TabsTrigger
            value="project"
            className="h-full flex-1 gap-1.5 rounded-lg text-xs truncate"
          >
            <FileText size={12} /> {hasSelectedLot ? `Lote ${selectedLot?.id}` : "Dossier Oficial"}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1 w-full overflow-x-hidden px-3 sm:px-3.5">
          <TabsContent
            value="project"
            className="m-0 flex w-full min-w-0 max-w-full flex-col gap-3 pt-3 pb-5 pr-1"
          >
            {hasSelectedLot && selectedLot ? (
              /* =================== FICHA COMPLETA DEL LOTE SELECCIONADO =================== */
              <div className="flex w-full min-w-0 max-w-full flex-col gap-3 animate-in fade-in duration-200">
                {/* Botón para volver a la vista general del proyecto */}
                {onClearSelectedLot && (
                  <button
                    type="button"
                    onClick={onClearSelectedLot}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                  >
                    <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5 text-accent" />
                    <span>Ver información general del proyecto</span>
                  </button>
                )}

                {/* Cabecera del Lote */}
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-gradient-to-br from-card to-muted/30 p-3.5 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-accent block truncate">
                        {selectedLot.detail || "Parcela individual"}
                      </span>
                      <h4 className="font-serif text-2xl font-bold text-foreground leading-tight mt-0.5 truncate">
                        Lote {selectedLot.id}
                      </h4>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        selectedLot.status === "Disponible"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : selectedLot.status === "Reservado"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-slate-500/40 bg-slate-500/10 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      ● {selectedLot.status}
                    </Badge>
                  </div>
                  {selectedLot.metadata?.ubicacion && (
                    <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1 text-[10.5px] font-medium text-accent">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">
                        Ubicación: <strong>{selectedLot.metadata.ubicacion}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Fichas financieras y métricas (Grid 2x2) */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                      Área del lote
                    </span>
                    <span className="mt-0.5 block font-serif text-sm font-bold text-foreground dark:text-stone-100 truncate">
                      {formatLotArea(selectedLot.area)}
                    </span>
                  </div>
                  <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                      Precio total
                    </span>
                    <span className="mt-0.5 block font-serif text-sm font-bold text-accent dark:text-[#c5a059] truncate">
                      {formatLotPrice(selectedLot.price)}
                    </span>
                  </div>
                  <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                      Cuota inicial (20%)
                    </span>
                    <span className="mt-0.5 block font-serif text-xs font-semibold text-foreground dark:text-stone-200 truncate">
                      {formatLotPrice(initialPayment)}
                    </span>
                  </div>
                  <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                      48 cuotas mensuales
                    </span>
                    <span className="mt-0.5 block font-serif text-xs font-semibold text-foreground dark:text-stone-200 truncate">
                      {formatLotPrice(monthlyPayment48)}
                    </span>
                  </div>
                </div>

                {/* Linderos y Colindancias Legales Oficiales */}
                <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3.5 text-accent shrink-0" />
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-foreground">
                      Linderos y Colindancias Legales
                    </p>
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-muted-foreground dark:text-stone-300 font-serif italic bg-muted/30 p-2.5 rounded-lg border border-border/50 break-words">
                    {selectedLot.metadata?.descripcion_lindero ||
                      "Linderos y medidas perimétricas delimitados conforme al plano oficial de parcelación debidamente aprobado."}
                  </p>
                </div>
              </div>
            ) : (
              /* =================== DOSSIER OFICIAL DEL PROYECTO =================== */
              <div className="flex w-full min-w-0 max-w-full flex-col gap-3.5 animate-in fade-in duration-200">
                {/* Render aéreo real del masterplan */}
                <div className="relative overflow-hidden rounded-2xl border border-border/80 dark:border-white/10 shadow-xs">
                  <img
                    src={
                      property.image ||
                      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80"
                    }
                    alt={`Vista real aérea de ${property.name}`}
                    className={
                      isMobile ? "h-36 w-full object-cover" : "aspect-[16/9] w-full object-cover"
                    }
                  />
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[8.5px] font-medium text-white/95 backdrop-blur-md border border-white/15">
                    Masterplan Aéreo Real
                  </span>
                </div>

                {/* Sub-navegación rápida entre secciones del dossier */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "resumen", label: "Resumen" },
                    { id: "razones", label: "¿Por qué comprar?" },
                    { id: "amenidades", label: "Amenidades (27)" },
                    { id: "ubicacion", label: "Ubicación" },
                    { id: "servicios", label: "Servicios" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProjectSection(tab.id as ProjectSection)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-all ${
                        projectSection === tab.id
                          ? "bg-accent text-accent-foreground shadow-xs font-bold"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* SECCIÓN 1: RESUMEN Y ECOSISTEMA */}
                {projectSection === "resumen" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    {/* Tarjetas métricas 2x2 */}
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5">
                        <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground">
                          Lotes totales
                        </span>
                        <span className="mt-0.5 block font-serif text-sm font-bold text-foreground">
                          340 parcelas
                        </span>
                        <span className="text-[9px] text-muted-foreground">Desde 250 a 750 m²</span>
                      </div>
                      <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5">
                        <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground">
                          Extensión total
                        </span>
                        <span className="mt-0.5 block font-serif text-sm font-bold text-accent">
                          25,45 hectáreas
                        </span>
                        <span className="text-[9px] text-muted-foreground">Reserva protegida</span>
                      </div>
                      <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5">
                        <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground">
                          Zonas verdes
                        </span>
                        <span className="mt-0.5 block font-serif text-sm font-bold text-foreground">
                          106.322 m²
                        </span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Equilibrio ecológico
                        </span>
                      </div>
                      <div className="min-w-0 rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5">
                        <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground">
                          3 Grandes lagos
                        </span>
                        <span className="mt-0.5 block font-serif text-sm font-bold text-foreground">
                          33.128 m²
                        </span>
                        <span className="text-[9px] text-sky-600 dark:text-sky-400 font-medium">
                          Pesca y deportes náuticos
                        </span>
                      </div>
                    </div>

                    {/* Senderismo perimetral y lagos */}
                    <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-accent font-semibold text-xs">
                        <Compass className="size-4" />
                        <span>3.479 m de Senderismo Total</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-between border-b border-border/40 pb-1">
                          <span>Sendero perimetral interno (3 m ancho)</span>
                          <strong className="text-foreground">2.154 m</strong>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/40 pb-1">
                          <span>Senderos alrededor de los 3 lagos</span>
                          <strong className="text-foreground">1.695 m</strong>
                        </div>
                        <div className="flex items-center justify-between border-b border-border/40 pb-1">
                          <span>Senderos a lado y lado del arroyo</span>
                          <strong className="text-foreground">1.784 m</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>5 senderos peatonales internos conectores</span>
                          <strong className="text-foreground">3 m de ancho</strong>
                        </div>
                      </div>
                    </div>

                    {/* Ecosistema, Aves y Fauna Silvestre */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Bird className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Corredor de más de 130 especies de Aves
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-foreground/90">
                        El proyecto está dentro de la <strong>Reserva Natural La Ciénaga</strong>,
                        un corredor natural donde se han registrado más de 130 especies de aves y
                        cuenta con <strong>4 hectáreas de reserva boscosa</strong> dedicada al
                        hábitat de fauna silvestre.
                      </p>

                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Fauna avistada en su hábitat natural:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            "Osos Perezosos",
                            "Osos Hormigueros",
                            "Monos Aulladores",
                            "Ardillas",
                            "Iguanas",
                            "Puerco Espín",
                            "Loros",
                            "Guacamayos Azules y Rojos",
                            "Conejos",
                            "Armadillos",
                            "Tortugas",
                            "Guartinajas",
                          ].map((animal) => (
                            <span
                              key={animal}
                              className="rounded-md bg-background/80 dark:bg-stone-900 border border-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-medium text-foreground"
                            >
                              {animal}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-emerald-500/20">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Árboles frondosos y flora nativa:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            "Caracolí",
                            "Ceiba Tuluá",
                            "Cedro",
                            "Campanos",
                            "Bambús",
                            "Ceiba Blanca",
                            "Roble",
                            "Acacia",
                            "Indio Encuero",
                            "Carreto",
                            "Cañaguate",
                            "Palo de agua",
                          ].map((tree) => (
                            <span
                              key={tree}
                              className="rounded-md bg-background/80 dark:bg-stone-900 border border-border px-1.5 py-0.5 text-[9.5px] text-muted-foreground"
                            >
                              {tree}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECCIÓN 2: ¿POR QUÉ COMPRAR? (10 RAZONES CLAVE) */}
                {projectSection === "razones" && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <div className="rounded-xl bg-accent/10 border border-accent/25 p-2.5 text-xs font-semibold text-accent flex items-center gap-2">
                      <Sparkles className="size-4 shrink-0" />
                      <span>Ventajas exclusivas y valorización garantizada</span>
                    </div>

                    {(meta?.whyBuyReasons && meta.whyBuyReasons.length > 0
                      ? meta.whyBuyReasons
                      : [
                          "Fácil acceso a solo 1 km del Municipio en la vía Santa Rosa - Villanueva, con servicios públicos y viabilidad de gas domiciliario.",
                          "Excelente topografía alta con tanque de 250.000 litros existente que suministra agua por gravedad garantizando gran ahorro energético.",
                          "Estudio hidrológico radicado en Planeación que garantiza cero inundaciones gracias al arroyo natural que no se desborda y lagunas de amortiguación.",
                          "Conjunto cerrado con portería de lujo 24 horas, cerramiento en limoncillo y malla galvanizada plastificada en PVC con tubos de 2”.",
                          "Tres grandes lagos con 33.128 m² de espejo de agua para pesca deportiva y deportes náuticos.",
                          "Más de 3.400 metros de senderos bajo frondosos árboles nativos escuchando el lindo canto de los pájaros.",
                          "Hábitat natural protegido con más de 130 especies de aves y fauna silvestre libre (osos perezosos, monos aulladores, armadillos, etc.).",
                          "5 senderos peatonales internos de 3 metros entre manzanas comunicando directamente con los senderos perimetrales.",
                          "Alta valorización garantizada a solo 10 minutos de donde se construirá el nuevo Aeropuerto Internacional de Cartagena de Indias.",
                          "Libertad de construcción con asesoría en conceptos bioclimáticos y sustentables que armonizan con la reserva.",
                        ]
                    ).map((reason, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 flex items-start gap-2.5 text-left text-[11px] leading-relaxed"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-foreground/90">{reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECCIÓN 3: AMENIDADES FLORIDA COUNTRY CLUB (27) */}
                {projectSection === "amenidades" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="rounded-xl bg-gradient-to-r from-accent/15 to-transparent border border-accent/30 p-2.5 text-xs font-bold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Waves className="size-4 text-accent" />
                        Florida Country Club
                      </span>
                      <Badge variant="outline" className="border-accent text-accent text-[9px]">
                        27 Amenidades
                      </Badge>
                    </div>

                    {/* Grupo 1: Lagos y Náutica */}
                    <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/20 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-semibold text-[11px]">
                        <Waves className="size-3.5" />
                        <span>Lagos & Deportes Náuticos (33.128 m²)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10.5px] text-foreground/90">
                        {[
                          "Lago para Kayaking",
                          "Lago para Canotaje",
                          "Pesca Deportiva",
                          "Piscina adultos",
                          "Piscina niños",
                          "Solárium",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-sky-500 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grupo 2: Deportes y Actividad Física */}
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 dark:bg-orange-950/20 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300 font-semibold text-[11px]">
                        <Activity className="size-3.5" />
                        <span>Deportes & Fitness</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10.5px] text-foreground/90">
                        {[
                          "Cancha Tenis, Pádel y Vóley",
                          "Microfútbol y Básquetbol",
                          "Bio gimnasio al aire libre",
                          "Ciclorrutas dedicadas",
                          "Senderos para Bicicross",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-orange-500 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grupo 3: Club House & Encuentro Social */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                        <Home className="size-3.5" />
                        <span>Casa Club & Espacios Sociales</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10.5px] text-foreground/90">
                        {[
                          "Portería de Lujo 24 Horas",
                          "Recepción & Salón de Eventos",
                          "Casa Club - Mirador",
                          "Gran Kiosco Social",
                          "Zona de BBQ",
                          "Baños sociales",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grupo 4: Naturaleza, Familia & Bienestar */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                        <Trees className="size-3.5" />
                        <span>Familia, Mascotas & Naturaleza</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10.5px] text-foreground/90">
                        {[
                          "Parque infantil",
                          "Gimnasio de mascotas (Pet Park)",
                          "Capilla",
                          "Zona lectura y meditación",
                          "Puente Mirador en el Arroyo",
                          "Observación de aves",
                          "Jardines y senderos florales",
                          "Bosque de árboles frutales",
                          "106.322 m² zonas verdes",
                          "4 ha reserva boscosa",
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECCIÓN 4: UBICACIÓN Y CONECTIVIDAD */}
                {projectSection === "ubicacion" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                        <Clock className="size-4 text-accent" />
                        <span>Tiempos de Llegada y Distancias Clave</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                        {[
                          { time: "10 min", label: "Futuro Aeropuerto Internacional de Cartagena" },
                          { time: "< 10 min", label: "Terminal de Transporte de Cartagena" },
                          { time: "15 min", label: "Zona Norte y Playas de Manzanillo del Mar" },
                          { time: "15 min", label: "Club Deportivo Logos de Mozambique" },
                          {
                            time: "20 min",
                            label: "Kristal Malls (Shopping Resort Latinoamérica)",
                          },
                          { time: "25 min", label: "Zona Industrial de Mamonal" },
                          { time: "35 min", label: "Puente a Isla de Barú y Playa Blanca" },
                          { time: "1 km", label: "Casco Urbano de Santa Rosa de Lima" },
                          {
                            time: "4.5 km",
                            label: "Vía La Cordialidad (Sin peajes desde Cartagena)",
                          },
                        ].map((dest, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between border-b border-border/30 pb-1 last:border-0"
                          >
                            <span className="text-muted-foreground truncate pr-2">
                              {dest.label}
                            </span>
                            <strong className="shrink-0 text-accent font-mono text-[10.5px]">
                              {dest.time}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reseña Municipio de Santa Rosa de Lima */}
                    <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-3 space-y-1.5 text-left">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                        <MapPin className="size-3.5 text-accent" />
                        <span>Municipio de Santa Rosa de Lima (Bolívar)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Despensa de productos agrícolas de la región, a 32 metros sobre el nivel del
                        mar y a solo 20 km de Cartagena de Indias (154 km² de superficie). Limita al
                        norte con Clemencia, al sur con Turbaco, al este con Villanueva y al oeste
                        con Cartagena. Ha tenido un gran desarrollo de infraestructura con calles
                        principales pavimentadas.
                      </p>
                    </div>
                  </div>
                )}

                {/* SECCIÓN 5: SERVICIOS Y URBANISMO */}
                {projectSection === "servicios" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                        <ShieldCheck className="size-4 text-emerald-500" />
                        <span>Servicios Públicos e Infraestructura Urbana</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground">
                        {[
                          "Servicio de Agua Domiciliaria proveniente de pozos profundos o red operadora con tanques de reserva (Tanque existente de 250.000 L por gravedad)",
                          "Servicio de energía eléctrica y alumbrado público ecológico",
                          "Parqueadero para visitantes y accesibilidad total",
                          "Servicio permanente de jardinería y mantenimiento de áreas comunes",
                          "Probabilidad y viabilidad de gas domiciliario",
                          "Circuito Cerrado de Televisión (CCTV) y vigilancia privada 24 horas",
                          "Vías internas en zahorra compactada con cunetas y bordillos",
                          "Cercas vivas de limoncillo con malla galvanizada plastificada en PVC y postes en tubo galvanizado de 2”",
                        ].map((srv, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-foreground/90">{srv}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Construcción Sustentable */}
                    <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-1.5">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-accent block">
                        Construcción Sustentable & Armonía Paisajística
                      </span>
                      <p className="text-[11px] leading-relaxed text-foreground/90">
                        Villa Paraíso es un proyecto de libre construcción, donde se verifica que el
                        diseño garantice armonía con el condominio, aplique conceptos bioclimáticos
                        y contribuya al cuidado de la reserva natural para garantizar la
                        valorización continua.
                      </p>
                    </div>
                  </div>
                )}

                {/* Documentos y Fichas PDF oficiales (Siempre accesibles al pie) */}
                {documents.length > 0 && (
                  <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-3 space-y-2">
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground">
                      Documentos y anexos oficiales
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 text-xs transition-colors hover:bg-muted/40 min-w-0"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <FileText className="size-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate font-medium text-foreground text-[11px]"
                                title={doc.title}
                              >
                                {doc.title}
                              </p>
                              <span className="text-[9px] text-muted-foreground">
                                {formatFileSize(doc.size_bytes)}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 rounded-md"
                              asChild
                              title="Abrir documento"
                            >
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-3.5" />
                              </a>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 rounded-md"
                              asChild
                              title="Descargar documento"
                            >
                              <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                                <Download className="size-3.5" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Pie de acción fijado al fondo: siempre visible */}
      {isMobile ? (
        <div className="flex shrink-0 flex-col gap-2 border-t bg-card px-3 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          {hasSelectedLot && lotDoc && (
            <Button
              asChild
              variant="outline"
              className="h-9 w-full rounded-xl border border-primary/40 bg-primary/5 font-medium uppercase tracking-[0.08em] text-foreground hover:bg-primary/10 text-[10px]"
            >
              <a href={lotDoc.url} target="_blank" rel="noopener noreferrer" download>
                <FileDown size={14} className="mr-1.5 text-primary" />
                Descargar Ficha Técnica ({formatFileSize(lotDoc.size_bytes)})
              </a>
            </Button>
          )}
          {hasSelectedLot && (
            <Button
              type="button"
              onClick={() => {
                if (onSelectMode) onSelectMode("terrain");
                if (onClose) onClose();
              }}
              className="h-10 w-full rounded-xl bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 shadow-sm transition-all active:scale-[0.98]"
            >
              <Navigation size={15} />
              Recorrer hacia este lote
            </Button>
          )}
          <Button
            asChild
            className="h-10 w-full rounded-xl border border-[#403a34] bg-[#403a34] font-medium uppercase tracking-[0.08em] text-[#f6f1eb] transition-all duration-300 hover:bg-[#2b2723] dark:border-transparent dark:bg-gradient-to-r dark:from-[#d4af37] dark:via-[#c5a059] dark:to-[#b38e44] dark:text-[#151413] dark:font-bold text-[10.5px]"
          >
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} className="mr-1.5" />
              {hasSelectedLot
                ? `Solicitar asesoría para Lote ${selectedLot?.id}`
                : "Solicitar asesoría por WhatsApp"}
            </a>
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col gap-2 border-t bg-card px-4 py-3">
          {hasSelectedLot && lotDoc && (
            <Button
              asChild
              variant="outline"
              className="h-9 w-full rounded-xl border border-primary/40 bg-primary/5 font-medium uppercase tracking-[0.08em] text-foreground hover:bg-primary/10 text-[10px]"
            >
              <a href={lotDoc.url} target="_blank" rel="noopener noreferrer" download>
                <FileDown size={14} className="mr-1.5 text-primary" />
                Descargar Ficha Técnica ({formatFileSize(lotDoc.size_bytes)})
              </a>
            </Button>
          )}
          {hasSelectedLot && (
            <Button
              type="button"
              onClick={() => {
                if (onSelectMode) onSelectMode("terrain");
                if (onClose) onClose();
              }}
              className="h-10 w-full rounded-xl bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 shadow-sm transition-all active:scale-[0.98]"
            >
              <Navigation size={15} />
              Recorrer hacia este lote
            </Button>
          )}
          <Button
            asChild
            className="h-10 w-full rounded-xl border border-[#403a34] bg-[#403a34] font-medium uppercase tracking-[0.08em] text-[#f6f1eb] transition-all duration-300 hover:bg-[#2b2723] dark:border-transparent dark:bg-gradient-to-r dark:from-[#d4af37] dark:via-[#c5a059] dark:to-[#b38e44] dark:text-[#151413] dark:font-bold text-xs"
          >
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} className="mr-1.5" />
              {hasSelectedLot
                ? `Solicitar asesoría para Lote ${selectedLot?.id}`
                : "Solicitar asesoría por WhatsApp"}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Componente principal envuelto en SheetContent para uso móvil/drawer
 */
export default function ProjectViewControlPanel(props: ProjectViewControlPanelProps) {
  return (
    <SheetContent side="right" className="p-0 sm:max-w-md w-full">
      <ProjectViewControlPanelContent {...props} />
    </SheetContent>
  );
}
