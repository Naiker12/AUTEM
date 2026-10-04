import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import ts from "typescript";
const require = createRequire(import.meta.url);
const urls = new Map();
async function loadUrl(file) {
  const url = new URL(file, import.meta.url);
  if (urls.has(url.href)) return urls.get(url.href);
  let code = ts.transpileModule(await readFile(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const match of [...code.matchAll(/from "([^"]+)"/g)]) {
    const target = match[1];
    const resolved = target.startsWith(".")
      ? await loadUrl(new URL(target + ".ts", url).href)
      : pathToFileURL(require.resolve(target)).href;
    code = code.replace('from "' + target + '"', 'from "' + resolved + '"');
  }
  const result = "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  urls.set(url.href, result);
  return result;
}
const load = async (file) =>
  import(await loadUrl("../src/features/terrain-navigation/" + file + ".ts"));
const { validateNavigationBundle } = await load("navigation-schema");
const { resolveTerrainNavigation } = await load("navigation-session");
const { matchRoad } = await load("road-matching");
const { findInternalRoute } = await load("route-graph");
const { gpsDistance, svgToGps } = await load("gps-projection");
const { fitAffineTransform } = await load("coordinate-transform");
await mkdir("tmp/navigation-tests", { recursive: true });
const gps = (p) => ({ longitude: -75 + p.x / 100000, latitude: 10 + p.y / 100000 });
const controls = [
  { x: 100, y: 100 },
  { x: 900, y: 100 },
  { x: 100, y: 900 },
  { x: 900, y: 900 },
].map((p, i) => ({
  label: `Control ${i}`,
  source: { x: gps(p).longitude, y: gps(p).latitude },
  target: p,
  accuracy: 5,
}));
const transform = fitAffineTransform(controls);
const geometryA = [
    { x: 200, y: 400 },
    { x: 350, y: 450 },
    { x: 500, y: 400 },
  ],
  geometryB = [
    { x: 500, y: 400 },
    { x: 800, y: 400 },
  ];
const length = (points) =>
  points
    .slice(1)
    .reduce(
      (sum, p, i) => sum + gpsDistance(svgToGps(points[i], transform), svgToGps(p, transform)),
      0,
    );
const fixture = {
  projectSlug: "test-project",
  version: "test-v1",
  masterplanVersion: "test-plan",
  entranceId: "entrance",
  bounds: { width: 1000, height: 1000 },
  geofence: [
    { x: 50, y: 50 },
    { x: 950, y: 50 },
    { x: 950, y: 950 },
    { x: 50, y: 950 },
  ],
  calibration: {
    controls,
    checkpoints: [
      { x: 350, y: 250 },
      { x: 650, y: 650 },
    ].map((p, i) => ({ label: `Check ${i}`, gps: gps(p), point: p, accuracy: 5 })),
  },
  nodes: [
    { id: "entrance", label: "Entry", kind: "entrance", point: geometryA[0] },
    { id: "junction", label: "Crossing", kind: "intersection", point: geometryB[0] },
    { id: "access", label: "Lot access", kind: "destination", point: geometryB[1] },
  ],
  edges: [
    {
      id: "a",
      from: "entrance",
      to: "junction",
      lengthMeters: length(geometryA),
      modes: ["walking"],
      isBidirectional: true,
      isOpen: true,
      geometry: geometryA,
    },
    {
      id: "b",
      from: "junction",
      to: "access",
      lengthMeters: length(geometryB),
      modes: ["walking"],
      isBidirectional: true,
      isOpen: true,
      geometry: geometryB,
    },
  ],
  destinations: [{ lotId: "L-45", nodeId: "access" }],
};
const validated = validateNavigationBundle(fixture, "test-project");
assert(validated.maxErrorMeters < 0.001);
const reject = (mutate) => {
  const f = structuredClone(fixture);
  mutate(f);
  assert.throws(() => validateNavigationBundle(f));
};
reject((f) => (f.nodes[1].id = f.nodes[0].id));
reject((f) => (f.edges[0].to = "unknown"));
reject((f) => (f.edges[0].isOpen = false));
reject((f) => (f.edges[0].lengthMeters = 1));
reject((f) => (f.calibration.checkpoints[0].point.x += 100));
reject((f) => (f.calibration.checkpoints[1] = f.calibration.checkpoints[0]));
reject((f) => f.geofence.fill({ x: 1, y: 1 }));
reject((f) => (f.nodes[0].id = "__gps_origin__"));
reject((f) => (f.edges[0].geometry[0] = { x: 201, y: 400 }));
reject((f) => (f.calibration.controls[0].source.x = undefined));
const now = Date.now();
const resolve = (point, accuracy = 5, timestamp = now) =>
  resolveTerrainNavigation(
    validated,
    "L-45",
    "walking",
    point ? { ...gps(point), accuracy } : null,
    timestamp,
    now,
  );
assert(resolve(null).route);
assert(resolve({ x: 650, y: 400 }).fromGps);
assert(
  resolve({ x: 650, y: 400 }).route.result.distanceMeters <
    resolve(null).route.result.distanceMeters,
);
assert.equal(resolve({ x: 650, y: 400 }, 30).route, null);
assert.equal(resolve({ x: 650, y: 400 }, 5, now - 16000).route, null);
assert.equal(resolve({ x: 970, y: 400 }).route, null);
assert.equal(resolve({ x: 500, y: 800 }).route, null);
assert.equal(
  resolveTerrainNavigation(validated, "unknown", "walking", null, null, now).route,
  null,
);
assert.equal(resolve({ x: 800, y: 400 }).message, "Llegaste al acceso del lote.");
const oneWay = structuredClone(fixture);
oneWay.edges[0].isBidirectional = false;
const match = matchRoad(oneWay, transform, gps({ x: 350, y: 450 }), "walking", 5);
assert.equal(match.status, "matched");
assert.equal(
  findInternalRoute(match.graph, match.originId, "entrance", "walking").status,
  "no_route",
);
assert.equal(findInternalRoute(match.graph, match.originId, "access", "walking").status, "found");
const ambiguous = structuredClone(fixture);
ambiguous.edges.push({
  id: "parallel",
  from: "other-a",
  to: "other-b",
  lengthMeters: 660,
  modes: ["walking"],
  isOpen: true,
  isBidirectional: true,
  geometry: [
    { x: 500, y: 410 },
    { x: 800, y: 410 },
  ],
});
assert.equal(
  matchRoad(ambiguous, transform, gps({ x: 650, y: 405 }), "walking", 5).status,
  "ambiguous",
);
await writeFile("tmp/navigation-tests/fixture.json", JSON.stringify(fixture));
console.log(
  "Pruebas del piloto: calibración independiente, geometría, geocerca, GPS, acceso real, desvío y sentido único. Datos sintéticos; no publicados.",
);
