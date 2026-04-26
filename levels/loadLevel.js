const DEFAULT_LEVEL = 1;
const MIN_LEVEL = 1;

function clampLevelNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return DEFAULT_LEVEL;
  return Math.max(Math.round(num), MIN_LEVEL);
}

export async function loadLevel(levelNumber = DEFAULT_LEVEL) {
  const n = clampLevelNumber(levelNumber);
  const res = await fetch(`levels/${n}.json`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load level ${n}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}