import { initMatchMaker } from './match-maker-ui.js';
import { initConcordanceLens, onGameLevelComplete } from './concordance-lens.js';

// Init on load (no db/user in standalone mode)
initMatchMaker(null, null);
initConcordanceLens();

document.getElementById('match-restart-btn').addEventListener('click', () => {
  document.getElementById('match-badge-banner').classList.add('hidden');
  initMatchMaker(null, null);
});

// Relay match-maker level completions into the Concordance Lens
window.addEventListener('matchmaker-level-complete', e => {
  onGameLevelComplete(e.detail?.level ?? 1);
});
