/**
 * main.js — Bootstrap for Gamified Learning Matrix
 * Initializes the Match Maker, wires HUD, registers service worker.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { initMatchMaker } from './match-maker-ui.js';
import {
  renderArchivistDiagnostic,
  renderAssumedLine,
  renderEnvironmentPrompt,
  renderVeilVariant,
} from './veil-language.js';

const playerState = { hasSeenTheVeil: false };

const veilText = {
  codex: {
    base: 'The Archive preserves disagreement without judgment.',
    veilFragment: 'As you already know, preservation is not the same as stability.',
  },
  sage: {
    base: 'Some truths are difficult to witness.',
    veilVariant: 'Some truths do not need to be shown twice.',
  },
  archivist: {
    base: '[DIAGNOSTIC] Divergence detected. Monitoring advised.',
  },
  prompt: {
    base: 'You may proceed.',
  },
};

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

const veilToggle = document.getElementById('veil-toggle');
if (veilToggle) {
  veilToggle.addEventListener('change', event => {
    playerState.hasSeenTheVeil = event.target.checked;
    renderVeilPreview();
  });
  renderVeilPreview();
}

function renderVeilPreview() {
  const hasSeen = playerState.hasSeenTheVeil;
  const codexNode = document.getElementById('veil-codex-text');
  const sageNode = document.getElementById('veil-sage-text');
  const archivistNode = document.getElementById('veil-archivist-text');
  const promptNode = document.getElementById('veil-prompt-text');

  if (codexNode) {
    codexNode.textContent = renderAssumedLine(
      veilText.codex.base,
      veilText.codex.veilFragment,
      hasSeen
    );
  }

  if (sageNode) {
    sageNode.textContent = renderVeilVariant(veilText.sage, hasSeen);
  }

  if (archivistNode) {
    archivistNode.textContent = renderArchivistDiagnostic(
      veilText.archivist.base,
      veilText.archivist.veilFragment,
      hasSeen
    );
  }

  if (promptNode) {
    promptNode.textContent = renderEnvironmentPrompt(veilText.prompt.base, hasSeen);
  }
}
