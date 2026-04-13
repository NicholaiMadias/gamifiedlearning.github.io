import { initMatchMaker } from './match-maker-ui.js';

// Init on load (no db/user in standalone mode)
initMatchMaker(null, null);

document.getElementById('match-restart-btn').addEventListener('click', () => {
  document.getElementById('match-badge-banner').classList.add('hidden');
  initMatchMaker(null, null);
});
