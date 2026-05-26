import { findPowerUpSpawns, supernovaBlast, placePowerUp } from '../src/engines/v1MatchEngine.js';

describe('V1 Power-Up Engine - Match Detection & Explosion Verification', () => {
  let mockGrid;

  beforeEach(() => {
    mockGrid = {
      rows: 5,
      cols: 5,
      matrix: Array(5).fill(null).map(() => Array(5).fill(null).map(() => ({ type: 'NORMAL', val: 0, special: 'NONE' })))
    };
  });

  describe('findPowerUpSpawns', () => {
    test('should identify horizontal 4-matches and suggest a LINE_V vertical clearer', () => {
      const matchCoordinates = [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }
      ];

      const spawnType = findPowerUpSpawns(matchCoordinates);
      expect(spawnType).toBe('LINE_V');
    });

    test('should identify vertical 4-matches and suggest a LINE_H horizontal clearer', () => {
      const matchCoordinates = [
        { row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 3, col: 2 }
      ];

      const spawnType = findPowerUpSpawns(matchCoordinates);
      expect(spawnType).toBe('LINE_H');
    });
  });

  describe('placePowerUp', () => {
    test('should mutate grid to place special properties cleanly at targeted point', () => {
      placePowerUp(mockGrid, 2, 2, 'LINE_H');

      expect(mockGrid.matrix[2][2].special).toBe('LINE_H');
      expect(mockGrid.matrix[2][2].type).toBe('SPECIAL');
    });
  });

  describe('supernovaBlast', () => {
    test('should wipe entire targeted row coordinates when a LINE_H detonates', () => {
      const clearedCoordinates = [];
      const mockClearCallback = (r, c) => clearedCoordinates.push({ row: r, col: c });

      supernovaBlast(mockGrid, 2, 2, 'LINE_H', mockClearCallback);

      expect(clearedCoordinates.length).toBe(mockGrid.cols);
      expect(clearedCoordinates).toContainEqual({ row: 2, col: 0 });
      expect(clearedCoordinates).toContainEqual({ row: 2, col: 4 });
    });

    test('should wipe entire targeted column coordinates when a LINE_V detonates', () => {
      const clearedCoordinates = [];
      const mockClearCallback = (r, c) => clearedCoordinates.push({ row: r, col: c });

      supernovaBlast(mockGrid, 1, 3, 'LINE_V', mockClearCallback);

      expect(clearedCoordinates.length).toBe(mockGrid.rows);
      expect(clearedCoordinates).toContainEqual({ row: 0, col: 3 });
      expect(clearedCoordinates).toContainEqual({ row: 4, col: 3 });
    });
  });
});
