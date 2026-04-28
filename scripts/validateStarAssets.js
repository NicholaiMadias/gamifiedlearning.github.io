#!/usr/bin/env node
/**
 * validateStarAssets.js
 *
 * Validates all star sprite assets referenced in /public/config/animations/*.json.
 * Checks: file existence, naming convention, frame count completeness, and image resolution.
 *
 * Usage: node scripts/validateStarAssets.js
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { loadImage } from "canvas";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const ANIMATIONS_DIR = join(ROOT, "public", "config", "animations");
const PUBLIC_DIR = join(ROOT, "public");

const EXPECTED_MIN_SIZE = 32;   // pixels — minimum acceptable frame dimension
const EXPECTED_MAX_SIZE = 512;  // pixels — maximum acceptable frame dimension

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ✗ ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  ⚠ WARN:  ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  ✓ OK:    ${msg}`);
}

async function validateConfig(configPath) {
  const raw = readFileSync(configPath, "utf8");
  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    error(`${configPath} — invalid JSON: ${e.message}`);
    return;
  }

  const required = ["name", "frames", "frameRate", "loop", "spritePath"];
  for (const field of required) {
    if (config[field] === undefined) {
      error(`${config.name ?? configPath} — missing required field: "${field}"`);
    }
  }

  console.log(`\n[${config.name}] — ${config.frames} frame(s) @ ${config.frameRate} fps`);

  for (let i = 0; i < config.frames; i++) {
    const relPath = `${config.spritePath}${i}.png`;
    const absPath = join(PUBLIC_DIR, relPath.replace(/^\//, ""));

    // Naming check — the expected filename is derived from spritePath itself
    const expectedName = relPath.split("/").pop();
    const actualName = absPath.split("/").pop();
    if (actualName !== expectedName) {
      warn(`Frame ${i}: expected filename "${expectedName}", got "${actualName}"`);
    }

    // Existence check
    if (!existsSync(absPath)) {
      error(`Frame ${i}: missing file at ${absPath}`);
      continue;
    }

    // Resolution check (requires 'canvas' package)
    try {
      const img = await loadImage(absPath);
      const w = img.width;
      const h = img.height;

      if (w < EXPECTED_MIN_SIZE || h < EXPECTED_MIN_SIZE) {
        warn(`Frame ${i}: resolution ${w}×${h} is below minimum ${EXPECTED_MIN_SIZE}×${EXPECTED_MIN_SIZE}`);
      } else if (w > EXPECTED_MAX_SIZE || h > EXPECTED_MAX_SIZE) {
        warn(`Frame ${i}: resolution ${w}×${h} exceeds maximum ${EXPECTED_MAX_SIZE}×${EXPECTED_MAX_SIZE}`);
      } else if (w !== h) {
        warn(`Frame ${i}: non-square resolution ${w}×${h} — frames should be square`);
      } else {
        ok(`Frame ${i}: ${absPath.split("/public/")[1]} (${w}×${h})`);
      }
    } catch (e) {
      error(`Frame ${i}: could not read image at ${absPath} — ${e.message}`);
    }
  }
}

async function main() {
  console.log("=== Star Asset Validator ===\n");

  let configFiles;
  try {
    configFiles = readdirSync(ANIMATIONS_DIR).filter((f) => f.endsWith(".json"));
  } catch (e) {
    console.error(`Could not read animations directory: ${ANIMATIONS_DIR}`);
    console.error(e.message);
    process.exit(1);
  }

  if (configFiles.length === 0) {
    console.warn("No animation config files found in", ANIMATIONS_DIR);
    process.exit(0);
  }

  for (const file of configFiles) {
    await validateConfig(join(ANIMATIONS_DIR, file));
  }

  console.log(`\n=== Summary: ${errors} error(s), ${warnings} warning(s) ===`);
  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
