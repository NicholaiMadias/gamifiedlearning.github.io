/**
 * conscienceEngine2.js — V2 Conscience Delta System
 * Tracks Karma, Wisdom, Integrity, and Community stats.
 * Each element type contributes specific deltas on match.
 * A board-clear awards +5 to all four stats.
 * (c) 2026 NicholaiMadias — MIT License
 */

/** Stat keys for V2 conscience system */
export const CONSCIENCE_KEYS = ['karma', 'wisdom', 'integrity', 'community'];

/**
 * Per-element conscience deltas awarded for each matched cell of that type.
 * Aether and Umbra split across two stats; Void (wild) awards nothing directly.
 */
export const CONSCIENCE_DELTAS = {
  radiant: { karma: 2, wisdom: 0, integrity: 0, community: 0 },
  tide:    { karma: 0, wisdom: 2, integrity: 0, community: 0 },
  forge:   { karma: 0, wisdom: 0, integrity: 2, community: 0 },
  verdant: { karma: 0, wisdom: 0, integrity: 0, community: 2 },
  aether:  { karma: 1, wisdom: 1, integrity: 0, community: 0 },
  umbra:   { karma: 0, wisdom: 0, integrity: 1, community: 1 },
  void:    { karma: 0, wisdom: 0, integrity: 0, community: 0 },
};

/** Points added to each stat on a board-clear achievement */
export const BOARD_CLEAR_BONUS = 5;

/**
 * Creates a fresh conscience state with all stats at zero.
 * @returns {{ karma: number, wisdom: number, integrity: number, community: number }}
 */
export function createConscienceState() {
  return { karma: 0, wisdom: 0, integrity: 0, community: 0 };
}

/**
 * Applies conscience deltas for a set of matched cells.
 * @param {{ karma:number, wisdom:number, integrity:number, community:number }} conscience
 * @param {Array<{r:number, c:number}>} matchedCells
 * @param {Array<Array<{kind:string}|null>>} grid - Current grid to look up element types
 * @returns {{ karma:number, wisdom:number, integrity:number, community:number }}
 */
export function applyMatchDeltas(conscience, matchedCells, grid) {
  const next = { ...conscience };
  matchedCells.forEach(({ r, c }) => {
    const gem = grid[r] && grid[r][c];
    if (!gem) return;
    const delta = CONSCIENCE_DELTAS[gem.kind] || {};
    CONSCIENCE_KEYS.forEach(k => {
      next[k] = Math.min(100, next[k] + (delta[k] || 0));
    });
  });
  return next;
}

/**
 * Applies the board-clear bonus (+5 to every stat).
 * @param {{ karma:number, wisdom:number, integrity:number, community:number }} conscience
 * @returns {{ karma:number, wisdom:number, integrity:number, community:number }}
 */
export function applyBoardClearBonus(conscience) {
  const next = { ...conscience };
  CONSCIENCE_KEYS.forEach(k => {
    next[k] = Math.min(100, next[k] + BOARD_CLEAR_BONUS);
  });
  return next;
}
