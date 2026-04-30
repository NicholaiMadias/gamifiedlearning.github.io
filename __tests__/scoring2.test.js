import { computeScore, BASE_SCORE } from '../scoring2.js';

describe('scoring2 — computeScore', () => {
  test('a 3-cell match at default multipliers returns BASE_SCORE', () => {
    const pts = computeScore({ matchCount: 3 });
    expect(pts).toBe(BASE_SCORE); // 100 × 1 × 1 × 1 = 100
  });

  test('a 4-cell match applies a 1.5× length bonus', () => {
    const pts = computeScore({ matchCount: 4 });
    expect(pts).toBe(Math.round(BASE_SCORE * 1.5)); // 150
  });

  test('a 5-cell match applies a 2× length bonus', () => {
    const pts = computeScore({ matchCount: 5 });
    expect(pts).toBe(Math.round(BASE_SCORE * 2)); // 200
  });

  test('a 7-cell match applies a 3× length bonus', () => {
    const pts = computeScore({ matchCount: 7 });
    expect(pts).toBe(Math.round(BASE_SCORE * 3)); // 300
  });

  test('ley multiplier of 1.5 scales the result', () => {
    const pts = computeScore({ matchCount: 3, leyMultiplier: 1.5 });
    expect(pts).toBe(Math.round(BASE_SCORE * 1 * 1.5 * 1)); // 150
  });

  test('ley multiplier of 2.0 doubles the result', () => {
    const pts = computeScore({ matchCount: 3, leyMultiplier: 2.0 });
    expect(pts).toBe(Math.round(BASE_SCORE * 2)); // 200
  });

  test('combo chain multiplier of 3 triples the result', () => {
    const pts = computeScore({ matchCount: 3, comboChain: 3 });
    expect(pts).toBe(Math.round(BASE_SCORE * 3)); // 300
  });

  test('all multipliers stack multiplicatively', () => {
    const pts = computeScore({ matchCount: 4, leyMultiplier: 2.0, comboChain: 2 });
    // 100 × 1.5 (4-cell) × 2.0 (ley) × 2 (chain) = 600
    expect(pts).toBe(600);
  });

  test('result is always an integer (Math.round)', () => {
    const pts = computeScore({ matchCount: 3, leyMultiplier: 1.5, comboChain: 1 });
    expect(Number.isInteger(pts)).toBe(true);
  });

  test('a matchCount below 3 still returns a non-zero score (no negative bonus)', () => {
    const pts = computeScore({ matchCount: 1 });
    expect(pts).toBe(BASE_SCORE); // length_bonus = max(0, …) = 0, so 1×
  });
});
