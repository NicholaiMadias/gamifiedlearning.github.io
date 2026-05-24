/**
 * specialTiles2.js — V2 Special Tile Logic
 * Determines which special tile to spawn from a match,
 * and resolves the board cells each special clears when triggered.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { SPECIAL, GRID_SIZE } from './matchMakerState2.js';

/**
 * Determines which special tile (if any) to spawn for a given match.
 *
 * Rules:
 *   7+ cells  → SUPERNOVA (full-board clear)
 *   L/T shape → CROSS     (row + column clear)
 *   5 cells   → NOVA      (3×3 area clear)
 *   4 cells   → LINE_H    (full row clear, horizontal match)
 *              LINE_V    (full column clear, vertical match)
 *   3 cells   → null      (no special)
 *
 * @param {Array<{r:number, c:number}>} matchCells - Flat matched cell list
 * @returns {string|null} SPECIAL constant or null
 */
export function getSpawnedSpecial(matchCells) {
  const count = matchCells.length;

  if (count >= 7) return SPECIAL.SUPERNOVA;

  const rows = new Set(matchCells.map(cell => cell.r));
  const cols = new Set(matchCells.map(cell => cell.c));

  // L/T shape: spans more than one row AND more than one column
  if (rows.size > 1 && cols.size > 1) return SPECIAL.CROSS;

  if (count >= 5) return SPECIAL.NOVA;
  if (count >= 4) {
    // Orientation: all cells share one row → horizontal; otherwise → vertical
    return rows.size === 1 ? SPECIAL.LINE_H : SPECIAL.LINE_V;
  }
  return null;
}

/**
 * Returns the set of cells cleared when a special tile at (r, c) is triggered.
 * Does not mutate the grid.
 *
 * @param {Array} grid
 * @param {number} r
 * @param {number} c
 * @returns {{ clearedCells: Array<{r:number, c:number}> }}
 */
export function activateSpecial(grid, r, c) {
  const gem = grid[r] && grid[r][c];
  if (!gem || !gem.special) return { clearedCells: [] };

  const clearedCells = [];

  switch (gem.special) {
    case SPECIAL.LINE_H:
      // Clear entire row (horizontal)
      for (let col = 0; col < GRID_SIZE; col++) {
        clearedCells.push({ r, c: col });
      }
      break;

    case SPECIAL.LINE_V:
      // Clear entire column (vertical)
      for (let row = 0; row < GRID_SIZE; row++) {
        clearedCells.push({ r: row, c });
      }
      break;

    case SPECIAL.CROSS:
      // Clear entire row + entire column, deduplicating the intersection
      for (let col = 0; col < GRID_SIZE; col++) clearedCells.push({ r, c: col });
      for (let row = 0; row < GRID_SIZE; row++) {
        if (row !== r) clearedCells.push({ r: row, c });
      }
      break;

    case SPECIAL.NOVA:
      // Clear 3×3 area centred on (r, c)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            clearedCells.push({ r: nr, c: nc });
          }
        }
      }
      break;

    case SPECIAL.SUPERNOVA:
      // Clear the entire board
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          clearedCells.push({ r: row, c: col });
        }
      }
      break;

    default:
      break;
  }

  return { clearedCells };
}
