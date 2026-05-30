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
 * Creates an initial grid with no pre-existing matches.
 * @param {number} [rows=GRID_SIZE] - Number of rows (defaults to GRID_SIZE)
 * @param {number} [cols=GRID_SIZE] - Number of columns (defaults to GRID_SIZE)
 */
export function createInitialGrid(rows = GRID_SIZE, cols = GRID_SIZE) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
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
 */
export function findMatches(grid) {
  const groups = [];
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  if (rowCount === 0 || colCount === 0) return groups;

  // Horizontal runs — only regular gem types can form matches
  for (let r = 0; r < rowCount; r++) {
    let runStart = 0;
    for (let c = 1; c <= colCount; c++) {
      const cont = c < colCount && grid[r][c] && GEM_TYPES.includes(grid[r][c]) && grid[r][c] === grid[r][c - 1];
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
      const cont = r < rowCount && grid[r][c] && GEM_TYPES.includes(grid[r][c]) && grid[r][c] === grid[r - 1][c];
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
