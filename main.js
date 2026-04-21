/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Initializes the Match Maker, wires HUD, registers service worker.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker } from './match-maker-ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initMatchMaker(null, null);

  const restartBtn = document.getElementById('match-restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      initMatchMaker(null, null);
    });
  }

  // Seven-Star narrative hook
  window.addEventListener('nexus-seven-star', (e) => {
    console.log('[Nexus] Seven Stars aligned — narrative trigger', e.detail);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration skipped:', err.message));
  }

  console.log('[GLM] Gamified Learning Matrix initialized.');
});
