import path from "node:path";
import sharp from "sharp";

const publicDir = path.resolve("public");

const assets = [
  ["projects/lotes-360/panoramica-render.png", "projects/lotes-360/panoramica-render.webp", 1920],
  ["projects/lotes-360/acceso-render.png", "projects/lotes-360/acceso-render.webp", 1920],
  [
    "projects/lotes-360/lot-l07-entorno-verde.png",
    "projects/lotes-360/lot-l07-entorno-verde.webp",
    1600,
  ],
  ["projects/lotes-360/lot-l12-quebrada.png", "projects/lotes-360/lot-l12-quebrada.webp", 1920],
  [
    "projects/lotes-360/lot-l18-zona-social.png",
    "projects/lotes-360/lot-l18-zona-social.webp",
    1920,
  ],
];

console.log("Optimizing project images with sharp...");

for (const [source, output, width] of assets) {
  try {
    const srcPath = path.join(publicDir, source);
    const outPath = path.join(publicDir, output);
    await sharp(srcPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(outPath);
    console.log(`✓ Created: ${output}`);
  } catch (err) {
    console.error(`✗ Failed for ${source}:`, err);
  }
}

console.log("Optimization complete!");
