import { initMatchMaker } from './match-maker-ui.js';
import { initGuide, markGuideActivity } from './modules/guide.js';

// Init Guide + Match Maker on load (no db/user in standalone mode)
initGuide();
initMatchMaker(null, null);

document.getElementById('match-restart-btn').addEventListener('click', () => {
  document.getElementById('match-badge-banner').classList.add('hidden');
  initMatchMaker(null, null);
  markGuideActivity();
});
