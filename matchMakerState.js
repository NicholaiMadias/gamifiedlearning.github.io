export const GRID_SIZE = 7;

export const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

// Lavender is a rare narrative tile that spawns at ~4% rate
const LAVENDER_CHANCE = 0.04;
// When heartBoost buff is active, heart tiles get an extra 10% spawn chance
const HEART_BOOST_CHANCE = 0.10;

function randomGem(buffs = {}) {
  if (buffs.heartBoost && Math.random() < HEART_BOOST_CHANCE) return 'heart';
  if (Math.random() < LAVENDER_CHANCE) return 'lavender';
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
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
 * Finds all horizontal and vertical matches of 3 or more.
 * Returns an array of match arrays, each match being an array of {r, c} objects.
 */
export function findMatches(grid) {
  const matched = new Set();

  const key = (r, c) => `${r},${c}`;

  // Horizontal — null guard handles grids mid-resolution (between clearMatches and applyGravity)
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= GRID_SIZE; c++) {
      if (c < GRID_SIZE && grid[r][c] && grid[r][c] === grid[r][c - 1]) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = c - run; k < c; k++) matched.add(key(r, k));
        }
        run = 1;
      }
    }
  }

  // Vertical — same null guard as above
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= GRID_SIZE; r++) {
      if (r < GRID_SIZE && grid[r][c] && grid[r][c] === grid[r - 1][c]) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = r - run; k < r; k++) matched.add(key(k, c));
        }
        run = 1;
      }
    }
  }

  if (matched.size === 0) return [];

  // Return as a single match group (for simpler scoring)
  return [[...matched].map(k => {
    const [r, c] = k.split(',').map(Number);
    return { r, c };
  })];
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
 * Applies gravity: shifts non-null cells down, fills top with buff-aware random gems.
 * @param {string[][]} grid
 * @param {{ heartBoost?: boolean }} [buffs]
 */
export function applyGravityWithBuffs(grid, buffs = {}) {
  const next = grid.map(row => [...row]);
  for (let c = 0; c < GRID_SIZE; c++) {
    // Collect non-null gems bottom-to-top; shift() later returns the bottom-most gem first
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    // Fill column from bottom upward: existing gems settle down, new random gems fill the top
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : randomGem(buffs);
    }
  }
  return next;
}

/**
 * Applies gravity: shifts non-null cells down, fills top with new random gems.
 */
export function applyGravity(grid) {
  return applyGravityWithBuffs(grid, {});
}
