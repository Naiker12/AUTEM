import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import {
  Compass,
  Expand,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Shrink,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Viewer } from "@photo-sphere-viewer/core";
import type { MarkerConfig, MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import type { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import type { Lot, LotStatus } from "@/features/lots";
import { formatLotPrice } from "@/features/lots";
import rawLots from "@/data/villa-paraiso/lots.json";
import rawLayers from "@/data/villa-paraiso/layers.json";
import rawPanoramaLotsData from "@/data/villa-paraiso/generated/panorama-lots.json";
import rawPanoramaOverrides from "@/data/villa-paraiso/panorama-overrides.json";
import {
  hitTestLotVertexHandle,
  hitTestPanoramaLots,
  isPreviewDraftEnabled,
  loadLocalPanoramaDraft,
  mergePanoramaLotsWithOverrides,
  prepareCanvasContextLayers,
  prepareCanvasLots,
  projectMasterplanLayers,
  projectMasterplanLots,
  radToDegPair,
  renderPanoramaLotsCanvas,
  screenPointToPanoramaRad,
  type ControlPointOverlayItem,
  type PanoramaCameraConfig,
  type PanoramaLotOverridesMap,
  type PanoramaLotsData,
  type ProjectedPanoramaLot,
  type VisibleScreenLot,
} from "@/features/panorama-360";
import { supabase } from "@/lib/supabase";

const defaultPanoramaData = rawPanoramaLotsData as unknown as PanoramaLotsData;
const defaultOverrides = rawPanoramaOverrides as unknown as PanoramaLotOverridesMap;

export interface PanoramaViewerProps {
  projectName?: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  previewImageUrl?: string;
  cameraConfig?: PanoramaCameraConfig;
  projectedLots?: ProjectedPanoramaLot[];
  overrides?: PanoramaLotOverridesMap;
  lots?: Lot[];
  selectedLotId?: string;
  onSelectLot?: (lotId: string) => void;
  onSelectLotWithModifier?: (lotId: string, shiftKey: boolean) => void;
  onInspectLot?: (lot?: Lot) => void;
  onReserveLot?: (lot: Lot) => void;
  onSwitchToPlan?: () => void;
  onPanoramaClick?: (pos: {
    yawRad: number;
    pitchRad: number;
    yawDeg: number;
    pitchDeg: number;
  }) => void;
  extraMarkers?: MarkerConfig[];
  initialShowLots?: boolean;
  dragMode?: "orbit" | "hand";
  onHandDrag?: (deltaYawDeg: number, deltaPitchDeg: number) => void;
  highlightManzana?: string;
  highlightLotIds?: string[];
  selectedPieceIds?: string[];
  editScope?: "global" | "manzana" | "piece" | "lot";
  activeManzana?: string;
  initialShowRoads?: boolean;
  isRightPanelOpen?: boolean;
  /** Opacidad del overlay de lotes (0..1). */
  overlayOpacity?: number;
  /** Modo solo contorno para ver la foto debajo mientras se alinea (Fase A4). */
  outlineOnly?: boolean;
  /** IDs de lotes dudosos (>=20° del punto de control más cercano y !locked). */
  doubtfulLotIds?: ReadonlySet<string>;
  /** Si true, resalta lotes dudosos con borde discontinuo ámbar (Fase A4). */
  highlightDoubtfulLots?: boolean;
  /** Si true, muestra lotes de baja confianza como pin + contorno punteado (Fase B3). */
  lowConfidencePinMode?: boolean;
  /** Si true, habilita handles circulares para arrastrar vértices individuales del lote seleccionado (Fase A2). */
  editableVertices?: boolean;
  /** Callback al arrastrar un vértice individual del lote seleccionado. */
  onMoveVertex?: (
    lotId: string,
    vertexIndex: number,
    newYawRad: number,
    newPitchRad: number,
  ) => void;
  /** Callback al terminar de arrastrar un vértice (para registrar en historial Undo). */
  onVertexDragStart?: () => void;
  /** Puntos de control con su error en ° y m para superponer en el Calibrador (Fase A4). */
  controlPointsOverlay?: ControlPointOverlayItem[];
  /** Zoom de la lupa de precisión en el cursor (1 = desactivada, 2 = ×2, 4 = ×4) — Fase A4. */
  loupeZoom?: 1 | 2 | 4;
}

const FILTER_OPTIONS = [
  { id: "ALL", label: "Todos", short: "Todos", dot: "bg-foreground/70" },
  { id: "Disponible", label: "Disponibles", short: "Disp.", dot: "bg-emerald-500" },
  { id: "Reservado", label: "Reservados", short: "Res.", dot: "bg-amber-500" },
  { id: "Vendido", label: "Vendidos", short: "Vend.", dot: "bg-rose-500" },
  { id: "Por confirmar", label: "Por confirmar", short: "Conf.", dot: "bg-slate-400" },
] as const;

function formatCardinalDirection(yawDeg: number): string {
  const norm = ((yawDeg % 360) + 360) % 360;
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(norm / 45) % 8];
}

export default function PanoramaViewer({
  projectName = "Villa Paraíso",
  desktopImageUrl = "/panoramas/villa-paraiso/pano-8192.v1.webp",
  mobileImageUrl = "/panoramas/villa-paraiso/pano-4096.v1.webp",
  previewImageUrl = "/panoramas/villa-paraiso/pano-preview.v1.webp",
  cameraConfig,
  projectedLots,
  overrides,
  lots = [],
  selectedLotId,
  onSelectLot,
  onSelectLotWithModifier,
  onInspectLot,
  onReserveLot,
  onSwitchToPlan,
  onPanoramaClick,
  extraMarkers = [],
  initialShowLots = true,
  dragMode = "orbit",
  onHandDrag,
  highlightManzana,
  highlightLotIds,
  selectedPieceIds,
  editScope = "global",
  activeManzana = "M 1",
  initialShowRoads = true,
  isRightPanelOpen = false,
  overlayOpacity = 1,
  outlineOnly = false,
  doubtfulLotIds,
  highlightDoubtfulLots = false,
  lowConfidencePinMode = false,
  editableVertices = false,
  onMoveVertex,
  onVertexDragStart,
  controlPointsOverlay,
  loupeZoom = 1,
}: PanoramaViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const markersPluginRef = useRef<MarkersPlugin | null>(null);
  const gyroPluginRef = useRef<GyroscopePlugin | null>(null);
  const visibleScreenLotsRef = useRef<VisibleScreenLot[]>([]);
  const hoveredLotIdRef = useRef<string | null>(null);
  const isPointerDownRef = useRef(false);
  const isInteractingRef = useRef(false);
  const interactionRestoreTimerRef = useRef<number | null>(null);
  const lastHitTestTimeRef = useRef(0);

  const [isHandDragging, setIsHandDragging] = useState(false);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(null);
  const draggingVertexIndexRef = useRef<number | null>(null);
  const hoveredVertexIndexRef = useRef<number | null>(null);
  const handDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const handPointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const liveDragOffsetRef = useRef<{ deltaYawRad: number; deltaPitchRad: number } | null>(null);
  const rafScheduledRef = useRef(false);
  const onHandDragRef = useRef(onHandDrag);
  onHandDragRef.current = onHandDrag;
  const onMoveVertexRef = useRef(onMoveVertex);
  onMoveVertexRef.current = onMoveVertex;
  const onVertexDragStartRef = useRef(onVertexDragStart);
  onVertexDragStartRef.current = onVertexDragStart;

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showLots, setShowLots] = useState(initialShowLots);
  const [showContextLayers, setShowContextLayers] = useState(false);
  const [showRoads, setShowRoads] = useState(initialShowRoads);
  const [visualStyle, setVisualStyle] = useState<"pins" | "filled">("filled");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Disponible" | "Reservado" | "Vendido" | "Por confirmar"
  >("ALL");
  const [lotSearchQuery, setLotSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cameraYawDeg, setCameraYawDeg] = useState(0);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraftPreviewMode, setIsDraftPreviewMode] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);
  const [gyroSupported, setGyroSupported] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [remoteConfig, setRemoteConfig] = useState<PanoramaCameraConfig | null>(null);
  const [remoteOverrides, setRemoteOverrides] = useState<PanoramaLotOverridesMap | null>(null);
  const [remoteImageUrls, setRemoteImageUrls] = useState<{
    desktop?: string;
    mobile?: string;
  } | null>(null);
  const [hoveredLot, setHoveredLot] = useState<{
    id: string;
    label: string;
    status: LotStatus;
    area: number;
    price: number;
    x: number;
    y: number;
  } | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (cameraConfig && projectedLots) return;
    let active = true;

    // Fase A6: Si el admin activó "Vista previa pública" de un borrador local, cargarlo primero
    const urlParams =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const previewRequested =
      urlParams?.get("previewDraft") === "1" || isPreviewDraftEnabled("main");
    if (previewRequested) {
      const localDraft = loadLocalPanoramaDraft("main");
      if (localDraft) {
        setRemoteConfig(localDraft.config);
        setRemoteOverrides(localDraft.overrides);
        setIsDraftPreviewMode(true);
        return;
      }
    }

    async function loadPublicPanoramaSettings() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("project_panoramas")
          .select("*")
          .eq("slug", "main")
          .eq("enabled", true)
          .limit(1)
          .maybeSingle();

        if (error || !data || !active) return;

        // Si existe published_config (Fase A6), priorizarlo en el visor público
        const pubCfg =
          data.published_config && typeof data.published_config === "object"
            ? (data.published_config as Partial<PanoramaCameraConfig>)
            : null;

        const dbConfig: PanoramaCameraConfig = {
          camera: {
            lat: pubCfg?.camera?.lat ?? data.camera_lat ?? defaultPanoramaData.config.camera.lat,
            lng: pubCfg?.camera?.lng ?? data.camera_lng ?? defaultPanoramaData.config.camera.lng,
            heightAboveGroundM:
              pubCfg?.camera?.heightAboveGroundM ??
              data.height_above_ground_m ??
              defaultPanoramaData.config.camera.heightAboveGroundM,
            offsetEastM:
              pubCfg?.camera?.offsetEastM ??
              data.offset_east_m ??
              defaultPanoramaData.config.camera.offsetEastM ??
              0,
            offsetNorthM:
              pubCfg?.camera?.offsetNorthM ??
              data.offset_north_m ??
              defaultPanoramaData.config.camera.offsetNorthM ??
              0,
          },
          yawOffsetDeg:
            pubCfg?.yawOffsetDeg ?? data.yaw_offset_deg ?? defaultPanoramaData.config.yawOffsetDeg,
          tilt: {
            pitchDeg:
              pubCfg?.tilt?.pitchDeg ??
              data.pitch_tilt_deg ??
              defaultPanoramaData.config.tilt.pitchDeg,
            rollDeg:
              pubCfg?.tilt?.rollDeg ??
              data.roll_tilt_deg ??
              defaultPanoramaData.config.tilt.rollDeg,
          },
          panoDataDesktop: {
            fullWidth: data.full_width ?? defaultPanoramaData.config.panoDataDesktop.fullWidth,
            fullHeight: data.full_height ?? defaultPanoramaData.config.panoDataDesktop.fullHeight,
            croppedWidth:
              data.cropped_width ?? defaultPanoramaData.config.panoDataDesktop.croppedWidth,
            croppedHeight:
              data.cropped_height ?? defaultPanoramaData.config.panoDataDesktop.croppedHeight,
            croppedX: data.cropped_x ?? defaultPanoramaData.config.panoDataDesktop.croppedX,
            croppedY: data.cropped_y ?? defaultPanoramaData.config.panoDataDesktop.croppedY,
          },
          panoDataMobile: defaultPanoramaData.config.panoDataMobile,
          limits: {
            minPitchDeg: data.min_pitch_deg ?? defaultPanoramaData.config.limits.minPitchDeg,
            maxPitchDeg: data.max_pitch_deg ?? defaultPanoramaData.config.limits.maxPitchDeg,
            defaultYawDeg: data.default_yaw_deg ?? defaultPanoramaData.config.limits.defaultYawDeg,
            defaultPitchDeg:
              data.default_pitch_deg ?? defaultPanoramaData.config.limits.defaultPitchDeg,
            defaultZoomLvl: defaultPanoramaData.config.limits.defaultZoomLvl ?? 26,
          },
          visualScale: pubCfg?.visualScale,
          terrainPatch: pubCfg?.terrainPatch,
          groundSlope: pubCfg?.groundSlope,
        };

        setRemoteConfig(dbConfig);

        if (data.desktop_image_path || data.mobile_image_path) {
          setRemoteImageUrls({
            desktop: data.desktop_image_path || undefined,
            mobile: data.mobile_image_path || undefined,
          });
        }

        const pubOverrides =
          data.published_overrides && typeof data.published_overrides === "object"
            ? (data.published_overrides as PanoramaLotOverridesMap)
            : data.lot_overrides && typeof data.lot_overrides === "object"
              ? (data.lot_overrides as PanoramaLotOverridesMap)
              : null;

        if (pubOverrides) {
          setRemoteOverrides(pubOverrides);
        }
      } catch (err) {
        console.warn("Fallo al obtener configuración remota 360°, usando respaldo local:", err);
      }
    }

    loadPublicPanoramaSettings();

    return () => {
      active = false;
    };
  }, [cameraConfig, projectedLots]);

  const activeConfig = cameraConfig ?? remoteConfig ?? defaultPanoramaData.config;

  const mergedPanoramaLots = useMemo(() => {
    if (projectedLots) {
      const activeOverrides = overrides ?? remoteOverrides ?? defaultOverrides;
      return mergePanoramaLotsWithOverrides(projectedLots, activeOverrides);
    }

    if (remoteConfig) {
      const liveLots = projectMasterplanLots(rawLots, remoteConfig);
      const activeOverrides = overrides ?? remoteOverrides ?? defaultOverrides;
      return mergePanoramaLotsWithOverrides(liveLots, activeOverrides);
    }

    const base = defaultPanoramaData.lots;
    const activeOverrides = overrides ?? remoteOverrides ?? defaultOverrides;
    return mergePanoramaLotsWithOverrides(base, activeOverrides);
  }, [projectedLots, remoteConfig, overrides, remoteOverrides]);

  const lotById = useMemo(() => {
    const map = new Map<string, Lot>();
    for (const l of lots) {
      map.set(l.id, l);
      map.set(l.id.toLowerCase(), l);
      const clean = l.id.replace(/^L-?/i, "");
      if (clean) {
        map.set(clean, l);
        map.set(`L-${clean}`, l);
      }
      if (typeof l.lotNumber === "number") {
        map.set(String(l.lotNumber), l);
        map.set(`L-${l.lotNumber}`, l);
      }
      if (typeof (l as { numero?: number }).numero === "number") {
        map.set(String((l as { numero?: number }).numero), l);
        map.set(`L-${(l as { numero?: number }).numero}`, l);
      }
    }
    return map;
  }, [lots]);

  const canonicalSelectedLotId = useMemo(() => {
    if (!selectedLotId) return undefined;
    const cleanDigits = selectedLotId.trim().replace(/^L-?/i, "");
    const found = mergedPanoramaLots.find(
      (l) =>
        l.id === selectedLotId ||
        l.id.toLowerCase() === selectedLotId.toLowerCase() ||
        l.id.replace(/^L-?/i, "") === cleanDigits ||
        String(l.lotNumber) === cleanDigits,
    );
    return found ? found.id : selectedLotId;
  }, [selectedLotId, mergedPanoramaLots]);

  const selectedLot = useMemo(() => {
    if (!selectedLotId) return null;
    const clean = selectedLotId.trim().replace(/^L-?/i, "");
    return lotById.get(selectedLotId) ?? lotById.get(clean) ?? lotById.get(`L-${clean}`) ?? null;
  }, [lotById, selectedLotId]);

  const preparedLots = useMemo(
    () => prepareCanvasLots(mergedPanoramaLots, lotById),
    [mergedPanoramaLots, lotById],
  );

  // Contadores en vivo por estado para la leyenda (Fase C4)
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: preparedLots.length,
      Disponible: 0,
      Reservado: 0,
      Vendido: 0,
      "Por confirmar": 0,
    };
    for (const l of preparedLots) {
      if (l.status === "Vendido") counts.Vendido++;
      else if (l.status === "Reservado") counts.Reservado++;
      else if (l.status === "Por confirmar") counts["Por confirmar"]++;
      else counts.Disponible++;
    }
    return counts;
  }, [preparedLots]);

  const preparedContextLayers = useMemo(() => {
    if (cameraConfig || remoteConfig) {
      const liveLayers = projectMasterplanLayers(rawLayers, activeConfig);
      return prepareCanvasContextLayers(liveLayers);
    }
    return prepareCanvasContextLayers(defaultPanoramaData.layers);
  }, [cameraConfig, remoteConfig, activeConfig]);

  const renderStateRef = useRef({
    preparedLots,
    preparedContextLayers,
    showLots,
    showContextLayers,
    showRoads,
    visualStyle,
    statusFilter,
    selectedLotId: canonicalSelectedLotId,
    highlightManzana,
    highlightLotIds,
    selectedPieceIds,
    editScope,
    activeManzana,
    overlayOpacity,
    outlineOnly,
    doubtfulLotIds,
    highlightDoubtfulLots,
    lowConfidencePinMode,
    editableVertices,
    controlPointsOverlay,
  });
  renderStateRef.current = {
    preparedLots,
    preparedContextLayers,
    showLots,
    showContextLayers,
    showRoads,
    visualStyle,
    statusFilter,
    selectedLotId: canonicalSelectedLotId,
    highlightManzana,
    highlightLotIds,
    selectedPieceIds,
    editScope,
    activeManzana,
    overlayOpacity,
    outlineOnly,
    doubtfulLotIds,
    highlightDoubtfulLots,
    lowConfidencePinMode,
    editableVertices,
    controlPointsOverlay,
  };

  const updateLoupeCanvas = useCallback(
    (vx: number, vy: number) => {
      if (loupeZoom === 1 || !loupeCanvasRef.current || !canvasOverlayRef.current) return;
      const lCanvas = loupeCanvasRef.current;
      const lCtx = lCanvas.getContext("2d");
      if (!lCtx) return;

      const size = 148;
      if (lCanvas.width !== size || lCanvas.height !== size) {
        lCanvas.width = size;
        lCanvas.height = size;
      }

      lCtx.clearRect(0, 0, size, size);
      const glCanvas = hostRef.current?.querySelector("canvas");
      const overlayCanvas = canvasOverlayRef.current;
      const dpr = overlayCanvas.width / Math.max(1, overlayCanvas.clientWidth || 1);
      const srcRadius = size / (2 * loupeZoom);

      if (glCanvas) {
        const glDprX = glCanvas.width / Math.max(1, glCanvas.clientWidth || 1);
        const glDprY = glCanvas.height / Math.max(1, glCanvas.clientHeight || 1);
        try {
          lCtx.drawImage(
            glCanvas,
            (vx - srcRadius) * glDprX,
            (vy - srcRadius) * glDprY,
            srcRadius * 2 * glDprX,
            srcRadius * 2 * glDprY,
            0,
            0,
            size,
            size,
          );
        } catch {
          // Ignore WebGL preserveDrawingBuffer limitations if any
        }
      }

      lCtx.drawImage(
        overlayCanvas,
        (vx - srcRadius) * dpr,
        (vy - srcRadius) * dpr,
        srcRadius * 2 * dpr,
        srcRadius * 2 * dpr,
        0,
        0,
        size,
        size,
      );

      // Retícula central de la lupa
      lCtx.strokeStyle = "rgba(250, 204, 21, 0.85)";
      lCtx.lineWidth = 1;
      lCtx.beginPath();
      lCtx.moveTo(size / 2 - 10, size / 2);
      lCtx.lineTo(size / 2 + 10, size / 2);
      lCtx.moveTo(size / 2, size / 2 - 10);
      lCtx.lineTo(size / 2, size / 2 + 10);
      lCtx.stroke();
    },
    [loupeZoom],
  );

  const drawLotsCanvas = useCallback(() => {
    if (!canvasOverlayRef.current || !viewerRef.current) return;
    const st = renderStateRef.current;
    visibleScreenLotsRef.current = renderPanoramaLotsCanvas({
      canvas: canvasOverlayRef.current,
      viewer: viewerRef.current,
      lots: st.preparedLots,
      contextLayers: st.preparedContextLayers,
      showLots: st.showLots,
      showContextLayers: st.showContextLayers,
      showRoadsOnly: st.showRoads,
      visualStyle: st.visualStyle,
      statusFilter: st.statusFilter,
      selectedLotId: st.selectedLotId,
      hoveredLotId: hoveredLotIdRef.current,
      highlightManzana: st.highlightManzana,
      highlightLotIds: st.highlightLotIds,
      overlayOpacity: st.overlayOpacity,
      outlineOnly: st.outlineOnly,
      doubtfulLotIds: st.doubtfulLotIds,
      highlightDoubtfulLots: st.highlightDoubtfulLots,
      lowConfidencePinMode: st.lowConfidencePinMode,
      editableVertices: st.editableVertices,
      activeVertexIndex: draggingVertexIndexRef.current ?? hoveredVertexIndexRef.current,
      controlPointsOverlay: st.controlPointsOverlay,
      isInteracting: isInteractingRef.current,
      liveDragOffset: liveDragOffsetRef.current
        ? {
            deltaYawRad: liveDragOffsetRef.current.deltaYawRad,
            deltaPitchRad: liveDragOffsetRef.current.deltaPitchRad,
            scope: st.editScope,
            activeManzana: st.activeManzana,
            selectedPieceIds: st.selectedPieceIds,
            selectedLotId: st.selectedLotId,
          }
        : null,
    });
  }, []);

  useEffect(() => {
    drawLotsCanvas();
  }, [
    preparedLots,
    preparedContextLayers,
    showLots,
    showContextLayers,
    showRoads,
    visualStyle,
    statusFilter,
    canonicalSelectedLotId,
    highlightManzana,
    highlightLotIds,
    selectedPieceIds,
    editScope,
    activeManzana,
    overlayOpacity,
    outlineOnly,
    doubtfulLotIds,
    highlightDoubtfulLots,
    lowConfidencePinMode,
    editableVertices,
    draggingVertexIndex,
    controlPointsOverlay,
    drawLotsCanvas,
  ]);

  const onSelectLotRef = useRef(onSelectLot);
  onSelectLotRef.current = onSelectLot;
  const onSelectLotWithModifierRef = useRef(onSelectLotWithModifier);
  onSelectLotWithModifierRef.current = onSelectLotWithModifier;
  const onPanoramaClickRef = useRef(onPanoramaClick);
  onPanoramaClickRef.current = onPanoramaClick;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let isDisposed = false;
    let instance: Viewer | null = null;

    async function initViewer() {
      try {
        setStatus("loading");
        const [{ Viewer: PSVViewer }, { MarkersPlugin: PSVMarkers }, { GyroscopePlugin: PSVGyro }] =
          await Promise.all([
            import("@photo-sphere-viewer/core"),
            import("@photo-sphere-viewer/markers-plugin"),
            import("@photo-sphere-viewer/gyroscope-plugin"),
          ]);

        if (isDisposed || !hostRef.current) return;

        let maxTexSize = 4096;
        try {
          const gl =
            document.createElement("canvas").getContext("webgl2") ||
            document.createElement("canvas").getContext("webgl");
          if (gl) maxTexSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 4096;
        } catch {
          maxTexSize = 4096;
        }

        const isMobile = window.innerWidth <= 900;
        const resolvedMobileUrl =
          mobileImageUrl ?? remoteImageUrls?.mobile ?? "/panoramas/villa-paraiso/pano-4096.v1.webp";
        const resolvedDesktopUrl =
          desktopImageUrl ??
          remoteImageUrls?.desktop ??
          "/panoramas/villa-paraiso/pano-8192.v1.webp";

        // Fase D2: Carga progresiva rápida con 4096 primero y subida silenciosa a 8192 en escritorio
        const initialUrl = resolvedMobileUrl;
        const initialPanoData = activeConfig.panoDataMobile;

        instance = new PSVViewer({
          container: hostRef.current,
          panorama: initialUrl,
          panoData: initialPanoData,
          navbar: false,
          minFov: 16,
          maxFov: 68,
          defaultYaw: `${activeConfig.limits.defaultYawDeg}deg`,
          defaultPitch: `${activeConfig.limits.defaultPitchDeg}deg`,
          defaultZoomLvl: activeConfig.limits.defaultZoomLvl ?? 26,
          touchmoveTwoFingers: false,
          mousewheelCtrlKey: false,
          moveSpeed: 1.25,
          zoomSpeed: 1.4,
          moveInertia: prefersReducedMotion ? false : 0.85,
          plugins: [
            [PSVMarkers, { clickEventOnMarker: false, markers: extraMarkers }],
            [PSVGyro, { touchmove: true, roll: false, moveMode: "smooth" }],
          ],
        });

        viewerRef.current = instance;
        markersPluginRef.current = instance.getPlugin<MarkersPlugin>(PSVMarkers);
        const gyroPlugin = instance.getPlugin<GyroscopePlugin>(PSVGyro);
        gyroPluginRef.current = gyroPlugin;

        instance.addEventListener("render", () => {
          if (isDisposed || !viewerRef.current) return;
          drawLotsCanvas();
        });

        instance.addEventListener("position-updated", ({ position }) => {
          if (isDisposed) return;
          const deg = Math.round(((position.yaw * 180) / Math.PI + 360) % 360);
          setCameraYawDeg((prev) => (Math.abs(prev - deg) >= 2 ? deg : prev));
        });

        instance.addEventListener("ready", () => {
          if (isDisposed) return;
          setStatus("ready");
          drawLotsCanvas();

          // Auto-rotación suave inicial (solo en visor público y si no hay prefers-reduced-motion)
          if (!prefersReducedMotion && !cameraConfig) {
            let autoRotate = true;
            let autoRotateTimer: number | null = null;
            const stopAutoRotate = () => {
              autoRotate = false;
              if (autoRotateTimer) cancelAnimationFrame(autoRotateTimer);
            };

            const tickAutoRotate = () => {
              if (!autoRotate || isDisposed || !viewerRef.current) return;
              try {
                const currentPos = viewerRef.current.getPosition();
                viewerRef.current.rotate({
                  yaw: currentPos.yaw + 0.0006,
                  pitch: currentPos.pitch,
                });
                autoRotateTimer = requestAnimationFrame(tickAutoRotate);
              } catch {
                // Ignore
              }
            };

            setTimeout(() => {
              if (autoRotate && !isDisposed) {
                autoRotateTimer = requestAnimationFrame(tickAutoRotate);
              }
            }, 800);

            hostRef.current?.addEventListener("pointerdown", stopAutoRotate, { once: true });
            hostRef.current?.addEventListener("touchstart", stopAutoRotate, { once: true });
          }

          // Upgrade en segundo plano a 8192 en escritorio o dispositivos con soporte 8K
          if (
            (!isMobile || maxTexSize >= 8192) &&
            maxTexSize >= 8192 &&
            resolvedDesktopUrl &&
            resolvedDesktopUrl !== resolvedMobileUrl
          ) {
            setTimeout(() => {
              if (isDisposed || !viewerRef.current) return;
              viewerRef.current
                .setPanorama(resolvedDesktopUrl, {
                  panoData: activeConfig.panoDataDesktop,
                  transition: false,
                  showLoader: false,
                })
                .then(undefined, () => {});
            }, 250);
          }
        });

        instance.addEventListener("click", (evt) => {
          if (!evt.data) return;
          const {
            yaw: yawRad,
            pitch: pitchRad,
            viewerX: vx,
            viewerY: vy,
            originalEvent,
          } = evt.data;
          const shiftKey = Boolean((originalEvent as MouseEvent | undefined)?.shiftKey);

          if (onPanoramaClickRef.current) {
            const [yawDeg, pitchDeg] = radToDegPair([yawRad, pitchRad]);
            onPanoramaClickRef.current({ yawRad, pitchRad, yawDeg, pitchDeg });
          }

          if (renderStateRef.current.showLots) {
            const hit = hitTestPanoramaLots(vx, vy, visibleScreenLotsRef.current);
            if (hit) {
              if (onSelectLotWithModifierRef.current) {
                onSelectLotWithModifierRef.current(hit.id, shiftKey);
              } else if (onSelectLotRef.current) {
                onSelectLotRef.current(hit.id);
              }
            }
          }
        });

        if (gyroPlugin) {
          gyroPlugin
            .isSupported()
            .then((supported) => {
              if (!isDisposed) setGyroSupported(Boolean(supported));
            })
            .catch(() => {
              if (!isDisposed) setGyroSupported(false);
            });
        }
      } catch (err) {
        console.error("Error inicializando visor 360:", err);
        if (!isDisposed) setStatus("error");
      }
    }

    initViewer();

    return () => {
      isDisposed = true;
      if (interactionRestoreTimerRef.current) {
        window.clearTimeout(interactionRestoreTimerRef.current);
      }
      markersPluginRef.current = null;
      gyroPluginRef.current = null;
      viewerRef.current = null;
      try {
        instance?.destroy();
      } catch {
        // Ignore cleanup errors
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopImageUrl, mobileImageUrl]);

  useEffect(() => {
    const mp = markersPluginRef.current;
    if (!mp || status !== "ready") return;
    try {
      mp.setMarkers(extraMarkers);
    } catch {
      // Ignore mid-transition
    }
  }, [extraMarkers, status]);

  useEffect(() => {
    if (!viewerRef.current || status !== "ready") return;
    try {
      viewerRef.current.setOptions({
        mousemove: dragMode !== "hand",
      });
    } catch {
      // Ignore
    }
  }, [dragMode, status]);

  const animateCameraToLot = useCallback(
    (lotId: string, zoomTarget?: number) => {
      if (status !== "ready" || !viewerRef.current) return;
      const cleanId = lotId.trim();
      const cleanDigits = cleanId.replace(/^L-?/i, "");
      const target = mergedPanoramaLots.find(
        (l) =>
          l.id === cleanId ||
          l.id.toLowerCase() === cleanId.toLowerCase() ||
          l.id.replace(/^L-?/i, "") === cleanDigits ||
          String(l.lotNumber) === cleanDigits,
      );
      if (!target) return;

      const viewer = viewerRef.current;
      const clampedPitch = Math.max(
        (activeConfig.limits.minPitchDeg * Math.PI) / 180,
        Math.min((activeConfig.limits.maxPitchDeg * Math.PI) / 180, target.labelRad[1]),
      );

      if (prefersReducedMotion) {
        viewer.rotate({ yaw: target.labelRad[0], pitch: clampedPitch });
        if (typeof zoomTarget === "number") viewer.zoom(zoomTarget);
        return;
      }

      viewer.animate({
        yaw: target.labelRad[0],
        pitch: clampedPitch,
        ...(typeof zoomTarget === "number" ? { zoom: zoomTarget } : {}),
        speed: 850,
      });
    },
    [status, mergedPanoramaLots, activeConfig.limits, prefersReducedMotion],
  );

  useEffect(() => {
    if (!selectedLotId || status !== "ready" || !viewerRef.current) return;
    const cleanId = selectedLotId.trim();
    const cleanDigits = cleanId.replace(/^L-?/i, "");
    const target = mergedPanoramaLots.find(
      (l) =>
        l.id === cleanId ||
        l.id.toLowerCase() === cleanId.toLowerCase() ||
        l.id.replace(/^L-?/i, "") === cleanDigits ||
        String(l.lotNumber) === cleanDigits,
    );
    if (!target) return;

    const viewer = viewerRef.current;
    const pos = viewer.getPosition();
    let dYaw = Math.abs(pos.yaw - target.labelRad[0]);
    if (dYaw > Math.PI) dYaw = Math.abs(2 * Math.PI - dYaw);
    const dPitch = Math.abs(pos.pitch - target.labelRad[1]);

    if (dYaw > 0.15 || dPitch > 0.12) {
      animateCameraToLot(selectedLotId);
    }
  }, [selectedLotId, status, mergedPanoramaLots, animateCameraToLot]);

  // Fase D1: Throttle de hit-test en pointermove a ~30 Hz (33 ms)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const vx = e.clientX - rect.left;
      const vy = e.clientY - rect.top;

      if (loupeZoom > 1) {
        setCursorPos({ x: vx, y: vy });
        updateLoupeCanvas(vx, vy);
      }

      if (e.pointerType === "touch" || isPointerDownRef.current || !showLots) {
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
          drawLotsCanvas();
        }
        return;
      }

      const now = performance.now();
      if (now - lastHitTestTimeRef.current < 32) return;
      lastHitTestTimeRef.current = now;

      const hit = hitTestPanoramaLots(vx, vy, visibleScreenLotsRef.current);

      const nextId = hit?.id ?? null;
      if (nextId !== hoveredLotIdRef.current) {
        hoveredLotIdRef.current = nextId;
        drawLotsCanvas();
      }
      if (hit) {
        setHoveredLot({
          id: hit.id,
          label: hit.label,
          status: hit.status,
          area: hit.area,
          price: hit.price,
          x: vx,
          y: vy,
        });
      } else if (hoveredLot !== null) {
        setHoveredLot(null);
      }
    },
    [showLots, drawLotsCanvas, hoveredLot, loupeZoom, updateLoupeCanvas],
  );

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (isCssFullscreen) {
      setIsCssFullscreen(false);
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (typeof el.requestFullscreen === "function") {
      try {
        await el.requestFullscreen();
        return;
      } catch {
        // Fallback for iOS
      }
    }
    setIsCssFullscreen((prev) => !prev);
  }, [isCssFullscreen]);

  const toggleGyroscope = useCallback(async () => {
    const gp = gyroPluginRef.current;
    if (!gp) return;
    try {
      if (gp.isEnabled()) {
        gp.stop();
        setGyroEnabled(false);
      } else {
        await gp.start("smooth");
        setGyroEnabled(true);
      }
    } catch {
      setGyroEnabled(false);
    }
  }, []);

  const handleZoomStep = useCallback((delta: number) => {
    const v = viewerRef.current;
    if (!v) return;
    const current = v.getZoomLevel();
    v.zoom(Math.max(0, Math.min(100, current + delta)));
  }, []);

  const resetCameraView = useCallback(() => {
    viewerRef.current?.animate({
      yaw: `${activeConfig.limits.defaultYawDeg}deg`,
      pitch: `${activeConfig.limits.defaultPitchDeg}deg`,
      zoom: activeConfig.limits.defaultZoomLvl ?? 26,
      speed: prefersReducedMotion ? 200 : 800,
    });
  }, [activeConfig.limits, prefersReducedMotion]);

  const handleLotSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = lotSearchQuery.trim().replace(/^L-?/i, "");
      if (!q) return;
      const match = mergedPanoramaLots.find(
        (l) =>
          l.id.toLowerCase() === q.toLowerCase() ||
          l.id.replace(/^L-?/i, "").toLowerCase() === q.toLowerCase() ||
          String(l.lotNumber) === q,
      );
      if (match) {
        onSelectLotRef.current?.(match.id);
        animateCameraToLot(match.id, 58);
        setSearchOpen(false);
      }
    },
    [lotSearchQuery, mergedPanoramaLots, animateCameraToLot],
  );

  const activeFullscreen = isFullscreen || isCssFullscreen;

  return (
    <div
      ref={wrapperRef}
      onPointerDown={() => {
        isPointerDownRef.current = true;
        isInteractingRef.current = true;
        if (interactionRestoreTimerRef.current) {
          window.clearTimeout(interactionRestoreTimerRef.current);
        }
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
          drawLotsCanvas();
        }
      }}
      onPointerUp={() => {
        isPointerDownRef.current = false;
        interactionRestoreTimerRef.current = window.setTimeout(() => {
          isInteractingRef.current = false;
          drawLotsCanvas();
        }, 150);
      }}
      onPointerCancel={() => {
        isPointerDownRef.current = false;
        isInteractingRef.current = false;
        drawLotsCanvas();
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        isPointerDownRef.current = false;
        isInteractingRef.current = false;
        setCursorPos(null);
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
          drawLotsCanvas();
        }
      }}
      className={
        activeFullscreen
          ? "fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden bg-[#121811] select-none"
          : "relative size-full overflow-hidden bg-[#121811] select-none"
      }
      style={{ cursor: hoveredLot ? "pointer" : undefined }}
      aria-label={`Vista 360° de ${projectName}`}
    >
      {/* Previsualización ligera de fondo mientras carga el WebGL (Fase D2) */}
      {status === "loading" && previewImageUrl && (
        <img
          src={previewImageUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover blur-md opacity-45 scale-105"
        />
      )}

      <div ref={hostRef} className="size-full" />
      <canvas
        ref={canvasOverlayRef}
        className={`pointer-events-none absolute inset-0 z-10 size-full transition-opacity duration-300 ${
          showLots ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Lupa de precisión ×2 / ×4 en el cursor (Fase A4) */}
      {loupeZoom > 1 && cursorPos && (
        <div
          className="pointer-events-none absolute z-30 size-[148px] overflow-hidden rounded-full border-2 border-amber-400 shadow-[0_8px_30px_rgba(0,0,0,0.65)] bg-black"
          style={{
            left: Math.min(
              Math.max(8, cursorPos.x - 74),
              (wrapperRef.current?.clientWidth ?? 800) - 156,
            ),
            top: Math.max(8, cursorPos.y - 166),
          }}
        >
          <canvas ref={loupeCanvasRef} className="size-full" />
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300">
            ×{loupeZoom}
          </span>
        </div>
      )}

      {/* Capa de arrastre interactivo con mano y edición de vértices (el mapa/foto 360 NO se mueve) */}
      {dragMode === "hand" && (
        <div
          className={`absolute inset-0 z-20 size-full select-none ${
            draggingVertexIndex !== null
              ? "cursor-crosshair"
              : isHandDragging
                ? "cursor-grabbing"
                : hoveredLot
                  ? "cursor-pointer"
                  : "cursor-grab"
          }`}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            try {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }

            const rect = wrapperRef.current?.getBoundingClientRect();
            const vx = rect ? e.clientX - rect.left : e.clientX;
            const vy = rect ? e.clientY - rect.top : e.clientY;

            if (loupeZoom > 1) {
              setCursorPos({ x: vx, y: vy });
              updateLoupeCanvas(vx, vy);
            }

            // Fase A2: Si estamos editando vértices y el usuario toca un handle de vértice del lote seleccionado
            if (editableVertices && canonicalSelectedLotId && onMoveVertexRef.current) {
              const selScreen = visibleScreenLotsRef.current.find(
                (l) => l.id === canonicalSelectedLotId,
              );
              const vIdx = hitTestLotVertexHandle(vx, vy, selScreen, 13);
              if (vIdx !== null) {
                onVertexDragStartRef.current?.();
                draggingVertexIndexRef.current = vIdx;
                setDraggingVertexIndex(vIdx);
                drawLotsCanvas();
                return;
              }
            }

            setIsHandDragging(true);
            handDragStartRef.current = { x: e.clientX, y: e.clientY };
            handPointerDownPosRef.current = { x: e.clientX, y: e.clientY };
            liveDragOffsetRef.current = { deltaYawRad: 0, deltaPitchRad: 0 };
          }}
          onPointerMove={(e) => {
            const rect = wrapperRef.current?.getBoundingClientRect();
            const vx = rect ? e.clientX - rect.left : e.clientX;
            const vy = rect ? e.clientY - rect.top : e.clientY;

            if (loupeZoom > 1) {
              setCursorPos({ x: vx, y: vy });
              updateLoupeCanvas(vx, vy);
            }

            // Arrastre de un vértice individual en vivo (Fase A2)
            if (
              draggingVertexIndexRef.current !== null &&
              canonicalSelectedLotId &&
              onMoveVertexRef.current &&
              viewerRef.current
            ) {
              e.stopPropagation();
              e.preventDefault();
              const rad = screenPointToPanoramaRad(vx, vy, viewerRef.current);
              if (rad) {
                onMoveVertexRef.current(
                  canonicalSelectedLotId,
                  draggingVertexIndexRef.current,
                  rad[0],
                  rad[1],
                );
              }
              return;
            }

            if (!isHandDragging || !handDragStartRef.current) {
              if (showLots && rect) {
                if (editableVertices && canonicalSelectedLotId) {
                  const selScreen = visibleScreenLotsRef.current.find(
                    (l) => l.id === canonicalSelectedLotId,
                  );
                  const hVIdx = hitTestLotVertexHandle(vx, vy, selScreen, 12);
                  if (hVIdx !== hoveredVertexIndexRef.current) {
                    hoveredVertexIndexRef.current = hVIdx;
                    drawLotsCanvas();
                  }
                }

                const hit = hitTestPanoramaLots(vx, vy, visibleScreenLotsRef.current);
                if (hit && hit.id !== hoveredLotIdRef.current) {
                  hoveredLotIdRef.current = hit.id;
                  setHoveredLot({
                    id: hit.id,
                    label: hit.label,
                    status: hit.status,
                    area: hit.area,
                    price: hit.price,
                    x: vx,
                    y: vy,
                  });
                  drawLotsCanvas();
                } else if (!hit && hoveredLotIdRef.current !== null) {
                  hoveredLotIdRef.current = null;
                  setHoveredLot(null);
                  drawLotsCanvas();
                }
              }
              return;
            }

            e.stopPropagation();
            e.preventDefault();
            const dx = e.clientX - handDragStartRef.current.x;
            const dy = e.clientY - handDragStartRef.current.y;
            handDragStartRef.current = { x: e.clientX, y: e.clientY };

            const v = viewerRef.current;
            const zoom = v?.getZoomLevel() ?? 26;
            const fovDeg = 85 - (zoom / 100) * 55;
            const w = rect?.width || 800;
            const h = rect?.height || 600;

            const degPerPixelX = fovDeg / w;
            const degPerPixelY = (fovDeg * (h / w)) / h;

            const stepYawRad = (-dx * degPerPixelX * Math.PI) / 180;
            const stepPitchRad = (-dy * degPerPixelY * Math.PI) / 180;

            if (!liveDragOffsetRef.current) {
              liveDragOffsetRef.current = { deltaYawRad: 0, deltaPitchRad: 0 };
            }
            liveDragOffsetRef.current.deltaYawRad += stepYawRad;
            liveDragOffsetRef.current.deltaPitchRad += stepPitchRad;

            if (!rafScheduledRef.current) {
              rafScheduledRef.current = true;
              requestAnimationFrame(() => {
                rafScheduledRef.current = false;
                drawLotsCanvas();
              });
            }
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }

            if (draggingVertexIndexRef.current !== null) {
              draggingVertexIndexRef.current = null;
              setDraggingVertexIndex(null);
              drawLotsCanvas();
              return;
            }

            const downPos = handPointerDownPosRef.current;
            const dist = downPos ? Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) : 999;
            const totalYawRad = liveDragOffsetRef.current?.deltaYawRad || 0;
            const totalPitchRad = liveDragOffsetRef.current?.deltaPitchRad || 0;
            liveDragOffsetRef.current = null;
            setIsHandDragging(false);
            handDragStartRef.current = null;
            handPointerDownPosRef.current = null;

            if (dist < 6) {
              const rect = wrapperRef.current?.getBoundingClientRect();
              if (rect) {
                const vx = e.clientX - rect.left;
                const vy = e.clientY - rect.top;
                const hit = hitTestPanoramaLots(vx, vy, visibleScreenLotsRef.current);
                if (hit) {
                  if (onSelectLotWithModifierRef.current) {
                    onSelectLotWithModifierRef.current(hit.id, e.shiftKey);
                  } else if (onSelectLot) {
                    onSelectLot(hit.id);
                  }
                }
              }
            } else {
              const totalYawDeg = (totalYawRad * 180) / Math.PI;
              const totalPitchDeg = (totalPitchRad * 180) / Math.PI;
              if (Math.abs(totalYawDeg) > 0.0005 || Math.abs(totalPitchDeg) > 0.0005) {
                onHandDragRef.current?.(totalYawDeg, totalPitchDeg);
              }
            }
            drawLotsCanvas();
          }}
          onPointerCancel={(e) => {
            try {
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            draggingVertexIndexRef.current = null;
            setDraggingVertexIndex(null);
            liveDragOffsetRef.current = null;
            setIsHandDragging(false);
            handDragStartRef.current = null;
            handPointerDownPosRef.current = null;
            drawLotsCanvas();
          }}
        />
      )}

      {/* Tooltip editorial glassmorphic */}
      {hoveredLot && (
        <div
          className="pointer-events-none absolute z-30 rounded-2xl border border-white/45 dark:border-white/15 bg-background/92 px-3 py-2 text-xs text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop-blur-2xl"
          style={{
            left: Math.min(Math.max(12, hoveredLot.x + 14), window.innerWidth - 220),
            top: Math.max(12, hoveredLot.y - 44),
          }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Lote {hoveredLot.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                hoveredLot.status === "Disponible" || hoveredLot.status === "Últimas unidades"
                  ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300"
                  : hoveredLot.status === "Reservado"
                    ? "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300"
                    : hoveredLot.status === "Por confirmar"
                      ? "bg-slate-500/15 text-slate-700 border-slate-500/30 dark:text-slate-300"
                      : "bg-rose-500/15 text-rose-800 border-rose-500/30 dark:text-rose-300"
              }`}
            >
              {hoveredLot.status}
            </span>
          </div>
          {(hoveredLot.area > 0 || hoveredLot.price > 0) && (
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              {hoveredLot.area > 0 && <span>{hoveredLot.area} m²</span>}
              {hoveredLot.price > 0 && (
                <span className="font-bold text-foreground">
                  · {formatLotPrice(hoveredLot.price)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Barra superior izquierda sobria, con leyenda en vivo, buscador y brújula (Fase C4) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 sm:right-auto sm:top-3 sm:left-3 z-20 select-none pointer-events-none">
        <div
          className="pointer-events-auto flex items-center gap-1.5 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x py-0.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isDraftPreviewMode && (
            <span className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-sm">
              Vista previa borrador
            </span>
          )}

          <div className="flex items-center gap-0.5 shrink-0 rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setShowLots((v) => !v)}
              className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium leading-none transition-colors cursor-pointer ${
                showLots
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={showLots ? "Cambiar a Solo foto (ocultar plano)" : "Mostrar plano de lotes"}
            >
              {showLots ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              <span>{showLots ? "Mostrar plano" : "Solo foto"}</span>
            </button>

            {showLots && (
              <>
                <button
                  type="button"
                  onClick={() => setVisualStyle((s) => (s === "pins" ? "filled" : "pins"))}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium leading-none transition-colors cursor-pointer ${
                    visualStyle === "filled"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Cambiar entre pines numerados o relleno de color"
                >
                  {visualStyle === "pins" ? "Pines" : "Color"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRoads((v) => !v)}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium leading-none transition-colors cursor-pointer ${
                    showRoads
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mostrar u ocultar el trazado de vías y calles"
                >
                  Calles
                </button>

                <button
                  type="button"
                  onClick={() => setShowContextLayers((v) => !v)}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium leading-none transition-colors cursor-pointer ${
                    showContextLayers
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mostrar u ocultar los lagos"
                >
                  Lagos
                </button>

                <div className="mx-1 h-3.5 w-px bg-border/80 shrink-0" />

                {FILTER_OPTIONS.map((item) => {
                  const count = statusCounts[item.id];
                  if (item.id === "Por confirmar" && count === 0) return null;
                  const active = statusFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusFilter(item.id)}
                      className={`flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium leading-none transition-colors cursor-pointer ${
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.id !== "ALL" && (
                        <span className={`size-1.5 rounded-full shrink-0 ${item.dot}`} />
                      )}
                      <span className="md:hidden">
                        {item.short} ({count})
                      </span>
                      <span className="hidden md:inline">
                        {item.label} ({count})
                      </span>
                    </button>
                  );
                })}

                <div className="mx-1 h-3.5 w-px bg-border/80 shrink-0" />

                {/* Buscador rápido por número de lote ("Ir a lote") — Fase C4 */}
                {searchOpen ? (
                  <form onSubmit={handleLotSearchSubmit} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={lotSearchQuery}
                      onChange={(e) => setLotSearchQuery(e.target.value)}
                      placeholder="Ej. 142"
                      className="h-6 w-16 rounded border border-border bg-background px-1.5 text-[11px] font-medium text-foreground focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background cursor-pointer"
                    >
                      Ir
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-1 shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium leading-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Buscar e ir a un lote por número"
                  >
                    <Search className="size-3" />
                    <span className="hidden sm:inline">Ir a lote</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cápsula vertical derecha de controles + Brújula en vivo (Fase C4) */}
      <div
        className={`absolute ${
          isRightPanelOpen ? "right-3 lg:right-[384px] xl:right-[404px]" : "right-3 lg:right-4"
        } top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 rounded-full border border-white/35 bg-background/88 p-1 lg:p-1.5 text-foreground/80 shadow-xl backdrop-blur-xl select-none transition-[right] duration-300 ease-out`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Indicador de brújula / orientación */}
        <button
          type="button"
          onClick={resetCameraView}
          className="flex flex-col items-center justify-center size-7 lg:size-8.5 rounded-full text-foreground/85 hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          title={`Orientación ${formatCardinalDirection(cameraYawDeg)} (${cameraYawDeg}°) · Clic para restablecer vista`}
          aria-label="Brújula de orientación"
        >
          <Compass
            className="size-3.5 lg:size-4 transition-transform duration-150"
            style={{ transform: `rotate(${-cameraYawDeg}deg)` }}
          />
          <span className="text-[8px] font-mono font-bold leading-none mt-0.5">
            {formatCardinalDirection(cameraYawDeg)}
          </span>
        </button>

        <div className="h-px w-4 lg:w-5 bg-border/60" />

        <button
          type="button"
          onClick={() => handleZoomStep(18)}
          className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          aria-label="Acercar"
          title="Acercar (Zoom In)"
        >
          <Plus className="size-3.5 lg:size-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoomStep(-18)}
          className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          aria-label="Alejar"
          title="Alejar (Zoom Out)"
        >
          <Minus className="size-3.5 lg:size-4" />
        </button>

        <div className="h-px w-4 lg:w-5 bg-border/60" />

        <button
          type="button"
          onClick={resetCameraView}
          className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          aria-label="Restablecer vista"
          title="Restablecer vista inicial"
        >
          <RotateCcw className="size-3.5 lg:size-4" />
        </button>

        {gyroSupported && (
          <button
            type="button"
            onClick={toggleGyroscope}
            className={`flex size-7 lg:size-8.5 items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer ${
              gyroEnabled
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-foreground/80 hover:bg-muted hover:text-foreground"
            }`}
            aria-label="Giroscopio"
            title="Mover con el celular (Giroscopio)"
          >
            <Compass className="size-3.5 lg:size-4" />
          </button>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          aria-label={activeFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          title={activeFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {activeFullscreen ? (
            <Shrink className="size-3.5 lg:size-4" />
          ) : (
            <Expand className="size-3.5 lg:size-4" />
          )}
        </button>
      </div>

      {/* Tarjeta editorial inferior del lote seleccionado (Fase C5) */}
      {selectedLot && (
        <div
          className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 z-20 rounded-xl border border-border/80 bg-background/95 p-3.5 text-foreground shadow-lg backdrop-blur-xl"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Lote {selectedLot.id.replace(/^L-/, "")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span
                    className={`size-1.5 rounded-full ${
                      selectedLot.status === "Vendido"
                        ? "bg-rose-500"
                        : selectedLot.status === "Reservado"
                          ? "bg-amber-500"
                          : selectedLot.status === "Por confirmar"
                            ? "bg-slate-400"
                            : "bg-emerald-500"
                    }`}
                  />
                  {selectedLot.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedLot.manzana
                  ? `Manzana ${selectedLot.manzana.replace(/^M\s*/i, "")} · `
                  : ""}
                {selectedLot.area} m²
              </p>
            </div>
            {selectedLot.price > 0 && (
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatLotPrice(selectedLot.price)}
                </p>
                <p className="text-[10px] text-muted-foreground">Precio lista</p>
              </div>
            )}
          </div>

          {((onReserveLot && selectedLot.status !== "Vendido") ||
            onInspectLot ||
            onSwitchToPlan) && (
            <div className="mt-3 flex flex-col gap-1.5">
              {onReserveLot && selectedLot.status !== "Vendido" && (
                <button
                  type="button"
                  onClick={() => onReserveLot(selectedLot)}
                  className="flex w-full items-center justify-center rounded-lg bg-foreground px-3.5 py-2 text-xs font-medium text-background hover:bg-foreground/90 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Solicitar reserva
                </button>
              )}

              {(onInspectLot || onSwitchToPlan) && (
                <div className="flex items-center gap-1.5">
                  {onInspectLot && (
                    <button
                      type="button"
                      onClick={() => onInspectLot(selectedLot)}
                      className={`flex flex-1 items-center justify-center rounded-lg ${
                        onReserveLot && selectedLot.status !== "Vendido"
                          ? "border border-border bg-muted/40 text-foreground hover:bg-muted"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      } px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer`}
                    >
                      Ver ficha
                    </button>
                  )}
                  {onSwitchToPlan && (
                    <button
                      type="button"
                      onClick={onSwitchToPlan}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Ver este lote en el mapa / plano 2D"
                    >
                      <MapPin className="size-3" />
                      <span>Ver en mapa</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {status === "loading" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-background/75 backdrop-blur-xs text-xs font-bold uppercase tracking-[0.2em] text-foreground">
          <div className="flex flex-col items-center gap-2.5">
            <div className="size-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span>Cargando 360°</span>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-background/95 p-6 text-center text-foreground">
          <div className="max-w-xs space-y-1.5">
            <Layers className="mx-auto size-7 text-amber-500" />
            <p className="text-sm font-bold">Error al cargar 360°</p>
            <p className="text-xs text-muted-foreground">Recarga la página o cambia al Plano 2D.</p>
          </div>
        </div>
      )}
    </div>
  );
}
