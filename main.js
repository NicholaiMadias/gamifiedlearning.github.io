import { initMatchMaker, purchaseItem } from './match-maker-ui.js';

// Init on load (no db/user in standalone mode)
initMatchMaker(null, null);

document.getElementById('match-restart-btn').addEventListener('click', () => {
  document.getElementById('match-badge-banner').classList.add('hidden');
  initMatchMaker(null, null);
});

// Wire up store buttons
['extra-moves', 'shuffle', 'place-bomb'].forEach(id => {
  const btn = document.getElementById(`store-btn-${id}`);
  if (btn) btn.addEventListener('click', () => purchaseItem(id));
});
