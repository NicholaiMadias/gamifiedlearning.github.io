/**
 * Engine2.test.js — Unit tests for the Match Maker game engine (matchMakerState)
 * Run with: npx jest --testPathPattern="Engine2" --verbose
 */

import {
  GRID_SIZE,
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
} from '../matchMakerState.js';

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

describe('Engine2 — createInitialGrid', () => {
  test('returns a GRID_SIZE × GRID_SIZE grid', () => {
    const grid = createInitialGrid();
    expect(grid.length).toBe(GRID_SIZE);
    grid.forEach(row => expect(row.length).toBe(GRID_SIZE));
  });

  test('all cells contain valid gem types', () => {
    const grid = createInitialGrid();
    grid.forEach(row =>
      row.forEach(cell => expect(GEM_TYPES).toContain(cell))
    );
  });

  test('has no pre-existing matches', () => {
    // Run multiple times to account for randomness
    for (let i = 0; i < 5; i++) {
      const grid = createInitialGrid();
      expect(findMatches(grid)).toHaveLength(0);
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
    const a = grid[2][2];
    const b = grid[2][3];
    const next = applySwap(grid, 2, 2, 2, 3);
    expect(next[2][2]).toBe(b);
    expect(next[2][3]).toBe(a);
  });

  test('does not mutate the original grid', () => {
    const grid = createInitialGrid();
    const original = grid[0][0];
    applySwap(grid, 0, 0, 0, 1);
    expect(grid[0][0]).toBe(original);
  });
});

describe('Engine2 — findMatches', () => {
  test('returns empty array when no matches', () => {
    const grid = createInitialGrid();
    // createInitialGrid guarantees no pre-existing matches
    expect(findMatches(grid)).toHaveLength(0);
  });

  test('detects a horizontal match-3', () => {
    const grid = createInitialGrid();
    grid[0][0] = 'flame';
    grid[0][1] = 'flame';
    grid[0][2] = 'flame';
    // Ensure rows above don't accidentally extend the run
    grid[1][0] = 'star';
    grid[1][1] = 'star';
    grid[1][2] = 'heart';

    const matches = findMatches(grid);
    expect(matches.length).toBeGreaterThan(0);
    const cells = matches.flat();
    // The three forced cells must appear in the result
    expect(cells.some(c => c.r === 0 && c.c === 0)).toBe(true);
    expect(cells.some(c => c.r === 0 && c.c === 1)).toBe(true);
    expect(cells.some(c => c.r === 0 && c.c === 2)).toBe(true);
  });

  test('detects a vertical match-3', () => {
    const grid = createInitialGrid();
    grid[0][0] = 'drop';
    grid[1][0] = 'drop';
    grid[2][0] = 'drop';
    grid[0][1] = 'heart';
    grid[1][1] = 'star';
    grid[2][1] = 'cross';

    const matches = findMatches(grid);
    expect(matches.length).toBeGreaterThan(0);
    const cells = matches.flat();
    expect(cells.some(c => c.r === 0 && c.c === 0)).toBe(true);
    expect(cells.some(c => c.r === 1 && c.c === 0)).toBe(true);
    expect(cells.some(c => c.r === 2 && c.c === 0)).toBe(true);
  });
});

describe('Engine2 — clearMatches', () => {
  test('sets matched cells to null', () => {
    const grid = createInitialGrid();
    grid[0][0] = 'cross';
    grid[0][1] = 'cross';
    grid[0][2] = 'cross';
    grid[0][3] = 'star'; // break any longer run

    const matches = findMatches(grid);
    expect(matches.length).toBeGreaterThan(0);
    const cleared = clearMatches(grid, matches);

    expect(cleared[0][0]).toBeNull();
    expect(cleared[0][1]).toBeNull();
    expect(cleared[0][2]).toBeNull();
  });

  test('does not mutate the original grid', () => {
    const grid = createInitialGrid();
    grid[0][0] = 'heart';
    grid[0][1] = 'heart';
    grid[0][2] = 'heart';
    const matches = findMatches(grid);
    clearMatches(grid, matches);
    expect(grid[0][0]).toBe('heart');
  });
});

describe('Engine2 — applyGravity', () => {
  test('fills null cells so no nulls remain', () => {
    const grid = createInitialGrid();
    grid[0][0] = 'star';
    grid[0][1] = 'star';
    grid[0][2] = 'star';
    const matches = findMatches(grid);
    const cleared = clearMatches(grid, matches);
    const settled = applyGravity(cleared);

    settled.forEach(row =>
      row.forEach(cell => expect(cell).not.toBeNull())
    );
  });

  test('existing gems fall toward the bottom', () => {
    // Build a grid with known values — alternate by (r+c) to avoid matches
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) =>
        GEM_TYPES[(r + c) % GEM_TYPES.length]
      )
    );
    // Punch a hole at row 3, column 3; the gem currently at row 2 should fall into it
    const gemAboveHole = grid[2][3];
    grid[3][3] = null;

    const settled = applyGravity(grid);
    // Gravity pulls gems downward: gem from row 2 moves into the vacated row 3 slot
    expect(settled[3][3]).toBe(gemAboveHole);
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
