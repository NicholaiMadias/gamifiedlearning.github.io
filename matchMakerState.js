export const GRID_SIZE = 7;

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

/** Probability that any newly spawned gem is a star (supernova) tile. */
const STAR_CHANCE = 0.03;

/**
 * Creates a new gem cell object.
 * @param {string} kind - One of GEM_TYPES.
 * @param {boolean} [star=false] - Whether this is a star (supernova) tile.
 * @returns {{kind: string, star: boolean}}
 */
function makeGem(kind, star = false) {
  return { kind, star };
}

function randomGem() {
  const kind = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
  const star  = Math.random() < STAR_CHANCE;
  return makeGem(kind, star);
}

/**
 * Creates an initial 7×7 grid with no pre-existing matches.
 * Each cell is {kind, star}.
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
        (c >= 2 && grid[r][c - 1]?.kind === gem.kind && grid[r][c - 2]?.kind === gem.kind) ||
        (r >= 2 && grid[r - 1][c]?.kind === gem.kind && grid[r - 2][c]?.kind === gem.kind)
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
 * Finds all horizontal and vertical matches of 3 or more.
 * Returns an array of match arrays, each match being an array of {r, c, star} objects.
 */
export function findMatches(grid) {
  const matched = new Map(); // key -> {r, c, star}

  const key = (r, c) => `${r},${c}`;
  const addMatch = (r, c) => {
    if (!matched.has(key(r, c))) {
      matched.set(key(r, c), { r, c, star: grid[r][c]?.star ?? false });
    }
  };

  // Horizontal — null guard handles grids mid-resolution
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= GRID_SIZE; c++) {
      const cur  = grid[r][c];
      const prev = grid[r][c - 1];
      if (c < GRID_SIZE && cur && prev && cur.kind === prev.kind) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = c - run; k < c; k++) addMatch(r, k);
        }
        run = 1;
      }
    }
  }

  // Vertical — same null guard as above
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= GRID_SIZE; r++) {
      const cur  = grid[r]?.[c];
      const prev = grid[r - 1]?.[c];
      if (r < GRID_SIZE && cur && prev && cur.kind === prev.kind) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = r - run; k < r; k++) addMatch(k, c);
        }
        run = 1;
      }
    }
  }

  if (matched.size === 0) return [];

  // Return as a single match group (for simpler scoring)
  return [[...matched.values()]];
}

/**
 * Returns a new grid with matched cells set to null.
 */
export function clearMatches(grid, matches) {
  const next = grid.map(row => [...row]);
  matches.forEach(group => {
    group.forEach(({ r, c }) => {
      next[r][c] = null;
    });
  });
  return next;
}

/**
 * Clears the entire row and column of a star tile (supernova effect).
 * Returns a new grid with those cells set to null.
 */
export function applySupernova(grid, r, c) {
  const next = grid.map(row => [...row]);
  for (let i = 0; i < GRID_SIZE; i++) {
    next[r][i] = null;
    next[i][c] = null;
  }
  return next;
}

/**
 * Applies gravity: shifts non-null cells down, fills top with new random gems.
 */
export function applyGravity(grid) {
  const next = grid.map(row => [...row]);
  for (let c = 0; c < GRID_SIZE; c++) {
    // Collect non-null gems bottom-to-top; shift() later returns the bottom-most gem first
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    // Fill column from bottom upward: existing gems settle down, new random gems fill the top
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : randomGem();
    }
  }
  return next;
}
