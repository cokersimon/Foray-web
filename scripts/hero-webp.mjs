#!/usr/bin/env node
/**
 * Convert Recraft hero PNGs to WebP for the marketing carousel.
 * Max edge 1920px, quality 82. Removes intermediate PNGs after success.
 */
import { readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = join(ROOT, "public", "brand");
const HEROES = ["hero-flatlay", "hero-shopping", "hero-cooking"];
const MAX_EDGE = 1920;
const QUALITY = 82;

async function convert(name) {
  const png = join(BRAND, `${name}.png`);
  const webp = join(BRAND, `${name}.webp`);
  const image = sharp(png);
  const meta = await image.metadata();
  const w = meta.width ?? MAX_EDGE;
  const h = meta.height ?? MAX_EDGE;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);

  await image
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(webp);

  unlinkSync(png);
  console.log(`wrote ${name}.webp (${width}×${height}), removed ${name}.png`);
}

async function main() {
  const missing = HEROES.filter((n) => {
    try {
      readdirSync(BRAND);
      return !readdirSync(BRAND).includes(`${n}.png`);
    } catch {
      return true;
    }
  });
  if (missing.length) {
    console.error(`Missing PNGs: ${missing.map((n) => n + ".png").join(", ")}`);
    console.error("Run: python3 scripts/recraft-web.py --heroes --force");
    process.exit(1);
  }
  for (const name of HEROES) {
    await convert(name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
