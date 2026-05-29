import {
  GRID_SIZE,
  isAdjacent,
  applySwap,
  findMatches,
  applyMatches,
} from '../matchMakerState.js';

function gem(type, special = null) {
  return { type, special, createdBy: null };
}

function make7x7(fillType = 'star') {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => gem(fillType))
  );
}

describe('matchMakerState (v1) — adjacency and swaps', () => {
  test('isAdjacent returns true for edge-neighbors', () => {
    expect(isAdjacent(0, 0, 0, 1)).toBe(true);
    expect(isAdjacent(0, 0, 1, 0)).toBe(true);
  });

  test('isAdjacent returns false for diagonals / distance > 1', () => {
    expect(isAdjacent(0, 0, 1, 1)).toBe(false);
    expect(isAdjacent(0, 0, 0, 2)).toBe(false);
  });

  test('applySwap returns a new grid and swaps cells', () => {
    const grid = make7x7('star');
    grid[0][0] = gem('heart');
    grid[0][1] = gem('cross');

    const next = applySwap(grid, 0, 0, 0, 1);
    expect(next).not.toBe(grid);
    expect(next[0][0].type).toBe('cross');
    expect(next[0][1].type).toBe('heart');
    expect(grid[0][0].type).toBe('heart');
    expect(grid[0][1].type).toBe('cross');
  });
});

describe('matchMakerState (v1) — match detection and special classification', () => {
  test('findMatches returns matches for a horizontal 3-run', () => {
    const grid = make7x7('star');
    grid[2][1] = gem('heart');
    grid[2][2] = gem('heart');
    grid[2][3] = gem('heart');

    const res = findMatches(grid);
    expect(res.matches).toEqual(
      expect.arrayContaining([
        { row: 2, col: 1 },
        { row: 2, col: 2 },
        { row: 2, col: 3 },
      ])
    );
  });

  test('findMatches classifies a 5-cell T-shape as a bomb special at the intersection', () => {
    const grid = make7x7('star');
    const t = 'cross';
    grid[3][3] = gem(t);
    grid[3][2] = gem(t);
    grid[3][4] = gem(t);
    grid[2][3] = gem(t);
    grid[4][3] = gem(t);

    const res = findMatches(grid);
    expect(res.specials).toEqual(
      expect.arrayContaining([
        { row: 3, col: 3, specialType: 'bomb' },
      ])
    );
  });

  test('findMatches classifies a 5-cell line as a supernova and applyMatches preserves it', () => {
    const grid = make7x7('star');
    const t = 'heart';
    grid[3][1] = gem(t);
    grid[3][2] = gem(t);
    grid[3][3] = gem(t);
    grid[3][4] = gem(t);
    grid[3][5] = gem(t);

    const res = findMatches(grid);
    expect(res.specials).toEqual(
      expect.arrayContaining([
        { row: 3, col: 3, specialType: 'supernova' },
      ])
    );

    const next = applyMatches(grid, res, 1);
    expect(next[3][3]).toEqual(
      expect.objectContaining({ type: t, special: 'supernova' })
    );
    expect(next[3][1]).toBeNull();
    expect(next[3][2]).toBeNull();
    expect(next[3][4]).toBeNull();
    expect(next[3][5]).toBeNull();
  });

  test('applyMatches clears matched cells but keeps newly-created specials', () => {
    const grid = make7x7('star');
    const t = 'cross';
    grid[3][3] = gem(t);
    grid[3][2] = gem(t);
    grid[3][4] = gem(t);
    grid[2][3] = gem(t);
    grid[4][3] = gem(t);

    const res = findMatches(grid);
    const next = applyMatches(grid, res, 1);

    // Special should exist at the intersection and not be null.
    expect(next[3][3]).not.toBeNull();
    expect(next[3][3].special).toBe('bomb');

    // Other matched cells should be cleared.
    expect(next[3][2]).toBeNull();
    expect(next[3][4]).toBeNull();
    expect(next[2][3]).toBeNull();
    expect(next[4][3]).toBeNull();
  });
});
