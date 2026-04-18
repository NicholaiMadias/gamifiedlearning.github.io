/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Initializes the Match Maker, wires HUD, registers service worker.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker } from './match-maker-ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initMatchMaker(null, null);

  // Restart button shows confirmation modal
  const restartBtn  = document.getElementById('match-restart-btn');
  const modal       = document.getElementById('confirm-modal');
  const confirmYes  = document.getElementById('confirm-yes');
  const confirmNo   = document.getElementById('confirm-no');

  function openModal() {
    if (modal) modal.classList.remove('hidden');
  }
  function closeModal() {
    if (modal) modal.classList.add('hidden');
  }

  if (restartBtn) restartBtn.addEventListener('click', openModal);
  if (confirmYes) confirmYes.addEventListener('click', () => {
    closeModal();
    initMatchMaker(null, null);
  });
  if (confirmNo) confirmNo.addEventListener('click', closeModal);
  // Close modal on backdrop click
  if (modal) modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration skipped:', err.message));
  }

  console.log('[GLM] Gamified Learning Matrix initialized.');
});
