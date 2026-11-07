import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Download,
  ExternalLink,
  Focus,
  Lock,
  Maximize2,
  Minus,
  Plus,
  Redo2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  Send,
  Sliders,
  Undo2,
  Unlock,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MarkerConfig } from "@photo-sphere-viewer/markers-plugin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import rawLots from "@/data/villa-paraiso/lots.json";
import rawLayers from "@/data/villa-paraiso/layers.json";
import rawPanoramaLotsData from "@/data/villa-paraiso/generated/panorama-lots.json";
import rawPanoramaOverrides from "@/data/villa-paraiso/panorama-overrides.json";
import {
  appendVersionSnapshot,
  CalibrationDiagnosticsPanel,
  computeControlPointYawCoverage,
  computeLotsConfidence,
  evaluateCalibration,
  loadLocalPanoramaDraft,
  loadLocalVersionHistory,
  mergeOverridesSafe,
  mergePanoramaLotsWithOverrides,
  moveLotVertexWithSnap,
  projectMasterplanLots,
  saveLocalPanoramaDraft,
  setPreviewDraftEnabled,
  transformLotsWithPerspective,
  useUndoHistory,
  type ControlPointOverlayItem,
  type PanoramaCameraConfig,
  type PanoramaControlPoint,
  type PanoramaLotOverridesMap,
  type PanoramaLotsData,
  type PanoramaVersionSnapshot,
  type ProjectedPanoramaLot,
} from "@/features/panorama-360";
import { supabase } from "@/lib/supabase";

const PanoramaViewer = lazy(() => import("@/components/project-view/panorama/PanoramaViewer"));

export const Route = createFileRoute("/admin/experiencias/panorama-360")({
  component: PanoramaCalibrationAdminPage,
});

interface RawLotItem {
  id: string;
  lotNumber: number;
  label: string;
  manzana?: string;
  areaM2: number;
  centroid: [number, number];
  pathD?: string;
}

const initialPanoramaData = rawPanoramaLotsData as unknown as PanoramaLotsData;
const initialOverrides = rawPanoramaOverrides as unknown as PanoramaLotOverridesMap;
const masterplanLots = (rawLots as unknown as RawLotItem[]).filter(
  (l): l is RawLotItem & { pathD: string } => Boolean(l.pathD),
);
const masterplanLayers = rawLayers as unknown as {
  waterAreas: string[];
  islands: string[];
  calzadas: string[];
};

const BASE_VIEWBOX = { x: 450, y: 150, w: 1750, h: 2050 };
const SVG_TO_METERS = 0.33273;
const ENTRANCE_SVG = { x: 1014.7, y: 2148.5 };

function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function PanoramaCalibrationAdminPage() {
  const [config, setConfig] = useState<PanoramaCameraConfig>(() => initialPanoramaData.config);
  const [controlPoints, setControlPoints] = useState<PanoramaControlPoint[]>(
    () => initialPanoramaData.controlPoints ?? [],
  );
  const [overrides, setOverrides] = useState<PanoramaLotOverridesMap>(() => ({
    ...initialOverrides,
  }));
  const [versionCounter, setVersionCounter] = useState<number>(1);
  const [versionHistory, setVersionHistory] = useState<PanoramaVersionSnapshot[]>(() =>
    loadLocalVersionHistory("main"),
  );
  const [recoverableDraft, setRecoverableDraft] = useState(() => loadLocalPanoramaDraft("main"));

  // Historial Undo / Redo (mínimo 50 pasos en memoria — Fase A2)
  const { canUndo, canRedo, undoCount, redoCount, pushSnapshot, undo, redo } = useUndoHistory({
    config: initialPanoramaData.config,
    overrides: initialOverrides,
    controlPoints: initialPanoramaData.controlPoints ?? [],
  });

  const recordBeforeChange = useCallback(
    (description?: string) => {
      pushSnapshot({ config, overrides, controlPoints }, description);
    },
    [pushSnapshot, config, overrides, controlPoints],
  );

  const handleUndo = useCallback(() => {
    const prev = undo({ config, overrides, controlPoints });
    if (prev) {
      setConfig(prev.config);
      setOverrides(prev.overrides);
      setControlPoints(prev.controlPoints);
    }
  }, [undo, config, overrides, controlPoints]);

  const handleRedo = useCallback(() => {
    const next = redo({ config, overrides, controlPoints });
    if (next) {
      setConfig(next.config);
      setOverrides(next.overrides);
      setControlPoints(next.controlPoints);
    }
  }, [redo, config, overrides, controlPoints]);

  // Modos de vista y área de trabajo
  const [viewLayout, setViewLayout] = useState<"split" | "pano" | "plan">("split");
  const [workspaceHeight, setWorkspaceHeight] = useState<"normal" | "tall" | "full">("tall");

  // Modo de interacción y alcance
  const [panoDragMode, setPanoDragMode] = useState<"orbit" | "hand">("hand");
  const [editScope, setEditScope] = useState<"global" | "piece" | "lot">("lot");
  const [selectedLotId, setSelectedLotId] = useState<string>("L-03");
  const [selectedPieceLotIds, setSelectedPieceLotIds] = useState<string[]>([
    "L-01",
    "L-02",
    "L-03",
    "L-04",
  ]);
  const [selectedManzana, setSelectedManzana] = useState<string>("M 1");
  const [nudgeStep, setNudgeStep] = useState<number>(0.2);
  const [numericMoveInput, setNumericMoveInput] = useState<string>("0.2");
  const [isPlanLocked, setIsPlanLocked] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);

  // Fase A2 / A3 / A4 / B3: Herramientas de precisión y ayudas visuales
  const [usePerspectiveMeters, setUsePerspectiveMeters] = useState<boolean>(true);
  const [editableVertices, setEditableVertices] = useState<boolean>(true);
  const [snapSharedVertices, setSnapSharedVertices] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(1.0);
  const [outlineOnly, setOutlineOnly] = useState<boolean>(false);
  const [loupeZoom, setLoupeZoom] = useState<1 | 2 | 4>(1);
  const [highlightDoubtfulLots, setHighlightDoubtfulLots] = useState<boolean>(true);
  const [lowConfidencePinMode, setLowConfidencePinMode] = useState<boolean>(false);
  const [showControlPointsOnPano, setShowControlPointsOnPano] = useState<boolean>(false);
  const [lastClickedPanoPos, setLastClickedPanoPos] = useState<{
    yawRad: number;
    pitchRad: number;
    yawDeg: number;
    pitchDeg: number;
  } | null>(null);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Transformación interactiva del Plano 2D (Pan & Zoom)
  const [planTransform, setPlanTransform] = useState({ zoom: 1.6, panX: 0, panY: 0 });
  const [isPlanPanning, setIsPlanPanning] = useState(false);
  const planDragStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);

  // Autoguardado local seguro (Fase A6)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveLocalPanoramaDraft({
        slug: "main",
        savedAt: new Date().toISOString(),
        version: versionCounter,
        config,
        overrides,
        controlPoints,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [config, overrides, controlPoints, versionCounter]);

  useEffect(() => {
    let active = true;

    async function loadFromSupabase() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("project_panoramas")
          .select("*")
          .eq("slug", "main")
          .limit(1)
          .maybeSingle();

        if (error || !data || !active) return;

        const draftCfg =
          data.draft_config && typeof data.draft_config === "object"
            ? (data.draft_config as Partial<PanoramaCameraConfig>)
            : null;

        setConfig((prev) => ({
          ...prev,
          camera: {
            ...prev.camera,
            lat: draftCfg?.camera?.lat ?? data.camera_lat ?? prev.camera.lat,
            lng: draftCfg?.camera?.lng ?? data.camera_lng ?? prev.camera.lng,
            heightAboveGroundM:
              draftCfg?.camera?.heightAboveGroundM ??
              data.height_above_ground_m ??
              prev.camera.heightAboveGroundM,
            offsetEastM:
              draftCfg?.camera?.offsetEastM ?? data.offset_east_m ?? prev.camera.offsetEastM ?? 0,
            offsetNorthM:
              draftCfg?.camera?.offsetNorthM ??
              data.offset_north_m ??
              prev.camera.offsetNorthM ??
              0,
          },
          yawOffsetDeg: draftCfg?.yawOffsetDeg ?? data.yaw_offset_deg ?? prev.yawOffsetDeg,
          tilt: {
            pitchDeg: draftCfg?.tilt?.pitchDeg ?? data.pitch_tilt_deg ?? prev.tilt.pitchDeg,
            rollDeg: draftCfg?.tilt?.rollDeg ?? data.roll_tilt_deg ?? prev.tilt.rollDeg,
          },
          limits: {
            ...prev.limits,
            minPitchDeg: data.min_pitch_deg ?? prev.limits.minPitchDeg,
            maxPitchDeg: data.max_pitch_deg ?? prev.limits.maxPitchDeg,
            defaultYawDeg: data.default_yaw_deg ?? prev.limits.defaultYawDeg,
            defaultPitchDeg: data.default_pitch_deg ?? prev.limits.defaultPitchDeg,
          },
          visualScale: draftCfg?.visualScale ?? prev.visualScale,
          terrainPatch: draftCfg?.terrainPatch ?? prev.terrainPatch,
          groundSlope: draftCfg?.groundSlope ?? prev.groundSlope,
        }));

        if (typeof data.version === "number") {
          setVersionCounter(data.version);
        }

        if (Array.isArray(data.version_history) && data.version_history.length > 0) {
          setVersionHistory(data.version_history as PanoramaVersionSnapshot[]);
        }

        if (Array.isArray(data.control_points) && data.control_points.length > 0) {
          setControlPoints(data.control_points as PanoramaControlPoint[]);
        }

        const remoteOverrides =
          data.draft_overrides && typeof data.draft_overrides === "object"
            ? (data.draft_overrides as PanoramaLotOverridesMap)
            : data.lot_overrides && typeof data.lot_overrides === "object"
              ? (data.lot_overrides as PanoramaLotOverridesMap)
              : null;

        if (remoteOverrides) {
          setOverrides((prev) => mergeOverridesSafe(remoteOverrides, prev));
        }
      } catch (err) {
        console.warn("No se pudo cargar la calibración de Supabase:", err);
      }
    }

    loadFromSupabase();

    return () => {
      active = false;
    };
  }, []);

  const projectedLots = useMemo((): ProjectedPanoramaLot[] => {
    return projectMasterplanLots(masterplanLots, config);
  }, [config]);

  const mergedLots = useMemo(
    () => mergePanoramaLotsWithOverrides(projectedLots, overrides),
    [projectedLots, overrides],
  );

  const selectedMergedLot = useMemo(
    () => mergedLots.find((l) => l.id === selectedLotId) ?? null,
    [mergedLots, selectedLotId],
  );

  // Fase A4: Confianza de lotes (>=20° del punto de control más cercano y !locked)
  const lotsConfidence = useMemo(
    () => computeLotsConfidence(mergedLots, controlPoints, overrides),
    [mergedLots, controlPoints, overrides],
  );

  const doubtfulLotIdsSet = useMemo(() => {
    const s = new Set<string>();
    for (const item of lotsConfidence) {
      if (item.isDoubtful) s.add(item.id);
    }
    return s;
  }, [lotsConfidence]);

  const doubtfulLotsList = useMemo(
    () => lotsConfidence.filter((c) => c.isDoubtful),
    [lotsConfidence],
  );

  // Fase A4: Cobertura 360° de puntos de control
  const yawCoverage = useMemo(() => computeControlPointYawCoverage(controlPoints), [controlPoints]);

  // Puntos de control con su error en grados y metros para dibujar sobre el 360
  const controlPointsOverlay = useMemo((): ControlPointOverlayItem[] | undefined => {
    if (!showControlPointsOnPano) return undefined;
    const evalRes = evaluateCalibration(config, controlPoints);
    return controlPoints.map((cp) => {
      const err = evalRes.pointErrorsDeg.find((e) => e.id === cp.id);
      return {
        id: cp.id,
        label: cp.label,
        yawRad: cp.panoRad[0],
        pitchRad: cp.panoRad[1],
        errorDeg: err?.angularErrorDeg,
        errorMeters: err?.errorMeters,
      };
    });
  }, [showControlPointsOnPano, config, controlPoints]);

  const availableManzanas = useMemo(() => {
    const set = new Set<string>();
    for (const l of masterplanLots) {
      if (l.manzana) set.add(l.manzana);
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });
  }, []);

  const activeManzana = useMemo(() => {
    if (selectedManzana) return selectedManzana;
    if (selectedMergedLot?.manzana) return selectedMergedLot.manzana;
    return availableManzanas[0] ?? "M 1";
  }, [selectedManzana, selectedMergedLot, availableManzanas]);

  const pieceHasOverrides = useMemo(() => {
    return selectedPieceLotIds.some((id) => Boolean(overrides[id]));
  }, [selectedPieceLotIds, overrides]);

  // Centrar el plano 2D en el lote seleccionado (Fase A4: Vista dividida sincronizada)
  const centerPlanOnLot = useCallback((lotId: string) => {
    const lot = masterplanLots.find((l) => l.id === lotId);
    if (!lot?.centroid) return;
    const [cx, cy] = lot.centroid;
    const baseCx = BASE_VIEWBOX.x + BASE_VIEWBOX.w / 2;
    const baseCy = BASE_VIEWBOX.y + BASE_VIEWBOX.h / 2;
    setPlanTransform((prev) => ({
      zoom: Math.max(prev.zoom, 2.5),
      panX: cx - baseCx,
      panY: cy - baseCy,
    }));
  }, []);

  const selectAndSyncLot = useCallback(
    (id: string) => {
      setSelectedLotId(id);
      const found = mergedLots.find((l) => l.id === id);
      if (found?.manzana) setSelectedManzana(found.manzana);
      if (!isPlanLocked) {
        centerPlanOnLot(id);
      }
    },
    [mergedLots, isPlanLocked, centerPlanOnLot],
  );

  const toggleLotInPiece = useCallback(
    (id: string) => {
      setSelectedPieceLotIds((prev) => {
        if (prev.includes(id)) {
          if (prev.length <= 1) return prev;
          return prev.filter((x) => x !== id);
        }
        return [...prev, id];
      });
      selectAndSyncLot(id);
    },
    [selectAndSyncLot],
  );

  // Selección con Shift+click para selección múltiple rápida (Fase A2)
  const handleSelectLotWithModifier = useCallback(
    (id: string, shiftKey: boolean) => {
      if (shiftKey) {
        setEditScope("piece");
        setSelectedPieceLotIds((prev) => {
          const base = editScope === "lot" ? [selectedLotId] : prev;
          if (base.includes(id)) {
            return base.length > 1 ? base.filter((x) => x !== id) : base;
          }
          return [...base, id];
        });
        selectAndSyncLot(id);
        return;
      }
      if (editScope === "piece") {
        toggleLotInPiece(id);
      } else {
        selectAndSyncLot(id);
      }
    },
    [editScope, selectedLotId, selectAndSyncLot, toggleLotInPiece],
  );

  // Seleccionar toda la manzana activa en 1 clic (Fase A2)
  const handleSelectEntireManzana = useCallback(() => {
    const targetMz = selectedMergedLot?.manzana ?? activeManzana;
    const ids = mergedLots.filter((l) => l.manzana === targetMz).map((l) => l.id);
    if (ids.length === 0) return;
    setSelectedManzana(targetMz);
    setSelectedPieceLotIds(ids);
    setEditScope("piece");
    setSaveMessage(`Seleccionada toda la manzana ${targetMz} (${ids.length} lotes).`);
  }, [selectedMergedLot, activeManzana, mergedLots]);

  // Ir al siguiente lote dudoso por revisar (Fase A4)
  const handleNextDoubtfulLot = useCallback(() => {
    if (doubtfulLotsList.length === 0) return;
    const curIdx = doubtfulLotsList.findIndex((d) => d.id === selectedLotId);
    const nextItem = doubtfulLotsList[(curIdx + 1) % doubtfulLotsList.length];
    if (nextItem) {
      setEditScope("lot");
      selectAndSyncLot(nextItem.id);
    }
  }, [doubtfulLotsList, selectedLotId, selectAndSyncLot]);

  // Bloquear / Validar visualmente el lote actual (tecla L o botón — Fase A1/A2/A4)
  const handleToggleLockSelectedLot = useCallback(() => {
    recordBeforeChange(`Validar/bloquear lote ${selectedLotId}`);
    setOverrides((prev) => {
      const existing = prev[selectedLotId];
      const nextLocked = !existing?.locked;
      return {
        ...prev,
        [selectedLotId]: {
          ...existing,
          verticesRad: existing?.verticesRad ?? selectedMergedLot?.verticesRad,
          locked: nextLocked,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, [recordBeforeChange, selectedLotId, selectedMergedLot]);

  const resetActivePiece = useCallback(() => {
    recordBeforeChange("Restablecer pedazo seleccionado");
    setOverrides((prev) => {
      const next = { ...prev };
      for (const id of selectedPieceLotIds) {
        delete next[id];
      }
      return next;
    });
  }, [recordBeforeChange, selectedPieceLotIds]);

  const resetSelectedLot = useCallback(() => {
    recordBeforeChange(`Restablecer lote ${selectedLotId}`);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedLotId];
      return next;
    });
  }, [recordBeforeChange, selectedLotId]);

  const selectedRawLot = useMemo(
    () => masterplanLots.find((l) => l.id === selectedLotId) ?? null,
    [selectedLotId],
  );

  const lotMetrics = useMemo(() => {
    if (!selectedRawLot) return null;

    const dx = (selectedRawLot.centroid[0] - ENTRANCE_SVG.x) * SVG_TO_METERS;
    const dy = (selectedRawLot.centroid[1] - ENTRANCE_SVG.y) * SVG_TO_METERS;
    const distFromEntranceM = Math.round(Math.hypot(dx, dy));

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/gi;
    let m: RegExpExecArray | null;
    if (selectedRawLot.pathD) {
      while ((m = re.exec(selectedRawLot.pathD)) !== null) {
        const px = parseFloat(m[2]);
        const py = parseFloat(m[3]);
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
    const widthM = Math.round((maxX - minX) * SVG_TO_METERS * 10) / 10;
    const depthM = Math.round((maxY - minY) * SVG_TO_METERS * 10) / 10;

    return {
      areaM2: selectedRawLot.areaM2,
      distFromEntranceM,
      approxFrontM: Math.min(widthM, depthM),
      approxDepthM: Math.max(widthM, depthM),
      walkingMinutes: Math.max(1, Math.round(distFromEntranceM / 70)),
    };
  }, [selectedRawLot]);

  // Delta acumulado del lote seleccionado para mostrar en pantalla (Fase A2)
  const selectedLotDeltaSummary = useMemo(() => {
    const ov = overrides[selectedLotId];
    const baseLot = projectedLots.find((l) => l.id === selectedLotId);
    if (!ov || !baseLot) return null;

    const dYawDeg =
      ov.delta?.dYawRad !== undefined
        ? (ov.delta.dYawRad * 180) / Math.PI
        : selectedMergedLot
          ? ((selectedMergedLot.labelRad[0] - baseLot.labelRad[0]) * 180) / Math.PI
          : 0;
    const dPitchDeg =
      ov.delta?.dPitchRad !== undefined
        ? (ov.delta.dPitchRad * 180) / Math.PI
        : selectedMergedLot
          ? ((selectedMergedLot.labelRad[1] - baseLot.labelRad[1]) * 180) / Math.PI
          : 0;
    const scale = ov.delta?.scale ?? 1;
    const scaleX = ov.delta?.scaleX ?? 1;
    const scaleY = ov.delta?.scaleY ?? 1;
    const offsetEastM = ov.delta?.offsetEastM ?? 0;
    const offsetNorthM = ov.delta?.offsetNorthM ?? 0;

    return {
      dYawDeg: Math.round(dYawDeg * 100) / 100,
      dPitchDeg: Math.round(dPitchDeg * 100) / 100,
      scalePct: Math.round(scale * 100),
      scaleXPct: Math.round(scaleX * 100),
      scaleYPct: Math.round(scaleY * 100),
      offsetEastM: Math.round(offsetEastM * 10) / 10,
      offsetNorthM: Math.round(offsetNorthM * 10) / 10,
      locked: Boolean(ov.locked),
    };
  }, [overrides, selectedLotId, projectedLots, selectedMergedLot]);

  const currentPlanViewBox = useMemo(() => {
    const w = BASE_VIEWBOX.w / planTransform.zoom;
    const h = BASE_VIEWBOX.h / planTransform.zoom;
    const cx = BASE_VIEWBOX.x + BASE_VIEWBOX.w / 2 + planTransform.panX;
    const cy = BASE_VIEWBOX.y + BASE_VIEWBOX.h / 2 + planTransform.panY;
    return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
  }, [planTransform]);

  const handlePlanMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0 || isPlanLocked) return;
    setIsPlanPanning(true);
    planDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: planTransform.panX,
      panY: planTransform.panY,
    };
  };

  const handlePlanMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPlanPanning || !planDragStartRef.current) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scale = BASE_VIEWBOX.w / planTransform.zoom / rect.width;
    const dx = (e.clientX - planDragStartRef.current.clientX) * scale;
    const dy = (e.clientY - planDragStartRef.current.clientY) * scale;
    setPlanTransform((prev) => ({
      ...prev,
      panX: planDragStartRef.current!.panX - dx,
      panY: planDragStartRef.current!.panY - dy,
    }));
  };

  const handlePlanMouseUp = () => {
    setIsPlanPanning(false);
    planDragStartRef.current = null;
  };

  const handlePlanWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setPlanTransform((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(10, prev.zoom * factor)),
    }));
  };

  // ==============================================================
  // TRANSFORMACIONES CON PERSPECTIVA REAL (Fase A2 + A3)
  // ==============================================================
  const moveDirectional = useCallback(
    (deltaYawDeg: number, deltaPitchDeg: number) => {
      recordBeforeChange("Mover lotes");
      if (editScope === "global") {
        setConfig((prev) => ({
          ...prev,
          yawOffsetDeg: Math.round((prev.yawOffsetDeg - deltaYawDeg) * 100) / 100,
          tilt: {
            ...prev.tilt,
            pitchDeg: Math.round((prev.tilt.pitchDeg + deltaPitchDeg) * 100) / 100,
          },
        }));
        return;
      }

      const targetIds = editScope === "piece" ? selectedPieceLotIds : [selectedLotId];
      if (targetIds.length === 0) return;

      setOverrides((prev) =>
        transformLotsWithPerspective({
          targetLotIds: targetIds,
          baseLots: projectedLots,
          currentOverrides: prev,
          config,
          dYawDeg: deltaYawDeg,
          dPitchDeg: deltaPitchDeg,
          usePerspectiveMeters,
        }),
      );
    },
    [
      recordBeforeChange,
      editScope,
      selectedPieceLotIds,
      selectedLotId,
      projectedLots,
      config,
      usePerspectiveMeters,
    ],
  );

  const scaleActiveTarget = useCallback(
    (factor: number, axis: "both" | "x" | "y" = "both") => {
      recordBeforeChange("Escalar lotes");
      if (editScope === "global") {
        setConfig((prev) => ({
          ...prev,
          camera: {
            ...prev.camera,
            heightAboveGroundM:
              Math.round(
                Math.max(20, Math.min(600, prev.camera.heightAboveGroundM * (1 / factor))) * 10,
              ) / 10,
          },
        }));
        return;
      }

      const targetIds = editScope === "piece" ? selectedPieceLotIds : [selectedLotId];
      if (targetIds.length === 0) return;

      setOverrides((prev) =>
        transformLotsWithPerspective({
          targetLotIds: targetIds,
          baseLots: projectedLots,
          currentOverrides: prev,
          config,
          scaleFactor: axis === "both" ? factor : 1,
          scaleXFactor: axis === "x" ? factor : 1,
          scaleYFactor: axis === "y" ? factor : 1,
          usePerspectiveMeters,
        }),
      );
    },
    [
      recordBeforeChange,
      editScope,
      selectedPieceLotIds,
      selectedLotId,
      projectedLots,
      config,
      usePerspectiveMeters,
    ],
  );

  const rotateActiveTarget = useCallback(
    (deg: number) => {
      recordBeforeChange("Rotar lotes");
      if (editScope === "global") {
        setConfig((prev) => ({
          ...prev,
          yawOffsetDeg: Math.round((prev.yawOffsetDeg + deg) * 100) / 100,
        }));
        return;
      }

      const targetIds = editScope === "piece" ? selectedPieceLotIds : [selectedLotId];
      if (targetIds.length === 0) return;

      setOverrides((prev) =>
        transformLotsWithPerspective({
          targetLotIds: targetIds,
          baseLots: projectedLots,
          currentOverrides: prev,
          config,
          rotateDeg: deg,
          usePerspectiveMeters,
        }),
      );
    },
    [
      recordBeforeChange,
      editScope,
      selectedPieceLotIds,
      selectedLotId,
      projectedLots,
      config,
      usePerspectiveMeters,
    ],
  );

  // Mover un vértice individual con Snap opcional de vecinos (Fase A2)
  const handleMoveVertex = useCallback(
    (lotId: string, vertexIndex: number, newYawRad: number, newPitchRad: number) => {
      setOverrides((prev) =>
        moveLotVertexWithSnap({
          lotId,
          vertexIndex,
          newYawRad,
          newPitchRad,
          baseLots: projectedLots,
          currentOverrides: prev,
          enableSnap: snapSharedVertices,
        }),
      );
    },
    [projectedLots, snapSharedVertices],
  );

  // Atajos de teclado completos (Fase A2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y: Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      const step = e.shiftKey ? 0.5 : e.altKey ? 0.05 : nudgeStep;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveDirectional(0, step);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveDirectional(0, -step);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveDirectional(step, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveDirectional(-step, 0);
      } else if (e.key === "[" || e.key === "{") {
        e.preventDefault();
        rotateActiveTarget(-0.5);
      } else if (e.key === "]" || e.key === "}" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        rotateActiveTarget(e.shiftKey ? -0.5 : 0.5);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        scaleActiveTarget(1.05);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        scaleActiveTarget(0.95);
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        handleToggleLockSelectedLot();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditScope("lot");
        setLoupeZoom(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    moveDirectional,
    rotateActiveTarget,
    scaleActiveTarget,
    handleUndo,
    handleRedo,
    handleToggleLockSelectedLot,
    nudgeStep,
  ]);

  const extraMarkers = useMemo((): MarkerConfig[] => [], []);

  // Guardado Seguro: Borrador (`draft`) vs Publicación (`published`) con Merge Seguro e Historial (Fase A6)
  const handlePersistPanorama = async (mode: "draft" | "published") => {
    const nextVersion = versionCounter + 1;
    setVersionCounter(nextVersion);

    const nextHistory = appendVersionSnapshot(
      versionHistory,
      {
        version: nextVersion,
        status: mode,
        config,
        overrides,
        controlPoints,
        note: mode === "published" ? "Publicación oficial" : "Borrador guardado",
      },
      "main",
    );
    setVersionHistory(nextHistory);

    saveLocalPanoramaDraft({
      slug: "main",
      savedAt: new Date().toISOString(),
      version: nextVersion,
      config,
      overrides,
      controlPoints,
    });

    if (!supabase) {
      setSaveMessage(
        mode === "published"
          ? "Guardado localmente (Supabase no conectado en este entorno)."
          : "Borrador guardado en navegador.",
      );
      return;
    }

    setIsSavingDb(true);
    setSaveMessage(null);
    try {
      const { data: projectRow } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", "villa-paraiso")
        .maybeSingle();

      if (!projectRow?.id) {
        setSaveMessage("Borrador guardado localmente (Proyecto no hallado en BD).");
        return;
      }

      const { data: existingRow } = await supabase
        .from("project_panoramas")
        .select("lot_overrides")
        .eq("project_id", projectRow.id)
        .eq("slug", "main")
        .maybeSingle();

      // Merge seguro: nunca pisa ni borra lotes editados en otra sesión
      const remoteOverrides = (existingRow?.lot_overrides ?? {}) as PanoramaLotOverridesMap;
      const safeMergedOverrides = mergeOverridesSafe(remoteOverrides, overrides);
      setOverrides(safeMergedOverrides);

      const basePayload: Record<string, unknown> = {
        project_id: projectRow.id,
        slug: "main",
        label: "Localización 360°",
        enabled: true,
        desktop_image_path: "/panoramas/villa-paraiso/pano-8192.v1.webp",
        mobile_image_path: "/panoramas/villa-paraiso/pano-4096.v1.webp",
        preview_image_path: "/panoramas/villa-paraiso/pano-preview.v1.webp",
        full_width: config.panoDataDesktop.fullWidth,
        full_height: config.panoDataDesktop.fullHeight,
        cropped_width: config.panoDataDesktop.croppedWidth,
        cropped_height: config.panoDataDesktop.croppedHeight,
        cropped_x: config.panoDataDesktop.croppedX,
        cropped_y: config.panoDataDesktop.croppedY,
        camera_lat: config.camera.lat,
        camera_lng: config.camera.lng,
        height_above_ground_m: config.camera.heightAboveGroundM,
        offset_east_m: config.camera.offsetEastM ?? 0,
        offset_north_m: config.camera.offsetNorthM ?? 0,
        yaw_offset_deg: config.yawOffsetDeg,
        pitch_tilt_deg: config.tilt.pitchDeg,
        roll_tilt_deg: config.tilt.rollDeg,
        min_pitch_deg: config.limits.minPitchDeg,
        max_pitch_deg: config.limits.maxPitchDeg,
        default_yaw_deg: config.limits.defaultYawDeg,
        default_pitch_deg: config.limits.defaultPitchDeg,
        control_points: controlPoints,
      };

      if (mode === "published") {
        basePayload.lot_overrides = safeMergedOverrides;
      }

      // Intentar guardar con columnas nuevas de versionado/borrador; si la migración aún no se aplicó en BD, hacer fallback limpio
      const extendedPayload = {
        ...basePayload,
        version: nextVersion,
        draft_config: config,
        draft_overrides: safeMergedOverrides,
        version_history: nextHistory,
        ...(mode === "published"
          ? {
              published_config: config,
              published_overrides: safeMergedOverrides,
            }
          : {}),
      };

      let { error } = await supabase
        .from("project_panoramas")
        .upsert(extendedPayload, { onConflict: "project_id,slug" });

      if (error) {
        // Fallback compatible con esquema previo si las columnas aditivas aún no se han corrido
        const fallbackPayload = {
          ...basePayload,
          lot_overrides: safeMergedOverrides,
        };
        const retry = await supabase
          .from("project_panoramas")
          .upsert(fallbackPayload, { onConflict: "project_id,slug" });
        error = retry.error;
      }

      setSaveMessage(
        error
          ? `Guardado local OK · Aviso BD: ${error.message}`
          : mode === "published"
            ? `Publicado con éxito (v${nextVersion} · ${Object.keys(safeMergedOverrides).length} lotes ajustados).`
            : `Borrador v${nextVersion} guardado con éxito.`,
      );
    } catch (err) {
      setSaveMessage(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
    } finally {
      setIsSavingDb(false);
    }
  };

  // Abrir vista previa pública con el borrador (Fase A6)
  const handleOpenPublicPreview = () => {
    saveLocalPanoramaDraft({
      slug: "main",
      savedAt: new Date().toISOString(),
      version: versionCounter,
      config,
      overrides,
      controlPoints,
    });
    setPreviewDraftEnabled("main", true);
    window.open("/proyecto/villa-paraiso?tab=360&previewDraft=1", "_blank", "noopener,noreferrer");
  };

  // Importar JSON de respaldo (Fase A6)
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        recordBeforeChange("Importar archivo JSON");
        if (parsed.config && typeof parsed.config === "object") {
          setConfig(parsed.config as PanoramaCameraConfig);
        }
        if (Array.isArray(parsed.controlPoints)) {
          setControlPoints(parsed.controlPoints as PanoramaControlPoint[]);
        }
        if (parsed.overrides && typeof parsed.overrides === "object") {
          setOverrides((prev) =>
            mergeOverridesSafe(prev, parsed.overrides as PanoramaLotOverridesMap),
          );
        } else if (!parsed.config && !parsed.lots && typeof parsed === "object") {
          setOverrides((prev) => mergeOverridesSafe(prev, parsed as PanoramaLotOverridesMap));
        }
        setSaveMessage("Archivo JSON importado y fusionado con éxito.");
      } catch {
        setSaveMessage("Error: El archivo JSON no tiene un formato válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const overriddenLotsCount = Object.keys(overrides).length;
  const lockedLotsCount = Object.values(overrides).filter((o) => o?.locked).length;

  const heightClass =
    workspaceHeight === "full"
      ? "h-[calc(100vh-210px)] min-h-[580px]"
      : workspaceHeight === "tall"
        ? "h-[680px] xl:h-[740px]"
        : "h-[500px] lg:h-[560px]";

  return (
    <div className="space-y-3 p-3 lg:p-4">
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportJsonFile}
      />

      {/* ========================================================= */}
      {/* 1. BARRA SUPERIOR: ESTADO, DESHACER/REHACER, DUDOSOS Y PUBLICACIÓN */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border bg-card px-4 py-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-sm sm:text-base font-semibold tracking-tight">Calibrador 360°</h1>
          <Badge variant="secondary" className="font-medium text-xs">
            {masterplanLots.length} lotes
          </Badge>
          {overriddenLotsCount > 0 && (
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              {overriddenLotsCount} ajustados · {lockedLotsCount} validados
            </Badge>
          )}
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            {doubtfulLotsList.length} por revisar
          </Badge>
          {doubtfulLotsList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 cursor-pointer"
              onClick={handleNextDoubtfulLot}
              title="Saltar al siguiente lote a más de 20° del punto de control más cercano sin validar"
            >
              Siguiente por revisar
            </Button>
          )}
        </div>

        {/* Selector de Modos de Vista */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
          <Button
            variant={viewLayout === "pano" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3 font-medium cursor-pointer"
            onClick={() => setViewLayout("pano")}
          >
            Vista 360°
          </Button>
          <Button
            variant={viewLayout === "split" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3 font-medium cursor-pointer"
            onClick={() => setViewLayout("split")}
          >
            Dividido 50/50
          </Button>
          <Button
            variant={viewLayout === "plan" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3 font-medium cursor-pointer"
            onClick={() => setViewLayout("plan")}
          >
            Plano 2D
          </Button>
        </div>

        {/* Deshacer/Rehacer + Borrador / Publicar / Importar / Exportar (Fase A2 + A6) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs cursor-pointer"
              disabled={!canUndo}
              onClick={handleUndo}
              title={`Deshacer (Ctrl+Z) · ${undoCount} pasos`}
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs cursor-pointer"
              disabled={!canRedo}
              onClick={handleRedo}
              title={`Rehacer (Ctrl+Shift+Z) · ${redoCount} pasos`}
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() =>
              setWorkspaceHeight((h) => (h === "tall" ? "full" : h === "full" ? "normal" : "tall"))
            }
            title="Expandir área de trabajo"
          >
            <Maximize2 className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={() => importFileInputRef.current?.click()}
            title="Importar JSON de calibración u overrides"
          >
            <Upload className="mr-1 size-3.5" />
            Importar
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={() =>
              downloadJsonFile("villa-paraiso-panorama-calibration.json", {
                projectSlug: "villa-paraiso",
                version: versionCounter,
                generatedAt: new Date().toISOString(),
                config,
                controlPoints,
                overrides,
                lots: mergedLots,
              })
            }
            title="Exportar respaldo JSON completo (config + puntos + overrides)"
          >
            <Download className="mr-1 size-3.5" />
            Exportar
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={handleOpenPublicPreview}
            title="Abrir vista de usuario con el borrador actual"
          >
            <ExternalLink className="mr-1 size-3.5" />
            Vista previa pública
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs font-medium cursor-pointer"
            onClick={() => handlePersistPanorama("draft")}
            disabled={isSavingDb}
            title="Guardar borrador sin modificar aún la vista pública"
          >
            <Save className="mr-1 size-3.5" />
            Guardar borrador
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs font-medium cursor-pointer"
            onClick={() => handlePersistPanorama("published")}
            disabled={isSavingDb}
            title="Publicar cambios al visor 360° público"
          >
            <Send className="mr-1.5 size-3.5" />
            {isSavingDb ? "Publicando…" : "Publicar"}
          </Button>
        </div>
      </div>

      {/* Barra de ayudas de alineación exacta (Fase A4: Opacidad, Contorno, Lupa, Vértices, Snap, Perspectiva) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/20 px-3.5 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Opacidad del overlay 0–100 % */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Opacidad:</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(overlayOpacity * 100)}
              onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
              className="w-20 accent-foreground cursor-pointer"
            />
            <span className="font-mono w-9">{Math.round(overlayOpacity * 100)}%</span>
          </div>

          {/* Modo solo contorno */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={outlineOnly}
              onChange={(e) => setOutlineOnly(e.target.checked)}
              className="rounded border-border"
            />
            <span>Modo contorno</span>
          </label>

          {/* Handles de vértices individuales */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={editableVertices}
              onChange={(e) => setEditableVertices(e.target.checked)}
              className="rounded border-border"
            />
            <span>Editar vértices</span>
          </label>

          {/* Snap de vértices compartidos */}
          <label
            className="flex items-center gap-1.5 cursor-pointer select-none font-medium"
            title="Imantar vértices compartidos entre lotes vecinos para evitar huecos o solapes"
          >
            <input
              type="checkbox"
              checked={snapSharedVertices}
              onChange={(e) => setSnapSharedVertices(e.target.checked)}
              className="rounded border-border"
            />
            <span>Snap vecinos</span>
          </label>

          {/* Resaltar dudosos */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={highlightDoubtfulLots}
              onChange={(e) => setHighlightDoubtfulLots(e.target.checked)}
              className="rounded border-border"
            />
            <span>Resaltar dudosos</span>
          </label>

          {/* Pin + contorno punteado en baja confianza (Fase B3) */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={lowConfidencePinMode}
              onChange={(e) => setLowConfidencePinMode(e.target.checked)}
              className="rounded border-border"
            />
            <span>Pin en baja confianza</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Lupa ×2 / ×4 (Fase A4) */}
          <div className="flex items-center gap-1 rounded-lg border bg-background/80 p-0.5">
            <span className="pl-1.5 text-[11px] font-medium text-muted-foreground pr-1">Lupa:</span>
            {([1, 2, 4] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setLoupeZoom(z)}
                className={`rounded px-2 py-0.5 text-[11px] font-mono font-medium cursor-pointer ${
                  loupeZoom === z
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {z === 1 ? "Off" : `×${z}`}
              </button>
            ))}
          </div>

          {/* Perspectiva Real (metros CAD) vs Ángulos en pantalla (Fase A3) */}
          <div className="flex items-center gap-1 rounded-lg border bg-background/80 p-0.5">
            <button
              type="button"
              onClick={() => setUsePerspectiveMeters(true)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                usePerspectiveMeters
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Mover, escalar y rotar sobre el plano del suelo (metros CAD) respetando la perspectiva real"
            >
              Perspectiva 3D (m)
            </button>
            <button
              type="button"
              onClick={() => setUsePerspectiveMeters(false)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                !usePerspectiveMeters
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Ajuste lineal directo en ángulos de pantalla (yaw, pitch)"
            >
              Pantalla (°)
            </button>
          </div>
        </div>
      </div>

      {/* Recuperación opcional de borrador autoguardado */}
      {recoverableDraft && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs">
          <span>
            Existe un borrador autoguardado localmente (
            {new Date(recoverableDraft.savedAt).toLocaleString()}).
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs cursor-pointer"
              onClick={() => {
                recordBeforeChange("Cargar borrador local");
                setConfig(recoverableDraft.config);
                setOverrides((prev) => mergeOverridesSafe(prev, recoverableDraft.overrides));
                setControlPoints(recoverableDraft.controlPoints);
                setRecoverableDraft(null);
              }}
            >
              Cargar borrador
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs cursor-pointer"
              onClick={() => setRecoverableDraft(null)}
            >
              Ocultar
            </Button>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveMessage(null)}
            className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ÁREA DEL VISOR (VISTA 360° A LA IZQUIERDA + PLANO 2D A LA DERECHA EN 50/50) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 items-start">
        {/* VISTA 360° */}
        {(viewLayout === "split" || viewLayout === "pano") && (
          <Card
            className={`${
              viewLayout === "pano" ? "xl:col-span-12" : "xl:col-span-7"
            } overflow-hidden rounded-2xl border shadow-sm flex flex-col relative`}
          >
            <CardContent className={`p-0 ${heightClass} relative overflow-hidden`}>
              <Suspense
                fallback={
                  <div className="size-full grid place-items-center bg-[#121811] text-xs text-white/80">
                    Cargando Calibrador 360°…
                  </div>
                }
              >
                <PanoramaViewer
                  projectName="Villa Paraíso"
                  cameraConfig={config}
                  projectedLots={projectedLots}
                  overrides={overrides}
                  selectedLotId={selectedLotId}
                  highlightLotIds={
                    editScope === "piece"
                      ? selectedPieceLotIds
                      : editScope === "lot"
                        ? [selectedLotId]
                        : undefined
                  }
                  selectedPieceIds={selectedPieceLotIds}
                  editScope={editScope}
                  onSelectLot={selectAndSyncLot}
                  onSelectLotWithModifier={handleSelectLotWithModifier}
                  onPanoramaClick={(pos) => setLastClickedPanoPos(pos)}
                  extraMarkers={extraMarkers}
                  dragMode={panoDragMode}
                  onHandDrag={(dYaw: number, dPitch: number) => moveDirectional(dYaw, dPitch)}
                  overlayOpacity={overlayOpacity}
                  outlineOnly={outlineOnly}
                  doubtfulLotIds={doubtfulLotIdsSet}
                  highlightDoubtfulLots={highlightDoubtfulLots}
                  lowConfidencePinMode={lowConfidencePinMode}
                  editableVertices={editableVertices && editScope === "lot"}
                  onVertexDragStart={() => recordBeforeChange(`Mover vértice de ${selectedLotId}`)}
                  onMoveVertex={handleMoveVertex}
                  controlPointsOverlay={controlPointsOverlay}
                  loupeZoom={loupeZoom}
                />
              </Suspense>

              {/* HUD FLOTANTE EN LA FOTO 360 */}
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] w-fit select-none"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="rounded-xl border border-border/80 bg-background/95 backdrop-blur-xl p-1.5 shadow-lg text-foreground flex flex-wrap items-center justify-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg">
                    <Button
                      variant={panoDragMode === "hand" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                      onClick={() => setPanoDragMode("hand")}
                    >
                      Mano
                    </Button>
                    <Button
                      variant={panoDragMode === "orbit" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                      onClick={() => setPanoDragMode("orbit")}
                    >
                      Girar
                    </Button>
                  </div>

                  <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg">
                    <Button
                      variant={editScope === "global" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                      onClick={() => setEditScope("global")}
                    >
                      Global
                    </Button>
                    <Button
                      variant={editScope === "piece" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                      onClick={() => setEditScope("piece")}
                    >
                      Grupo ({selectedPieceLotIds.length})
                    </Button>
                    <Button
                      variant={editScope === "lot" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                      onClick={() => setEditScope("lot")}
                    >
                      Lote ({selectedLotId})
                    </Button>
                  </div>

                  {/* D-Pad de movimiento */}
                  <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-md cursor-pointer"
                      onClick={() => moveDirectional(nudgeStep, 0)}
                      title="Mover Izquierda"
                    >
                      <ArrowLeft className="size-3.5" />
                    </Button>
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-md cursor-pointer"
                        onClick={() => moveDirectional(0, nudgeStep)}
                        title="Mover Arriba"
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-md cursor-pointer"
                        onClick={() => moveDirectional(0, -nudgeStep)}
                        title="Mover Abajo"
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-md cursor-pointer"
                      onClick={() => moveDirectional(-nudgeStep, 0)}
                      title="Mover Derecha"
                    >
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>

                  {/* Escala +5% / -5% y Rotación (Fase A2) */}
                  <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] font-mono cursor-pointer"
                      onClick={() => scaleActiveTarget(0.95)}
                      title="Achicar −5%"
                    >
                      −5%
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] font-mono cursor-pointer"
                      onClick={() => scaleActiveTarget(1.05)}
                      title="Agrandar +5%"
                    >
                      +5%
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-md cursor-pointer"
                      onClick={() => rotateActiveTarget(-0.5)}
                      title="Rotar antihorario"
                    >
                      <RotateCcw className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-md cursor-pointer"
                      onClick={() => rotateActiveTarget(0.5)}
                      title="Rotar horario (Tecla R)"
                    >
                      <RotateCw className="size-3" />
                    </Button>
                  </div>

                  {/* Selector de paso: 0.05° / 0.2° / 0.5° (Fase A2) */}
                  <div className="hidden sm:flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg text-[10px]">
                    {[0.05, 0.2, 0.5].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setNudgeStep(st);
                          setNumericMoveInput(String(st));
                        }}
                        className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${
                          nudgeStep === st
                            ? "bg-foreground text-background font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {st}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PLANO 2D SINCRONIZADO */}
        {(viewLayout === "split" || viewLayout === "plan") && (
          <Card
            className={`${
              viewLayout === "plan" ? "xl:col-span-12" : "xl:col-span-5"
            } overflow-hidden rounded-2xl border shadow-sm flex flex-col`}
          >
            <CardHeader className="py-2 px-3 border-b flex-row items-center justify-between space-y-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Plano 2D Sincronizado
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {selectedLotId}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 cursor-pointer"
                  onClick={handleSelectEntireManzana}
                  title="Seleccionar todos los lotes de esta manzana para mover/escalar en bloque"
                >
                  Toda la manzana ({selectedMergedLot?.manzana ?? activeManzana})
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg cursor-pointer"
                  onClick={() =>
                    setPlanTransform((prev) => ({ ...prev, zoom: Math.min(10, prev.zoom * 1.3) }))
                  }
                  title="Acercar"
                >
                  <ZoomIn className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg cursor-pointer"
                  onClick={() =>
                    setPlanTransform((prev) => ({
                      ...prev,
                      zoom: Math.max(0.5, prev.zoom * 0.77),
                    }))
                  }
                  title="Alejar"
                >
                  <ZoomOut className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg cursor-pointer text-accent hover:text-accent"
                  onClick={() => centerPlanOnLot(selectedLotId)}
                  title="Centrar en el lote"
                >
                  <Focus className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-lg cursor-pointer"
                  onClick={() => setPlanTransform({ zoom: 1, panX: 0, panY: 0 })}
                  title="Restablecer"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
                <Button
                  variant={isPlanLocked ? "secondary" : "ghost"}
                  size="icon"
                  className="size-7 rounded-lg cursor-pointer"
                  onClick={() => setIsPlanLocked((l) => !l)}
                  title={isPlanLocked ? "Plano fijado" : "Auto-centrar al seleccionar"}
                >
                  {isPlanLocked ? (
                    <Lock className="size-3.5 text-amber-500" />
                  ) : (
                    <Unlock className="size-3.5" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent
              className={`p-0 bg-[#121614] ${heightClass} relative overflow-hidden select-none`}
            >
              <svg
                viewBox={currentPlanViewBox}
                className={`size-full ${isPlanPanning ? "cursor-grabbing" : "cursor-grab"}`}
                onMouseDown={handlePlanMouseDown}
                onMouseMove={handlePlanMouseMove}
                onMouseUp={handlePlanMouseUp}
                onMouseLeave={handlePlanMouseUp}
                onWheel={handlePlanWheel}
              >
                {masterplanLayers.waterAreas.map((d, idx) => (
                  <path
                    key={`w-${idx}`}
                    d={d}
                    fill="#0284c7"
                    fillOpacity={0.65}
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                  />
                ))}
                {masterplanLayers.islands.map((d, idx) => (
                  <path key={`i-${idx}`} d={d} fill="#15803d" stroke="#4ade80" strokeWidth={2} />
                ))}
                {masterplanLayers.calzadas.map((d, idx) => (
                  <path
                    key={`r-${idx}`}
                    d={d}
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={2}
                  />
                ))}
                {masterplanLots.map((lot) => {
                  const isSelected = lot.id === selectedLotId;
                  const isInGroup = editScope === "piece" && selectedPieceLotIds.includes(lot.id);
                  const ov = overrides[lot.id];
                  const isDoubtful = doubtfulLotIdsSet.has(lot.id);
                  return (
                    <path
                      key={lot.id}
                      d={lot.pathD}
                      fill={
                        isSelected
                          ? "rgba(250,204,21,0.88)"
                          : isInGroup
                            ? "rgba(251,191,36,0.55)"
                            : ov?.locked
                              ? "rgba(16,185,129,0.55)"
                              : ov
                                ? "rgba(56,189,248,0.45)"
                                : isDoubtful
                                  ? "rgba(245,158,11,0.28)"
                                  : "rgba(16,185,129,0.22)"
                      }
                      stroke={
                        isSelected
                          ? "#fef08a"
                          : isInGroup
                            ? "#fbbf24"
                            : ov
                              ? "#38bdf8"
                              : isDoubtful
                                ? "rgba(251,191,36,0.8)"
                                : "rgba(255,255,255,0.6)"
                      }
                      strokeWidth={isSelected ? 4 : isInGroup ? 2.5 : 1.4}
                      strokeDasharray={isDoubtful && !isSelected ? "4 3" : undefined}
                      className="cursor-pointer hover:fill-amber-400/60 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLotWithModifier(lot.id, e.shiftKey);
                      }}
                    />
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. DOCK INFERIOR DE PRECISIÓN: DELTAS ACUMULADOS, ESCALA X/Y Y CONTROLES */}
      {/* ========================================================= */}
      <div className="rounded-xl border bg-card p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* A. Selector de Lote + Estado Validado + Delta Acumulado + Restablecer este lote (Fase A2) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Lote activo:</span>
          <select
            value={selectedLotId}
            onChange={(e) => selectAndSyncLot(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold cursor-pointer"
          >
            {masterplanLots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} ({l.manzana ?? "Mz"})
                {overrides[l.id]?.locked
                  ? " ✓"
                  : overrides[l.id]
                    ? " ★"
                    : doubtfulLotIdsSet.has(l.id)
                      ? " ⚠"
                      : ""}
              </option>
            ))}
          </select>

          <Button
            variant={overrides[selectedLotId]?.locked ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={handleToggleLockSelectedLot}
            title="Marcar este lote como validado visualmente (Atajo: tecla L)"
          >
            {overrides[selectedLotId]?.locked ? (
              <>
                <Lock className="mr-1 size-3" />
                Validado
              </>
            ) : (
              <>
                <Unlock className="mr-1 size-3" />
                Validar (L)
              </>
            )}
          </Button>

          {selectedLotDeltaSummary && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-[11px] font-mono">
              <span>Δyaw: {selectedLotDeltaSummary.dYawDeg}°</span>
              <span>·</span>
              <span>Δpitch: {selectedLotDeltaSummary.dPitchDeg}°</span>
              <span>·</span>
              <span>
                Escala: {selectedLotDeltaSummary.scalePct}% (X:{selectedLotDeltaSummary.scaleXPct}%
                / Y:{selectedLotDeltaSummary.scaleYPct}%)
              </span>
              {(selectedLotDeltaSummary.offsetEastM !== 0 ||
                selectedLotDeltaSummary.offsetNorthM !== 0) && (
                <>
                  <span>·</span>
                  <span>
                    ΔE:{selectedLotDeltaSummary.offsetEastM}m ΔN:
                    {selectedLotDeltaSummary.offsetNorthM}m
                  </span>
                </>
              )}
            </div>
          )}

          {overrides[selectedLotId] && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs cursor-pointer"
              onClick={resetSelectedLot}
              title="Restablecer este lote a la proyección original"
            >
              <RefreshCw className="mr-1.5 size-3" />
              Restablecer este lote
            </Button>
          )}
        </div>

        {/* B. Escala Uniforme y Escala por Ejes X / Y + Entrada numérica (Fase A2 + B1) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 p-1.5 rounded-lg border">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1">
            Tamaño:
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs font-mono cursor-pointer"
            onClick={() => scaleActiveTarget(0.95, "both")}
            title="Achicar −5% uniforme"
          >
            −5%
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs font-mono cursor-pointer"
            onClick={() => scaleActiveTarget(1.05, "both")}
            title="Agrandar +5% uniforme"
          >
            +5%
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          <span className="text-[10px] font-medium text-muted-foreground">Ancho X:</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded cursor-pointer"
            onClick={() => scaleActiveTarget(0.95, "x")}
            title="Achicar ancho horizontal (Eje X −5%)"
          >
            <Minus className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded cursor-pointer"
            onClick={() => scaleActiveTarget(1.05, "x")}
            title="Agrandar ancho horizontal (Eje X +5%)"
          >
            <Plus className="size-3" />
          </Button>

          <span className="text-[10px] font-medium text-muted-foreground ml-1">Fondo Y:</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded cursor-pointer"
            onClick={() => scaleActiveTarget(0.95, "y")}
            title="Achicar alto/profundidad vertical (Eje Y −5%)"
          >
            <Minus className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded cursor-pointer"
            onClick={() => scaleActiveTarget(1.05, "y")}
            title="Agrandar alto/profundidad vertical (Eje Y +5%)"
          >
            <Plus className="size-3" />
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Entrada numérica de paso fino (°) */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Paso (°):</span>
            <Input
              type="number"
              step="0.05"
              min="0.01"
              max="5"
              value={numericMoveInput}
              onChange={(e) => {
                setNumericMoveInput(e.target.value);
                const val = parseFloat(e.target.value);
                if (Number.isFinite(val) && val > 0) setNudgeStep(val);
              }}
              className="h-7 w-16 text-xs font-mono px-1.5"
            />
          </div>
        </div>

        {/* C. Métricas CAD y panel avanzado de puntos de control */}
        <div className="flex items-center gap-2">
          {lotMetrics && (
            <div className="hidden 2xl:flex items-center gap-2 font-mono text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border">
              <span className="text-foreground font-semibold">{lotMetrics.areaM2} m²</span>
              <span>·</span>
              <span>
                ~{lotMetrics.approxFrontM}m × {lotMetrics.approxDepthM}m
              </span>
              <span>·</span>
              <span className="text-foreground">{lotMetrics.distFromEntranceM}m portería</span>
            </div>
          )}

          {editScope === "piece" && pieceHasOverrides && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs cursor-pointer"
              onClick={resetActivePiece}
            >
              <RefreshCw className="mr-1 size-3" />
              Reset Grupo
            </Button>
          )}

          <Button
            variant={showAdvancedPanel ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={() => setShowAdvancedPanel((v) => !v)}
            title="Abrir panel de puntos de control, cobertura 360°, parche SO e historial de versiones"
          >
            <Sliders className="mr-1.5 size-3.5" />
            Puntos de Control & Versiones
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PANEL DE PUNTOS DE CONTROL, COBERTURA 360°, PARCHE SO E HISTORIAL */}
      {/* ========================================================= */}
      {showAdvancedPanel && (
        <CalibrationDiagnosticsPanel
          config={config}
          controlPoints={controlPoints}
          coverage={yawCoverage}
          versionHistory={versionHistory}
          showControlPointsOnPano={showControlPointsOnPano}
          onToggleControlPointsOnPano={setShowControlPointsOnPano}
          onApplyConfig={(nextCfg, desc) => {
            recordBeforeChange(desc);
            setConfig(nextCfg);
          }}
          onUpdateControlPoints={(nextPts, desc) => {
            recordBeforeChange(desc);
            setControlPoints(nextPts);
          }}
          onRestoreVersion={(snap) => {
            recordBeforeChange(`Restaurar versión v${snap.version}`);
            setConfig(snap.config);
            setOverrides(snap.overrides);
            setControlPoints(snap.controlPoints);
            setSaveMessage(`Versión v${snap.version} (${snap.status}) restaurada.`);
          }}
          lastClickedPanoPos={lastClickedPanoPos}
        />
      )}
    </div>
  );
}
