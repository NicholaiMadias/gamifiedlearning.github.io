/**
 * narrativeBridge2.js — V2 Narrative Beat System
 * Defines 8 beat types and the NarrativeBridge2 class that emits them.
 * (c) 2026 NicholaiMadias — MIT License
 */

/** All 8 V2 narrative beat types */
export const BEAT_TYPE = {
  MATCH:           'match',
  CASCADE:         'cascade',
  SPECIAL_SPAWN:   'special_spawn',
  SPECIAL_TRIGGER: 'special_trigger',
  LEVEL_UP:        'level_up',
  BOARD_CLEAR:     'board_clear',
  OMEN:            'omen',
  FORGE_MOMENT:    'forge_moment',
};

const ALL_BEAT_TYPES = new Set(Object.values(BEAT_TYPE));

function capitalise(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}

/** Beat message generators keyed by beat type */
const BEAT_MESSAGES = {
  [BEAT_TYPE.MATCH]:           ctx => `${capitalise(ctx.element || 'Gem')} match — +${ctx.score || 0}`,
  [BEAT_TYPE.CASCADE]:         ctx => `Chain ×${ctx.chain} — +${ctx.score || 0}`,
  [BEAT_TYPE.SPECIAL_SPAWN]:   ctx => `${capitalise(ctx.special || '')} tile forged!`,
  [BEAT_TYPE.SPECIAL_TRIGGER]: ctx => `${capitalise(ctx.special || '')} unleashed!`,
  [BEAT_TYPE.LEVEL_UP]:        ctx => `Level ${ctx.level} reached — the lattice expands.`,
  [BEAT_TYPE.BOARD_CLEAR]:     ()  => 'Board clear — +5 to all conscience stats!',
  [BEAT_TYPE.OMEN]:            ctx => `✦ ${ctx.title || 'Omen unlocked'}`,
  [BEAT_TYPE.FORGE_MOMENT]:    ctx => `Integrity milestone: "${ctx.fragment || ''}"`,
};

/**
 * Creates an immutable beat object.
 * @param {string} type - One of BEAT_TYPE values
 * @param {object} [ctx] - Context data for the beat message
 * @returns {{ type: string, message: string, ctx: object, timestamp: number }}
 */
export function createBeat(type, ctx = {}) {
  if (!ALL_BEAT_TYPES.has(type)) {
    throw new Error(`Unknown beat type: "${type}"`);
  }
  const message = BEAT_MESSAGES[type](ctx);
  return Object.freeze({ type, message, ctx, timestamp: Date.now() });
}

/**
 * NarrativeBridge2 — emits narrative beats and maintains a history.
 */
export class NarrativeBridge2 {
  /**
   * @param {function} [onBeat] - Callback invoked with each emitted beat
   */
  constructor(onBeat) {
    this._onBeat  = typeof onBeat === 'function' ? onBeat : () => {};
    this._history = [];
  }

  /**
   * Emits a narrative beat of the given type.
   * @param {string} type
   * @param {object} [ctx]
   * @returns {{ type: string, message: string, ctx: object, timestamp: number }}
   */
  emit(type, ctx = {}) {
    const beat = createBeat(type, ctx);
    this._history.push(beat);
    this._onBeat(beat);
    return beat;
  }

  /**
   * Returns a shallow copy of the beat history.
   * @returns {Array}
   */
  getHistory() {
    return [...this._history];
  }

  /** Clears the beat history. */
  clearHistory() {
    this._history = [];
  }
}
