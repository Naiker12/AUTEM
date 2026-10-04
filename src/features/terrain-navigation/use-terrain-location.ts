import { useCallback, useEffect, useRef, useState } from "react";

export type LocationStatus =
  "idle" | "requesting" | "ready" | "low_accuracy" | "denied" | "unavailable";
export interface ProjectAnchor {
  lat: number;
  lng: number;
}
const MAX_ACCURACY_METERS = 60;

export function distanceToAnchor(latitude: number, longitude: number, anchor: ProjectAnchor) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((latitude - anchor.lat) * rad) / 2) ** 2 +
    Math.cos(anchor.lat * rad) *
      Math.cos(latitude * rad) *
      Math.sin(((longitude - anchor.lng) * rad) / 2) ** 2;
  return 2 * 6_371_000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** GPS is temporary; it is not an SVG origin until a calibration is published. */
export function useTerrainLocation(anchor: ProjectAnchor) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const requestGeneration = useRef(0);
  const watchId = useRef<number | null>(null);
  const clearWatch = useCallback(() => {
    requestGeneration.current += 1;
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
  }, []);
  const stop = useCallback(() => {
    clearWatch();
    setPosition(null);
    setTimestamp(null);
    setStatus("idle");
  }, [clearWatch]);
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      clearWatch();
    };
  }, [clearWatch, stop]);
  const request = useCallback(() => {
    clearWatch();
    setPosition(null);
    setTimestamp(null);
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("requesting");
    const generation = requestGeneration.current;
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords, timestamp: capturedAt }) => {
        if (generation !== requestGeneration.current) return;
        setTimestamp(capturedAt);
        setPosition(coords);
        setStatus(coords.accuracy > MAX_ACCURACY_METERS ? "low_accuracy" : "ready");
      },
      (error) => {
        if (generation !== requestGeneration.current) return;
        clearWatch();
        setPosition(null);
        setTimestamp(null);
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  }, [clearWatch]);
  const distance =
    position && status === "ready"
      ? Math.round(distanceToAnchor(position.latitude, position.longitude, anchor))
      : null;
  const message = {
    idle: "Usa el GPS para consultar tu proximidad al proyecto.",
    requesting: "Solicitando tu ubicación…",
    ready: `GPS activo · precisión aproximada ±${Math.round(position?.accuracy ?? 0)} m. El punto en el plano requiere calibración.`,
    low_accuracy:
      "Precisión baja. Prueba en una zona despejada; puedes seguir explorando el plano.",
    denied: "Permiso rechazado. Puedes localizar el lote sin activar el GPS.",
    unavailable: "No pudimos obtener tu ubicación. Comprueba el GPS y la conexión HTTPS.",
  }[status];
  return { status, position, timestamp, distance, message, request, stop };
}
