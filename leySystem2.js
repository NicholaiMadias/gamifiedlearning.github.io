/**
 * leySystem2.js — V2 Ley-Line Multiplier System
 * Tracks a charge accumulator that advances the ley state from
 * Dormant → Active → Charged, increasing the score multiplier.
 * (c) 2026 NicholaiMadias — MIT License
 */

export const LEY_STATE = {
  DORMANT:  'dormant',
  ACTIVE:   'active',
  CHARGED:  'charged',
};

/** Score multiplier for each ley state */
export const LEY_MULTIPLIER = {
  [LEY_STATE.DORMANT]:  1.0,
  [LEY_STATE.ACTIVE]:   1.5,
  [LEY_STATE.CHARGED]:  2.0,
};

/** Charge threshold to enter ACTIVE state */
const ACTIVE_THRESHOLD  =  8;
/** Charge threshold to enter CHARGED state */
const CHARGED_THRESHOLD = 20;

/**
 * Creates a fresh ley state (Dormant, charge = 0).
 * @returns {{ state: string, charge: number }}
 */
export function createLeyState() {
  return { state: LEY_STATE.DORMANT, charge: 0 };
}

/**
 * Advances the ley state by adding matchCount to the charge accumulator.
 * @param {{ state: string, charge: number }} ley
 * @param {number} matchCount - Cells cleared in this match step
 * @returns {{ state: string, charge: number }}
 */
export function advanceLey(ley, matchCount) {
  const charge = ley.charge + matchCount;
  let state;
  if (charge >= CHARGED_THRESHOLD) {
    state = LEY_STATE.CHARGED;
  } else if (charge >= ACTIVE_THRESHOLD) {
    state = LEY_STATE.ACTIVE;
  } else {
    state = LEY_STATE.DORMANT;
  }
  return { state, charge };
}

/**
 * Returns the score multiplier for the given ley state.
 * @param {{ state: string }} ley
 * @returns {number}
 */
export function getMultiplier(ley) {
  return LEY_MULTIPLIER[ley.state] ?? 1.0;
}

/**
 * Resets ley state to Dormant (e.g., on new game).
 * @returns {{ state: string, charge: number }}
 */
export function resetLey() {
  return { state: LEY_STATE.DORMANT, charge: 0 };
}
