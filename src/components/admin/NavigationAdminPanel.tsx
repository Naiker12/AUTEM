import {
  masterplanBounds,
  renderedMasterplanVersion,
} from "@/features/terrain-navigation/masterplan-version";
import type { CalibrationPointInput } from "@/features/terrain-navigation/calibration";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  auditNavigation,
  listNavigationVersions,
  publishNavigation,
  saveNavigationDraft,
} from "@/lib/navigation-repository";
import { validateNavigationBundle } from "@/features/terrain-navigation/navigation-schema";

type Audit = Awaited<ReturnType<typeof auditNavigation>>;
export default function NavigationAdminPanel({
  projectId,
  points,
  lot45Id,
}: {
  projectId?: string;
  points: CalibrationPointInput[];
  lot45Id?: string;
}) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [json, setJson] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Awaited<
    ReturnType<typeof listNavigationVersions>
  > | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const createTemplate = async () => {
    const gpsValue = (value: number | undefined) => value ?? null;
    const planValue = (value: string) => (value.trim() ? Number(value) : null);
    const payload = {
      projectSlug: "villa-paraiso",
      version: "piloto-45-v1",
      masterplanVersion: await renderedMasterplanVersion(),
      entranceId: "main-entrance",
      bounds: masterplanBounds,
      geofence: [],
      calibration: {
        controls: points
          .filter((p) => !p.id.startsWith("check-"))
          .map((p) => ({
            label: p.label,
            source: { x: gpsValue(p.longitude), y: gpsValue(p.latitude) },
            target: { x: planValue(p.svgX), y: planValue(p.svgY) },
            accuracy: gpsValue(p.accuracy),
          })),
        checkpoints: points
          .filter((p) => p.id.startsWith("check-"))
          .map((p) => ({
            label: p.label,
            gps: { longitude: gpsValue(p.longitude), latitude: gpsValue(p.latitude) },
            point: { x: planValue(p.svgX), y: planValue(p.svgY) },
            accuracy: gpsValue(p.accuracy),
          })),
      },
      nodes: [
        {
          id: "main-entrance",
          label: "Acceso principal",
          kind: "entrance",
          point: { x: null, y: null },
        },
        {
          id: "junction-1",
          label: "Cruce piloto",
          kind: "intersection",
          point: { x: null, y: null },
        },
        {
          id: "access-lot-45",
          label: "Acceso real al lote 45",
          kind: "destination",
          point: { x: null, y: null },
        },
      ],
      edges: [
        {
          id: "entrance-junction",
          from: "main-entrance",
          to: "junction-1",
          lengthMeters: null,
          modes: ["walking"],
          isBidirectional: true,
          isOpen: true,
          geometry: [],
        },
        {
          id: "junction-lot-45",
          from: "junction-1",
          to: "access-lot-45",
          lengthMeters: null,
          modes: ["walking"],
          isBidirectional: true,
          isOpen: true,
          geometry: [],
        },
      ],
      destinations: [{ lotId: lot45Id ?? null, nodeId: "access-lot-45" }],
    };
    setJson(JSON.stringify(payload, null, 2));
    setDraftId(null);
    setReviewed(false);
    setMessage(
      "Plantilla creada con tus capturas. Completa geocerca, vías y acceso real; los campos pendientes permanecen vacíos.",
    );
  };
  const refresh = async () => {
    if (!projectId) return;
    setBusy(true);
    try {
      setAudit(await auditNavigation(projectId));
      setVersions(await listNavigationVersions(projectId));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible consultar la red.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!projectId) return;
    let active = true;
    void listNavigationVersions(projectId)
      .then((value) => {
        if (active) setVersions(value);
      })
      .catch(() => {
        if (active) setVersions(null);
      });
    void auditNavigation(projectId)
      .then((value) => {
        if (active) setAudit(value);
      })
      .catch((error) => {
        if (active)
          setMessage(error instanceof Error ? error.message : "No fue posible consultar la red.");
      });
    return () => {
      active = false;
    };
  }, [projectId]);
  const save = async () => {
    if (!projectId) return;
    setBusy(true);
    try {
      const payload = JSON.parse(json);
      if (!payload || typeof payload !== "object" || Array.isArray(payload))
        throw new Error("El borrador debe ser un objeto JSON.");
      setDraftId(await saveNavigationDraft(projectId, payload));
      setVersions(await listNavigationVersions(projectId));
      setMessage("Borrador guardado en Supabase; todavía no es público.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar.");
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    if (!draftId || !reviewed) return;
    setBusy(true);
    try {
      validateNavigationBundle(JSON.parse(json), "villa-paraiso");
      await publishNavigation(draftId);
      setMessage("Versión publicada. Los visitantes ya pueden consultar la red aprobada.");
      setDraftId(null);
      await refresh();
      setMessage("Versión publicada. Los visitantes ya pueden consultar la red aprobada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible publicar.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="mt-6 max-w-5xl">
      <CardHeader>
        <CardTitle>Red de navegación · Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Revisa datos reales con tu sesión administrativa. Publica únicamente después de medir y
          comprobar el recorrido en terreno.
        </p>
        <Button variant="outline" disabled={busy || !projectId} onClick={refresh}>
          Actualizar auditoría
        </Button>
        {audit && (
          <div data-testid="navigation-audit" className="space-y-2 rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">Tablas de captura existentes</p>
            <p>Rol: {audit.role}</p>
            <p>
              Nodos: {audit.nodes.length} · Validados:{" "}
              {audit.nodes.filter((n) => n.validation_status === "validated").length}
            </p>
            <p>
              Tramos: {audit.edges.length} · Validados:{" "}
              {audit.edges.filter((e) => e.validation_status === "validated").length}
            </p>
            <p>Tramos con extremos ajenos al proyecto: {audit.invalidEdges}</p>
            <p>Versión del plano: {audit.masterplanVersion || "Sin asignar"}</p>
            <details>
              <summary className="cursor-pointer">Ver nodos y tramos</summary>
              <ul className="mt-2 max-h-60 overflow-y-auto">
                {audit.nodes.map((n) => (
                  <li key={n.id}>
                    {n.label} · {n.kind} · {n.validation_status}
                  </li>
                ))}
                {audit.edges.map((e) => (
                  <li key={e.id}>
                    {e.length_meters} m · {e.validation_status} ·{" "}
                    {e.is_open ? "Abierto" : "Cerrado"}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
        {versions && !versions.installed && (
          <p role="status" className="rounded-xl border p-3 text-sm">
            Auditoría conectada. Guardar y publicar versiones requiere aplicar la migración de
            navegación en Supabase.
          </p>
        )}
        {versions?.installed && (
          <details className="rounded-xl border p-3 text-sm">
            <summary>Versiones guardadas ({versions.versions.length})</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {versions.versions.map((version) => (
                <Button
                  key={version.id}
                  variant="outline"
                  onClick={() => {
                    setJson(JSON.stringify(version.payload, null, 2));
                    setDraftId(version.status === "draft" ? version.id : null);
                    setReviewed(false);
                  }}
                >
                  {typeof version.payload.version === "string"
                    ? version.payload.version
                    : "Borrador incompleto"}{" "}
                  · {version.status}
                </Button>
              ))}
            </div>
          </details>
        )}
        <Button variant="outline" disabled={busy || !lot45Id} onClick={createTemplate}>
          Crear borrador piloto del lote 45
        </Button>
        <label className="block space-y-2 text-sm">
          <span>Versión piloto en JSON</span>
          <Textarea
            value={json}
            onChange={(e) => {
              setJson(e.target.value);
              setDraftId(null);
              setReviewed(false);
            }}
            rows={6}
            placeholder="Importa el borrador técnico con vías, accesos y mediciones de campo."
          />
        </label>
        <Button
          disabled={busy || !projectId || !json.trim() || !versions?.installed}
          onClick={save}
        >
          Guardar borrador en Supabase
        </Button>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          <span>
            Comprobé en terreno las vías, accesos y puntos independientes de calibración de esta
            versión.
          </span>
        </label>
        <Button disabled={busy || !draftId || !reviewed} onClick={publish}>
          Publicar versión validada
        </Button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
