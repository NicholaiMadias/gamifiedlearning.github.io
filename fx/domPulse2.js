/**
 * domPulse2.js — V2 Lightweight DOM / CSS Tile FX
 * (c) 2026 NicholaiMadias — MIT License
 */

export const PULSE_CLASSES = {
  match:   'pulse-match',
  ley:     'pulse-ley',
  select:  'pulse-select',
  special: 'pulse-special',
  clear:   'pulse-clear',
};

export function pulse(elements, pulseType, durationMs = 400) {
  const cls = PULSE_CLASSES[pulseType] || pulseType;
  const els = Array.isArray(elements) ? elements : [elements];
  els.forEach(el => {
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), durationMs);
  });
}

export function flashBoard(boardEl, color = 'rgba(255,255,255,0.15)', durationMs = 300) {
  if (!boardEl) return;
  const prev = boardEl.style.boxShadow;
  boardEl.style.boxShadow = `inset 0 0 60px 30px ${color}`;
  setTimeout(() => { boardEl.style.boxShadow = prev; }, durationMs);
}

export function animateDrop(el) {
  if (!el) return;
  el.classList.add('gem-dropping');
  el.addEventListener('animationend', () => el.classList.remove('gem-dropping'), { once: true });
}
