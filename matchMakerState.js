/**
 * matchMakerState.js — Pure State Engine for Match Maker
 * Grid logic, match detection (row/col + T/L shapes), gravity, power-up spawning.
 * (c) 2026 NicholaiMadias — MIT License
 */

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];
const POWER_UP  = 'supernova';

function randomGem() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function wouldMatch(grid, r, c, type) {
  if (c >= 2 && grid[r][c - 1] === type && grid[r][c - 2] === type) return true;
  if (r >= 2 && grid[r - 1][c] === type && grid[r - 2][c] === type) return true;
  return false;
}

export function createGrid(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      let gem;
      do { gem = randomGem(); } while (wouldMatch(grid, r, c, gem));
      grid[r][c] = gem;
    }
  }
  return grid;
}

export function isAdjacent(r1, c1, r2, c2) {
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

export function swapGems(grid, r1, c1, r2, c2) {
  const copy = grid.map(row => [...row]);
  const tmp = copy[r1][c1];
  copy[r1][c1] = copy[r2][c2];
  copy[r2][c2] = tmp;
  return copy;
}

export function findMatches(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const matched = new Map();

  function mark(r, c, shape) {
    const key = r + ',' + c;
    if (!matched.has(key)) matched.set(key, { row: r, col: c, shape: shape || 'line' });
  }

  for (let r = 0; r < rows; r++) {
    let start = 0;
    for (let c = 1; c <= cols; c++) {
      if (c < cols && grid[r][c] !== null && grid[r][c] === grid[r][start] && grid[r][c] !== POWER_UP) continue;
      if (c - start >= 3) for (let k = start; k < c; k++) mark(r, k, 'h');
      start = c;
    }
  }

  for (let c = 0; c < cols; c++) {
    let start = 0;
    for (let r = 1; r <= rows; r++) {
      if (r < rows && grid[r][c] !== null && grid[r][c] === grid[r - 1][c] && grid[r][c] !== POWER_UP) continue;
      if (r - start >= 3) for (let k = start; k < r; k++) mark(k, c, 'v');
      start = r;
    }
  }

  return Array.from(matched.values());
}

export function findPowerUpSpawns(grid, matches) {
  if (matches.length === 0) return [];
  const spawns = [];
  const byType = {};

  matches.forEach(m => {
    const type = grid[m.row]?.[m.col];
    if (type && type !== POWER_UP) {
      if (!byType[type]) byType[type] = [];
      byType[type].push(m);
    }
  });

  for (const type of Object.keys(byType)) {
    const cells = byType[type];
    const cellSet = new Set(cells.map(c => c.row + ',' + c.col));

    for (const cell of cells) {
      const { row, col } = cell;
      const hasH = cellSet.has(row + ',' + (col - 1)) || cellSet.has(row + ',' + (col + 1));
      const hasV = cellSet.has((row - 1) + ',' + col) || cellSet.has((row + 1) + ',' + col);
      if (hasH && hasV) spawns.push({ row, col });
    }
  }

  const seen = new Set();
  return spawns.filter(s => {
    const key = s.row + ',' + s.col;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function supernovaBlast(grid, row, col, radius) {
  const rows = grid.length;
  const cols = grid[0].length;
  const blasted = [];
  for (let r = Math.max(0, row - radius); r <= Math.min(rows - 1, row + radius); r++) {
    for (let c = Math.max(0, col - radius); c <= Math.min(cols - 1, col + radius); c++) {
      blasted.push({ row: r, col: c });
    }
  }
  return blasted;
}

export function clearMatches(grid, matches) {
  const copy = grid.map(row => [...row]);
  matches.forEach(({ row, col }) => {
    if (row >= 0 && row < copy.length && col >= 0 && col < copy[0].length) copy[row][col] = null;
  });
  return copy;
}

export function applyGravity(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const copy = grid.map(row => [...row]);

  for (let c = 0; c < cols; c++) {
    const column = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (copy[r][c] !== null) column.push(copy[r][c]);
    }
    for (let r = rows - 1; r >= 0; r--) {
      const idx = rows - 1 - r;
      copy[r][c] = idx < column.length ? column[idx] : randomGem();
    }
  }
  return copy;
}

export function placePowerUp(grid, row, col) {
  const copy = grid.map(r => [...r]);
  copy[row][col] = POWER_UP;
  return copy;
}

export function isPowerUp(gem) {
  return gem === POWER_UP;
}

export { GEM_TYPES, POWER_UP };
