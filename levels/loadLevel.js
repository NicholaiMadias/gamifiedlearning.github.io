import { DEFAULT_LEVEL, clampLevelNumber } from '../src/levels/levelUtils.js';

export async function loadLevel(levelNumber = DEFAULT_LEVEL) {
  const n = clampLevelNumber(levelNumber);
  const res = await fetch(`./levels/${n}.json`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load level ${n}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}