import {
  LEY_STATE,
  LEY_MULTIPLIER,
  createLeyState,
  advanceLey,
  getMultiplier,
  resetLey,
} from '../leySystem2.js';

describe('leySystem2 — createLeyState', () => {
  test('starts in DORMANT state with charge 0', () => {
    const ley = createLeyState();
    expect(ley.state).toBe(LEY_STATE.DORMANT);
    expect(ley.charge).toBe(0);
  });
});

describe('leySystem2 — advanceLey', () => {
  test('small match keeps ley in DORMANT', () => {
    const ley  = createLeyState();
    const next = advanceLey(ley, 3); // charge = 3, below ACTIVE threshold
    expect(next.state).toBe(LEY_STATE.DORMANT);
    expect(next.charge).toBe(3);
  });

  test('reaching threshold 8 advances to ACTIVE', () => {
    const ley  = createLeyState();
    const next = advanceLey(ley, 8);
    expect(next.state).toBe(LEY_STATE.ACTIVE);
  });

  test('reaching threshold 20 advances to CHARGED', () => {
    const ley  = createLeyState();
    const next = advanceLey(ley, 20);
    expect(next.state).toBe(LEY_STATE.CHARGED);
  });

  test('charge accumulates across consecutive calls', () => {
    let ley = createLeyState();
    ley = advanceLey(ley, 5);
    ley = advanceLey(ley, 5); // total = 10 → ACTIVE
    expect(ley.state).toBe(LEY_STATE.ACTIVE);
    expect(ley.charge).toBe(10);
  });

  test('does not mutate the original ley state', () => {
    const ley = createLeyState();
    advanceLey(ley, 10);
    expect(ley.charge).toBe(0);
    expect(ley.state).toBe(LEY_STATE.DORMANT);
  });
});

describe('leySystem2 — getMultiplier', () => {
  test('DORMANT returns 1.0', () => {
    expect(getMultiplier({ state: LEY_STATE.DORMANT })).toBe(1.0);
  });

  test('ACTIVE returns 1.5', () => {
    expect(getMultiplier({ state: LEY_STATE.ACTIVE })).toBe(1.5);
  });

  test('CHARGED returns 2.0', () => {
    expect(getMultiplier({ state: LEY_STATE.CHARGED })).toBe(2.0);
  });

  test('unknown state falls back to 1.0', () => {
    expect(getMultiplier({ state: 'unknown' })).toBe(1.0);
  });
});

describe('leySystem2 — resetLey', () => {
  test('returns a fresh DORMANT state with charge 0', () => {
    const charged = { state: LEY_STATE.CHARGED, charge: 25 };
    const reset   = resetLey(charged);
    expect(reset.state).toBe(LEY_STATE.DORMANT);
    expect(reset.charge).toBe(0);
  });
});
