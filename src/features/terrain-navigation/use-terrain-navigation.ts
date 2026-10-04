import { useEffect, useMemo, useState } from "react";
import { loadPublishedNavigation } from "@/lib/navigation-repository";
import { resolveTerrainNavigation } from "./navigation-session";
import type { TravelMode } from "./types";

type Loaded = Awaited<ReturnType<typeof loadPublishedNavigation>>;
export function useTerrainNavigation(
  projectId: string | undefined,
  slug: string,
  masterplanVersion: string | undefined,
  lotId: string | undefined,
  mode: TravelMode,
  position: GeolocationCoordinates | null,
  timestamp: number | null,
) {
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let active = true;
    setLoaded(null);
    setError("");
    setLoading(true);
    if (!projectId) {
      setLoading(false);
      return;
    }
    void loadPublishedNavigation(projectId, slug, masterplanVersion)
      .then((value) => {
        if (active) setLoaded(value);
      })
      .catch(() => {
        if (active) setError("Red temporalmente no disponible.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, slug, masterplanVersion]);
  useEffect(() => {
    if (!position) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, [position]);
  const result = useMemo(() => {
    if (!loaded)
      return {
        route: null,
        message: loading ? "Cargando red…" : error || "Recorridos pendientes de validar.",
        fromGps: false,
      };
    return resolveTerrainNavigation(loaded, lotId, mode, position, timestamp, now);
  }, [loaded, lotId, position, timestamp, mode, now, loading, error]);
  return { ...result, available: Boolean(loaded), loading };
}
