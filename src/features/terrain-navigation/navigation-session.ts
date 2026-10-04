import { insideGeofence, gpsToSvg } from "./gps-projection";
import { matchRoad, pointDistanceMeters } from "./road-matching";
import { findRenderableInternalRoute } from "./route-graph";
import type { TravelMode } from "./types";
import type { validateNavigationBundle } from "./navigation-schema";

export function resolveTerrainNavigation(
  loaded: ReturnType<typeof validateNavigationBundle>,
  lotId: string | undefined,
  mode: TravelMode,
  position: Pick<GeolocationCoordinates, "latitude" | "longitude" | "accuracy"> | null,
  timestamp: number | null,
  now: number,
) {
  const access = loaded.bundle.destinations.find((d) => d.lotId === lotId);
  if (!access)
    return {
      route: null,
      message: "Este lote todavía no tiene un acceso validado.",
      fromGps: false,
    };
  if (!position)
    return {
      route: findRenderableInternalRoute(
        loaded.graph,
        loaded.bundle.entranceId,
        access.nodeId,
        mode,
      ),
      message: "Vista previa desde la entrada",
      fromGps: false,
    };
  const invalid = (message: string) => ({ route: null, message, fromGps: false });
  if (!timestamp || now - timestamp > 15000 || timestamp > now + 5000)
    return invalid("GPS desactualizado. Esperando una nueva posición.");
  if (
    ![position.latitude, position.longitude].every(Number.isFinite) ||
    Math.abs(position.latitude) > 90 ||
    Math.abs(position.longitude) > 180
  )
    return invalid("Posición GPS inválida.");
  if (!Number.isFinite(position.accuracy) || position.accuracy < 0 || position.accuracy > 15)
    return invalid("Precisión insuficiente para distinguir vías. Esperando mejor señal.");
  if (!insideGeofence(gpsToSvg(position, loaded.transform), loaded.bundle.geofence))
    return invalid("Estás fuera del proyecto. Acércate al acceso principal.");
  const match = matchRoad(loaded.bundle, loaded.transform, position, mode, position.accuracy);
  if (match.status !== "matched")
    return invalid(
      match.status === "ambiguous"
        ? "GPS entre varias vías. Esperando mejor precisión."
        : "No podemos ubicarte en una vía validada.",
    );
  const route = findRenderableInternalRoute(match.graph, match.originId, access.nodeId, mode);
  if (!route) return invalid("No hay una ruta abierta para este modo de recorrido.");
  const accessPoint = loaded.graph.nodes.find((n) => n.id === access.nodeId)!.point;
  const arrived =
    position.accuracy <= 10 &&
    route.result.distanceMeters <= 8 &&
    pointDistanceMeters(gpsToSvg(position, loaded.transform), accessPoint, loaded.transform) <= 8;
  return {
    route,
    message: arrived
      ? "Llegaste al acceso del lote."
      : `${Math.round(route.result.distanceMeters)} m por vías hasta el acceso`,
    fromGps: true,
  };
}
