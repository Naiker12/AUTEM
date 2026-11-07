import {
  AlertTriangle,
  Check,
  History,
  MapPin,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calibratePanoramaCamera,
  DEFAULT_SOUTHWEST_TERRAIN_PATCH,
  evaluateCalibration,
  evaluateLeaveOneOutCalibration,
  radToDegPair,
  type CalibrationFitResult,
  type PanoramaCameraConfig,
  type PanoramaControlPoint,
  type PanoramaVersionSnapshot,
  type YawCoverageSummary,
} from "../index";

export interface CalibrationDiagnosticsPanelProps {
  config: PanoramaCameraConfig;
  controlPoints: PanoramaControlPoint[];
  coverage: YawCoverageSummary;
  versionHistory: PanoramaVersionSnapshot[];
  showControlPointsOnPano: boolean;
  onToggleControlPointsOnPano: (show: boolean) => void;
  onApplyConfig: (nextConfig: PanoramaCameraConfig, description: string) => void;
  onUpdateControlPoints: (nextPoints: PanoramaControlPoint[], description: string) => void;
  onRestoreVersion: (snapshot: PanoramaVersionSnapshot) => void;
  lastClickedPanoPos: { yawRad: number; pitchRad: number; yawDeg: number; pitchDeg: number } | null;
}

export function CalibrationDiagnosticsPanel({
  config,
  controlPoints,
  coverage,
  versionHistory,
  showControlPointsOnPano,
  onToggleControlPointsOnPano,
  onApplyConfig,
  onUpdateControlPoints,
  onRestoreVersion,
  lastClickedPanoPos,
}: CalibrationDiagnosticsPanelProps) {
  const [fitDroneOffset, setFitDroneOffset] = useState(true);
  const [fitGroundSlope, setFitGroundSlope] = useState(Boolean(config.groundSlope?.enabled));
  const [candidateFit, setCandidateFit] = useState<{
    before: CalibrationFitResult;
    after: CalibrationFitResult;
    looBeforeDeg: number;
    looAfterDeg: number;
  } | null>(null);

  const [newCpLabel, setNewCpLabel] = useState("");
  const [newCpLat, setNewCpLat] = useState("10.4368");
  const [newCpLng, setNewCpLng] = useState("-75.3562");

  const currentEval = useMemo(
    () => evaluateCalibration(config, controlPoints),
    [config, controlPoints],
  );

  const handlePreviewRecalibration = () => {
    const before = evaluateCalibration(config, controlPoints);
    const after = calibratePanoramaCamera(config, controlPoints, {
      fitDroneOffset,
      fitTilt: true,
      fitGroundSlope,
      maxIterations: 280,
    });
    const looBefore = evaluateLeaveOneOutCalibration(config, controlPoints, {
      fitDroneOffset,
      fitTilt: true,
      fitGroundSlope: Boolean(config.groundSlope?.enabled),
    });
    const looAfter = evaluateLeaveOneOutCalibration(config, controlPoints, {
      fitDroneOffset,
      fitTilt: true,
      fitGroundSlope,
    });
    setCandidateFit({
      before,
      after,
      looBeforeDeg: looBefore.looRmsErrorDeg,
      looAfterDeg: looAfter.looRmsErrorDeg,
    });
  };

  const handleAddControlPoint = () => {
    const lat = parseFloat(newCpLat);
    const lng = parseFloat(newCpLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const yawDeg = lastClickedPanoPos?.yawDeg ?? 0;
    const pitchDeg = lastClickedPanoPos?.pitchDeg ?? -25;
    const yawRad = lastClickedPanoPos?.yawRad ?? 0;
    const pitchRad = lastClickedPanoPos?.pitchRad ?? (-25 * Math.PI) / 180;

    const nextId = `cp-${controlPoints.length + 1}-${Date.now().toString(36).slice(-3)}`;
    const nextPoint: PanoramaControlPoint = {
      id: nextId,
      label: newCpLabel.trim() || `Punto ${controlPoints.length + 1}`,
      worldGps: [lat, lng],
      panoDeg: [Math.round(yawDeg * 100) / 100, Math.round(pitchDeg * 100) / 100],
      panoRad: [yawRad, pitchRad],
      weight: 1,
    };

    onUpdateControlPoints(
      [...controlPoints, nextPoint],
      `Añadir punto de control ${nextPoint.label}`,
    );
    setNewCpLabel("");
  };

  const handleDeleteControlPoint = (id: string) => {
    onUpdateControlPoints(
      controlPoints.filter((cp) => cp.id !== id),
      `Eliminar punto de control ${id}`,
    );
  };

  const handleMoveControlPointToLastClick = (id: string) => {
    if (!lastClickedPanoPos) return;
    onUpdateControlPoints(
      controlPoints.map((cp) =>
        cp.id === id
          ? {
              ...cp,
              panoDeg: [
                Math.round(lastClickedPanoPos.yawDeg * 100) / 100,
                Math.round(lastClickedPanoPos.pitchDeg * 100) / 100,
              ],
              panoRad: [lastClickedPanoPos.yawRad, lastClickedPanoPos.pitchRad],
            }
          : cp,
      ),
      `Mover punto de control ${id} en foto 360`,
    );
  };

  const swPatchEnabled = config.terrainPatch?.enabled !== false;

  return (
    <Card className="rounded-2xl border shadow-sm p-4 bg-muted/15 space-y-4">
      {/* 1. Cabecera: RMS Global, Cobertura 360° y Recalibración con Vista Previa Antes/Después */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Calibración Global & Puntos de Control ({controlPoints.length})
          </span>
          <Badge variant="outline" className="font-mono text-xs">
            RMS: {currentEval.rmsErrorDeg}° (~{currentEval.meanErrorMeters} m medio)
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Cobertura 360°: {coverage.coveragePercent}%
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showControlPointsOnPano ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs cursor-pointer"
            onClick={() => onToggleControlPointsOnPano(!showControlPointsOnPano)}
          >
            <MapPin className="mr-1.5 size-3.5" />
            {showControlPointsOnPano ? "Ocultar puntos en foto" : "Ver puntos en foto"}
          </Button>

          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={fitDroneOffset}
              onChange={(e) => setFitDroneOffset(e.target.checked)}
              className="rounded border-border"
            />
            <span>Ajustar offset E/N</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={fitGroundSlope}
              onChange={(e) => setFitGroundSlope(e.target.checked)}
              className="rounded border-border"
            />
            <span>Pendiente terreno (experimental)</span>
          </label>

          <Button
            size="sm"
            className="h-7 text-xs font-semibold cursor-pointer"
            onClick={handlePreviewRecalibration}
          >
            <Sparkles className="mr-1.5 size-3.5" />
            Recalibrar con {controlPoints.length} puntos
          </Button>
        </div>
      </div>

      {/* Comparativa Antes vs Después de Recalibrar (Fase A4 / A5) */}
      {candidateFit && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-xs">
            <div className="font-bold text-foreground flex items-center gap-2">
              <span>Resultado propuesto de recalibración:</span>
              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                RMS {candidateFit.before.rmsErrorDeg}° → {candidateFit.after.rmsErrorDeg}°
              </Badge>
              <Badge variant="outline" className="font-mono">
                Error medio: {candidateFit.before.meanErrorMeters}m →{" "}
                {candidateFit.after.meanErrorMeters}m
              </Badge>
              <Badge variant="outline" className="font-mono">
                Validación cruzada (LOO): {candidateFit.looBeforeDeg}° → {candidateFit.looAfterDeg}°
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Rumbo: {candidateFit.before.config.yawOffsetDeg}° →{" "}
              {candidateFit.after.config.yawOffsetDeg}° · Altura:{" "}
              {candidateFit.before.config.camera.heightAboveGroundM}m →{" "}
              {candidateFit.after.config.camera.heightAboveGroundM}m · Pitch:{" "}
              {candidateFit.after.config.tilt.pitchDeg}° · Roll:{" "}
              {candidateFit.after.config.tilt.rollDeg}°
              {candidateFit.looAfterDeg > candidateFit.looBeforeDeg && (
                <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                  (Aviso: el error LOO no mejora; se recomienda mantener el modelo plano actual)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              onClick={() => {
                onApplyConfig(candidateFit.after.config, "Aplicar recalibración global");
                setCandidateFit(null);
              }}
            >
              <Check className="mr-1 size-3.5" />
              Aplicar ajuste
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setCandidateFit(null)}
            >
              <X className="mr-1 size-3.5" />
              Descartar
            </Button>
          </div>
        </div>
      )}

      {/* 2. Mini-barra de cobertura 360° y sugerencia automática (Fase A4) */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">
            Cobertura acimutal de puntos de control (sectores de 30°):
          </span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="size-3.5 shrink-0" />
            {coverage.suggestionText}
          </span>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {coverage.sectors.map((sec) => (
            <div
              key={sec.startDeg}
              className={`rounded-md border px-1.5 py-1 text-center text-[10px] font-mono ${
                sec.count > 0
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "border-amber-500/30 bg-amber-500/5 text-muted-foreground"
              }`}
              title={`Yaw ${sec.startDeg}° a ${sec.endDeg}°: ${sec.count} punto(s)`}
            >
              <div>
                {sec.startDeg}°..{sec.endDeg}°
              </div>
              <div>{sec.count > 0 ? `${sec.count} pt` : "Vacío"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Parámetros de cámara, Escala Visual y Parche Terreno SO (Fase A5 + Fase B1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs pt-1">
        <div>
          <label className="font-semibold text-muted-foreground block mb-1">Rumbo (°)</label>
          <Input
            type="number"
            step="0.1"
            value={config.yawOffsetDeg}
            onChange={(e) =>
              onApplyConfig(
                { ...config, yawOffsetDeg: parseFloat(e.target.value) || 0 },
                "Cambiar rumbo de cámara",
              )
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
              onApplyConfig(
                {
                  ...config,
                  camera: {
                    ...config.camera,
                    heightAboveGroundM: Math.max(10, parseFloat(e.target.value) || 175),
                  },
                },
                "Cambiar altura de cámara",
              )
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
              onApplyConfig(
                {
                  ...config,
                  tilt: { ...config.tilt, pitchDeg: parseFloat(e.target.value) || 0 },
                },
                "Cambiar pitch de cámara",
              )
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
              onApplyConfig(
                {
                  ...config,
                  tilt: { ...config.tilt, rollDeg: parseFloat(e.target.value) || 0 },
                },
                "Cambiar roll de cámara",
              )
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
              onApplyConfig(
                {
                  ...config,
                  camera: { ...config.camera, offsetEastM: parseFloat(e.target.value) || 0 },
                },
                "Cambiar offset Este",
              )
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
              onApplyConfig(
                {
                  ...config,
                  camera: { ...config.camera, offsetNorthM: parseFloat(e.target.value) || 0 },
                },
                "Cambiar offset Norte",
              )
            }
          />
        </div>
        <div className="col-span-2">
          <label className="font-semibold text-muted-foreground flex items-center justify-between mb-1">
            <span>Tamaño visual global (Fase B1)</span>
            <span className="font-mono text-foreground">
              {Math.round((config.visualScale ?? 1) * 100)}%
            </span>
          </label>
          <input
            type="range"
            min={1.0}
            max={1.25}
            step={0.01}
            value={config.visualScale ?? 1.0}
            onChange={(e) =>
              onApplyConfig(
                { ...config, visualScale: parseFloat(e.target.value) || 1.0 },
                "Ajustar escala visual global de lotes",
              )
            }
            className="w-full accent-amber-500 cursor-pointer mt-1.5"
          />
        </div>
      </div>

      {/* Toggle Corrección de terreno SO (Fase A5) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/60 p-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <Sliders className="size-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold text-foreground">
              Corrección de terreno Suroeste (config.terrainPatch)
            </span>
            <p className="text-[11px] text-muted-foreground">
              Compensa la depresión topográfica hacia la portería/lago principal (s:{" "}
              {config.terrainPatch?.sStartM ?? DEFAULT_SOUTHWEST_TERRAIN_PATCH.sStartM}..
              {config.terrainPatch?.sEndM ?? DEFAULT_SOUTHWEST_TERRAIN_PATCH.sEndM}m, estiramiento
              lineal{" "}
              {config.terrainPatch?.stretchLinear ?? DEFAULT_SOUTHWEST_TERRAIN_PATCH.stretchLinear}
              m).
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={swPatchEnabled}
            onChange={(e) =>
              onApplyConfig(
                {
                  ...config,
                  terrainPatch: {
                    ...DEFAULT_SOUTHWEST_TERRAIN_PATCH,
                    ...config.terrainPatch,
                    enabled: e.target.checked,
                  },
                },
                e.target.checked
                  ? "Activar corrección de terreno SO"
                  : "Desactivar corrección de terreno SO",
              )
            }
            className="rounded border-border"
          />
          <span>{swPatchEnabled ? "Activada (Por defecto)" : "Desactivada"}</span>
        </label>
      </div>

      {/* 4. Lista de puntos de control + Añadir nuevo punto (Fase A4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
        <div className="lg:col-span-8 space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <div className="text-xs font-semibold text-muted-foreground">
            Puntos de control activos (error en ° y en metros sobre terreno):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {controlPoints.map((cp) => {
              const err = currentEval.pointErrorsDeg.find((e) => e.id === cp.id);
              const [obsYaw, obsPitch] = cp.panoDeg ?? radToDegPair(cp.panoRad);
              return (
                <div
                  key={cp.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background/80 px-2.5 py-1.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate text-foreground">{cp.label}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      Yaw {obsYaw.toFixed(1)}° · Pitch {obsPitch.toFixed(1)}° ·{" "}
                      <span
                        className={
                          (err?.angularErrorDeg ?? 0) > 4
                            ? "text-rose-500 font-bold"
                            : "text-emerald-600 dark:text-emerald-400 font-bold"
                        }
                      >
                        Err: {err?.angularErrorDeg ?? 0}° ({err?.errorMeters ?? 0}m)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {lastClickedPanoPos && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px] cursor-pointer"
                        onClick={() => handleMoveControlPointToLastClick(cp.id)}
                        title="Mover este punto de control al último lugar clicado en el 360"
                      >
                        Ubicar aquí
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteControlPoint(cp.id)}
                      className="p-1 text-muted-foreground hover:text-rose-500 cursor-pointer"
                      title="Borrar punto de control"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Añadir punto de control + Historial de últimas 10 versiones (Fase A6) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl border bg-background/70 p-2.5 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span>Añadir punto de control</span>
              {lastClickedPanoPos && (
                <span className="font-mono text-[10px] text-amber-500">
                  Clic 360: {lastClickedPanoPos.yawDeg.toFixed(1)}°,{" "}
                  {lastClickedPanoPos.pitchDeg.toFixed(1)}°
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Input
                placeholder="Etiqueta"
                value={newCpLabel}
                onChange={(e) => setNewCpLabel(e.target.value)}
                className="h-7 text-xs"
              />
              <Input
                placeholder="Latitud"
                value={newCpLat}
                onChange={(e) => setNewCpLat(e.target.value)}
                className="h-7 text-xs font-mono"
              />
              <Input
                placeholder="Longitud"
                value={newCpLng}
                onChange={(e) => setNewCpLng(e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs cursor-pointer"
              onClick={handleAddControlPoint}
            >
              <Plus className="mr-1 size-3.5" />
              Añadir punto en posición actual
            </Button>
          </div>

          {versionHistory.length > 0 && (
            <div className="rounded-xl border bg-background/70 p-2.5 space-y-1.5 text-xs">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <History className="size-3.5 text-amber-500" />
                <span>Últimas versiones guardadas ({versionHistory.length}/10)</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {versionHistory.map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between gap-2 rounded border bg-muted/30 px-2 py-1 text-[11px]"
                  >
                    <div className="truncate">
                      <span className="font-bold">v{snap.version}</span>{" "}
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {snap.status === "published" ? "Publicado" : "Borrador"}
                      </Badge>{" "}
                      <span className="text-muted-foreground">
                        {new Date(snap.createdAt || snap.savedAt || Date.now()).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 cursor-pointer"
                      onClick={() => onRestoreVersion(snap)}
                    >
                      <RotateCcw className="mr-1 size-2.5" />
                      Restaurar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
