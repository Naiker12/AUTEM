import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TOUR_MEDIA_DIR = path.resolve(
  "assets-source/3dvista/villa-paraiso/media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0",
);
const OUT_DIR = path.resolve("public/panoramas/villa-paraiso");

// Proportional GPano crop ratios measured from the 20000x10000 master (top=3160, height=6812)
const TOP_RATIO = 3160 / 10000; // +33.12° elevation
const HEIGHT_RATIO = 6812 / 10000; // down to -89.50° elevation

const FACES = ["f", "r", "b", "l", "d"];

/**
 * Stitches a cube face from its 512x512 tiles into a raw RGB buffer.
 * Level 0 = 13x13 tiles (6656x6656), Level 1 = 7x7 tiles (3584x3584).
 */
async function loadCubeFace(face, level = 0) {
  const gridCount = level === 0 ? 13 : 7;
  const tileSize = 512;
  const faceSize = gridCount * tileSize;
  const faceBuf = Buffer.allocUnsafe(faceSize * faceSize * 3);

  const tasks = [];
  for (let row = 0; row < gridCount; row++) {
    for (let col = 0; col < gridCount; col++) {
      tasks.push(
        (async () => {
          const tilePath = path.join(TOUR_MEDIA_DIR, face, String(level), `${row}_${col}.webp`);
          const { data, info } = await sharp(tilePath)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const w = info.width;
          const h = info.height;
          for (let y = 0; y < h; y++) {
            const srcStart = y * w * 3;
            const dstRow = row * tileSize + y;
            const dstCol = col * tileSize;
            const dstStart = (dstRow * faceSize + dstCol) * 3;
            data.copy(faceBuf, dstStart, srcStart, srcStart + w * 3);
          }
        })(),
      );
    }
  }

  await Promise.all(tasks);
  return { data: faceBuf, size: faceSize };
}

/**
 * Bilinear sample from a cube face RGB buffer with u, v in [-1, 1].
 */
function sampleFaceBilinear(faceObj, u, v, outBuf, outOffset) {
  const size = faceObj.size;
  const data = faceObj.data;

  // Map [-1, 1] to pixel center coordinates [0, size - 1]
  const fx = Math.max(0, Math.min(size - 1.0001, (u + 1) * 0.5 * (size - 1)));
  const fy = Math.max(0, Math.min(size - 1.0001, (v + 1) * 0.5 * (size - 1)));

  const x0 = fx | 0;
  const y0 = fy | 0;
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const wx = fx - x0;
  const wy = fy - y0;

  const w00 = (1 - wx) * (1 - wy);
  const w10 = wx * (1 - wy);
  const w01 = (1 - wx) * wy;
  const w11 = wx * wy;

  const i00 = (y0 * size + x0) * 3;
  const i10 = (y0 * size + x1) * 3;
  const i01 = (y1 * size + x0) * 3;
  const i11 = (y1 * size + x1) * 3;

  outBuf[outOffset] =
    (data[i00] * w00 + data[i10] * w10 + data[i01] * w01 + data[i11] * w11 + 0.5) | 0;
  outBuf[outOffset + 1] =
    (data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11 + 0.5) |
    0;
  outBuf[outOffset + 2] =
    (data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11 + 0.5) |
    0;
}

/**
 * Reprojects the 5 cube faces to a cropped equirectangular buffer.
 *
 * Coordinate convention verified from seam matching:
 *   yaw = 0 -> center of front ('f') face (+Z)
 *   yaw = +pi/2 -> center of right ('r') face (+X)
 *   yaw = +/-pi -> center of back ('b') face (-Z)
 *   yaw = -pi/2 -> center of left ('l') face (-X)
 *   pitch > 0 -> up (+Y), pitch < 0 -> down (-Y, face 'd')
 */
function buildEquirectangular(facesMap, fullWidth) {
  const fullHeight = fullWidth / 2;
  const croppedY = Math.round(fullHeight * TOP_RATIO);
  const croppedHeight = Math.round(fullHeight * HEIGHT_RATIO);
  const croppedWidth = fullWidth;

  const outBuf = Buffer.allocUnsafe(croppedWidth * croppedHeight * 3);

  // Precompute sin/cos of yaw for all columns
  const sinYaw = new Float64Array(croppedWidth);
  const cosYaw = new Float64Array(croppedWidth);
  for (let x = 0; x < croppedWidth; x++) {
    const yaw = ((x + 0.5) / fullWidth - 0.5) * 2 * Math.PI;
    sinYaw[x] = Math.sin(yaw);
    cosYaw[x] = Math.cos(yaw);
  }

  for (let row = 0; row < croppedHeight; row++) {
    const globalY = croppedY + row;
    const pitch = (0.5 - (globalY + 0.5) / fullHeight) * Math.PI;
    const cosPitch = Math.cos(pitch);
    const vy = Math.sin(pitch);

    const rowOffset = row * croppedWidth * 3;

    for (let x = 0; x < croppedWidth; x++) {
      const vx = cosPitch * sinYaw[x];
      const vz = cosPitch * cosYaw[x];

      const ax = Math.abs(vx);
      const ay = Math.abs(vy);
      const az = Math.abs(vz);

      let faceObj;
      let u = 0;
      let v = 0;

      if (ay >= ax && ay >= az && vy < 0) {
        // Down face ('d', -Y)
        faceObj = facesMap.d;
        u = vx / -vy;
        v = -vz / -vy;
      } else if (az >= ax) {
        if (vz >= 0) {
          // Front face ('f', +Z)
          faceObj = facesMap.f;
          u = vx / vz;
          v = -vy / vz;
        } else {
          // Back face ('b', -Z)
          faceObj = facesMap.b;
          u = -vx / -vz;
          v = -vy / -vz;
        }
      } else {
        if (vx >= 0) {
          // Right face ('r', +X)
          faceObj = facesMap.r;
          u = -vz / vx;
          v = -vy / vx;
        } else {
          // Left face ('l', -X)
          faceObj = facesMap.l;
          u = vz / -vx;
          v = -vy / -vx;
        }
      }

      sampleFaceBilinear(faceObj, u, v, outBuf, rowOffset + x * 3);
    }
  }

  return {
    buffer: outBuf,
    panoData: {
      fullWidth,
      fullHeight,
      croppedWidth,
      croppedHeight,
      croppedX: 0,
      croppedY,
    },
  };
}

async function main() {
  console.time("Total panorama reconstruction");
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("1/3 Loading level 0 cube faces (6656x6656 x 5 faces)...");
  const facesMap = {};
  for (const face of FACES) {
    facesMap[face] = await loadCubeFace(face, 0);
    console.log(`  ✓ Face '${face}' stitched (${facesMap[face].size}x${facesMap[face].size})`);
  }

  console.log("2/3 Reprojecting to 8192px equirectangular master...");
  const desktop = buildEquirectangular(facesMap, 8192);

  const desktopPath = path.join(OUT_DIR, "pano-8192.v1.webp");
  await sharp(desktop.buffer, {
    raw: {
      width: desktop.panoData.croppedWidth,
      height: desktop.panoData.croppedHeight,
      channels: 3,
    },
  })
    .webp({ quality: 86, effort: 5 })
    .toFile(desktopPath);

  const desktopStat = await fs.stat(desktopPath);
  console.log(
    `  ✓ Saved ${desktopPath} (${desktop.panoData.croppedWidth}x${desktop.panoData.croppedHeight}, ${(desktopStat.size / 1024 / 1024).toFixed(2)} MB)`,
  );

  console.log("3/3 Generating 4096px mobile and 1024px preview WebP...");
  const mobilePanoData = {
    fullWidth: 4096,
    fullHeight: 2048,
    croppedWidth: 4096,
    croppedHeight: Math.round(2048 * HEIGHT_RATIO),
    croppedX: 0,
    croppedY: Math.round(2048 * TOP_RATIO),
  };
  const mobilePath = path.join(OUT_DIR, "pano-4096.v1.webp");
  await sharp(desktop.buffer, {
    raw: {
      width: desktop.panoData.croppedWidth,
      height: desktop.panoData.croppedHeight,
      channels: 3,
    },
  })
    .resize(mobilePanoData.croppedWidth, mobilePanoData.croppedHeight, { kernel: "lanczos3" })
    .webp({ quality: 84, effort: 5 })
    .toFile(mobilePath);
  const mobileStat = await fs.stat(mobilePath);
  console.log(
    `  ✓ Saved ${mobilePath} (${mobilePanoData.croppedWidth}x${mobilePanoData.croppedHeight}, ${(mobileStat.size / 1024 / 1024).toFixed(2)} MB)`,
  );

  const previewPanoData = {
    fullWidth: 1024,
    fullHeight: 512,
    croppedWidth: 1024,
    croppedHeight: Math.round(512 * HEIGHT_RATIO),
    croppedX: 0,
    croppedY: Math.round(512 * TOP_RATIO),
  };
  const previewPath = path.join(OUT_DIR, "pano-preview.v1.webp");
  await sharp(desktop.buffer, {
    raw: {
      width: desktop.panoData.croppedWidth,
      height: desktop.panoData.croppedHeight,
      channels: 3,
    },
  })
    .resize(previewPanoData.croppedWidth, previewPanoData.croppedHeight, { kernel: "lanczos3" })
    .webp({ quality: 78, effort: 5 })
    .toFile(previewPath);
  const previewStat = await fs.stat(previewPath);
  console.log(
    `  ✓ Saved ${previewPath} (${previewPanoData.croppedWidth}x${previewPanoData.croppedHeight}, ${(previewStat.size / 1024).toFixed(1)} kB)`,
  );

  const metaPath = path.join(OUT_DIR, "pano-meta.json");
  await fs.writeFile(
    metaPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "assets-source/3dvista/villa-paraiso/media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0",
        cameraExif: {
          lat: 10.437897,
          lng: -75.356053,
          gpsAltitudeM: 236,
        },
        scenePitchDeg: -28.18,
        vfovDeg: 122.62,
        elevationRangeDeg: {
          maxPitch: 33.12,
          minPitch: -89.5,
        },
        variants: {
          desktop: {
            url: "/panoramas/villa-paraiso/pano-8192.v1.webp",
            bytes: desktopStat.size,
            panoData: desktop.panoData,
          },
          mobile: {
            url: "/panoramas/villa-paraiso/pano-4096.v1.webp",
            bytes: mobileStat.size,
            panoData: mobilePanoData,
          },
          preview: {
            url: "/panoramas/villa-paraiso/pano-preview.v1.webp",
            bytes: previewStat.size,
            panoData: previewPanoData,
          },
        },
      },
      null,
      2,
    ),
  );
  console.log(`  ✓ Saved ${metaPath}`);
  console.timeEnd("Total panorama reconstruction");
}

main().catch((err) => {
  console.error("Failed to reconstruct panorama:", err);
  process.exit(1);
});
