import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import {
  Calendar,
  Compass,
  Expand,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Map as MapIcon,
  Minus,
  Plus,
  RotateCcw,
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
  hitTestPanoramaLots,
  mergePanoramaLotsWithOverrides,
  prepareCanvasContextLayers,
  prepareCanvasLots,
  projectMasterplanLayers,
  projectMasterplanLots,
  radToDegPair,
  renderPanoramaLotsCanvas,
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
}

const FILTER_OPTIONS = [
  { id: "ALL", label: "Todos", short: "Todos", dot: "bg-foreground/70" },
  { id: "Disponible", label: "Disponibles", short: "Disp.", dot: "bg-emerald-500" },
  { id: "Reservado", label: "Reservados", short: "Res.", dot: "bg-amber-500" },
  { id: "Vendido", label: "Vendidos", short: "Vend.", dot: "bg-rose-500" },
] as const;

export default function PanoramaViewer({
  projectName = "Villa Paraíso",
  desktopImageUrl = "/panoramas/villa-paraiso/pano-8192.v1.webp",
  mobileImageUrl = "/panoramas/villa-paraiso/pano-4096.v1.webp",
  cameraConfig,
  projectedLots,
  overrides,
  lots = [],
  selectedLotId,
  onSelectLot,
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
}: PanoramaViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const markersPluginRef = useRef<MarkersPlugin | null>(null);
  const gyroPluginRef = useRef<GyroscopePlugin | null>(null);
  const visibleScreenLotsRef = useRef<VisibleScreenLot[]>([]);
  const hoveredLotIdRef = useRef<string | null>(null);
  const isPointerDownRef = useRef(false);

  const [isHandDragging, setIsHandDragging] = useState(false);
  const handDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const handPointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const liveDragOffsetRef = useRef<{ deltaYawRad: number; deltaPitchRad: number } | null>(null);
  const rafScheduledRef = useRef(false);
  const onHandDragRef = useRef(onHandDrag);
  onHandDragRef.current = onHandDrag;

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showLots, setShowLots] = useState(initialShowLots);
  const [showContextLayers, setShowContextLayers] = useState(false);
  const [showRoads, setShowRoads] = useState(initialShowRoads);
  const [visualStyle, setVisualStyle] = useState<"pins" | "filled">("filled");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Disponible" | "Reservado" | "Vendido">(
    "ALL",
  );
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

  const [taglineExpanded, setTaglineExpanded] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTaglineExpanded(false);
    }, 6500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Si viene configuración explícita por props (ej. modo calibración admin), no consultar Supabase
    if (cameraConfig && projectedLots) return;
    let active = true;

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

        const dbConfig: PanoramaCameraConfig = {
          camera: {
            lat: data.camera_lat ?? defaultPanoramaData.config.camera.lat,
            lng: data.camera_lng ?? defaultPanoramaData.config.camera.lng,
            heightAboveGroundM:
              data.height_above_ground_m ?? defaultPanoramaData.config.camera.heightAboveGroundM,
            offsetEastM: data.offset_east_m ?? defaultPanoramaData.config.camera.offsetEastM ?? 0,
            offsetNorthM:
              data.offset_north_m ?? defaultPanoramaData.config.camera.offsetNorthM ?? 0,
          },
          yawOffsetDeg: data.yaw_offset_deg ?? defaultPanoramaData.config.yawOffsetDeg,
          tilt: {
            pitchDeg: data.pitch_tilt_deg ?? defaultPanoramaData.config.tilt.pitchDeg,
            rollDeg: data.roll_tilt_deg ?? defaultPanoramaData.config.tilt.rollDeg,
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
        };

        setRemoteConfig(dbConfig);

        if (data.desktop_image_path || data.mobile_image_path) {
          setRemoteImageUrls({
            desktop: data.desktop_image_path || undefined,
            mobile: data.mobile_image_path || undefined,
          });
        }

        if (data.lot_overrides && typeof data.lot_overrides === "object") {
          setRemoteOverrides(data.lot_overrides as PanoramaLotOverridesMap);
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
    // Si el contenedor padre ya pasó lotes proyectados (ej. admin preview), los usamos directamente
    if (projectedLots) {
      const activeOverrides = overrides ?? remoteOverrides ?? defaultOverrides;
      return mergePanoramaLotsWithOverrides(projectedLots, activeOverrides);
    }

    // Si leímos configuración remota desde Supabase, reproyectamos dinámicamente en el cliente
    if (remoteConfig) {
      const liveLots = projectMasterplanLots(rawLots, remoteConfig);
      const activeOverrides = overrides ?? remoteOverrides ?? defaultOverrides;
      return mergePanoramaLotsWithOverrides(liveLots, activeOverrides);
    }

    // Respaldo estático: si no hay datos de Supabase o la consulta falló, usar JSON generado
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

  const preparedContextLayers = useMemo(() => {
    if (remoteConfig) {
      const liveLayers = projectMasterplanLayers(rawLayers, remoteConfig);
      return prepareCanvasContextLayers(liveLayers);
    }
    return prepareCanvasContextLayers(defaultPanoramaData.layers);
  }, [remoteConfig]);

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
  };

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
    drawLotsCanvas,
  ]);

  const onSelectLotRef = useRef(onSelectLot);
  onSelectLotRef.current = onSelectLot;
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
        const initialUrl = isMobile
          ? (mobileImageUrl ??
            remoteImageUrls?.mobile ??
            "/panoramas/villa-paraiso/pano-4096.v1.webp")
          : (desktopImageUrl ??
            remoteImageUrls?.desktop ??
            "/panoramas/villa-paraiso/pano-8192.v1.webp");
        const initialPanoData = isMobile
          ? activeConfig.panoDataMobile
          : activeConfig.panoDataDesktop;

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
          moveInertia: 0.85,
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
          if (!isDisposed) drawLotsCanvas();
        });

        instance.addEventListener("ready", () => {
          if (isDisposed) return;
          setStatus("ready");
          drawLotsCanvas();

          // Auto-rotación suave inicial para generar dinamismo hasta que el usuario interactúe
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
              viewerRef.current.rotate({ yaw: currentPos.yaw + 0.0006, pitch: currentPos.pitch });
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

          if (
            isMobile &&
            maxTexSize >= 8192 &&
            desktopImageUrl &&
            desktopImageUrl !== mobileImageUrl
          ) {
            setTimeout(() => {
              if (isDisposed || !viewerRef.current) return;
              viewerRef.current
                .setPanorama(desktopImageUrl, {
                  panoData: activeConfig.panoDataDesktop,
                  transition: false,
                  showLoader: false,
                })
                .then(undefined, () => {});
            }, 350);
          }
        });

        instance.addEventListener("click", (evt) => {
          if (!evt.data) return;
          const { yaw: yawRad, pitch: pitchRad, viewerX: vx, viewerY: vy } = evt.data;

          if (onPanoramaClickRef.current) {
            const [yawDeg, pitchDeg] = radToDegPair([yawRad, pitchRad]);
            onPanoramaClickRef.current({ yawRad, pitchRad, yawDeg, pitchDeg });
          }

          if (renderStateRef.current.showLots && onSelectLotRef.current) {
            const hit = hitTestPanoramaLots(vx, vy, visibleScreenLotsRef.current);
            if (hit) onSelectLotRef.current(hit.id);
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
      viewer.animate({
        yaw: target.labelRad[0],
        pitch: Math.max(
          (activeConfig.limits.minPitchDeg * Math.PI) / 180,
          Math.min((activeConfig.limits.maxPitchDeg * Math.PI) / 180, target.labelRad[1]),
        ),
        speed: 900,
      });
    }
  }, [selectedLotId, status, mergedPanoramaLots, activeConfig.limits]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch" || isPointerDownRef.current || !showLots) {
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
          drawLotsCanvas();
        }
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const vx = e.clientX - rect.left;
      const vy = e.clientY - rect.top;
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
    [showLots, drawLotsCanvas, hoveredLot],
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
      speed: 800,
    });
  }, [activeConfig.limits]);

  const activeFullscreen = isFullscreen || isCssFullscreen;

  return (
    <div
      ref={wrapperRef}
      onPointerDown={() => {
        isPointerDownRef.current = true;
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
          drawLotsCanvas();
        }
      }}
      onPointerUp={() => {
        isPointerDownRef.current = false;
      }}
      onPointerCancel={() => {
        isPointerDownRef.current = false;
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        isPointerDownRef.current = false;
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
      <div ref={hostRef} className="size-full" />
      <canvas
        ref={canvasOverlayRef}
        className="pointer-events-none absolute inset-0 z-10 size-full"
      />

      {/* Capa de arrastre interactivo con mano (el mapa/foto 360 NO se mueve) */}
      {dragMode === "hand" && (
        <div
          className={`absolute inset-0 z-20 size-full select-none ${
            isHandDragging ? "cursor-grabbing" : hoveredLot ? "cursor-pointer" : "cursor-grab"
          }`}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            try {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            setIsHandDragging(true);
            handDragStartRef.current = { x: e.clientX, y: e.clientY };
            handPointerDownPosRef.current = { x: e.clientX, y: e.clientY };
            liveDragOffsetRef.current = { deltaYawRad: 0, deltaPitchRad: 0 };
          }}
          onPointerMove={(e) => {
            if (!isHandDragging || !handDragStartRef.current) {
              // Si no está arrastrando, detectar si pasa sobre un lote
              if (showLots) {
                const rect = wrapperRef.current?.getBoundingClientRect();
                if (rect) {
                  const vx = e.clientX - rect.left;
                  const vy = e.clientY - rect.top;
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
            const rect = wrapperRef.current?.getBoundingClientRect();
            const w = rect?.width || 800;
            const h = rect?.height || 600;

            const degPerPixelX = fovDeg / w;
            const degPerPixelY = (fovDeg * (h / w)) / h;

            // Arrastre 1:1 con la mano:
            // Mover mouse a la DERECHA (dx > 0) -> polígono se mueve a la DERECHA (yaw esférico disminuye)
            const stepYawRad = (-dx * degPerPixelX * Math.PI) / 180;
            // Mover mouse hacia ABAJO (dy > 0) -> polígono se mueve hacia ABAJO (pitch esférico disminuye)
            const stepPitchRad = (-dy * degPerPixelY * Math.PI) / 180;

            if (!liveDragOffsetRef.current) {
              liveDragOffsetRef.current = { deltaYawRad: 0, deltaPitchRad: 0 };
            }
            liveDragOffsetRef.current.deltaYawRad += stepYawRad;
            liveDragOffsetRef.current.deltaPitchRad += stepPitchRad;

            // Redibujar en tiempo real con 0ms lag
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
            const downPos = handPointerDownPosRef.current;
            const dist = downPos ? Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) : 999;
            const totalYawRad = liveDragOffsetRef.current?.deltaYawRad || 0;
            const totalPitchRad = liveDragOffsetRef.current?.deltaPitchRad || 0;
            liveDragOffsetRef.current = null;
            setIsHandDragging(false);
            handDragStartRef.current = null;
            handPointerDownPosRef.current = null;

            // Si fue un click rápido (sin arrastre mayor a 5px), seleccionar lote
            if (dist < 6) {
              const rect = wrapperRef.current?.getBoundingClientRect();
              if (rect) {
                const vx = e.clientX - rect.left;
                const vy = e.clientY - rect.top;
                const hit = hitTestPanoramaLots(vx, vy, visibleScreenLotsRef.current);
                if (hit && onSelectLot) {
                  onSelectLot(hit.id);
                }
              }
            } else {
              // Arrastre completado -> aplicar desplazamiento acumulado
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
            liveDragOffsetRef.current = null;
            setIsHandDragging(false);
            handDragStartRef.current = null;
            handPointerDownPosRef.current = null;
            drawLotsCanvas();
          }}
        />
      )}

      {/* Tooltip editorial glassmorphic (mismo diseño que MasterplanSvgViewer) */}
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
                hoveredLot.status === "Disponible"
                  ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300"
                  : hoveredLot.status === "Reservado"
                    ? "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300"
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

      {/* Barra superior izquierda ultracompacta y responsiva (desplazable en móvil sin desbordar la pantalla) */}
      <div className="absolute top-2 left-2 right-2 sm:right-auto sm:top-2.5 sm:left-2.5 z-20 select-none pointer-events-none">
        <div
          className="pointer-events-auto flex items-center max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x py-0.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 rounded-full border border-border/80 bg-background/95 p-0.5 sm:p-1 shadow-md backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setShowLots((v) => !v)}
              className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight transition-all cursor-pointer ${
                showLots
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={showLots ? "Ocultar lotes" : "Mostrar lotes"}
            >
              {showLots ? <Eye className="size-2.5" /> : <EyeOff className="size-2.5" />}
              <span>Lotes</span>
            </button>

            {showLots && (
              <>
                <button
                  type="button"
                  onClick={() => setVisualStyle((s) => (s === "pins" ? "filled" : "pins"))}
                  className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight transition-colors cursor-pointer ${
                    visualStyle === "filled"
                      ? "bg-muted text-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Cambiar entre pines numerados o relleno de color"
                >
                  <Layers className="size-2.5" />
                  <span>{visualStyle === "pins" ? "Pines" : "Color"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRoads((v) => !v)}
                  className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight transition-all cursor-pointer ${
                    showRoads
                      ? "bg-amber-400 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200 border border-amber-500/60 font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mostrar u ocultar el trazado de vías y calles que dividen las manzanas"
                >
                  <span>Calles</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowContextLayers((v) => !v)}
                  className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight transition-all cursor-pointer ${
                    showContextLayers
                      ? "bg-sky-400 text-sky-950 dark:bg-sky-500/30 dark:text-sky-200 border border-sky-500/60 font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mostrar u ocultar los lagos"
                >
                  <span>Lagos</span>
                </button>

                <div className="mx-0.5 h-3 w-px bg-border/70 shrink-0" />

                {FILTER_OPTIONS.map((item) => {
                  const active = statusFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusFilter(item.id)}
                      className={`flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight transition-all cursor-pointer ${
                        active
                          ? "bg-accent text-accent-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full shrink-0 ${
                          active && item.id === "ALL" ? "bg-accent-foreground" : item.dot
                        }`}
                      />
                      <span className="md:hidden">{item.short}</span>
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cápsula vertical derecha de controles (idéntica a MasterplanSvgViewer) */}
      <div
        className={`absolute ${
          isRightPanelOpen ? "right-3 lg:right-[384px] xl:right-[404px]" : "right-3 lg:right-4"
        } top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 rounded-full border border-white/35 bg-background/88 p-1 lg:p-1.5 text-foreground/80 shadow-xl backdrop-blur-xl select-none transition-[right] duration-300 ease-out`}
        onPointerDown={(e) => e.stopPropagation()}
      >
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

      {/* Tarjeta editorial inferior del lote seleccionado */}
      {selectedLot && (
        <div
          className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 z-20 rounded-2xl border border-border/85 bg-background/95 p-3.5 text-foreground shadow-[0_12px_36px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-foreground">
                  Lote {selectedLot.id.replace(/^L-/, "")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    selectedLot.status === "Vendido"
                      ? "bg-rose-500/15 text-rose-800 border-rose-500/30 dark:text-rose-300"
                      : selectedLot.status === "Reservado"
                        ? "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300"
                        : "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300"
                  }`}
                >
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
                <p className="text-sm font-extrabold text-foreground">
                  {formatLotPrice(selectedLot.price)}
                </p>
                <p className="text-[10px] text-muted-foreground">Precio lista</p>
              </div>
            )}
          </div>

          {((onReserveLot && selectedLot.status !== "Vendido") ||
            onInspectLot ||
            onSwitchToPlan) && (
            <div className="mt-3 flex flex-col gap-2">
              {onReserveLot && selectedLot.status !== "Vendido" && (
                <button
                  type="button"
                  onClick={() => onReserveLot(selectedLot)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-xs font-bold text-accent-foreground shadow-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Calendar className="size-3.5" />
                  <span>Reservar lote {selectedLot.id.replace(/^L-/, "")}</span>
                </button>
              )}

              {(onInspectLot || onSwitchToPlan) && (
                <div className="flex items-center gap-2">
                  {onInspectLot && (
                    <button
                      type="button"
                      onClick={() => onInspectLot(selectedLot)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full ${
                        onReserveLot && selectedLot.status !== "Vendido"
                          ? "border border-border bg-muted/60 text-foreground hover:bg-muted"
                          : "bg-accent text-accent-foreground shadow-sm hover:opacity-90"
                      } px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer`}
                    >
                      <FileText className="size-3.5" />
                      <span>Ver ficha</span>
                    </button>
                  )}
                  {onSwitchToPlan && (
                    <button
                      type="button"
                      onClick={onSwitchToPlan}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <MapIcon className="size-3.5" />
                      <span>Plano 2D</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Banner / Tagline sobre la vista 360° abajo a la izquierda */}
      {!selectedLot && (
        <div
          className="absolute bottom-3 left-3 sm:left-4 z-20 max-w-sm select-none animate-in fade-in slide-in-from-bottom-2 duration-700"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {taglineExpanded ? (
            <div className="relative rounded-2xl border border-white/20 bg-black/70 p-4 text-white shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setTaglineExpanded(false)}
                className="absolute right-2.5 top-2.5 rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimizar mensaje"
                aria-label="Minimizar mensaje"
              >
                <X className="size-3.5" />
              </button>
              <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.24em] text-accent font-semibold">
                <span>Villa Paraíso</span>
                <span>·</span>
                <span>Reserva Campestre</span>
              </div>
              <h3 className="mt-1 font-serif text-sm sm:text-base font-medium leading-tight text-white tracking-tight">
                DONDE LA NATURALEZA SE VUELVE HOGAR
              </h3>
              <p className="mt-1.5 text-[11px] sm:text-xs text-white/80 leading-relaxed font-light">
                Despierta cada día rodeado de naturaleza. Tres grandes lagos, senderos y paisajes
                extraordinarios.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTaglineExpanded(true)}
              className="flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-md hover:bg-black/80 transition-all cursor-pointer group"
              title="Ver mensaje de bienvenida"
            >
              <span className="text-accent text-sm group-hover:scale-110 transition-transform">
                🌿
              </span>
              <span className="font-serif text-[11px] sm:text-xs tracking-tight text-white/95">
                Donde la naturaleza se vuelve hogar
              </span>
            </button>
          )}
        </div>
      )}

      {status === "loading" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-background/85 backdrop-blur-sm text-xs font-bold uppercase tracking-[0.2em] text-foreground">
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
