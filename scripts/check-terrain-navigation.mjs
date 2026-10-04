import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
async function moduleUrl(file) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const resolved = outputText.includes('from "./coordinate-transform"')
    ? outputText.replace(
        'from "./coordinate-transform"',
        `from "${await moduleUrl("../src/features/terrain-navigation/coordinate-transform.ts")}"`,
      )
    : outputText;
  return `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`;
}
async function load(file) {
  return import(await moduleUrl(file));
}
const { findInternalRoute, findRenderableInternalRoute } = await load(
  "../src/features/terrain-navigation/route-graph.ts",
);
const { matchDestinationLots } = await load(
  "../src/features/terrain-navigation/destination-search.ts",
);
const { evaluateCalibration, hasValidSvgPoint, hasUsableGpsCapture } = await load(
  "../src/features/terrain-navigation/calibration.ts",
);
const { fitAffineTransform, applyAffineTransform } = await load(
  "../src/features/terrain-navigation/coordinate-transform.ts",
);
const bounds = { width: 2400, height: 2324 };
assert.equal(hasValidSvgPoint({ svgX: "", svgY: "" }, bounds), false);
assert.equal(hasUsableGpsCapture({ latitude: 100, longitude: -75, accuracy: 10 }), false);
assert.equal(hasUsableGpsCapture({ latitude: 10, longitude: -75, accuracy: -1 }), false);
const controlPoints = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
].map(([x, y], index) => ({
  id: String(index),
  label: String(index),
  latitude: 10.436829 + y * 0.001,
  longitude: -75.356179 + x * 0.001,
  accuracy: 5,
  svgX: String(100 + x * 200),
  svgY: String(300 - y * 200),
}));
assert.equal(evaluateCalibration(controlPoints.slice(0, 3), bounds).canCalculate, false);
const calibration = evaluateCalibration(controlPoints, bounds);
assert.equal(calibration.canCalculate, true);
const projected = applyAffineTransform(
  { x: -75.356179 + 0.0005, y: 10.436829 + 0.0005 },
  calibration.transform,
);
assert(Math.abs(projected.x - 200) < 0.001 && Math.abs(projected.y - 200) < 0.001);
assert.equal(
  fitAffineTransform(
    [0, 1, 2, 3].map((x) => ({
      source: { x, y: x },
      target: { x: x * 2, y: x * 3 },
      label: String(x),
    })),
  ),
  null,
);
const nodes = [
  { id: "a", point: { x: 0, y: 0 } },
  { id: "b", point: { x: 10000, y: 10000 } },
  { id: "c", point: { x: 1, y: 1 } },
].map((n) => ({ ...n, kind: "intersection", label: n.id }));
const edge = (id, from, to, lengthMeters) => ({
  id,
  from,
  to,
  lengthMeters,
  modes: ["walking"],
  isOpen: true,
  isBidirectional: true,
  svgPath: "M 0 0 L 1 1",
});
const graph = {
  projectSlug: "test",
  version: "1",
  status: "validated",
  nodes,
  edges: [edge("direct", "a", "c", 100), edge("first", "a", "b", 5), edge("second", "b", "c", 5)],
};
assert.deepEqual(findInternalRoute(graph, "a", "c", "walking").edgeIds, ["first", "second"]);
assert.equal(findInternalRoute(graph, "c", "a", "walking").distanceMeters, 10);
assert.equal(
  findInternalRoute({ ...graph, status: "pending_field_validation" }, "a", "c", "walking").status,
  "no_route",
);
assert.equal(findInternalRoute(graph, "a", "c", "driving").status, "no_route");
assert.equal(
  findInternalRoute(
    { ...graph, edges: graph.edges.map((e) => ({ ...e, isOpen: false })) },
    "a",
    "c",
    "walking",
  ).status,
  "no_route",
);
assert.equal(
  findRenderableInternalRoute(
    { ...graph, edges: graph.edges.map((e) => ({ ...e, svgPath: undefined })) },
    "a",
    "c",
    "walking",
  ),
  null,
);
const lot = (n) => ({ id: `L-${n}`, lotNumber: n, centroid: [0, 0] });
assert.deepEqual(
  matchDestinationLots([lot(145), lot(245), lot(45)], "45").map((l) => l.lotNumber),
  [45, 145, 245],
);
assert.deepEqual(
  matchDestinationLots([{ ...lot(45), isReserve: true }, lot(145)], "45").map((l) => l.lotNumber),
  [145],
);
assert.equal(matchDestinationLots([lot(45)], "abc").length, 0);
console.log(
  "16 comprobaciones: rutas, búsqueda, capturas inválidas, calibración GPS y geometrías degeneradas.",
);
