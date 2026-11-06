import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import sharp from "sharp";

const SVG_WIDTH = 2400;
const SVG_HEIGHT = 2324;

// Coordenadas calculadas desde cad-reference.json
const NW_LAT = 10.440852577843227;
const NW_LNG = -75.36012473061535;
const SE_LAT = 10.433892690110378;
const SE_LNG = -75.35280461922072;

// Zoom level 19 for maximum sharpness
const ZOOM = 19;

function latLngToWorldPixel(lat, lng, zoom) {
  const scale = 256 * (2 ** zoom);
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

const nwPixel = latLngToWorldPixel(NW_LAT, NW_LNG, ZOOM);
const sePixel = latLngToWorldPixel(SE_LAT, SE_LNG, ZOOM);

const minTileX = Math.floor(nwPixel.x / 256);
const maxTileX = Math.floor(sePixel.x / 256);
const minTileY = Math.floor(nwPixel.y / 256);
const maxTileY = Math.floor(sePixel.y / 256);

console.log(`Tiles X: ${minTileX} to ${maxTileX} (${maxTileX - minTileX + 1} tiles)`);
console.log(`Tiles Y: ${minTileY} to ${maxTileY} (${maxTileY - minTileY + 1} tiles)`);

function fetchTile(x, y, z) {
  // Use Google Satellite or fallback to Esri World Imagery
  return new Promise((resolve, reject) => {
    const subdomain = (x + y) % 4;
    const url = `https://mt${subdomain}.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          // Fallback to Esri
          const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
          https.get(esriUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (resEsri) => {
            if (resEsri.statusCode !== 200) {
              return reject(new Error(`Failed tile ${x},${y}: ${resEsri.statusCode}`));
            }
            const chunks = [];
            resEsri.on("data", (c) => chunks.push(c));
            resEsri.on("end", () => resolve(Buffer.concat(chunks)));
          }).on("error", reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on("error", reject);
  });
}

async function build() {
  const composites = [];
  const startX = minTileX * 256;
  const startY = minTileY * 256;

  console.log("Downloading tiles...");
  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      try {
        const buffer = await fetchTile(tx, ty, ZOOM);
        composites.push({
          input: buffer,
          left: tx * 256 - startX,
          top: ty * 256 - startY,
        });
      } catch (err) {
        console.warn(`Tile failed: ${tx}, ${ty}`, err.message);
      }
    }
  }

  const canvasWidth = (maxTileX - minTileX + 1) * 256;
  const canvasHeight = (maxTileY - minTileY + 1) * 256;

  console.log(`Stitching canvas ${canvasWidth}x${canvasHeight} with ${composites.length} tiles...`);
  const stitched = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 24, g: 26, b: 20, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  const cropLeft = Math.round(nwPixel.x - startX);
  const cropTop = Math.round(nwPixel.y - startY);
  const cropWidth = Math.round(sePixel.x - nwPixel.x);
  const cropHeight = Math.round(sePixel.y - nwPixel.y);

  console.log(`Cropping to bounds: left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`);

  const outputPath = path.resolve("public/images/villa-paraiso-terrain-satellite.webp");
  
  await sharp(stitched)
    .extract({
      left: Math.max(0, cropLeft),
      top: Math.max(0, cropTop),
      width: Math.min(canvasWidth - cropLeft, cropWidth),
      height: Math.min(canvasHeight - cropTop, cropHeight),
    })
    .resize(SVG_WIDTH, SVG_HEIGHT, { fit: "fill" })
    .webp({ quality: 88, effort: 4 })
    .toFile(outputPath);

  console.log(`✓ High-res terrain background saved to: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
}

build().catch(console.error);

