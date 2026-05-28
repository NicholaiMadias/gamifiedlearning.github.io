// os/boot.js
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * Boot state object
 * Tracks OS initialization progress for debugging + frontend boot animation
 */
export const bootState = {
  started: false,
  completed: false,
  timestamp: null,
  modulesLoaded: [],
  errors: []
};

/**
 * Load all modules in /os/modules automatically
 */
function loadModules() {
  const modulesDir = path.join(__dirname, "modules");
  const files = fs.readdirSync(modulesDir);

  files.forEach((file) => {
    if (!file.endsWith(".js")) return;

    try {
      const moduleName = file.replace(".js", "");
      bootState.modulesLoaded.push(moduleName);
    } catch (err) {
      bootState.errors.push({
        module: file,
        error: err.message
      });
    }
  });
}

/**
 * Main boot function
 * Called from index.js before the server starts listening
 */
export async function bootNexusOS() {
  bootState.started = true;
  bootState.timestamp = new Date().toISOString();

  try {
    loadModules();
    bootState.completed = true;
  } catch (err) {
    bootState.errors.push({
      system: "boot",
      error: err.message
    });
  }

  return bootState;
}
