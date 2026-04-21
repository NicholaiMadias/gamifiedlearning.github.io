/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Initializes the Match Maker, wires HUD, registers service worker.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker } from './match-maker-ui.js';

function loadGallery() {
  const container = document.getElementById('nexus-display-area');
  if (!container) return;
  container.innerHTML = `
    <div class="photo-gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
      <img src="star_crystal.PNG" class="gallery-item" alt="Crystal Star" loading="lazy" onerror="this.style.display='none'">
      <img src="star_shooting.PNG" class="gallery-item" alt="Shooting Star" loading="lazy" onerror="this.style.display='none'">
      <img src="tiles.PNG" class="gallery-item" alt="Game Tiles" loading="lazy" onerror="this.style.display='none'">
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initMatchMaker(null, null);
  loadGallery();

  const restartBtn = document.getElementById('match-restart-btn');
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
