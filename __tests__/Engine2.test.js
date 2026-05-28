/**
 * Engine2.test.js — Unit tests for the Match Maker game engine (matchMakerState)
 * Run with: npm test -- --testPathPattern="Engine2" --verbose
 */

import {
  GRID_SIZE,
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  applyMatches,
  applyGravity,
} from '../matchMakerState.js';

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

/** Helper: create a gem object (mirrors makeGem inside matchMakerState.js). */
const gem = type => ({ type, special: null, createdBy: null });

describe('Engine2 — createInitialGrid', () => {
  test('returns a GRID_SIZE × GRID_SIZE grid', () => {
    const grid = createInitialGrid();
    expect(grid.length).toBe(GRID_SIZE);
    grid.forEach(row => expect(row.length).toBe(GRID_SIZE));
  });

  test('all cells contain valid gem types', () => {
    const grid = createInitialGrid();
    grid.forEach(row =>
      row.forEach(cell => expect(GEM_TYPES).toContain(cell.type))
    );
  });

  test('has no pre-existing matches', () => {
    // Run multiple times to account for randomness
    for (let i = 0; i < 5; i++) {
      const grid = createInitialGrid();
      expect(findMatches(grid).matches).toHaveLength(0);
    }
  });
});

describe('Engine2 — canSwap', () => {
  let grid;
  beforeEach(() => { grid = createInitialGrid(); });

  test('returns true for horizontally adjacent cells', () => {
    expect(canSwap(grid, 0, 0, 0, 1)).toBe(true);
    expect(canSwap(grid, 3, 2, 3, 3)).toBe(true);
  });

  test('returns true for vertically adjacent cells', () => {
    expect(canSwap(grid, 0, 0, 1, 0)).toBe(true);
    expect(canSwap(grid, 5, 5, 6, 5)).toBe(true);
  });

  test('returns false for diagonal cells', () => {
    expect(canSwap(grid, 0, 0, 1, 1)).toBe(false);
  });

  test('returns false for non-adjacent cells', () => {
    expect(canSwap(grid, 0, 0, 0, 2)).toBe(false);
    expect(canSwap(grid, 0, 0, 3, 0)).toBe(false);
  });
});

describe('Engine2 — applySwap', () => {
  test('swaps gem values between two cells', () => {
    const grid = createInitialGrid();
    const typeA = grid[2][2].type;
    const typeB = grid[2][3].type;
    const next = applySwap(grid, 2, 2, 2, 3);
    expect(next[2][2].type).toBe(typeB);
    expect(next[2][3].type).toBe(typeA);
  });

  test('does not mutate the original grid', () => {
    const grid = createInitialGrid();
    const originalType = grid[0][0].type;
    applySwap(grid, 0, 0, 0, 1);
    expect(grid[0][0].type).toBe(originalType);
  });
});

describe('Engine2 — findMatches', () => {
  test('returns empty matches array when no matches', () => {
    const grid = createInitialGrid();
    // createInitialGrid guarantees no pre-existing matches
    expect(findMatches(grid).matches).toHaveLength(0);
  });

  test('detects a horizontal match-3', () => {
    const grid = createInitialGrid();
    grid[0][0] = gem('flame');
    grid[0][1] = gem('flame');
    grid[0][2] = gem('flame');
    // Ensure row below doesn't accidentally extend the run vertically
    grid[1][0] = gem('star');
    grid[1][1] = gem('star');
    grid[1][2] = gem('heart');

    const { matches } = findMatches(grid);
    expect(matches.length).toBeGreaterThan(0);
    // The three forced cells must appear in the result
    expect(matches.some(c => c.row === 0 && c.col === 0)).toBe(true);
    expect(matches.some(c => c.row === 0 && c.col === 1)).toBe(true);
    expect(matches.some(c => c.row === 0 && c.col === 2)).toBe(true);
  });

  test('detects a vertical match-3', () => {
    const grid = createInitialGrid();
    grid[0][0] = gem('drop');
    grid[1][0] = gem('drop');
    grid[2][0] = gem('drop');
    grid[0][1] = gem('heart');
    grid[1][1] = gem('star');
    grid[2][1] = gem('cross');

    const { matches } = findMatches(grid);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some(c => c.row === 0 && c.col === 0)).toBe(true);
    expect(matches.some(c => c.row === 1 && c.col === 0)).toBe(true);
    expect(matches.some(c => c.row === 2 && c.col === 0)).toBe(true);
  });
});

describe('Engine2 — applyMatches (clear matched cells)', () => {
  test('sets matched cells to null', () => {
    const grid = createInitialGrid();
    grid[0][0] = gem('cross');
    grid[0][1] = gem('cross');
    grid[0][2] = gem('cross');
    grid[0][3] = gem('star'); // break any longer run

    const matchResult = findMatches(grid);
    expect(matchResult.matches.length).toBeGreaterThan(0);
    const cleared = applyMatches(grid, matchResult);

    // Cells in the match that were not converted to special tiles must be null
    const matchedKeys = new Set(matchResult.matches.map(m => `${m.row},${m.col}`));
    const specialKeys = new Set(matchResult.specials.map(s => `${s.row},${s.col}`));
    for (const key of matchedKeys) {
      if (!specialKeys.has(key)) {
        const [r, c] = key.split(',').map(Number);
        expect(cleared[r][c]).toBeNull();
      }
    }
  });

  test('does not mutate the original grid', () => {
    const grid = createInitialGrid();
    grid[0][0] = gem('heart');
    grid[0][1] = gem('heart');
    grid[0][2] = gem('heart');
    const matchResult = findMatches(grid);
    applyMatches(grid, matchResult);
    expect(grid[0][0].type).toBe('heart');
  });
});

describe('Engine2 — applyGravity', () => {
  test('fills null cells so no nulls remain', () => {
    const grid = createInitialGrid();
    grid[0][0] = gem('star');
    grid[0][1] = gem('star');
    grid[0][2] = gem('star');
    const matchResult = findMatches(grid);
    const cleared = applyMatches(grid, matchResult);
    const settled = applyGravity(cleared);

    settled.forEach(row =>
      row.forEach(cell => expect(cell).not.toBeNull())
    );
  });

  test('existing gems fall toward the bottom', () => {
    // Build a grid with known gem objects — alternate by (r+c) to avoid matches
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) =>
        gem(GEM_TYPES[(r + c) % GEM_TYPES.length])
      )
    );
    // Punch a hole at row 3, column 3; the gem at row 2 should fall into it
    const gemAboveHoleType = grid[2][3].type;
    grid[3][3] = null;

    const settled = applyGravity(grid);
    // Gravity pulls gems downward: gem from row 2 moves into the vacated row 3 slot
    expect(settled[3][3].type).toBe(gemAboveHoleType);
    // A new random gem is generated to fill the top of the column
    expect(settled[0][3]).not.toBeNull();
  });

  test('grid dimensions are preserved after gravity', () => {
    const grid = createInitialGrid();
    grid[3][3] = null;
    grid[3][4] = null;
    const settled = applyGravity(grid);
    expect(settled.length).toBe(GRID_SIZE);
    settled.forEach(row => expect(row.length).toBe(GRID_SIZE));
  });
});
