/**
 * domPulse2.js — V2 Lightweight DOM / CSS Tile FX
 * Handles tile pulse animations and board flash effects without canvas.
 * (c) 2026 NicholaiMadias — MIT License
 */

/** CSS class names applied transiently for each pulse category */
export const PULSE_CLASSES = {
  match:   'pulse-match',
  ley:     'pulse-ley',
  select:  'pulse-select',
  special: 'pulse-special',
  clear:   'pulse-clear',
};

/**
 * Applies a transient pulse class to one or more elements, removing it after
 * `durationMs` milliseconds.
 *
 * @param {Element|Element[]} elements
 * @param {string} pulseType  - Key from PULSE_CLASSES, or a raw class name
 * @param {number} [durationMs=400]
 */
export function pulse(elements, pulseType, durationMs = 400) {
  const cls = PULSE_CLASSES[pulseType] || pulseType;
  const els = Array.isArray(elements) ? elements : [elements];
  els.forEach(el => {
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), durationMs);
  });
}

/**
 * Briefly applies a box-shadow glow to the board container to signal a
 * major event (e.g., board clear).
 *
 * @param {Element} boardEl
 * @param {string} [color='rgba(255,255,255,0.15)']
 * @param {number} [durationMs=300]
 */
export function flashBoard(boardEl, color = 'rgba(255,255,255,0.15)', durationMs = 300) {
  if (!boardEl) return;
  const prev = boardEl.style.boxShadow;
  boardEl.style.boxShadow = `inset 0 0 60px 30px ${color}`;
  setTimeout(() => { boardEl.style.boxShadow = prev; }, durationMs);
}

/**
 * Adds a one-shot drop animation class to a gem cell element.
 * The class is removed automatically on `animationend`.
 *
 * @param {Element} el
 */
export function animateDrop(el) {
  if (!el) return;
  el.classList.add('gem-dropping');
  el.addEventListener('animationend', () => el.classList.remove('gem-dropping'), { once: true });
}
