/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Initializes the Match Maker, wires HUD, registers service worker.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker, purchaseItem } from './match-maker-ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initMatchMaker(null, null);

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      initMatchMaker(null, null);
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration skipped:', err.message));
  }

  console.log('[GLM] Gamified Learning Matrix initialized.');
});

// Wire up store buttons
['extra-moves', 'shuffle', 'place-bomb'].forEach(id => {
  const btn = document.getElementById(`store-btn-${id}`);
  if (btn) btn.addEventListener('click', () => purchaseItem(id));
});
