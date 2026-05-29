export const GRID_SIZE = 7;

const GEM_TYPES = ['yellow', 'white', 'blue', 'green', 'red', 'purple'];
export const SPECIAL_GEM_TYPES = {
  BOMB: 'bomb',
  LIGHTNING: 'lightning',
  RAINBOW: 'rainbow'
};

function randomGem() {
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
 * Applies special gem effects to the grid
 * @param {Array} grid - Current game grid
 * @param {string} gemType - Type of special gem (bomb, lightning, rainbow)
 * @param {number} r - Row position
 * @param {number} c - Column position
 * @returns {Object} { grid, clearedCells } - Updated grid and array of cleared cell positions
 */
export function applySpecialGem(grid, gemType, r, c) {
  const next = grid.map(row => [...row]);
  const clearedCells = [];

  if (gemType === SPECIAL_GEM_TYPES.BOMB) {
    // Bomb clears 3x3 area around the cell
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          if (next[nr][nc] !== null) {
            clearedCells.push({ r: nr, c: nc });
            next[nr][nc] = null;
          }
        }
      }
    }
  } else if (gemType === SPECIAL_GEM_TYPES.LIGHTNING) {
    // Lightning clears entire row and column
    for (let i = 0; i < GRID_SIZE; i++) {
      // Clear row
      if (next[r][i] !== null) {
        clearedCells.push({ r, c: i });
        next[r][i] = null;
      }
      // Clear column
      if (next[i][c] !== null) {
        clearedCells.push({ r: i, c });
        next[i][c] = null;
      }
    }
  } else if (gemType === SPECIAL_GEM_TYPES.RAINBOW) {
    // Rainbow clears all gems of the same type as the selected cell
    const targetType = grid[r][c];
    if (targetType) {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (next[row][col] === targetType) {
            clearedCells.push({ r: row, c: col });
            next[row][col] = null;
          }
        }
      }
    }
  }

  return { grid: next, clearedCells };
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
