import {
  CONSCIENCE_KEYS,
  CONSCIENCE_DELTAS,
  BOARD_CLEAR_BONUS,
  createConscienceState,
  applyMatchDeltas,
  applyBoardClearBonus,
} from '../conscienceEngine2.js';
import { makeGem } from '../matchMakerState2.js';

function makeGrid(kind) {
  return [[makeGem(kind)]];
}

describe('conscienceEngine2 — createConscienceState', () => {
  test('returns all stats at zero', () => {
    const state = createConscienceState();
    CONSCIENCE_KEYS.forEach(k => expect(state[k]).toBe(0));
  });

  test('returns a fresh independent object each call', () => {
    const a = createConscienceState();
    const b = createConscienceState();
    a.karma = 10;
    expect(b.karma).toBe(0);
  });
});

describe('conscienceEngine2 — applyMatchDeltas', () => {
  test('Radiant match adds +2 Karma', () => {
    const base  = createConscienceState();
    const grid  = makeGrid('radiant');
    const next  = applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    expect(next.karma).toBe(2);
    expect(next.wisdom).toBe(0);
    expect(next.integrity).toBe(0);
    expect(next.community).toBe(0);
  });

  test('Tide match adds +2 Wisdom', () => {
    const base = createConscienceState();
    const grid = makeGrid('tide');
    const next = applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    expect(next.wisdom).toBe(2);
    expect(next.karma).toBe(0);
  });

  test('Forge match adds +2 Integrity', () => {
    const base = createConscienceState();
    const grid = makeGrid('forge');
    const next = applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    expect(next.integrity).toBe(2);
    expect(next.karma).toBe(0);
  });

  test('Verdant match adds +2 Community', () => {
    const base = createConscienceState();
    const grid = makeGrid('verdant');
    const next = applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    expect(next.community).toBe(2);
    expect(next.karma).toBe(0);
  });

  test('Void match adds nothing to any stat', () => {
    const base = createConscienceState();
    const grid = makeGrid('void');
    const next = applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    CONSCIENCE_KEYS.forEach(k => expect(next[k]).toBe(0));
  });

  test('multiple matched cells accumulate correctly', () => {
    const base = createConscienceState();
    // 2 radiant + 1 tide
    const grid = [[makeGem('radiant'), makeGem('radiant'), makeGem('tide')]];
    const next = applyMatchDeltas(base, [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
    ], grid);
    expect(next.karma).toBe(4);   // 2 × radiant
    expect(next.wisdom).toBe(2);  // 1 × tide
  });

  test('stats are capped at 100', () => {
    const base = { karma: 99, wisdom: 0, integrity: 0, community: 0 };
    const grid = makeGrid('radiant');
    const next = applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    expect(next.karma).toBe(100);
  });

  test('does not mutate the original conscience object', () => {
    const base = createConscienceState();
    const grid = makeGrid('radiant');
    applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    expect(base.karma).toBe(0);
  });

  test('skips null grid cells gracefully', () => {
    const base  = createConscienceState();
    const grid  = [[null]];
    const next  = applyMatchDeltas(base, [{ r: 0, c: 0 }], grid);
    CONSCIENCE_KEYS.forEach(k => expect(next[k]).toBe(0));
  });
});

describe('conscienceEngine2 — applyBoardClearBonus', () => {
  test('adds BOARD_CLEAR_BONUS to every stat', () => {
    const base = createConscienceState();
    const next = applyBoardClearBonus(base);
    CONSCIENCE_KEYS.forEach(k => expect(next[k]).toBe(BOARD_CLEAR_BONUS));
  });

  test('caps board-clear bonus at 100', () => {
    const base = { karma: 98, wisdom: 98, integrity: 98, community: 98 };
    const next = applyBoardClearBonus(base);
    CONSCIENCE_KEYS.forEach(k => expect(next[k]).toBe(100));
  });

  test('does not mutate the original object', () => {
    const base = createConscienceState();
    applyBoardClearBonus(base);
    CONSCIENCE_KEYS.forEach(k => expect(base[k]).toBe(0));
  });
});
