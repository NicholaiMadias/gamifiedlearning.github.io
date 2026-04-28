#!/usr/bin/env node
/**
 * validateStarAssets.js
 *
 * Validates star sprite assets against their JSON animation configs.
 *
 * Checks performed:
 *   - All frame files listed in each config are present on disk
 *   - Frame filenames follow the expected naming convention (frame_N.png)
 *   - No config references zero frames (except static single-frame types)
 *
 * Usage:
 *   node scripts/validateStarAssets.js
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONFIGS_DIR = join(ROOT, "public", "config", "animations");
const ASSETS_BASE = join(ROOT, "public");

const CONFIG_FILES = [
  "supernova.json",
  "shooting_star.json",
  "gem_star.json",
  "rank_star.json",
  "cosmic_star.json",
];

let hasErrors = false;

for (const configFile of CONFIG_FILES) {
  const configPath = join(CONFIGS_DIR, configFile);

  if (!existsSync(configPath)) {
    console.error(`[MISSING CONFIG] ${configFile}`);
    hasErrors = true;
    continue;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (err) {
    console.error(`[INVALID JSON] ${configFile}: ${err.message}`);
    hasErrors = true;
    continue;
  }

  const { name, frames, spritePath } = config;

  if (typeof frames !== "number" || frames < 1) {
    console.error(`[INVALID] ${name}: "frames" must be a positive integer`);
    hasErrors = true;
    continue;
  }

  for (let i = 0; i < frames; i++) {
    const relPath = `${spritePath}${i}.png`;
    const absPath = join(ASSETS_BASE, relPath);

    if (!existsSync(absPath)) {
      console.warn(`[MISSING FRAME] ${name}: expected asset at /public${relPath}`);
      hasErrors = true;
    } else {
      console.log(`[OK] ${name}: frame_${i}.png`);
    }
  }
}

if (hasErrors) {
  console.error("\nValidation failed. Resolve the issues above before deploying.");
  process.exit(1);
} else {
  console.log("\nAll star assets validated successfully.");
}
