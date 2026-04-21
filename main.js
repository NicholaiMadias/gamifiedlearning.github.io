/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Initializes the Match Maker, wires HUD, registers service worker.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker } from './match-maker-ui.js';
import { renderStarMap } from './star-map.js';

document.addEventListener('DOMContentLoaded', () => {
  const starMapContainer = document.getElementById('star-map-container');

  function refreshStarMap() {
    if (starMapContainer) renderStarMap(starMapContainer);
  }

  initMatchMaker(null, null);
  refreshStarMap();

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      initMatchMaker(null, null);
    });
  }

  // Refresh star map whenever a level is completed
  window.addEventListener('matchmaker-level-complete', refreshStarMap);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration skipped:', err.message));
  }

  console.log('[GLM] Gamified Learning Matrix initialized.');
});
