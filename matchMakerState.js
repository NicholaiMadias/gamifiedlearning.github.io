export const GRID_SIZE = 7;

/** The six regular gem types. */
export const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop', 'gem'];

/** Special power-up gem types (never fill in randomly). */
export const SPECIAL_GEM_TYPES = ['bomb', 'rainbow'];

/**
 * Base score for one matched cell of each regular gem type
 * (multiplied by the current combo before adding to the total).
 * Diamonds are rarest and highest-value; flames score lower
 * but chain more easily.
 */
export const GEM_SCORE = {
  heart: 12,  // life tile — slight bonus
  star:  10,  // standard
  cross: 15,  // crystal — high value
  flame:  8,  // fire — lower base, relies on chains
  drop:  10,  // water — standard
  gem:   20,  // diamond — rarest, highest value
};

function randomGem() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

/**
 * Creates an initial GRID_SIZE×GRID_SIZE grid with no pre-existing matches.
 * All other functions in this module are hard-coded to GRID_SIZE, so variable
 * dimensions are intentionally not supported here.
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
        (c >= 2 && grid[r][c - 1] === gem && grid[r][c - 2] === gem) ||
        (r >= 2 && grid[r - 1][c] === gem && grid[r - 2][c] === gem)
      );
      grid[r][c] = gem;
    }
  }
  return grid;
}

/**
 * Returns true if the two cells are adjacent (share an edge).
 */
export function canSwap(grid, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Alias for canSwap for test compatibility
 */
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

/**
 * Finds all horizontal and vertical runs of 3+ matching gems.
 * Returns an array of groups; each group is [{r, c}, …].
 * A cell may appear in more than one group (e.g. L- / T-shape intersections) —
 * clearMatches handles the overlap safely by setting cells to null idempotently.
 *
 * Also adds .matches and .specials properties for test compatibility.
 */
export function findMatches(grid) {
  const groups = [];
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  if (rowCount === 0 || colCount === 0) {
    groups.matches = [];
    groups.specials = [];
    return groups;
  }

  // Helper to get gem type from a cell (handles both string and object formats)
  const getCellType = (cell) => {
    if (!cell) return null;
    if (typeof cell === 'string') return cell;
    return cell.type || cell.kind || null;
  };

  // Horizontal runs — only regular gem types can form matches
  for (let r = 0; r < rowCount; r++) {
    let runStart = 0;
    for (let c = 1; c <= colCount; c++) {
      const currType = c < colCount ? getCellType(grid[r][c]) : null;
      const prevType = getCellType(grid[r][c - 1]);
      const cont = currType && prevType && GEM_TYPES.includes(currType) && currType === prevType;
      if (!cont) {
        if (c - runStart >= 3) {
          const group = [];
          for (let k = runStart; k < c; k++) group.push({ r, c: k });
          groups.push(group);
        }
        runStart = c;
      }
    }
  }

  // Vertical runs — only regular gem types can form matches
  for (let c = 0; c < colCount; c++) {
    let runStart = 0;
    for (let r = 1; r <= rowCount; r++) {
      const currType = r < rowCount ? getCellType(grid[r][c]) : null;
      const prevType = getCellType(grid[r - 1][c]);
      const cont = currType && prevType && GEM_TYPES.includes(currType) && currType === prevType;
      if (!cont) {
        if (r - runStart >= 3) {
          const group = [];
          for (let k = runStart; k < r; k++) group.push({ r: k, c });
          groups.push(group);
        }
        runStart = r;
      }
    }
  }

  // Convert to test-compatible format with .matches and .specials
  const matchesSet = new Set();
  groups.forEach(group => {
    group.forEach(({ r, c }) => matchesSet.add(`${r},${c}`));
  });

  const matches = Array.from(matchesSet).map(key => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });

  // Simple special detection for tests: 5-cell line -> supernova, 5-cell T/L -> bomb
  // Merge overlapping groups into components to properly detect T/L shapes
  const specials = [];
  const cellToGroups = new Map();

  // Build a map of which groups each cell belongs to
  groups.forEach((group, groupIdx) => {
    group.forEach(({ r, c }) => {
      const key = `${r},${c}`;
      if (!cellToGroups.has(key)) cellToGroups.set(key, []);
      cellToGroups.get(key).push(groupIdx);
    });
  });

  // Find cells that are in multiple groups (intersections)
  const visited = new Set();

  groups.forEach((group, groupIdx) => {
    if (visited.has(groupIdx)) return;

    // BFS to find all connected groups (via shared cells)
    const component = new Set([groupIdx]);
    const queue = [groupIdx];
    visited.add(groupIdx);

    while (queue.length > 0) {
      const gIdx = queue.shift();
      groups[gIdx].forEach(({ r, c }) => {
        const key = `${r},${c}`;
        const groupsAtCell = cellToGroups.get(key) || [];
        groupsAtCell.forEach(otherGIdx => {
          if (!visited.has(otherGIdx)) {
            visited.add(otherGIdx);
            component.add(otherGIdx);
            queue.push(otherGIdx);
          }
        });
      });
    }

    // Collect all cells in this component
    const allCells = [];
    const cellSet = new Set();
    component.forEach(gIdx => {
      groups[gIdx].forEach(({ r, c }) => {
        const key = `${r},${c}`;
        if (!cellSet.has(key)) {
          cellSet.add(key);
          allCells.push({ r, c });
        }
      });
    });

    // Now classify this component
    if (allCells.length >= 5) {
      const rows = allCells.map(cell => cell.r);
      const cols = allCells.map(cell => cell.c);
      const height = Math.max(...rows) - Math.min(...rows) + 1;
      const width = Math.max(...cols) - Math.min(...cols) + 1;

      // All in one line (horizontal or vertical) -> supernova at middle
      if (height === 1 || width === 1) {
        const sorted = [...allCells].sort((a, b) => (a.r - b.r) || (a.c - b.c));
        const midIdx = Math.floor(sorted.length / 2);
        specials.push({ row: sorted[midIdx].r, col: sorted[midIdx].c, specialType: 'supernova' });
      }
      // Spanning 2+ rows and 2+ cols -> bomb at intersection (the cell in multiple groups)
      else if (height >= 2 && width >= 2) {
        // Find the intersection cell (the one that appears in multiple groups in this component)
        let intersectionCell = null;
        for (const cell of allCells) {
          const key = `${cell.r},${cell.c}`;
          const groupsAtCell = cellToGroups.get(key) || [];
          const inComponentGroups = groupsAtCell.filter(gIdx => component.has(gIdx));
          if (inComponentGroups.length > 1) {
            intersectionCell = cell;
            break;
          }
        }
        if (intersectionCell) {
          specials.push({ row: intersectionCell.r, col: intersectionCell.c, specialType: 'bomb' });
        }
      }
    }
  });

  groups.matches = matches;
  groups.specials = specials;
  return groups;
}

/**
 * Returns a new grid with all cells referenced by the match groups set to null.
 */
export function clearMatches(grid, matches) {
  const next = grid.map(row => [...row]);
  matches.forEach(group => {
    group.forEach(({ r, c }) => { next[r][c] = null; });
  });
  return next;
}

/**
 * Stub applyMatches for test compatibility
 * The main UI uses a simpler flow but tests expect this signature
 */
export function applyMatches(grid, matchResult) {
  // Simple implementation: clear matches but preserve specials
  const matches = matchResult?.matches || [];
  const specials = matchResult?.specials || [];

  const next = grid.map(row => [...row]);
  const toClear = new Set(matches.map(m => `${m.row},${m.col}`));

  // Place specials first (removing them from clear set)
  for (const s of specials) {
    const key = `${s.row},${s.col}`;
    if (toClear.has(key)) {
      toClear.delete(key);
      // Get the existing type at this position
      const existingCell = grid[s.row]?.[s.col];
      const existingType = typeof existingCell === 'string' ? existingCell :
                          (existingCell?.type || existingCell?.kind || 'star');

      // Supernova specials become wildcards
      if (s.specialType === 'supernova') {
        next[s.row][s.col] = {
          type: 'wild',
          kind: 'wild',
          special: 'supernova',
          createdBy: 'shape'
        };
      } else {
        // Other specials keep their type
        next[s.row][s.col] = {
          type: existingType,
          kind: existingType,
          special: s.specialType,
          createdBy: 'shape'
        };
      }
    }
  }

  // Clear remaining matched cells
  for (const key of toClear) {
    const [r, c] = key.split(',').map(Number);
    next[r][c] = null;
  }

  return next;
}

/**
 * Clears a 3×3 area centred on (r, c) — triggered when a bomb gem detonates.
 */
export function applyBombExplosion(grid, r, c) {
  const next = grid.map(row => [...row]);
  const rowCount = next.length;
  const colCount = next[0]?.length ?? 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rowCount && nc >= 0 && nc < colCount) {
        next[nr][nc] = null;
      }
    }
  }
  return next;
}

/**
 * Sets every cell whose type === targetType to null — triggered by a rainbow gem.
 */
export function applyRainbowClear(grid, targetType) {
  const next = grid.map(row => [...row]);
  const rowCount = next.length;
  const colCount = next[0]?.length ?? 0;
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (next[r][c] === targetType) next[r][c] = null;
    }
  }
  return next;
}

/**
 * Returns the regular gem type that appears most often on the board.
 * Falls back to the first GEM_TYPES entry if no regular gems are present.
 */
export function findMostCommonType(grid) {
  const counts = {};
  GEM_TYPES.forEach(t => { counts[t] = 0; });
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (GEM_TYPES.includes(grid[r][c])) counts[grid[r][c]]++;
    }
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : GEM_TYPES[0];
}

/**
 * Applies gravity: shifts non-null cells downward, fills gaps with new random gems.
 */
export function applyGravity(grid) {
  const next = grid.map(row => [...row]);
  const rowCount = next.length;
  const colCount = next[0]?.length ?? 0;
  for (let c = 0; c < colCount; c++) {
    const gems = [];
    for (let r = rowCount - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    for (let r = rowCount - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : randomGem();
    }
  }
  return next;
}
