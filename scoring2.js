/**
 * scoring2.js — V2 Unified Scoring Formula
 * score = base × length_bonus × ley_multiplier × combo_multiplier
 * (c) 2026 NicholaiMadias — MIT License
 */

export const BASE_SCORE = 100;

/**
 * Computes the score for a single match resolution step.
 *
 * @param {object} params
 * @param {number} params.matchCount    - Number of cells in the match
 * @param {number} [params.leyMultiplier=1]  - Current ley-line multiplier (1, 1.5, or 2)
 * @param {number} [params.comboChain=1]     - Cascade chain depth (1 = first match, 2 = second, …)
 * @returns {number} Integer score value
 */
export function computeScore({ matchCount, leyMultiplier = 1, comboChain = 1 }) {
  const lengthBonus = 1 + Math.max(0, matchCount - 3) * 0.5;
  return Math.round(BASE_SCORE * lengthBonus * leyMultiplier * comboChain);
}
