export const GRID_SIZE = 7;
export const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

function cellType(cell) {
  return cell?.type ?? cell?.kind ?? null;
}

export function makeGem(type, special = null, createdBy = null) {
  return { type, kind: type, special, createdBy };
}

function cloneGrid(grid) {
  return grid.map(row => row.map(cell => {
    if (!cell) return null;
    const type = cellType(cell);
    return { ...cell, type, kind: type };
  }));
}

function randomGemType() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function randomGem() {
  return makeGem(randomGemType());
}

function sameKind(a, b) {
  const aType = cellType(a);
  const bType = cellType(b);
  if (!aType || !bType) return false;
  if (aType === 'wild' || bType === 'wild') return true;
  return aType === bType;
}

/**
 * Creates an initial 7×7 grid with no pre-existing matches.
 */
export function createInitialGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let gem;
      do {
        gem = randomGem();
      } while (
        (c >= 2 && sameKind(grid[r][c - 1], gem) && sameKind(grid[r][c - 2], gem)) ||
        (r >= 2 && sameKind(grid[r - 1][c], gem) && sameKind(grid[r - 2][c], gem))
      );
      grid[r][c] = gem;
    }
  }
  return grid;
}

export const createGrid = createInitialGrid;

/**
 * Returns true if the two cells are adjacent (share an edge).
 */
export function canSwap(grid, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function isAdjacent(r1, c1, r2, c2) {
  return canSwap(null, r1, c1, r2, c2);
}

/**
 * Returns a new grid with the two cells swapped.
 */
export function applySwap(grid, r1, c1, r2, c2) {
  const next = cloneGrid(grid);
  const tmp = next[r1][c1];
  next[r1][c1] = next[r2][c2];
  next[r2][c2] = tmp;
  return next;
}

export const swapGems = applySwap;

/**
 * Finds horizontal and vertical groups of 3+.
 * Returns an array of groups for UI compatibility, with `.matches` and `.specials`
 * properties for test/engine compatibility.
 */
export function findMatches(grid) {
  const groups = [];

  // Horizontal runs
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = [{ r, c: 0 }];
    for (let c = 1; c <= GRID_SIZE; c++) {
      const prev = c - 1 < GRID_SIZE ? grid[r][c - 1] : null;
      const curr = c < GRID_SIZE ? grid[r][c] : null;
      if (curr && prev && sameKind(curr, prev)) {
        run.push({ r, c });
      } else {
        if (run.length >= 3) groups.push(run);
        run = c < GRID_SIZE ? [{ r, c }] : [];
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = [{ r: 0, c }];
    for (let r = 1; r <= GRID_SIZE; r++) {
      const prev = r - 1 < GRID_SIZE ? grid[r - 1][c] : null;
      const curr = r < GRID_SIZE ? grid[r][c] : null;
      if (curr && prev && sameKind(curr, prev)) {
        run.push({ r, c });
      } else {
        if (run.length >= 3) groups.push(run);
        run = r < GRID_SIZE ? [{ r, c }] : [];
      }
    }
  }

  const unique = new Set();
  groups.forEach(group => {
    group.forEach(({ r, c }) => unique.add(`${r},${c}`));
  });
  const matches = [...unique].map(key => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });

  const specials = classifyShapes(grid, matches);
  groups.matches = matches;
  groups.specials = specials;
  return groups;
}

function classifyShapes(grid, matches) {
  const byCell = new Map();
  for (const m of matches) {
    byCell.set(`${m.row},${m.col}`, { ...m, neighbors: [] });
  }

  for (const cell of byCell.values()) {
    const type = cellType(grid[cell.row]?.[cell.col]);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      const key = `${nr},${nc}`;
      if (byCell.has(key) && cellType(grid[nr]?.[nc]) === type) {
        cell.neighbors.push(byCell.get(key));
      }
    }
  }

  const specials = [];
  const visited = new Set();

  for (const start of byCell.values()) {
    const startKey = `${start.row},${start.col}`;
    if (visited.has(startKey)) continue;

    const queue = [start];
    const component = [];
    visited.add(startKey);

    while (queue.length) {
      const cur = queue.shift();
      component.push(cur);
      for (const n of cur.neighbors) {
        const nk = `${n.row},${n.col}`;
        if (!visited.has(nk)) {
          visited.add(nk);
          queue.push(n);
        }
      }
    }

    specials.push(...classifyComponent(component));
  }

  return specials;
}

function classifyComponent(component) {
  if (component.length < 4) return [];

  const rows = component.map(c => c.row);
  const cols = component.map(c => c.col);
  const height = Math.max(...rows) - Math.min(...rows) + 1;
  const width = Math.max(...cols) - Math.min(...cols) + 1;
  const sorted = [...component].sort((a, b) => (a.row - b.row) || (a.col - b.col));
  const midIdx = Math.floor(sorted.length / 2);

  // 5+ in line -> supernova
  if (component.length >= 5 && (height === 1 || width === 1)) {
    const center = sorted[midIdx];
    return [{ row: center.row, col: center.col, specialType: 'supernova' }];
  }

  // T/L shape (5+ spanning 2+ rows and cols) -> bomb
  if (component.length >= 5 && height >= 2 && width >= 2) {
    const compSet = new Set(component.map(c => `${c.row},${c.col}`));
    const degrees = new Map(component.map(cell => [
      `${cell.row},${cell.col}`,
      [[0, 1], [0, -1], [1, 0], [-1, 0]].reduce(
        (n, [dr, dc]) => n + (compSet.has(`${cell.row + dr},${cell.col + dc}`) ? 1 : 0),
        0,
      ),
    ]));

    const intersection = component.reduce((best, cell) =>
      degrees.get(`${cell.row},${cell.col}`) > degrees.get(`${best.row},${best.col}`) ? cell : best,
    component[0]);

    return [{ row: intersection.row, col: intersection.col, specialType: 'bomb' }];
  }

  // 4 in line -> directional line clear
  if (component.length === 4 && (height === 1 || width === 1)) {
    const center = sorted[midIdx];
    return [{ row: center.row, col: center.col, specialType: height === 1 ? 'lineH' : 'lineV' }];
  }

  return [];
}

/**
 * Returns a new grid with matched cells set to null and optional replacements placed.
 */
export function clearMatches(grid, matchCells, replacements = []) {
  const next = cloneGrid(grid);
  matchCells.forEach(cell => {
    const r = cell.r ?? cell.row;
    const c = cell.c ?? cell.col;
    next[r][c] = null;
  });
  replacements.forEach(repl => {
    const type = repl.type ?? repl.kind ?? randomGemType();
    next[repl.r][repl.c] = makeGem(type, repl.special || null, repl.createdBy || null);
  });
  return next;
}

/**
 * Applies match results from `findMatches` and keeps newly-created specials.
 */
export function applyMatches(grid, matchResult, comboLevel = 1) {
  const matches = matchResult?.matches || [];
  const specials = matchResult?.specials || [];
  const next = cloneGrid(grid);
  const toClear = new Set(matches.map(m => `${m.row},${m.col}`));

  const preExistingSpecials = matches
    .filter(m => next[m.row]?.[m.col]?.special)
    .map(m => ({
      row: m.row,
      col: m.col,
      type: next[m.row][m.col].special,
      gemType: cellType(next[m.row][m.col]),
    }));

  for (const s of specials) {
    const key = `${s.row},${s.col}`;
    if (!toClear.has(key)) continue;
    toClear.delete(key);
    const existingType = cellType(next[s.row]?.[s.col]) || 'star';
    next[s.row][s.col] = makeGem(existingType, s.specialType, 'shape');
  }

  for (const key of toClear) {
    const [r, c] = key.split(',').map(Number);
    next[r][c] = null;
  }

  for (const ps of preExistingSpecials) {
    triggerSpecial(next, ps.row, ps.col, ps.type, comboLevel, ps.gemType);
  }

  return next;
}

/**
 * Clears cells affected by a special gem in-place.
 */
export function triggerSpecial(grid, row, col, type, comboLevel = 1, gemType = null) {
  const rows = grid.length;
  const cols = grid[0].length;

  const mark = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    grid[r][c] = null;
  };

  if (type === 'lineH' || type === 'row') {
    for (let c = 0; c < cols; c++) mark(row, c);
  } else if (type === 'lineV' || type === 'col') {
    for (let r = 0; r < rows; r++) mark(r, col);
  } else if (type === 'bomb') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        mark(row + dr, col + dc);
      }
    }
  } else if (type === 'supernova') {
    const targetType = gemType || cellType(grid[row]?.[col]);
    if (!targetType) return;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cellType(grid[r][c]) === targetType) mark(r, c);
      }
    }
  }
}

/**
 * Applies gravity: shifts non-null cells down, fills top with new random gems.
 */
export function applyGravity(grid) {
  const next = cloneGrid(grid);
  for (let c = 0; c < GRID_SIZE; c++) {
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : randomGem();
    }
  }
  return next;
}
