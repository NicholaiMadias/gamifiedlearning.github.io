/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Supports both V1 and V2 engines via the REACT_APP_V2_ENABLED feature flag.
 *
 * Feature flag resolution order:
 *   1. window.REACT_APP_V2_ENABLED (set at build/deploy time; must equal true, 'true', or '1')
 *   2. localStorage key 'glm_v2_enabled' === 'true' (set by dev hotkey)
 *
 * Dev hotkey: Ctrl+Shift+V — toggles V2 mode and reloads the page.
 * The hotkey is silently ignored when focus is inside an editable element.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker }              from './match-maker-ui.js';
import { loadBadges, resetBadges }     from './badges.js';
import { initMatchMakerV2 }            from './match-maker-ui2.js';
import { renderStarMap }               from './star-map.js';
import { onGameLevelComplete }         from './concordance-lens.js';

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

function setupRestartModalA11y() {
  const restartModal = document.getElementById('restart-modal-overlay') || document.getElementById('confirm-modal');
  if (!restartModal) return;

  const getFocusable = () => Array.from(
    restartModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  ).filter(el => !el.hasAttribute('disabled'));
  const cancelButton = document.getElementById('restart-confirm-no') || document.getElementById('confirm-no');
  const restartTrigger = document.getElementById('match-restart-btn') || document.getElementById('restart-btn');
  let lastFocusedEl = null;
  let wasOpen = false;

  const isOpen = () => !restartModal.classList.contains('hidden') && !restartModal.hasAttribute('hidden');
  const syncModalFocus = () => {
    if (isOpen()) {
      if (!wasOpen) {
        lastFocusedEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        wasOpen = true;
      }
      (cancelButton || getFocusable()[0])?.focus();
      return;
    }
    if (wasOpen) {
      wasOpen = false;
      (lastFocusedEl || restartTrigger)?.focus();
    }
  };

  document.addEventListener('keydown', e => {
    if (!isOpen() || e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  new MutationObserver(syncModalFocus).observe(restartModal, {
    attributes: true,
    attributeFilter: ['class', 'hidden'],
  });
  syncModalFocus();
}

document.addEventListener('DOMContentLoaded', () => {
  const v2 = isV2Enabled();
  applyVersionLayout(v2);

  const starMapContainer = document.getElementById('star-map-container');
  function refreshStarMap() {
    if (starMapContainer) renderStarMap(starMapContainer);
  }

  if (v2) {
    if (document.getElementById('v2-restart-btn') || document.getElementById('v2-section')) {
      initMatchMakerV2(null, null);
      const restartBtn = document.getElementById('v2-restart-btn');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => initMatchMakerV2(null, null));
      }
      console.log('[GLM] Nexus Arcade V2 initialised.');
    }
  } else {
    loadBadges();
    if (document.getElementById('match-grid') || document.getElementById('match-board')) {
      initMatchMaker(null, null);
    }
    refreshStarMap();

    const restartBtn = document.getElementById('match-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        resetBadges();
        initMatchMaker(null, null);
      });
    }
    setupRestartModalA11y();

    // Refresh star map whenever a level is completed
    window.addEventListener('matchmaker-level-complete', refreshStarMap);

    console.log('[GLM] Gamified Learning Matrix V1 initialised.');
  }

  // Dev hotkey: Ctrl+Shift+V — toggle V2 mode and reload.
  // Uses e.code for layout-independent key identification.
  // Silently ignored when focus is inside an editable element.
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
      const active     = document.activeElement;
      const tag        = active && active.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (active && active.isContentEditable);
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

// Relay match-maker level completions into the Concordance Lens
window.addEventListener('matchmaker-level-complete', e => {
  onGameLevelComplete(e.detail?.level ?? 1);
});
