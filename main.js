/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Supports both V1 and V2 engines via the REACT_APP_V2_ENABLED feature flag.
 *
 * Feature flag resolution order:
 *   1. window.REACT_APP_V2_ENABLED (set at build/deploy time)
 *   2. localStorage key 'glm_v2_enabled' === 'true' (set by dev hotkey)
 *
 * Dev hotkey: Ctrl+Shift+V — toggles V2 mode and reloads the page.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker }   from './match-maker-ui.js';
import { initMatchMakerV2 } from './match-maker-ui2.js';

/** Returns true when the V2 engine should be used. */
function isV2Enabled() {
  if (typeof window !== 'undefined') {
    const v2Flag = window.REACT_APP_V2_ENABLED;
    if (v2Flag === true || v2Flag === 'true' || v2Flag === '1') return true;
  }
  try {
    return localStorage.getItem('glm_v2_enabled') === 'true';
  } catch {
    return false;
  }
}

/** Shows the V2 section and hides the V1 section (or vice-versa). */
function applyVersionLayout(v2) {
  const v1Section = document.getElementById('v1-section');
  const v2Section = document.getElementById('v2-section');
  if (v1Section) v1Section.classList.toggle('hidden', v2);
  if (v2Section) v2Section.classList.toggle('hidden', !v2);
}

document.addEventListener('DOMContentLoaded', () => {
  const v2 = isV2Enabled();
  applyVersionLayout(v2);

  if (v2) {
    initMatchMakerV2(null, null);
    const restartBtn = document.getElementById('v2-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => initMatchMakerV2(null, null));
    }
    console.log('[GLM] Nexus Arcade V2 initialised.');
  } else {
    initMatchMaker(null, null);
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => initMatchMaker(null, null));
    }
    console.log('[GLM] Gamified Learning Matrix V1 initialised.');
  }

  // Dev hotkey: Ctrl+Shift+V — toggle V2 mode and reload
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
      // Ignore when focus is inside an editable element
      const tag = document.activeElement && document.activeElement.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (document.activeElement && document.activeElement.isContentEditable);
      if (isEditable) return;
      e.preventDefault();
      try {
        const current = localStorage.getItem('glm_v2_enabled') === 'true';
        localStorage.setItem('glm_v2_enabled', String(!current));
        console.log(`[GLM] V2 mode ${!current ? 'enabled' : 'disabled'} — reloading…`);
        window.location.reload();
      } catch {
        console.warn('[GLM] Cannot toggle V2 mode: localStorage unavailable.');
      }
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration skipped:', err.message));
  }
});
