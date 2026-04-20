/**
 * main.js — Bootstrap for Gamified Learning Matrix v2.0
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker } from './match-maker-ui.js';
import { loadBadges, resetBadges } from './badges.js';

document.addEventListener('DOMContentLoaded', () => {
  loadBadges();
  initMatchMaker(null, null);

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      resetBadges();
      initMatchMaker(null, null);
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration skipped:', err.message));
  }

  console.log('[GLM] Gamified Learning Matrix v2.0 initialized.');
});
