import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateNavigationBundle } from "../../src/features/terrain-navigation/navigation-schema.ts";

const baseDir = path.resolve(fileURLToPath(import.meta.url), "../../..");
const bundlePath = path.resolve(baseDir, "src/data/generated/villa-paraiso-navigation-bundle.json");

const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
console.log("Running validateNavigationBundle on generated bundle...");

try {
  const result = validateNavigationBundle(bundle, "villa-paraiso");
  console.log("PASS! Status:", result.graph.status);
  console.log("Edges processed:", result.graph.edges.length);
  console.log("Max checkpoint error:", result.maxErrorMeters.toFixed(3), "m");
} catch (error) {
  console.error("FAIL:", error);
  process.exit(1);
}
