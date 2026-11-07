import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyOverride,
  computeControlPointYawCoverage,
  computeLotsConfidence,
  computeSphericalCentroidRad,
  evaluateCalibration,
  mergeOverridesSafe,
  mergePanoramaLotsWithOverrides,
  moveLotVertexWithSnap,
  projectCadPointToPanoramaRad,
  projectMasterplanLots,
  transformLotsWithPerspective,
  unprojectPanoramaRadToCadPoint,
} from "../../src/features/panorama-360/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const rawLots = JSON.parse(
  fs.readFileSync(path.join(rootDir, "src/data/villa-paraiso/lots.json"), "utf8"),
);
const generatedPanoramaLots = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, "src/data/villa-paraiso/generated/panorama-lots.json"),
    "utf8",
  ),
);

console.log("=== Ejecutando suite de pruebas unitarias y regresión 360° ===");

// 1. Prueba de regresión: Sin overrides nuevos ni visualScale, la proyección es idéntica (< 1e-6 rad)
{
  const config = structuredClone(generatedPanoramaLots.config);
  const reprojected = projectMasterplanLots(rawLots, config);
  assert.equal(
    reprojected.length,
    generatedPanoramaLots.lots.length,
    "El número de lotes proyectados debe coincidir exactamente con el baseline",
  );

  let maxDiffRad = 0;
  for (let i = 0; i < reprojected.length; i++) {
    const a = reprojected[i];
    const b = generatedPanoramaLots.lots[i];
    assert.equal(a.id, b.id);
    assert.equal(a.verticesRad.length, b.verticesRad.length);
    for (let v = 0; v < a.verticesRad.length; v++) {
      const dy = Math.abs(a.verticesRad[v][0] - b.verticesRad[v][0]);
      const dp = Math.abs(a.verticesRad[v][1] - b.verticesRad[v][1]);
      if (dy > maxDiffRad) maxDiffRad = dy;
      if (dp > maxDiffRad) maxDiffRad = dp;
    }
  }
  assert.ok(
    maxDiffRad < 1e-6,
    `Diferencia máxima de regresión (${maxDiffRad} rad) debe ser < 1e-6 rad`,
  );
  console.log(`✓ Regresión de proyección base: OK (max diff = ${maxDiffRad} rad < 1e-6)`);
}

// 2. Prueba de applyOverride: Identidad con override vacío y exactitud con verticesRad legado
{
  const baseVerts = [
    [0.2, -0.4],
    [0.25, -0.4],
    [0.25, -0.45],
    [0.2, -0.45],
  ];
  const resNull = applyOverride(baseVerts, null);
  assert.deepEqual(resNull, baseVerts, "applyOverride(null) debe devolver baseVertices intactos");

  const customVerts = [
    [0.3, -0.5],
    [0.35, -0.5],
    [0.35, -0.55],
    [0.3, -0.55],
  ];
  const resLegacy = applyOverride(baseVerts, {
    verticesRad: customVerts,
    updatedAt: "2026-11-06T00:00:00Z",
  });
  assert.deepEqual(
    resLegacy,
    customVerts,
    "applyOverride con verticesRad legado debe preservar resultado idéntico",
  );
  console.log("✓ applyOverride (identidad y compatibilidad legado): OK");
}

// 3. Prueba de applyOverride paramétrico: wrap ±π en yaw, clamp en pitch y escalado desde centroide
{
  const nearSeamVerts = [
    [Math.PI - 0.02, -0.5],
    [Math.PI - 0.01, -0.5],
    [Math.PI - 0.01, -0.55],
    [Math.PI - 0.02, -0.55],
  ];
  const shifted = applyOverride(nearSeamVerts, {
    delta: {
      dYawRad: 0.08,
      dPitchRad: -2.0, // forzar clamp a -PI/2
      scale: 1.1,
      rotateRad: 0,
    },
    updatedAt: "2026-11-06T00:00:00Z",
  });

  for (const [y, p] of shifted) {
    assert.ok(y >= -Math.PI && y <= Math.PI, `Yaw (${y}) debe mantenerse dentro de [-π, π]`);
    assert.ok(
      p >= -Math.PI / 2 && p <= Math.PI / 2,
      `Pitch (${p}) debe mantenerse dentro de [-π/2, π/2]`,
    );
  }

  // Verificar que escalar alrededor del centroide conserva el centroide
  const normalVerts = [
    [0.4, -0.4],
    [0.44, -0.4],
    [0.44, -0.44],
    [0.4, -0.44],
  ];
  const cBefore = computeSphericalCentroidRad(normalVerts);
  const scaled = applyOverride(normalVerts, {
    delta: { dYawRad: 0, dPitchRad: 0, scale: 1.2, rotateRad: 0 },
    updatedAt: "2026-11-06T00:00:00Z",
  });
  const cAfter = computeSphericalCentroidRad(scaled);
  assert.ok(Math.abs(cBefore[0] - cAfter[0]) < 1e-3, "Centroide yaw estable al escalar");
  assert.ok(Math.abs(cBefore[1] - cAfter[1]) < 1e-3, "Centroide pitch estable al escalar");
  console.log("✓ applyOverride paramétrico (wrap ±π, clamp pitch, centroide): OK");
}

// 4. Conversión metros CAD ↔ ángulos panorama (ida y vuelta fuera del parche SO)
{
  const cfg = {
    ...structuredClone(generatedPanoramaLots.config),
    terrainPatch: { enabled: false },
  };
  const testEast = 858450;
  const testNorth = 1646220;
  const [yawRad, pitchRad] = projectCadPointToPanoramaRad(testEast, testNorth, cfg);
  const [recEast, recNorth] = unprojectPanoramaRadToCadPoint(yawRad, pitchRad, cfg);
  const distErrM = Math.hypot(recEast - testEast, recNorth - testNorth);
  assert.ok(
    distErrM < 0.25,
    `Conversión metros↔ángulos debe invertir con error < 0.25m (obtenido: ${distErrM.toFixed(4)}m)`,
  );
  console.log(`✓ Conversión metros CAD ↔ ángulos (error ida/vuelta = ${distErrM.toFixed(4)}m): OK`);
}

// 5. Transformación con perspectiva real (metros CAD) y merge seguro de overrides
{
  const config = structuredClone(generatedPanoramaLots.config);
  const baseLots = projectMasterplanLots(rawLots, config);
  const nextOverrides = transformLotsWithPerspective({
    targetLotIds: ["L-03"],
    baseLots,
    currentOverrides: {},
    config,
    dYawDeg: 0.4,
    dPitchDeg: -0.2,
    scaleFactor: 1.05,
    scaleXFactor: 1.02,
    scaleYFactor: 1.0,
    usePerspectiveMeters: true,
  });

  assert.ok(nextOverrides["L-03"], "Debe generar override para L-03");
  assert.ok(nextOverrides["L-03"].delta, "Debe incluir objeto paramétrico delta");
  assert.ok(
    typeof nextOverrides["L-03"].delta.offsetEastM === "number",
    "Debe almacenar offset en metros (offsetEastM)",
  );

  // Merge seguro entre sesiones: no debe perder lotes de otra sesión
  const remote = {
    "L-01": {
      verticesRad: baseLots[0].verticesRad,
      updatedAt: "2026-11-06T10:00:00Z",
    },
    "L-03": {
      verticesRad: baseLots[2].verticesRad,
      updatedAt: "2026-11-05T10:00:00Z",
    },
  };
  const mergedMap = mergeOverridesSafe(remote, nextOverrides);
  assert.ok(mergedMap["L-01"], "mergeOverridesSafe debe conservar L-01 remoto");
  assert.equal(
    mergedMap["L-03"].updatedAt,
    nextOverrides["L-03"].updatedAt,
    "mergeOverridesSafe debe preferir el override más reciente para L-03",
  );

  const mergedLots = mergePanoramaLotsWithOverrides(baseLots, mergedMap);
  assert.equal(mergedLots.length, baseLots.length);
  console.log("✓ Transformación con perspectiva 3D y mergeOverridesSafe: OK");
}

// 6. Snap de vértices compartidos entre lotes vecinos
{
  const config = structuredClone(generatedPanoramaLots.config);
  const baseLots = projectMasterplanLots(rawLots, config);
  const l1 = baseLots.find((l) => l.id === "L-01");
  assert.ok(l1 && l1.verticesRad.length >= 3);

  const snapped = moveLotVertexWithSnap({
    lotId: "L-01",
    vertexIndex: 0,
    newYawRad: l1.verticesRad[0][0] + 0.005,
    newPitchRad: l1.verticesRad[0][1] - 0.003,
    baseLots,
    currentOverrides: {},
    enableSnap: true,
  });
  assert.ok(snapped["L-01"], "Debe actualizar el vértice de L-01");
  console.log(
    `✓ Snap de vértices compartidos: OK (${Object.keys(snapped).length} lote(s) actualizados en arista compartida)`,
  );
}

// 7. Evaluación de calibración, cobertura 360° y detección de lotes dudosos
{
  const config = structuredClone(generatedPanoramaLots.config);
  const controlPoints = generatedPanoramaLots.controlPoints;
  const evalRes = evaluateCalibration(config, controlPoints);
  assert.ok(evalRes.rmsErrorDeg > 0 && evalRes.rmsErrorDeg < 10);
  assert.ok(evalRes.meanErrorMeters > 0);

  const coverage = computeControlPointYawCoverage(controlPoints);
  assert.equal(coverage.sectors.length, 12);

  const confidence = computeLotsConfidence(generatedPanoramaLots.lots, controlPoints, {});
  const doubtfulCount = confidence.filter((c) => c.isDoubtful).length;
  assert.ok(doubtfulCount > 0, "Debe detectar los lotes a >= 20° del punto de control más cercano");
  console.log(
    `✓ Diagnóstico de calibración: RMS ${evalRes.rmsErrorDeg}° (${evalRes.meanErrorMeters}m), dudosos = ${doubtfulCount}`,
  );
}

console.log("=== Todas las pruebas 360° pasaron con éxito ===");
