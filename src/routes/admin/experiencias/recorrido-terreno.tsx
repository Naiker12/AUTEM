import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCopy, Crosshair, MapPin, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lots } from "@/data/lots";
import { villaParaisoNavigationSurvey } from "@/data/villa-paraiso-navigation-survey";
import masterplanLayers from "@/data/villa-paraiso-layers.json";
import MasterplanSvgViewer from "@/components/project-view/MasterplanSvgViewer";
import {
  evaluateCalibration,
  hasValidSvgPoint,
  MAX_GPS_ACCURACY_METERS,
  MIN_CONTROL_POINT_DISTANCE_METERS,
} from "@/features/terrain-navigation/calibration";

export const Route = createFileRoute("/admin/experiencias/recorrido-terreno")({
  component: TerrainSurveyPage,
});

type SurveyPoint = {
  id: string;
  label: string;
  hint: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  capturedAt?: string;
  svgX: string;
  svgY: string;
};

const STORAGE_KEY = "autem:villa-paraiso:terrain-survey:v1";
const SVG_WIDTH = masterplanLayers.dimensions.width;
const SVG_HEIGHT = masterplanLayers.dimensions.height;
const initialPoints: SurveyPoint[] = [
  {
    id: "main-entrance",
    label: "Acceso principal",
    hint: "Coincide con la anotación encontrada en el CAD.",
    svgX: "",
    svgY: "",
  },
  {
    id: "junction-1",
    label: "Cruce de vías",
    hint: "Elige un cruce claro y estable.",
    svgX: "",
    svgY: "",
  },
  { id: "landmark", label: "Hito visible", hint: "Ej. rotonda o zona social.", svgX: "", svgY: "" },
  {
    id: "opposite-end",
    label: "Punto lejano",
    hint: "Debe quedar alejado de los tres primeros puntos.",
    svgX: "",
    svgY: "",
  },
];

function TerrainSurveyPage() {
  const [points, setPoints] = useState<SurveyPoint[]>(initialPoints);
  const [message, setMessage] = useState("");
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [activePlanPointId, setActivePlanPointId] = useState(initialPoints[0].id);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as SurveyPoint[];
      if (Array.isArray(parsed) && parsed.length === initialPoints.length) setPoints(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const calibration = useMemo(
    () => evaluateCalibration(points, { width: SVG_WIDTH, height: SVG_HEIGHT }),
    [points],
  );
  const { completedGps, completedSvg, hasAccurateGps, hasSeparatedGps, transform } = calibration;

  const save = (nextPoints: SurveyPoint[]) => {
    setPoints(nextPoints);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPoints));
  };

  const captureLocation = (id: string) => {
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      setMessage("Este navegador necesita HTTPS y GPS activo para capturar el punto.");
      return;
    }
    setCapturingId(id);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        save(
          points.map((point) =>
            point.id === id
              ? {
                  ...point,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: Math.round(position.coords.accuracy),
                  capturedAt: new Date().toISOString(),
                }
              : point,
          ),
        );
        setCapturingId(null);
      },
      (error) => {
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "No se concedió permiso de ubicación."
            : "No pudimos obtener el punto. Intenta de nuevo en una zona despejada.",
        );
        setCapturingId(null);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );
  };

  const updateSvgPoint = (id: string, field: "svgX" | "svgY", value: string) => {
    save(points.map((point) => (point.id === id ? { ...point, [field]: value } : point)));
  };

  const draft = useMemo(
    () => ({
      project: "Villa Paraíso",
      purpose: "Calibración GPS a SVG; borrador local no publicado",
      status: calibration.canCalculate
        ? "ready_for_technical_review"
        : "incomplete_requires_field_gps",
      sourceCad: villaParaisoNavigationSurvey.source,
      points,
      calibration: transform,
    }),
    [calibration.canCalculate, points, transform],
  );

  const copyDraft = async () => {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    setMessage(
      transform
        ? "Calibración copiada. Envíala al equipo técnico para validación."
        : "Borrador incompleto copiado. Podrás añadir las capturas GPS en obra después.",
    );
  };

  const clearGpsCapture = (id: string) => {
    save(
      points.map((point) =>
        point.id === id
          ? {
              ...point,
              latitude: undefined,
              longitude: undefined,
              accuracy: undefined,
              capturedAt: undefined,
            }
          : point,
      ),
    );
    setMessage("Captura GPS eliminada del borrador.");
  };

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-4 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Villa Paraíso · Operación interna
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Calibración de recorrido</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Captura cuatro puntos en obra y marca su posición equivalente en el plano SVG. Ninguna
            ubicación se envía ni publica desde esta pantalla.
          </p>
        </div>
        <Badge variant="outline">Borrador local</Badge>
      </section>

      <Alert className="mt-6 max-w-4xl border-amber-200 bg-amber-50 text-amber-950">
        <MapPin className="size-4" />
        <AlertTitle>Acceso principal identificado en CAD</AlertTitle>
        <AlertDescription>
          Coordenada CAD {villaParaisoNavigationSurvey.primaryEntrance.cadPoint.x.toFixed(3)},{" "}
          {villaParaisoNavigationSurvey.primaryEntrance.cadPoint.y.toFixed(3)}. Confírmala
          físicamente antes de usarla como portería.
        </AlertDescription>
      </Alert>

      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Avance de calibración">
        <Metric label="GPS capturados" value={`${completedGps}/4`} />
        <Metric label="Puntos SVG marcados" value={`${completedSvg}/4`} />
        <Metric label="Estado" value={transform ? "Calibrado" : "Pendiente"} />
      </section>

      <Alert className="mt-6 max-w-5xl border-sky-200 bg-sky-50 text-sky-950">
        <MapPin className="size-4" />
        <AlertTitle>Puedes avanzar desde cualquier lugar</AlertTitle>
        <AlertDescription>
          Marca los cuatro puntos sobre el plano y copia un borrador ahora. Las capturas GPS solo se
          completan cuando alguien esté físicamente en Villa Paraíso; sin ellas no se genera la
          calibración final.
        </AlertDescription>
      </Alert>

      {completedGps === points.length && !hasSeparatedGps && (
        <Alert className="mt-6 max-w-5xl border-amber-200 bg-amber-50 text-amber-950">
          <MapPin className="size-4" />
          <AlertTitle>Las capturas GPS están demasiado cerca</AlertTitle>
          <AlertDescription>
            Debes ir físicamente a la portería, un cruce, un hito y un punto lejano. Deja al menos{" "}
            {MIN_CONTROL_POINT_DISTANCE_METERS} m entre cada captura.
          </AlertDescription>
        </Alert>
      )}

      {completedGps === points.length && !hasAccurateGps && (
        <Alert className="mt-6 max-w-5xl border-amber-200 bg-amber-50 text-amber-950">
          <MapPin className="size-4" />
          <AlertTitle>La precisión GPS aún no es suficiente</AlertTitle>
          <AlertDescription>
            Repite las capturas con precisión igual o menor a ±{MAX_GPS_ACCURACY_METERS} m, en una
            zona despejada y sin moverte antes de guardar cada punto.
          </AlertDescription>
        </Alert>
      )}

      {completedSvg < points.length && (
        <Alert className="mt-6 max-w-5xl border-sky-200 bg-sky-50 text-sky-950">
          <MapPin className="size-4" />
          <AlertTitle>Faltan marcas en el plano</AlertTitle>
          <AlertDescription>
            Selecciona cada punto en su tarjeta, vuelve al mapa y toca exactamente el mismo lugar.
            Valores válidos: X 0–{SVG_WIDTH}, Y 0–{SVG_HEIGHT}.
          </AlertDescription>
        </Alert>
      )}

      {transform && (
        <Alert
          className={`mt-6 max-w-5xl ${transform.rmsError > 35 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
        >
          <CheckCircle2 className="size-4" />
          <AlertTitle>Calibración calculada</AlertTitle>
          <AlertDescription>
            Error RMS: {transform.rmsError.toFixed(1)} unidades SVG con{" "}
            {transform.controlPointCount} puntos.{" "}
            {transform.rmsError > 35
              ? "Revisa los puntos antes de publicar: el error es alto."
              : "Lista para revisión técnica y carga de rutas."}
          </AlertDescription>
        </Alert>
      )}

      <Card id="terrain-calibration-map" className="mt-6 max-w-5xl overflow-hidden rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Marca el punto sobre el plano</CardTitle>
          <CardDescription>
            Punto activo: {points.find((point) => point.id === activePlanPointId)?.label}. Toca una
            zona vacía del plano para registrar automáticamente su X/Y.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-[340px] overflow-hidden rounded-xl border bg-muted/30">
            <MasterplanSvgViewer
              lots={[]}
              selectedLotId=""
              focusRequest={0}
              onSelectLot={() => {}}
              isDesktopSidebarOpen={false}
              isRightPanelOpen={false}
              overlay={
                <g className="pointer-events-none">
                  <g opacity="0.5">
                    {lots.map((lot) =>
                      lot.pathD ? (
                        <path
                          key={lot.id}
                          d={lot.pathD}
                          fill="rgba(255,255,255,0.52)"
                          stroke="#84745e"
                          strokeWidth="1.5"
                        />
                      ) : null,
                    )}
                  </g>
                  {points.map((point, index) => {
                    const x = Number(point.svgX);
                    const y = Number(point.svgY);
                    if (!hasValidSvgPoint(point, { width: SVG_WIDTH, height: SVG_HEIGHT }))
                      return null;
                    const isActive = point.id === activePlanPointId;
                    return (
                      <g key={point.id} transform={`translate(${x} ${y})`}>
                        <circle
                          r={isActive ? 34 : 25}
                          fill={isActive ? "#1677ff" : "#1c2c1e"}
                          stroke="#fff"
                          strokeWidth="7"
                        />
                        <text y="7" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800">
                          {index + 1}
                        </text>
                        <text
                          y="-38"
                          textAnchor="middle"
                          fill="#1c2c1e"
                          fontSize="19"
                          fontWeight="800"
                          stroke="#fff"
                          strokeWidth="5"
                          paintOrder="stroke"
                        >
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              }
              onPlanPointSelect={({ x, y }) => {
                save(
                  points.map((point) =>
                    point.id === activePlanPointId
                      ? {
                          ...point,
                          svgX: Math.round(Math.max(0, Math.min(SVG_WIDTH, x))).toString(),
                          svgY: Math.round(Math.max(0, Math.min(SVG_HEIGHT, y))).toString(),
                        }
                      : point,
                  ),
                );
                setMessage("Punto SVG marcado en el borrador local.");
              }}
            />
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 grid max-w-5xl gap-4 lg:grid-cols-2">
        {points.map((point) => (
          <Card key={point.id} className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span>{point.label}</span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  GPS {point.latitude !== undefined ? "listo" : "pendiente"} · Plano{" "}
                  {hasValidSvgPoint(point, { width: SVG_WIDTH, height: SVG_HEIGHT })
                    ? "listo"
                    : "pendiente"}
                </span>
              </CardTitle>
              <CardDescription>{point.hint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/55 p-3 text-xs text-muted-foreground">
                {point.latitude !== undefined
                  ? `${point.latitude.toFixed(6)}, ${point.longitude?.toFixed(6)} · precisión ±${point.accuracy} m`
                  : "GPS pendiente de captura"}
              </div>
              {point.latitude !== undefined && (
                <button
                  type="button"
                  onClick={() => clearGpsCapture(point.id)}
                  className="text-xs font-medium text-muted-foreground underline underline-offset-4"
                >
                  Quitar esta captura GPS
                </button>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={capturingId === point.id}
                onClick={() => captureLocation(point.id)}
              >
                <Crosshair className="mr-2 size-4" />
                {capturingId === point.id ? "Tomando ubicación…" : "Capturar GPS aquí"}
              </Button>
              <Button
                type="button"
                variant={activePlanPointId === point.id ? "secondary" : "outline"}
                className="w-full"
                onClick={() => {
                  setActivePlanPointId(point.id);
                  setMessage(`Ahora toca ${point.label} en el plano.`);
                  document
                    .getElementById("terrain-calibration-map")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <MapPin className="mr-2 size-4" /> Seleccionar y marcar en el plano
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium">
                  X en SVG
                  <Input
                    value={point.svgX}
                    inputMode="decimal"
                    onChange={(event) => updateSvgPoint(point.id, "svgX", event.target.value)}
                    placeholder="Ej. 1050"
                    className="mt-1"
                  />
                </label>
                <label className="text-xs font-medium">
                  Y en SVG
                  <Input
                    value={point.svgY}
                    inputMode="decimal"
                    onChange={(event) => updateSvgPoint(point.id, "svgY", event.target.value)}
                    placeholder="Ej. 2150"
                    className="mt-1"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 flex max-w-5xl flex-wrap gap-3">
        <Button type="button" disabled={completedSvg === 0} onClick={copyDraft}>
          <ClipboardCopy className="mr-2 size-4" />
          {transform ? "Copiar calibración" : "Copiar borrador incompleto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.localStorage.removeItem(STORAGE_KEY);
            setPoints(initialPoints);
            setMessage("Borrador local eliminado.");
          }}
        >
          <Trash2 className="mr-2 size-4" />
          Limpiar borrador
        </Button>
      </section>
      {message && (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-serif text-xl">{value}</p>
      </CardContent>
    </Card>
  );
}
