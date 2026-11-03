import { useCallback, useEffect, useRef, useState } from "react";
import { bearingBetween, lerpAngle, metersBetween } from "./svg-geo";

export type LocationStatus =
  "idle" | "requesting" | "ready" | "low_accuracy" | "denied" | "unavailable";
export interface ProjectAnchor {
  lat: number;
  lng: number;
}

/** Precisión (m) a partir de la cual consideramos la señal "buena". */
const MAX_ACCURACY_METERS = 25;
/** Lecturas peores que esto se descartan si ya tenemos una posición confiable. */
const DISCARD_ACCURACY_METERS = 80;
/** Velocidad máxima plausible (m/s). Saltos más rápidos son ruido del GPS. */
const MAX_PLAUSIBLE_SPEED = 40;
/** Sin lecturas durante este tiempo → "buscando señal" (se conserva la última posición). */
const SIGNAL_LOST_MS = 20_000;
/** Desplazamiento mínimo para recalcular el rumbo a partir del movimiento. */
const HEADING_MIN_MOVE_METERS = 4;

export function distanceToAnchor(latitude: number, longitude: number, anchor: ProjectAnchor) {
  return metersBetween([latitude, longitude], [anchor.lat, anchor.lng]);
}

interface FilterState {
  lat: number;
  lng: number;
  variance: number;
  t: number;
}

type DeviceOrientationWithCompass = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

function makeCoords(
  lat: number,
  lng: number,
  accuracy: number,
  raw: GeolocationCoordinates,
): GeolocationCoordinates {
  return {
    latitude: lat,
    longitude: lng,
    accuracy,
    altitude: raw.altitude,
    altitudeAccuracy: raw.altitudeAccuracy,
    heading: raw.heading,
    speed: raw.speed,
    toJSON() {
      return { latitude: lat, longitude: lng, accuracy };
    },
  } as GeolocationCoordinates;
}

/**
 * GPS en vivo para el recorrido en terreno.
 * - Suaviza las lecturas con un filtro de Kalman simple (evita que el punto "salte").
 * - Descarta lecturas imposibles (saltos de cientos de metros, precisión muy mala).
 * - No se apaga si el GPS tarda: conserva la última posición y sigue escuchando.
 * - Calcula el rumbo (heading) con la brújula del teléfono o con el movimiento,
 *   para poder girar el mapa en la dirección en que camina la persona.
 */
export function useTerrainLocation(anchor: ProjectAnchor) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [signalLost, setSignalLost] = useState(false);

  const watchId = useRef<number | null>(null);
  const generation = useRef(0);
  const wantsTracking = useRef(false);
  const filter = useRef<FilterState | null>(null);
  const headingAnchor = useRef<[number, number] | null>(null);
  const movementHeading = useRef<number | null>(null);
  const compassHeading = useRef<number | null>(null);
  const lastSpeed = useRef(0);
  const lastFixAt = useRef(0);

  const publishHeading = useCallback(() => {
    // Caminando despacio o quieto → brújula; en movimiento → rumbo del desplazamiento.
    const preferred =
      lastSpeed.current > 1.2 && movementHeading.current !== null
        ? movementHeading.current
        : (compassHeading.current ?? movementHeading.current);
    if (preferred === null) return;
    setHeading((prev) => {
      if (prev === null) return preferred;
      const next = lerpAngle(prev, preferred, 0.35);
      return Math.abs(next - prev) < 1.5 ? prev : next;
    });
  }, []);

  // Brújula del dispositivo (solo mientras el GPS está activo).
  useEffect(() => {
    if (status === "idle" || status === "denied" || status === "unavailable") return;
    const onOrientation = (event: Event) => {
      const e = event as DeviceOrientationWithCompass;
      let value: number | null = null;
      if (typeof e.webkitCompassHeading === "number") value = e.webkitCompassHeading;
      else if (e.absolute && typeof e.alpha === "number") value = (360 - e.alpha) % 360;
      if (value === null || Number.isNaN(value)) return;
      compassHeading.current = value;
    };
    const hasAbsolute = "ondeviceorientationabsolute" in window;
    const eventName = hasAbsolute ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(eventName, onOrientation, true);
    const timer = window.setInterval(publishHeading, 400);
    return () => {
      window.removeEventListener(eventName, onOrientation, true);
      clearInterval(timer);
    };
  }, [status, publishHeading]);

  const clearWatch = useCallback(() => {
    generation.current += 1;
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const onFix = useCallback(
    (coords: GeolocationCoordinates, capturedAt: number) => {
      const accuracy = Number.isFinite(coords.accuracy) ? coords.accuracy : 999;
      const prev = filter.current;
      const point: [number, number] = [coords.latitude, coords.longitude];

      if (prev) {
        const dt = Math.max(0.001, (capturedAt - prev.t) / 1000);
        const jump = metersBetween([prev.lat, prev.lng], point);
        const prevAccuracy = Math.sqrt(prev.variance);
        // Lectura muy imprecisa cuando ya tenemos una buena → ignorar.
        if (accuracy > DISCARD_ACCURACY_METERS && prevAccuracy < DISCARD_ACCURACY_METERS) return;
        // Salto imposible (más rápido que un carro) y no mejora la precisión → ignorar.
        if (jump / dt > MAX_PLAUSIBLE_SPEED && accuracy >= prevAccuracy) return;
      }

      lastFixAt.current = Date.now();
      setSignalLost(false);

      const speed = coords.speed !== null && Number.isFinite(coords.speed) ? coords.speed : 0;
      lastSpeed.current = speed;

      // Filtro de Kalman (ruido de proceso ~ velocidad de la persona).
      let next: FilterState;
      if (!prev) {
        next = { lat: point[0], lng: point[1], variance: accuracy * accuracy, t: capturedAt };
      } else {
        const dt = Math.max(0, (capturedAt - prev.t) / 1000);
        const q = Math.max(2.5, speed * 1.5);
        const variance = prev.variance + dt * q * q;
        const k = variance / (variance + accuracy * accuracy);
        next = {
          lat: prev.lat + k * (point[0] - prev.lat),
          lng: prev.lng + k * (point[1] - prev.lng),
          variance: (1 - k) * variance,
          t: capturedAt,
        };
      }
      filter.current = next;
      const smoothedAccuracy = Math.min(accuracy, Math.sqrt(next.variance));
      const current: [number, number] = [next.lat, next.lng];

      // Rumbo por movimiento
      if (coords.heading !== null && Number.isFinite(coords.heading) && speed > 0.8) {
        movementHeading.current = coords.heading;
        headingAnchor.current = current;
      } else if (!headingAnchor.current) {
        headingAnchor.current = current;
      } else if (metersBetween(headingAnchor.current, current) >= HEADING_MIN_MOVE_METERS) {
        movementHeading.current = bearingBetween(headingAnchor.current, current);
        headingAnchor.current = current;
      }
      publishHeading();

      setTimestamp(capturedAt);
      setPosition(makeCoords(next.lat, next.lng, smoothedAccuracy, coords));
      setStatus(smoothedAccuracy > MAX_ACCURACY_METERS ? "low_accuracy" : "ready");
    },
    [publishHeading],
  );

  const startWatch = useCallback(() => {
    clearWatch();
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    const current = generation.current;
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords, timestamp: capturedAt }) => {
        if (current !== generation.current) return;
        onFix(coords, capturedAt);
      },
      (error) => {
        if (current !== generation.current) return;
        if (error.code === error.PERMISSION_DENIED) {
          wantsTracking.current = false;
          clearWatch();
          filter.current = null;
          setPosition(null);
          setTimestamp(null);
          setStatus("denied");
          return;
        }
        // TIMEOUT / POSITION_UNAVAILABLE: el navegador sigue intentando.
        // Conservamos la última posición en lugar de "perder" al usuario.
        setSignalLost(true);
        if (!filter.current) setStatus("requesting");
      },
      { enableHighAccuracy: true, maximumAge: 1_000, timeout: 20_000 },
    );
  }, [clearWatch, onFix]);

  const stop = useCallback(() => {
    wantsTracking.current = false;
    clearWatch();
    filter.current = null;
    headingAnchor.current = null;
    movementHeading.current = null;
    compassHeading.current = null;
    setPosition(null);
    setTimestamp(null);
    setHeading(null);
    setSignalLost(false);
    setStatus("idle");
  }, [clearWatch]);

  const request = useCallback(() => {
    wantsTracking.current = true;
    filter.current = null;
    setPosition(null);
    setTimestamp(null);
    setStatus("requesting");
    // iOS exige pedir permiso de brújula dentro del gesto del usuario.
    const orientation = (window as unknown as { DeviceOrientationEvent?: OrientationPermission })
      .DeviceOrientationEvent;
    if (orientation?.requestPermission) {
      orientation.requestPermission().catch(() => undefined);
    }
    startWatch();
  }, [startWatch]);

  // Pausa al ocultar la pestaña y reanuda automáticamente al volver.
  useEffect(() => {
    const onVisibility = () => {
      if (!wantsTracking.current) return;
      if (document.visibilityState === "hidden") clearWatch();
      else startWatch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearWatch();
    };
  }, [clearWatch, startWatch]);

  // Detecta pérdida de señal prolongada sin borrar la última posición.
  useEffect(() => {
    if (status !== "ready" && status !== "low_accuracy") return;
    const timer = window.setInterval(() => {
      if (lastFixAt.current && Date.now() - lastFixAt.current > SIGNAL_LOST_MS) {
        setSignalLost(true);
      }
    }, 5_000);
    return () => clearInterval(timer);
  }, [status]);

  const distance = position
    ? Math.round(distanceToAnchor(position.latitude, position.longitude, anchor))
    : null;

  const message = signalLost
    ? "Buscando señal GPS… mostramos tu última posición conocida."
    : {
        idle: "Activa el GPS para ver tu posición y navegar hasta el lote.",
        requesting: "Buscando tu ubicación…",
        ready: `GPS activo · precisión ±${Math.round(position?.accuracy ?? 0)} m`,
        low_accuracy: `Señal débil (±${Math.round(position?.accuracy ?? 0)} m). Sigue avanzando; se ajusta sola.`,
        denied: "Permiso de ubicación rechazado. Actívalo en la configuración del navegador.",
        unavailable: "No pudimos acceder al GPS. Se requiere HTTPS y ubicación activada.",
      }[status];

  return { status, position, timestamp, heading, signalLost, distance, message, request, stop };
}
