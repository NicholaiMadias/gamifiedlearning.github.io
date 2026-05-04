import gameConfig from '../config/gameConfig.json' with { type: 'json' };
import { playFX } from './fxEngine.js';

/* ── Effect stubs ────────────────────────────────────────────────────────── */

function lineClear()       { /* TODO: implement line-clear board effect */ }
function crossExplosion()  { /* TODO: implement cross-explosion board effect */ }
function colorClear()      { /* TODO: implement color-clear board effect */ }
function divineRevelation(){ /* TODO: implement board-transform effect */ }

const effectHandlers = {
  lineClear,
  crossExplosion,
  colorClear,
  boardTransform: divineRevelation,
};

/* ── Resolver ────────────────────────────────────────────────────────────── */

/**
 * Activates the power-up identified by `type`, plays its FX, and triggers the
 * corresponding board effect.
 *
 * @param {string} type - Power-up key from gameConfig.powerUps (e.g. "shootingStar").
 * @returns {*} Return value of the triggered effect function, or null if unknown.
 */
export function resolvePowerUp(type) {
  const p = gameConfig.powerUps[type];
  if (!p) return null;

  playFX(p.fx);

  return effectHandlers[p.effect]?.() ?? null;
}
