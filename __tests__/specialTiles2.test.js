import { getSpawnedSpecial, activateSpecial } from '../specialTiles2.js';
import { SPECIAL, GRID_SIZE, makeGem, createInitialGrid } from '../matchMakerState2.js';

describe('specialTiles2 — getSpawnedSpecial', () => {
  function makeCells(coords) {
    return coords.map(([r, c]) => ({ r, c }));
  }

  test('3-cell match spawns no special tile', () => {
    const cells = makeCells([[0,0],[0,1],[0,2]]);
    expect(getSpawnedSpecial(cells)).toBeNull();
  });

  test('4 horizontal cells spawn LINE_H', () => {
    const cells = makeCells([[0,0],[0,1],[0,2],[0,3]]);
    expect(getSpawnedSpecial(cells)).toBe(SPECIAL.LINE_H);
  });

  test('4 vertical cells spawn LINE_V', () => {
    const cells = makeCells([[0,0],[1,0],[2,0],[3,0]]);
    expect(getSpawnedSpecial(cells)).toBe(SPECIAL.LINE_V);
  });

  test('5 collinear cells spawn NOVA', () => {
    const cells = makeCells([[0,0],[0,1],[0,2],[0,3],[0,4]]);
    expect(getSpawnedSpecial(cells)).toBe(SPECIAL.NOVA);
  });

  test('L/T shaped match (multi-row + multi-col) spawns CROSS', () => {
    // Classic L: 3 horizontal + 2 vertical (5 cells spanning 2 rows and 4 cols)
    const cells = makeCells([[0,0],[0,1],[0,2],[1,0],[2,0]]);
    expect(getSpawnedSpecial(cells)).toBe(SPECIAL.CROSS);
  });

  test('7 or more cells spawn SUPERNOVA', () => {
    const cells = Array.from({ length: 7 }, (_, i) => ({ r: 0, c: i }));
    expect(getSpawnedSpecial(cells)).toBe(SPECIAL.SUPERNOVA);
  });
});

describe('specialTiles2 — activateSpecial', () => {
  function gridWithSpecialAt(r, c, special) {
    const grid = Array.from({ length: GRID_SIZE }, (_, row) =>
      Array.from({ length: GRID_SIZE }, (_, col) => makeGem('aether'))
    );
    grid[r][c] = makeGem('forge', special);
    return grid;
  }

  test('returns empty clearedCells for a non-special gem', () => {
    const grid = createInitialGrid();
    const { clearedCells } = activateSpecial(grid, 0, 0);
    expect(clearedCells).toEqual([]);
  });

  test('returns empty clearedCells for a null cell', () => {
    const grid = createInitialGrid();
    grid[0][0] = null;
    const { clearedCells } = activateSpecial(grid, 0, 0);
    expect(clearedCells).toEqual([]);
  });

  test('LINE_H clears the entire row (7 cells)', () => {
    const grid = gridWithSpecialAt(3, 0, SPECIAL.LINE_H);
    const { clearedCells } = activateSpecial(grid, 3, 0);
    expect(clearedCells).toHaveLength(GRID_SIZE);
    clearedCells.forEach(cell => expect(cell.r).toBe(3));
    for (let col = 0; col < GRID_SIZE; col++) {
      expect(clearedCells.some(cell => cell.c === col)).toBe(true);
    }
  });

  test('LINE_V clears the entire column (7 cells)', () => {
    const grid = gridWithSpecialAt(0, 3, SPECIAL.LINE_V);
    const { clearedCells } = activateSpecial(grid, 0, 3);
    expect(clearedCells).toHaveLength(GRID_SIZE);
    clearedCells.forEach(cell => expect(cell.c).toBe(3));
    for (let row = 0; row < GRID_SIZE; row++) {
      expect(clearedCells.some(cell => cell.r === row)).toBe(true);
    }
  });

  test('CROSS clears entire row + entire column without duplicates at intersection', () => {
    const grid = gridWithSpecialAt(2, 2, SPECIAL.CROSS);
    const { clearedCells } = activateSpecial(grid, 2, 2);
    // row 2: 7 cells  +  col 2: 7 cells  - 1 shared intersection = 13
    expect(clearedCells).toHaveLength(13);
  });

  test('NOVA clears a 3×3 area', () => {
    const grid = gridWithSpecialAt(3, 3, SPECIAL.NOVA);
    const { clearedCells } = activateSpecial(grid, 3, 3);
    expect(clearedCells).toHaveLength(9);
  });

  test('NOVA near an edge clips to within grid bounds', () => {
    const grid = gridWithSpecialAt(0, 0, SPECIAL.NOVA);
    const { clearedCells } = activateSpecial(grid, 0, 0);
    expect(clearedCells).toHaveLength(4); // top-left 2×2 corner only
    clearedCells.forEach(cell => {
      expect(cell.r).toBeGreaterThanOrEqual(0);
      expect(cell.c).toBeGreaterThanOrEqual(0);
    });
  });

  test('SUPERNOVA clears every cell on the board (49 cells)', () => {
    const grid = gridWithSpecialAt(0, 0, SPECIAL.SUPERNOVA);
    const { clearedCells } = activateSpecial(grid, 0, 0);
    expect(clearedCells).toHaveLength(GRID_SIZE * GRID_SIZE);
  });
});
