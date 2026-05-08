/**
 * Rasterizes public/icons/icon-source.svg into the PNG sizes the
 * web manifest + iOS Safari need for installability.
 *
 * Run with:  node scripts/generate-pwa-icons.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const srcPath = join(root, "public", "icons", "icon-source.svg");
const outDir = join(root, "public", "icons");

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  // Maskable variant: identical bitmap for now — the source SVG already
  // keeps the glyph inside the 80% safe-area, so the same render works.
  { name: "icon-maskable-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

const svg = await readFile(srcPath);

for (const { name, size } of targets) {
  const out = join(outDir, name);
  await sharp(svg)
    .resize(size, size, { fit: "contain", background: "#c83e1e" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${name} (${size}x${size})`);
}
