import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Crosshair,
  Download,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Unlock,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarkerConfig } from "@photo-sphere-viewer/markers-plugin";
import PanoramaViewer from "@/components/project-view/PanoramaViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import rawLots from "@/data/villa-paraiso-lots.json";
import rawLayers from "@/data/villa-paraiso-layers.json";
import rawPanoramaLotsData from "@/data/generated/villa-paraiso-panorama-lots.json";
import rawPanoramaOverrides from "@/data/villa-paraiso-panorama-overrides.json";
import { svgToCad, svgToGpsViaCad } from "@/features/terrain-navigation/cad-gps";
import {
  calibratePanoramaCamera,
  densifyCadPolygon,
  evaluateCalibration,
  mergePanoramaLotsWithOverrides,
  projectCadPointToPanoramaRad,
  projectGpsPointToPanoramaRad,
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

function parseSvgPath(d: string): [number, number][] {
  const pts: [number, number][] = [];
  const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    pts.push([parseFloat(m[2]), parseFloat(m[3])]);
  }
  return pts;
}

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

  const [activeTab, setActiveTab] = useState<"calibration" | "vertices">("vertices");
  const [clickEditEnabled, setClickEditEnabled] = useState<boolean>(false);
  const [selectedControlPointId, setSelectedControlPointId] = useState<string | null>(
    () => initialPanoramaData.controlPoints?.[0]?.id ?? null,
  );
  const [selectedLotId, setSelectedLotId] = useState<string>("L-01");
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number>(0);
  const [fitDroneOffset, setFitDroneOffset] = useState<boolean>(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);

  const projectedLots = useMemo((): ProjectedPanoramaLot[] => {
    return masterplanLots.map((lot) => {
      const svgPts = parseSvgPath(lot.pathD);
      const cadPts = svgPts.map(([x, y]) => {
        const c = svgToCad(x, y);
        return [c.x, c.y] as [number, number];
      });
      const verticesRad = cadPts.map(([e, n]) => projectCadPointToPanoramaRad(e, n, config));
      const denseCad = densifyCadPolygon(cadPts, 14);
      const polygonRad = denseCad.map(([e, n]) => projectCadPointToPanoramaRad(e, n, config));
      const centroidCad = svgToCad(lot.centroid[0], lot.centroid[1]);
      const labelRad = projectCadPointToPanoramaRad(centroidCad.x, centroidCad.y, config);

      return {
        id: lot.id,
        lotNumber: lot.lotNumber,
        label: lot.label || String(lot.lotNumber),
        manzana: lot.manzana,
        polygonRad,
        verticesRad,
        labelRad,
      };
    });
  }, [config]);

  const mergedLots = useMemo(
    () => mergePanoramaLotsWithOverrides(projectedLots, overrides),
    [projectedLots, overrides],
  );

  const selectedMergedLot = useMemo(
    () => mergedLots.find((l) => l.id === selectedLotId) ?? null,
    [mergedLots, selectedLotId],
  );

  useEffect(() => {
    setSelectedVertexIndex(0);
  }, [selectedLotId]);

  const calibrationEval = useMemo(
    () => evaluateCalibration(config, controlPoints),
    [config, controlPoints],
  );

  const extraMarkers = useMemo((): MarkerConfig[] => {
    const list: MarkerConfig[] = [];
    if (activeTab === "calibration") {
      for (const cp of controlPoints) {
        const isSelected = cp.id === selectedControlPointId;
        const [predYaw, predPitch] = projectGpsPointToPanoramaRad(
          cp.worldGps[0],
          cp.worldGps[1],
          config,
        );
        list.push({
          id: `cp-obs-${cp.id}`,
          position: { yaw: cp.panoRad[0], pitch: cp.panoRad[1] },
          html: `<div style="padding:1px 5px;border-radius:999px;background:${
            isSelected ? "#f97316" : "#0284c7"
          };color:#fff;font-size:10px;font-weight:800;border:2px solid #fff;">${cp.id}</div>`,
          anchor: "center center",
          zIndex: isSelected ? 60 : 45,
        });
        list.push({
          id: `cp-pred-${cp.id}`,
          position: { yaw: predYaw, pitch: predPitch },
          html: `<div style="width:9px;height:9px;border-radius:999px;background:#22c55e;border:2px solid #fff;"></div>`,
          anchor: "center center",
          zIndex: 42,
        });
      }
    } else if (activeTab === "vertices" && selectedMergedLot) {
      selectedMergedLot.verticesRad.forEach(([yaw, pitch], idx) => {
        const active = idx === selectedVertexIndex;
        list.push({
          id: `vertex-${selectedMergedLot.id}-${idx}`,
          position: { yaw, pitch },
          html: `<div style="padding:1px 5px;border-radius:999px;background:${
            active ? "#facc15" : "#0f172a"
          };color:${
            active ? "#0f172a" : "#fff"
          };font-size:10px;font-weight:800;border:2px solid #fff;">V${idx + 1}</div>`,
          anchor: "center center",
          zIndex: active ? 70 : 55,
        });
      });
    }
    return list;
  }, [
    activeTab,
    controlPoints,
    selectedControlPointId,
    config,
    selectedMergedLot,
    selectedVertexIndex,
  ]);

  const handlePanoramaClick = useCallback(
    (pos: { yawRad: number; pitchRad: number; yawDeg: number; pitchDeg: number }) => {
      if (!clickEditEnabled) return;
      if (activeTab === "calibration" && selectedControlPointId) {
        setControlPoints((prev) =>
          prev.map((cp) =>
            cp.id === selectedControlPointId
              ? {
                  ...cp,
                  panoRad: [roundRad(pos.yawRad), roundRad(pos.pitchRad)],
                  panoDeg: [pos.yawDeg, pos.pitchDeg],
                }
              : cp,
          ),
        );
      } else if (activeTab === "vertices" && selectedMergedLot) {
        setOverrides((prev) => {
          const baseVertices = prev[selectedMergedLot.id]?.verticesRad
            ? [...prev[selectedMergedLot.id].verticesRad]
            : [...selectedMergedLot.verticesRad];
          if (selectedVertexIndex >= 0 && selectedVertexIndex < baseVertices.length) {
            baseVertices[selectedVertexIndex] = [roundRad(pos.yawRad), roundRad(pos.pitchRad)];
          }
          return {
            ...prev,
            [selectedMergedLot.id]: {
              verticesRad: baseVertices,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      }
    },
    [clickEditEnabled, activeTab, selectedControlPointId, selectedMergedLot, selectedVertexIndex],
  );

  const handleRunSolver = () => {
    const result = calibratePanoramaCamera(config, controlPoints, {
      fitDroneOffset,
      fitTilt: true,
      maxIterations: 300,
    });
    setConfig(result.config);
    setSaveMessage(`Calibrado: RMS ${result.rmsErrorDeg}°`);
  };

  const handleAddControlPointFromSvg = (svgX: number, svgY: number) => {
    if (!clickEditEnabled || activeTab !== "calibration") return;
    const gps = svgToGpsViaCad(svgX, svgY);
    const [predYawRad, predPitchRad] = projectGpsPointToPanoramaRad(
      gps.longitude,
      gps.latitude,
      config,
    );
    const newId = `CP-${controlPoints.length + 1}`;
    setControlPoints((prev) => [
      ...prev,
      {
        id: newId,
        label: `Punto ${controlPoints.length + 1}`,
        worldGps: [Math.round(gps.longitude * 1e6) / 1e6, Math.round(gps.latitude * 1e6) / 1e6],
        worldSvg: [Math.round(svgX * 10) / 10, Math.round(svgY * 10) / 10],
        panoRad: [predYawRad, predPitchRad],
        panoDeg: radToDegPair([predYawRad, predPitchRad]),
        weight: 1.5,
      },
    ]);
    setSelectedControlPointId(newId);
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

      setSaveMessage(error ? `Aviso: ${error.message}` : "Guardado en Supabase.");
    } catch (err) {
      setSaveMessage(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
    } finally {
      setIsSavingDb(false);
    }
  };

  const overriddenLotsCount = Object.keys(overrides).length;

  return (
    <div className="space-y-3 p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">Visor 360°</h1>
          <Badge variant="secondary">{masterplanLots.length} lotes</Badge>
          <Badge variant="outline">RMS {calibrationEval.rmsErrorDeg}°</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={clickEditEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setClickEditEnabled((v) => !v)}
            title="Activa para mover vértices o puntos haciendo clic en el 360°"
          >
            {clickEditEnabled ? (
              <Unlock className="mr-1.5 size-3.5" />
            ) : (
              <Lock className="mr-1.5 size-3.5" />
            )}
            {clickEditEnabled ? "Edición activa" : "Solo navegar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadJsonFile("villa-paraiso-panorama-overrides.json", overrides)}
          >
            <Download className="mr-1.5 size-3.5" />
            Overrides ({overriddenLotsCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
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
          <Button size="sm" onClick={handleSaveToSupabase} disabled={isSavingDb}>
            <Save className="mr-1.5 size-3.5" />
            {isSavingDb ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* Plano 2D */}
        <Card className="xl:col-span-5 overflow-hidden">
          <CardHeader className="py-2.5 px-3.5 border-b flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Plano 2D
            </CardTitle>
            <Badge variant="outline" className="text-[11px]">
              {selectedLotId}
            </Badge>
          </CardHeader>
          <CardContent className="p-0 bg-[#141916] h-[420px] lg:h-[480px]">
            <svg
              viewBox="450 150 1750 2050"
              className="size-full select-none cursor-pointer"
              onClick={(e) => {
                if (!clickEditEnabled || activeTab !== "calibration") return;
                const svg = e.currentTarget;
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const ctm = svg.getScreenCTM();
                if (!ctm) return;
                const transformed = pt.matrixTransform(ctm.inverse());
                handleAddControlPointFromSvg(transformed.x, transformed.y);
              }}
            >
              {masterplanLayers.waterAreas.map((d, idx) => (
                <path
                  key={`w-${idx}`}
                  d={d}
                  fill="#0284c7"
                  fillOpacity={0.55}
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
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={1.5}
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
                        ? "rgba(250,204,21,0.7)"
                        : hasOverride
                          ? "rgba(56,189,248,0.4)"
                          : "rgba(16,185,129,0.22)"
                    }
                    stroke={
                      isSelected ? "#fef08a" : hasOverride ? "#38bdf8" : "rgba(255,255,255,0.55)"
                    }
                    strokeWidth={isSelected ? 4 : 1.4}
                    className="cursor-pointer hover:fill-amber-400/50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLotId(lot.id);
                    }}
                  />
                );
              })}
              {controlPoints.map((cp) => {
                if (!cp.worldSvg) return null;
                const isSelected = cp.id === selectedControlPointId;
                return (
                  <g
                    key={cp.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedControlPointId(cp.id);
                      setActiveTab("calibration");
                    }}
                  >
                    <circle
                      cx={cp.worldSvg[0]}
                      cy={cp.worldSvg[1]}
                      r={isSelected ? 17 : 12}
                      fill={isSelected ? "#f97316" : "#0284c7"}
                      stroke="#ffffff"
                      strokeWidth={3}
                    />
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        {/* Vista 360° */}
        <Card className="xl:col-span-7 overflow-hidden">
          <CardHeader className="py-2.5 px-3.5 border-b flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vista 360°
            </CardTitle>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 text-sky-500">
                <span className="size-2 rounded-full bg-sky-500" /> Observado
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500" /> Proyectado
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[420px] lg:h-[480px] relative">
            <PanoramaViewer
              projectName="Villa Paraíso"
              cameraConfig={config}
              projectedLots={projectedLots}
              overrides={overrides}
              selectedLotId={selectedLotId}
              onSelectLot={setSelectedLotId}
              onPanoramaClick={handlePanoramaClick}
              extraMarkers={extraMarkers}
            />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "calibration" | "vertices")}>
        <TabsList>
          <TabsTrigger value="vertices">
            <Crosshair className="mr-1.5 size-3.5" />
            Vértices ({overriddenLotsCount})
          </TabsTrigger>
          <TabsTrigger value="calibration">
            <Sliders className="mr-1.5 size-3.5" />
            Cámara ({controlPoints.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vertices" className="mt-2.5">
          <Card>
            <CardHeader className="py-2.5 px-4 flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vértices · {selectedLotId}
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLotId}
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold"
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
                    onClick={() =>
                      setOverrides((prev) => {
                        const next = { ...prev };
                        delete next[selectedLotId];
                        return next;
                      })
                    }
                  >
                    <RefreshCw className="mr-1.5 size-3.5" />
                    Restaurar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-3 px-4">
              {selectedMergedLot && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedMergedLot.verticesRad.map(([yaw, pitch], idx) => {
                    const [yawDeg, pitchDeg] = radToDegPair([yaw, pitch]);
                    const active = idx === selectedVertexIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedVertexIndex(idx)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                          active
                            ? "border-amber-400 bg-amber-400/15 font-bold text-foreground"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        V{idx + 1}: {yawDeg}°, {pitchDeg}°
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration" className="mt-2.5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <Card className="lg:col-span-5">
              <CardHeader className="py-2.5 px-4 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dron 360°
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfig(initialPanoramaData.config)}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                  <Button size="sm" onClick={handleRunSolver}>
                    <Sparkles className="mr-1.5 size-3.5" />
                    Calibrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 py-3 px-4 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Rumbo (°)
                    </label>
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
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Altura (m)
                    </label>
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
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Pitch (°)
                    </label>
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
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Roll (°)
                    </label>
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
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Este (m)
                    </label>
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
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Norte (m)
                    </label>
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
                <label className="flex items-center gap-2 pt-1 cursor-pointer text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={fitDroneOffset}
                    onChange={(e) => setFitDroneOffset(e.target.checked)}
                  />
                  <span>Incluir ajuste horizontal GPS</span>
                </label>
              </CardContent>
            </Card>

            <Card className="lg:col-span-7">
              <CardHeader className="py-2.5 px-4">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Puntos de Control ({controlPoints.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="max-h-48 overflow-y-auto divide-y text-xs">
                  {controlPoints.map((cp) => {
                    const err = calibrationEval.pointErrorsDeg.find((e) => e.id === cp.id);
                    const isSelected = cp.id === selectedControlPointId;
                    return (
                      <div
                        key={cp.id}
                        onClick={() => setSelectedControlPointId(cp.id)}
                        className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg cursor-pointer ${
                          isSelected ? "bg-accent/20 font-semibold" : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={isSelected ? "default" : "outline"}>{cp.id}</Badge>
                          <span>{cp.label}</span>
                        </div>
                        <div className="flex items-center gap-2.5 font-mono text-[11px]">
                          <span>
                            {cp.panoDeg[0]}°, {cp.panoDeg[1]}°
                          </span>
                          {err && (
                            <span
                              className={
                                err.angularErrorDeg < 1.5
                                  ? "text-emerald-500 font-bold"
                                  : "text-amber-500 font-bold"
                              }
                            >
                              Δ{err.angularErrorDeg}°
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setControlPoints((prev) => prev.filter((item) => item.id !== cp.id));
                            }}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
