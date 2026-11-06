import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Download,
  Focus,
  Footprints,
  Globe,
  Hand,
  Layers,
  Lock,
  Maximize2,
  Minus,
  Move,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Ruler,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Unlock,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MarkerConfig } from "@photo-sphere-viewer/markers-plugin";
import PanoramaViewer from "@/components/project-view/panorama/PanoramaViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import rawLots from "@/data/villa-paraiso/lots.json";
import rawLayers from "@/data/villa-paraiso/layers.json";
import rawPanoramaLotsData from "@/data/villa-paraiso/generated/panorama-lots.json";
import rawPanoramaOverrides from "@/data/villa-paraiso/panorama-overrides.json";
import { svgToGpsViaCad } from "@/features/terrain-navigation/cad-gps";
import {
  calibratePanoramaCamera,
  evaluateCalibration,
  mergePanoramaLotsWithOverrides,
  projectGpsPointToPanoramaRad,
  projectMasterplanLots,
  radToDegPair,
  roundRad,
  type PanoramaCameraConfig,
  type PanoramaControlPoint,
  type PanoramaLotOverridesMap,
  type PanoramaLotsData,
  type ProjectedPanoramaLot,
} from "@/features/panorama-360";
import { supabase } from "@/lib/supabase";

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
const SVG_TO_METERS = 0.33273; // 1 / 3.005433 (Escala matemática oficial CAD / SVG)
const ENTRANCE_SVG = { x: 1014.7, y: 2148.5 }; // Acceso Principal / Portería

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

  // Modos de vista y tamaño de área de trabajo
  const [viewLayout, setViewLayout] = useState<"split" | "pano" | "plan">("pano");
  const [workspaceHeight, setWorkspaceHeight] = useState<"normal" | "tall" | "full">("tall");

  // Modo de interacción: arrastrar con mano (foto fija) o girar cámara
  const [panoDragMode, setPanoDragMode] = useState<"orbit" | "hand">("hand");
  const [editScope, setEditScope] = useState<"global" | "piece" | "lot">("global");
  const [selectedLotId, setSelectedLotId] = useState<string>("L-03");
  const [selectedPieceLotIds, setSelectedPieceLotIds] = useState<string[]>([
    "L-01",
    "L-02",
    "L-03",
    "L-04",
  ]);
  const [selectedManzana, setSelectedManzana] = useState<string>("M 1");
  const [nudgeStep, setNudgeStep] = useState<number>(0.5);
  const [isPlanLocked, setIsPlanLocked] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);

  const [selectedControlPointId, setSelectedControlPointId] = useState<string | null>(
    () => initialPanoramaData.controlPoints?.[0]?.id ?? null,
  );
  const [fitDroneOffset, setFitDroneOffset] = useState<boolean>(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);

  // Transformación interactiva del Plano 2D (Pan & Zoom)
  const [planTransform, setPlanTransform] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [isPlanPanning, setIsPlanPanning] = useState(false);
  const planDragStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);

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

        setConfig((prev) => ({
          ...prev,
          camera: {
            ...prev.camera,
            lat: data.camera_lat ?? prev.camera.lat,
            lng: data.camera_lng ?? prev.camera.lng,
            heightAboveGroundM: data.height_above_ground_m ?? prev.camera.heightAboveGroundM,
            offsetEastM: data.offset_east_m ?? prev.camera.offsetEastM ?? 0,
            offsetNorthM: data.offset_north_m ?? prev.camera.offsetNorthM ?? 0,
          },
          yawOffsetDeg: data.yaw_offset_deg ?? prev.yawOffsetDeg,
          tilt: {
            pitchDeg: data.pitch_tilt_deg ?? prev.tilt.pitchDeg,
            rollDeg: data.roll_tilt_deg ?? prev.tilt.rollDeg,
          },
          limits: {
            ...prev.limits,
            minPitchDeg: data.min_pitch_deg ?? prev.limits.minPitchDeg,
            maxPitchDeg: data.max_pitch_deg ?? prev.limits.maxPitchDeg,
            defaultYawDeg: data.default_yaw_deg ?? prev.limits.defaultYawDeg,
            defaultPitchDeg: data.default_pitch_deg ?? prev.limits.defaultPitchDeg,
          },
        }));

        if (Array.isArray(data.control_points) && data.control_points.length > 0) {
          setControlPoints(data.control_points as PanoramaControlPoint[]);
        }

        if (data.lot_overrides && typeof data.lot_overrides === "object") {
          setOverrides(data.lot_overrides as PanoramaLotOverridesMap);
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

  const manzanaLots = useMemo(() => {
    return mergedLots.filter((l) => (l.manzana ?? "") === activeManzana);
  }, [mergedLots, activeManzana]);

  const manzanaHasOverrides = useMemo(() => {
    return manzanaLots.some((l) => Boolean(overrides[l.id]));
  }, [manzanaLots, overrides]);

  const pieceHasOverrides = useMemo(() => {
    return selectedPieceLotIds.some((id) => Boolean(overrides[id]));
  }, [selectedPieceLotIds, overrides]);

  const toggleLotInPiece = useCallback((id: string) => {
    setSelectedPieceLotIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
    setSelectedLotId(id);
  }, []);

  const resetActivePiece = useCallback(() => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const id of selectedPieceLotIds) {
        delete next[id];
      }
      return next;
    });
  }, [selectedPieceLotIds]);

  const handlePrevManzana = useCallback(() => {
    if (availableManzanas.length === 0) return;
    const currentIndex = availableManzanas.indexOf(activeManzana);
    const prevIndex = (currentIndex - 1 + availableManzanas.length) % availableManzanas.length;
    const nextMz = availableManzanas[prevIndex];
    setSelectedManzana(nextMz);
    const firstLot = mergedLots.find((l) => (l.manzana ?? "") === nextMz);
    if (firstLot) setSelectedLotId(firstLot.id);
  }, [availableManzanas, activeManzana, mergedLots]);

  const handleNextManzana = useCallback(() => {
    if (availableManzanas.length === 0) return;
    const currentIndex = availableManzanas.indexOf(activeManzana);
    const nextIndex = (currentIndex + 1) % availableManzanas.length;
    const nextMz = availableManzanas[nextIndex];
    setSelectedManzana(nextMz);
    const firstLot = mergedLots.find((l) => (l.manzana ?? "") === nextMz);
    if (firstLot) setSelectedLotId(firstLot.id);
  }, [availableManzanas, activeManzana, mergedLots]);

  const selectedRawLot = useMemo(
    () => masterplanLots.find((l) => l.id === selectedLotId) ?? null,
    [selectedLotId],
  );

  // Métricas y dimensiones reales en metros usando el plano urbanístico (CAD)
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

  const calibrationEval = useMemo(
    () => evaluateCalibration(config, controlPoints),
    [config, controlPoints],
  );

  // Centrar el plano 2D en el lote seleccionado
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

  // Control del ViewBox interactivo del Plano 2D
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
  // MOVIMIENTO FLUIDO CON LA MANO (PLANO, MANZANA O LOTE INDIVIDUAL)
  // ==============================================================
  const moveDirectional = useCallback(
    (deltaYawDeg: number, deltaPitchDeg: number) => {
      if (editScope === "global") {
        // Mover la cámara/calibración global: ¡TODOS los 340 lotes se mueven juntos con la mano!
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

      const dYawRad = (deltaYawDeg * Math.PI) / 180;
      const dPitchRad = (deltaPitchDeg * Math.PI) / 180;

      // Mover PEDAZO PERSONALIZADO: todos los lotes del pedazo seleccionado se desplazan juntos
      if (editScope === "piece") {
        if (selectedPieceLotIds.length === 0) return;
        setOverrides((prev) => {
          const next = { ...prev };
          for (const id of selectedPieceLotIds) {
            const lot = mergedLots.find((l) => l.id === id);
            if (!lot) continue;
            const currentVerts = prev[id]?.verticesRad ?? lot.verticesRad;
            const newVerts: [number, number][] = currentVerts.map(([yaw, pitch]) => {
              let nextYaw = yaw + dYawRad;
              while (nextYaw > Math.PI) nextYaw -= 2 * Math.PI;
              while (nextYaw < -Math.PI) nextYaw += 2 * Math.PI;
              const nextPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch + dPitchRad));
              return [roundRad(nextYaw), roundRad(nextPitch)];
            });
            next[id] = {
              verticesRad: newVerts,
              updatedAt: new Date().toISOString(),
            };
          }
          return next;
        });
        return;
      }

      // Mover el lote individual seleccionado
      if (!selectedMergedLot || selectedMergedLot.verticesRad.length === 0) return;

      const currentVerts = overrides[selectedLotId]?.verticesRad
        ? [...overrides[selectedLotId].verticesRad]
        : [...selectedMergedLot.verticesRad];

      const newVerts: [number, number][] = currentVerts.map(([yaw, pitch]) => {
        let nextYaw = yaw + dYawRad;
        while (nextYaw > Math.PI) nextYaw -= 2 * Math.PI;
        while (nextYaw < -Math.PI) nextYaw += 2 * Math.PI;
        const nextPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch + dPitchRad));
        return [roundRad(nextYaw), roundRad(nextPitch)];
      });

      setOverrides((prev) => ({
        ...prev,
        [selectedLotId]: {
          verticesRad: newVerts,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [editScope, selectedPieceLotIds, mergedLots, selectedMergedLot, overrides, selectedLotId],
  );

  const scaleEntireLot = useCallback(
    (factor: number) => {
      if (!selectedMergedLot || selectedMergedLot.verticesRad.length === 0) return;
      const currentVerts = overrides[selectedLotId]?.verticesRad
        ? [...overrides[selectedLotId].verticesRad]
        : [...selectedMergedLot.verticesRad];

      const count = currentVerts.length;
      const avgYaw = currentVerts.reduce((sum, v) => sum + v[0], 0) / count;
      const avgPitch = currentVerts.reduce((sum, v) => sum + v[1], 0) / count;

      const newVerts: [number, number][] = currentVerts.map(([yaw, pitch]) => {
        const nextYaw = avgYaw + (yaw - avgYaw) * factor;
        const nextPitch = avgPitch + (pitch - avgPitch) * factor;
        return [roundRad(nextYaw), roundRad(nextPitch)];
      });

      setOverrides((prev) => ({
        ...prev,
        [selectedLotId]: {
          verticesRad: newVerts,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [selectedMergedLot, overrides, selectedLotId],
  );

  const rotateEntireLot = useCallback(
    (deg: number) => {
      if (!selectedMergedLot || selectedMergedLot.verticesRad.length === 0) return;
      const rad = (deg * Math.PI) / 180;
      const currentVerts = overrides[selectedLotId]?.verticesRad
        ? [...overrides[selectedLotId].verticesRad]
        : [...selectedMergedLot.verticesRad];

      const count = currentVerts.length;
      const avgYaw = currentVerts.reduce((sum, v) => sum + v[0], 0) / count;
      const avgPitch = currentVerts.reduce((sum, v) => sum + v[1], 0) / count;

      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const newVerts: [number, number][] = currentVerts.map(([yaw, pitch]) => {
        const dy = yaw - avgYaw;
        const dp = pitch - avgPitch;
        const nextYaw = avgYaw + (dy * cos - dp * sin);
        const nextPitch = avgPitch + (dy * sin + dp * cos);
        return [roundRad(nextYaw), roundRad(nextPitch)];
      });

      setOverrides((prev) => ({
        ...prev,
        [selectedLotId]: {
          verticesRad: newVerts,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [selectedMergedLot, overrides, selectedLotId],
  );

  const scaleActiveTarget = useCallback(
    (factor: number) => {
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

      if (editScope === "piece") {
        if (selectedPieceLotIds.length === 0) return;
        let sumYaw = 0;
        let sumPitch = 0;
        let totalPts = 0;
        for (const id of selectedPieceLotIds) {
          const lot = mergedLots.find((l) => l.id === id);
          if (!lot) continue;
          const verts = overrides[id]?.verticesRad ?? lot.verticesRad;
          for (const v of verts) {
            sumYaw += v[0];
            sumPitch += v[1];
            totalPts++;
          }
        }
        if (totalPts === 0) return;
        const avgYaw = sumYaw / totalPts;
        const avgPitch = sumPitch / totalPts;

        setOverrides((prev) => {
          const next = { ...prev };
          for (const id of selectedPieceLotIds) {
            const lot = mergedLots.find((l) => l.id === id);
            if (!lot) continue;
            const currentVerts = prev[id]?.verticesRad ?? lot.verticesRad;
            const newVerts: [number, number][] = currentVerts.map(([yaw, pitch]) => {
              const nextYaw = avgYaw + (yaw - avgYaw) * factor;
              const nextPitch = avgPitch + (pitch - avgPitch) * factor;
              return [roundRad(nextYaw), roundRad(nextPitch)];
            });
            next[id] = {
              verticesRad: newVerts,
              updatedAt: new Date().toISOString(),
            };
          }
          return next;
        });
        return;
      }

      scaleEntireLot(factor);
    },
    [editScope, selectedPieceLotIds, mergedLots, overrides, scaleEntireLot],
  );

  const rotateActiveTarget = useCallback(
    (deg: number) => {
      if (editScope === "global") {
        setConfig((prev) => ({
          ...prev,
          yawOffsetDeg: Math.round((prev.yawOffsetDeg + deg) * 100) / 100,
        }));
        return;
      }

      if (editScope === "piece") {
        if (selectedPieceLotIds.length === 0) return;
        let sumYaw = 0;
        let sumPitch = 0;
        let totalPts = 0;
        for (const id of selectedPieceLotIds) {
          const lot = mergedLots.find((l) => l.id === id);
          if (!lot) continue;
          const verts = overrides[id]?.verticesRad ?? lot.verticesRad;
          for (const v of verts) {
            sumYaw += v[0];
            sumPitch += v[1];
            totalPts++;
          }
        }
        if (totalPts === 0) return;
        const avgYaw = sumYaw / totalPts;
        const avgPitch = sumPitch / totalPts;
        const rad = (deg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        setOverrides((prev) => {
          const next = { ...prev };
          for (const id of selectedPieceLotIds) {
            const lot = mergedLots.find((l) => l.id === id);
            if (!lot) continue;
            const currentVerts = prev[id]?.verticesRad ?? lot.verticesRad;
            const newVerts: [number, number][] = currentVerts.map(([yaw, pitch]) => {
              const dy = yaw - avgYaw;
              const dp = pitch - avgPitch;
              const nextYaw = avgYaw + (dy * cos - dp * sin);
              const nextPitch = avgPitch + (dy * sin + dp * cos);
              return [roundRad(nextYaw), roundRad(nextPitch)];
            });
            next[id] = {
              verticesRad: newVerts,
              updatedAt: new Date().toISOString(),
            };
          }
          return next;
        });
        return;
      }

      rotateEntireLot(deg);
    },
    [editScope, selectedPieceLotIds, mergedLots, overrides, rotateEntireLot],
  );

  const resetActiveManzana = useCallback(() => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const lot of manzanaLots) {
        delete next[lot.id];
      }
      return next;
    });
  }, [manzanaLots]);

  // Atajos de teclado en segundo plano
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      const step = e.shiftKey ? 1.5 : e.altKey ? 0.1 : nudgeStep;

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
      } else if (e.key === "]" || e.key === "}") {
        e.preventDefault();
        rotateActiveTarget(0.5);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        scaleActiveTarget(1.02);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        scaleActiveTarget(0.98);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveDirectional, rotateActiveTarget, scaleActiveTarget, nudgeStep]);

  const extraMarkers = useMemo((): MarkerConfig[] => {
    return [];
  }, []);

  const handleRunSolver = () => {
    const result = calibratePanoramaCamera(config, controlPoints, {
      fitDroneOffset,
      fitTilt: true,
      maxIterations: 300,
    });
    setConfig(result.config);
    setSaveMessage(`Calibrado: RMS ${result.rmsErrorDeg}°`);
  };

  const handleSaveToSupabase = async () => {
    if (!supabase) {
      setSaveMessage("Supabase no disponible; usa Exportar.");
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
        setSaveMessage("Proyecto no encontrado en BD; usa Exportar.");
        return;
      }

      const { data: existingRow } = await supabase
        .from("project_panoramas")
        .select("lot_overrides")
        .eq("project_id", projectRow.id)
        .eq("slug", "main")
        .maybeSingle();

      const remoteOverrides = (existingRow?.lot_overrides ?? {}) as PanoramaLotOverridesMap;
      const missingKeys = Object.keys(remoteOverrides).filter((k) => !overrides[k]);
      if (missingKeys.length > 0) {
        const proceed = window.confirm(
          `Aviso: En la base de datos existen ajustes para ${missingKeys.length} lote(s) que no están en tu pantalla. ¿Deseas sobrescribirlos?`,
        );
        if (!proceed) {
          setIsSavingDb(false);
          return;
        }
      }

      const { error } = await supabase.from("project_panoramas").upsert(
        {
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
          lot_overrides: overrides,
        },
        { onConflict: "project_id,slug" },
      );

      setSaveMessage(error ? `Aviso: ${error.message}` : "Guardado en base de datos con éxito.");
    } catch (err) {
      setSaveMessage(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
    } finally {
      setIsSavingDb(false);
    }
  };

  const overriddenLotsCount = Object.keys(overrides).length;

  const heightClass =
    workspaceHeight === "full"
      ? "h-[calc(100vh-190px)] min-h-[580px]"
      : workspaceHeight === "tall"
        ? "h-[680px] xl:h-[760px]"
        : "h-[500px] lg:h-[560px]";

  return (
    <div className="space-y-3 p-3 lg:p-4">
      {/* ========================================================= */}
      {/* 1. BARRA SUPERIOR ULTRA-LIMPIA Y ELEGANTE */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/90 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm sm:text-base font-bold tracking-tight">Calibrador 360°</h1>
          </div>
          <Badge variant="secondary" className="font-semibold text-xs">
            {masterplanLots.length} lotes
          </Badge>
          {overriddenLotsCount > 0 && (
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
              {overriddenLotsCount} ajustados
            </Badge>
          )}
        </div>

        {/* Selector de Modos de Vista */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          <Button
            variant={viewLayout === "pano" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3 font-semibold cursor-pointer"
            onClick={() => setViewLayout("pano")}
          >
            Vista 360°
          </Button>
          <Button
            variant={viewLayout === "split" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3 font-semibold cursor-pointer"
            onClick={() => setViewLayout("split")}
          >
            Dividido 50/50
          </Button>
          <Button
            variant={viewLayout === "plan" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3 font-semibold cursor-pointer"
            onClick={() => setViewLayout("plan")}
          >
            Plano 2D
          </Button>
        </div>

        {/* Acciones de exportación y guardado */}
        <div className="flex items-center gap-1.5">
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
            onClick={() => downloadJsonFile("villa-paraiso-panorama-overrides.json", overrides)}
            title="Descargar overrides locales"
          >
            <Download className="mr-1.5 size-3.5" />
            Overrides ({overriddenLotsCount})
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
            onClick={() =>
              downloadJsonFile("villa-paraiso-panorama-lots.json", {
                projectSlug: "villa-paraiso",
                version: 1,
                generatedAt: new Date().toISOString(),
                config,
                controlPoints,
                lots: mergedLots,
              })
            }
          >
            <Download className="mr-1.5 size-3.5" />
            Exportar
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs font-semibold cursor-pointer"
            onClick={handleSaveToSupabase}
            disabled={isSavingDb}
          >
            <Save className="mr-1.5 size-3.5" />
            {isSavingDb ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ÁREA DEL VISOR (PLANO 2D Y/O VISTA 360°) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 items-start">
        {/* PLANO 2D */}
        {(viewLayout === "split" || viewLayout === "plan") && (
          <Card
            className={`${
              viewLayout === "plan" ? "xl:col-span-12" : "xl:col-span-5"
            } overflow-hidden rounded-2xl border shadow-sm flex flex-col`}
          >
            <CardHeader className="py-2 px-3 border-b flex-row items-center justify-between space-y-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Plano 2D
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {selectedLotId}
                </Badge>
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
                  title={isPlanLocked ? "Plano fijado" : "Plano libre"}
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
                  const hasOverride = Boolean(overrides[lot.id]);
                  return (
                    <path
                      key={lot.id}
                      d={lot.pathD}
                      fill={
                        isSelected
                          ? "rgba(250,204,21,0.85)"
                          : hasOverride
                            ? "rgba(56,189,248,0.45)"
                            : "rgba(16,185,129,0.25)"
                      }
                      stroke={
                        isSelected ? "#fef08a" : hasOverride ? "#38bdf8" : "rgba(255,255,255,0.6)"
                      }
                      strokeWidth={isSelected ? 4 : 1.4}
                      className="cursor-pointer hover:fill-amber-400/60 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLotId(lot.id);
                      }}
                    />
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        )}

        {/* VISTA 360° */}
        {(viewLayout === "split" || viewLayout === "pano") && (
          <Card
            className={`${
              viewLayout === "pano" ? "xl:col-span-12" : "xl:col-span-7"
            } overflow-hidden rounded-2xl border shadow-sm flex flex-col relative`}
          >
            <CardContent className={`p-0 ${heightClass} relative overflow-hidden`}>
              {/* Notificación informativa del modo mano */}
              {panoDragMode === "hand" && (
                <div className="absolute top-3 left-3 z-30 pointer-events-none rounded-xl bg-black/85 border border-white/20 px-3.5 py-2 text-xs text-white/95 backdrop-blur-md shadow-xl flex items-center gap-2">
                  <Hand className="size-4 text-accent animate-pulse shrink-0" />
                  <span>
                    {editScope === "global" ? (
                      <>
                        Arrastra con la mano para mover{" "}
                        <strong className="text-accent underline">Todo el Plano (340 lotes)</strong>
                        . La foto permanece fija.
                      </>
                    ) : editScope === "piece" ? (
                      <>
                        Arrastra con la mano para mover el{" "}
                        <strong className="text-accent underline">
                          Pedazo ({selectedPieceLotIds.length} lotes)
                        </strong>
                        . Toca cualquier lote en pantalla para sumarlo o quitarlo.
                      </>
                    ) : (
                      <>
                        Arrastra con la mano para mover el{" "}
                        <strong className="text-accent underline">Lote {selectedLotId}</strong>. La
                        foto permanece fija.
                      </>
                    )}
                  </span>
                </div>
              )}

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
                onSelectLot={(id: string) => {
                  if (editScope === "piece") {
                    toggleLotInPiece(id);
                  } else {
                    setSelectedLotId(id);
                  }
                }}
                extraMarkers={extraMarkers}
                dragMode={panoDragMode}
                onHandDrag={(dYaw: number, dPitch: number) => moveDirectional(dYaw, dPitch)}
              />

              {/* HUD FLOTANTE SUPER CÓMODO: CONTROL DIRECTO EN LA FOTO 360 */}
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] w-fit select-none"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="rounded-2xl border border-white/20 bg-black/90 backdrop-blur-xl p-2 shadow-2xl text-white flex flex-wrap items-center justify-center gap-2">
                  {/* Modo Mano vs Cámara */}
                  <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-xl">
                    <Button
                      variant={panoDragMode === "hand" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-bold px-2.5 cursor-pointer text-white"
                      onClick={() => setPanoDragMode("hand")}
                      title="Arrastrar con la mano directamente sobre la pantalla"
                    >
                      <Hand className="mr-1 size-3 text-amber-400" />
                      Mano
                    </Button>
                    <Button
                      variant={panoDragMode === "orbit" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-semibold px-2 cursor-pointer text-white/80 hover:text-white"
                      onClick={() => setPanoDragMode("orbit")}
                      title="Girar la cámara 360°"
                    >
                      <RotateCcw className="mr-1 size-3" />
                      Girar
                    </Button>
                  </div>

                  {/* Alcance: Todo el Plano / Por Pedazo / Solo Lote */}
                  <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-xl">
                    <Button
                      variant={editScope === "global" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-bold px-2.5 cursor-pointer text-white"
                      onClick={() => setEditScope("global")}
                      title="Cuadrar todo el plano (340 lotes juntos)"
                    >
                      <Globe className="mr-1.5 size-3 text-emerald-400" />
                      Todo el Plano
                    </Button>

                    <Button
                      variant={editScope === "piece" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-bold px-2.5 cursor-pointer text-white"
                      onClick={() => setEditScope("piece")}
                      title="Mover por pedazo (los lotes que tú elijas tocar)"
                    >
                      <Layers className="mr-1.5 size-3 text-amber-400" />
                      Por Pedazo ({selectedPieceLotIds.length})
                    </Button>

                    <Button
                      variant={editScope === "lot" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs font-semibold px-2 cursor-pointer text-white/80 hover:text-white"
                      onClick={() => setEditScope("lot")}
                      title="Mover solo 1 lote individual"
                    >
                      <Crosshair className="mr-1 size-3" />
                      Solo Lote
                    </Button>
                  </div>

                  {/* Detalle y gestión del Pedazo activo */}
                  {editScope === "piece" && (
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-xl text-xs">
                      <span className="font-mono text-amber-300 font-bold">
                        {selectedPieceLotIds.slice(0, 3).join(", ")}
                        {selectedPieceLotIds.length > 3
                          ? ` +${selectedPieceLotIds.length - 3}`
                          : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPieceLotIds([selectedLotId])}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-white/15 hover:bg-white/25 text-white/90 cursor-pointer"
                        title="Dejar solo el lote actual en el pedazo"
                      >
                        Solo {selectedLotId}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleLotInPiece(selectedLotId)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-amber-400/20 text-amber-300 font-semibold cursor-pointer hover:bg-amber-400/30"
                        title="Sumar/quitar lote actual al pedazo"
                      >
                        {selectedPieceLotIds.includes(selectedLotId) ? "- Quitar" : "+ Sumar"}{" "}
                        {selectedLotId}
                      </button>
                    </div>
                  )}

                  {/* Selector de Lote activo en modo lote */}
                  {editScope === "lot" && (
                    <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-xl">
                      <select
                        value={selectedLotId}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                        className="h-7 rounded-lg bg-black/60 border border-white/20 px-2 text-xs font-bold text-amber-300 cursor-pointer focus:outline-none"
                      >
                        {masterplanLots.map((l) => (
                          <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                            {l.id} {overrides[l.id] ? "★" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* D-Pad de movimiento en pantalla con precisión */}
                  <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-xl">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-white hover:bg-white/20 cursor-pointer"
                      onClick={() => moveDirectional(nudgeStep, 0)}
                      title="Mover Izquierda"
                    >
                      <ArrowLeft className="size-3.5" />
                    </Button>
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-md text-white hover:bg-white/20 cursor-pointer"
                        onClick={() => moveDirectional(0, nudgeStep)}
                        title="Mover Arriba"
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-md text-white hover:bg-white/20 cursor-pointer"
                        onClick={() => moveDirectional(0, -nudgeStep)}
                        title="Mover Abajo"
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-white hover:bg-white/20 cursor-pointer"
                      onClick={() => moveDirectional(-nudgeStep, 0)}
                      title="Mover Derecha"
                    >
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>

                  {/* Rotar & Escalar */}
                  <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-xl">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-white hover:bg-white/20 cursor-pointer"
                      onClick={() => rotateActiveTarget(-0.5)}
                      title="Girar antihorario"
                    >
                      <RotateCcw className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-white hover:bg-white/20 cursor-pointer"
                      onClick={() => rotateActiveTarget(0.5)}
                      title="Girar horario"
                    >
                      <RotateCw className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-white hover:bg-white/20 cursor-pointer"
                      onClick={() => scaleActiveTarget(0.98)}
                      title="Achicar tamaño"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-white hover:bg-white/20 cursor-pointer"
                      onClick={() => scaleActiveTarget(1.02)}
                      title="Agrandar tamaño"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  {/* Paso selector */}
                  <div className="hidden sm:flex items-center gap-0.5 bg-white/10 p-1 rounded-xl text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNudgeStep(0.1)}
                      className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${
                        nudgeStep === 0.1
                          ? "bg-amber-400 text-black font-bold"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      0.1°
                    </button>
                    <button
                      type="button"
                      onClick={() => setNudgeStep(0.5)}
                      className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${
                        nudgeStep === 0.5
                          ? "bg-amber-400 text-black font-bold"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      0.5°
                    </button>
                    <button
                      type="button"
                      onClick={() => setNudgeStep(1.5)}
                      className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${
                        nudgeStep === 1.5
                          ? "bg-amber-400 text-black font-bold"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      1.5°
                    </button>
                  </div>

                  {/* Acciones: Restaurar y Guardar */}
                  <div className="flex items-center gap-1.5">
                    {editScope === "piece" && pieceHasOverrides && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 border-amber-400/40 text-amber-300 hover:bg-amber-400/20 cursor-pointer"
                        onClick={resetActivePiece}
                        title="Restaurar este pedazo"
                      >
                        <RefreshCw className="mr-1 size-3" />
                        Reset Pedazo
                      </Button>
                    )}
                    {editScope === "global" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 border-white/30 text-white/90 hover:bg-white/20 cursor-pointer"
                        onClick={() => {
                          setConfig({ ...initialPanoramaData.config });
                          setOverrides({});
                        }}
                        title="Restaurar todo el plano a valores de fábrica"
                      >
                        <RotateCcw className="mr-1 size-3" />
                        Reset Base
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs px-3 font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md cursor-pointer"
                      onClick={handleSaveToSupabase}
                      disabled={isSavingDb}
                    >
                      <Save className="mr-1 size-3" />
                      {isSavingDb ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. DOCK INFERIOR ULTRA-CÓMODO: CONTROL DIRECTO CON LA MANO */}
      {/* ========================================================= */}
      <div className="rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur-lg flex flex-wrap items-center justify-between gap-3">
        {/* A. Selector de Modo: Mover con Mano (Foto Fija) vs Girar Cámara */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl">
            <Button
              variant={panoDragMode === "hand" ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs font-bold px-3.5 cursor-pointer shadow-xs"
              onClick={() => setPanoDragMode("hand")}
              title="Arrastra con la mano directamente sobre la pantalla. La foto 360 permanece fija."
            >
              <Hand className="mr-1.5 size-3.5 text-accent" />
              Mover con Mano
            </Button>
            <Button
              variant={panoDragMode === "orbit" ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs font-semibold px-3 cursor-pointer"
              onClick={() => setPanoDragMode("orbit")}
              title="Girar la cámara 360° para mirar en cualquier dirección"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Girar Cámara
            </Button>
          </div>
        </div>

        {/* B. Selector de qué estás moviendo: Todo el Plano / Por Pedazo / Solo Lote */}
        <div className="flex items-center gap-1.5 bg-muted/70 p-1 rounded-xl">
          <Button
            variant={editScope === "global" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs font-bold px-3 cursor-pointer"
            onClick={() => setEditScope("global")}
            title="Mover TODOS los 340 lotes juntos con la mano para cuadrar el plano"
          >
            <Globe className="mr-1.5 size-3.5 text-emerald-500" />
            Todo el Plano
          </Button>

          <Button
            variant={editScope === "piece" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs font-bold px-3 cursor-pointer"
            onClick={() => setEditScope("piece")}
            title="Mover por pedazo (los lotes que tú toques o elijas juntos)"
          >
            <Layers className="mr-1.5 size-3.5 text-accent" />
            Por Pedazo ({selectedPieceLotIds.length})
          </Button>

          <Button
            variant={editScope === "lot" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs font-semibold px-3 cursor-pointer"
            onClick={() => setEditScope("lot")}
            title="Mover únicamente el lote individual seleccionado con la mano"
          >
            <Crosshair className="mr-1.5 size-3.5" />
            Solo Lote
          </Button>
        </div>

        {/* C. Controles según el alcance: Selector de Pedazo o Selector de Lote */}
        {editScope === "piece" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Pedazo:</span>
            <span className="font-mono text-xs font-bold text-accent">
              {selectedPieceLotIds.slice(0, 4).join(", ")}
              {selectedPieceLotIds.length > 4 ? ` (+${selectedPieceLotIds.length - 4})` : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 cursor-pointer"
              onClick={() => toggleLotInPiece(selectedLotId)}
              title="Sumar o quitar lote actual a este pedazo"
            >
              {selectedPieceLotIds.includes(selectedLotId) ? "- Quitar" : "+ Sumar"} {selectedLotId}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setSelectedPieceLotIds([selectedLotId])}
              title="Dejar solo este lote"
            >
              Solo {selectedLotId}
            </Button>
            {pieceHasOverrides && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs cursor-pointer text-amber-600 dark:text-amber-400"
                onClick={resetActivePiece}
                title="Restaurar este pedazo a su posición original"
              >
                <RefreshCw className="mr-1 size-3" />
                Reset Pedazo
              </Button>
            )}
          </div>
        )}

        {editScope === "lot" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Lote:</span>
            <select
              value={selectedLotId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedLotId(id);
                const found = mergedLots.find((l) => l.id === id);
                if (found?.manzana) setSelectedManzana(found.manzana);
                centerPlanOnLot(id);
              }}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-bold cursor-pointer"
            >
              {masterplanLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} ({l.manzana ?? "Mz"}){overrides[l.id] ? " ★" : ""}
                </option>
              ))}
            </select>

            {overrides[selectedLotId] && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer text-amber-600 dark:text-amber-400"
                onClick={() =>
                  setOverrides((prev) => {
                    const next = { ...prev };
                    delete next[selectedLotId];
                    return next;
                  })
                }
                title="Restaurar este lote a la proyección original"
              >
                <RefreshCw className="mr-1.5 size-3" />
                Restaurar Lote
              </Button>
            )}
          </div>
        )}

        {editScope === "global" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => {
                setConfig({ ...initialPanoramaData.config });
                setOverrides({});
              }}
              title="Restablecer la posición de todo el plano a los valores originales de fábrica"
            >
              <RotateCcw className="mr-1 size-3" />
              Reset Base Completo
            </Button>
          </div>
        )}

        {/* D. Ajuste fino de rotación y escala para el objetivo activo */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">
            {editScope === "global"
              ? "Plano"
              : editScope === "piece"
                ? `Pedazo (${selectedPieceLotIds.length})`
                : "Lote"}
            :
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg cursor-pointer"
            onClick={() => rotateActiveTarget(-0.5)}
            title={`Girar ${
              editScope === "global" ? "plano" : editScope === "piece" ? "pedazo" : "lote"
            } antihorario`}
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg cursor-pointer"
            onClick={() => rotateActiveTarget(0.5)}
            title={`Girar ${
              editScope === "global" ? "plano" : editScope === "piece" ? "pedazo" : "lote"
            } horario`}
          >
            <RotateCw className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg cursor-pointer"
            onClick={() => scaleActiveTarget(0.98)}
            title={`Achicar tamaño de ${
              editScope === "global" ? "plano" : editScope === "piece" ? "pedazo" : "lote"
            }`}
          >
            <Minus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg cursor-pointer"
            onClick={() => scaleActiveTarget(1.02)}
            title={`Agrandar tamaño de ${
              editScope === "global" ? "plano" : editScope === "piece" ? "pedazo" : "lote"
            }`}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        {/* E. Dimensiones y distancias rápidas del plano urbanístico */}
        {lotMetrics && (
          <div className="hidden xl:flex items-center gap-2 font-mono text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border">
            <span className="text-foreground font-bold">{lotMetrics.areaM2} m²</span>
            <span>·</span>
            <span>
              ~{lotMetrics.approxFrontM}m × {lotMetrics.approxDepthM}m
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-foreground">
              <Footprints className="size-3 text-emerald-500" />
              {lotMetrics.distFromEntranceM}m portería
            </span>
          </div>
        )}

        {/* F. Guardar rápido */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            className="h-8 text-xs font-bold px-3.5 cursor-pointer shadow-sm"
            onClick={handleSaveToSupabase}
            disabled={isSavingDb}
          >
            <Save className="mr-1.5 size-3.5" />
            {isSavingDb ? "Guardando…" : "Guardar"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg cursor-pointer text-muted-foreground"
            onClick={() => setShowAdvancedPanel((v) => !v)}
            title="Opciones técnicas avanzadas de dron"
          >
            <Sliders className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PANEL AVANZADO COLAPSABLE (Solo si se requiere afinar dron) */}
      {/* ========================================================= */}
      {showAdvancedPanel && (
        <Card className="rounded-2xl border shadow-sm p-4 bg-muted/20 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Parámetros de Cámara Dron (GPS & Rumbo)
            </span>
            <Button size="sm" className="h-7 text-xs cursor-pointer" onClick={handleRunSolver}>
              <Sparkles className="mr-1.5 size-3.5" />
              Auto-calibrar Dron
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Rumbo (°)</label>
              <Input
                type="number"
                step="0.1"
                value={config.yawOffsetDeg}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, yawOffsetDeg: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Altura (m)</label>
              <Input
                type="number"
                step="0.5"
                value={config.camera.heightAboveGroundM}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    camera: {
                      ...p.camera,
                      heightAboveGroundM: Math.max(10, parseFloat(e.target.value) || 175),
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Pitch (°)</label>
              <Input
                type="number"
                step="0.1"
                value={config.tilt.pitchDeg}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    tilt: { ...p.tilt, pitchDeg: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Roll (°)</label>
              <Input
                type="number"
                step="0.1"
                value={config.tilt.rollDeg}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    tilt: { ...p.tilt, rollDeg: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Este (m)</label>
              <Input
                type="number"
                step="0.5"
                value={config.camera.offsetEastM ?? 0}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    camera: { ...p.camera, offsetEastM: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Norte (m)</label>
              <Input
                type="number"
                step="0.5"
                value={config.camera.offsetNorthM ?? 0}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    camera: { ...p.camera, offsetNorthM: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
