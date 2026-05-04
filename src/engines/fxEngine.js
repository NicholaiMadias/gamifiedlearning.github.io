import gameConfig from '../config/gameConfig.json' with { type: 'json' };

/** Internal queue consumed by the rendering loop. */
const fxQueue = [];

/**
 * Enqueues a visual effect for playback.
 *
 * @param {string} type    - FX key from gameConfig.graphics.fx (e.g. "sparkBurst").
 * @param {object} payload - Additional data passed through to the renderer.
 */
export function playFX(type, payload = {}) {
  const fxSprite = gameConfig.graphics.fx[type];
  if (!fxSprite) return;
  fxQueue.push({ sprite: fxSprite, ...payload });
}

/**
 * Drains and returns all pending FX entries.
 * The rendering loop should call this each frame.
 *
 * @returns {Array<{ sprite: string }>}
 */
export function drainFXQueue() {
  const drained = [...fxQueue];
  fxQueue.length = 0;
  return drained;
}
