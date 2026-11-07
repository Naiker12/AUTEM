import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeControlPointYawCoverage,
  computeLotsConfidence,
  evaluateCalibration,
  evaluateLeaveOneOutCalibration,
} from "../../src/features/panorama-360/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const generatedPanoramaLots = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, "src/data/villa-paraiso/generated/panorama-lots.json"),
    "utf8",
  ),
);
const rawOverrides = JSON.parse(
  fs.readFileSync(path.join(rootDir, "src/data/villa-paraiso/panorama-overrides.json"), "utf8"),
);

const { config, controlPoints, lots } = generatedPanoramaLots;
const evalRes = evaluateCalibration(config, controlPoints);
const looRes = evaluateLeaveOneOutCalibration(config, controlPoints, {
  fitDroneOffset: true,
  fitTilt: true,
});
const coverage = computeControlPointYawCoverage(controlPoints);
const confidence = computeLotsConfidence(lots, controlPoints, rawOverrides);
const doubtfulLots = confidence
  .filter((c) => c.isDoubtful)
  .sort((a, b) => b.nearestControlPointDeg - a.nearestControlPointDeg);

console.log("=================================================================");
console.log(" REPORTE DE CALIBRACIÓN 360° — VILLA PARAÍSO");
console.log("=================================================================");
console.log(`• Total lotes proyectados : ${lots.length}`);
console.log(`• Total puntos de control : ${controlPoints.length}`);
console.log(
  `• RMS Global              : ${evalRes.rmsErrorDeg}° (~${evalRes.rmsErrorMeters} m RMS)`,
);
console.log(`• Error medio en terreno  : ~${evalRes.meanErrorMeters} m`);
console.log(
  `• Validación Cruzada (LOO): ${looRes.looRmsErrorDeg}° (~${looRes.looMeanErrorMeters} m)`,
);
console.log(`• Cobertura acimutal 360° : ${coverage.coveragePercent}%`);
console.log(`• Sugerencia cobertura    : ${coverage.suggestionText}`);
console.log("");

console.log("-----------------------------------------------------------------");
console.log(" 1. ERROR POR PUNTO DE CONTROL");
console.log("-----------------------------------------------------------------");
for (const pt of evalRes.pointErrorsDeg) {
  console.log(
    `  - ${pt.id.padEnd(6)} | ${pt.label.padEnd(28)} | Error: ${String(pt.angularErrorDeg).padStart(5)}° (~${String(pt.errorMeters).padStart(5)} m) | dYaw: ${String(pt.yawErrorDeg).padStart(6)}° | dPitch: ${String(pt.pitchErrorDeg).padStart(6)}°`,
  );
}
console.log("");

console.log("-----------------------------------------------------------------");
console.log(" 2. COBERTURA POR SECTOR DE 30° DE YAW");
console.log("-----------------------------------------------------------------");
for (const sec of coverage.sectors) {
  const bar = "█".repeat(sec.count) || "·";
  console.log(
    `  [${String(sec.startDeg).padStart(4)}° .. ${String(sec.endDeg).padStart(4)}°] : ${String(sec.count).padStart(2)} punto(s)  ${bar}`,
  );
}
console.log("");

console.log("-----------------------------------------------------------------");
console.log(
  ` 3. LOTES A >= 20° DEL PUNTO DE CONTROL MÁS CERCANO (${doubtfulLots.length} por revisar)`,
);
console.log("-----------------------------------------------------------------");
const idsFormatted = doubtfulLots.map((l) => `${l.id} (${l.nearestControlPointDeg}°)`).join(", ");
console.log(`  ${idsFormatted}`);
console.log("=================================================================");
