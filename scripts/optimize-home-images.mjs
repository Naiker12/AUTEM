import path from "node:path";
import sharp from "sharp";

const publicDir = path.resolve("public");

const assets = [
  ["projects/lotes-360/panoramica-render.png", "projects/lotes-360/panoramica-home.webp", 1440],
  [
    "projects/lotes-360/masterplan-interactive-aerial.png",
    "projects/lotes-360/masterplan-interactive-home.webp",
    1440,
  ],
  [
    "projects/lotes-360/masterplan-general-aerial.jpg",
    "projects/lotes-360/masterplan-general-home.webp",
    960,
  ],
  ["projects/lotes-360/lot-l07-entorno-verde.png", "projects/lotes-360/lot-l07-home.webp", 960],
  ["projects/eco-villa-sierra/fachada.jpg", "projects/eco-villa-sierra/fachada-home.webp", 1200],
];

await Promise.all(
  assets.map(async ([source, output, width]) => {
    await sharp(path.join(publicDir, source))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(path.join(publicDir, output));
  }),
);

console.log(`Optimized ${assets.length} home images.`);
