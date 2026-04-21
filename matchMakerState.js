export const GRID_SIZE = 7;

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

function randomGemType() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function makeGem(type) {
  return { type, special: null, createdBy: null };
}

/**
 * Creates an initial 7×7 grid of gem objects with no pre-existing matches.
 */
export function createInitialGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let gemType;
      do {
        gemType = randomGemType();
      } while (
        (c >= 2 && grid[r][c - 1]?.type === gemType && grid[r][c - 2]?.type === gemType) ||
        (r >= 2 && grid[r - 1][c]?.type === gemType && grid[r - 2][c]?.type === gemType)
      );
      grid[r][c] = makeGem(gemType);
    }
  }
  return grid;
}

/** Alias used by the UI layer. */
export const createGrid = createInitialGrid;

/**
 * Returns true if the two cells are adjacent (share an edge).
 */
export function canSwap(grid, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/** Alias used by the UI layer (no grid param needed). */
export function isAdjacent(r1, c1, r2, c2) {
  return canSwap(null, r1, c1, r2, c2);
}

/**
 * Returns a new grid with the two cells swapped.
 */
export function applySwap(grid, r1, c1, r2, c2) {
  const next = grid.map(row => [...row]);
  const tmp = next[r1][c1];
  next[r1][c1] = next[r2][c2];
  next[r2][c2] = tmp;
  return next;
}

/** Alias used by the UI layer. */
export const swapGems = applySwap;

/**
 * Finds all horizontal and vertical matches of 3+ using object .type comparison.
 * Returns { matches: [{row, col}…], specials: [{row, col, specialType}…] }.
 */
export function findMatches(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const matched = new Set();

  // Horizontal segments
  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const prev = grid[r][c - 1];
      const curr = c < cols ? grid[r][c] : null;
      if (!curr || !prev || curr.type !== prev.type) {
        const len = c - runStart;
        if (len >= 3) {
          for (let k = runStart; k < c; k++) matched.add(`${r},${k}`);
        }
        runStart = c;
      }
    }
  }

  // Vertical segments
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= rows; r++) {
      const prev = grid[r - 1][c];
      const curr = r < rows ? grid[r][c] : null;
      if (!curr || !prev || curr.type !== prev.type) {
        const len = r - runStart;
        if (len >= 3) {
          for (let k = runStart; k < r; k++) matched.add(`${k},${c}`);
        }
        runStart = r;
      }
    }
  }

  const basicMatches = Array.from(matched).map(s => {
    const [row, col] = s.split(',').map(Number);
    return { row, col };
  });

  return classifyShapes(basicMatches);
}

function classifyShapes(basicMatches) {
  const byCell = new Map();
  for (const m of basicMatches) {
    byCell.set(`${m.row},${m.col}`, { ...m, neighbors: [] });
  }

  // Build 4-directional adjacency
  for (const cell of byCell.values()) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${cell.row + dr},${cell.col + dc}`;
      if (byCell.has(key)) cell.neighbors.push(byCell.get(key));
    }
  }

  const specials = [];
  const visited = new Set();

  for (const cell of byCell.values()) {
    const key = `${cell.row},${cell.col}`;
    if (visited.has(key)) continue;

    // BFS connected component
    const comp = [];
    const queue = [cell];
    visited.add(key);
    while (queue.length) {
      const cur = queue.pop();
      comp.push(cur);
      for (const n of cur.neighbors) {
        const nk = `${n.row},${n.col}`;
        if (!visited.has(nk)) {
          visited.add(nk);
          queue.push(n);
        }
      }
    }

    specials.push(...classifyComponent(comp).specials);
  }

  return { matches: basicMatches, specials };
}

function classifyComponent(comp) {
  const specials = [];
  if (comp.length < 3) return { specials };

  const compRows = comp.map(c => c.row);
  const compCols = comp.map(c => c.col);
  const height = Math.max(...compRows) - Math.min(...compRows) + 1;
  const width  = Math.max(...compCols) - Math.min(...compCols) + 1;

  // 5-in-a-row → supernova
  if (comp.length >= 5 && (height === 1 || width === 1)) {
    const center = comp[Math.floor(comp.length / 2)];
    specials.push({ row: center.row, col: center.col, specialType: 'supernova' });
    return { specials };
  }

  // T / L shape (5+ cells spanning 2+ rows and cols) → bomb
  if (comp.length >= 5 && height >= 2 && width >= 2) {
    const center = comp[Math.floor(comp.length / 2)];
    specials.push({ row: center.row, col: center.col, specialType: 'bomb' });
    return { specials };
  }

  // 4-in-a-row → line clear
  if (comp.length === 4 && (height === 1 || width === 1)) {
    const center = comp[1];
    specials.push({
      row: center.row,
      col: center.col,
      specialType: height === 1 ? 'lineH' : 'lineV',
    });
  }

  return { specials };
}

/**
 * Applies a match result to the grid: places specials, clears normal cells,
 * then triggers any specials that were part of the match.
 * Returns a new grid (mutates a copy).
 */
export function applyMatches(grid, matchResult, comboLevel = 1) {
  const { matches, specials } = matchResult;
  const next = grid.map(row => [...row]);
  const toClear = new Set(matches.map(m => `${m.row},${m.col}`));

  // Place special gems at designated cells (remove from clear list)
  for (const s of specials) {
    const key = `${s.row},${s.col}`;
    if (toClear.has(key)) {
      toClear.delete(key);
      const cell = next[s.row][s.col];
      next[s.row][s.col] = { ...(cell || {}), type: cell?.type || 'star', special: s.specialType, createdBy: 'shape' };
    }
  }

  // Clear remaining matched cells
  for (const key of toClear) {
    const [r, c] = key.split(',').map(Number);
    next[r][c] = null;
  }

  // Trigger specials that were themselves matched
  for (const s of specials) {
    triggerSpecial(next, s.row, s.col, s.specialType, comboLevel);
  }

  return next;
}

/**
 * Clears cells affected by a special gem in-place.
 */
export function triggerSpecial(grid, row, col, type, comboLevel = 1) {
  const rows = grid.length;
  const cols = grid[0].length;

  const mark = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    grid[r][c] = null;
  };

  if (type === 'lineH') {
    for (let c = 0; c < cols; c++) mark(row, c);
  } else if (type === 'lineV') {
    for (let r = 0; r < rows; r++) mark(r, col);
  } else if (type === 'bomb') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        mark(row + dr, col + dc);
      }
    }
  } else if (type === 'supernova') {
    const targetType = grid[row][col]?.type;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]?.type === targetType) mark(r, c);
      }
    }
  }
}

/**
 * Applies gravity: shifts non-null cells down, fills top with new gem objects.
 */
export function applyGravity(grid) {
  const next = grid.map(row => [...row]);
  for (let c = 0; c < GRID_SIZE; c++) {
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : makeGem(randomGemType());
    }
  }
  return next;
}
