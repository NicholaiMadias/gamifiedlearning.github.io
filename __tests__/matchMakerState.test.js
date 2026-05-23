import {
  findPowerUpSpawns,
  supernovaBlast,
  placePowerUp,
  POWER_UP
} from '../matchMakerState.js';

describe('matchMakerState v1 power-up helpers', () => {
  test('findPowerUpSpawns returns [] for no matches', () => {
    expect(findPowerUpSpawns([], [])).toEqual([]);
  });

  test('findPowerUpSpawns detects a T/L intersection spawn', () => {
    const grid = [
      ['star', 'heart', 'drop'],
      ['heart', 'heart', 'heart'],
      ['drop', 'heart', 'cross']
    ];
    const matches = [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 }
    ];

    expect(findPowerUpSpawns(grid, matches)).toEqual([{ row: 1, col: 1 }]);
  });

  test('findPowerUpSpawns does not spawn for straight 3-line match only', () => {
    const grid = [
      ['heart', 'heart', 'heart'],
      ['star', 'cross', 'drop']
    ];
    const matches = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 }
    ];

    expect(findPowerUpSpawns(grid, matches)).toEqual([]);
  });

  test('placePowerUp sets POWER_UP at target cell without mutating input grid', () => {
    const grid = [
      ['heart', 'star'],
      ['drop', 'cross']
    ];

    const updated = placePowerUp(grid, 1, 0);
    expect(updated[1][0]).toBe(POWER_UP);
    expect(grid[1][0]).toBe('drop');
  });

  test('supernovaBlast returns clipped square around center', () => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill('heart'));
    const cells = supernovaBlast(grid, 2, 2, 1);

    expect(cells).toHaveLength(9);
    expect(cells).toContainEqual({ row: 1, col: 1 });
    expect(cells).toContainEqual({ row: 3, col: 3 });
  });

  test('supernovaBlast clips at edges', () => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill('heart'));
    const cells = supernovaBlast(grid, 0, 0, 1);

    expect(cells).toHaveLength(4);
    expect(cells).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 }
    ]);
  });
});
