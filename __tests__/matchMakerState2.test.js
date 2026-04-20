import {
  GRID_SIZE,
  ELEMENT_TYPES,
  REGULAR_ELEMENTS,
  WILD_ELEMENT,
  SPECIAL,
  makeGem,
  sameKind,
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
} from '../matchMakerState2.js';

describe('matchMakerState2 — constants', () => {
  test('GRID_SIZE is 7', () => {
    expect(GRID_SIZE).toBe(7);
  });

  test('ELEMENT_TYPES has exactly 7 elements', () => {
    expect(ELEMENT_TYPES).toHaveLength(7);
  });

  test('REGULAR_ELEMENTS has exactly 6 elements', () => {
    expect(REGULAR_ELEMENTS).toHaveLength(6);
  });

  test('WILD_ELEMENT is void', () => {
    expect(WILD_ELEMENT).toBe('void');
  });

  test('SPECIAL has LINE, CROSS, NOVA, SUPERNOVA', () => {
    expect(SPECIAL.LINE).toBe('line');
    expect(SPECIAL.CROSS).toBe('cross');
    expect(SPECIAL.NOVA).toBe('nova');
    expect(SPECIAL.SUPERNOVA).toBe('supernova');
  });
});

describe('matchMakerState2 — makeGem', () => {
  test('creates gem with kind and null special by default', () => {
    const gem = makeGem('radiant');
    expect(gem.kind).toBe('radiant');
    expect(gem.special).toBeNull();
  });

  test('creates gem with a special tile type', () => {
    const gem = makeGem('forge', SPECIAL.LINE);
    expect(gem.kind).toBe('forge');
    expect(gem.special).toBe(SPECIAL.LINE);
  });
});

describe('matchMakerState2 — sameKind', () => {
  test('returns true for two gems of the same kind', () => {
    expect(sameKind(makeGem('radiant'), makeGem('radiant'))).toBe(true);
  });

  test('returns false for two gems of different kinds', () => {
    expect(sameKind(makeGem('radiant'), makeGem('tide'))).toBe(false);
  });

  test('returns true when the first gem is void (wild)', () => {
    expect(sameKind(makeGem('void'), makeGem('forge'))).toBe(true);
  });

  test('returns true when the second gem is void (wild)', () => {
    expect(sameKind(makeGem('aether'), makeGem('void'))).toBe(true);
  });

  test('returns false when either gem is null', () => {
    expect(sameKind(null, makeGem('radiant'))).toBe(false);
    expect(sameKind(makeGem('radiant'), null)).toBe(false);
    expect(sameKind(null, null)).toBe(false);
  });
});

describe('matchMakerState2 — createInitialGrid', () => {
  let grid;
  beforeEach(() => { grid = createInitialGrid(); });

  test('returns a 7×7 grid', () => {
    expect(grid).toHaveLength(7);
    grid.forEach(row => expect(row).toHaveLength(7));
  });

  test('every cell is a gem object with a valid kind', () => {
    grid.forEach(row =>
      row.forEach(gem => {
        expect(gem).not.toBeNull();
        expect(ELEMENT_TYPES).toContain(gem.kind);
      })
    );
  });

  test('contains no pre-existing horizontal matches of 3+', () => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c <= GRID_SIZE - 3; c++) {
        const a = grid[r][c], b = grid[r][c + 1], cc = grid[r][c + 2];
        if (sameKind(a, b) && sameKind(b, cc)) {
          fail(`Pre-existing horizontal match at row ${r} col ${c}`);
        }
      }
    }
  });

  test('contains no pre-existing vertical matches of 3+', () => {
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r <= GRID_SIZE - 3; r++) {
        const a = grid[r][c], b = grid[r + 1][c], cc = grid[r + 2][c];
        if (sameKind(a, b) && sameKind(b, cc)) {
          fail(`Pre-existing vertical match at row ${r} col ${c}`);
        }
      }
    }
  });
});

describe('matchMakerState2 — canSwap', () => {
  const grid = [];

  test('returns true for horizontally adjacent cells', () => {
    expect(canSwap(grid, 0, 0, 0, 1)).toBe(true);
  });

  test('returns true for vertically adjacent cells', () => {
    expect(canSwap(grid, 2, 3, 3, 3)).toBe(true);
  });

  test('returns false for cells two steps apart', () => {
    expect(canSwap(grid, 0, 0, 0, 2)).toBe(false);
  });

  test('returns false for diagonally adjacent cells', () => {
    expect(canSwap(grid, 0, 0, 1, 1)).toBe(false);
  });
});

describe('matchMakerState2 — applySwap', () => {
  test('swaps two cells and returns a new grid without mutating the original', () => {
    const original = createInitialGrid();
    const kindA = original[0][0].kind;
    const kindB = original[0][1].kind;
    const swapped = applySwap(original, 0, 0, 0, 1);
    expect(swapped[0][0].kind).toBe(kindB);
    expect(swapped[0][1].kind).toBe(kindA);
    expect(original[0][0].kind).toBe(kindA); // original unchanged
  });
});

describe('matchMakerState2 — findMatches', () => {
  function makeRow(kinds) {
    const grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => makeGem('aether'))
    );
    kinds.forEach((k, c) => { grid[0][c] = makeGem(k); });
    return grid;
  }

  test('returns empty array when there are no matches', () => {
    const grid = createInitialGrid();
    // createInitialGrid guarantees no initial matches
    expect(findMatches(grid)).toEqual([]);
  });

  test('detects a horizontal match of 3', () => {
    const grid = makeRow(['radiant', 'radiant', 'radiant', 'tide', 'tide', 'forge', 'umbra']);
    const result = findMatches(grid);
    expect(result.length).toBe(1);
    const cells = result[0];
    expect(cells.some(c => c.r === 0 && c.c === 0)).toBe(true);
    expect(cells.some(c => c.r === 0 && c.c === 1)).toBe(true);
    expect(cells.some(c => c.r === 0 && c.c === 2)).toBe(true);
  });

  test('detects a vertical match of 3', () => {
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) =>
        c === 0 && r < 3 ? makeGem('forge') : makeGem('tide')
      )
    );
    const result = findMatches(grid);
    expect(result.length).toBe(1);
    const cells = result[0];
    expect(cells.some(c => c.r === 0 && c.c === 0)).toBe(true);
    expect(cells.some(c => c.r === 2 && c.c === 0)).toBe(true);
  });

  test('void gem bridges a run of otherwise mismatched gems', () => {
    const row = ['radiant', 'void', 'radiant', 'tide', 'tide', 'forge', 'umbra'];
    const grid = makeRow(row);
    const result = findMatches(grid);
    expect(result.length).toBe(1);
    const cells = result[0];
    // All three (indices 0-2) should be in the match
    expect(cells.length).toBeGreaterThanOrEqual(3);
    expect(cells.some(c => c.c === 0)).toBe(true);
    expect(cells.some(c => c.c === 1)).toBe(true);
    expect(cells.some(c => c.c === 2)).toBe(true);
  });
});

describe('matchMakerState2 — clearMatches', () => {
  test('sets matched cells to null', () => {
    const grid = createInitialGrid();
    const toMatch = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }];
    const cleared = clearMatches(grid, toMatch);
    expect(cleared[0][0]).toBeNull();
    expect(cleared[0][1]).toBeNull();
    expect(cleared[0][2]).toBeNull();
    expect(cleared[0][3]).not.toBeNull(); // unaffected cell
  });

  test('does not mutate the original grid', () => {
    const grid = createInitialGrid();
    const kind = grid[0][0].kind;
    clearMatches(grid, [{ r: 0, c: 0 }]);
    expect(grid[0][0].kind).toBe(kind);
  });

  test('replaces a cell with a specified replacement gem', () => {
    const grid = createInitialGrid();
    const repl = { r: 0, c: 0, kind: 'forge', special: SPECIAL.NOVA };
    const result = clearMatches(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }], [repl]);
    expect(result[0][0].kind).toBe('forge');
    expect(result[0][0].special).toBe(SPECIAL.NOVA);
    expect(result[0][1]).toBeNull(); // no replacement for this cell
  });
});

describe('matchMakerState2 — applyGravity', () => {
  test('fills null cells with new gems', () => {
    const grid = createInitialGrid();
    grid[0][0] = null;
    const result = applyGravity(grid);
    expect(result[0][0]).not.toBeNull();
    expect(ELEMENT_TYPES).toContain(result[0][0].kind);
  });

  test('shifts existing gems downward over null gaps', () => {
    const grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => makeGem('radiant'))
    );
    grid[0][0] = null;
    const result = applyGravity(grid);
    // The radiant gem that was in row 1 should now be in row 1 or lower
    expect(result[GRID_SIZE - 1][0].kind).toBe('radiant');
  });

  test('does not mutate the original grid', () => {
    const grid = createInitialGrid();
    grid[0][0] = null;
    applyGravity(grid);
    expect(grid[0][0]).toBeNull();
  });
});
