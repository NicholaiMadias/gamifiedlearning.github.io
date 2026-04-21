/**
 * progression.js — tracks overall player progress across sessions.
 * Persists to localStorage so progress survives page reloads.
 */

const STORAGE_KEY = 'glm-progress';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { total: 0 };
  } catch {
    return { total: 0 };
  }
}

/**
 * Returns the current progress object: { total: <highest level reached> }
 */
export function getProgress() {
  return load();
}

/**
 * Records that a level has been completed, updating the highest reached if needed.
 * @param {number} level - The level that was completed
 */
export function recordLevelComplete(level) {
  const p = load();
  if (level > p.total) {
    p.total = level;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (e) {
      console.warn('[progression] Could not persist progress:', e);
    }
  }
}
